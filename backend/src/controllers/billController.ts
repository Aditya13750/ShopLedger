import { Request, Response } from 'express';
import { BillingService } from '../services/billingService';
import { WhatsAppService } from '../services/whatsappService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class BillController {
  static async createBill(req: Request, res: Response): Promise<void> {
    try {
      const { customer, items, discount, tax, paidAmount, billDate, notes, billImage } = req.body;

      if (!customer) {
        sendError(res, 'Customer is required to create a bill', 400);
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        sendError(res, 'At least one bill item is required', 400);
        return;
      }

      const bill = await BillingService.createBill({
        customer,
        items,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paidAmount: Number(paidAmount) || 0,
        billDate: billDate ? new Date(billDate) : undefined,
        notes,
        billImage,
      });

      sendSuccess(res, 'Bill created successfully', bill, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create bill', 500);
    }
  }

  static async getBills(req: Request, res: Response): Promise<void> {
    try {
      const { search, customerId, paymentStatus, startDate, endDate, sortBy, sortOrder, page, limit } =
        req.query;

      const result = await BillingService.getBills({
        search: search as string,
        customerId: customerId as string,
        paymentStatus: paymentStatus as any,
        startDate: startDate as string,
        endDate: endDate as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, 'Bills retrieved successfully', result.bills, 200, result.pagination);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve bills', 500);
    }
  }

  static async getBillById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const bill = await BillingService.getBillById(id);
      if (!bill) {
        sendError(res, 'Bill not found', 404);
        return;
      }
      sendSuccess(res, 'Bill retrieved successfully', bill);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve bill', 500);
    }
  }

  static async updateBill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await BillingService.updateBill(id, req.body);
      if (!updated) {
        sendError(res, 'Bill not found', 404);
        return;
      }
      sendSuccess(res, 'Bill updated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update bill', 500);
    }
  }

  static async deleteBill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await BillingService.deleteBill(id);
      sendSuccess(res, result.message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete bill', 500);
    }
  }

  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No image file uploaded', 400);
        return;
      }

      const id = req.params.id as string;
      const updatedBill = await BillingService.uploadBillImage(
        id,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      sendSuccess(res, 'Bill image uploaded successfully', {
        billId: updatedBill._id,
        billImage: updatedBill.billImage,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to upload bill image', 500);
    }
  }

  static async sendWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { recipientPhone, customNote } = req.body;
      const message = await WhatsAppService.sendBill({
        billId: id,
        recipientPhone,
        customNote,
      });

      sendSuccess(res, 'Bill sent on WhatsApp successfully', message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to dispatch bill on WhatsApp', 500);
    }
  }
}
