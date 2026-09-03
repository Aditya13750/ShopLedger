import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ReceiptText,
  CreditCard,
  AlertCircle,
  Calendar,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Send,
  Loader2,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { dashboardService } from '../../services/dashboardService';
import { reminderService } from '../../services/reminderService';
import { useToast } from '../../context/ToastContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingReminderFor, setSendingReminderFor] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, anaRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getAnalytics(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleGlobalRefresh = () => fetchDashboardData();
    window.addEventListener('shopledger:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('shopledger:refresh', handleGlobalRefresh);
  }, []);

  const handleSendReminder = async (customerId: string, name: string) => {
    setSendingReminderFor(customerId);
    try {
      await reminderService.sendManualReminder(customerId);
      showToast('success', 'Reminder Sent', `WhatsApp payment reminder sent to ${name}.`);
      fetchDashboardData();
    } catch (error: any) {
      showToast('error', 'Failed', error.response?.data?.message || error.message);
    } finally {
      setSendingReminderFor(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const kpis = summary?.kpis || {};
  const recentBills = summary?.recentBills || [];
  const topDue = summary?.customersWithHighestDue || [];
  const recentReminders = summary?.recentReminders || [];
  const monthlyTrends = analytics?.monthlyTrends || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Overview & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time financial status, customer dues, and billing ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/bills">
            <Button variant="secondary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              All Bills
            </Button>
          </Link>
          <Link to="/customers">
            <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Customer Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={kpis.totalCustomers || 0}
          icon={<Users className="w-5 h-5" />}
          colorScheme="blue"
        />

        <StatCard
          title="Total Billing"
          value={`₹${(kpis.totalBilling || 0).toLocaleString('en-IN')}`}
          icon={<ReceiptText className="w-5 h-5" />}
          colorScheme="emerald"
        />

        <StatCard
          title="Payments Received"
          value={`₹${(kpis.totalPaymentsReceived || 0).toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-5 h-5" />}
          colorScheme="purple"
        />

        <StatCard
          title="Total Pending"
          value={`₹${(kpis.totalPendingAmount || 0).toLocaleString('en-IN')}`}
          subtitle="Outstanding balance"
          icon={<AlertCircle className="w-5 h-5" />}
          colorScheme="rose"
        />

        <StatCard
          title="Today's Sales"
          value={`₹${(kpis.todaySales || 0).toLocaleString('en-IN')}`}
          icon={<Calendar className="w-5 h-5" />}
          colorScheme="amber"
        />

        <StatCard
          title="This Month's Sales"
          value={`₹${(kpis.thisMonthSales || 0).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5" />}
          colorScheme="emerald"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales vs Payments Area Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Billing vs Collections Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly revenue generated compared with actual payments collected
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="paymentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales / Invoiced"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="payments"
                  name="Payments Collected"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#paymentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending Overview & Status breakdown */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Cash Flow Health
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recovery ratio & payment health
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Collected Revenue</span>
                  <span className="text-emerald-400 font-mono">
                    {kpis.totalBilling > 0
                      ? `${Math.round((kpis.totalPaymentsReceived / kpis.totalBilling) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        kpis.totalBilling > 0
                          ? Math.min(100, (kpis.totalPaymentsReceived / kpis.totalBilling) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Pending Dues Exposure</span>
                  <span className="text-rose-400 font-mono">
                    {kpis.totalBilling > 0
                      ? `${Math.round((kpis.totalPendingAmount / kpis.totalBilling) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        kpis.totalBilling > 0
                          ? Math.min(100, (kpis.totalPendingAmount / kpis.totalBilling) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Automated WhatsApp Reminders</p>
                <p className="text-[11px] text-slate-400">
                  Sends scheduled reminders to customers with dues
                </p>
              </div>
            </div>
            <Link to="/reminders">
              <Button variant="outline" size="sm" className="w-full mt-3">
                Configure Schedule
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Tables Row: Recent Bills & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Bills</h3>
              <p className="text-xs text-slate-400">Latest invoices generated in system</p>
            </div>
            <Link to="/bills" className="text-xs text-emerald-400 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2.5">Bill</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No bills generated yet.
                    </td>
                  </tr>
                ) : (
                  recentBills.map((b: any) => (
                    <tr key={b._id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-white">
                        {b.billNumber}
                        <p className="text-[10px] text-slate-500 font-normal">
                          {new Date(b.billDate).toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="py-3 text-slate-300">
                        {b.customer?.name || 'Customer'}
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-center">
                        <Badge status={b.paymentStatus} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Customers With Highest Due */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Customers With Highest Due
              </h3>
              <p className="text-xs text-slate-400">Accounts requiring payment follow-up</p>
            </div>
            <Link to="/customers?dueFilter=has_due" className="text-xs text-rose-400 hover:underline font-semibold">
              View All Dues
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5 text-right">Due Amount</th>
                  <th className="pb-2.5 text-center">Last Reminded</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {topDue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Great job! No customers with outstanding dues.
                    </td>
                  </tr>
                ) : (
                  topDue.map((c: any) => (
                    <tr key={c._id} className="hover:bg-slate-800/30">
                      <td className="py-3">
                        <Link
                          to={`/customers/${c._id}/ledger`}
                          className="font-bold text-white hover:text-emerald-400 transition-colors"
                        >
                          {c.name}
                        </Link>
                        <p className="text-[10px] text-slate-400">{c.phoneNumber}</p>
                      </td>
                      <td className="py-3 text-right font-extrabold text-rose-400">
                        ₹{c.totalDueAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-center text-slate-400">
                        {c.lastReminder
                          ? new Date(c.lastReminder).toLocaleDateString('en-IN')
                          : 'Never'}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={sendingReminderFor === c._id}
                          onClick={() => handleSendReminder(c._id, c.name)}
                          leftIcon={<Send className="w-3 h-3 text-emerald-400" />}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Remind
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Reminders Log Activity */}
      {recentReminders.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent WhatsApp Reminder Activity
              </h3>
              <p className="text-xs text-slate-400">
                Audit trail of automated and manual reminder dispatches
              </p>
            </div>
            <Link to="/reminders" className="text-xs text-emerald-400 hover:underline font-semibold">
              View Log History
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentReminders.map((r: any) => (
              <div
                key={r._id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{r.customer?.name || 'Customer'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Due: ₹{r.dueAmount?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {new Date(r.reminderDate).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <Badge status={r.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
