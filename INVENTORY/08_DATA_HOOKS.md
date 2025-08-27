# GymBud v2 - Data Hooks Architecture

## Overview
Offline-first data hooks providing seamless integration between IndexedDB (Dexie) local storage and Supabase cloud database. All hooks implement graceful fallbacks and error handling for production reliability.

## Hook Architecture Pattern
```typescript
// Standard pattern for all data hooks
const { data, isLoading, error, isOffline } = useDataHook();

// Returns:
// - data: Online data preferred, offline fallback
// - isLoading: True only when no offline data available
// - error: Network/query errors (doesn't block offline data)
// - isOffline: True when showing cached/local data
```

## Session Analytics Hooks

### useSessionMetrics
**Purpose**: Comprehensive workout session analytics with real-time calculations
**Location**: `client/src/hooks/useSessionMetrics.ts`

#### Data Sources
- **Offline**: Dexie tables (`sessions`, `session_exercises`, `logged_sets`)
- **Online**: Supabase `v_session_metrics` view
- **Fallback**: Offline data when server unavailable

#### Calculated Metrics
```typescript
interface SessionMetrics {
  totalSessions: number;        // Count of completed sessions
  totalVolume: number;          // Sum of (weight × reps) across all sets
  avgRPE: number;              // Average RPE across all logged sets
  weeklyData: Array<{          // Last 7 days activity
    day: string;               // Day name (Mon, Tue, etc.)
    sessions: number;          // Sessions completed that day
    volume: number;            // Total volume for the day
    sets: number;              // Total sets logged that day
  }>;
  currentStreak: number;       // Consecutive days with completed sessions
}
```

#### Implementation Details
- **Query Strategy**: Immediate offline load → background server sync
- **Streak Calculation**: Backwards from today, breaks on first missing day
- **Volume Formula**: `Σ(weight × reps)` for all logged sets
- **Date Handling**: ISO date strings, timezone-aware calculations
- **Performance**: Memoized transformations, efficient database queries

### useStreakBadges
**Purpose**: Gamification system for workout consistency
**Location**: `client/src/hooks/useStreakBadges.ts`

#### Badge System
- **Thresholds**: 3, 5, 7, 14, 30, 50, 75, 100 days
- **Storage**: localStorage persistence for offline awards
- **Notifications**: Sonner toast notifications on new achievements
- **State**: Tracks awarded badges and next milestone

## Profile Data Hooks

### useProfileData
**Purpose**: User profile and weight progression tracking
**Location**: `client/src/hooks/useProfileData.ts`

#### Data Sources
- **Primary**: Supabase `profiles` table (`weight_kg`, `updated_at`)
- **Extended**: Optional `weight_logs` table for historical data
- **Fallback**: localStorage caching for offline access

#### Data Structure
```typescript
interface ProfileData {
  currentWeight: number;       // Latest weight from profiles.weight_kg
  weightHistory: Array<{       // Historical weight entries
    date: string;              // ISO date string
    weight: number;            // Weight in kg
  }>;
}
```

#### Fallback Strategy
1. Query `weight_logs` table for full history
2. If table doesn't exist (42P01 error), use current weight as single point
3. Cache successful queries to localStorage
4. Return cached data when offline

## Database Integration

### Dexie Schema Integration
```typescript
// Tables queried by hooks
sessions: 'id, user_id, status, completed_at'
session_exercises: 'id, session_id, exercise_name'
logged_sets: 'id, session_exercise_id, weight, reps, rpe'
```

### Supabase Views Expected
```sql
-- v_session_metrics view structure
CREATE VIEW v_session_metrics AS
SELECT 
  session_date,
  total_volume,
  total_sets,
  avg_rpe
FROM sessions s
JOIN session_exercises se ON s.id = se.session_id
JOIN logged_sets ls ON se.id = ls.session_exercise_id
WHERE s.status = 'completed';
```

## Error Handling & Resilience

### Network Resilience
- **Offline Detection**: Automatic fallback to cached data
- **Graceful Degradation**: Never blocks UI with loading states
- **Error Boundaries**: Comprehensive try-catch with logging

### Data Validation
- **Type Safety**: Full TypeScript interfaces for all data structures
- **Null Handling**: Safe defaults for missing or invalid data
- **Date Validation**: Robust date parsing and timezone handling

## Performance Optimizations

### React Query Configuration
```typescript
{
  staleTime: 1000 * 60 * 5,    // 5 minutes for session metrics
  staleTime: 1000 * 60 * 10,   // 10 minutes for profile data
  retry: 1,                     // Single retry to avoid long delays
  refetchOnWindowFocus: false   // Prevent unnecessary refetches
}
```

### Memoization Strategy
- **useMemo**: Data transformations and calculations
- **useCallback**: Event handlers and functions
- **Dependency Arrays**: Minimal dependencies to prevent unnecessary rerenders

## Usage Examples

### StatsPage Integration
```typescript
function StatsPage() {
  const { metrics, isLoading, isOffline } = useSessionMetrics();
  const { profileData } = useProfileData();
  const { currentStreak, checkAndAwardBadges } = useStreakBadges();

  // Immediate data availability with loading states
  if (isLoading) return <LoadingSpinner />;
  
  // Offline indicator when showing cached data
  if (isOffline) return <OfflineBanner />;
  
  // Real data rendering
  return <Charts data={metrics} profile={profileData} />;
}
```

## Future Extensions

### Planned Hooks
- **useExerciseMetrics**: Individual exercise progression tracking
- **useWorkoutPlans**: Plan generation and modification
- **useCoachingData**: AI coach interaction history
- **useNotificationSettings**: Push notification preferences

### Database Views to Implement
- **v_exercise_progression**: Exercise-specific weight/rep progression
- **v_weekly_summaries**: Pre-calculated weekly aggregations
- **v_user_achievements**: Badge and milestone tracking
