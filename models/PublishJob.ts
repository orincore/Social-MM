import mongoose, { Document, Schema } from 'mongoose';

export interface IPublishJob extends Document {
  _id: string;
  contentId: string;
  userId: string;
  platform: 'instagram' | 'facebook' | 'youtube';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  result?: {
    success: boolean;
    postId?: string;
    error?: string;
    response?: any;
  };
  metadata?: {
    queueId?: string;
    cronJobId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PublishJobSchema = new Schema<IPublishJob>({
  contentId: {
    type: String,
    required: true,
    ref: 'Content',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'facebook', 'youtube'],
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
    default: 'pending',
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  lastAttemptAt: {
    type: Date,
    default: null,
  },
  nextRetryAt: {
    type: Date,
    default: null,
  },
  result: {
    success: Boolean,
    postId: String,
    error: String,
    response: Schema.Types.Mixed,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

PublishJobSchema.index({ contentId: 1, platform: 1 }, { unique: true });
PublishJobSchema.index({ status: 1, scheduledAt: 1 });
PublishJobSchema.index({ userId: 1, status: 1 });
PublishJobSchema.index({ nextRetryAt: 1, status: 1 });

export const PublishJob = mongoose.models.PublishJob || mongoose.model<IPublishJob>('PublishJob', PublishJobSchema);
