import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Customer, Bill } from '../../types';
import { customerService } from '../../services/customerService';
import { billService } from '../../services/billService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCustomerId?: string;
  preselectedBillId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
  preselectedBillId,
}) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerBills, setCustomerBills] = useState<Bill[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      customerService.getCustomers({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      });

      setSelectedCustomerId(preselectedCustomerId || '');
      setSelectedBillId(preselectedBillId || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setReferenceNumber('');
      setNotes('');
      setAmount('');
    }
  }, [isOpen, preselectedCustomerId, preselectedBillId]);

  // When customer changes, load unpaid bills
  useEffect(() => {
    if (selectedCustomerId) {
      billService
        .getBills({ customerId: selectedCustomerId, limit: 50 })
        .then((res) => {
          if (res.success && res.data) {
            const unpaid = res.data.filter((b) => b.dueAmount > 0);
            setCustomerBills(unpaid);

            // If a bill was preselected, prefill amount
            if (preselectedBillId) {
              const target = unpaid.find((b) => b._id === preselectedBillId);
              if (target) {
                setAmount(target.dueAmount);
              }
            }
          }
        });
    } else {
      setCustomerBills([]);
    }
  }, [selectedCustomerId, preselectedBillId]);

  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    if (billId) {
      const bill = customerBills.find((b) => b._id === billId);
      if (bill) {
        setAmount(bill.dueAmount);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('error', 'Required', 'Please select a customer.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast('error', 'Required', 'Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.recordPayment({
        customer: selectedCustomerId,
        bill: selectedBillId || undefined,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
      });

      showToast('success', 'Payment Recorded', `Payment of ₹${amount} recorded successfully.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to record payment';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Customer Payment" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Select Customer *
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            required
          >
            <option value="">-- Choose Customer --</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.phoneNumber}) {c.totalDueAmount > 0 ? `[Due: ₹${c.totalDueAmount}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Bill link (Optional) */}
        {customerBills.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Apply to Specific Bill (Optional)
            </label>
            <select
              value={selectedBillId}
              onChange={(e) => handleBillSelect(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">General Account Payment</option>
              {customerBills.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.billNumber} — Total ₹{b.totalAmount} (Due: ₹{b.dueAmount})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (₹) *"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 500.00"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || '')}
            required
          />

          <Input
            label="Payment Date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Payment Method *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  paymentMethod === method
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Reference / Transaction ID (Optional)"
          placeholder="UPI ref no, Cheque no, or UTR"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Payment note, handed by person, etc."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
