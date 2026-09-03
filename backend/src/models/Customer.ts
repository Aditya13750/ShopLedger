import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  name: string;
  phoneNumber: string;
  whatsappNumber: string;
  email?: string;
  address?: string;
  notes?: string;
  totalBillAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phoneNumber: { type: String, required: true, trim: true, index: true },
    whatsappNumber: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    totalBillAmount: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    totalDueAmount: { type: Number, default: 0, index: true },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound text search index for fast lookup
customerSchema.index({ name: 'text', phoneNumber: 'text', customerId: 'text' });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
