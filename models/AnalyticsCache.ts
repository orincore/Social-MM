import mongoose from 'mongoose';

const AnalyticsCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  platform: {
    type: String,
    enum: ['instagram', 'youtube', 'combined'],
    required: true,
  },
  period: {
    type: String,
    enum: ['24h', '48h', 'week', 'month', '3months', '6months', 'year', '2years', '5years', 'custom'],
    required: true,
  },
  customStartDate: {
    type: String, // YYYY-MM-DD format
  },
  customEndDate: {
    type: String, // YYYY-MM-DD format
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  isStale: {
    type: Boolean,
    default: false,
  },
  lastFetched: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient lookups
AnalyticsCacheSchema.index({ userId: 1, platform: 1, period: 1, customStartDate: 1, customEndDate: 1 });

// Update the updatedAt field before saving
AnalyticsCacheSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export interface IAnalyticsCache extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  platform: 'instagram' | 'youtube' | 'combined';
  period: string;
  customStartDate?: string;
  customEndDate?: string;
  data: any;
  isStale: boolean;
  lastFetched: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const AnalyticsCache = mongoose.models.AnalyticsCache || mongoose.model<IAnalyticsCache>('AnalyticsCache', AnalyticsCacheSchema);
