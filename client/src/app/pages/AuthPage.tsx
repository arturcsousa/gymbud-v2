import { useEffect, useRef } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { finalizeOnboarding } from "@/onboarding/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AuthPage() {
  const ranRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !ranRef.current) {
        ranRef.current = true;
        try {
          // Create a default plan seed
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
          // Could show error toast here
        }
      }
    });

    // Also check for existing session (e.g., magic link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !ranRef.current) {
        ranRef.current = true;
        try {
          // Create a default plan seed
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-950 to-black relative overflow-hidden">
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
      <div className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
          {/* Centered Logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/images/gymbud-wh.png" 
              alt="GymBud" 
              className="w-32 h-32 mb-2"
            />
          </div>
          
          <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-tight">Join GymBud</h1>
          <p className="text-white/70 mb-8 text-center text-lg">Create your account or sign in to continue.</p>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Auth 
              supabaseClient={supabase} 
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    background: '#18C7B6',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '16px',
                    padding: '12px 24px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  },
                  input: {
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '12px 16px',
                    fontSize: '16px',
                    backgroundColor: '#f8fafc'
                  },
                  label: {
                    color: '#374151',
                    fontWeight: '500',
                    fontSize: '14px'
                  },
                  anchor: {
                    color: '#18C7B6',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }
                }
              }} 
              providers={[]}
              redirectTo={`${window.location.origin}/app/session/today`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
