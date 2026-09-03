import mongoose from 'mongoose';
import { Customer, ICustomer } from '../models/Customer';
import { Bill } from '../models/Bill';
import { Payment } from '../models/Payment';
import { generateCustomerId } from '../utils/idGenerators';

export interface CustomerFilterOptions {
  search?: string;
  dueFilter?: 'all' | 'has_due' | 'zero_due';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LedgerEntry {
  id: string;
  date: Date;
  type: 'BILL' | 'PAYMENT';
  referenceNumber: string;
  description: string;
  billAmount: number;
  paymentAmount: number;
  runningBalance: number;
  paymentMethod?: string;
  billId?: string;
  paymentId?: string;
  billImage?: { url: string };
}

export class CustomerService {
  /**
   * Recalculates and updates customer's totals reliably from existing bills and payments
   */
  static async recalculateCustomerTotals(customerId: string | mongoose.Types.ObjectId): Promise<ICustomer | null> {
    const customerObjId = typeof customerId === 'string' ? new mongoose.Types.ObjectId(customerId) : customerId;

    const [billTotals] = await Bill.aggregate([
      { $match: { customer: customerObjId } },
      {
        $group: {
          _id: null,
          totalBill: { $sum: '$totalAmount' },
          totalPaidOnBills: { $sum: '$paidAmount' },
        },
      },
    ]);

    const [paymentTotals] = await Payment.aggregate([
      { $match: { customer: customerObjId } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
        },
      },
    ]);

    const totalBillAmount = billTotals?.totalBill || 0;
    const totalPaidAmount = paymentTotals?.totalPaid || billTotals?.totalPaidOnBills || 0;
    const totalDueAmount = Math.max(0, totalBillAmount - totalPaidAmount);

    return Customer.findByIdAndUpdate(
      customerObjId,
      {
        totalBillAmount,
        totalPaidAmount,
        totalDueAmount,
        lastActivity: new Date(),
      },
      { new: true }
    );
  }

  static async createCustomer(data: Partial<ICustomer>, userId?: any): Promise<ICustomer> {
    const customerId = await generateCustomerId();
    const customer = new Customer({
      ...data,
      ...(userId ? { userId } : {}),
      customerId,
      totalBillAmount: 0,
      totalPaidAmount: 0,
      totalDueAmount: 0,
      lastActivity: new Date(),
    });
    return customer.save();
  }

  static async getCustomers(options: CustomerFilterOptions, userId?: any) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phoneNumber: searchRegex },
        { whatsappNumber: searchRegex },
        { customerId: searchRegex },
      ];
    }

    if (options.dueFilter === 'has_due') {
      query.totalDueAmount = { $gt: 0 };
    } else if (options.dueFilter === 'zero_due') {
      query.totalDueAmount = { $lte: 0 };
    }

    const sortField = options.sortBy || 'lastActivity';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDir };

    const [customers, total] = await Promise.all([
      Customer.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Customer.countDocuments(query),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: string, userId?: any): Promise<ICustomer | null> {
    const query = userId ? { _id: id, userId } : { _id: id };
    return Customer.findOne(query);
  }

  static async updateCustomer(id: string, data: Partial<ICustomer>, userId?: any): Promise<ICustomer | null> {
    const query = userId ? { _id: id, userId } : { _id: id };
    return Customer.findOneAndUpdate(
      query,
      { ...data, lastActivity: new Date() },
      { new: true, runValidators: true }
    );
  }

  static async deleteCustomer(id: string, userId?: any): Promise<{ success: boolean; message: string }> {
    const query = userId ? { _id: id, userId } : { _id: id };
    const customer = await Customer.findOne(query);
    if (!customer) {
      throw new Error('Customer not found');
    }
    const billCount = await Bill.countDocuments({ customer: id });
    if (billCount > 0) {
      // Prevent accidental deletion or cascade
      await Bill.deleteMany({ customer: id });
      await Payment.deleteMany({ customer: id });
    }
    await Customer.findByIdAndDelete(id);
    return { success: true, message: 'Customer and related records deleted successfully' };
  }

  /**
   * Generates a chronologically sorted ledger with accurate running balances
   */
  static async getCustomerLedger(customerId: string, userId?: any) {
    const query = userId ? { _id: customerId, userId } : { _id: customerId };
    const customer = await Customer.findOne(query).lean();
    if (!customer) {
      throw new Error('Customer not found');
    }

    const [bills, payments] = await Promise.all([
      Bill.find({ customer: customerId }).sort({ billDate: 1, createdAt: 1 }).lean(),
      Payment.find({ customer: customerId }).sort({ paymentDate: 1, createdAt: 1 }).lean(),
    ]);

    type RawLedgerItem = {
      id: string;
      date: Date;
      type: 'BILL' | 'PAYMENT';
      referenceNumber: string;
      description: string;
      billAmount: number;
      paymentAmount: number;
      paymentMethod?: string;
      billId?: string;
      paymentId?: string;
      billImage?: any;
    };

    const combined: RawLedgerItem[] = [];

    for (const b of bills) {
      combined.push({
        id: b._id.toString(),
        date: b.billDate || b.createdAt,
        type: 'BILL',
        referenceNumber: b.billNumber,
        description: `Bill #${b.billNumber} (${b.items.length} item${b.items.length > 1 ? 's' : ''})`,
        billAmount: b.totalAmount,
        paymentAmount: 0,
        billId: b._id.toString(),
        billImage: b.billImage,
      });
    }

    for (const p of payments) {
      combined.push({
        id: p._id.toString(),
        date: p.paymentDate || p.createdAt,
        type: 'PAYMENT',
        referenceNumber: p.referenceNumber || 'PAY-' + p._id.toString().slice(-6).toUpperCase(),
        description: `${p.paymentMethod} Payment${p.notes ? ' - ' + p.notes : ''}`,
        billAmount: 0,
        paymentAmount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentId: p._id.toString(),
      });
    }

    // Sort strictly by transaction date
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledgerEntries: LedgerEntry[] = combined.map((item) => {
      if (item.type === 'BILL') {
        runningBalance += item.billAmount;
      } else {
        runningBalance -= item.paymentAmount;
      }

      return {
        ...item,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    return {
      customer,
      summary: {
        totalBillAmount: customer.totalBillAmount,
        totalPaidAmount: customer.totalPaidAmount,
        totalDueAmount: customer.totalDueAmount,
        currentBalance: runningBalance,
        totalTransactions: ledgerEntries.length,
      },
      ledger: ledgerEntries,
    };
  }
}
