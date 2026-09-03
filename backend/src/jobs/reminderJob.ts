import cron from 'node-cron';
import { ReminderService } from '../services/reminderService';
import { ShopSettings } from '../models/ShopSettings';

let reminderJobInstance: cron.ScheduledTask | null = null;

export const initReminderCron = () => {
  // Run every hour to check whether the current time matches reminderSettings.reminderTime
  reminderJobInstance = cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const settingsList = await ShopSettings.find({ 'reminderSettings.enabled': true });

      for (const settings of settingsList) {
        const configuredTime = settings.reminderSettings?.reminderTime || '10:00';
        const [targetHour] = configuredTime.split(':');

        if (currentHour === targetHour) {
          console.log(`⏰ [Reminder Cron] Triggering scheduled payment reminders at ${configuredTime}...`);
          const result = await ReminderService.processAutomatedReminders(settings.userId);
          console.log(`✅ [Reminder Cron] Processed ${result.processed}, Sent ${result.sent}, Skipped ${result.skipped}, Failed ${result.failed}`);
        }
      }
    } catch (err) {
      console.error('❌ [Reminder Cron] Execution error:', err);
    }
  });

  console.log('⏰ Scheduled reminder job initialized with node-cron (Hourly evaluation)');
};

export const stopReminderCron = () => {
  if (reminderJobInstance) {
    reminderJobInstance.stop();
    console.log('⏰ Scheduled reminder job stopped');
  }
};
