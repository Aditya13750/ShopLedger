import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  ReceiptText,
  CreditCard,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BillFormModal } from '../../components/bills/BillFormModal';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { customerService } from '../../services/customerService';
import { reminderService } from '../../services/reminderService';
import { CustomerLedgerResponse } from '../../types';
import { useToast } from '../../context/ToastContext';

export const CustomerLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [ledgerData, setLedgerData] = useState<CustomerLedgerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const fetchLedger = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await customerService.getCustomerLedger(id);
      if (res.success && res.data) {
        setLedgerData(res.data);
      }
    } catch (err: any) {
      showToast('error', 'Error', 'Failed to load customer ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = async () => {
    if (!id || !ledgerData) return;
    setIsSendingReminder(true);
    try {
      await reminderService.sendManualReminder(id);
      showToast(
        'success',
        'WhatsApp Reminder Dispatched',
        `Statement reminder sent to ${ledgerData.customer.name}.`
      );
    } catch (error: any) {
      showToast('error', 'Failed', error.response?.data?.message || error.message);
    } finally {
      setIsSendingReminder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!ledgerData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Customer account not found.</p>
        <Link to="/customers" className="text-emerald-400 hover:underline mt-2 inline-block">
          Return to Customers
        </Link>
      </div>
    );
  }

  const { customer, summary, ledger } = ledgerData;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{customer.name}</span>
              <span className="text-xs font-mono text-emerald-400 font-normal px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                {customer.customerId}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Account Statement & Chronological Ledger</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Ledger
          </Button>

          {customer.totalDueAmount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isSendingReminder}
              onClick={handleSendReminder}
              leftIcon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
            >
              Send WhatsApp Reminder
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaymentModalOpen(true)}
            leftIcon={<CreditCard className="w-4 h-4 text-emerald-400" />}
          >
            Record Payment
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBillModalOpen(true)}
            leftIcon={<ReceiptText className="w-4 h-4" />}
          >
            New Bill
          </Button>
        </div>
      </div>

      {/* Customer Info Card & Balance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Customer Details */}
        <Card className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profile Details
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{customer.phoneNumber}</span>
            </div>
            {customer.whatsappNumber && (
              <div className="flex items-center gap-2 text-emerald-400 font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>WA: {customer.whatsappNumber}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
              "{customer.notes}"
            </div>
          )}
        </Card>

        {/* Financial Highlights */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <p className="text-2xl font-black text-white mt-1">
              ₹{summary.totalBillAmount.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">Cumulative bill amount</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Payments Made
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              ₹{summary.totalPaidAmount.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">Collections recorded</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Current Outstanding Due
            </span>
            <p
              className={`text-2xl font-black mt-1 ${
                summary.totalDueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ₹{summary.totalDueAmount.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500">Net pending ledger balance</span>
          </div>
        </div>
      </div>

      {/* Account Ledger Statement Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Chronological Transaction Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Complete history of bills issued, payments credited, and running balance.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {ledger.length} Transaction{ledger.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4 text-right">Bill Amount</th>
                <th className="py-3 px-4 text-right">Payment Amount</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No transactions recorded for this customer yet.
                  </td>
                </tr>
              ) : (
                ledger.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {new Date(entry.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          entry.type === 'BILL'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-white font-medium">
                      {entry.description}
                      {entry.referenceNumber && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Ref: {entry.referenceNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-rose-400">
                      {entry.billAmount > 0 ? `₹${entry.billAmount.toLocaleString('en-IN')}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                      {entry.paymentAmount > 0
                        ? `₹${entry.paymentAmount.toLocaleString('en-IN')}`
                        : '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-white font-mono text-sm">
                      ₹{entry.runningBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill & Payment Modals */}
      <BillFormModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        preselectedCustomerId={customer._id}
        onSuccess={fetchLedger}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedCustomerId={customer._id}
        onSuccess={fetchLedger}
      />
    </div>
  );
};
