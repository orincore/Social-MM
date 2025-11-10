import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';

// Models
import User from '@/models/User';
import { DeletionRequest } from '@/models/DeletionRequest';

// Helper function to get status message
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Your deletion request is pending review. We will process it within 30 days.';
    case 'in_progress':
      return 'Your deletion request is currently being processed. This may take a few days to complete.';
    case 'completed':
      return 'Your data has been successfully deleted from our systems.';
    case 'rejected':
      return 'Your deletion request was rejected. Please contact support for more information.';
    default:
      return 'Unknown status. Please contact support for assistance.';
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, fullName, reason, dataTypes } = body;

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate unique request ID
    const requestId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create deletion request record
    const deletionRequest = await DeletionRequest.create({
      userId: user._id,
      email: email.toLowerCase(),
      fullName,
      reason: reason || '',
      dataTypes: dataTypes || [],
      requestedAt: new Date(),
      status: 'pending',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      requestId
    });

    console.log('Data deletion request created:', deletionRequest._id);

    // Send notification email to admin (implement email service)
    // await sendDeletionRequestNotification(deletionRequest);

    // Send confirmation email to user (implement email service)
    // await sendDeletionConfirmationEmail(user.email, requestId);

    return NextResponse.json({
      success: true,
      message: 'Data deletion request submitted successfully',
      requestId: requestId,
      estimatedProcessingTime: '30 days'
    });

  } catch (error) {
    console.error('Error processing deletion request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check deletion request status (optional)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const requestId = url.searchParams.get('requestId');
    const email = url.searchParams.get('email');

    if (!requestId && !email) {
      return NextResponse.json(
        { error: 'Request ID or email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let deletionRequest;
    
    if (requestId) {
      deletionRequest = await DeletionRequest.findOne({ requestId });
    } else if (email) {
      deletionRequest = await DeletionRequest.findOne({ 
        email: email.toLowerCase() 
      }).sort({ requestedAt: -1 }); // Get the most recent request
    }

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      requestId: deletionRequest.requestId,
      status: deletionRequest.status,
      requestedAt: deletionRequest.requestedAt,
      processedAt: deletionRequest.processedAt,
      message: getStatusMessage(deletionRequest.status),
      estimatedCompletion: deletionRequest.processedAt || 
        new Date(deletionRequest.requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error checking deletion status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
