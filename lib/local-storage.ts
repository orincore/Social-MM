import fs from 'fs';
import path from 'path';

export class LocalStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const fileDir = path.dirname(filePath);
      
      // Ensure directory exists
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, file);
      
      // Return public URL
      return `/uploads/${key}`;
    } catch (error) {
      console.error('Error uploading to local storage:', error);
      throw error;
    }
  }

  generateFileKey(userId: string, originalName: string, type: 'image' | 'video' = 'image'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    
    return `${type}s/${userId}/${timestamp}-${randomString}.${extension}`;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting from local storage:', error);
      throw error;
    }
  }
}

export const localStorage = new LocalStorage();
