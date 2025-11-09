import { NextRequest, NextResponse } from 'next/server';

export interface MediaInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
  }>;
  title: string;
  description: string;
  id: string;
}

export interface MediaInsightsResponse {
  data: MediaInsight[];
}

export interface ProcessedInsights {
  likes: number | null;
  comments: number | null;
  saved: number | null;
  plays: number | null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await context.params;
    const metaToken = process.env.META_TOKEN;

    if (!metaToken) {
      return NextResponse.json(
        { error: 'META_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v24.0/${mediaId}/insights?metric=likes,comments,saved,plays&access_token=${metaToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 }
        );
      }
      
      const errorText = await response.text();
      console.error('Meta Graph API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch media insights' },
        { status: response.status }
      );
    }

    const data: MediaInsightsResponse = await response.json();
    
    // Process insights data and handle missing metrics
    const processedInsights: ProcessedInsights = {
      likes: null,
      comments: null,
      saved: null,
      plays: null,
    };

    data.data?.forEach((insight) => {
      const value = insight.values?.[0]?.value ?? null;
      
      switch (insight.name) {
        case 'likes':
          processedInsights.likes = value;
          break;
        case 'comments':
          processedInsights.comments = value;
          break;
        case 'saved':
          processedInsights.saved = value;
          break;
        case 'plays':
          processedInsights.plays = value;
          break;
      }
    });

    return NextResponse.json({
      mediaId,
      insights: processedInsights,
      raw: data,
    });

  } catch (error) {
    console.error('Error fetching media insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
