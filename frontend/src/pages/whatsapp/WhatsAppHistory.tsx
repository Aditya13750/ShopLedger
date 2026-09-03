import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, Eye, ExternalLink, CheckCheck, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { WhatsAppMessage } from '../../types';
import { whatsappService } from '../../services/whatsappService';
import { useToast } from '../../context/ToastContext';

export const WhatsAppHistory: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [messageType, setMessageType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);

  const fetchHistory = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await whatsappService.getHistory({
        messageType: messageType !== 'ALL' ? messageType : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 20,
      });

      if (res.success && res.data) {
        setMessages(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to retrieve WhatsApp history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [messageType, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            WhatsApp Delivery History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Meta WhatsApp Cloud API delivery receipts, read status, and message payloads.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHistory(pagination.page)}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Message Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {['ALL', 'BILL', 'REMINDER'].map((type) => (
              <button
                key={type}
                onClick={() => setMessageType(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  messageType === type
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
            {['ALL', 'SENT', 'DELIVERED', 'READ', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* WhatsApp Message Log Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Content Preview</th>
                <th className="py-3 px-4 text-center">Sent Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Meta Message ID</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading message history...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={<MessageSquare className="w-8 h-8" />}
                      title="No WhatsApp Messages"
                      description="Messages sent from bills or automated payment reminders will appear here."
                    />
                  </td>
                </tr>
              ) : (
                messages.map((msg) => {
                  const customer: any = msg.customer || {};
                  return (
                    <tr key={msg._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {customer.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{msg.recipientPhone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                          {msg.messageType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 truncate">{msg.messageContent}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {new Date(msg.sentDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={msg.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                        {msg.whatsappMessageId || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          title="View Message Text"
                          onClick={() => setSelectedMessage(msg)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                onClick={() => fetchHistory(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchHistory(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Message Preview Modal */}
      {selectedMessage && (
        <Modal
          isOpen={Boolean(selectedMessage)}
          onClose={() => setSelectedMessage(null)}
          title="WhatsApp Message Details"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Status</span>
              <Badge status={selectedMessage.status} size="sm" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Recipient
              </span>
              <p className="text-sm font-bold text-white">
                {(selectedMessage.customer as any)?.name} (+{selectedMessage.recipientPhone})
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Message Content
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {selectedMessage.messageContent}
              </div>
            </div>

            {selectedMessage.errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
                <span className="font-bold block mb-0.5">Error details:</span>
                <p className="font-mono break-all">{selectedMessage.errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
