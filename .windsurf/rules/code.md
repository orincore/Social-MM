---
trigger: always_on
---

you are building a production-grade SaaS webapp.

framework: Next.js 15 (App Router)
database: MongoDB (mongoose / prisma-mongodb)
deployment: Vercel (serverless functions only)
storage: Cloudflare R2 (S3 compatible)
cron: Cloudflare Workers (scheduled)
queue: Upstash Queue
AI: OpenAI GPT-5 API
auth: NextAuth.js (credentials or oauth)

this project is a multi-social media management platform.
users connect Instagram, Facebook, YouTube and schedule posts.

no EC2 / no traditional server.
all backend logic must be serverless API routes.

core MVP features to implement:

user auth + subscription plan logic (Free vs Pro ₹149/month)

connect social accounts (Meta, YouTube) and store token info in MongoDB

create content items with: title, caption, media_url, platform(s), scheduled_at date, status

Cloudflare Cron checks DB every minute for scheduled content → sends job to Upstash queue

Upstash worker hits /api/publish endpoint inside Next.js to publish post

AI caption generator + AI content idea generator endpoints

MongoDB schemas must be clean and typed

limits:

do not write long running workers inside Next.js

API must return within 3-5s

all publish tasks must be idempotent

all background tasks triggered externally