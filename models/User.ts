import mongoose, { Schema, InferSchemaType } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, index: true },
  name: String,
  image: String,
  phone: String,
  locale: String,
  timezone: String,
  subscriptionPlan: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' },
  profileCompletedAt: Date,
  lastLoginAt: Date,
  // Platform integrations stored directly in user profile
  instagram: {
    connected: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    instagramId: String,
    username: String,
    accountType: String,
    profilePictureUrl: String,
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    mediaCount: { type: Number, default: 0 },
    biography: String,
    connectedAt: Date
  },
  youtube: {
    connected: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    channelId: String,
    channelTitle: String,
    channelDescription: String,
    thumbnailUrl: String,
    subscriberCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    connectedAt: Date
  }
}, { timestamps: true });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default mongoose.models.User || mongoose.model('User', UserSchema);
