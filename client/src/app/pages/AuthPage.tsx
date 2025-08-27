import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { telemetry } from "@/lib/telemetry";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function AuthPage() {
  const ranRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation(['auth', 'common']);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !ranRef.current) {
        ranRef.current = true;
        
        // Check if user has an active plan to determine routing
        try {
          const { data: activePlan } = await supabase
            .from("app2_plans")
            .select("id, status")
            .eq("status", "active")
            .maybeSingle();
          
          if (activePlan) {
            // Returning user with active plan - go to app
            setLocation("/");
          } else {
            // New user without plan - start onboarding
            setLocation("/app/onboarding/biometrics");
          }
        } catch (error) {
          console.error('Failed to check plan status:', error);
          // On error, default to onboarding (safer for new users)
          setLocation("/app/onboarding/biometrics");
        }
      }
    });

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !ranRef.current) {
        ranRef.current = true;
        
        // Check if user has an active plan to determine routing
        try {
          const { data: activePlan } = await supabase
            .from("app2_plans")
            .select("id, status")
            .eq("status", "active")
            .maybeSingle();
          
          if (activePlan) {
            // Returning user with active plan - go to app
            setLocation("/");
          } else {
            // New user without plan - start onboarding
            setLocation("/app/onboarding/biometrics");
          }
        } catch (error) {
          console.error('Failed to check plan status:', error);
          // On error, default to onboarding (safer for new users)
          setLocation("/app/onboarding/biometrics");
        }
      }
    };

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const validatePasswords = () => {
    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Passwords do not match'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validatePasswords()) {
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Track signup attempt
        telemetry.trackAuthSignUpStarted(email);
        
        // Sign up flow - redirect to verify page
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          telemetry.trackAuthSignUpFailed(email, error.message);
          throw error;
        }
        
        telemetry.trackAuthSignUpSucceeded(email);
        
        // Redirect to verify page with email
        setLocation(`/app/auth/verify?email=${encodeURIComponent(email)}`);
        
      } else {
        // Sign in flow - handle unconfirmed users
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Check if it's an unconfirmed email error
          if (error.message.toLowerCase().includes('email not confirmed') || 
              error.message.toLowerCase().includes('confirm your email')) {
            // Track unconfirmed user redirect
            telemetry.trackAuthUnconfirmedRedirectedToVerify(email);
            // Redirect to verify page for unconfirmed users
            setLocation(`/app/auth/verify?email=${encodeURIComponent(email)}`);
            return;
          }
          throw error;
        }
        
        // Check if user exists but email is not confirmed
        if (data.user && !data.user.email_confirmed_at) {
          telemetry.trackAuthUnconfirmedRedirectedToVerify(email);
          setLocation(`/app/auth/verify?email=${encodeURIComponent(email)}`);
          return;
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setConfirmPassword("");
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
            {isSignUp 
              ? t('auth.createAccountTitle', 'Create your GymBud account')
              : t('auth.signInTitle', 'Sign in to GymBud')
            }
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={t('auth.email', 'Email address')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
              required
            />
            
            <input
              type="password"
              placeholder={t('auth.password', 'Password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
              required
            />
            
            {isSignUp && (
              <input
                type="password"
                placeholder={t('auth.confirmPassword', 'Confirm password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border-0 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                required
              />
            )}
            
            {error && (
              <div className="text-red-300 text-sm text-center">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading || (isSignUp && password !== confirmPassword)}
              className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-50 mt-6"
            >
              {loading 
                ? t('common.loading', 'Loading...') 
                : isSignUp 
                  ? t('auth.createAccount', 'Create Account')
                  : t('auth.signIn', 'Sign In')
              }
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleModeSwitch}
              className="text-white/80 hover:text-white transition-colors duration-200 text-base block w-full"
            >
              {isSignUp 
                ? t('auth.haveAccount', 'Already have an account? Sign in')
                : t('auth.needAccount', "Don't have an account? Sign up")
              }
            </button>
            
            {!isSignUp && (
              <button
                onClick={() => setLocation('/app/auth/reset')}
                className="text-white/70 hover:text-white/90 transition-colors duration-200 text-sm"
              >
                {t('auth.forgotPassword', 'Forgot password?')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
