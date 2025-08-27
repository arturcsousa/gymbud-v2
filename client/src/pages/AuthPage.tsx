// client/src/pages/AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check } from 'lucide-react';

export default function AuthPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [showValidation, setShowValidation] = useState(false);

  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handlePasswordInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'password' && target.name === 'password') {
      const password = target.value;
      setShowValidation(password.length > 0);
      validatePassword(password);
    }
  };

  // Add event listener for password input
  useEffect(() => {
    const form = document.querySelector('[data-supabase-auth-ui]');
    if (form) {
      form.addEventListener('input', handlePasswordInput);
      return () => form.removeEventListener('input', handlePasswordInput);
    }
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-teal-900 via-teal-950 to-black p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl p-6 shadow-xl ring-1 ring-white/10">
        <h1 className="text-2xl font-semibold text-white mb-2">{t('auth:welcome.title', 'Welcome to GymBud')}</h1>
        <p className="text-white/70 mb-6">{t('auth:welcome.subtitle', 'Create your account or sign in to continue.')}</p>
        
        <div className="bg-white rounded-xl p-4">
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  email_label: t('auth:fields.email', 'Email address'),
                  password_label: t('auth:fields.password', 'Create a Password'),
                  email_input_placeholder: t('auth:placeholders.email', 'Your email address'),
                  password_input_placeholder: t('auth:placeholders.password', 'Your password'),
                  button_label: t('auth:buttons.sign_up', 'Sign up'),
                  loading_button_label: t('auth:buttons.signing_up', 'Signing up...'),
                  link_text: t('auth:links.sign_in', 'Already have an account? Sign in'),
                  confirmation_text: t('auth:confirmation.check_email', 'Check your email for the confirmation link')
                },
                sign_in: {
                  email_label: t('auth:fields.email', 'Email address'),
                  password_label: t('auth:fields.password', 'Your Password'),
                  email_input_placeholder: t('auth:placeholders.email', 'Your email address'),
                  password_input_placeholder: t('auth:placeholders.password', 'Your password'),
                  button_label: t('auth:buttons.sign_in', 'Sign in'),
                  loading_button_label: t('auth:buttons.signing_in', 'Signing in...'),
                  link_text: t('auth:links.sign_up', "Don't have an account? Sign up"),
                }
              }
            }}
          />
        </div>

        {/* Password Validation Indicator */}
        {showValidation && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('auth:password_requirements.title', 'Password Requirements')}
            </h3>
            <div className="space-y-2 text-xs">
              <ValidationItem 
                isValid={passwordValidation.minLength}
                text={t('auth:password_requirements.min_length', 'At least 8 characters')}
              />
              <ValidationItem 
                isValid={passwordValidation.hasUppercase}
                text={t('auth:password_requirements.uppercase', 'One uppercase letter')}
              />
              <ValidationItem 
                isValid={passwordValidation.hasLowercase}
                text={t('auth:password_requirements.lowercase', 'One lowercase letter')}
              />
              <ValidationItem 
                isValid={passwordValidation.hasNumber}
                text={t('auth:password_requirements.number', 'One number')}
              />
              <ValidationItem 
                isValid={passwordValidation.hasSpecialChar}
                text={t('auth:password_requirements.special_char', 'One special character')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${isValid ? 'text-green-400' : 'text-white/60'}`}>
      <Check className={`w-3 h-3 ${isValid ? 'text-green-400' : 'text-white/30'}`} />
      <span>{text}</span>
    </div>
  );
}
