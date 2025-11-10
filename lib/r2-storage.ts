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
      // Sanitize metadata to ensure valid header values
      const sanitizedMetadata: Record<string, string> = {};
      if (metadata) {
        Object.entries(metadata).forEach(([k, v]) => {
          // Ensure key and value are valid for HTTP headers
          const sanitizedKey = k.toLowerCase().replace(/[^a-z0-9\-]/g, '');
          const sanitizedValue = v.replace(/[^\x20-\x7E]/g, '').replace(/[\r\n]/g, '');
          if (sanitizedKey && sanitizedValue) {
            sanitizedMetadata[sanitizedKey] = sanitizedValue;
          }
        });
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: sanitizedMetadata,
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

  // Download file from R2 and return as Blob
  async getFile(key: string): Promise<Blob> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const resp: any = await this.client.send(command);
      const body = resp.Body;
      const contentType: string = resp.ContentType || 'application/octet-stream';

      // Convert stream/body to Uint8Array
      const bytes = await this.streamToBytes(body);

      // Create a standalone ArrayBuffer (force copy) to avoid SharedArrayBuffer typing issues
      const arrayBuffer: ArrayBuffer = new Uint8Array(bytes).buffer;

      // Node >= 18 has global Blob
      return new Blob([arrayBuffer], { type: contentType });
    } catch (error) {
      console.error('Error downloading from R2:', error);
      throw error;
    }
  }

  // Helper: convert R2 stream to Uint8Array
  private async streamToBytes(stream: any): Promise<Uint8Array> {
    // If already Uint8Array
    if (stream instanceof Uint8Array) {
      return stream;
    }

    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let total = 0;
      // For Node.js Readable streams
      stream.on('data', (chunk: Buffer | Uint8Array) => {
        const u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        chunks.push(u8);
        total += u8.byteLength;
      });
      stream.on('end', () => {
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          out.set(c, offset);
          offset += c.byteLength;
        }
        resolve(out);
      });
      stream.on('error', (err: any) => reject(err));
    });
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
