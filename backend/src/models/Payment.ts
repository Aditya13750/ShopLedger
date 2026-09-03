import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  customer: mongoose.Types.ObjectId;
  bill?: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    bill: { type: Schema.Types.ObjectId, ref: 'Bill', index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      required: true,
      default: 'Cash',
    },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
