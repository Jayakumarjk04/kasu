import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    intent?: string;
    expenseIds?: mongoose.Types.ObjectId[];
    actionTaken?: string;
  };
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Message too long'],
    },
    metadata: {
      intent: String,
      expenseIds: [{ type: Schema.Types.ObjectId, ref: 'Expense' }],
      actionTaken: String,
    },
  },
  {
    timestamps: true,
  }
);

ChatMessageSchema.index({ user: 1, createdAt: -1 });

export const ChatMessage: Model<IChatMessage> = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
