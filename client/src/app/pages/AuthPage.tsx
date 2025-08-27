import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { finalizeOnboarding } from "@/onboarding/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function AuthPage() {
  const ranRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !ranRef.current) {
        ranRef.current = true;
        try {
          const defaultSeed = {
            goals: ["general_fitness"],
            experience_level: "new",
            frequency_days_per_week: 3,
            schedule_days: ["monday", "wednesday", "friday"],
            session_duration_min: 45,
            environment: "professional_gym",
            coaching_tone: "supportive"
          };
          
          await finalizeOnboarding(defaultSeed);
        } catch (error) {
          console.error('Onboarding failed:', error);
        }
      }
    });

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !ranRef.current) {
        ranRef.current = true;
        try {
          const defaultSeed = {
            goals: ["general_fitness"],
            experience_level: "new",
            frequency_days_per_week: 3,
            schedule_days: ["monday", "wednesday", "friday"],
            session_duration_min: 45,
            environment: "professional_gym",
            coaching_tone: "supportive"
          };
          
          await finalizeOnboarding(defaultSeed);
        } catch (error) {
          console.error('Onboarding failed:', error);
        }
      }
    };

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 relative overflow-hidden">
      {/* Header with Language Switcher */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pt-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Decorative gradient blobs */}
      <div 
        className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: '#FF9F1C' }}
      />
      <div 
        className="absolute bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: '#18C7B6' }}
      />
      
      {/* Main content */}
      <div className="min-h-screen grid place-items-center py-4">
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
            {t('auth.title', 'Join GymBud')}
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
            
            {error && (
              <div className="text-red-300 text-sm text-center">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-50 mt-6"
            >
              {loading 
                ? t('auth.loading', 'Loading...') 
                : isSignUp 
                  ? t('auth.createAccount', 'Create Account')
                  : t('auth.signIn', 'Sign In')
              }
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white/80 hover:text-white transition-colors duration-200 text-base"
            >
              {isSignUp 
                ? t('auth.haveAccount', 'Already have an account? Sign in')
                : t('auth.needAccount', "Don't have an account? Sign up")
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
