import mongoose from 'mongoose';

const InstagramAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  instagramId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    enum: ['PERSONAL', 'BUSINESS'],
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  tokenExpiresAt: {
    type: Date,
    required: true,
  },
  profilePictureUrl: {
    type: String,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  mediaCount: {
    type: Number,
    default: 0,
  },
  biography: {
    type: String,
  },
  website: {
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

// Update the updatedAt field before saving
InstagramAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better performance
InstagramAccountSchema.index({ userId: 1 });
InstagramAccountSchema.index({ username: 1 });

export interface IInstagramAccount extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  instagramId: string;
  username: string;
  accountType: 'PERSONAL' | 'BUSINESS';
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
  profilePictureUrl?: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  biography?: string;
  website?: string;
  isActive: boolean;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const InstagramAccount = mongoose.models.InstagramAccount || mongoose.model<IInstagramAccount>('InstagramAccount', InstagramAccountSchema);
