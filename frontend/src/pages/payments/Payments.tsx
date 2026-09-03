import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Plus, Trash2, Calendar, User, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Payment } from '../../types';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';

export const Payments: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await paymentService.getPayments({
        paymentMethod: paymentMethod !== 'ALL' ? paymentMethod : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      });

      if (res.success && res.data) {
        setPayments(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to retrieve payment records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [paymentMethod, startDate, endDate]);

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    try {
      await paymentService.deletePayment(paymentToDelete._id);
      showToast('success', 'Payment Reversed', 'Payment removed and balances restored.');
      setDeleteConfirmOpen(false);
      setPaymentToDelete(null);
      fetchPayments(pagination.page);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.response?.data?.message || error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer payments received across UPI, Cash, Bank Transfer, and Cards.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsRecordModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Payment
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Method Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
            {['ALL', 'Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  paymentMethod === method
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-emerald-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4">Bill Link / Ref No</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={<CreditCard className="w-8 h-8" />}
                      title="No Payments Recorded"
                      description="Record your first customer payment to update accounts and customer ledger balances."
                      actionText="Record Payment"
                      onAction={() => setIsRecordModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const customer: any = payment.customer || {};
                  const bill: any = payment.bill;
                  return (
                    <tr key={payment._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <Link
                          to={`/customers/${customer._id}/ledger`}
                          className="hover:text-emerald-400 transition-colors"
                        >
                          {customer.name || 'Unknown'}
                        </Link>
                        <p className="text-[10px] text-slate-400">{customer.phoneNumber}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {bill ? (
                          <span className="font-mono text-emerald-400 font-semibold">
                            Bill #{bill.billNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">Account Credit</span>
                        )}
                        {payment.referenceNumber && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Ref: {payment.referenceNumber}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            "{payment.notes}"
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-sm">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          title="Delete Payment Record"
                          onClick={() => {
                            setPaymentToDelete(payment);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
                onClick={() => fetchPayments(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchPayments(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => fetchPayments(pagination.page)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleDeletePayment}
        title="Reverse Payment"
        message={`Are you sure you want to reverse this payment of ₹${paymentToDelete?.amount}? The customer's due amount will increase accordingly.`}
        confirmText="Reverse Payment"
        isLoading={isDeleting}
      />
    </div>
  );
};
