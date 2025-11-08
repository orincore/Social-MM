# Instagram API Testing Guide

This guide demonstrates how to test the updated Instagram API implementation.

## Prerequisites

1. **Environment Variables**: Update your `.env.local` with:
   ```
   IG_APP_ID=1126801372868011
   IG_APP_SECRET=YOUR_INSTAGRAM_APP_SECRET
   IG_REDIRECT_URI=https://localhost:3443/api/instagram/callback
   IG_VERIFY_TOKEN=your-webhook-verify-token
   NEXT_PUBLIC_APP_URL=https://localhost:3443
   ```

2. **Instagram App Setup**:
   - App must be in Development mode
   - Your Instagram account added as a Tester
   - Redirect URI must match exactly

## Testing Flow

### 1. OAuth Login
Navigate to: `https://localhost:3443/api/instagram/login`

This will redirect to Instagram OAuth with the required scopes:
- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`
- `instagram_business_content_publish`
- `instagram_business_manage_insights`

### 2. Callback Handling
After authorization, Instagram redirects to `/api/instagram/callback` which:
- Exchanges code for access token
- Fetches basic profile info
- Stores account in SocialAccount collection
- Redirects to `/dashboard/settings?connected=instagram`

### 3. Test Publishing

#### Create Test Content
```javascript
// In MongoDB or via API
await Content.create({
  platform: 'instagram',
  caption: 'Hello from API test 👋',
  mediaUrl: 'https://picsum.photos/1080/1080.jpg', // any public square image
  status: 'draft'
});
```

#### Publish Content
```bash
curl -X POST https://localhost:3443/api/publish \
  -H "Content-Type: application/json" \
  -d '{"contentId":"<MONGOID_OF_CONTENT>"}'
```

Expected response:
```json
{
  "ok": true,
  "permalink": "https://www.instagram.com/p/..."
}
```

### 4. Webhook Testing
Set webhook URL in Meta dashboard: `https://localhost:3443/api/instagram/webhook`

The webhook endpoint handles:
- GET: Verification with `hub.verify_token`
- POST: Receives Instagram events

### 5. Profile & Insights Testing
```bash
# Get profile info
curl "https://graph.facebook.com/v20.0/{IG_USER_ID}?fields=id,username&access_token={ACCESS_TOKEN}"

# Get insights (last 7 days)
curl "https://graph.facebook.com/v20.0/{IG_USER_ID}/insights?metric=impressions,reach&period=day&access_token={ACCESS_TOKEN}"
```

## API Endpoints

- **Login**: `GET /api/instagram/login`
- **Callback**: `GET /api/instagram/callback`
- **Webhook**: `GET|POST /api/instagram/webhook`
- **Publish**: `POST /api/publish`
- **Connect**: `GET /api/instagram/connect` (redirects to login)
- **Disconnect**: `DELETE /api/instagram/connect`

## Database Models

### SocialAccount
```typescript
{
  userId: ObjectId,
  provider: 'instagram',
  providerUserId: string,
  username: string,
  accessToken: string,
  scopes: string[]
}
```

### Content
```typescript
{
  userId: ObjectId,
  platform: 'instagram',
  caption: string,
  mediaUrl: string,
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed',
  remote: {
    igUserId: string,
    creationId: string,
    mediaId: string,
    permalink: string
  }
}
```

## Common Issues

1. **Invalid redirect_uri**: Ensure exact match in Meta dashboard
2. **Permission errors**: Account must be Business/Creator and added as tester
3. **Container timeout**: Try different image URL (HTTPS, publicly accessible)
4. **Token expired**: Re-run OAuth flow

## Production Checklist

- [ ] Add data deletion endpoint
- [ ] Add deauthorize endpoint  
- [ ] Encrypt access tokens
- [ ] Implement proper user authentication
- [ ] Add rate limiting
- [ ] Complete App Review for production access
