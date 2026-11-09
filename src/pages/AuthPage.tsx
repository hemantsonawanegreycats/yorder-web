import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useAppStore } from '../stores/useAppStore';
import { SEO } from '../components/common/SEO';
import { Phone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, isAuthenticated, user, logout } = useAuthStore();
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
      setErrorMsg(res.message || 'Failed to send OTP code');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const res = await verifyOtp(cleanPhone, otpCode);
    setSubmitting(false);
    if (res.status) {
      showToast('Successfully authenticated!');
      const pending = useCartStore.getState().pendingAddProduct;
      if (pending) {
        useCartStore.getState().addToBag(pending.product, pending.size, pending.variantId);
        useCartStore.getState().setPendingAddProduct(null);
        navigate('/bag');
      } else {
        navigate('/profile');
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
        <SEO title="Account — Yorder" description="Your Yorder membership account" canonical="https://yorder.com/login" />
        <div className="w-full max-w-md p-8 rounded-[24px] bg-[var(--s0)] border border-[var(--bd)] text-center flex flex-col items-center gap-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-xl font-bold text-[var(--gold)]">
            {user.first_name ? user.first_name[0].toUpperCase() : 'YO'}
          </div>
          <div>
            <h1 className="font-semibold text-2xl text-[var(--t1)]">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Verified Customer'}
            </h1>
            <p className="font-mono text-xs text-[var(--t3)] mt-1">{user.phone || 'Phone verified'}</p>
          </div>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-full h-11 rounded-full bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90"
            >
              Go to Profile & Settings <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                await logout();
                showToast('Signed out');
              }}
              className="w-full h-11 rounded-full bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t2)] hover:text-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 md:p-8">
      <SEO title="Sign In & Sign Up — Yorder" description="Sign in or register with your mobile phone number on Yorder." canonical="https://yorder.com/login" />
      <div className="w-full max-w-md rounded-[28px] bg-[var(--s0)] border border-[var(--bd)] p-6 md:p-10 shadow-2xl flex flex-col gap-6">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--gold)] uppercase font-semibold">
            SECURE AUTHENTICATION
          </div>
          <h1 className="font-semibold text-2xl md:text-3xl text-[var(--t1)] mt-2">
            {step === 'phone' ? 'Sign in or Register' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs text-[var(--t3)] mt-2 leading-relaxed">
            {step === 'phone'
              ? 'Enter your mobile number. We will send an OTP to sign in or create your new Yorder account.'
              : `Enter the 6-digit code sent to +91 ${phoneNumber}.`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[14px] bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 h-[52px] px-4 rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
              <span className="font-mono text-sm text-[var(--t3)] select-none">+91</span>
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
                placeholder="Mobile number"
                aria-label="10-digit mobile number"
                className="w-full bg-transparent border-0 outline-none text-sm text-[var(--t1)] placeholder-[var(--t4)] font-mono tracking-wider"
                autoFocus
              />
              <Phone className="w-4 h-4 text-[var(--t4)]" />
            </div>

            <button
              type="submit"
              disabled={submitting || phoneNumber.length < 10}
              className="w-full h-[50px] rounded-[25px] bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs tracking-wider uppercase disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? 'Sending OTP...' : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex items-center h-[52px] px-4 rounded-[16px] bg-[var(--s1)] border border-[var(--bd)] focus-within:border-[var(--gold)] transition-colors">
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
                placeholder="6-digit OTP"
                aria-label="6-digit OTP code"
                className="w-full bg-transparent border-0 outline-none text-base text-[var(--t1)] placeholder-[var(--t4)] font-mono text-center tracking-[0.3em]"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otpCode.length < 4}
              className="w-full h-[50px] rounded-[25px] bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs tracking-wider uppercase disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? 'Verifying...' : 'Verify & Continue'}
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
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Guest Information Card */}
        <div className="p-4 rounded-[18px] bg-[var(--s1)]/60 border border-[var(--bd)] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--t2)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
            <span>Why login is required:</span>
          </div>
          <p className="text-[11px] text-[var(--t3)] leading-relaxed pl-6">
            Yorder allows guest browsing of real showroom floors and stock. To place doorstep trial orders, save delivery addresses, and chat with floor reps, login is required by our partner showrooms.
          </p>
        </div>
      </div>
    </div>
  );
};
