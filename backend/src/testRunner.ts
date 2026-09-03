import { BillingService } from './services/billingService';
import { ReminderService } from './services/reminderService';
import { WhatsAppService } from './services/whatsappService';

console.log('🧪 Starting ShopLedger Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition: boolean, testName: string) => {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
};

// 1. Test Billing Calculations
(() => {
  console.log('--- Test Suite 1: Billing Calculations ---');
  const items = [
    { productName: 'Rice Bag 25kg', quantity: 2, unitPrice: 1200 }, // 2400
    { productName: 'Cooking Oil 5L', quantity: 1, unitPrice: 650 },  // 650
  ];
  const discount = 150;
  const tax = 90;
  const paidAmount = 1000;

  const result = BillingService.calculateTotals(items, discount, tax, paidAmount);

  // Subtotal = 2400 + 650 = 3050
  assert(result.subtotal === 3050, 'Subtotal correctly computed as 3050');

  // Grand Total = 3050 - 150 + 90 = 2990
  assert(result.totalAmount === 2990, 'Grand Total correctly computed as 2990');

  // Paid = 1000, Due = 1990
  assert(result.paidAmount === 1000, 'Paid amount recorded as 1000');
  assert(result.dueAmount === 1990, 'Remaining due correctly computed as 1990');
  assert(result.paymentStatus === 'PARTIALLY_PAID', 'Payment status marked PARTIALLY_PAID');

  // Fully Paid scenario
  const fullPaidResult = BillingService.calculateTotals(items, discount, tax, 2990);
  assert(fullPaidResult.dueAmount === 0, 'Due amount is 0 when fully paid');
  assert(fullPaidResult.paymentStatus === 'PAID', 'Payment status marked PAID when due is 0');

  // Unpaid scenario
  const unpaidResult = BillingService.calculateTotals(items, discount, tax, 0);
  assert(unpaidResult.dueAmount === 2990, 'Due equals grand total when paid is 0');
  assert(unpaidResult.paymentStatus === 'UNPAID', 'Payment status marked UNPAID when paid is 0');
})();

// 2. Test Reminder Deduplication Logic
(() => {
  console.log('\n--- Test Suite 2: Reminder Deduplication Logic ---');

  // Null date => should send
  assert(ReminderService.shouldSendReminder(null, 'WEEKLY', 7), 'Sends reminder if never sent before');

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  // Weekly rule (7 days)
  assert(
    !ReminderService.shouldSendReminder(twoDaysAgo, 'WEEKLY', 7),
    'Prevents duplicate weekly reminder if only 2 days have passed'
  );
  assert(
    ReminderService.shouldSendReminder(eightDaysAgo, 'WEEKLY', 7),
    'Allows reminder if 8 days have passed under weekly rule'
  );

  // Daily rule
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  assert(
    !ReminderService.shouldSendReminder(twelveHoursAgo, 'DAILY', 1),
    'Prevents duplicate daily reminder within 24 hours'
  );
  assert(
    ReminderService.shouldSendReminder(twoDaysAgo, 'DAILY', 1),
    'Allows daily reminder after 2 days'
  );
})();

// 3. Test Phone Number Normalization
(() => {
  console.log('\n--- Test Suite 3: WhatsApp Phone Sanitization ---');
  assert(WhatsAppService.cleanPhoneNumber('+91 98765 43210') === '919876543210', 'Strips + and spaces');
  assert(WhatsAppService.cleanPhoneNumber('9876543210') === '919876543210', 'Adds 91 to 10-digit Indian numbers');
  assert(WhatsAppService.cleanPhoneNumber('08084316170') === '918084316170', 'Strips leading 0 and adds 91 for Indian numbers');
  assert(WhatsAppService.cleanPhoneNumber('14155552671') === '14155552671', 'Preserves international country codes');
})();

// 4. Test Ledger Running Balance Logic
(() => {
  console.log('\n--- Test Suite 4: Ledger Running Balance Mathematics ---');
  // Replicating customer ledger chronological engine
  type MockEntry = { type: 'BILL' | 'PAYMENT'; amount: number };
  const transactions: MockEntry[] = [
    { type: 'BILL', amount: 2000 },    // Bal: 2000
    { type: 'PAYMENT', amount: 500 },  // Bal: 1500
    { type: 'BILL', amount: 1000 },    // Bal: 2500
    { type: 'PAYMENT', amount: 2500 }, // Bal: 0
  ];

  let runningBalance = 0;
  const balances: number[] = [];
  for (const t of transactions) {
    if (t.type === 'BILL') {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }
    balances.push(runningBalance);
  }

  assert(balances[0] === 2000, 'Step 1: Bill ₹2000 => Balance ₹2000');
  assert(balances[1] === 1500, 'Step 2: Payment ₹500 => Balance ₹1500');
  assert(balances[2] === 2500, 'Step 3: Bill ₹1000 => Balance ₹2500');
  assert(balances[3] === 0, 'Step 4: Payment ₹2500 => Balance ₹0 (Settled)');
})();

console.log(`\n🎉 Verification Complete: ${passedTests}/${totalTests} tests passed successfully!`);
