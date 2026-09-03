import { Customer } from '../models/Customer';
import { Reminder, IReminder } from '../models/Reminder';
import { ShopSettings } from '../models/ShopSettings';
import { WhatsAppService } from './whatsappService';

export class ReminderService {
  /**
   * Evaluates if enough time has passed based on frequency setting since the last reminder
   */
  static shouldSendReminder(
    lastReminderDate: Date | null | undefined,
    frequency: string,
    customDays: number
  ): boolean {
    if (!lastReminderDate) return true;

    const now = new Date().getTime();
    const last = new Date(lastReminderDate).getTime();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);

    switch (frequency) {
      case 'DAILY':
        return diffDays >= 1;
      case 'EVERY_3_DAYS':
        return diffDays >= 3;
      case 'WEEKLY':
        return diffDays >= 7;
      case 'MONTHLY':
        return diffDays >= 30;
      case 'CUSTOM':
        return diffDays >= (customDays || 7);
      default:
        return diffDays >= 7;
    }
  }

  /**
   * Scheduled runner: Finds eligible customers and dispatches reminders safely
   */
  static async processAutomatedReminders(): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    failed: number;
    logs: any[];
  }> {
    const settings = await ShopSettings.findOne();
    if (!settings || !settings.reminderSettings.enabled) {
      console.log('Automated reminders are currently disabled in settings.');
      return { processed: 0, sent: 0, skipped: 0, failed: 0, logs: [] };
    }

    const { frequency, customIntervalDays, minimumDueAmount } = settings.reminderSettings;

    // Find all customers with pending balance at or above threshold
    const eligibleCustomers = await Customer.find({
      totalDueAmount: { $gte: minimumDueAmount || 1 },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const logs: any[] = [];

    for (const customer of eligibleCustomers) {
      // Find the most recent reminder sent to this customer
      const lastReminder = await Reminder.findOne({
        customer: customer._id,
        status: 'SENT',
      }).sort({ reminderDate: -1 });

      const isEligible = this.shouldSendReminder(
        lastReminder?.reminderDate,
        frequency,
        customIntervalDays
      );

      if (!isEligible) {
        skipped++;
        continue;
      }

      try {
        const waMessage = await WhatsAppService.sendPaymentReminder({
          customerId: customer._id.toString(),
        });

        const status = waMessage.status === 'FAILED' ? 'FAILED' : 'SENT';

        const reminderLog = new Reminder({
          customer: customer._id,
          dueAmount: customer.totalDueAmount,
          reminderDate: new Date(),
          status,
          messageId: waMessage.whatsappMessageId,
          error: waMessage.errorMessage,
          triggerType: 'AUTOMATIC',
        });

        await reminderLog.save();

        if (status === 'SENT') {
          sent++;
        } else {
          failed++;
        }

        logs.push({
          customerId: customer.customerId,
          name: customer.name,
          amount: customer.totalDueAmount,
          status,
        });
      } catch (err: any) {
        failed++;
        await Reminder.create({
          customer: customer._id,
          dueAmount: customer.totalDueAmount,
          reminderDate: new Date(),
          status: 'FAILED',
          error: err.message,
          triggerType: 'AUTOMATIC',
        });
      }
    }

    settings.reminderSettings.lastRunDate = new Date();
    await settings.save();

    return {
      processed: eligibleCustomers.length,
      sent,
      skipped,
      failed,
      logs,
    };
  }

  /**
   * Trigger single manual reminder for a specific customer
   */
  static async sendManualReminder(customerId: string): Promise<IReminder> {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.totalDueAmount <= 0) {
      throw new Error('Customer does not have any pending due amount');
    }

    const waMessage = await WhatsAppService.sendPaymentReminder({ customerId });

    const status = waMessage.status === 'FAILED' ? 'FAILED' : 'SENT';

    const reminderLog = new Reminder({
      customer: customer._id,
      dueAmount: customer.totalDueAmount,
      reminderDate: new Date(),
      status,
      messageId: waMessage.whatsappMessageId,
      error: waMessage.errorMessage,
      triggerType: 'MANUAL',
    });

    await reminderLog.save();
    return reminderLog.populate('customer', 'name phoneNumber whatsappNumber customerId');
  }

  static async getReminderLogs(options: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.customerId) query.customer = options.customerId;
    if (options.status && options.status !== 'ALL') query.status = options.status;

    const [reminders, total] = await Promise.all([
      Reminder.find(query)
        .populate('customer', 'name customerId phoneNumber whatsappNumber')
        .sort({ reminderDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Reminder.countDocuments(query),
    ]);

    return {
      reminders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
