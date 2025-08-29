# GymBud v2 - i18n Structure

## Overview
Complete internationalization system supporting English (EN) and Portuguese Brazil (PT-BR) with namespace-based organization.

## Languages
- **English (en)**: Default language, fallback for missing keys
- **Portuguese Brazil (pt-BR)**: Full localization with Brazilian conventions

## Namespaces

### settings
Settings page and configuration UI
- **Basic Settings**: language, units, notifications toggle
- **Utilities Section**: 
  - `utilities.regenerate.*`: Plan regeneration with confirmation dialogs
  - `utilities.export.*`: Data export with format selection (JSON/CSV) and voided sets option
  - `utilities.delete.*`: Account deletion with two-step confirmation and typed verification
  - `utilities.about.*`: Version info, build details, PWA install prompts, privacy/terms links
- **Enhanced Notifications**:
  - `notifications.title/desc/enable`: Main notification settings
  - `notifications.daily.*`: Daily reminder time configuration
  - `notifications.weekly.*`: Weekly summary day/time selection with weekday names (0-6)
  - `notifications.quietHours.*`: Quiet hours configuration with start/end times
  - `notifications.permission.*`: Permission handling and browser compatibility messages
  - `notifications.save`: Save preferences action
- **Sync Management**: sync status, events log, dead-letter queue, conflicts resolution
- **Developer Tools**: sync events, failed mutations, conflict resolution UI

### app
Core application UI and navigation
- **Navigation**: Bottom nav labels, page titles, common actions
- **Sync Status**: Real-time sync indicators, pending counts, last sync timestamps
- **Settings Integration**: Account info, sign out, sync controls
- **Auth Flow**: Sign in/out labels, authentication states

### common
Shared UI elements and universal actions
- **Navigation**: Back, next, save, cancel, close buttons
- **Language Switching**: Language labels and selection
- **CTA Buttons**: Primary action buttons across the app
- **Universal Labels**: Common form labels and validation messages

### landing
Marketing website content (gymbud.ai)
- **Hero Section**: Main value proposition, headlines, subheadings
- **Features**: How it works, differentiators, program descriptions
- **Social Proof**: Progress tracking, user benefits
- **Pricing**: Plan tiers, feature comparisons
- **Final CTA**: Sign up prompts and conversion elements

### faq
Frequently asked questions
- **Common Questions**: 6 core FAQ items with answers
- **Support Topics**: Technical questions, billing, account management
- **Product Information**: Feature explanations, compatibility

### auth
Authentication flows and user management
- **Sign In/Up**: Form labels, validation, mode switching
- **Email Verification**: OTP input, resend logic, confirmation flow
- **Password Reset**: Request/update flows, token handling, success states
- **Error Handling**: Auth-specific error messages and recovery

### onboarding
12-step onboarding wizard for new users
- **Profile Setup**: Personal information, biometrics, experience levels
- **Goal Setting**: Training objectives, schedule preferences
- **Equipment**: Available equipment selection and explanations
- **Preferences**: Workout style, warm-up preferences
- **Progress Tracking**: Measurement preferences, motivation factors
- **Navigation**: Step progression, completion flow

### assessment
Initial fitness assessment and baseline capture
- **Instructions**: Assessment guidance and expectations
- **Exercise Descriptions**: Movement explanations and form cues
- **Progress Tracking**: Assessment completion and results
- **Baseline Integration**: Connection to training plan generation

### plan
Training plan management and overview
- **Plan Details**: Program information, schedule, progression
- **Plan Actions**: Regeneration, modifications, plan switching
- **Integration**: Connection to daily sessions and progress tracking

### session
Active workout session interface
- **Exercise Display**: Exercise names, instructions, form cues
- **Set Logging**: Weight, reps, completion tracking
- **Session Controls**: Start, pause, complete, navigation
- **Exercise Swaps**: Substitution interface with compatibility matching
- **Progress Indicators**: Session completion, rest timers

### coach
AI coaching interface and interactions
- **Coaching Prompts**: AI-generated guidance and suggestions
- **Form Feedback**: Exercise technique recommendations
- **Substitutions**: Exercise replacement suggestions and reasoning
- **Progress Analysis**: AI-driven insights and adjustments

### progress
Progress tracking and analytics
- **Metrics Display**: Volume, strength, consistency tracking
- **Charts**: Progress visualization and trend analysis
- **Achievements**: Milestone tracking and celebration
- **Export**: Progress data sharing and export options

### pricing
Subscription and billing management
- **Plan Tiers**: Feature comparisons and pricing
- **Billing**: Payment processing, subscription management
- **Upgrades**: Plan changes and feature unlocks

### errors
Error handling and user feedback
- **Validation Errors**: Form validation messages
- **Network Errors**: Connectivity and sync error messages
- **Auth Errors**: Authentication failure messages
- **General Errors**: Fallback error messages and recovery guidance

### validation
Form validation messages
- **Field Validation**: Required fields, format validation
- **Business Rules**: Application-specific validation
- **User Guidance**: Helpful validation messaging

## Key Features

### Namespace Loading
- Dynamic namespace loading with `useTranslation(['namespace1', 'namespace2'])`
- Automatic fallback to English for missing translations
- Lazy loading support for performance optimization

### Interpolation Support
- Variable interpolation: `{{count}}`, `{{name}}`, `{{value}}`
- Pluralization: `_one`, `_other` suffixes for count-based messages
- Date/time formatting with locale-aware display

### Settings Integration
- Language switching persists to localStorage and user metadata
- Real-time language updates across all components
- Sync with user preferences and cloud backup

### Utilities & Notifications
- Complete localization for self-service utilities (regenerate, export, delete, about)
- Enhanced notification preferences with time/weekday selection
- Quiet hours configuration with proper time formatting
- Permission handling messages for Web Notifications API
- Weekday names with proper cultural conventions (Sunday=0 vs Monday=1)

## Technical Implementation
- **Library**: react-i18next with i18next-browser-languagedetector
- **Detection**: localStorage → navigator → htmlTag fallback chain
- **Configuration**: keySeparator: false, returnNull: false, escapeValue: false
- **File Structure**: `/client/src/i18n/locales/{lang}/{namespace}.json`
- **Bootstrap**: `/client/src/i18n/index.ts` with language detection and namespace registration
