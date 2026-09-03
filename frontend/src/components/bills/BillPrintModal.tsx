import React, { useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Bill } from '../../types';
import { Printer, X } from 'lucide-react';

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({ isOpen, onClose, bill }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const customer: any = bill.customer || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Invoice" maxWidth="3xl">
      <div className="space-y-4">
        <div className="flex justify-end gap-2 no-print">
          <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Print / Save as PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Printable Invoice Sheet */}
        <div
          ref={printRef}
          className="print-container bg-white text-slate-900 p-8 rounded-xl shadow-md font-sans border border-slate-200"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
              <p className="text-xs text-slate-500 font-semibold mt-1">ShopLedger Mart</p>
              <p className="text-xs text-slate-500">Main Market, City Center</p>
              <p className="text-xs text-slate-500">Phone: +91 98765 43210</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice No:</span>
              <p className="text-lg font-extrabold text-slate-900">{bill.billNumber}</p>
              <p className="text-xs text-slate-600 mt-1">
                Date: {new Date(bill.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                bill.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                bill.paymentStatus === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                {bill.paymentStatus}
              </span>
            </div>
          </div>

          {/* Customer info */}
          <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To:</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{customer.name || 'Customer'}</p>
            <p className="text-xs text-slate-600">Phone: {customer.phoneNumber || 'N/A'}</p>
            {customer.address && <p className="text-xs text-slate-600">Address: {customer.address}</p>}
          </div>

          {/* Items */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Unit Price</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bill.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="py-2 px-3 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-2 px-3 text-right text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Breakdown */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Subtotal:</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>- ₹{bill.discount.toFixed(2)}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Tax:</span>
                  <span>+ ₹{bill.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b-2 border-slate-300 font-extrabold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span>₹{bill.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Paid Amount:</span>
                <span>₹{bill.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-xs">
                <span>Balance Due:</span>
                <span className={bill.dueAmount > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>
                  ₹{bill.dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-slate-500 text-[11px]">
            <p className="font-semibold text-slate-700">Thank you for your business!</p>
            <p className="mt-0.5">This is a computer-generated invoice from ShopLedger.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
