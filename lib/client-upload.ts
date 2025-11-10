/**
 * Client-side utility for uploading files directly to R2 storage
 * Uses presigned URLs to bypass serverless function body size limits
 */

export interface UploadResult {
  success: boolean;
  fileUrl: string;
  fileKey: string;
  error?: string;
}

/**
 * Upload a file directly to R2 storage using presigned URLs
 * This bypasses the 4.5MB Vercel serverless function body size limit
 * 
 * REQUIRES: R2 bucket CORS configuration (see R2_CORS_SETUP.md)
 * 
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Upload result with public URL
 */
export async function uploadToR2(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Auto-detect file type
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    
    // Step 1: Get presigned upload URL from our API
    onProgress?.(10);
    const presignResponse = await fetch(
      `/api/upload?fileName=${encodeURIComponent(file.name)}&fileType=${fileType}&contentType=${encodeURIComponent(file.type)}`
    );
    
    if (!presignResponse.ok) {
      const errorData = await presignResponse.json();
      return {
        success: false,
        fileUrl: '',
        fileKey: '',
        error: errorData.error || 'Failed to get upload URL'
      };
    }
    
    const { signedUrl, publicUrl, fileKey } = await presignResponse.json();
    
    // Step 2: Upload directly to R2 using presigned URL with progress tracking
    onProgress?.(30);
    
    return new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = 30 + Math.round((e.loaded / e.total) * 60);
          onProgress?.(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        onProgress?.(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            fileUrl: publicUrl,
            fileKey: fileKey
          });
        } else {
          resolve({
            success: false,
            fileUrl: '',
            fileKey: '',
            error: `Upload failed with status ${xhr.status}: ${xhr.statusText}`
          });
        }
      });
      
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          fileUrl: '',
          fileKey: '',
          error: 'Network error during upload'
        });
      });
      
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          fileUrl: '',
          fileKey: '',
          error: 'Upload was aborted'
        });
      });
      
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
    
  } catch (error: any) {
    return {
      success: false,
      fileUrl: '',
      fileKey: '',
      error: error.message || 'Unknown error during upload'
    };
  }
}

/**
 * Delete a file from R2 storage
 * @param fileKey - The R2 file key to delete
 */
export async function deleteFromR2(fileKey: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/upload?fileKey=${encodeURIComponent(fileKey)}`, {
      method: 'DELETE'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
