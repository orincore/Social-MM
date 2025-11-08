import mongoose, { Schema, InferSchemaType } from 'mongoose';

const SocialAccountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  provider: { type: String, enum: ['instagram'], index: true },
  providerUserId: { type: String, index: true },
  username: String,
  accessToken: { type: String },          // store encrypted in production
  refreshToken: { type: String },         // optional for IG
  tokenType: String,
  expiresAt: Date,
  scopes: [String],
  pageId: String,                          // if you later map FB page -> IG biz acct
}, { timestamps: true });

export type SocialAccountDoc = InferSchemaType<typeof SocialAccountSchema>;
export default mongoose.models.SocialAccount || mongoose.model('SocialAccount', SocialAccountSchema);
