# R2 CORS Configuration Guide

## Problem
Direct client-to-R2 uploads are blocked by CORS policy because R2 bucket doesn't allow cross-origin requests from your domain.

## Solution: Configure CORS on R2 Bucket

### Method 1: Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → Select your bucket (`social-mm-media`)
3. Go to **Settings** tab
4. Scroll to **CORS Policy** section
5. Click **Add CORS Policy** or **Edit**
6. Add the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://localhost:3443",
      "https://socialos.orincore.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

7. Click **Save**

### Method 2: Via Wrangler CLI

If you have Wrangler installed:

```bash
# Create a cors.json file with the configuration above
wrangler r2 bucket cors put social-mm-media --file cors.json
```

### Method 3: Via AWS CLI (S3-compatible)

```bash
aws s3api put-bucket-cors \
  --bucket social-mm-media \
  --cors-configuration file://cors.json \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

## CORS Configuration Explained

- **AllowedOrigins**: Your app domains (localhost for dev, production domain)
- **AllowedMethods**: HTTP methods for upload/download/delete
- **AllowedHeaders**: `*` allows all headers (including Content-Type)
- **ExposeHeaders**: Headers that browser can read from response
- **MaxAgeSeconds**: How long browser caches CORS preflight response

## Testing CORS Configuration

After applying CORS rules, test with:

```bash
curl -X OPTIONS \
  -H "Origin: https://localhost:3443" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://social-mm-media.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/test.txt
```

Should return:
```
Access-Control-Allow-Origin: https://localhost:3443
Access-Control-Allow-Methods: PUT, GET, POST, DELETE, HEAD
```

## Important Notes

1. **Add all your domains** to AllowedOrigins:
   - Development: `https://localhost:3443`, `http://localhost:3000`
   - Production: `https://socialos.orincore.com`
   - Any other domains you use

2. **Wildcard origins** (`*`) are NOT recommended for security
   - Only use specific domains

3. **Changes take effect immediately** after saving

4. **If using custom domain** for R2 public URL:
   - Make sure CORS is configured on the bucket, not the domain
   - The bucket endpoint needs CORS, not the public URL

## Verification

After configuring CORS, your uploads should work. Check browser console:
- ✅ No CORS errors
- ✅ Upload completes successfully
- ✅ File accessible via public URL

## Troubleshooting

### Still getting CORS errors?

1. **Clear browser cache** and try again
2. **Check bucket name** matches exactly
3. **Verify endpoint URL** in .env is correct
4. **Check allowed origins** include your exact domain (with protocol)
5. **Wait 1-2 minutes** for CORS changes to propagate

### No Fallback Available

All uploads now require CORS configuration. The POST upload fallback has been removed to ensure all files are stored directly in R2 (not on the server).
