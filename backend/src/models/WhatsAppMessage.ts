import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  userId?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  bill?: mongoose.Types.ObjectId;
  messageType: 'BILL' | 'REMINDER' | 'CUSTOM';
  recipientPhone: string;
  messageContent: string;
  mediaUrl?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentDate: Date;
  whatsappMessageId?: string;
  errorMessage?: string;
  metaApiResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    bill: { type: Schema.Types.ObjectId, ref: 'Bill', index: true },
    messageType: {
      type: String,
      enum: ['BILL', 'REMINDER', 'CUSTOM'],
      required: true,
      index: true,
    },
    recipientPhone: { type: String, required: true },
    messageContent: { type: String, required: true },
    mediaUrl: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    sentDate: { type: Date, default: Date.now },
    whatsappMessageId: { type: String, index: true },
    errorMessage: { type: String },
    metaApiResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>('WhatsAppMessage', whatsAppMessageSchema);
