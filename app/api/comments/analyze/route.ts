import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { classifyComments, generateCommentSummary } from '@/lib/comment-classifier';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { comments } = await request.json();

    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({
        success: true,
        classifiedComments: [],
        summary: {
          totalComments: 0,
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
          hatefulCount: 0,
          violentCount: 0,
          spamCount: 0,
          averageSentiment: 0,
          criticalInsights: 'No comments to analyze.',
          topConcerns: [],
          recommendations: [],
        },
      });
    }

    console.log(`Analyzing ${comments.length} comments...`);

    const classifiedComments = await classifyComments(comments);

    console.log('Generating summary...');
    const summary = await generateCommentSummary(classifiedComments);

    return NextResponse.json({
      success: true,
      classifiedComments,
      summary,
    });
  } catch (error) {
    console.error('Comment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze comments' },
      { status: 500 }
    );
  }
}
