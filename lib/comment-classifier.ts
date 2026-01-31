import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CommentClassification {
  text: string;
  category: 'positive' | 'neutral' | 'negative' | 'hateful' | 'violent' | 'spam';
  sentiment: number; // -1 to 1
  toxicity: number; // 0 to 1
  reasoning: string;
}

export interface CommentAnalysisSummary {
  totalComments: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  hatefulCount: number;
  violentCount: number;
  spamCount: number;
  averageSentiment: number;
  criticalInsights: string;
  topConcerns: string[];
  recommendations: string[];
}

export async function classifyComments(
  comments: Array<{ text: string; id: string; author: string; timestamp: string }>
): Promise<Array<CommentClassification & { id: string; author: string; timestamp: string }>> {
  if (comments.length === 0) return [];

  const batchSize = 10;
  const results: Array<CommentClassification & { id: string; author: string; timestamp: string }> = [];

  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    
    const prompt = `Analyze the following social media comments and classify each one. For each comment, determine:
1. Category: positive, neutral, negative, hateful, violent, or spam
2. Sentiment score: -1 (very negative) to 1 (very positive)
3. Toxicity score: 0 (not toxic) to 1 (highly toxic)
4. Brief reasoning for the classification

Comments to analyze:
${batch.map((c, idx) => `[${idx}] ${c.text}`).join('\n')}

Return a JSON array with this structure for each comment:
[
  {
    "index": 0,
    "category": "positive|neutral|negative|hateful|violent|spam",
    "sentiment": 0.5,
    "toxicity": 0.1,
    "reasoning": "Brief explanation"
  }
]

Be strict with hateful and violent classifications. Hateful includes racism, sexism, homophobia, religious hatred. Violent includes threats, calls for violence, graphic descriptions.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content moderator analyzing social media comments. Return only valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      let responseText = completion.choices[0]?.message?.content?.trim() || '[]';
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const classifications = JSON.parse(responseText);
      
      for (const classification of classifications) {
        const originalComment = batch[classification.index];
        if (originalComment) {
          results.push({
            id: originalComment.id,
            text: originalComment.text,
            author: originalComment.author,
            timestamp: originalComment.timestamp,
            category: classification.category,
            sentiment: classification.sentiment,
            toxicity: classification.toxicity,
            reasoning: classification.reasoning,
          });
        }
      }
    } catch (error) {
      console.error('Comment classification error:', error);
      
      for (const comment of batch) {
        results.push({
          id: comment.id,
          text: comment.text,
          author: comment.author,
          timestamp: comment.timestamp,
          category: 'neutral',
          sentiment: 0,
          toxicity: 0,
          reasoning: 'Classification failed',
        });
      }
    }
  }

  return results;
}

export async function generateCommentSummary(
  classifiedComments: CommentClassification[]
): Promise<CommentAnalysisSummary> {
  const totalComments = classifiedComments.length;
  
  if (totalComments === 0) {
    return {
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
    };
  }

  const positiveCount = classifiedComments.filter(c => c.category === 'positive').length;
  const neutralCount = classifiedComments.filter(c => c.category === 'neutral').length;
  const negativeCount = classifiedComments.filter(c => c.category === 'negative').length;
  const hatefulCount = classifiedComments.filter(c => c.category === 'hateful').length;
  const violentCount = classifiedComments.filter(c => c.category === 'violent').length;
  const spamCount = classifiedComments.filter(c => c.category === 'spam').length;
  
  const averageSentiment = classifiedComments.reduce((sum, c) => sum + c.sentiment, 0) / totalComments;

  const problematicComments = classifiedComments
    .filter(c => ['hateful', 'violent', 'negative'].includes(c.category))
    .slice(0, 10);

  const summaryPrompt = `Analyze this comment data and provide critical insights:

Total comments: ${totalComments}
Positive: ${positiveCount} (${((positiveCount / totalComments) * 100).toFixed(1)}%)
Neutral: ${neutralCount} (${((neutralCount / totalComments) * 100).toFixed(1)}%)
Negative: ${negativeCount} (${((negativeCount / totalComments) * 100).toFixed(1)}%)
Hateful: ${hatefulCount} (${((hatefulCount / totalComments) * 100).toFixed(1)}%)
Violent: ${violentCount} (${((violentCount / totalComments) * 100).toFixed(1)}%)
Spam: ${spamCount} (${((spamCount / totalComments) * 100).toFixed(1)}%)
Average sentiment: ${averageSentiment.toFixed(2)}

Sample problematic comments:
${problematicComments.map(c => `- [${c.category}] ${c.text.substring(0, 100)}`).join('\n')}

Provide:
1. Critical insights (2-3 sentences about overall comment health)
2. Top 3 concerns (specific issues to address)
3. Top 3 recommendations (actionable steps)

Return as JSON:
{
  "criticalInsights": "string",
  "topConcerns": ["concern1", "concern2", "concern3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a social media analyst providing actionable insights. Return only valid JSON.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    let responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const analysis = JSON.parse(responseText);

    return {
      totalComments,
      positiveCount,
      neutralCount,
      negativeCount,
      hatefulCount,
      violentCount,
      spamCount,
      averageSentiment,
      criticalInsights: analysis.criticalInsights || 'Analysis unavailable',
      topConcerns: analysis.topConcerns || [],
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    
    return {
      totalComments,
      positiveCount,
      neutralCount,
      negativeCount,
      hatefulCount,
      violentCount,
      spamCount,
      averageSentiment,
      criticalInsights: 'Unable to generate detailed insights at this time.',
      topConcerns: [],
      recommendations: [],
    };
  }
}
