# End-to-End Engine & Swap Testing Script

## Prerequisites
- Local development environment running (`pnpm dev`)
- Supabase local instance or staging environment
- Test user account with valid authentication
- Edge Functions deployed (`supabase functions deploy`)

## Test Flow Overview
This script tests the complete workflow: Generate → Rest → Adapt → Swap → Log → Stats

---

## Step 1: User Setup & Onboarding

### 1.1 Create Test User
- [ ] Navigate to `/app/auth/signup`
- [ ] Create new test account: `test-engine-swap-{timestamp}@example.com`
- [ ] Complete email verification if required
- [ ] Record user ID for later verification

### 1.2 Complete Onboarding
- [ ] Navigate through 12-step onboarding wizard
- [ ] Fill out profile data (height, weight, experience level)
- [ ] Select training goals and available equipment
- [ ] Complete assessment exercises if required
- [ ] Verify ACTIVE plan is created in database

**Expected Result:** User has completed onboarding with an active plan

---

## Step 2: Engine Session Generation

### 2.1 First Session Call
- [ ] Open browser dev tools → Network tab
- [ ] Navigate to `/app/home`
- [ ] Click "Start Today's Workout" or equivalent
- [ ] Verify API call to `engine-session-get-or-create`
- [ ] Record the session ID from response
- [ ] Verify `baseline: true` for first session

**Expected Result:** New session created with exercises and baseline flag

### 2.2 Determinism Test
- [ ] Refresh the page or navigate away and back
- [ ] Click "Start Today's Workout" again
- [ ] Verify API call returns same session ID
- [ ] Verify exercise list is identical
- [ ] Verify no duplicate sessions in database

**Expected Result:** Same session returned, no duplicates created

---

## Step 3: Session Execution & Logging

### 3.1 Log Multiple Sets
For the first 2+ exercises:
- [ ] Log 3 sets with varying performance:
  - Set 1: Hit target reps (e.g., 10/10 reps)
  - Set 2: Hit target reps (e.g., 10/10 reps) 
  - Set 3: Miss target slightly (e.g., 8/10 reps)
- [ ] Use rest timer between sets
- [ ] Record weight and RPE values
- [ ] Verify sets appear in logged_sets table

**Expected Result:** Sets logged with proper session_exercise_id linkage

### 3.2 Exercise Navigation
- [ ] Use "Next Exercise" button to advance
- [ ] Use "Previous Exercise" to go back
- [ ] Verify exercise counter updates correctly
- [ ] Verify rest timer resets between exercises

**Expected Result:** Smooth navigation between exercises

---

## Step 4: Exercise Swap Testing

### 4.1 Open Swap Interface
- [ ] On any exercise card, click the overflow menu (⋮)
- [ ] Select "Replace" option
- [ ] Verify ReplaceExerciseSheet opens
- [ ] Verify loading state appears

**Expected Result:** Swap modal opens with loading indicator

### 4.2 Compatible Exercise List
- [ ] Wait for compatible exercises to load
- [ ] Verify list shows 6 or fewer exercises
- [ ] Verify all exercises are from same category
- [ ] Verify exercises are sorted deterministically
- [ ] Test search functionality with exercise names

**Expected Result:** Deterministic list of compatible exercises

### 4.3 Perform Swap
- [ ] Select a compatible exercise from the list
- [ ] Verify success toast appears
- [ ] Verify exercise name updates in session UI
- [ ] Verify rest timer reflects new exercise
- [ ] Check database: session_exercises table updated
- [ ] Check database: coach_audit entry created

**Expected Result:** Exercise swapped successfully with audit trail

### 4.4 Swap Persistence
- [ ] Refresh the page
- [ ] Verify swapped exercise persists
- [ ] Continue logging sets for swapped exercise
- [ ] Verify sets link to correct session_exercise_id

**Expected Result:** Swap persists across page reload

---

## Step 5: Progressive Overload Verification

### 5.1 Complete First Session
- [ ] Log sets for all exercises
- [ ] Click "Finish Workout"
- [ ] Verify session status changes to 'completed'
- [ ] Navigate to `/app/stats` to verify data

**Expected Result:** Session completed successfully

### 5.2 Generate Second Session
- [ ] Wait or change system date to next day
- [ ] Navigate to `/app/home`
- [ ] Click "Start Today's Workout"
- [ ] Verify new session created (different ID)
- [ ] Verify `baseline: false` for subsequent sessions

**Expected Result:** New session with progression applied

### 5.3 Check Progression Logic
For exercises where targets were hit:
- [ ] Verify prescribed weight increased by progression step
- [ ] Verify reps/sets remain consistent with plan
- [ ] Verify RPE targets adjusted if applicable

For exercises where targets were missed:
- [ ] Verify prescribed weight stays same or decreases
- [ ] Verify opportunity for redemption

**Expected Result:** Intelligent progression based on previous performance

---

## Step 6: Stats Parity Verification

### 6.1 Client Stats Check
- [ ] Navigate to `/app/stats`
- [ ] Record displayed metrics:
  - Total Sessions
  - Total Sets  
  - Total Volume
  - Average RPE
- [ ] Verify charts render correctly

**Expected Result:** Stats display properly in UI

### 6.2 Dev Parity Banner (Dev Mode Only)
- [ ] Ensure running in development mode
- [ ] Check for orange parity mismatch banner
- [ ] If banner appears, click "Report Issue"
- [ ] Verify telemetry event logged in console

**Expected Result:** No parity banner in normal operation

### 6.3 Manual Parity Check
- [ ] Run QA script: `node qa/stats_parity.ts <user_id>`
- [ ] Verify all metrics pass parity check
- [ ] If failures occur, investigate discrepancies

**Expected Result:** All stats match between client and server

---

## Step 7: Offline Behavior

### 7.1 Offline Swap Test
- [ ] Disconnect network (dev tools → Network → Offline)
- [ ] Perform exercise swap
- [ ] Verify swap works locally
- [ ] Reconnect network
- [ ] Verify swap syncs to server

**Expected Result:** Offline swaps sync when reconnected

### 7.2 Offline Logging
- [ ] Disconnect network again
- [ ] Log several sets
- [ ] Verify sets stored locally
- [ ] Reconnect network
- [ ] Verify sets sync to server

**Expected Result:** Offline logging syncs properly

---

## Step 8: Deload Cycle Testing (Optional)

### 8.1 Simulate Long-term Usage
- [ ] Complete 12+ sessions for same plan (or adjust deload_every)
- [ ] Verify deload session triggers
- [ ] Verify reduced intensity prescriptions
- [ ] Verify deload noted in session metadata

**Expected Result:** Deload cycles work as designed

---

## Verification Checklist

### Database Integrity
- [ ] No duplicate sessions for same user/date
- [ ] All logged_sets have valid session_exercise_id
- [ ] Coach audit entries exist for all swaps
- [ ] Session status transitions are valid

### Performance
- [ ] Engine session generation < 3 seconds
- [ ] Exercise swap < 2 seconds
- [ ] Stats loading < 2 seconds
- [ ] No memory leaks during extended use

### User Experience
- [ ] All UI transitions are smooth
- [ ] Loading states are appropriate
- [ ] Error states are handled gracefully
- [ ] Accessibility features work (keyboard nav, screen reader)

### Data Consistency
- [ ] Client and server metrics match
- [ ] Offline changes sync correctly
- [ ] No data loss during network interruptions
- [ ] Deterministic behavior is maintained

---

## Cleanup

### Post-Test Cleanup
- [ ] Delete test user account
- [ ] Clean up test data from database
- [ ] Reset any modified system settings
- [ ] Document any issues found

---

## Issue Reporting Template

If issues are found, report with:

```
**Issue:** Brief description
**Steps to Reproduce:** 1. 2. 3.
**Expected:** What should happen
**Actual:** What actually happened
**Environment:** Dev/Staging/Prod
**User ID:** [if relevant]
**Session ID:** [if relevant]
**Browser:** Chrome/Firefox/Safari
**Console Errors:** [if any]
```
