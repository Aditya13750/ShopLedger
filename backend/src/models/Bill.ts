import mongoose, { Document, Schema } from 'mongoose';

export interface IBillItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IBillImage {
  url: string;
  publicId?: string;
  fileName?: string;
}

export interface IBill extends Document {
  userId: mongoose.Types.ObjectId;
  billNumber: string;
  customer: mongoose.Types.ObjectId;
  billDate: Date;
  items: IBillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  notes?: string;
  billImage?: IBillImage;
  createdAt: Date;
  updatedAt: Date;
}

const billItemSchema = new Schema<IBillItem>(
  {
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new Schema<IBill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    billDate: { type: Date, required: true, default: Date.now },
    items: { type: [billItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'],
      default: 'UNPAID',
      index: true,
    },
    notes: { type: String, trim: true },
    billImage: {
      url: { type: String },
      publicId: { type: String },
      fileName: { type: String },
    },
  },
  { timestamps: true }
);

export const Bill = mongoose.model<IBill>('Bill', billSchema);
