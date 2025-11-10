import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { r2Storage } from '@/lib/r2-storage';
import { localStorage } from '@/lib/local-storage';

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

    // Since Instagram Reels only support MP4 upload via API, enforce MP4 files
    const allowedTypes = ['video/mp4'];
    const fileType = 'video'; // Always video
    const isMp4Mime = allowedTypes.includes(file.type);
    const isMp4Extension = file.name?.toLowerCase().endsWith('.mp4');
    console.log('Upload: File type validation:', {
      fileType,
      actualFileType: file.type,
      allowedTypes,
      isMp4Mime,
      isMp4Extension
    });

    if (!isMp4Mime || !isMp4Extension) {
      console.log('Upload: Invalid file type for Instagram requirements');
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload an MP4 video (H.264/AAC) to ensure Instagram compatibility.'
      }, { status: 400 });
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 100MB' 
      }, { status: 400 });
    }

    // Generate unique file key
    const userId = session.user.email.replace('@', '_').replace('.', '_');
    
    // Check if R2 is configured
    const isR2Configured = process.env.R2_BUCKET_NAME && 
                          process.env.R2_ENDPOINT && 
                          process.env.R2_ACCESS_KEY_ID && 
                          process.env.R2_SECRET_ACCESS_KEY;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let fileUrl: string;
    let fileKey: string;

    // Try R2 first, fallback to local storage if it fails
    if (isR2Configured) {
      try {
        console.log('Upload: Using R2 storage...');
        fileKey = r2Storage.generateFileKey(userId, file.name, fileType);
        
        // Sanitize metadata values for R2 headers (remove invalid characters)
        const sanitizeHeaderValue = (value: string) => {
          return value.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_');
        };
        
        fileUrl = await r2Storage.uploadFile(
          fileKey,
          buffer,
          file.type,
          {
            originalname: sanitizeHeaderValue(file.name), // Changed key name and sanitized value
            uploadedby: sanitizeHeaderValue(session.user.email),
            uploadedat: new Date().toISOString().replace(/[^\w\-]/g, '_'), // Sanitize ISO string
            filesize: file.size.toString()
          }
        );
        console.log('Upload: R2 upload successful, URL:', fileUrl);
      } catch (r2Error: any) {
        console.log('Upload: R2 failed, falling back to local storage:', r2Error?.message || 'Unknown error');
        // Fallback to local storage
        fileKey = localStorage.generateFileKey(userId, file.name, fileType);
        
        const sanitizeHeaderValue = (value: string) => {
          return value.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_');
        };
        
        fileUrl = await localStorage.uploadFile(
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
        console.log('Upload: Local storage fallback successful, URL:', fileUrl);
      }
    } else {
      console.log('Upload: R2 not configured, using local storage...');
      fileKey = localStorage.generateFileKey(userId, file.name, fileType);
      
      // Use same sanitization for consistency
      const sanitizeHeaderValue = (value: string) => {
        return value.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_');
      };
      
      fileUrl = await localStorage.uploadFile(
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
      console.log('Upload: Local storage upload successful, URL:', fileUrl);
    }

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
      details: error.message
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
