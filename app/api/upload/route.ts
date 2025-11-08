import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { r2Storage } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    };

    const fileType = type === 'video' ? 'video' : 'image';
    if (!allowedTypes[fileType].includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedTypes[fileType].join(', ')}` 
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
    const fileKey = r2Storage.generateFileKey(userId, file.name, fileType);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2
    const fileUrl = await r2Storage.uploadFile(
      fileKey,
      buffer,
      file.type,
      {
        originalName: file.name,
        uploadedBy: session.user.email,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString()
      }
    );

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
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error.message
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
