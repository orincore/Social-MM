# Clear Browser Cache & Rebuild

## Problem
You're seeing old POST upload errors because your browser cached the old JavaScript code.

## Solution

### Step 1: Stop Development Server
```bash
# Press Ctrl+C in your terminal to stop the dev server
```

### Step 2: Clear Next.js Cache
```bash
# Delete .next folder and node_modules/.cache
rm -rf .next
rm -rf node_modules/.cache

# On Windows PowerShell:
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
```

### Step 3: Rebuild & Restart
```bash
npm run build
npm run dev
```

### Step 4: Hard Refresh Browser
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`
- **Safari**: `Cmd + Shift + R`

Or:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 5: Verify Upload Code
Open browser DevTools → Network tab → Try uploading a file

You should see:
1. ✅ GET request to `/api/upload?fileName=...` (getting presigned URL)
2. ✅ PUT request to R2 endpoint (direct upload)
3. ❌ NO POST request to `/api/upload`

## Quick Fix (Alternative)

If you just want to test quickly:

1. Open browser in **Incognito/Private mode**
2. Navigate to your app
3. Try upload again

This bypasses all caching.

## Verify Changes

Check the Network tab in DevTools. You should see:

**OLD (Wrong):**
```
POST /api/upload (413 error)
```

**NEW (Correct):**
```
GET /api/upload?fileName=video.mp4&fileType=video&contentType=video/mp4
PUT https://social-mm-media.xxx.r2.cloudflarestorage.com/...
```

## Still Not Working?

1. Make sure you configured CORS on R2 (see R2_CORS_SETUP.md)
2. Check that `lib/client-upload.ts` doesn't have the fallback code
3. Verify the build completed successfully
4. Try a different browser
