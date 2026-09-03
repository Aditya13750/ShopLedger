import React from 'react';
import { Menu, Plus, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
  onOpenCreateBill?: () => void;
  onOpenRecordPayment?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onOpenCreateBill,
  onOpenRecordPayment,
  title,
}) => {
  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>}
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenRecordPayment && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRecordPayment}
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
            className="hidden sm:inline-flex"
          >
            Record Payment
          </Button>
        )}
        {onOpenCreateBill && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateBill}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Bill
          </Button>
        )}
      </div>
    </header>
  );
};
