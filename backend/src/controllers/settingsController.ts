import { Request, Response } from 'express';
import { ShopSettings } from '../models/ShopSettings';
import { whatsappConfig } from '../config/whatsapp';
import { isCloudinaryConfigured } from '../config/cloudinary';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class SettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const query = userId ? { userId } : {};

      let settings = await ShopSettings.findOne(query);
      if (!settings) {
        settings = await ShopSettings.create({
          ...(userId ? { userId } : {}),
          shopName: process.env.DEFAULT_SHOP_NAME || 'ShopLedger Mart',
          shopPhone: process.env.DEFAULT_SHOP_PHONE || '+919876543210',
          currencySymbol: process.env.DEFAULT_CURRENCY || '₹',
        });
      }

      sendSuccess(res, 'Settings retrieved', {
        ...settings.toObject(),
        integrations: {
          whatsappConfigured: whatsappConfig.isConfigured,
          cloudinaryConfigured: isCloudinaryConfigured,
          whatsappPhoneNumberId: whatsappConfig.phoneNumberId
            ? `...${whatsappConfig.phoneNumberId.slice(-4)}`
            : 'Not set',
        },
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch settings', 500);
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const query = userId ? { userId } : {};

      let settings = await ShopSettings.findOne(query);
      if (!settings) {
        settings = new ShopSettings({ ...(userId ? { userId } : {}), ...req.body });
      } else {
        Object.assign(settings, req.body);
      }

      await settings.save();
      sendSuccess(res, 'Settings updated successfully', settings);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update settings', 500);
    }
  }
}
