export const whatsappConfig = {
  apiVersion: 'v20.0',
  baseUrl: 'https://graph.facebook.com/v20.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'shopledger_webhook_verify_token_2026',
  isConfigured: Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID !== 'your_phone_number_id'
  )
};
