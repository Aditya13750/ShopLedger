import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BillFormModal } from '../bills/BillFormModal';
import { PaymentModal } from '../payments/PaymentModal';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createBillModalOpen, setCreateBillModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenCreateBill={() => setCreateBillModalOpen(true)}
          onOpenRecordPayment={() => setRecordPaymentModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <BillFormModal
        isOpen={createBillModalOpen}
        onClose={() => setCreateBillModalOpen(false)}
        onSuccess={() => {
          setCreateBillModalOpen(false);
          window.dispatchEvent(new CustomEvent('shopledger:refresh'));
        }}
      />

      <PaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        onSuccess={() => {
          setRecordPaymentModalOpen(false);
          window.dispatchEvent(new CustomEvent('shopledger:refresh'));
        }}
      />
    </div>
  );
};
