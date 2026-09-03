import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class PaymentController {
  static async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { customer, bill, amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;

      if (!customer) {
        sendError(res, 'Customer is required to record a payment', 400);
        return;
      }

      if (!amount || Number(amount) <= 0) {
        sendError(res, 'Valid payment amount is required', 400);
        return;
      }

      const payment = await PaymentService.recordPayment({
        customer,
        bill,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod: paymentMethod || 'Cash',
        referenceNumber,
        notes,
      });

      sendSuccess(res, 'Payment recorded successfully', payment, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to record payment', 500);
    }
  }

  static async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, billId, paymentMethod, startDate, endDate, page, limit } = req.query;

      const result = await PaymentService.getPayments({
        customerId: customerId as string,
        billId: billId as string,
        paymentMethod: paymentMethod as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, 'Payments retrieved successfully', result.payments, 200, result.pagination);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve payments', 500);
    }
  }

  static async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await PaymentService.getPaymentById(id);
      if (!payment) {
        sendError(res, 'Payment record not found', 404);
        return;
      }
      sendSuccess(res, 'Payment details retrieved', payment);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve payment', 500);
    }
  }

  static async deletePayment(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await PaymentService.deletePayment(id);
      sendSuccess(res, result.message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete payment', 500);
    }
  }
}
