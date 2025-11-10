# R2 Public URL Configuration

## Current Issue

Instagram is getting 404 when trying to access videos from:
```
https://r2.orincore.com/videos/...
```

This means the custom domain is not properly configured.

## Solution Options

### Option 1: Use R2 Default Public URL (Easiest)

1. **Cloudflare Dashboard** → R2 → `social-mm-media`
2. Click **Settings** → **Public Access**
3. Click **Allow Access** (if not already enabled)
4. Copy the public URL (looks like: `https://pub-xxxxxxxxxxxxx.r2.dev`)

5. **Update your `.env` files:**

```env
# Replace this:
R2_PUBLIC_URL=https://r2.orincore.com

# With the actual R2 public URL:
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

6. **Update on Vercel:**
   - Vercel Dashboard → Settings → Environment Variables
   - Update `R2_PUBLIC_URL` to the new value
   - Redeploy

### Option 2: Configure Custom Domain (Advanced)

If you want to use `r2.orincore.com`:

1. **Cloudflare Dashboard** → R2 → `social-mm-media` → Settings

2. **Connect Custom Domain:**
   - Click "Connect Domain"
   - Enter: `r2.orincore.com`
   - Follow the DNS setup instructions

3. **Add DNS Record:**
   - Go to Cloudflare DNS settings for `orincore.com`
   - Add CNAME record:
     ```
     Type: CNAME
     Name: r2
     Target: <your-bucket-id>.r2.cloudflarestorage.com
     Proxy: OFF (DNS only)
     ```

4. **Wait for DNS propagation** (5-10 minutes)

5. **Test:**
   ```bash
   curl -I https://r2.orincore.com/videos/test.mp4
   ```

### Option 3: Always Use Signed URLs (Current Workaround)

The code already falls back to signed URLs when the public URL fails. This works but:
- ✅ Secure (URLs expire)
- ✅ Works immediately
- ❌ Slightly slower (extra API call)
- ❌ URLs expire after 15 minutes

**No changes needed** - this is already working as a fallback!

## Recommended: Option 1 (Default R2 URL)

**Quickest fix:**

1. Enable public access on R2 bucket
2. Get the `pub-xxxxx.r2.dev` URL
3. Update `R2_PUBLIC_URL` in `.env` and Vercel
4. Redeploy

## Testing

After updating `R2_PUBLIC_URL`:

```bash
# Test the public URL
curl -I https://YOUR_R2_PUBLIC_URL/videos/test.mp4

# Should return 200 OK (or 404 if file doesn't exist)
# Should NOT return 403 Forbidden
```

## Current Status

✅ **YouTube publishing works!**
✅ **Instagram code works!**
⚠️ **R2 public URL needs configuration**

The signed URL fallback is working, so Instagram should still publish (just slower). But fixing the public URL will make it faster and more reliable.
