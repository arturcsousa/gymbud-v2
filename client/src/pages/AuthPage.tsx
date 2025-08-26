// client/src/pages/AuthPage.tsx
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-teal-900 via-teal-950 to-black p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl p-6 shadow-xl ring-1 ring-white/10">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome to GymBud</h1>
        <p className="text-white/70 mb-6">Create your account or sign in to continue.</p>
        <div className="bg-white rounded-xl p-4">
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
        </div>
      </div>
    </div>
  );
}
