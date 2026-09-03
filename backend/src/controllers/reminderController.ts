import { Request, Response } from 'express';
import { ReminderService } from '../services/reminderService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ReminderController {
  static async getReminders(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, status, page, limit } = req.query;
      const userId = (req as any).user?._id;

      const result = await ReminderService.getReminderLogs({
        customerId: customerId as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      }, userId);

      sendSuccess(res, 'Reminder logs retrieved successfully', result.reminders, 200, result.pagination);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve reminder logs', 500);
    }
  }

  static async sendManualReminder(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.body;
      const userId = (req as any).user?._id;

      if (!customerId) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const reminder = await ReminderService.sendManualReminder(customerId, userId);
      sendSuccess(res, 'Payment reminder sent successfully', reminder);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to dispatch manual reminder', 500);
    }
  }

  static async triggerAutomatedReminders(req: Request, res: Response): Promise<void> {
    try {
      const result = await ReminderService.processAutomatedReminders();
      sendSuccess(res, 'Automated reminder cycle executed', result);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to run automated reminders', 500);
    }
  }
}
