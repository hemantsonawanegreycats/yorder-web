import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { useCartStore } from '../../stores/useCartStore';
import { X, Phone, ShieldCheck, LogOut, Package, User } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    isAuthenticated,
    user,
    sendOtp,
    verifyOtp,
    logout,
  } = useAuthStore();
  const { showToast, go } = useAppStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setStep('phone');
    setPhoneNumber('');
    setOtpCode('');
    setErrorMsg('');
    setResendCooldown(0);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resendCooldown > 0 && step === 'otp') return;

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const res = await sendOtp(cleanPhone);
    setSubmitting(false);
    if (res.status) {
      setStep('otp');
      setResendCooldown(30);
      showToast(res.message);
    } else {
      setErrorMsg(res.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMsg('Please enter the verification code');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const res = await verifyOtp(cleanPhone, otpCode);
    setSubmitting(false);
    if (res.status) {
      showToast('Welcome to Yorder!');
      const pending = useCartStore.getState().pendingAddProduct;
      if (pending) {
        useCartStore.getState().addToBag(pending.product, pending.size, pending.variantId);
        useCartStore.getState().setPendingAddProduct(null);
      }
      handleClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out of session');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--bg)] border border-[var(--bd)] p-6 md:p-8 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--s1)] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isAuthenticated && user ? (
          /* Logged In Profile View */
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-lg font-semibold text-[var(--gold)]">
                {user.first_name ? user.first_name[0].toUpperCase() : 'YO'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[17px] text-[var(--t1)] truncate">
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ''}`
                    : user.phone || 'Yorder Customer'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ok)] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--bd)]">
              <button
                onClick={() => {
                  handleClose();
                  go('order');
                }}
                className="flex items-center justify-between p-3.5 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] text-xs font-medium text-[var(--t1)] hover:border-[var(--gold)] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[var(--gold)]" />
                  My Orders & Live Trials
                </span>
                <span className="text-[var(--t3)]">→</span>
              </button>

              <button
                onClick={() => {
                  handleClose();
                  go('bag');
                }}
                className="flex items-center justify-between p-3.5 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] text-xs font-medium text-[var(--t1)] hover:border-[var(--gold)] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[var(--gold)]" />
                  Bag & Checkout
                </span>
                <span className="text-[var(--t3)]">→</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full h-[44px] rounded-[22px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          /* Phone OTP Login Flow */
          <div className="flex flex-col gap-5">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase font-semibold">
                YORDER MEMBERSHIP
              </div>
              <h2 className="font-semibold text-[22px] text-[var(--t1)] mt-2">
                {step === 'phone' ? 'Log in with Mobile' : 'Verify Code'}
              </h2>
              <p className="text-xs text-[var(--t3)] mt-1.5 leading-relaxed">
                {step === 'phone'
                  ? 'Access your orders, door trials, and saved local showrooms.'
                  : `Enter the code sent to +91 ${phoneNumber}.`}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-[12px] bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 h-[48px] px-4 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
                  <span className="font-mono text-xs text-[var(--t3)] select-none">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      if (errorMsg) setErrorMsg('');
                      setPhoneNumber(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="9876543210"
                    aria-label="10-digit mobile number"
                    style={{ background: 'transparent', color: 'var(--t1)' }}
                    className="w-full bg-transparent border-0 outline-none text-sm text-[var(--t1)] placeholder-[var(--t4)] font-mono"
                    autoFocus
                  />
                  <Phone className="w-4 h-4 text-[var(--t4)]" />
                </div>

                <button
                  type="submit"
                  disabled={submitting || phoneNumber.length < 10}
                  className="w-full h-[48px] rounded-[24px] bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  {submitting ? 'Sending verification code...' : 'Continue with OTP'}
                </button>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-xs text-[var(--t3)] hover:text-[var(--gold)] transition-colors py-1"
                  >
                    Skip & Browse Showrooms as Guest →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex items-center h-[48px] px-4 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      if (errorMsg) setErrorMsg('');
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                    }}
                    placeholder="Enter 6-digit OTP"
                    aria-label="6-digit OTP verification code"
                    className="w-full bg-transparent border-0 outline-none text-sm text-[var(--t1)] placeholder-[var(--t4)] font-mono text-center tracking-widest"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpCode.length < 4}
                  className="w-full h-[48px] rounded-[24px] bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  {submitting ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <div className="flex items-center justify-between text-xs text-[var(--t3)] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setErrorMsg('');
                    }}
                    className="hover:underline hover:text-[var(--t1)]"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || submitting}
                    onClick={handleSendOtp}
                    className="text-[var(--gold)] hover:underline disabled:opacity-50 disabled:no-underline font-medium"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-[10px] text-[var(--t4)] text-center leading-normal pt-2 border-t border-[var(--bd)]">
              By continuing, you agree to Yorder's Terms of Service and Doorstep Trial Policies.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
