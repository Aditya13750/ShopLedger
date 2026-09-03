import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  ReceiptText,
  CreditCard,
  MessageSquare,
  Trash2,
  Edit2,
  BookOpen,
  ArrowUpDown,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CustomerModal } from '../../components/customers/CustomerModal';
import { BillFormModal } from '../../components/bills/BillFormModal';
import { PaymentModal } from '../../components/payments/PaymentModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { reminderService } from '../../services/reminderService';
import { useToast } from '../../context/ToastContext';

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const dueFilter = searchParams.get('dueFilter') || 'all';
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [targetCustomerIdForBill, setTargetCustomerIdForBill] = useState<string>('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetCustomerIdForPayment, setTargetCustomerIdForPayment] = useState<string>('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await customerService.getCustomers({
        search,
        dueFilter: dueFilter as any,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      });

      if (res.success && res.data) {
        setCustomers(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err: any) {
      showToast('error', 'Failed', 'Could not load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [dueFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handleSendReminder = async (customer: Customer) => {
    if (customer.totalDueAmount <= 0) {
      showToast('info', 'No Due', `${customer.name} has no outstanding balance.`);
      return;
    }

    setSendingReminderId(customer._id);
    try {
      await reminderService.sendManualReminder(customer._id);
      showToast('success', 'Reminder Sent', `WhatsApp payment reminder sent to ${customer.name}.`);
      fetchCustomers(pagination.page);
    } catch (error: any) {
      showToast('error', 'Failed', error.response?.data?.message || error.message);
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(customerToDelete._id);
      showToast('success', 'Deleted', `${customerToDelete.name} has been removed.`);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(pagination.page);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.response?.data?.message || error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage customer accounts, billing history, and ledger balances.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setCustomerToEdit(null);
            setIsCustomerModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Due Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'has_due', label: 'With Pending Due' },
              { id: 'zero_due', label: 'Fully Paid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSearchParams({ dueFilter: tab.id });
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dueFilter === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, phone, or ID..."
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

        {/* Sort selector */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="lastActivity">Recent Activity</option>
              <option value="totalDueAmount">Highest Due</option>
              <option value="totalBillAmount">Highest Billing</option>
              <option value="name">Customer Name</option>
              <option value="createdAt">Date Added</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <span>Total: {pagination.total} customers</span>
        </div>
      </Card>

      {/* Customer Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={<Users className="w-8 h-8" />}
                      title="No Customers Found"
                      description="Add your first customer to begin recording bills, payments, and WhatsApp reminders."
                      actionText="Add Customer"
                      onAction={() => {
                        setCustomerToEdit(null);
                        setIsCustomerModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/customers/${customer._id}/ledger`}
                        className="font-bold text-white hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{customer.name}</span>
                      </Link>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {customer.customerId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{customer.phoneNumber}</span>
                      </div>
                      {customer.whatsappNumber && customer.whatsappNumber !== customer.phoneNumber && (
                        <span className="text-[10px] text-emerald-500/80 block">
                          WA: {customer.whatsappNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-200 font-semibold text-xs">
                      ₹{customer.totalBillAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold text-xs">
                      ₹{customer.totalPaidAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right text-xs">
                      <span
                        className={`font-black ${
                          customer.totalDueAmount > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        ₹{customer.totalDueAmount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      {new Date(customer.lastActivity || customer.createdAt).toLocaleDateString(
                        'en-IN',
                        { day: '2-digit', month: 'short' }
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Ledger */}
                        <Link to={`/customers/${customer._id}/ledger`}>
                          <button
                            title="View Account Ledger"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </Link>

                        {/* Create Bill */}
                        <button
                          title="Create Bill for Customer"
                          onClick={() => {
                            setTargetCustomerIdForBill(customer._id);
                            setIsBillModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ReceiptText className="w-4 h-4" />
                        </button>

                        {/* Record Payment */}
                        <button
                          title="Record Payment"
                          onClick={() => {
                            setTargetCustomerIdForPayment(customer._id);
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Send WhatsApp Reminder */}
                        {customer.totalDueAmount > 0 && (
                          <button
                            title="Send WhatsApp Due Reminder"
                            disabled={sendingReminderId === customer._id}
                            onClick={() => handleSendReminder(customer)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          title="Edit Customer"
                          onClick={() => {
                            setCustomerToEdit(customer);
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete Customer"
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                onClick={() => fetchCustomers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={() => fetchCustomers(pagination.page)}
        customerToEdit={customerToEdit}
      />

      {/* Quick Bill Modal */}
      <BillFormModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        preselectedCustomerId={targetCustomerIdForBill}
        onSuccess={() => fetchCustomers(pagination.page)}
      />

      {/* Quick Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedCustomerId={targetCustomerIdForPayment}
        onSuccess={() => fetchCustomers(pagination.page)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer Account"
        message={`Are you sure you want to delete ${customerToDelete?.name}? All associated bills and payments for this customer will also be deleted.`}
        confirmText="Delete Account"
        isLoading={isDeleting}
      />
    </div>
  );
};
