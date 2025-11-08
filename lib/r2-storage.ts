import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 Storage utility
export class R2Storage {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME!;
    
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Upload file to R2
  async uploadFile(
    key: string, 
    file: Buffer | Uint8Array | string, 
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.client.send(command);
      
      // Return the public URL
      return `${process.env.R2_PUBLIC_URL}/${key}`;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      throw error;
    }
  }

  // Get signed URL for direct upload
  async getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  // Delete file from R2
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting from R2:', error);
      throw error;
    }
  }

  // Generate unique file key
  generateFileKey(userId: string, originalName: string, type: 'image' | 'video' = 'image'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    return `${type}s/${userId}/${timestamp}-${randomString}.${extension}`;
  }

  // Get file URL
  getFileUrl(key: string): string {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}

export const r2Storage = new R2Storage();
