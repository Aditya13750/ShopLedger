import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  BellRing,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to load shop settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsService.updateSettings(settings);
      showToast('success', 'Settings Saved', 'Shop configurations updated successfully.');
    } catch (error: any) {
      showToast('error', 'Save Failed', error.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin.replace('5173', '5000')}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
    showToast('info', 'Copied', 'Webhook URL copied to clipboard.');
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const webhookUrl = `${window.location.origin.replace('5173', '5000')}/api/whatsapp/webhook`;
  const integrations = settings.integrations || {};

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System & Shop Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure business details, automated reminder rules, and WhatsApp Meta Cloud API settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shop Branding */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Store className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Shop Business Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Shop Name *"
              value={settings.shopName || ''}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              placeholder="e.g. ShopLedger Supermarket"
              required
            />

            <Input
              label="Shop Phone Number *"
              value={settings.shopPhone || ''}
              onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              required
            />

            <Input
              label="Shop Email (Optional)"
              type="email"
              value={settings.shopEmail || ''}
              onChange={(e) => setSettings({ ...settings, shopEmail: e.target.value })}
              placeholder="billing@yourshop.com"
            />

            <Input
              label="Currency Symbol"
              value={settings.currencySymbol || '₹'}
              onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
              placeholder="₹, $, €"
            />

            <div className="sm:col-span-2">
              <Input
                label="Shop Address (Appears on printed invoices)"
                value={settings.shopAddress || ''}
                onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                placeholder="Shop No. 4, Commercial Complex, MG Road"
              />
            </div>
          </div>
        </Card>

        {/* Automated WhatsApp Reminder Rules */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Automated Payment Reminder Policy
              </h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">
                {settings.reminderSettings?.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <input
                type="checkbox"
                checked={Boolean(settings.reminderSettings?.enabled)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminderSettings: {
                      ...settings.reminderSettings,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Reminder Frequency
              </label>
              <select
                value={settings.reminderSettings?.frequency || 'WEEKLY'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminderSettings: {
                      ...settings.reminderSettings,
                      frequency: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="DAILY">Daily</option>
                <option value="EVERY_3_DAYS">Every 3 Days</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM">Custom Interval</option>
              </select>
            </div>

            {settings.reminderSettings?.frequency === 'CUSTOM' && (
              <Input
                label="Custom Interval (Days)"
                type="number"
                min="1"
                value={settings.reminderSettings?.customIntervalDays || 7}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminderSettings: {
                      ...settings.reminderSettings,
                      customIntervalDays: Number(e.target.value),
                    },
                  })
                }
              />
            )}

            <Input
              label="Reminder Time (24h format)"
              type="text"
              placeholder="10:00"
              value={settings.reminderSettings?.reminderTime || '10:00'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminderSettings: {
                    ...settings.reminderSettings,
                    reminderTime: e.target.value,
                  },
                })
              }
            />

            <Input
              label="Minimum Due Amount (₹)"
              type="number"
              min="1"
              value={settings.reminderSettings?.minimumDueAmount || 100}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminderSettings: {
                    ...settings.reminderSettings,
                    minimumDueAmount: Number(e.target.value),
                  },
                })
              }
            />
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            💡 The scheduler checks customers who have outstanding balances above the minimum due
            amount. Customers are protected from receiving duplicate reminders until their interval
            has passed.
          </div>
        </Card>

        {/* WhatsApp Cloud API & Integrations Status */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Meta WhatsApp Business Platform Integration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cloud API Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {integrations.whatsappConfigured ? (
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Live Meta API Connected
                  </span>
                ) : (
                  <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Sandbox / Dev Simulation Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {integrations.whatsappConfigured
                  ? `Phone Number ID: ${integrations.whatsappPhoneNumberId}`
                  : 'Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env for production delivery.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cloudinary Storage
              </span>
              <div className="flex items-center gap-2 mt-1">
                {integrations.cloudinaryConfigured ? (
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Cloudinary Enabled
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500" /> Local / Base64 Fallback Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Uploads work out of the box; configure Cloudinary keys in production for permanent CDN hosting.
              </p>
            </div>
          </div>

          {/* Webhook configuration helper */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Meta WhatsApp Webhook Configuration
            </span>
            <p className="text-xs text-slate-400">
              In Meta Developer Portal under <strong>WhatsApp → Configuration → Webhook</strong>:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                leftIcon={copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedWebhook ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Verify Token: <code className="text-emerald-400">shopledger_webhook_verify_token_2026</code>
            </p>
          </div>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
