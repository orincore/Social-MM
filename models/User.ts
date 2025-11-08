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
  lastLoginAt: Date
}, { timestamps: true });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export default mongoose.models.User || mongoose.model('User', UserSchema);
