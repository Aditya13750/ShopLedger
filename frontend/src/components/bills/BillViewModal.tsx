import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Bill } from '../../types';
import { billService } from '../../services/billService';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Printer, ExternalLink, Calendar, User, Phone } from 'lucide-react';
import { BillPrintModal } from './BillPrintModal';

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export const BillViewModal: React.FC<BillViewModalProps> = ({ isOpen, onClose, bill }) => {
  const { showToast } = useToast();
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!bill) return null;

  const customer: any = bill.customer || {};

  const handleSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      await billService.sendWhatsAppBill(bill._id);
      showToast('success', 'WhatsApp Dispatched', `Bill #${bill.billNumber} sent to ${customer.name}.`);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to send WhatsApp message';
      showToast('error', 'WhatsApp Failed', msg);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Bill Details — ${bill.billNumber}`} maxWidth="2xl">
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
                <Badge status={bill.paymentStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date: {new Date(bill.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400">Grand Total</span>
              <p className="text-2xl font-black text-white">₹{bill.totalAmount.toLocaleString('en-IN')}</p>
              {bill.dueAmount > 0 && (
                <p className="text-xs font-semibold text-rose-400">
                  Due: ₹{bill.dueAmount.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-4 rounded-xl bg-slate-850/40 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{customer.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{customer.phoneNumber || 'N/A'}</span>
              </div>
              {customer.address && (
                <div className="text-xs text-slate-400 col-span-full mt-1">
                  Address: {customer.address}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Billed Items
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bill.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-4 text-slate-200 font-medium">{item.productName}</td>
                      <td className="py-2.5 px-4 text-center text-slate-300">{item.quantity}</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-white">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-sm p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal:</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>Discount:</span>
                  <span>- ₹{bill.discount.toFixed(2)}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Tax:</span>
                  <span>+ ₹{bill.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-white text-sm">
                <span>Grand Total:</span>
                <span>₹{bill.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Paid Amount:</span>
                <span>₹{bill.paidAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Due Balance:</span>
                <span className={bill.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  ₹{bill.dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Attached Receipt Image */}
          {bill.billImage?.url && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Attached Bill Receipt
                </span>
                <a
                  href={bill.billImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Original
                </a>
              </div>
              {bill.billImage.url.endsWith('.pdf') ? (
                <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-300">
                  PDF document attached: {bill.billImage.fileName || 'bill.pdf'}
                </div>
              ) : (
                <img
                  src={bill.billImage.url}
                  alt="Bill receipt"
                  className="max-h-52 rounded-lg border border-slate-800 object-contain mx-auto"
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4 text-slate-300" />}
            >
              Print Invoice
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendWhatsApp}
                isLoading={isSendingWhatsApp}
                leftIcon={<MessageSquare className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Send on WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bill Print Modal */}
      {isPrintModalOpen && (
        <BillPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          bill={bill}
        />
      )}
    </>
  );
};
