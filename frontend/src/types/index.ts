export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Customer {
  _id: string;
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
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillImage {
  url: string;
  publicId?: string;
  fileName?: string;
}

export interface Bill {
  _id: string;
  billNumber: string;
  customer: Customer | string;
  billDate: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  notes?: string;
  billImage?: BillImage;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  customer: Customer | string;
  bill?: Bill | string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'BILL' | 'PAYMENT';
  referenceNumber: string;
  description: string;
  billAmount: number;
  paymentAmount: number;
  runningBalance: number;
  paymentMethod?: string;
  billId?: string;
  paymentId?: string;
  billImage?: BillImage;
}

export interface CustomerLedgerResponse {
  customer: Customer;
  summary: {
    totalBillAmount: number;
    totalPaidAmount: number;
    totalDueAmount: number;
    currentBalance: number;
    totalTransactions: number;
  };
  ledger: LedgerEntry[];
}

export interface WhatsAppMessage {
  _id: string;
  customer: Customer | string;
  bill?: Bill | string;
  messageType: 'BILL' | 'REMINDER' | 'CUSTOM';
  recipientPhone: string;
  messageContent: string;
  mediaUrl?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentDate: string;
  whatsappMessageId?: string;
  errorMessage?: string;
  metaApiResponse?: any;
  createdAt: string;
}

export interface ReminderLog {
  _id: string;
  customer: Customer | string;
  dueAmount: number;
  reminderDate: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  messageId?: string;
  error?: string;
  triggerType: 'AUTOMATIC' | 'MANUAL';
  createdAt: string;
}

export interface ShopSettings {
  _id: string;
  shopName: string;
  shopPhone: string;
  shopEmail?: string;
  shopAddress?: string;
  currencySymbol: string;
  reminderSettings: {
    enabled: boolean;
    frequency: 'DAILY' | 'EVERY_3_DAYS' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    customIntervalDays: number;
    reminderTime: string;
    minimumDueAmount: number;
    lastRunDate?: string;
  };
  whatsappSettings: {
    sendBillImage: boolean;
    customBillMessageTemplate?: string;
    customReminderMessageTemplate?: string;
  };
  integrations?: {
    whatsappConfigured: boolean;
    cloudinaryConfigured: boolean;
    whatsappPhoneNumberId: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Pagination;
  errors?: any[];
}
