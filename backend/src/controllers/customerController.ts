import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class CustomerController {
  static async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { name, phoneNumber, whatsappNumber, email, address, notes } = req.body;

      if (!name || !phoneNumber) {
        sendError(res, 'Customer name and phone number are required', 400);
        return;
      }

      const customer = await CustomerService.createCustomer({
        name,
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        email,
        address,
        notes,
      });

      sendSuccess(res, 'Customer created successfully', customer, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create customer', 500);
    }
  }

  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { search, dueFilter, sortBy, sortOrder, page, limit } = req.query;

      const result = await CustomerService.getCustomers({
        search: search as string,
        dueFilter: dueFilter as any,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, 'Customers retrieved successfully', result.customers, 200, result.pagination);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve customers', 500);
    }
  }

  static async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const customer = await CustomerService.getCustomerById(id);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }
      sendSuccess(res, 'Customer details retrieved', customer);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve customer', 500);
    }
  }

  static async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await CustomerService.updateCustomer(id, req.body);
      if (!updated) {
        sendError(res, 'Customer not found', 404);
        return;
      }
      sendSuccess(res, 'Customer updated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update customer', 500);
    }
  }

  static async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await CustomerService.deleteCustomer(id);
      sendSuccess(res, result.message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete customer', 500);
    }
  }

  static async getCustomerLedger(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const ledgerData = await CustomerService.getCustomerLedger(id);
      sendSuccess(res, 'Customer ledger generated successfully', ledgerData);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to generate customer ledger', 500);
    }
  }

  static async recalculateTotals(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await CustomerService.recalculateCustomerTotals(id);
      if (!updated) {
        sendError(res, 'Customer not found', 404);
        return;
      }
      sendSuccess(res, 'Customer balances recalculated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to recalculate balances', 500);
    }
  }
}
