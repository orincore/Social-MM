import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ContentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  platform: { type: String, enum: ['instagram', 'youtube'], index: true },
  caption: String,
  mediaUrl: String,                        // publicly reachable image URL for test
  status: { type: String, enum: ['draft','scheduled','publishing','published','failed'], default: 'draft' },
  scheduledAt: Date,
  publishError: Schema.Types.Mixed,
  // YouTube specific fields
  title: String,                           // YouTube video title
  description: String,                     // YouTube video description
  tags: [String],                          // YouTube video tags
  categoryId: String,                      // YouTube category ID
  privacyStatus: { type: String, enum: ['private', 'public', 'unlisted'], default: 'public' },
  thumbnailUrl: String,                    // Custom thumbnail URL
  remote: {                                // fields returned by platforms
    // Instagram
    igUserId: String,
    creationId: String,
    mediaId: String,
    permalink: String,
    // YouTube
    youtubeVideoId: String,
    youtubeUrl: String,
    youtubeChannelId: String
  },
  instagramOptions: {
    shareToFeed: { type: Boolean, default: true },
    thumbOffset: { type: Number, default: 0 }
  }
}, { timestamps: true });

export type ContentDoc = InferSchemaType<typeof ContentSchema>;
export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
