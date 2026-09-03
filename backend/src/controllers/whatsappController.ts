import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService';
import { whatsappConfig } from '../config/whatsapp';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class WhatsAppController {
  static async sendBill(req: Request, res: Response): Promise<void> {
    try {
      const { billId, recipientPhone, customNote } = req.body;
      if (!billId) {
        sendError(res, 'Bill ID is required', 400);
        return;
      }

      const message = await WhatsAppService.sendBill({
        billId,
        recipientPhone,
        customNote,
      });

      sendSuccess(res, 'Bill sent via WhatsApp successfully', message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to send bill via WhatsApp', 500);
    }
  }

  static async sendReminder(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, customMessage } = req.body;
      if (!customerId) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const message = await WhatsAppService.sendPaymentReminder({
        customerId,
        customMessage,
      });

      sendSuccess(res, 'Payment reminder sent via WhatsApp successfully', message);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to send payment reminder', 500);
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, messageType, status, page, limit } = req.query;

      const result = await WhatsAppService.getHistory({
        customerId: customerId as string,
        messageType: messageType as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      sendSuccess(res, 'WhatsApp message history retrieved', result.messages, 200, result.pagination);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve WhatsApp history', 500);
    }
  }

  /**
   * Meta Webhook verification handshake:
   * GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...
   */
  static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
      console.log('✅ WhatsApp Meta webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    res.sendStatus(403);
  }

  /**
   * Meta Webhook event receiver:
   * POST /api/whatsapp/webhook
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;
            if (value && value.statuses) {
              for (const statusObj of value.statuses) {
                await WhatsAppService.handleWebhookStatus(statusObj);
              }
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing WhatsApp webhook event:', error);
      res.sendStatus(200); // Meta requires 200 return
    }
  }
}
