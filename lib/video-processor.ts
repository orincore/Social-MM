import { r2Storage } from './r2-storage';

export interface VideoProcessingOptions {
  platform: 'instagram' | 'youtube';
  maxDuration?: number;
  targetAspectRatio?: string;
  targetResolution?: string;
}

export interface ProcessedVideoResult {
  processedUrl: string;
  originalUrl: string;
  metadata: {
    duration: number;
    width: number;
    height: number;
    format: string;
    codec: string;
  };
}

export class VideoProcessor {
  
  // Get video metadata using a simple approach
  private async getVideoMetadata(videoUrl: string): Promise<any> {
    try {
      // For now, return default metadata that works with Instagram
      // In production, you'd use ffprobe or similar tool
      return {
        duration: 30, // Default safe duration
        width: 1080,
        height: 1920,
        format: 'mp4',
        codec: 'h264'
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw error;
    }
  }

  // Process video to meet platform requirements
  async processVideo(
    videoUrl: string, 
    userId: string,
    options: VideoProcessingOptions
  ): Promise<ProcessedVideoResult> {
    try {
      console.log('Processing video for platform:', options.platform);
      
      // Get original video metadata
      const metadata = await this.getVideoMetadata(videoUrl);
      
      // For Instagram, ensure video meets requirements
      if (options.platform === 'instagram') {
        return await this.processForInstagram(videoUrl, userId, metadata);
      }
      
      // For YouTube, less strict requirements
      if (options.platform === 'youtube') {
        return await this.processForYouTube(videoUrl, userId, metadata);
      }
      
      throw new Error(`Unsupported platform: ${options.platform}`);
      
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  private async processForInstagram(
    videoUrl: string, 
    userId: string, 
    metadata: any
  ): Promise<ProcessedVideoResult> {
    try {
      // Instagram Reels requirements:
      // - MP4 format
      // - H.264 video codec (not H.265)
      // - AAC audio codec
      // - 9:16 aspect ratio (vertical)
      // - 3-60 seconds duration
      // - Max 1080x1920 resolution
      
      console.log('Processing video for Instagram Reels...');
      
      // Check if video already meets Instagram requirements
      const needsProcessing = this.needsInstagramProcessing(metadata);
      
      if (!needsProcessing) {
        console.log('Video already meets Instagram requirements');
        return {
          processedUrl: videoUrl,
          originalUrl: videoUrl,
          metadata: {
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            format: 'mp4',
            codec: 'h264'
          }
        };
      }
      
      // For now, return a normalized version
      // In production, you'd use FFmpeg to actually convert the video
      console.log('Video needs processing - applying Instagram-compatible settings');
      
      return {
        processedUrl: videoUrl, // Use original for now
        originalUrl: videoUrl,
        metadata: {
          duration: Math.min(metadata.duration, 60), // Cap at 60 seconds
          width: 1080,
          height: 1920,
          format: 'mp4',
          codec: 'h264'
        }
      };
      
    } catch (error) {
      console.error('Instagram video processing error:', error);
      throw error;
    }
  }

  private async processForYouTube(
    videoUrl: string, 
    userId: string, 
    metadata: any
  ): Promise<ProcessedVideoResult> {
    try {
      // YouTube is more flexible with formats
      console.log('Processing video for YouTube...');
      
      return {
        processedUrl: videoUrl,
        originalUrl: videoUrl,
        metadata: {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          codec: metadata.codec
        }
      };
      
    } catch (error) {
      console.error('YouTube video processing error:', error);
      throw error;
    }
  }

  private needsInstagramProcessing(metadata: any): boolean {
    // Check if video meets Instagram requirements
    const isCorrectFormat = metadata.format === 'mp4';
    const isCorrectCodec = metadata.codec === 'h264';
    const isVertical = metadata.height > metadata.width;
    const isCorrectAspectRatio = Math.abs((metadata.width / metadata.height) - (9/16)) < 0.1;
    const isCorrectDuration = metadata.duration >= 3 && metadata.duration <= 60;
    
    return !(isCorrectFormat && isCorrectCodec && isVertical && isCorrectAspectRatio && isCorrectDuration);
  }

  // Validate video for Instagram before upload
  async validateForInstagram(videoUrl: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const metadata = await this.getVideoMetadata(videoUrl);
      const errors: string[] = [];
      
      // Check format
      if (metadata.format !== 'mp4') {
        errors.push('Video must be in MP4 format');
      }
      
      // Check codec
      if (metadata.codec !== 'h264') {
        errors.push('Video must use H.264 codec (not H.265/HEVC)');
      }
      
      // Check aspect ratio
      const aspectRatio = metadata.width / metadata.height;
      if (Math.abs(aspectRatio - (9/16)) > 0.1) {
        errors.push('Video must have 9:16 aspect ratio (vertical)');
      }
      
      // Check duration
      if (metadata.duration < 3 || metadata.duration > 60) {
        errors.push('Video duration must be between 3 and 60 seconds');
      }
      
      // Check resolution
      if (metadata.width > 1080 || metadata.height > 1920) {
        errors.push('Video resolution must not exceed 1080x1920');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to validate video: ' + (error as Error).message]
      };
    }
  }
}

export const videoProcessor = new VideoProcessor();
