import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ReceiptText,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  Printer,
  Image as ImageIcon,
  Calendar,
  Phone,
  FileText,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BillFormModal } from '../../components/bills/BillFormModal';
import { BillViewModal } from '../../components/bills/BillViewModal';
import { BillPrintModal } from '../../components/bills/BillPrintModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bill } from '../../types';
import { billService } from '../../services/billService';
import { useToast } from '../../context/ToastContext';

export const Bills: React.FC = () => {
  const { showToast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBillForView, setSelectedBillForView] = useState<Bill | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);

  const fetchBills = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await billService.getBills({
        search,
        paymentStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      });

      if (res.success && res.data) {
        setBills(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to retrieve bills');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
  }, [paymentStatus, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBills(1);
  };

  const handleSendWhatsApp = async (bill: Bill) => {
    const customer: any = bill.customer || {};
    setSendingWhatsAppId(bill._id);
    try {
      await billService.sendWhatsAppBill(bill._id);
      showToast('success', 'WhatsApp Sent', `Bill #${bill.billNumber} sent to ${customer.name || 'Customer'}.`);
    } catch (error: any) {
      showToast('error', 'Failed', error.response?.data?.message || error.message);
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    try {
      await billService.deleteBill(billToDelete._id);
      showToast('success', 'Bill Deleted', `Bill #${billToDelete.billNumber} deleted.`);
      setDeleteConfirmOpen(false);
      setBillToDelete(null);
      fetchBills(pagination.page);
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
            Bill & Invoice Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, track, and dispatch customer bills with official WhatsApp notifications.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setBillToEdit(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Bill
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Invoices' },
              { id: 'UNPAID', label: 'Unpaid' },
              { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { id: 'PAID', label: 'Fully Paid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPaymentStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  paymentStatus === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by bill number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Date Range:</span>
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
                className="text-emerald-400 hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <span>Total: {pagination.total} bills found</span>
        </div>
      </Card>

      {/* Bill Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bill Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Date</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading bills...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      icon={<ReceiptText className="w-8 h-8" />}
                      title="No Bills Generated"
                      description="Create your first bill to issue receipts, calculate dues, and send WhatsApp notifications."
                      actionText="Create Bill"
                      onAction={() => {
                        setBillToEdit(null);
                        setIsFormModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                  const customer: any = bill.customer || {};
                  return (
                    <tr key={bill._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{bill.billNumber}</span>
                          {bill.billImage?.url && (
                            <span title="Receipt file attached">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans font-normal">
                          {bill.items?.length || 0} item{bill.items?.length !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/customers/${customer._id}/ledger`}
                          className="font-semibold text-slate-200 hover:text-emerald-400 transition-colors"
                        >
                          {customer.name || 'Unknown'}
                        </Link>
                        <p className="text-[10px] text-slate-500">{customer.phoneNumber}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {new Date(bill.billDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                        ₹{bill.paidAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black">
                        <span className={bill.dueAmount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                          ₹{bill.dueAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge status={bill.paymentStatus} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Modal */}
                          <button
                            title="View Bill Details"
                            onClick={() => {
                              setSelectedBillForView(bill);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Invoice */}
                          <button
                            title="Print Invoice"
                            onClick={() => {
                              setSelectedBillForPrint(bill);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Send WhatsApp */}
                          <button
                            title="Send on WhatsApp"
                            disabled={sendingWhatsAppId === bill._id}
                            onClick={() => handleSendWhatsApp(bill)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Bill"
                            onClick={() => {
                              setBillToEdit(bill);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete Bill"
                            onClick={() => {
                              setBillToDelete(bill);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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
                onClick={() => fetchBills(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchBills(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bill Form Modal */}
      <BillFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setBillToEdit(null);
        }}
        onSuccess={() => fetchBills(pagination.page)}
        billToEdit={billToEdit}
      />

      {/* Bill View Modal */}
      <BillViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBillForView(null);
        }}
        bill={selectedBillForView}
      />

      {/* Bill Print Modal */}
      {selectedBillForPrint && (
        <BillPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedBillForPrint(null);
          }}
          bill={selectedBillForPrint}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handleDeleteBill}
        title="Delete Bill"
        message={`Are you sure you want to delete Bill #${billToDelete?.billNumber}? Customer ledger totals will be recalculated automatically.`}
        confirmText="Delete Bill"
        isLoading={isDeleting}
      />
    </div>
  );
};
