import { db } from './gymbud-db';

export type OnboardingState = {
  user_id: string;
  // Step 1
  first_name?: string;
  last_name?: string;
  height_cm?: number;
  weight_kg?: number;
  body_fat_pct?: number;
  rhr_bpm?: number;
  birthdate?: string; // ISO 'YYYY-MM-DD'
  // Step 2
  goal_primary?: 'fat_loss'|'muscle_gain'|'performance'|'longevity'|'general_fitness';
  days_per_week?: 2|3|4|5|6;
  days_of_week?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>;
  session_windows?: Array<{ dow: string; start: string; end: string }>;
  environment?: 'commercial_gym'|'home_basic'|'home_rack'|'outdoors_mixed';
  equipment?: string[]; // only for home_basic
  ai_tone?: 'supportive'|'kind'|'focused'|'direct'|'reassuring'; // auto from goal
  units?: 'metric'|'imperial'; // from locale
  date_format?: 'mdy'|'dmy';   // from locale
  // Step 3
  experience_level?: 'beginner'|'intermediate'|'advanced';
  confidence?: Record<'squat'|'hinge'|'lunge'|'push'|'pull'|'carry', 1|2|3|4|5>;
  constraints?: Array<{
    area: 'shoulder'|'elbow'|'wrist'|'hip'|'knee'|'ankle'|'low_back'|'cardio_limits';
    severity: 'mild'|'moderate'|'severe';
    avoid_movements?: string[];
  }>;
  warmup_style?: 'none'|'quick'|'standard'|'therapeutic';
  mobility_focus?: ('tspine'|'hips'|'ankles'|'shoulders')[];
  rest_preference?: 'shorter'|'as_prescribed'|'longer';
  intensity_style?: 'rpe'|'rir'|'fixed';
  rpe_coaching_level?: 'teach_me'|'standard'|'advanced';
  // meta
  updated_at: number; // Date.now()
};

export const ONB_STORE = 'onboarding_state';

export class OnboardingStore {
  static async getState(userId: string): Promise<OnboardingState | null> {
    try {
      const result = await db.onboarding_state.get(userId);
      return result || null;
    } catch (error) {
      console.error('Failed to get onboarding state:', error);
      return null;
    }
  }

  static async saveState(state: Partial<OnboardingState> & { user_id: string }): Promise<void> {
    try {
      const existing = await db.onboarding_state.get(state.user_id);
      const updated = {
        ...existing,
        ...state,
        updated_at: Date.now()
      };
      await db.onboarding_state.put(updated);
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      throw error;
    }
  }

  static async clearState(userId: string): Promise<void> {
    try {
      await db.onboarding_state.delete(userId);
    } catch (error) {
      console.error('Failed to clear onboarding state:', error);
      throw error;
    }
  }
}
