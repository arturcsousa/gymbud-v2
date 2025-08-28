// Basic telemetry system for GymBud
// This can be extended with PostHog, Sentry, or other analytics services
import { db } from '@/db';

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

// New typed events for better type safety
export type TelemetryEventType =
  | { type: 'onb_step_viewed'; step_id: string }
  | { type: 'onb_saved'; step_id: string }
  | { type: 'onb_completed' }
  | { type: 'plan_created'; plan_id: string }
  | { type: 'baseline_session_seen'; session_id: string }
  | { type: 'sync_success'; items: number }
  | { type: 'sync_failure'; code: string }
  | { type: 'set_void_started'; set_id: string }
  | { type: 'set_void_confirmed'; set_id: string };

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private isEnabled = true;

  constructor() {
    // In development, log events to console
    if (import.meta.env.DEV) {
      this.isEnabled = true;
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      timestamp: new Date(),
    };

    this.events.push(telemetryEvent);

    // In development, log to console
    if (import.meta.env.DEV) {
      console.log('📊 Telemetry:', telemetryEvent);
    }

    // TODO: Send to analytics service (PostHog, Sentry, etc.)
    // this.sendToAnalytics(telemetryEvent);
  }

  // Auth-specific tracking methods
  trackAuthSignUpStarted(email: string) {
    this.track('auth_sign_up_started', { email_domain: this.getEmailDomain(email) });
  }

  trackAuthSignUpSucceeded(email: string) {
    this.track('auth_sign_up_succeeded', { email_domain: this.getEmailDomain(email) });
  }

  trackAuthSignUpFailed(email: string, error: string) {
    this.track('auth_sign_up_failed', { 
      email_domain: this.getEmailDomain(email),
      error_type: this.categorizeError(error)
    });
  }

  trackAuthOtpSent(email: string, isAutoResend: boolean) {
    this.track('auth_otp_sent', { 
      email_domain: this.getEmailDomain(email),
      is_auto_resend: isAutoResend
    });
  }

  trackAuthOtpVerifyAttempted(email: string) {
    this.track('auth_otp_verify_attempted', { email_domain: this.getEmailDomain(email) });
  }

  trackAuthOtpVerifySucceeded(email: string) {
    this.track('auth_otp_verify_succeeded', { email_domain: this.getEmailDomain(email) });
  }

  trackAuthOtpVerifyFailed(email: string, error: string) {
    this.track('auth_otp_verify_failed', { 
      email_domain: this.getEmailDomain(email),
      error_type: this.categorizeError(error)
    });
  }

  trackAuthUnconfirmedRedirectedToVerify(email: string) {
    this.track('auth_unconfirmed_redirected_to_verify', { 
      email_domain: this.getEmailDomain(email)
    });
  }

  trackOnboardingRedirected(destination: string, hasActivePlan: boolean) {
    this.track('onboarding_redirected', { 
      destination,
      has_active_plan: hasActivePlan
    });
  }

  // Password reset tracking methods
  trackAuthPasswordResetRequested() {
    this.track('auth_password_reset_requested');
  }

  trackAuthPasswordResetEmailSent() {
    this.track('auth_password_reset_email_sent');
  }

  trackAuthPasswordResetResendThrottled() {
    this.track('auth_password_reset_resend_throttled');
  }

  trackAuthPasswordResetLinkOpened() {
    this.track('auth_password_reset_link_opened');
  }

  trackAuthPasswordResetUpdateAttempted() {
    this.track('auth_password_reset_update_attempted');
  }

  trackAuthPasswordResetUpdateSucceeded() {
    this.track('auth_password_reset_update_succeeded');
  }

  trackAuthPasswordResetUpdateFailed() {
    this.track('auth_password_reset_update_failed');
  }

  trackAuthPasswordResetInvalidToken() {
    this.track('auth_password_reset_invalid_token');
  }

  // Utility methods
  private getEmailDomain(email: string): string {
    try {
      return email.split('@')[1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('email') && errorLower.includes('confirm')) {
      return 'email_not_confirmed';
    }
    if (errorLower.includes('invalid') && errorLower.includes('password')) {
      return 'invalid_password';
    }
    if (errorLower.includes('user') && errorLower.includes('not found')) {
      return 'user_not_found';
    }
    if (errorLower.includes('invalid') && errorLower.includes('token')) {
      return 'invalid_token';
    }
    if (errorLower.includes('expired')) {
      return 'expired_token';
    }
    if (errorLower.includes('rate limit')) {
      return 'rate_limited';
    }
    
    return 'unknown';
  }

  // Get events for debugging
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  // Clear events (useful for testing)
  clearEvents() {
    this.events = [];
  }
}

// New typed track function for better DX
export function track(event: TelemetryEventType) {
  telemetry.track(event.type, event);
  
  // Also store in IndexedDB for sync events log
  if (event.type.startsWith('sync_') || event.type.includes('void')) {
    try {
      db.sync_events.add({
        type: event.type,
        data: event,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to store sync event:', error);
    }
  }
}

export const telemetry = new TelemetryService();
export type { TelemetryEvent };
