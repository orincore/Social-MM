# Social MM - Multi-Platform Social Media Management

A production-grade SaaS webapp for managing Instagram, Facebook, and YouTube content from one dashboard.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB (Mongoose)
- **Deployment**: Vercel (serverless functions)
- **Storage**: Cloudflare R2 (S3 compatible)
- **Cron**: Cloudflare Workers (scheduled)
- **Queue**: Upstash Queue
- **AI**: OpenAI GPT-4 API
- **Auth**: NextAuth.js
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Validation**: Zod

## Features

### Core MVP Features
- ✅ User authentication & subscription plans (Free vs Pro ₹149/month)
- ✅ Connect social accounts (Meta, YouTube) with token storage
- ✅ Create content with title, caption, media_url, platform(s), scheduled_at
- ✅ AI caption generator & content idea generator
- ✅ Publishing system with dummy logic (ready for platform APIs)
- ✅ Dashboard UI with calendar, analytics, and settings

### Architecture
- All backend logic in serverless API routes
- MongoDB schemas with proper TypeScript typing
- Idempotent publish tasks
- External background task triggers
- 3-5s API response time limits

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   OPENAI_API_KEY=your-openai-api-key
   # Add other required environment variables
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts    # NextAuth configuration
    /ai/caption/route.ts            # AI caption generation
    /ai/ideas/route.ts              # AI content ideas
    /publish/route.ts               # Content publishing
  /(dashboard)
    /calendar/page.tsx              # Content calendar
    /analytics/page.tsx             # Analytics dashboard
    /settings/page.tsx              # User settings
/lib
  db.ts                             # MongoDB connection
  openai.ts                         # OpenAI client & functions
/models
  User.ts                           # User schema
  SocialAccount.ts                  # Social account schema
  Content.ts                        # Content schema
  PublishJob.ts                     # Publish job schema
/components                         # Reusable UI components
```

## API Endpoints

### AI Endpoints
- `POST /api/ai/caption` - Generate AI captions
- `POST /api/ai/ideas` - Generate content ideas

### Publishing
- `POST /api/publish` - Publish content to social platforms

## Database Models

### User
- Subscription management (free/pro)
- User profile information
- Subscription status tracking

### SocialAccount
- Platform connections (Instagram, Facebook, YouTube)
- Token management with expiration
- Account metadata storage

### Content
- Multi-platform content management
- Scheduling and status tracking
- AI generation flags
- Publish results tracking

### PublishJob
- Idempotent job processing
- Retry logic with exponential backoff
- Platform-specific job management

## Development Notes

### Coding Standards
- TypeScript everywhere
- Mongoose for MongoDB (stable with App Router)
- Server actions where beneficial
- Typed and validated environment variables
- JSON responses only (no HTML on API routes)

### Deployment Considerations
- No long-running workers in Next.js
- All publish tasks are idempotent
- Background tasks triggered externally
- Serverless-first architecture

## Next Steps

1. **Authentication Setup**: Implement NextAuth.js with OAuth providers
2. **Social Media APIs**: Replace dummy publish logic with actual platform APIs
3. **Cloudflare Integration**: Set up R2 storage and Workers for cron jobs
4. **Upstash Queue**: Implement queue system for reliable job processing
5. **Payment Integration**: Add Stripe/Razorpay for subscription management
6. **Testing**: Add comprehensive test suite
7. **Monitoring**: Implement error tracking and performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
