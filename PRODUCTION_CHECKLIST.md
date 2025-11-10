# Production Deployment Checklist

## Current Issues on Production

### ❌ 500 Error on `/api/upload`
**Cause:** R2 environment variables are missing or incorrect in production

### ❌ 404 Error on `/dashboard/settings`
**Fixed:** Created settings page at `app/dashboard/settings/page.tsx`

---

## Required Environment Variables for Production

### ✅ Verify on Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Check that ALL of these are set:

### 1. R2 Storage (CRITICAL for uploads)
```env
R2_BUCKET_NAME=social-mm-media
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_PUBLIC_URL=https://your-custom-domain.com
```

**How to get these:**
1. Cloudflare Dashboard → R2 → Your Bucket
2. Settings → Copy bucket name
3. Manage R2 API Tokens → Create API Token
4. Copy Account ID for endpoint URL
5. Set up custom domain or use `pub-xxxxx.r2.dev`

### 2. NextAuth
```env
NEXTAUTH_URL=https://socialos.orincore.com
NEXTAUTH_SECRET=your-production-secret-here
```

### 3. MongoDB
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-mm
```

### 4. OAuth Providers
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 5. Social Media APIs
```env
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
YOUTUBE_CLIENT_ID=your-google-oauth-client-id
YOUTUBE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_API_KEY=your-google-api-key
```

### 6. OpenAI
```env
OPENAI_API_KEY=your-openai-api-key
```

### 7. Upstash (Optional)
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 8. Cron Security
```env
CRON_SECRET=your-secure-cron-secret
```

---

## Deployment Steps

### 1. Set Environment Variables on Vercel

```bash
# Or use Vercel CLI
vercel env add R2_BUCKET_NAME
vercel env add R2_ENDPOINT
vercel env add R2_ACCESS_KEY_ID
vercel env add R2_SECRET_ACCESS_KEY
vercel env add R2_PUBLIC_URL
# ... add all others
```

### 2. Configure R2 CORS (CRITICAL)

See `R2_CORS_SETUP.md` for detailed instructions.

Quick setup:
1. Cloudflare Dashboard → R2 → `social-mm-media` → Settings
2. Add CORS Policy:

```json
[
  {
    "AllowedOrigins": [
      "https://socialos.orincore.com",
      "https://localhost:3443"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Redeploy

After setting environment variables:

```bash
# Trigger a new deployment
vercel --prod

# Or via Vercel Dashboard
# Deployments → Redeploy (with latest commit)
```

### 4. Verify Deployment

Check these URLs:
- ✅ `https://socialos.orincore.com/dashboard` - Should load
- ✅ `https://socialos.orincore.com/dashboard/settings` - Should load (new page)
- ✅ `https://socialos.orincore.com/api/upload?fileName=test.mp4&fileType=video&contentType=video/mp4` - Should return JSON (not 500)

---

## Debugging Production Issues

### Check Vercel Logs

```bash
vercel logs --follow
```

Or in Vercel Dashboard → Deployments → Your Deployment → Runtime Logs

### Common Issues

#### 1. R2 500 Error
**Symptoms:** `/api/upload` returns 500
**Fix:** 
- Check all R2 env vars are set on Vercel
- Verify R2_ENDPOINT format: `https://ACCOUNT_ID.r2.cloudflarestorage.com`
- Check R2 API token has read/write permissions

#### 2. CORS Error
**Symptoms:** Upload fails with CORS error in browser
**Fix:**
- Configure CORS on R2 bucket (see above)
- Add production domain to AllowedOrigins
- Wait 1-2 minutes for CORS to propagate

#### 3. 404 on Settings
**Symptoms:** `/dashboard/settings` returns 404
**Fix:**
- ✅ Already fixed - settings page created
- Redeploy to production

#### 4. Auth Issues
**Symptoms:** Can't sign in
**Fix:**
- Set NEXTAUTH_URL to production domain
- Generate new NEXTAUTH_SECRET for production
- Update OAuth redirect URIs in Google/GitHub console

---

## Post-Deployment Testing

### 1. Test Upload Flow
1. Sign in to production app
2. Go to Create Content
3. Upload a small video (<10MB)
4. Check browser DevTools Network tab:
   - Should see GET to `/api/upload?fileName=...`
   - Should see PUT to R2 endpoint
   - No 500 or CORS errors

### 2. Test Settings Page
1. Navigate to `/dashboard/settings`
2. Should load without 404

### 3. Check Logs
```bash
vercel logs --follow
```
- No R2 configuration errors
- No 500 errors on upload endpoint

---

## Quick Fix Commands

### View current env vars
```bash
vercel env ls
```

### Pull env vars to local
```bash
vercel env pull .env.production
```

### Test production build locally
```bash
npm run build
npm run start
```

---

## Support

If issues persist:
1. Check Vercel deployment logs
2. Verify all env vars are set
3. Test R2 credentials with AWS CLI
4. Check CORS configuration on R2 bucket
