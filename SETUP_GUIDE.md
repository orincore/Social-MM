# Social MM - Multi-Platform Social Media Management Setup Guide

## 🚀 Features Implemented

- ✅ **Loading animations** on dashboard cards
- ✅ **Analytics redirection** to `/dashboard/analytics`
- ✅ **Comprehensive create post section** with scheduling
- ✅ **Instagram posting API** integration
- ✅ **Cloudflare R2 storage** for media files
- ✅ **Upstash Queue** for job processing
- ✅ **Cloudflare Workers cron** for scheduled publishing

## 📋 Prerequisites

1. **Node.js 18+** and npm
2. **MongoDB** (local or Atlas)
3. **Cloudflare account** (for R2 and Workers)
4. **Upstash account** (for Redis/Queue)
5. **Facebook Developer account** (for Instagram API)
6. **OpenAI API key** (for AI features)

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies

```bash
cd "Social MM"
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod --dbpath /path/to/your/db
```

**Option B: MongoDB Atlas**
1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get connection string
3. Add to `MONGODB_URI` in `.env.local`

### 4. Facebook/Instagram API Setup

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app
3. Add Instagram Basic Display product
4. Add Instagram Graph API product
5. Get App ID and App Secret
6. Set up Instagram Business account
7. Link Facebook Page to Instagram account

### 5. Cloudflare R2 Setup

1. Go to Cloudflare Dashboard → R2
2. Create new bucket: `social-mm-media`
3. Create API token with R2 permissions
4. Set up custom domain (optional but recommended)
5. Add credentials to `.env.local`:

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=social-mm-media
R2_PUBLIC_URL=https://your-custom-domain.com
```

### 6. Upstash Redis/Queue Setup

1. Go to [Upstash Console](https://console.upstash.com)
2. Create new Redis database
3. Get REST URL and token
4. Add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 7. OpenAI API Setup

1. Get API key from [OpenAI](https://platform.openai.com)
2. Add to `.env.local`:

```env
OPENAI_API_KEY=your-openai-api-key
```

### 8. Cloudflare Worker Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy the worker:
```bash
cd cloudflare-worker
wrangler deploy
```

4. Set worker secrets:
```bash
wrangler secret put CRON_SECRET
wrangler secret put UPSTASH_QUEUE_URL
```

5. Update `wrangler.toml` with your app URL

## 🚀 Running the Application

### Development Mode

```bash
# Standard development
npm run dev

# HTTPS development (recommended for Instagram API)
npm run dev:https
```

Access the app at:
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3443`

### Production Deployment

**Deploy to Vercel:**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

4. Update Cloudflare Worker with production URL

## 📱 Instagram API Configuration

### Required Permissions

Your Instagram Business account needs these permissions:
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- `pages_show_list`

### Access Token Setup

1. Use Facebook Graph API Explorer
2. Generate User Access Token
3. Exchange for Long-Lived Token
4. Store in your database via `/connect/instagram`

## 🔄 How Scheduling Works

### Architecture Flow

1. **User schedules post** → Saved to MongoDB + Added to Upstash Queue
2. **Cloudflare Worker runs every minute** → Calls `/api/cron/process-scheduled`
3. **Cron endpoint checks** → Finds due posts in MongoDB
4. **Posts are published** → Via Instagram Graph API
5. **Queue processes** → Backup jobs via `/api/cron/process-queue`

### API Endpoints

- `POST /api/schedule` - Schedule new post
- `POST /api/instagram/publish` - Publish immediately
- `POST /api/upload` - Upload media to R2
- `GET /api/schedule` - Get scheduled posts
- `DELETE /api/schedule?contentId=xxx` - Cancel scheduled post

## 🛡️ Security Features

- **CRON_SECRET** protects cron endpoints
- **User-based file isolation** in R2 storage
- **Access token encryption** in database
- **Request rate limiting** on API endpoints
- **File type validation** on uploads

## 📊 Database Schema

### Content Model
```javascript
{
  userEmail: String,
  title: String,
  caption: String,
  mediaUrl: String,
  mediaType: 'IMAGE' | 'VIDEO',
  platforms: ['instagram'],
  scheduledAt: Date,
  status: 'scheduled' | 'processing' | 'published' | 'failed',
  isReel: Boolean,
  hashtags: [String],
  mentions: [String]
}
```

### PublishJob Model
```javascript
{
  userEmail: String,
  contentId: ObjectId,
  platform: String,
  status: 'scheduled' | 'processing' | 'completed' | 'failed',
  publishedPostId: String,
  scheduledAt: Date,
  publishedAt: Date,
  error: String,
  metadata: Object
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Instagram API errors**
   - Check access token validity
   - Verify business account setup
   - Ensure proper permissions

2. **R2 upload failures**
   - Verify credentials and bucket name
   - Check file size limits (100MB)
   - Validate file types

3. **Cron jobs not running**
   - Check Cloudflare Worker logs
   - Verify CRON_SECRET matches
   - Ensure app URL is correct

4. **Queue processing issues**
   - Check Upstash Redis connection
   - Verify queue configuration
   - Monitor error logs

### Debug Endpoints

- `GET /api/cron/process-scheduled?secret=YOUR_SECRET` - Manual cron trigger
- `GET /api/cron/process-queue?secret=YOUR_SECRET` - Manual queue processing

## 📈 Monitoring

### Logs to Monitor

- Cloudflare Worker logs (cron execution)
- Vercel function logs (API endpoints)
- Upstash Redis metrics (queue health)
- Instagram API rate limits

### Key Metrics

- Posts scheduled vs published
- API success/failure rates
- Queue processing times
- Storage usage in R2

## 🎯 Next Steps

1. **Add Facebook posting** support
2. **Implement YouTube** integration  
3. **Add analytics dashboard** improvements
4. **Create mobile app** companion
5. **Add team collaboration** features

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check service status pages
4. Contact support if needed
