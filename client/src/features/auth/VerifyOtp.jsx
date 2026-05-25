import React, { useState, useEffect, useRef } from 'react';
import { verifyOtp, resendOtp } from './AuthService';
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw, KeyRound, ChevronLeft } from 'lucide-react';
import bgControl from '../../assets/bg-control.png';

/**
 * Component for users to enter and verify their One-Time Password (OTP).
 *
 * @param {Object} props - Component props
 * @param {string} props.email - The user's email address where the OTP was sent
 * @param {Function} props.onVerificationSuccess - Callback invoked when OTP is successfully verified
 * @param {Function} props.onSwitchToLogin - Callback to switch the view back to the login screen
 * @returns {React.ReactElement} The rendered OTP Verification view
 */
export const VerifyOtp = ({ email, onVerificationSuccess, onSwitchToLogin }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // 15 minutes timer = 900 seconds
  const [timeLeft, setTimeLeft] = useState(900);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Cooldown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  /**
   * Formats a duration in seconds into a MM:SS string.
   * 
   * @param {number} seconds - The duration in seconds
   * @returns {string} The formatted time string
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handles changes in the OTP input fields.
   * Ensures only numeric input and auto-focuses the next field.
   * 
   * @param {number} index - The index of the input field
   * @param {string} value - The new value of the input field
   */
  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value !== '' && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  /**
   * Handles keyboard events in the OTP input fields.
   * Allows moving to the previous field on Backspace.
   * 
   * @param {number} index - The index of the input field
   * @param {React.KeyboardEvent} e - The keyboard event
   */
  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && otp[index] === '' && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
  };

  /**
   * Handles pasting a 6-digit code into the OTP input fields.
   * 
   * @param {React.ClipboardEvent} e - The paste event
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split('');
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || '';
      if (inputRefs[i].current) {
        inputRefs[i].current.value = digits[i] || '';
      }
    }
    setOtp(newOtp);
    setError(null);
    if (inputRefs[5].current) {
      inputRefs[5].current.focus();
    }
  };

  /**
   * Handles the submission of the OTP for verification.
   * 
   * @param {React.FormEvent} [e] - The form submission event (optional)
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await verifyOtp(email, otpCode);
      setSuccess('Verification successful! Logging you in...');
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
      setLoading(false);
    }
  };

  /**
   * Requests a new OTP to be sent and restarts the cooldown timer.
   */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResending(true);

    try {
      await resendOtp(email);
      setSuccess('A new verification code has been sent.');
      setTimeLeft(900); // Reset expiry timer to 15m
      setResendCooldown(60); // 60s cooldown for resend button
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-background">
      <div 
        className="fixed inset-0 bg-cover bg-center blur-[20px] opacity-40" 
        style={{ backgroundImage: `url(${bgControl})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-background via-transparent to-background" />

      <div className="relative w-[480px] bg-surface/80 backdrop-blur-xl border border-border p-8 rounded-sm shadow-2xl">
        {/* Back to Login Button */}
        <button 
          onClick={onSwitchToLogin}
          className="absolute top-6 left-6 flex items-center gap-1 text-[#A1A1AA] hover:text-[#FAFAFA] font-mono text-[0.65rem] uppercase tracking-wider transition-all"
        >
          <ChevronLeft size={12} /> Back to Login
        </button>

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-16 h-16 bg-accent-blue/10 flex items-center justify-center rounded-sm mb-4 border border-accent-blue/20">
            <KeyRound className="text-accent-blue" size={32} />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-[#FAFAFA] font-mono">Security Verification</h1>
          <p className="text-xs text-[#A1A1AA] font-mono mt-2 tracking-tighter uppercase text-center max-w-[340px]">
            Enter the 6-digit verification code sent to:
            <span className="block text-accent-blue font-semibold mt-1 lowercase tracking-normal select-all">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 bg-background/60 border border-border focus:border-accent-blue text-[#FAFAFA] font-mono text-center text-xl font-bold rounded-sm focus:outline-none focus:ring-1 focus:ring-accent-blue transition-all"
              />
            ))}
          </div>

          <div className="flex justify-between items-center font-mono text-[0.65rem]">
            <span className="text-[#A1A1AA] uppercase">Code expires in:</span>
            <span className={`font-semibold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#FAFAFA]'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm">
              <ShieldAlert size={16} />
              <span className="font-mono text-[0.65rem] uppercase font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm">
              <ShieldCheck size={16} />
              <span className="font-mono text-[0.65rem] uppercase font-bold">{success}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || otp.join('').length < 6}
            className="w-full bg-accent-blue hover:bg-blue-600 disabled:bg-blue-800/40 disabled:text-[#A1A1AA] py-3 font-mono text-sm font-bold text-white rounded-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button 
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="flex items-center gap-2 text-accent-blue hover:underline disabled:text-[#A1A1AA] disabled:no-underline font-mono text-[0.7rem] uppercase tracking-widest transition-all"
          >
            {resending ? (
              <Loader2 className="animate-spin" size={12} />
            ) : (
              <RefreshCw size={12} />
            )}
            {resendCooldown > 0 ? `Resend code in (${resendCooldown}s)` : 'Resend Verification Code'}
          </button>
        </div>

        {/* Spam warnings footer */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col items-center">
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 px-4 py-2.5 rounded-sm font-mono text-[0.7rem] uppercase tracking-wide">
            <ShieldAlert size={14} className="text-yellow-500" />
            <span>Check your <strong>spam/junk</strong> folder if you can't find the email</span>
          </div>
        </div>
      </div>
    </div>
  );
};
