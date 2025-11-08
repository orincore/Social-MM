import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import SocialAccount from '@/models/SocialAccount';

export async function POST(req: Request) {
  try {
    const { message, recipientId } = await req.json();
    
    if (!message || !recipientId) {
      return NextResponse.json({ error: 'message and recipientId required' }, { status: 400 });
    }

    await dbConnect();
    
    // Get the connected Instagram account
    const account = await SocialAccount.findOne({ provider: 'instagram' }).sort({ updatedAt: -1 });
    if (!account) {
      return NextResponse.json({ error: 'No connected Instagram account' }, { status: 400 });
    }

    // Send message using Instagram Graph API v21.0
    const messageData = {
      message: JSON.stringify({ text: message }),
      recipient: JSON.stringify({ id: recipientId })
    };

    const response = await fetch('https://graph.instagram.com/v21.0/me/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    console.log('Instagram message response:', result);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to send message', details: result }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.message_id, data: result });
    
  } catch (error) {
    console.error('Instagram message error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
