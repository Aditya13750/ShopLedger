import dotenv from 'dotenv';
dotenv.config();

export const whatsappConfig = {
  apiVersion: 'v20.0',
  baseUrl: 'https://graph.facebook.com/v20.0',
  get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  },
  get accessToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN || '';
  },
  get businessAccountId() {
    return process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  },
  get verifyToken() {
    return process.env.WHATSAPP_VERIFY_TOKEN || 'shopledger_webhook_verify_token_2026';
  },
  get isConfigured(): boolean {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    return Boolean(
      phoneId &&
      token &&
      phoneId !== 'your_phone_number_id' &&
      token !== 'your_access_token'
    );
  }
};
