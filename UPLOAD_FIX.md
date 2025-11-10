# Upload Fix: Direct Client-to-R2 Upload

## Problem
- **413 Content Too Large** error when uploading files through `/api/upload`
- Vercel serverless functions have a 4.5MB body size limit (hobby/pro plans)
- Large video files were being rejected before reaching R2 storage

## Solution
Implemented **direct client-to-R2 uploads** using presigned URLs:

1. Client requests a presigned upload URL from `/api/upload` (GET)
2. Server generates a temporary signed URL for direct R2 upload
3. Client uploads file directly to R2 using the presigned URL
4. No file data passes through the serverless function

## Benefits
✅ **Bypasses serverless body size limits** - Files can be any size (up to R2's limits)
✅ **Faster uploads** - Direct to R2, no intermediate processing
✅ **Lower serverless costs** - Minimal function execution time
✅ **Better user experience** - Progress tracking support built-in

## Implementation Details

### Backend (Already Existed)
- `GET /api/upload` - Generates presigned upload URLs
- `POST /api/upload` - Legacy endpoint (kept for backward compatibility)
- `DELETE /api/upload` - Deletes files from R2

### Frontend Changes
**Created:** `lib/client-upload.ts`
- `uploadToR2(file, onProgress?)` - Upload files directly to R2
- `deleteFromR2(fileKey)` - Delete files from R2
- Progress tracking support

**Updated:** `app/dashboard/content/create/page.tsx`
- Now uses `uploadToR2()` utility function
- Cleaner, more maintainable code
- Automatic error handling

## Usage Example

```typescript
import { uploadToR2 } from '@/lib/client-upload';

// Simple upload
const result = await uploadToR2(file);
if (result.success) {
  console.log('File URL:', result.fileUrl);
}

// With progress tracking
const result = await uploadToR2(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

## Technical Flow

```
┌─────────┐     1. Request presigned URL      ┌──────────────┐
│ Client  │ ──────────────────────────────────>│  Next.js API │
│ Browser │                                    │  (Serverless)│
└─────────┘                                    └──────────────┘
     │                                                 │
     │         2. Return signed URL + public URL      │
     │ <───────────────────────────────────────────────
     │
     │         3. PUT file directly to R2
     │ ──────────────────────────────────────────────>┌──────────┐
     │                                                 │    R2    │
     │         4. Upload complete (200 OK)            │ Storage  │
     │ <───────────────────────────────────────────────└──────────┘
     │
     │         5. Use public URL in content
     └─────────────────────────────────────────────>
```

## File Size Limits

| Method | Limit | Notes |
|--------|-------|-------|
| Old (POST /api/upload) | 4.5MB | Vercel serverless limit |
| New (Direct R2) | 5TB | R2's max object size |
| Current validation | 100MB | Configurable in code |

## Migration Notes

- ✅ Old POST endpoint still works for small files (<4.5MB)
- ✅ **Smart fallback**: Files <4MB use POST (no CORS needed), larger files use direct upload
- ✅ No breaking changes to existing functionality
- ✅ Automatic fallback if CORS is not configured yet

## CORS Configuration Required

For direct uploads to work (files >4MB), you **must** configure CORS on your R2 bucket.

See `R2_CORS_SETUP.md` for detailed instructions.

### Quick CORS Setup:

1. Go to Cloudflare Dashboard → R2 → Your Bucket → Settings
2. Add CORS Policy:
```json
[
  {
    "AllowedOrigins": ["https://localhost:3443", "https://socialos.orincore.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Current Behavior (Smart Fallback):

- **Files < 4MB**: Uses POST upload (works immediately, no CORS needed)
- **Files ≥ 4MB**: Uses direct R2 upload (requires CORS configuration)
- **If CORS not configured**: Files >4MB will fail with CORS error

## Environment Variables Required

```env
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_PUBLIC_URL=https://your-public-domain.com
```

## Testing

**Prerequisites:** Configure CORS on R2 bucket first (see above)

1. Upload a small file (<5MB) - should work
2. Upload a large file (>10MB) - should work
3. Check R2 bucket to verify files are stored correctly
4. Verify public URLs are accessible
5. Check browser console - no CORS errors

## Future Enhancements

- [ ] Add upload progress UI in the frontend
- [ ] Implement resumable uploads for very large files
- [ ] Add client-side file validation before upload
- [ ] Implement chunked uploads for files >100MB
