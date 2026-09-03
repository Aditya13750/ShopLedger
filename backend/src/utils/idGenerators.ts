import { Bill } from '../models/Bill';
import { Customer } from '../models/Customer';

export const generateBillNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `BILL-${currentYear}-`;

  // Find latest bill for this year
  const latestBill = await Bill.findOne({
    billNumber: new RegExp(`^${prefix}`),
  })
    .sort({ createdAt: -1 })
    .select('billNumber')
    .lean();

  let nextSequence = 1;
  if (latestBill && latestBill.billNumber) {
    const parts = latestBill.billNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const padded = String(nextSequence).padStart(4, '0');
  return `${prefix}${padded}`;
};

export const generateCustomerId = async (): Promise<string> => {
  const latestCustomer = await Customer.findOne({})
    .sort({ createdAt: -1 })
    .select('customerId')
    .lean();

  let nextSeq = 1001;
  if (latestCustomer && latestCustomer.customerId) {
    const parts = latestCustomer.customerId.split('-');
    if (parts.length === 2) {
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `CUST-${nextSeq}`;
};
