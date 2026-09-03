import mongoose from 'mongoose';
import { Bill, IBill, IBillItem } from '../models/Bill';
import { Customer } from '../models/Customer';
import { CustomerService } from './customerService';
import { generateBillNumber } from '../utils/idGenerators';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';

export interface CreateBillDto {
  customer: string;
  billDate?: Date;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: number;
  tax?: number;
  paidAmount?: number;
  notes?: string;
  billImage?: {
    url: string;
    publicId?: string;
    fileName?: string;
  };
}

export interface BillFilterOptions {
  search?: string;
  customerId?: string;
  paymentStatus?: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'ALL';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class BillingService {
  /**
   * Helper to accurately compute bill line items, subtotal, grand total, and due
   */
  static calculateTotals(
    items: Array<{ productName: string; quantity: number; unitPrice: number }>,
    discount = 0,
    tax = 0,
    paidAmount = 0
  ) {
    const computedItems: IBillItem[] = items.map((item) => {
      const q = Math.max(1, Number(item.quantity) || 1);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      return {
        productName: item.productName.trim(),
        quantity: q,
        unitPrice: p,
        total: Math.round(q * p * 100) / 100,
      };
    });

    const subtotal = Math.round(
      computedItems.reduce((sum, item) => sum + item.total, 0) * 100
    ) / 100;

    const validDiscount = Math.max(0, Number(discount) || 0);
    const validTax = Math.max(0, Number(tax) || 0);

    const grandTotal = Math.max(0, Math.round((subtotal - validDiscount + validTax) * 100) / 100);
    const validPaid = Math.max(0, Math.min(grandTotal, Number(paidAmount) || 0));
    const dueAmount = Math.max(0, Math.round((grandTotal - validPaid) * 100) / 100);

    let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'UNPAID';
    if (dueAmount === 0 && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (validPaid > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    return {
      items: computedItems,
      subtotal,
      discount: validDiscount,
      tax: validTax,
      totalAmount: grandTotal,
      paidAmount: validPaid,
      dueAmount,
      paymentStatus,
    };
  }

  static async createBill(dto: CreateBillDto): Promise<IBill> {
    const customer = await Customer.findById(dto.customer);
    if (!customer) {
      throw new Error('Selected customer does not exist');
    }

    const calculated = this.calculateTotals(
      dto.items || [],
      dto.discount,
      dto.tax,
      dto.paidAmount
    );

    const billNumber = await generateBillNumber();

    const bill = new Bill({
      billNumber,
      customer: customer._id,
      billDate: dto.billDate || new Date(),
      items: calculated.items,
      subtotal: calculated.subtotal,
      discount: calculated.discount,
      tax: calculated.tax,
      totalAmount: calculated.totalAmount,
      paidAmount: calculated.paidAmount,
      dueAmount: calculated.dueAmount,
      paymentStatus: calculated.paymentStatus,
      notes: dto.notes,
      billImage: dto.billImage,
    });

    await bill.save();

    // Recalculate customer's totals atomically
    await CustomerService.recalculateCustomerTotals(customer._id);

    return bill.populate('customer');
  }

  static async getBills(options: BillFilterOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.customerId) {
      query.customer = options.customerId;
    }

    if (options.paymentStatus && options.paymentStatus !== 'ALL') {
      query.paymentStatus = options.paymentStatus;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      // If customer matches search
      const matchingCustomers = await Customer.find({
        $or: [{ name: searchRegex }, { phoneNumber: searchRegex }],
      }).select('_id');

      query.$or = [
        { billNumber: searchRegex },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
      ];
    }

    if (options.startDate || options.endDate) {
      query.billDate = {};
      if (options.startDate) query.billDate.$gte = new Date(options.startDate);
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        query.billDate.$lte = end;
      }
    }

    const sortField = options.sortBy || 'createdAt';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate('customer', 'name customerId phoneNumber whatsappNumber email')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bill.countDocuments(query),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getBillById(id: string): Promise<IBill | null> {
    return Bill.findById(id).populate('customer');
  }

  static async updateBill(id: string, dto: Partial<CreateBillDto>): Promise<IBill | null> {
    const bill = await Bill.findById(id);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const items = dto.items ? dto.items : bill.items;
    const discount = dto.discount !== undefined ? dto.discount : bill.discount;
    const tax = dto.tax !== undefined ? dto.tax : bill.tax;
    const paidAmount = dto.paidAmount !== undefined ? dto.paidAmount : bill.paidAmount;

    const calculated = this.calculateTotals(items, discount, tax, paidAmount);

    bill.items = calculated.items;
    bill.subtotal = calculated.subtotal;
    bill.discount = calculated.discount;
    bill.tax = calculated.tax;
    bill.totalAmount = calculated.totalAmount;
    bill.paidAmount = calculated.paidAmount;
    bill.dueAmount = calculated.dueAmount;
    bill.paymentStatus = calculated.paymentStatus;

    if (dto.billDate) bill.billDate = dto.billDate;
    if (dto.notes !== undefined) bill.notes = dto.notes;
    if (dto.billImage) bill.billImage = dto.billImage;

    await bill.save();

    // Recalculate customer totals
    await CustomerService.recalculateCustomerTotals(bill.customer);

    return bill.populate('customer');
  }

  static async deleteBill(id: string): Promise<{ success: boolean; message: string }> {
    const bill = await Bill.findById(id);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const customerId = bill.customer;

    // Delete image from Cloudinary if exists
    if (bill.billImage?.publicId && isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(bill.billImage.publicId);
      } catch (err) {
        console.warn('Could not delete image from Cloudinary:', err);
      }
    }

    await Bill.findByIdAndDelete(id);

    // Sync customer balance
    await CustomerService.recalculateCustomerTotals(customerId);

    return { success: true, message: 'Bill deleted successfully' };
  }

  /**
   * Uploads bill image to Cloudinary (or fallback base64 URI)
   */
  static async uploadBillImage(
    billId: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string
  ) {
    const bill = await Bill.findById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    let imageUrl = '';
    let publicId = '';

    if (isCloudinaryConfigured) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'shopledger/bills',
            resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });

      imageUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } else {
      // Data URI fallback when Cloudinary API credentials are not provided
      imageUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      publicId = `local_${Date.now()}`;
    }

    bill.billImage = {
      url: imageUrl,
      publicId,
      fileName: originalName,
    };

    await bill.save();
    return bill;
  }
}
