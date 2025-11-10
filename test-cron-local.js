#!/usr/bin/env node

/**
 * Local Cron Job Simulator
 * 
 * This script simulates the Cloudflare Worker cron job locally
 * Run this to test scheduled publishing without deploying to Cloudflare
 * 
 * Usage:
 *   node test-cron-local.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "cron:test": "node test-cron-local.js"
 *   }
 */

const CRON_SECRET = process.env.CRON_SECRET || '01e84e0ee6e9e1f01c1b48db28d848839330402e84b5bb7b2469f6706bcec4ca';
const API_URL = process.env.NEXTJS_URL || 'http://localhost:3000';

async function runCronJob() {
  console.log('\n🕐 Running scheduled publisher cron job...');
  console.log('Time:', new Date().toISOString());
  console.log('API URL:', API_URL);
  
  try {
    // Call the process-scheduled endpoint
    const response = await fetch(`${API_URL}/api/cron/process-scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({
        currentTime: new Date().toISOString(),
        source: 'local-test-script'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success:', result);

    // If posts were processed, also trigger queue processing
    if (result.processedCount > 0) {
      console.log('\n📤 Triggering queue processing...');
      
      const queueResponse = await fetch(`${API_URL}/api/cron/process-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({
          currentTime: new Date().toISOString(),
          source: 'local-test-script'
        })
      });

      if (queueResponse.ok) {
        const queueResult = await queueResponse.json();
        console.log('✅ Queue processed:', queueResult);
      } else {
        console.error('❌ Queue processing failed:', queueResponse.status);
      }
    }

  } catch (error) {
    console.error('❌ Cron job failed:', error.message);
  }
}

// Run immediately
runCronJob();

// Optional: Run every minute (uncomment to enable)
// setInterval(runCronJob, 60000);
