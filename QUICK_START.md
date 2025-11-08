# Social MM - Quick Start Guide

## 🚀 Get Started Fast

This guide gets you up and running with the core functionality without complex dependencies.

## 📦 Install Dependencies

```bash
npm install --legacy-peer-deps
```

If you get errors about missing packages, install the core ones first:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @upstash/redis mongoose mongodb next-auth openai
```

## 🔧 Environment Setup

1. Copy the environment file:
```bash
cp .env.example .env.local
```

2. **Minimum required variables** for basic functionality:
```env
# Next.js
NEXTAUTH_URL=https://localhost:3443
NEXTAUTH_SECRET=your-secret-here

# MongoDB (required)
MONGODB_URI=mongodb://localhost:27017/social-mm

# Instagram API (required for posting)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# OpenAI (optional - for AI features)
OPENAI_API_KEY=your-openai-key

# Cron Security (required for scheduling)
CRON_SECRET=your-secure-secret
```

## 🏃‍♂️ Quick Run

```bash
# Start development server with HTTPS
npm run dev:https
```

Access at: `https://localhost:3443`

## ✅ Core Features Working

### 1. Dashboard with Loading Animations ✅
- Beautiful loading states on all cards
- Real-time analytics display
- Smooth transitions

### 2. Analytics Redirection ✅
- "View Detailed Analytics" → `/dashboard/analytics`
- Comprehensive analytics page

### 3. Create Post Section ✅
- Modern 3-column layout
- Content type selection
- Upload interface
- Scheduling options

### 4. Instagram Posting ✅
- Direct posting via `/api/instagram/publish`
- Support for images and videos/reels
- Error handling and status tracking

### 5. Basic Scheduling ✅
- Database-driven scheduling
- Use `/api/schedule-simple` for core functionality
- Cron job processing via `/api/cron/process-scheduled`

## 🔄 Scheduling System

### Simple Approach (Works Now)
1. **Schedule posts** → Saved to MongoDB
2. **Cloudflare Worker** (or manual cron) → Calls `/api/cron/process-scheduled`
3. **Posts published** → Via Instagram API
4. **Status updated** → In database

### API Endpoints
- `POST /api/schedule-simple` - Schedule posts (no Redis required)
- `POST /api/instagram/publish` - Publish immediately
- `GET /api/schedule-simple` - Get scheduled posts
- `DELETE /api/schedule-simple?contentId=xxx` - Cancel posts

## 🛠️ Optional Advanced Features

### Cloudflare R2 Storage
Add these to `.env.local` when ready:
```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=social-mm-media
R2_PUBLIC_URL=https://your-domain.com
```

### Upstash Redis (Optional)
Add when you want advanced queueing:
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard.

## 🔧 Cloudflare Worker (Optional)

For automated scheduling:

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Deploy worker:
```bash
cd cloudflare-worker
wrangler deploy
```

3. Set secrets:
```bash
wrangler secret put CRON_SECRET
```

## 🐛 Troubleshooting

### Package Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Missing Dependencies
The app works with core dependencies. Advanced features (Redis queue) are optional.

### Instagram API Issues
1. Ensure Facebook app is set up correctly
2. Instagram account must be Business account
3. Check access token validity

## 📱 Test the System

1. **Access dashboard**: `https://localhost:3443/dashboard`
2. **Create post**: Use the create post section
3. **Schedule post**: Set future date/time
4. **Test cron**: Call `/api/cron/process-scheduled?secret=YOUR_SECRET`

## 🎯 What's Working Right Now

- ✅ Beautiful dashboard with loading animations
- ✅ Analytics page redirection
- ✅ Comprehensive create post UI
- ✅ Instagram posting API
- ✅ Basic scheduling system
- ✅ Cloudflare R2 storage (when configured)
- ✅ Database-driven job processing

## 🔮 Next Steps

1. **Set up Instagram API** - Get your Facebook app credentials
2. **Configure MongoDB** - Local or Atlas
3. **Test posting** - Try immediate posts first
4. **Add scheduling** - Use the simple scheduler
5. **Deploy** - Push to Vercel
6. **Add cron** - Set up Cloudflare Worker

The system is production-ready with these core features!
