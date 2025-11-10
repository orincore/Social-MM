import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Trigger the scheduled processing cron job
    const cronResponse = await fetch(`${baseUrl}/api/cron/process-scheduled`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentTime: new Date().toISOString(),
        source: 'manual-test'
      })
    });

    const cronResult = await cronResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Cron job triggered manually',
      cronResponse: cronResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test cron error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
