import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Content from '@/models/Content';
import SocialAccount from '@/models/SocialAccount';

async function createContainer(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
  const response = await fetch(`https://graph.instagram.com/v21.0/me/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption
    })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return json; // { id: creation_id }
}

async function getContainerStatus(creationId: string, accessToken: string) {
  const response = await fetch(`https://graph.instagram.com/v21.0/${creationId}?fields=status_code`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return json.status_code as string; // IN_PROGRESS | FINISHED | ERROR
}

async function publishContainer(igUserId: string, accessToken: string, creationId: string) {
  const response = await fetch(`https://graph.instagram.com/v21.0/me/media_publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creation_id: creationId
    })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json));
  return json; // { id: media_id }
}

export async function POST(req: Request) {
  const { contentId } = await req.json();
  if (!contentId) return NextResponse.json({ error: 'contentId required' }, { status: 400 });

  await dbConnect();
  const content = await Content.findById(contentId);
  if (!content) return NextResponse.json({ error: 'content not found' }, { status: 404 });

  // find the connected IG account for this user
  const acct = await SocialAccount.findOne({ provider: 'instagram' }).sort({ updatedAt: -1 });
  if (!acct) return NextResponse.json({ error: 'no connected IG account' }, { status: 400 });

  try {
    // step 1: container
    const c = await createContainer(acct.providerUserId!, acct.accessToken!, content.mediaUrl!, content.caption || '');
    content.remote = { ...(content.remote||{}), igUserId: acct.providerUserId, creationId: c.id };
    content.status = 'publishing';
    await content.save();

    // step 2: poll status (simple loop — keep under 3s for serverless)
    let status = 'IN_PROGRESS';
    const start = Date.now();
    while (status === 'IN_PROGRESS' && Date.now() - start < 2500) {
      await new Promise(r => setTimeout(r, 600));
      status = await getContainerStatus(c.id, acct.accessToken!);
    }
    if (status !== 'FINISHED') throw new Error(`container not ready: ${status}`);

    // step 3: publish
    const pub = await publishContainer(acct.providerUserId!, acct.accessToken!, c.id);
    content.remote.mediaId = pub.id;

    // optional: fetch permalink
    const linkRes = await fetch(`https://graph.instagram.com/v21.0/${pub.id}?fields=permalink`, {
      headers: {
        'Authorization': `Bearer ${acct.accessToken}`
      }
    });
    const linkJson = await linkRes.json();
    content.remote.permalink = linkJson.permalink;

    content.status = 'published';
    await content.save();

    return NextResponse.json({ ok: true, permalink: content.remote.permalink });
  } catch (e: any) {
    content.status = 'failed';
    content.publishError = String(e.message || e);
    await content.save();
    return NextResponse.json({ ok: false, error: content.publishError }, { status: 400 });
  }
}
