import mongoose, { Schema, Document } from 'mongoose';

export interface IPageShare extends Document {
  pageId: mongoose.Types.ObjectId;
  sharedBy: mongoose.Types.ObjectId;
  sharedWith: string; // email address
  permission: 'view' | 'edit';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitationToken: string;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId; // User ID if they accept
  createdAt: Date;
  updatedAt: Date;
}

const PageShareSchema: Schema = new Schema(
  {
    pageId: {
      type: Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    invitationToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PageShareSchema.index({ pageId: 1, sharedWith: 1 });
PageShareSchema.index({ invitationToken: 1 });
PageShareSchema.index({ sharedBy: 1, status: 1 });
PageShareSchema.index({ sharedWith: 1, status: 1 });
PageShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save middleware to generate invitation token
PageShareSchema.pre('save', function (next) {
  if (this.isNew && !this.invitationToken) {
    // Generate a secure random token
    this.invitationToken = require('crypto')
      .randomBytes(32)
      .toString('hex');
  }
  next();
});

// Static method to find active shares for a page
PageShareSchema.statics.findActiveSharesForPage = function (pageId: string) {
  return this.find({
    pageId,
    status: { $in: ['pending', 'accepted'] },
    expiresAt: { $gt: new Date() },
  });
};

// Static method to find pending invitations for a user
PageShareSchema.statics.findPendingInvitations = function (email: string) {
  return this.find({
    sharedWith: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).populate('pageId', 'title notebookId').populate('sharedBy', 'displayName email');
};

// Instance method to accept invitation
PageShareSchema.methods.accept = function (userId: mongoose.Types.ObjectId) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

// Instance method to decline invitation
PageShareSchema.methods.decline = function () {
  this.status = 'declined';
  this.declinedAt = new Date();
  return this.save();
};

// Instance method to check if invitation is expired
PageShareSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

export default mongoose.model<IPageShare>('PageShare', PageShareSchema);

