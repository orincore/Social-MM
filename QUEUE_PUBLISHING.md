# Queue-Based Publishing System

## Why Queue-Based?

### The Problem
Instagram and YouTube video processing can take 30-60+ seconds, but Vercel serverless functions have a **30-second timeout limit**. Synchronous publishing causes:

```
Vercel Runtime Timeout Error: Task timed out after 30 seconds
```

### The Solution
All publishing (both "Publish Now" and "Schedule Later") uses a **queue-based system**:

1. User creates content → Saved to MongoDB as `scheduled`
2. Cloudflare Cron Job runs every minute → Checks for due content
3. Cron triggers publish via Upstash Queue → Publishes to platform
4. Status updated in MongoDB → `published` or `failed`

---

## How It Works

### 1. Create Content (Frontend)
```typescript
// app/dashboard/content/create/page.tsx

const contentData = {
  platform: 'instagram',
  mediaUrl: 'https://r2.orincore.com/videos/...',
  scheduledAt: scheduleType === 'now' 
    ? new Date(Date.now() + 10000) // 10 seconds from now
    : new Date(`${scheduledDate}T${scheduledTime}`),
  status: 'scheduled' // Always scheduled, never 'publishing'
};
```

**Key Points:**
- "Publish Now" = scheduled for 10 seconds from now
- "Schedule Later" = scheduled for user-selected time
- Status is always `scheduled`, never `publishing`

### 2. Save to Database (API)
```typescript
// app/api/content/route.ts

// Create content record
const content = new Content({ ...contentData, userId, status: 'scheduled' });
await content.save();

// Create publish job
const publishJob = new PublishJob({
  userId,
  contentId: content._id,
  platform,
  scheduledAt: new Date(scheduledAt),
  status: 'pending'
});
await publishJob.save();
```

**No synchronous publishing** - just saves to DB and returns immediately.

### 3. Cron Job Processes Queue
```javascript
// cloudflare-worker/scheduled-publisher.js

// Runs every minute
async function processScheduledContent() {
  // Find content where scheduledAt <= now AND status = 'scheduled'
  const dueContent = await Content.find({
    scheduledAt: { $lte: new Date() },
    status: 'scheduled'
  });

  // Queue each for publishing
  for (const content of dueContent) {
    await queuePublish(content);
  }
}
```

### 4. Upstash Queue Publishes
```javascript
// Queue worker calls /api/{platform}/publish
await fetch(`${apiUrl}/api/instagram/publish`, {
  method: 'POST',
  body: JSON.stringify({
    contentId: content._id,
    caption: content.caption,
    mediaUrl: content.mediaUrl
  })
});
```

**This runs outside Vercel** - no timeout limits!

---

## Benefits

### ✅ No Timeouts
- Vercel functions return in <1s
- Actual publishing happens in background
- Can take as long as needed

### ✅ Retry Logic
- Failed publishes can be retried
- Queue handles transient errors
- Better reliability

### ✅ Scalability
- Can handle many simultaneous publishes
- Queue processes them sequentially
- No rate limit issues

### ✅ User Experience
- Instant feedback ("Queued for publishing!")
- No waiting for Instagram processing
- Can create multiple posts quickly

---

## Timeline Example

**User clicks "Publish Now" at 10:00:00**

| Time | Event |
|------|-------|
| 10:00:00 | User submits form |
| 10:00:01 | Content saved to DB with `scheduledAt: 10:00:10` |
| 10:00:01 | User sees "Queued for publishing!" |
| 10:00:01 | User redirected to dashboard |
| 10:01:00 | Cron job runs, finds due content |
| 10:01:01 | Queues publish job to Upstash |
| 10:01:02 | Upstash worker calls `/api/instagram/publish` |
| 10:01:03 | Creates Instagram media container |
| 10:01:05 | Polls Instagram for processing status |
| 10:01:45 | Instagram finishes processing (40s later) |
| 10:01:46 | Publishes to Instagram |
| 10:01:47 | Updates DB: `status: 'published'` |

**Total user wait time:** ~1 second ✅  
**Total publish time:** ~107 seconds (no timeout!) ✅

---

## Configuration

### Cloudflare Worker Cron
```toml
# cloudflare-worker/wrangler.toml

[triggers]
crons = ["* * * * *"]  # Every minute
```

### Environment Variables
```env
# Upstash Queue
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# API Endpoint
NEXTAUTH_URL=https://socialos.orincore.com
```

---

## Monitoring

### Check Publish Status

**Dashboard:**
- View content status in `/dashboard`
- Status shows: `scheduled`, `publishing`, `published`, `failed`

**Database:**
```javascript
// Check PublishJob status
db.publishjobs.find({ status: 'pending' })
db.publishjobs.find({ status: 'failed' })
```

**Cloudflare Logs:**
```bash
wrangler tail
```

---

## Troubleshooting

### Content stuck in "scheduled"
**Cause:** Cron job not running or failing  
**Fix:** Check Cloudflare Worker logs

### Content shows "failed"
**Cause:** Publish API error  
**Fix:** Check `publishError` field in Content document

### Cron not triggering
**Cause:** Worker not deployed or cron disabled  
**Fix:** 
```bash
cd cloudflare-worker
wrangler deploy
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/dashboard/content/create/page.tsx` | Creates content, always uses `scheduled` status |
| `app/api/content/route.ts` | Saves content to DB, no synchronous publishing |
| `cloudflare-worker/scheduled-publisher.js` | Cron job that processes queue |
| `app/api/instagram/publish/route.ts` | Actual Instagram publishing logic |
| `app/api/youtube/publish/route.ts` | Actual YouTube publishing logic |

---

## Summary

**Old (Broken):**
```
User → Create Content → Publish Immediately → Wait 60s → Timeout ❌
```

**New (Working):**
```
User → Create Content → Queue Job → Return Instantly ✅
                          ↓
                    Cron (1 min later)
                          ↓
                    Publish in Background
                          ↓
                    Update Status ✅
```

All publishing is now **asynchronous and queue-based** to avoid Vercel timeout limits!
