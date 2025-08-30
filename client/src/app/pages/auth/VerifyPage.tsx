import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { telemetry } from "@/lib/telemetry";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface VerifyPageProps {
  params?: { email?: string };
}

export function VerifyPage({ params }: VerifyPageProps) {
  const { t } = useTranslation(['auth', 'common']);
  
  // Get email from URL params, location state, or require manual entry
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email') || params?.email;
  
  const [email, setEmail] = useState(emailFromUrl || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [showEmailInput, setShowEmailInput] = useState(!emailFromUrl);
  const [autoResendDone, setAutoResendDone] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const autoResendAttempted = useRef(false); // Prevent duplicate auto-resends

  // REMOVED: Auto-resend on mount to prevent 429 rate limiting
  // Supabase already sends OTP during signup - no need for immediate resend
  // useEffect(() => {
  //   if (email && !autoResendDone && !autoResendAttempted.current) {
  //     autoResendAttempted.current = true;
  //     handleResend(true);
  //     setAutoResendDone(true);
  //   }
  // }, [email, autoResendDone]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      intervalRef.current = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    setError("");
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = async (isAutoResend = false) => {
    if (!email) return;
    if (resendCooldown > 0) return;
    if (resendCount >= 5) {
      setError(t('auth.verify.tooManyResends', 'Too many resend attempts. Please try again later.'));
      return;
    }

    // Additional protection against rapid successive calls
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        // Handle rate limiting errors gracefully
        if (error.message.includes('429') || error.message.toLowerCase().includes('too many')) {
          setError(t('auth.verify.rateLimited', 'Please wait before requesting another code.'));
          setResendCooldown(120); // Longer cooldown for rate limit
          return;
        }
        throw error;
      }

      // Track OTP sent
      telemetry.trackAuthOtpSent(email, isAutoResend);

      setResendCooldown(60);
      setResendCount(prev => prev + 1);
      
      if (!isAutoResend) {
        // Show success toast for manual resends
        setError(""); // Clear any previous errors
        // You could add a toast notification here
      }

    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError(t('auth.verify.enterComplete', 'Please enter the complete 6-digit code'));
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Track verification attempt
      telemetry.trackAuthOtpVerifyAttempted(email);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        telemetry.trackAuthOtpVerifyFailed(email, error.message);
        throw error;
      }

      // Track successful verification
      telemetry.trackAuthOtpVerifySucceeded(email);

      // Explicit navigation after successful verification
      // Check if user has an active plan to determine routing
      try {
        const { data: activePlan } = await supabase
          .from("app2_plans")
          .select("id, status")
          .eq("status", "active")
          .maybeSingle();
        
        if (activePlan) {
          // Returning user with active plan - go to app
          window.location.href = "/";
        } else {
          // New user without plan - start onboarding
          window.location.href = "/app/onboarding/biometrics";
        }
      } catch (planError) {
        console.error('Failed to check plan status:', planError);
        // On error, default to onboarding (safer for new users)
        window.location.href = "/app/onboarding/biometrics";
      }
      
    } catch (error: any) {
      setError(t('auth.verify.invalidCode', 'Invalid or expired code'));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowEmailInput(false);
      // Reset auto-resend protection when manually submitting email
      autoResendAttempted.current = false;
      handleResend(true);
      setAutoResendDone(true);
    }
  };

  const handleChangeEmail = () => {
    setShowEmailInput(true);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setResendCount(0);
    setResendCooldown(0);
    setAutoResendDone(false);
    // Reset auto-resend protection when changing email
    autoResendAttempted.current = false;
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every(digit => digit !== "") && !loading) {
      handleVerify();
    }
  }, [otp, loading]);

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#005870', // PALETTE.deepTeal
      }}
    >
      {/* Main teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      {/* Subtle lighter teal curved section with diagonal clip */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Header with Language Switcher */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content */}
      <div className="min-h-screen grid place-items-center py-4 relative z-10">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
          {/* Centered Logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/images/gymbud-wh.png" 
              alt="GymBud" 
              className="w-20 h-20 mb-2"
            />
          </div>
          
          <h1 className="text-4xl font-extrabold text-white mb-4 text-center tracking-tight">
            {t('auth.verify.title', 'Verify your email')}
          </h1>
          
          {showEmailInput ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-white/80 text-center mb-6">
                {t('auth.verify.enterEmail', 'Enter your email address to receive a verification code')}
              </p>
              
              <input
                type="email"
                placeholder={t('auth.email', 'Email address')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                required
              />
              
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? t('common.loading', 'Loading...') : t('auth.verify.sendCode', 'Send Code')}
              </button>
            </form>
          ) : (
            <>
              <p className="text-white/80 text-center mb-6">
                {t('auth.verify.instruction', 'Enter the 6-digit code sent to')} <br />
                <span className="font-semibold text-white">{email}</span>
              </p>
              
              {/* OTP Input */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                ))}
              </div>
              
              {error && (
                <div className="text-red-300 text-sm text-center mb-4">{error}</div>
              )}
              
              {/* Resend button */}
              <div className="text-center mb-6">
                <button
                  onClick={() => handleResend(false)}
                  disabled={resendCooldown > 0 || loading || resendCount >= 5}
                  className="text-white/80 hover:text-white transition-colors duration-200 text-base disabled:opacity-50"
                >
                  {resendCooldown > 0 
                    ? t('auth.verify.resendIn', `Resend in ${resendCooldown}s`, { seconds: resendCooldown })
                    : resendCount >= 5
                      ? t('auth.verify.tooManyResends', 'Too many attempts')
                      : t('auth.verify.resend', 'Resend code')
                  }
                </button>
              </div>
              
              {/* Change email link */}
              <div className="text-center">
                <button
                  onClick={handleChangeEmail}
                  className="text-white/80 hover:text-white transition-colors duration-200 text-sm"
                >
                  {t('auth.verify.changeEmail', 'Change email address')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
