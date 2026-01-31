import mongoose, { Schema, InferSchemaType } from 'mongoose';

const CommentSchema = new Schema(
  {
    id: { type: String, required: true },
    text: String,
    author: String,
    timestamp: String,
    platform: String,
    contentId: String,
    contentTitle: String,
    contentUrl: String,
    category: String,
    sentiment: Number,
    toxicity: Number,
    reasoning: String,
  },
  { _id: false }
);

const SummarySchema = new Schema(
  {
    totalComments: Number,
    positiveCount: Number,
    neutralCount: Number,
    negativeCount: Number,
    hatefulCount: Number,
    violentCount: Number,
    spamCount: Number,
    averageSentiment: Number,
    criticalInsights: String,
    topConcerns: [String],
    recommendations: [String],
  },
  { _id: false }
);

const CommentAnalysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, enum: ['all', 'instagram', 'youtube'], required: true },
    timeRange: { type: String, enum: ['24h', '7d', '28d', '1y', '5y'], required: true },
    comments: [CommentSchema],
    summary: SummarySchema,
    refreshedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

CommentAnalysisSchema.index({ userId: 1, platform: 1, timeRange: 1 }, { unique: true });

export type CommentAnalysisDoc = InferSchemaType<typeof CommentAnalysisSchema>;
export default mongoose.models.CommentAnalysis || mongoose.model('CommentAnalysis', CommentAnalysisSchema);
