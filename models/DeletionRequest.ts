import mongoose, { Document, Schema } from 'mongoose';

export interface IDeletionRequest extends Document {
  _id: string;
  userId: string;
  email: string;
  fullName: string;
  reason?: string;
  dataTypes: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  ipAddress?: string;
  notes?: string;
  requestId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeletionRequestSchema = new Schema<IDeletionRequest>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    enum: ['no-longer-needed', 'privacy-concerns', 'switching-services', 'account-security', 'other', ''],
    default: '',
  },
  dataTypes: [{
    type: String,
    enum: ['account', 'content', 'analytics', 'social', 'billing'],
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  processedBy: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

// Indexes
DeletionRequestSchema.index({ userId: 1 });
DeletionRequestSchema.index({ email: 1 });
DeletionRequestSchema.index({ status: 1 });
DeletionRequestSchema.index({ requestId: 1 }, { unique: true });
DeletionRequestSchema.index({ requestedAt: 1 });

export const DeletionRequest = mongoose.models.DeletionRequest || mongoose.model<IDeletionRequest>('DeletionRequest', DeletionRequestSchema);
