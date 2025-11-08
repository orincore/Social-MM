import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ContentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  platform: { type: String, enum: ['instagram'], index: true },
  caption: String,
  mediaUrl: String,                        // publicly reachable image URL for test
  status: { type: String, enum: ['draft','scheduled','publishing','published','failed'], default: 'draft' },
  scheduledAt: Date,
  publishError: Schema.Types.Mixed,
  remote: {                                // fields returned by IG
    igUserId: String,
    creationId: String,
    mediaId: String,
    permalink: String
  }
}, { timestamps: true });

export type ContentDoc = InferSchemaType<typeof ContentSchema>;
export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
