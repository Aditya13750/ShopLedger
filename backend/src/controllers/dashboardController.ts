import { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { Bill } from '../models/Bill';
import { Payment } from '../models/Payment';
import { Reminder } from '../models/Reminder';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class DashboardController {
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();

      // Today's boundaries
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // This month's boundaries
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalCustomers,
        billingAggregate,
        paymentsAggregate,
        todaySalesAggregate,
        thisMonthSalesAggregate,
        recentBills,
        topDueCustomers,
        recentReminders,
      ] = await Promise.all([
        Customer.countDocuments(),
        Bill.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        Bill.aggregate([
          { $match: { billDate: { $gte: startOfToday, $lte: endOfToday } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Bill.aggregate([
          { $match: { billDate: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Bill.find()
          .populate('customer', 'name customerId phoneNumber')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean(),
        Customer.find({ totalDueAmount: { $gt: 0 } })
          .sort({ totalDueAmount: -1 })
          .limit(5)
          .lean(),
        Reminder.find()
          .populate('customer', 'name customerId phoneNumber')
          .sort({ reminderDate: -1 })
          .limit(5)
          .lean(),
      ]);

      const totalBilling = billingAggregate[0]?.total || 0;
      const totalPayments = paymentsAggregate[0]?.total || 0;
      const totalPending = Math.max(0, totalBilling - totalPayments);
      const todaySales = todaySalesAggregate[0]?.total || 0;
      const thisMonthSales = thisMonthSalesAggregate[0]?.total || 0;

      // Enhance top due customers with their last reminder
      const enrichedTopDue = await Promise.all(
        topDueCustomers.map(async (c) => {
          const lastRem = await Reminder.findOne({ customer: c._id }).sort({ reminderDate: -1 }).lean();
          return {
            ...c,
            lastReminder: lastRem ? lastRem.reminderDate : null,
          };
        })
      );

      sendSuccess(res, 'Dashboard summary retrieved', {
        kpis: {
          totalCustomers,
          totalBilling,
          totalPaymentsReceived: totalPayments,
          totalPendingAmount: totalPending,
          todaySales,
          thisMonthSales,
        },
        recentBills,
        customersWithHighestDue: enrichedTopDue,
        recentReminders,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch dashboard summary', 500);
    }
  }

  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);

      // Monthly sales aggregation for current year
      const monthlySalesData = await Bill.aggregate([
        { $match: { billDate: { $gte: startOfYear } } },
        {
          $group: {
            _id: { $month: '$billDate' },
            sales: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]);

      // Monthly payments aggregation for current year
      const monthlyPaymentsData = await Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfYear } } },
        {
          $group: {
            _id: { $month: '$paymentDate' },
            payments: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      const monthlyTrends = monthNames.map((name, index) => {
        const monthNum = index + 1;
        const saleMatch = monthlySalesData.find((s) => s._id === monthNum);
        const paymentMatch = monthlyPaymentsData.find((p) => p._id === monthNum);

        return {
          month: name,
          sales: saleMatch ? saleMatch.sales : 0,
          payments: paymentMatch ? paymentMatch.payments : 0,
          billsCount: saleMatch ? saleMatch.count : 0,
        };
      });

      // Status breakdown
      const billStatusCounts = await Bill.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            amount: { $sum: '$totalAmount' },
          },
        },
      ]);

      sendSuccess(res, 'Dashboard analytics retrieved', {
        monthlyTrends,
        billStatusCounts,
      });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch dashboard analytics', 500);
    }
  }
}
