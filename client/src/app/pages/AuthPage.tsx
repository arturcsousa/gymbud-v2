import { useEffect, useRef } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { finalizeOnboarding } from "@/onboarding/actions";

export function AuthPage() {
  const ranRef = useRef(false);

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
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

    return () => subscription.data.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-teal-900 via-teal-950 to-black p-6 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div 
        className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: '#FF9F1C' }}
      />
      <div 
        className="absolute bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: '#18C7B6' }}
      />
      
      <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
        {/* Centered Logo */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/images/gymbud-wh.png" 
            alt="GymBud" 
            className="w-32 h-32 mb-2"
          />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">Welcome to GymBud</h1>
        <p className="text-white/70 mb-8 text-center text-lg">Create your account or sign in to continue.</p>
        
        <div className="bg-white rounded-2xl p-6">
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }} 
            providers={[]}
            redirectTo={`${window.location.origin}/app/session/today`}
          />
        </div>
      </div>
    </div>
  );
}
