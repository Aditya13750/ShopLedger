import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Customer, Bill } from '../../types';
import { customerService } from '../../services/customerService';
import { billService } from '../../services/billService';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface BillItemInput {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCustomerId?: string;
  billToEdit?: Bill | null;
}

export const BillFormModal: React.FC<BillFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
  billToEdit,
}) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<BillItemInput[]>([
    { productName: '', quantity: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      customerService.getCustomers({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data);
        }
      });

      if (billToEdit) {
        const custId =
          typeof billToEdit.customer === 'object'
            ? billToEdit.customer._id
            : billToEdit.customer;
        setSelectedCustomerId(custId);
        setBillDate(new Date(billToEdit.billDate).toISOString().split('T')[0]);
        setItems(
          billToEdit.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        );
        setDiscount(billToEdit.discount || 0);
        setTax(billToEdit.tax || 0);
        setPaidAmount(billToEdit.paidAmount || 0);
        setNotes(billToEdit.notes || '');
        setFile(null);
        setFilePreview(billToEdit.billImage?.url || null);
      } else {
        setSelectedCustomerId(preselectedCustomerId || '');
        setBillDate(new Date().toISOString().split('T')[0]);
        setItems([{ productName: '', quantity: 1, unitPrice: 0 }]);
        setDiscount(0);
        setTax(0);
        setPaidAmount(0);
        setNotes('');
        setFile(null);
        setFilePreview(null);
      }
    }
  }, [isOpen, billToEdit, preselectedCustomerId]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof BillItemInput,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: field === 'productName' ? value : Number(value) || 0,
        };
      })
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selected));
      } else {
        setFilePreview(null);
      }
    }
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0),
    0
  );
  const grandTotal = Math.max(0, subtotal - (discount || 0) + (tax || 0));
  const remainingDue = Math.max(0, grandTotal - (paidAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('error', 'Customer Required', 'Please select a customer for this bill.');
      return;
    }

    const validItems = items.filter((i) => i.productName.trim() !== '');
    if (validItems.length === 0) {
      showToast('error', 'Item Required', 'Please specify at least one product item.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdOrUpdatedBill: Bill;

      if (billToEdit) {
        const res = await billService.updateBill(billToEdit._id, {
          customer: selectedCustomerId,
          billDate: new Date(billDate),
          items: validItems,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          paidAmount: Number(paidAmount) || 0,
          notes,
        });
        createdOrUpdatedBill = res.data;
        showToast('success', 'Bill Updated', `Bill #${createdOrUpdatedBill.billNumber} updated.`);
      } else {
        const res = await billService.createBill({
          customer: selectedCustomerId,
          billDate: new Date(billDate),
          items: validItems,
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          paidAmount: Number(paidAmount) || 0,
          notes,
        });
        createdOrUpdatedBill = res.data;
        showToast('success', 'Bill Created', `Bill #${createdOrUpdatedBill.billNumber} created successfully.`);
      }

      // If user provided a bill image file, upload it
      if (file && createdOrUpdatedBill) {
        try {
          await billService.uploadBillImage(createdOrUpdatedBill._id, file);
          showToast('success', 'Image Uploaded', 'Bill receipt image saved.');
        } catch (imgErr) {
          showToast('warning', 'Image Warning', 'Bill saved, but receipt image upload had an issue.');
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to save bill';
      showToast('error', 'Error Saving Bill', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={billToEdit ? 'Edit Bill' : 'Create New Bill'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Input
            label="Bill Date *"
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            required
          />
        </div>

        {/* Dynamic Bill Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Bill Items *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Product / Service name"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-semibold text-slate-200">
                    ₹{lineTotal.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Totals Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-3">
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0.00"
            />
            <Input
              label="Tax / GST (₹)"
              type="number"
              min="0"
              step="0.01"
              value={tax || ''}
              onChange={(e) => setTax(Number(e.target.value))}
              placeholder="0.00"
            />
            <Input
              label="Initial Paid Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount:</span>
                <span className="text-emerald-400">- ₹{(discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax:</span>
                <span>+ ₹{(tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-bold text-white">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Paid Now:</span>
                <span>₹{(paidAmount || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Balance Due:
              </span>
              <span
                className={`text-lg font-extrabold ${
                  remainingDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ₹{remainingDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Image / PDF Upload */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Bill Receipt / Invoice Image (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 hover:border-emerald-500/50 text-slate-300 text-sm transition-all">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{file ? file.name : 'Upload JPG, PNG or PDF'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {filePreview && (
              <div className="relative group">
                <img
                  src={filePreview}
                  alt="Bill preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-0.5 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Special instructions or bill comments"
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {billToEdit ? 'Save Bill' : 'Create & Save Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
