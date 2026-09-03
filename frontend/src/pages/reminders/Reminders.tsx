import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Play,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReminderLog } from '../../types';
import { reminderService } from '../../services/reminderService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';

export const Reminders: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchLogsAndSettings = async (page = 1) => {
    setIsLoading(true);
    try {
      const [logsRes, setRes] = await Promise.all([
        reminderService.getReminderLogs({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          page,
          limit: 20,
        }),
        settingsService.getSettings(),
      ]);

      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data);
        if (logsRes.meta) setPagination(logsRes.meta);
      }
      if (setRes.success) {
        setSettings(setRes.data);
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to load reminder history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndSettings(1);
  }, [statusFilter]);

  const handleTriggerCycleNow = async () => {
    setIsTriggering(true);
    try {
      const res = await reminderService.triggerAutomatedNow();
      showToast(
        'success',
        'Reminder Run Finished',
        `Processed: ${res.data?.processed}, Sent: ${res.data?.sent}, Skipped: ${res.data?.skipped}`
      );
      fetchLogsAndSettings(1);
    } catch (error: any) {
      showToast('error', 'Trigger Failed', error.response?.data?.message || error.message);
    } finally {
      setIsTriggering(false);
    }
  };

  const reminderConfig = settings?.reminderSettings || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Automated WhatsApp Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official WhatsApp Business Cloud API automated payment follow-ups and logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/settings">
            <Button variant="outline" size="md" leftIcon={<Settings className="w-4 h-4" />}>
              Configure Rules
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={handleTriggerCycleNow}
            isLoading={isTriggering}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Run Reminder Cycle Now
          </Button>
        </div>
      </div>

      {/* Rules Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Schedule State</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {reminderConfig.enabled ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active (Auto-Run)
              </span>
            ) : (
              <span className="text-slate-400">Disabled</span>
            )}
          </p>
          <span className="text-[11px] text-slate-500">Hourly cron evaluation</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Frequency</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {reminderConfig.frequency || 'WEEKLY'}
          </p>
          <span className="text-[11px] text-slate-500">
            Deduplication prevents repeat reminders
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Min. Due Threshold</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            ₹{reminderConfig.minimumDueAmount || 100}
          </p>
          <span className="text-[11px] text-slate-500">Customers below this are skipped</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Daily Send Time</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {reminderConfig.reminderTime || '10:00'} IST
          </p>
          <span className="text-[11px] text-slate-500">Business hours delivery</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {['ALL', 'SENT', 'FAILED', 'SKIPPED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Total Logs: {pagination.total}
          </span>
        </div>
      </Card>

      {/* Reminder Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Due Amount</th>
                <th className="py-3 px-4 text-center">Trigger Type</th>
                <th className="py-3 px-4 text-center">Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Message ID / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading reminder logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={<BellRing className="w-8 h-8" />}
                      title="No Reminders Dispatched Yet"
                      description="Click 'Run Reminder Cycle Now' or wait for the scheduled hourly cron to dispatch reminders to customers with pending balances."
                      actionText="Run Cycle Now"
                      onAction={handleTriggerCycleNow}
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const customer: any = log.customer || {};
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <Link
                          to={`/customers/${customer._id}/ledger`}
                          className="hover:text-emerald-400 transition-colors"
                        >
                          {customer.name || 'Unknown'}
                        </Link>
                        <p className="text-[10px] text-slate-400">{customer.phoneNumber}</p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-400">
                        ₹{log.dueAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {log.triggerType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                        {new Date(log.reminderDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={log.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {log.messageId ? (
                          <span className="text-[11px] text-emerald-400 truncate block max-w-xs">
                            {log.messageId}
                          </span>
                        ) : null}
                        {log.error && (
                          <span className="text-[11px] text-rose-400 truncate block max-w-xs">
                            {log.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogsAndSettings(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogsAndSettings(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
