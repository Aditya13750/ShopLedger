import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  dueAmount: number;
  reminderDate: Date;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  messageId?: string;
  error?: string;
  triggerType: 'AUTOMATIC' | 'MANUAL';
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    dueAmount: { type: Number, required: true },
    reminderDate: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SKIPPED'],
      default: 'SENT',
      index: true,
    },
    messageId: { type: String },
    error: { type: String },
    triggerType: {
      type: String,
      enum: ['AUTOMATIC', 'MANUAL'],
      default: 'AUTOMATIC',
    },
  },
  { timestamps: true }
);

export const Reminder = mongoose.model<IReminder>('Reminder', reminderSchema);
