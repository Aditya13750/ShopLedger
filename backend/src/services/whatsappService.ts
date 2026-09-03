import axios from 'axios';
import mongoose from 'mongoose';
import { whatsappConfig } from '../config/whatsapp';
import { WhatsAppMessage, IWhatsAppMessage } from '../models/WhatsAppMessage';
import { Customer } from '../models/Customer';
import { Bill } from '../models/Bill';
import { ShopSettings } from '../models/ShopSettings';

export interface SendBillOptions {
  billId: string;
  recipientPhone?: string;
  customNote?: string;
}

export interface SendReminderOptions {
  customerId: string;
  customMessage?: string;
}

export class WhatsAppService {
  /**
   * Sanitizes phone number into international format without '+' or spaces (e.g. 919876543210)
   */
  static cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^0-9]/g, '');
    // If 11 digits starting with 0 (e.g., 08084316170), strip the leading 0
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // If 10 digits without country code, default to 91 (India)
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Sends a bill notification to customer via WhatsApp Meta Cloud API
   */
  static async sendBill(options: SendBillOptions): Promise<IWhatsAppMessage> {
    const bill = await Bill.findById(options.billId).populate('customer');
    if (!bill) {
      throw new Error('Bill not found');
    }

    const customer: any = bill.customer;
    if (!customer) {
      throw new Error('Customer information missing for this bill');
    }

    const settings = await ShopSettings.findOne().lean();
    const shopName = settings?.shopName || 'ShopLedger Mart';
    const currency = settings?.currencySymbol || '₹';

    const targetPhone = this.cleanPhoneNumber(
      options.recipientPhone || customer.whatsappNumber || customer.phoneNumber
    );

    const formattedDate = new Date(bill.billDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const messageText = `Hello ${customer.name} 👋

Thank you for shopping with ${shopName}.

Your bill details:

Bill Number: ${bill.billNumber}
Bill Date: ${formattedDate}

Total Amount: ${currency}${bill.totalAmount.toLocaleString('en-IN')}
Paid Amount: ${currency}${bill.paidAmount.toLocaleString('en-IN')}
Pending Amount: ${currency}${bill.dueAmount.toLocaleString('en-IN')}

Thank you for your business.`;

    const messageRecord = new WhatsAppMessage({
      customer: customer._id,
      bill: bill._id,
      messageType: 'BILL',
      recipientPhone: targetPhone,
      messageContent: messageText,
      mediaUrl: bill.billImage?.url,
      status: 'PENDING',
      sentDate: new Date(),
    });

    await messageRecord.save();

    // If Meta Cloud API is configured with valid token and phone ID
    if (whatsappConfig.isConfigured) {
      try {
        const url = `${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`;
        
        let payload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: { preview_url: true, body: messageText },
        };

        // If bill image is uploaded to Cloudinary, send as image or document
        if (bill.billImage?.url && bill.billImage.url.startsWith('http')) {
          const isPdf = bill.billImage.url.endsWith('.pdf') || bill.billImage.fileName?.endsWith('.pdf');
          if (isPdf) {
            payload = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: targetPhone,
              type: 'document',
              document: {
                link: bill.billImage.url,
                caption: messageText,
                filename: bill.billImage.fileName || `${bill.billNumber}.pdf`,
              },
            };
          } else {
            payload = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: targetPhone,
              type: 'image',
              image: {
                link: bill.billImage.url,
                caption: messageText,
              },
            };
          }
        }

        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });

        const metaMessageId = response.data?.messages?.[0]?.id;
        messageRecord.status = 'SENT';
        messageRecord.whatsappMessageId = metaMessageId || `WA-${Date.now()}`;
        messageRecord.metaApiResponse = response.data;
        await messageRecord.save();

        return messageRecord;
      } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('Meta WhatsApp API Error:', errorData);

        messageRecord.status = 'FAILED';
        messageRecord.errorMessage =
          typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData);
        await messageRecord.save();

        return messageRecord;
      }
    } else {
      // Sandbox / Mock simulation mode (when live Meta keys are not yet provided)
      console.log(`[WhatsApp Sandbox] Dispatched Bill to +${targetPhone}:\n${messageText}`);
      messageRecord.status = 'SENT';
      messageRecord.whatsappMessageId = `MOCK-WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      messageRecord.metaApiResponse = {
        mock: true,
        note: 'Simulated send because WHATSAPP_ACCESS_TOKEN is pending configuration.',
      };
      await messageRecord.save();

      return messageRecord;
    }
  }

  /**
   * Sends a payment reminder to a customer with pending balance
   */
  static async sendPaymentReminder(options: SendReminderOptions): Promise<IWhatsAppMessage> {
    const customer = await Customer.findById(options.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.totalDueAmount <= 0) {
      throw new Error('Customer has no pending balance');
    }

    const settings = await ShopSettings.findOne().lean();
    const shopName = settings?.shopName || 'ShopLedger Mart';
    const currency = settings?.currencySymbol || '₹';

    const targetPhone = this.cleanPhoneNumber(
      customer.whatsappNumber || customer.phoneNumber
    );

    const messageText = options.customMessage || `Hello ${customer.name} 👋

This is a friendly payment reminder from ${shopName}.

Your current pending amount is:

${currency}${customer.totalDueAmount.toLocaleString('en-IN')}

Please clear your pending balance at your convenience.

Thank you.`;

    const messageRecord = new WhatsAppMessage({
      customer: customer._id,
      messageType: 'REMINDER',
      recipientPhone: targetPhone,
      messageContent: messageText,
      status: 'PENDING',
      sentDate: new Date(),
    });

    await messageRecord.save();

    if (whatsappConfig.isConfigured) {
      try {
        const url = `${whatsappConfig.baseUrl}/${whatsappConfig.phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: targetPhone,
          type: 'text',
          text: { preview_url: true, body: messageText },
        };

        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });

        const metaMessageId = response.data?.messages?.[0]?.id;
        messageRecord.status = 'SENT';
        messageRecord.whatsappMessageId = metaMessageId || `WA-REM-${Date.now()}`;
        messageRecord.metaApiResponse = response.data;
        await messageRecord.save();

        return messageRecord;
      } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('Meta WhatsApp Reminder API Error:', errorData);

        messageRecord.status = 'FAILED';
        messageRecord.errorMessage =
          typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData);
        await messageRecord.save();

        return messageRecord;
      }
    } else {
      console.log(`[WhatsApp Sandbox] Dispatched Reminder to +${targetPhone}:\n${messageText}`);
      messageRecord.status = 'SENT';
      messageRecord.whatsappMessageId = `MOCK-REM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      messageRecord.metaApiResponse = {
        mock: true,
        note: 'Simulated send because WHATSAPP_ACCESS_TOKEN is pending configuration.',
      };
      await messageRecord.save();

      return messageRecord;
    }
  }

  /**
   * Webhook status update processor (SENT, DELIVERED, READ, FAILED)
   */
  static async handleWebhookStatus(statusUpdate: any) {
    const metaMessageId = statusUpdate.id;
    const status = statusUpdate.status; // 'sent', 'delivered', 'read', 'failed'

    if (!metaMessageId || !status) return;

    const message = await WhatsAppMessage.findOne({ whatsappMessageId: metaMessageId });
    if (!message) return;

    switch (status.toLowerCase()) {
      case 'sent':
        message.status = 'SENT';
        break;
      case 'delivered':
        message.status = 'DELIVERED';
        break;
      case 'read':
        message.status = 'READ';
        break;
      case 'failed':
        message.status = 'FAILED';
        if (statusUpdate.errors) {
          message.errorMessage = JSON.stringify(statusUpdate.errors);
        }
        break;
    }

    await message.save();
  }

  static async getHistory(options: {
    customerId?: string;
    messageType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.customerId) query.customer = options.customerId;
    if (options.messageType && options.messageType !== 'ALL') query.messageType = options.messageType;
    if (options.status && options.status !== 'ALL') query.status = options.status;

    const [messages, total] = await Promise.all([
      WhatsAppMessage.find(query)
        .populate('customer', 'name customerId phoneNumber whatsappNumber')
        .populate('bill', 'billNumber totalAmount dueAmount')
        .sort({ sentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppMessage.countDocuments(query),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
