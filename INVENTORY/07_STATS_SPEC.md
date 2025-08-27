# Stats Page Specification

## Overview
The Stats page replaces the Library page at `/app/stats` and provides comprehensive training analytics with social sharing capabilities.

## Route
- **Path**: `/app/stats`
- **Component**: `StatsPage`
- **Navigation**: Bottom nav with BarChart3 icon, label "Stats"

## Data Sources
- **Primary**: `v_session_metrics` view (per-session + weekly aggregates)
- **Local**: Dexie mirrors (sessions, session_exercises, logged_sets)
- **Computed**: Streaks, top movements, weight progression trends

## Features

### Core Analytics
1. **Adherence & Streaks**
   - Current streak counter
   - Longest streak achieved
   - Calendar heatmap visualization

2. **Training Volume**
   - Training days per week (bar chart)
   - Volume & sets combo chart (bar + line)
   - Weekly minutes tracking (area chart)

3. **Intensity Metrics**
   - Average RPE per week (line chart)
   - Intensity distribution

4. **Movement Analysis**
   - Top movements (horizontal bars)
   - Weight progression per movement (line charts)
   - Movement frequency tracking

### Social Sharing
- **Stats Card Export**: 1080×1350 PNG generation
- **Privacy Controls**: Hide name, weights, highlights
- **Share Methods**: Native share API + fallback download
- **Offline Capable**: Works without internet connection

### Streak Badge System
- **Thresholds**: 3, 5, 7, 14, 21, 30, 50, 100 days
- **Local Persistence**: localStorage with `gymbud-streak-badges` key
- **Toast Notifications**: One-time awards only
- **Badge Names**: 
  - 3: "3-Day Streak"
  - 5: "5-Day Streak" 
  - 7: "Week Warrior"
  - 14: "Two Week Champion"
  - 21: "Three Week Hero"
  - 30: "Monthly Master"
  - 50: "Consistency King"
  - 100: "Century Legend"

## UI Components

### Chart Components
- `ChartCard`: Reusable glassmorphic container
- `TrainingDaysBar`: Weekly training frequency
- `VolumeSetsCombo`: Combined volume and sets visualization
- `WeightProgression`: Per-movement weight tracking

### Interactive Elements
- Movement selector for weight progression
- Refresh button for manual data sync
- Share button with privacy modal
- Highlights strip showing recent badges

### Visual Design
- **Background**: Teal gradient matching app theme
- **Cards**: Glass morphism with white/10 opacity
- **Charts**: Teal gradient fills, white tooltips
- **Typography**: White text with opacity variations

## Internationalization
- **Namespace**: `stats`
- **Badge Namespace**: `badges`
- **Languages**: English + Portuguese (Brazil)
- **Key Areas**: Chart titles, share options, badge names, empty states

## Technical Implementation

### Dependencies
- `recharts`: Chart library
- `dom-to-image-more`: PNG export functionality
- `sonner`: Toast notifications for badges

### Hooks
- `useStreakBadges`: Badge management and persistence
- Standard React hooks for state management

### Performance
- Lazy loading of chart data
- Memoized calculations for expensive operations
- Efficient re-renders with proper dependencies

## Empty State
- Displays when no workout data exists
- Call-to-action button to start first workout
- Friendly messaging encouraging engagement

## Accessibility
- Proper ARIA labels for charts
- Keyboard navigation support
- Screen reader friendly descriptions
- High contrast mode compatibility

## Future Enhancements
- Calendar heatmap view
- Detailed RPE analysis
- Movement comparison tools
- Export to CSV functionality
- Advanced filtering options
