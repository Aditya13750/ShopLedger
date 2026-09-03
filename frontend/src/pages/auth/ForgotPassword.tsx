import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ReceiptText, Mail } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenHint, setTokenHint] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email);
      showToast('success', 'Reset Token Issued', res.message);
      if (res.data?.resetToken) {
        setTokenHint(res.data.resetToken);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Request failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950/50">
            <ReceiptText className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Forgot Password
        </h2>
        <p className="mt-1 text-center text-xs uppercase tracking-widest text-emerald-400 font-semibold">
          Reset your ShopLedger credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-card py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              placeholder="admin@shopledger.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Generate Reset Token
            </Button>
          </form>

          {tokenHint && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Your Password Reset Token:
              </p>
              <p className="text-xs font-mono bg-slate-900 p-2 rounded border border-emerald-500/20 break-all select-all">
                {tokenHint}
              </p>
              <div className="mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/reset-password?token=${tokenHint}`)}
                  className="w-full"
                >
                  Proceed to Reset Password
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center border-t border-slate-800 pt-5 text-xs text-slate-400">
            Remember your credentials?{' '}
            <Link to="/login" className="font-bold text-emerald-400 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
