import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { r2Storage } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Upload: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Upload: Session found for user:', session.user.email);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    let type = formData.get('type') as string;

    console.log('Upload: File received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      type: type
    });

    if (!file) {
      console.log('Upload: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Auto-detect file type if not provided
    if (!type) {
      if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('image/')) {
        type = 'image';
      } else {
        type = 'image'; // default fallback
      }
    }

    // Instagram Reels requirements validation
    const allowedTypes = ['video/mp4', 'video/quicktime'];
    const fileType = 'video'; // Always video
    const isMp4Mime = file.type === 'video/mp4';
    const isMp4Extension = file.name?.toLowerCase().endsWith('.mp4');
    
    console.log('Upload: File type validation:', {
      fileType,
      actualFileType: file.type,
      fileName: file.name,
      allowedTypes,
      isMp4Mime,
      isMp4Extension
    });

    // Strict MP4 validation for Instagram compatibility
    if (!isMp4Mime && !isMp4Extension) {
      console.log('Upload: Invalid file type for Instagram requirements');
      return NextResponse.json({ 
        error: 'Instagram Reels only support MP4 format',
        details: 'Please convert your video to MP4 (H.264 video codec, AAC audio codec) before uploading. Requirements: Vertical 9:16 aspect ratio, max 60 seconds, max 100MB.',
        hint: 'Use a video converter tool to ensure proper format: MP4 container, H.264/AVC video codec, AAC audio codec'
      }, { status: 400 });
    }

    // Validate file size (100MB limit for Instagram Reels)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 100MB for Instagram Reels',
        details: 'Please compress your video or reduce its duration to under 60 seconds'
      }, { status: 400 });
    }
    
    // Minimum file size check (avoid corrupted files)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      return NextResponse.json({ 
        error: 'File size too small. Video file may be corrupted',
        details: 'Please upload a valid video file'
      }, { status: 400 });
    }

    // Generate unique file key
    const userId = session.user.email.replace('@', '_').replace('.', '_');
    
    // Check if R2 is configured
    const isR2Configured = process.env.R2_BUCKET_NAME && 
                          process.env.R2_ENDPOINT && 
                          process.env.R2_ACCESS_KEY_ID && 
                          process.env.R2_SECRET_ACCESS_KEY;

    // Check if R2 is configured
    if (!isR2Configured) {
      console.error('Upload: R2 not configured');
      return NextResponse.json({
        error: 'R2 storage is not configured. Please use direct upload method.',
        details: 'Missing R2 configuration'
      }, { status: 500 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    console.log('Upload: Using R2 storage...');
    const fileKey = r2Storage.generateFileKey(userId, file.name, fileType);
    
    // Sanitize metadata values for R2 headers (remove invalid characters)
    const sanitizeHeaderValue = (value: string) => {
      return value.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_');
    };
    
    const fileUrl = await r2Storage.uploadFile(
      fileKey,
      buffer,
      file.type,
      {
        originalname: sanitizeHeaderValue(file.name),
        uploadedby: sanitizeHeaderValue(session.user.email),
        uploadedat: new Date().toISOString().replace(/[^\w\-]/g, '_'),
        filesize: file.size.toString()
      }
    );
    console.log('Upload: R2 upload successful, URL:', fileUrl);

    return NextResponse.json({
      success: true,
      fileUrl,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Check if it's an R2 configuration error
    if (error.message?.includes('The AWS Access Key Id you provided does not exist')) {
      return NextResponse.json({
        error: 'Invalid R2 credentials. Please check your R2 configuration.',
        details: 'Access key not found'
      }, { status: 500 });
    }
    
    if (error.message?.includes('SignatureDoesNotMatch')) {
      return NextResponse.json({
        error: 'Invalid R2 credentials. Please check your R2 secret key.',
        details: 'Signature mismatch'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to generate signed upload URL for direct client upload
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const contentType = searchParams.get('contentType');

    if (!fileName || !fileType || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, contentType' 
      }, { status: 400 });
    }

    // Check if R2 is configured
    const isR2Configured = process.env.R2_BUCKET_NAME && 
                          process.env.R2_ENDPOINT && 
                          process.env.R2_ACCESS_KEY_ID && 
                          process.env.R2_SECRET_ACCESS_KEY &&
                          process.env.R2_PUBLIC_URL;

    if (!isR2Configured) {
      console.error('R2 configuration missing:', {
        bucket: !!process.env.R2_BUCKET_NAME,
        endpoint: !!process.env.R2_ENDPOINT,
        accessKey: !!process.env.R2_ACCESS_KEY_ID,
        secretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        publicUrl: !!process.env.R2_PUBLIC_URL
      });
      return NextResponse.json({
        error: 'R2 storage is not configured. Please check environment variables.',
        details: 'Missing R2 configuration'
      }, { status: 500 });
    }

    // Generate unique file key
    const userId = session.user.email.replace('@', '_').replace('.', '_');
    const fileKey = r2Storage.generateFileKey(userId, fileName, fileType as 'image' | 'video');

    // Generate signed upload URL (valid for 1 hour)
    const signedUrl = await r2Storage.getSignedUploadUrl(fileKey, contentType, 3600);

    // Generate the final public URL
    const publicUrl = r2Storage.getFileUrl(fileKey);

    return NextResponse.json({
      success: true,
      signedUrl,
      publicUrl,
      fileKey,
      expiresIn: 3600
    });

  } catch (error: any) {
    console.error('Signed URL generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate upload URL',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    // Verify the file belongs to the user (basic security check)
    const userId = session.user.email.replace('@', '_').replace('.', '_');
    if (!fileKey.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    await r2Storage.deleteFile(fileKey);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({
      error: 'Failed to delete file',
      details: error.message
    }, { status: 500 });
  }
}
