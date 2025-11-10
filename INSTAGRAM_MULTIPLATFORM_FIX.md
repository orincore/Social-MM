# Instagram Multi-Platform Error Fix

## Problem

When selecting **multiple platforms** (Instagram + YouTube), Instagram fails with error:
```
Error: Media upload has failed with error code 2207076
```

But when selecting **Instagram only**, it works fine.

## Root Cause

Instagram error **2207076** means the video format is incompatible with Instagram Reels requirements:

### Instagram Reels Requirements:
- ✅ **Format:** MP4 (H.264 codec)
- ✅ **Aspect Ratio:** Vertical (9:16) - 1080x1920 recommended
- ✅ **Duration:** Max 60 seconds (90 seconds for some accounts)
- ✅ **File Size:** Max 4GB
- ✅ **Frame Rate:** 23-60 fps
- ✅ **Audio:** AAC codec

### Why It Fails in Multi-Platform:

1. **URL Access Timing:** When both platforms try to download simultaneously, Instagram might get a stale/expired signed URL
2. **Video Encoding:** The video might be encoded in a way that works for YouTube but not Instagram
3. **R2 Public URL Issue:** Your R2 public URL returns 404, forcing signed URLs which have 15-minute expiry

## Solutions

### Option 1: Fix R2 Public URL (Recommended)

This will make Instagram downloads more reliable:

1. **Cloudflare Dashboard** → R2 → `social-mm-media` → Settings → **Public Access**
2. Click **"Allow Access"**
3. Copy the public URL: `https://pub-xxxxxxxxxxxxx.r2.dev`
4. Update `.env` and Vercel:
   ```env
   R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
   ```
5. Redeploy

**Why this helps:** Direct public URLs are more reliable than signed URLs for Instagram.

### Option 2: Increase Signed URL Expiry

Current: 15 minutes (900 seconds)
Increase to: 1 hour (3600 seconds)

**File:** `lib/instagram-api.ts` line 33
```javascript
// Change from:
return r2Storage.getSignedDownloadUrl(r2Key, 900);

// To:
return r2Storage.getSignedDownloadUrl(r2Key, 3600);
```

### Option 3: Validate Video Before Upload

Add client-side validation to ensure videos meet Instagram requirements:

**File:** `app/dashboard/content/create/page.tsx`

Add this function:
```javascript
const validateVideoForInstagram = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;
      
      // Check duration
      if (duration > 60) {
        resolve({ valid: false, error: 'Video must be 60 seconds or less for Instagram Reels' });
        return;
      }
      
      // Check aspect ratio (should be vertical)
      if (aspectRatio > 0.6) { // Not vertical enough
        resolve({ valid: false, error: 'Video must be vertical (9:16 aspect ratio) for Instagram Reels' });
        return;
      }
      
      resolve({ valid: true });
    };
    
    video.onerror = () => {
      resolve({ valid: false, error: 'Unable to read video metadata' });
    };
    
    video.src = URL.createObjectURL(file);
  });
};
```

Then call it before upload when Instagram is selected:
```javascript
if (selectedPlatforms.includes('instagram')) {
  const validation = await validateVideoForInstagram(mediaFile);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
}
```

### Option 4: Use Different Videos Per Platform

For advanced users, allow uploading separate videos for Instagram and YouTube:

```javascript
const [instagramVideo, setInstagramVideo] = useState<File | null>(null);
const [youtubeVideo, setYoutubeVideo] = useState<File | null>(null);
```

## Current Workaround

**For now, if multi-platform fails:**

1. Create content for **Instagram only** first
2. Then create separate content for **YouTube only**
3. Use the same caption/title but upload separately

This ensures each platform gets a properly formatted video.

## Testing

After implementing fixes, test with:

1. **Instagram-only:** Should work ✅
2. **YouTube-only:** Should work ✅
3. **Multi-platform:** Should work ✅

## Logs to Check

After deploying, check Vercel logs for:

```
Creating Instagram media container... {
  mediaType: 'REELS',
  originalUrl: 'https://pub-xxx.r2.dev/...',
  resolvedUrl: 'https://pub-xxx.r2.dev/...',  ← Should be public, not signed
  urlType: 'public'  ← Should say 'public' not 'signed'
}
```

If you see `urlType: 'signed'`, it means R2 public URL is not working.

## Deploy

```bash
git add .
git commit -m "fix: improve Instagram error handling and logging"
git push
```

## Summary

**Quick Fix:** Set up R2 public URL properly
**Long-term:** Add video validation before upload
**Current:** Use Instagram-only for now if multi-platform fails
