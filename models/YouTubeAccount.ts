import mongoose, { Document, Schema } from 'mongoose';

export interface IYouTubeAccount extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  channelId: string;
  channelTitle: string;
  channelHandle?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  uploadsPlaylistId: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl?: string;
  description?: string;
  country?: string;
  isActive: boolean;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const YouTubeAccountSchema = new Schema<IYouTubeAccount>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  channelId: {
    type: String,
    required: true,
    unique: true,
  },
  channelTitle: {
    type: String,
    required: true,
  },
  channelHandle: {
    type: String,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  tokenExpiresAt: {
    type: Date,
    required: true,
  },
  uploadsPlaylistId: {
    type: String,
    required: true,
  },
  subscriberCount: {
    type: Number,
    default: 0,
  },
  videoCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  thumbnailUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  country: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSyncAt: {
    type: Date,
    default: Date.now,
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

// Indexes for performance
YouTubeAccountSchema.index({ userId: 1, isActive: 1 });
YouTubeAccountSchema.index({ tokenExpiresAt: 1 });

// Update the updatedAt field on save
YouTubeAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const YouTubeAccount = mongoose.models.YouTubeAccount || mongoose.model<IYouTubeAccount>('YouTubeAccount', YouTubeAccountSchema);
