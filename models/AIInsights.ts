import mongoose from 'mongoose';

const aiInsightsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  platformData: {
    type: Object,
    required: true
  },
  insights: {
    performance_score: {
      type: Number,
      min: 0,
      max: 100
    },
    best_platform: {
      type: String,
      enum: ['instagram', 'youtube', 'combined']
    },
    recommendations: [{
      type: String,
      category: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    }],
    content_suggestions: {
      optimal_posting_times: {
        instagram: String,
        youtube: String
      },
      content_gaps: [String],
      engagement_tips: [String]
    },
    alerts: [{
      type: String,
      severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info'
      },
      message: String
    }],
    reasoning: String,
    metrics: {
      total_engagement_rate: Number,
      content_balance_score: Number,
      posting_frequency_score: Number
    }
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    index: { expireAfterSeconds: 0 }
  },
  isStale: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
aiInsightsSchema.index({ userId: 1, generatedAt: -1 });

export default mongoose.models.AIInsights || mongoose.model('AIInsights', aiInsightsSchema);
