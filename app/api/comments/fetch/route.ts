import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import User, { type UserDoc } from '@/models/User';
import { YouTubeAPI } from '@/lib/youtube-api';
import Content, { type ContentDoc } from '@/models/Content';
import CommentAnalysis from '@/models/CommentAnalysis';
import { classifyComments, generateCommentSummary } from '@/lib/comment-classifier';
import type { HydratedDocument } from 'mongoose';

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v18.0';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

const COMMENT_TTL_MINUTES: Record<string, number> = {
  '24h': 30,
  '7d': 60,
  '28d': 120,
  '1y': 240,
  '5y': 480,
};

const COMMENT_STALE_MINUTES: Record<string, number> = {
  '24h': 15,
  '7d': 30,
  '28d': 60,
  '1y': 120,
  '5y': 240,
};

interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  like_count?: number;
}

async function gatherYoutubeChannelComments(
  youtubeAccount: UserDoc['youtube'],
  cutoffTime: Date,
  skipVideoIds: Set<string>
): Promise<CommentPayload[]> {
  console.log('[YouTube Comments] Starting channel comment gathering...', {
    hasAccessToken: !!youtubeAccount?.accessToken,
    hasChannelId: !!youtubeAccount?.channelId,
    channelId: youtubeAccount?.channelId,
    cutoffTime: cutoffTime.toISOString(),
    skipVideoCount: skipVideoIds.size,
  });

  if (!youtubeAccount?.accessToken) {
    console.warn('[YouTube Comments] No access token available');
    return [];
  }

  if (!youtubeAccount.channelId) {
    console.warn('[YouTube Comments] Missing channelId on account. Skipping channel scan.');
    return [];
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'id');
  searchUrl.searchParams.set('channelId', youtubeAccount.channelId);
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('maxResults', '25');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('access_token', youtubeAccount.accessToken);

  const response = await fetch(searchUrl.toString());
  if (!response.ok) {
    const errorBody = await safeJson(response);
    console.error('[YouTube Comments] Failed to list channel videos', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });
    return [];
  }

  const data: { items?: { id?: { videoId?: string } }[] } = await response.json();
  console.log('[YouTube Comments] Channel video search response:', {
    totalItems: data.items?.length || 0,
    videoIds: data.items?.map(i => i.id?.videoId).filter(Boolean),
  });

  const recentVideoIds = (data.items || [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => !!id && !skipVideoIds.has(id))
    .slice(0, 10);

  console.log('[YouTube Comments] Filtered video IDs to process:', {
    count: recentVideoIds.length,
    videoIds: recentVideoIds,
  });

  if (recentVideoIds.length === 0) {
    console.warn('[YouTube Comments] No new videos to process after filtering');
    return [];
  }

  const channelComments: CommentPayload[] = [];
  for (const videoId of recentVideoIds) {
    try {
      const youtubeComments = await fetchYouTubeComments(videoId, youtubeAccount.accessToken);
      console.log(`[YouTube Comments] Fetched ${youtubeComments.length} comments for video ${videoId}`);
      
      let filteredCount = 0;
      for (const comment of youtubeComments) {
        const timestamp = new Date(comment.snippet.publishedAt);
        if (timestamp < cutoffTime) continue;
        filteredCount++;

        channelComments.push({
          id: comment.id,
          text: comment.snippet.textDisplay,
          author: comment.snippet.authorDisplayName,
          timestamp: comment.snippet.publishedAt,
          platform: 'youtube',
          contentId: `youtube:${videoId}`,
          contentTitle: 'YouTube video',
          contentUrl: `https://youtube.com/watch?v=${videoId}`,
        });
      }
      console.log(`[YouTube Comments] Added ${filteredCount} comments after cutoff filter for video ${videoId}`);
    } catch (error) {
      console.error('[YouTube Comments] Failed to fetch comments for channel video', {
        videoId,
        error,
      });
    }
  }

  console.log('[YouTube Comments] Total channel comments gathered:', channelComments.length);
  return channelComments;
}

interface YouTubeComment {
  id: string;
  snippet: {
    textDisplay: string;
    authorDisplayName: string;
    publishedAt: string;
    likeCount: number;
  };
}

interface YouTubeCommentThread {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: YouTubeComment['snippet'];
    };
  };
}

interface UserInstagramAccount {
  connected?: boolean;
  accessToken?: string;
  instagramId?: string;
}

type CommentPayload = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  platform: string;
  contentId: string;
  contentTitle: string;
  contentUrl?: string;
};

type ClassifiedCommentPayload = CommentPayload & {
  category: 'positive' | 'neutral' | 'negative' | 'hateful' | 'violent' | 'spam';
  sentiment: number;
  toxicity: number;
  reasoning?: string;
};

type ContentDocument = HydratedDocument<ContentDoc> & {
  platformPostId?: string;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const platform = searchParams.get('platform') || 'all';
    const refreshRequested = searchParams.get('refresh') === 'true';
    console.log('[Comments API] Incoming request', { timeRange, platform, refreshRequested });

    const timeRangeMap: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '28d': 28 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      '5y': 5 * 365 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = new Date(Date.now() - (timeRangeMap[timeRange] || timeRangeMap['24h']));

    const cacheFilter = {
      userId: user._id,
      platform,
      timeRange,
    };

    if (!refreshRequested) {
      const cachedAnalysis = await CommentAnalysis.findOne(cacheFilter);
      if (cachedAnalysis) {
        const refreshedAt = cachedAnalysis.refreshedAt || cachedAnalysis.updatedAt || new Date();
        const staleMinutes = COMMENT_STALE_MINUTES[timeRange] ?? 30;
        const isStale = Date.now() - refreshedAt.getTime() > staleMinutes * 60 * 1000;

        return NextResponse.json({
          success: true,
          comments: cachedAnalysis.comments || [],
          summary: cachedAnalysis.summary || null,
          refreshedAt,
          fromCache: true,
          isStale,
          needsRefresh: false,
        });
      }

      return NextResponse.json({
        success: true,
        comments: [],
        summary: null,
        refreshedAt: null,
        fromCache: true,
        isStale: true,
        needsRefresh: true,
        message: 'No cached comment analysis found. Please refresh to fetch the latest comments.',
      });
    }

    const query: Record<string, unknown> = {
      userId: user._id,
      status: 'published',
      createdAt: { $gte: cutoffTime },
    };

    if (platform !== 'all') {
      query.platform = platform;
    }

    const contents = (await Content.find(query).sort({ createdAt: -1 }).limit(50)) as ContentDocument[];
    console.log('[Comments API] Loaded contents for user', {
      count: contents.length,
      platforms: contents.map((c) => c.platform),
    });

    const allComments: CommentPayload[] = [];
    const processedYouTubeVideoIds = new Set<string>();

    if (platform !== 'youtube') {
      const instagramContents = contents
        .filter((content) => content.platform === 'instagram')
        .map((content) => content as ContentDocument);
      if (instagramContents.length > 0) {
        const instagramComments = await gatherInstagramComments(
          user.instagram as UserInstagramAccount | undefined,
          instagramContents,
          cutoffTime
        );
        allComments.push(...instagramComments);
      }
    }

    let youtubeAccessToken = user.youtube?.accessToken;
    if (youtubeAccessToken && user.youtube?.tokenExpiresAt && new Date() > user.youtube.tokenExpiresAt) {
      try {
        const refreshed = await YouTubeAPI.refreshToken(user.youtube.refreshToken!);
        youtubeAccessToken = refreshed.access_token;
        user.youtube.accessToken = youtubeAccessToken;
        user.youtube.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
        await user.save();
        console.log('[YouTube Comments] Access token refreshed');
      } catch (error) {
        console.error('[YouTube Comments] Failed to refresh access token', error);
        youtubeAccessToken = undefined;
      }
    }

    const hasYoutubeAccess = !!youtubeAccessToken;
    if (platform !== 'instagram' && hasYoutubeAccess) {
      for (const content of contents) {
        if (content.platform === 'youtube') {
          console.log('[YouTube Comments] Processing stored content item', {
            contentId: content._id.toString(),
            remoteVideoId: content.remote?.youtubeVideoId,
            platformPostId: content.platformPostId,
          });
          if (!youtubeAccessToken) {
            console.warn('Skipping YouTube content due to missing access token.', {
              contentId: content._id.toString(),
            });
            continue;
          }
          const youtubeVideoId = content.remote?.youtubeVideoId || content.platformPostId;
          if (!youtubeVideoId) {
            console.warn('Skipping YouTube content without video id', content._id.toString());
          } else {
            processedYouTubeVideoIds.add(youtubeVideoId);
            try {
              const youtubeComments = await fetchYouTubeComments(
                youtubeVideoId,
                youtubeAccessToken
              );
            
              for (const comment of youtubeComments) {
                allComments.push({
                  id: comment.id,
                  text: comment.snippet.textDisplay,
                  author: comment.snippet.authorDisplayName,
                  timestamp: comment.snippet.publishedAt,
                  platform: 'youtube',
                  contentId: content._id.toString(),
                  contentTitle: content.title || 'Untitled',
                  contentUrl: content.remote?.youtubeUrl || `https://youtube.com/watch?v=${youtubeVideoId}`,
                });
              }
            } catch (error) {
              console.error('Failed to fetch YouTube comments:', error);
            }
          }
        }
      }

      if (hasYoutubeAccess && user.youtube) {
        try {
          const youtubeChannelComments = await gatherYoutubeChannelComments(
            { ...user.youtube, accessToken: youtubeAccessToken },
            cutoffTime,
            processedYouTubeVideoIds
          );
          console.log('[YouTube Comments] Channel fallback returned count', youtubeChannelComments.length);
          allComments.push(...youtubeChannelComments);
        } catch (error: any) {
          if (error?.message?.includes('YOUTUBE_SCOPE_ERROR')) {
            console.error('[YouTube Comments] Scope error detected:', error.message);
          } else {
            console.error('[YouTube Comments] Channel fallback error:', error);
          }
        }
      }
    }
    if (platform !== 'instagram' && !hasYoutubeAccess) {
      console.warn('[YouTube Comments] Skipping YouTube fetch due to missing access token');
    }

    const sortedComments = allComments.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const limitedComments = sortedComments.slice(0, 150);

    if (limitedComments.length === 0) {
      const emptySummary = await generateCommentSummary([]);
      const refreshedAt = new Date();
      await CommentAnalysis.findOneAndUpdate(
        cacheFilter,
        {
          userId: user._id,
          platform,
          timeRange,
          comments: [],
          summary: emptySummary,
          refreshedAt,
          expiresAt: new Date(Date.now() + (COMMENT_TTL_MINUTES[timeRange] || 60) * 60 * 1000),
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        comments: [],
        summary: emptySummary,
        refreshedAt,
        fromCache: false,
        isStale: false,
      });
    }

    console.log(`[Comments API] Starting classification for ${limitedComments.length} comments...`);
    const classifiedComments: ClassifiedCommentPayload[] = [];
    const CHUNK_SIZE = 50;

    for (let i = 0; i < limitedComments.length; i += CHUNK_SIZE) {
      const chunk = limitedComments.slice(i, i + CHUNK_SIZE);
      console.log(`[Comments API] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(limitedComments.length / CHUNK_SIZE)}`);

      let chunkResults: Awaited<ReturnType<typeof classifyComments>> = [];
      try {
        chunkResults = await classifyComments(
          chunk.map((comment) => ({
            id: comment.id,
            text: comment.text,
            author: comment.author,
            timestamp: comment.timestamp,
          }))
        );
      } catch (error) {
        console.error(`[Comments API] Chunk ${i / CHUNK_SIZE + 1} classification failed`, error);
      }

      for (const comment of chunk) {
        const classification = chunkResults.find((result) => result.id === comment.id);
        classifiedComments.push({
          ...comment,
          category: classification?.category || 'neutral',
          sentiment: classification?.sentiment ?? 0,
          toxicity: classification?.toxicity ?? 0,
          reasoning: classification?.reasoning,
        });
      }

      const partialRefreshedAt = new Date();
      const partialExpiresAt = new Date(Date.now() + (COMMENT_TTL_MINUTES[timeRange] || 60) * 60 * 1000);

      await CommentAnalysis.findOneAndUpdate(
        cacheFilter,
        {
          userId: user._id,
          platform,
          timeRange,
          comments: classifiedComments,
          summary: null,
          refreshedAt: partialRefreshedAt,
          expiresAt: partialExpiresAt,
        },
        { upsert: true }
      );
      console.log(`[Comments API] Saved ${classifiedComments.length} classified comments to cache`);
    }

    console.log('[Comments API] Generating summary...');
    const summary = await generateCommentSummary(
      classifiedComments.map((comment) => ({
        text: comment.text,
        category: comment.category,
        sentiment: comment.sentiment,
        toxicity: comment.toxicity,
        reasoning: comment.reasoning || '',
      }))
    );

    const refreshedAt = new Date();
    const expiresAt = new Date(Date.now() + (COMMENT_TTL_MINUTES[timeRange] || 60) * 60 * 1000);

    await CommentAnalysis.findOneAndUpdate(
      cacheFilter,
      {
        userId: user._id,
        platform,
        timeRange,
        comments: classifiedComments,
        summary,
        refreshedAt,
        expiresAt,
      },
      { upsert: true }
    );
    console.log('[Comments API] Final save complete with summary');

    return NextResponse.json({
      success: true,
      comments: classifiedComments,
      summary,
      refreshedAt,
      fromCache: false,
      isStale: false,
      totalContents: contents.length,
      truncated: allComments.length > limitedComments.length,
    });
  } catch (error) {
    console.error('Comment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

async function fetchYouTubeComments(
  videoId: string,
  accessToken: string
): Promise<YouTubeComment[]> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&access_token=${accessToken}`
  );

  if (!response.ok) {
    const errorBody = await safeJson(response);
    
    if (response.status === 403 && errorBody?.error?.message?.includes('insufficient authentication scopes')) {
      console.error('[YouTube Comments] Token lacks required scopes. User must reconnect YouTube account.', {
        videoId,
        requiredScopes: ['youtube.readonly', 'youtube.force-ssl'],
      });
      throw new Error('YOUTUBE_SCOPE_ERROR: Please disconnect and reconnect your YouTube account in Profile settings to enable comment access.');
    }
    
    console.error('YouTube comments API error', {
      videoId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });
    return [];
  }

  const data: { items?: YouTubeCommentThread[] } = await response.json();
  return (data.items || []).map((item) => ({
    id: item.id,
    snippet: item.snippet.topLevelComment.snippet,
  }));
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return { error: 'Failed to parse error response' };
  }
}

interface InstagramMediaWithComments {
  id: string;
  caption?: string;
  media_type?: string;
  timestamp: string;
  permalink?: string;
}

interface InstagramMediaResponse {
  data?: InstagramMediaWithComments[];
  paging?: {
    next?: string;
  };
}

interface InstagramBusinessContext {
  igBusinessId: string;
  token: string;
}

async function gatherInstagramComments(
  instagramAccount: UserInstagramAccount | undefined,
  contents: ContentDocument[],
  cutoffTime: Date
): Promise<CommentPayload[]> {
  console.log('[Instagram Comments] Starting fetch...', {
    connected: instagramAccount?.connected,
    hasToken: !!instagramAccount?.accessToken,
    instagramId: instagramAccount?.instagramId,
    contentCount: contents.length,
    cutoffTime: cutoffTime.toISOString(),
  });

  if (!instagramAccount?.connected || !instagramAccount.accessToken) {
    console.warn('[Instagram Comments] Account not connected or missing token');
    return [];
  }

  const businessContext = await resolveInstagramBusinessContext(instagramAccount);

  if (!businessContext) {
    console.warn('[Instagram Comments] Unable to resolve Instagram business context for user.');
    return [];
  }

  console.log('[Instagram Comments] Business context resolved:', {
    igBusinessId: businessContext.igBusinessId,
    hasToken: !!businessContext.token,
  });

  const mediaList = await fetchInstagramMediaList(
    businessContext.igBusinessId,
    businessContext.token,
    cutoffTime
  );

  console.log('[Instagram Comments] Media list fetched:', {
    mediaCount: mediaList.length,
    mediaIds: mediaList.map(m => m.id),
  });

  if (mediaList.length === 0) {
    console.warn('[Instagram Comments] No media found in time range');
    return [];
  }

  const mediaWithComments: Array<{ media: InstagramMediaWithComments; comments: InstagramComment[] }> = [];
  let processedMediaCount = 0;
  for (const media of mediaList) {
    if (processedMediaCount >= 20) {
      console.log('[Instagram Comments] Reached media processing cap (20).');
      break;
    }

    try {
      const comments = await fetchInstagramMediaComments(media.id, businessContext.token);
      console.log(`[Instagram Comments] Fetched ${comments.length} comments for media ${media.id}`);
      if (comments.length > 0) {
        mediaWithComments.push({ media, comments });
      }
      processedMediaCount += 1;
    } catch (error) {
      console.error('[Instagram Comments] Failed to fetch comments for media:', {
        mediaId: media.id,
        error,
      });
    }
  }

  console.log('[Instagram Comments] Total media with comments:', mediaWithComments.length);

  if (mediaWithComments.length === 0) {
    console.warn('[Instagram Comments] No comments found on any media');
    return [];
  }

  const contentIndex = new Map<string, ContentDocument>();
  console.log('[Instagram Comments] Building content index from stored posts...');
  for (const content of contents) {
    const possibleKeys = [
      content.remote?.mediaId,
      getPlatformPostId(content),
      content.remote?.creationId,
      content.remote?.permalink,
      content.mediaUrl,
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    console.log(`[Instagram Comments] Content ${getContentId(content)} has keys:`, possibleKeys);
    possibleKeys.forEach((key) => contentIndex.set(key, content));
  }
  console.log('[Instagram Comments] Content index size:', contentIndex.size);

  const mappedComments: CommentPayload[] = [];
  for (const item of mediaWithComments) {
    const matchedContent =
      contentIndex.get(item.media.id) ||
      (item.media.permalink ? contentIndex.get(item.media.permalink) : undefined);

    if (!matchedContent) {
      console.warn('[Instagram Comments] Media not matched to stored content:', {
        mediaId: item.media.id,
        permalink: item.media.permalink,
        availableKeys: Array.from(contentIndex.keys()),
      });

      const fallbackTitle = item.media.caption?.substring(0, 80) || 'Instagram post';
      const fallbackContentId = `instagram:${item.media.id}`;
      const fallbackUrl = item.media.permalink;

      const fallbackPayloads = item.comments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        author: comment.username,
        timestamp: comment.timestamp,
        platform: 'instagram',
        contentId: fallbackContentId,
        contentTitle: fallbackTitle,
        contentUrl: fallbackUrl,
      }));

      console.log(
        `[Instagram Comments] Using fallback mapping for media ${item.media.id} with ${fallbackPayloads.length} comments`
      );
      mappedComments.push(...fallbackPayloads);
      continue;
    }

    console.log(`[Instagram Comments] Matched media ${item.media.id} to content ${getContentId(matchedContent)}`);

    const commentPayloads = item.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      author: comment.username,
      timestamp: comment.timestamp,
      platform: 'instagram',
      contentId: getContentId(matchedContent),
      contentTitle: matchedContent.title || matchedContent.caption?.substring(0, 50) || 'Untitled',
      contentUrl: matchedContent.mediaUrl || item.media.permalink,
    }));
    
    console.log(`[Instagram Comments] Mapped ${commentPayloads.length} comments from media ${item.media.id}`);
    mappedComments.push(...commentPayloads);
  }

  console.log('[Instagram Comments] Total mapped comments:', mappedComments.length);

  const filteredComments = mappedComments.filter((comment) => {
    const ts = new Date(comment.timestamp);
    return ts >= cutoffTime;
  });

  console.log('[Instagram Comments] Comments after cutoff filter:', filteredComments.length);
  return filteredComments;
}

function getContentId(content: ContentDocument): string {
  const rawId = content._id ?? content.id;
  if (!rawId) return '';
  if (typeof rawId === 'string') return rawId;
  return rawId.toString();
}

function getPlatformPostId(content: ContentDocument): string | undefined {
  if (content.platformPostId) return content.platformPostId;
  const remoteId = content.remote?.creationId || content.remote?.mediaId;
  return remoteId || undefined;
}

async function resolveInstagramBusinessContext(
  instagramAccount: UserInstagramAccount | undefined
): Promise<InstagramBusinessContext | null> {
  if (!instagramAccount?.accessToken) {
    console.warn('[Instagram Context] No access token provided');
    return null;
  }

  console.log('[Instagram Context] Resolving business context...', {
    hasStoredId: !!instagramAccount.instagramId,
  });

  const igId =
    instagramAccount.instagramId || (await fetchInstagramUserIdFromToken(instagramAccount.accessToken));
  if (!igId) {
    console.warn('[Instagram Context] Unable to determine Instagram business account ID from token.');
    return null;
  }

  console.log('[Instagram Context] Resolved IG Business ID:', igId);
  return {
    igBusinessId: igId,
    token: instagramAccount.accessToken,
  };
}

async function fetchInstagramUserIdFromToken(accessToken: string): Promise<string | null> {
  const response = await fetch(`${INSTAGRAM_API_BASE}/me?fields=id&access_token=${accessToken}`);
  if (!response.ok) {
    const errorBody = await safeJson(response);
    console.error('Failed to fetch Instagram user id from token', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });
    return null;
  }

  const data: { id?: string } = await response.json();
  return data.id || null;
}

async function fetchInstagramMediaList(
  instagramBusinessId: string,
  accessToken: string,
  cutoff: Date
): Promise<InstagramMediaWithComments[]> {
  console.log('[Instagram Media] Fetching media list...', {
    igBusinessId: instagramBusinessId,
    cutoff: cutoff.toISOString(),
    sinceSec: Math.floor(cutoff.getTime() / 1000),
  });

  const baseUrl = new URL(`${INSTAGRAM_API_BASE}/${instagramBusinessId}/media`);
  baseUrl.searchParams.set('fields', 'id,caption,media_type,permalink,timestamp');
  baseUrl.searchParams.set('limit', '100');
  baseUrl.searchParams.set('access_token', accessToken);

  const media: InstagramMediaWithComments[] = [];
  let nextUrl: string | undefined = baseUrl.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      const errorBody = await safeJson(response);
      console.error('[Instagram Media] Feed error:', {
        instagramBusinessId,
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      break;
    }

    const data: InstagramMediaResponse = await response.json();
    console.log('[Instagram Media] Received batch:', {
      totalInBatch: data.data?.length || 0,
      hasNextPage: !!data.paging?.next,
    });

    const batch: InstagramMediaWithComments[] = data.data || [];

    media.push(...batch);

    if (!data.paging?.next || media.length >= 200) {
      break;
    }

    nextUrl = data.paging.next;
  }

  console.log('[Instagram Media] Total media fetched:', media.length);
  return media;
}

async function fetchInstagramMediaComments(
  mediaId: string,
  accessToken: string
): Promise<InstagramComment[]> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${mediaId}/comments?fields=id,text,username,timestamp,like_count&access_token=${accessToken}`
  );

  if (!response.ok) {
    const errorBody = await safeJson(response);
    console.error('Failed to fetch Instagram media comments', {
      mediaId,
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });
    return [];
  }

  const data: { data?: InstagramComment[] } = await response.json();
  return data.data || [];
}
