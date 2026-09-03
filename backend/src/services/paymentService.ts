import mongoose from 'mongoose';
import { Payment, IPayment } from '../models/Payment';
import { Bill } from '../models/Bill';
import { Customer } from '../models/Customer';
import { CustomerService } from './customerService';

export interface CreatePaymentDto {
  customer: string;
  bill?: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentFilterOptions {
  customerId?: string;
  billId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class PaymentService {
  static async recordPayment(dto: CreatePaymentDto): Promise<IPayment> {
    const customer = await Customer.findById(dto.customer);
    if (!customer) {
      throw new Error('Customer does not exist');
    }

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // If linked to a specific bill, apply payment to bill
    if (dto.bill) {
      const bill = await Bill.findById(dto.bill);
      if (bill) {
        bill.paidAmount = Math.round((bill.paidAmount + amount) * 100) / 100;
        bill.dueAmount = Math.max(0, Math.round((bill.totalAmount - bill.paidAmount) * 100) / 100);

        if (bill.dueAmount === 0) {
          bill.paymentStatus = 'PAID';
        } else if (bill.paidAmount > 0) {
          bill.paymentStatus = 'PARTIALLY_PAID';
        } else {
          bill.paymentStatus = 'UNPAID';
        }

        await bill.save();
      }
    }

    const payment = new Payment({
      customer: customer._id,
      bill: dto.bill ? new mongoose.Types.ObjectId(dto.bill) : undefined,
      amount,
      paymentDate: dto.paymentDate || new Date(),
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
    });

    await payment.save();

    // Recalculate customer's balance and totals
    await CustomerService.recalculateCustomerTotals(customer._id);

    return payment.populate(['customer', 'bill']);
  }

  static async getPayments(options: PaymentFilterOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.customerId) {
      query.customer = options.customerId;
    }

    if (options.billId) {
      query.bill = options.billId;
    }

    if (options.paymentMethod && options.paymentMethod !== 'ALL') {
      query.paymentMethod = options.paymentMethod;
    }

    if (options.startDate || options.endDate) {
      query.paymentDate = {};
      if (options.startDate) query.paymentDate.$gte = new Date(options.startDate);
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('customer', 'name customerId phoneNumber')
        .populate('bill', 'billNumber totalAmount dueAmount')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPaymentById(id: string): Promise<IPayment | null> {
    return Payment.findById(id).populate(['customer', 'bill']);
  }

  static async deletePayment(id: string): Promise<{ success: boolean; message: string }> {
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    const customerId = payment.customer;
    const billId = payment.bill;
    const amount = payment.amount;

    // Reverse payment on bill if applicable
    if (billId) {
      const bill = await Bill.findById(billId);
      if (bill) {
        bill.paidAmount = Math.max(0, Math.round((bill.paidAmount - amount) * 100) / 100);
        bill.dueAmount = Math.max(0, Math.round((bill.totalAmount - bill.paidAmount) * 100) / 100);
        if (bill.dueAmount === 0 && bill.totalAmount > 0) {
          bill.paymentStatus = 'PAID';
        } else if (bill.paidAmount > 0) {
          bill.paymentStatus = 'PARTIALLY_PAID';
        } else {
          bill.paymentStatus = 'UNPAID';
        }
        await bill.save();
      }
    }

    await Payment.findByIdAndDelete(id);

    // Recompute customer balance accurately
    await CustomerService.recalculateCustomerTotals(customerId);

    return { success: true, message: 'Payment deleted and balances restored successfully' };
  }
}
