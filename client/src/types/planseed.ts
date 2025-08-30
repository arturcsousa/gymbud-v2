export type PlanSeed = {
  first_name: string;
  last_name: string;
  biometrics: { 
    height_cm: number; 
    weight_kg: number; 
    body_fat_pct?: number; 
    rhr_bpm?: number; 
    birthdate?: string 
  };
  goal_primary: 'fat_loss'|'muscle_gain'|'performance'|'longevity'|'general_fitness';
  days_per_week: 2|3|4|5|6;
  days_of_week: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>;
  session_windows?: Array<{ dow: string; start: string; end: string }>;
  environment: 'commercial_gym'|'home_basic'|'home_rack'|'outdoors_mixed';
  equipment?: string[];
  ai_tone: 'supportive'|'kind'|'focused'|'direct'|'reassuring';
  units: 'metric'|'imperial';
  date_format: 'mdy'|'dmy';
  experience_level: 'beginner'|'intermediate'|'advanced';
  confidence: Record<'squat'|'hinge'|'lunge'|'push'|'pull'|'carry', 1|2|3|4|5>;
  constraints?: Array<{ area:string; severity:string; avoid_movements?:string[] }>;
  warmup_style: 'none'|'quick'|'standard'|'therapeutic';
  mobility_focus?: Array<'tspine'|'hips'|'ankles'|'shoulders'>;
  rest_preference: 'shorter'|'as_prescribed'|'longer';
  intensity_style: 'rpe'|'rir'|'fixed';
  rpe_coaching_level: 'teach_me'|'standard'|'advanced';
};

export type PlanCreateRequest = {
  seed: PlanSeed;
};

export type PlanCreateResponse = {
  ok: true;
  data: {
    plan_id: string;
    status: string;
  };
} | {
  ok: false;
  error: {
    code: string;
    message: string;
  };
} | {
  error: string;
  detail?: string;
};

export type ProfileUpdateRequest = {
  units?: 'metric'|'imperial';
  date_format?: 'mdy'|'dmy';
  ai_tone?: 'supportive'|'kind'|'focused'|'direct'|'reassuring';
};
