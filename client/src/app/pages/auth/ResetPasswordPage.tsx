import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { telemetry } from "@/lib/telemetry";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const { t } = useTranslation(['auth', 'common']);
  const [, setLocation] = useLocation();

  // Detect if we're in update mode (token present) or request mode
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token') || urlParams.get('token');
  const isUpdateMode = !!accessToken;

  useEffect(() => {
    if (isUpdateMode) {
      telemetry.trackAuthPasswordResetLinkOpened();
    }
  }, [isUpdateMode]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError(t('auth.reset.errors.password_requirements', 'Password must be at least 8 characters long'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('auth.reset.errors.password_mismatch', 'Passwords do not match'));
      return false;
    }
    return true;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (resendCount >= 5) {
      setError(t('auth.reset.errors.too_many_attempts', 'Too many reset attempts. Please try again later.'));
      setLoading(false);
      return;
    }

    try {
      telemetry.trackAuthPasswordResetRequested();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/auth/reset`,
      });

      if (error) throw error;

      telemetry.trackAuthPasswordResetEmailSent();
      setSuccess(t('auth.reset.sent', 'We sent a reset link to {{email}}.', { email }));
      setResendCount(prev => prev + 1);
      setResendCooldown(60);

    } catch (error: any) {
      setError(t('auth.errors.generic', 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) {
      telemetry.trackAuthPasswordResetResendThrottled();
      return;
    }
    
    const form = new Event('submit');
    handleRequestReset(form as any);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validatePassword()) {
      setLoading(false);
      return;
    }

    try {
      telemetry.trackAuthPasswordResetUpdateAttempted();

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          telemetry.trackAuthPasswordResetInvalidToken();
          setError(t('auth.reset.errors.invalid_token', 'This link is invalid or expired.'));
          return;
        }
        throw error;
      }

      telemetry.trackAuthPasswordResetUpdateSucceeded();
      setSuccess(t('auth.reset.success', 'Your password was updated.'));

    } catch (error: any) {
      telemetry.trackAuthPasswordResetUpdateFailed();
      setError(error.message || t('auth.errors.generic', 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setLocation('/auth/signin');
  };

  const handleGoToApp = async () => {
    // Check if user has an active plan to determine routing
    try {
      const { data: activePlan } = await supabase
        .from("app2_plans")
        .select("id, status")
        .eq("status", "active")
        .maybeSingle();
      
      if (activePlan) {
        setLocation("/");
      } else {
        setLocation("/app/onboarding/biometrics");
      }
    } catch (error) {
      console.error('Failed to check plan status:', error);
      setLocation("/app/onboarding/biometrics");
    }
  };

  const handleRequestNewLink = () => {
    // Switch to request mode by removing token from URL
    window.history.replaceState({}, '', '/app/auth/reset');
    window.location.reload();
  };

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
          
          <h1 className="text-4xl font-extrabold text-white mb-8 text-center tracking-tight">
            {isUpdateMode 
              ? t('auth.reset.title.update', 'Choose a new password')
              : t('auth.reset.title.request', 'Reset your password')
            }
          </h1>

          {/* Success state */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-green-500/20 border border-green-400/30">
              <p className="text-green-100 text-center mb-4">{success}</p>
              
              {isUpdateMode ? (
                <div className="space-y-3">
                  <button
                    onClick={handleBackToSignIn}
                    className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors duration-200"
                  >
                    {t('auth.reset.back_to_signin', 'Back to sign in')}
                  </button>
                  <button
                    onClick={handleGoToApp}
                    className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors duration-200"
                  >
                    {t('common.goToApp', 'Go to app')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resendCooldown > 0 ? (
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-2xl bg-white/10 text-white/50 font-semibold"
                    >
                      {t('auth.reset.resend_in', 'Resend in {{seconds}}s', { seconds: resendCooldown })}
                    </button>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors duration-200"
                    >
                      {t('auth.reset.resend', 'Resend link')}
                    </button>
                  )}
                  <button
                    onClick={handleBackToSignIn}
                    className="w-full py-3 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors duration-200"
                  >
                    {t('auth.reset.back_to_signin', 'Back to sign in')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error state for invalid token */}
          {error && error.includes('invalid') && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-400/30">
              <p className="text-red-100 text-center mb-4">{error}</p>
              <button
                onClick={handleRequestNewLink}
                className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors duration-200"
              >
                {t('auth.reset.request_new', 'Request a new reset link')}
              </button>
            </div>
          )}

          {/* Forms - only show if no success state */}
          {!success && (
            <>
              {isUpdateMode ? (
                /* Update Password Form */
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <input
                    type="password"
                    placeholder={t('auth.reset.new_password', 'New password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                    required
                    minLength={8}
                  />
                  
                  <input
                    type="password"
                    placeholder={t('auth.reset.confirm_password', 'Confirm new password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                    required
                    minLength={8}
                  />
                  
                  {error && !error.includes('invalid') && (
                    <div className="text-red-300 text-sm text-center">{error}</div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading || password !== confirmPassword || password.length < 8}
                    className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-50 mt-6"
                  >
                    {loading 
                      ? t('common.loading', 'Loading...') 
                      : t('auth.reset.submit.update', 'Update password')
                    }
                  </button>
                </form>
              ) : (
                /* Request Reset Form */
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <input
                    type="email"
                    placeholder={t('auth.reset.email.placeholder', 'Enter your email address')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                    required
                  />
                  
                  {error && !error.includes('invalid') && (
                    <div className="text-red-300 text-sm text-center">{error}</div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading || resendCount >= 5}
                    className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-50 mt-6"
                  >
                    {loading 
                      ? t('common.loading', 'Loading...') 
                      : t('auth.reset.submit.request', 'Send reset link')
                    }
                  </button>
                </form>
              )}

              {/* Back to sign in link - only show if no success and not in error state */}
              {!error && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleBackToSignIn}
                    className="text-white/70 hover:text-white/90 transition-colors duration-200 text-sm"
                  >
                    {t('auth.reset.back_to_signin', 'Back to sign in')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
