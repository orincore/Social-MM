// Cloudflare Worker for processing scheduled posts
// This worker runs every minute to check for posts that need to be published

export default {
  async scheduled(event, env, ctx) {
    console.log('Scheduled publisher worker triggered at:', new Date().toISOString());
    
    try {
      // Get the current time
      const now = new Date();
      const currentTime = now.toISOString();
      
      // Call the Next.js API to process scheduled posts
      const response = await fetch(`${env.NEXTJS_APP_URL}/api/cron/process-scheduled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CRON_SECRET}`, // Secret to authenticate cron requests
        },
        body: JSON.stringify({
          currentTime,
          source: 'cloudflare-worker'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Scheduled posts processing result:', result);

      // Also poll Instagram posts that are processing
      try {
        const instagramPollResponse = await fetch(`${env.NEXTJS_APP_URL}/api/cron/poll-instagram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            currentTime,
            source: 'cloudflare-worker'
          })
        });

        if (instagramPollResponse.ok) {
          const pollResult = await instagramPollResponse.json();
          console.log('Instagram polling result:', pollResult);
        } else {
          console.error('Instagram polling failed with status:', instagramPollResponse.status);
          const errorText = await instagramPollResponse.text();
          console.error('Instagram polling error:', errorText);
        }
      } catch (pollError) {
        console.error('Instagram polling failed:', pollError);
      }

      // Refresh Instagram tokens (run once per hour - every 60th minute)
      const currentMinute = now.getMinutes();
      if (currentMinute === 0) { // Run at the top of every hour
        try {
          console.log('Running hourly Instagram token refresh...');
          const tokenRefreshResponse = await fetch(`${env.NEXTJS_APP_URL}/api/cron/refresh-instagram-tokens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              currentTime,
              source: 'cloudflare-worker'
            })
          });

          if (tokenRefreshResponse.ok) {
            const refreshResult = await tokenRefreshResponse.json();
            console.log('Instagram token refresh result:', refreshResult);
          } else {
            console.error('Instagram token refresh failed with status:', tokenRefreshResponse.status);
            const errorText = await tokenRefreshResponse.text();
            console.error('Instagram token refresh error:', errorText);
          }
        } catch (refreshError) {
          console.error('Instagram token refresh failed:', refreshError);
        }
      }

      // If there are posts to process, also trigger the Upstash queue processing
      if (result.processedCount > 0 && env.UPSTASH_QUEUE_URL) {
        try {
          const queueResponse = await fetch(`${env.NEXTJS_APP_URL}/api/cron/process-queue`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              currentTime,
              source: 'cloudflare-worker'
            })
          });

          if (queueResponse.ok) {
            const queueResult = await queueResponse.json();
            console.log('Queue processing result:', queueResult);
          }
        } catch (queueError) {
          console.error('Queue processing error:', queueError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        processedAt: currentTime,
        processedCount: result.processedCount || 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Scheduled publisher worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async fetch(request, env, ctx) {
    // Handle manual trigger requests
    if (request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Manually trigger the scheduled function
      return await this.scheduled(null, env, ctx);
    }

    // Return worker status for GET requests
    return new Response(JSON.stringify({
      worker: 'scheduled-publisher',
      status: 'active',
      timestamp: new Date().toISOString(),
      endpoints: {
        manual_trigger: 'POST /',
        status: 'GET /'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Cron schedule: every minute
// Add this to your wrangler.toml:
/*
[triggers]
crons = ["* * * * *"]

[vars]
NEXTJS_APP_URL = "https://your-app.vercel.app"
CRON_SECRET = "your-secure-cron-secret"
UPSTASH_QUEUE_URL = "your-upstash-queue-url"
*/
