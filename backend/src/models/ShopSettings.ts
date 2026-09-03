import mongoose, { Document, Schema } from 'mongoose';

export interface IShopSettings extends Document {
  userId?: mongoose.Types.ObjectId;
  shopName: string;
  shopPhone: string;
  shopEmail?: string;
  shopAddress?: string;
  currencySymbol: string;
  reminderSettings: {
    enabled: boolean;
    frequency: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    customIntervalDays: number;
    reminderTime: string; // e.g. "10:00"
    minimumDueAmount: number;
    lastRunDate?: Date;
  };
  whatsappSettings: {
    sendBillImage: boolean;
    customBillMessageTemplate?: string;
    customReminderMessageTemplate?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const shopSettingsSchema = new Schema<IShopSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    shopName: { type: String, required: true, default: 'ShopLedger Mart' },
    shopPhone: { type: String, required: true, default: '+919876543210' },
    shopEmail: { type: String, default: 'support@shopledger.com' },
    shopAddress: { type: String, default: 'Main Market, City Center' },
    currencySymbol: { type: String, default: '₹' },
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['DAILY', 'EVERY_3_DAYS', 'WEEKLY', 'MONTHLY', 'CUSTOM'],
        default: 'WEEKLY',
      },
      customIntervalDays: { type: Number, default: 7 },
      reminderTime: { type: String, default: '10:00' },
      minimumDueAmount: { type: Number, default: 100 },
      lastRunDate: { type: Date },
    },
    whatsappSettings: {
      sendBillImage: { type: Boolean, default: true },
      customBillMessageTemplate: { type: String },
      customReminderMessageTemplate: { type: String },
    },
  },
  { timestamps: true }
);

export const ShopSettings = mongoose.model<IShopSettings>('ShopSettings', shopSettingsSchema);
