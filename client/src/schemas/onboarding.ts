import { z } from 'zod';

export const BioSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  height_cm: z.number().min(90).max(250),
  weight_kg: z.number().min(30).max(300),
  body_fat_pct: z.number().min(3).max(60).optional(),
  rhr_bpm: z.number().min(30).max(120).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const GoalsSchema = z.object({
  goal_primary: z.enum(['fat_loss','muscle_gain','performance','longevity','general_fitness']),
  days_per_week: z.enum(['2','3','4','5','6']).transform(n=>Number(n)),
  days_of_week: z.array(z.enum(['mon','tue','wed','thu','fri','sat','sun'])).min(2),
  session_windows: z.array(z.object({ dow:z.string(), start:z.string(), end:z.string() })).optional(),
  environment: z.enum(['commercial_gym','home_basic','home_rack','outdoors_mixed']),
  equipment: z.array(z.string()).optional(), // only when home_basic
});

export const ProfileSchema = z.object({
  experience_level: z.enum(['beginner','intermediate','advanced']),
  confidence: z.record(z.enum(['squat','hinge','lunge','push','pull','carry']), z.enum([1,2,3,4,5] as any)),
  constraints: z.array(z.object({
    area: z.enum(['shoulder','elbow','wrist','hip','knee','ankle','low_back','cardio_limits']),
    severity: z.enum(['mild','moderate','severe']),
    avoid_movements: z.array(z.string()).optional()
  })).optional(),
  warmup_style: z.enum(['none','quick','standard','therapeutic']),
  mobility_focus: z.array(z.enum(['tspine','hips','ankles','shoulders'])).optional(),
  rest_preference: z.enum(['shorter','as_prescribed','longer']),
  intensity_style: z.enum(['rpe','rir','fixed']),
  rpe_coaching_level: z.enum(['teach_me','standard','advanced'])
});

export type BioFormData = z.infer<typeof BioSchema>;
export type GoalsFormData = z.infer<typeof GoalsSchema>;
export type ProfileFormData = z.infer<typeof ProfileSchema>;
