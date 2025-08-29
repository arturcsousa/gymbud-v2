import { db } from '@/db/gymbud-db'
import { telemetry } from '@/lib/telemetry'

export interface NotificationPreferences {
  enabled: boolean
  dailyTime: string // HH:MM format
  weeklyDay: number // 0-6, Sunday = 0
  weeklyTime: string // HH:MM format
  quietHoursStart?: string // HH:MM format
  quietHoursEnd?: string // HH:MM format
}

export interface NotificationPermissionResult {
  granted: boolean
  error?: string
}

export interface ScheduledNotification {
  id: string
  type: 'daily' | 'weekly'
  scheduledFor: Date
  title: string
  body: string
}

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  try {
    telemetry.track('notifications.permission.requested')

    if (!('Notification' in window)) {
      const error = 'Notifications not supported in this browser'
      telemetry.track('notifications.permission.denied', { reason: 'not_supported' })
      return { granted: false, error }
    }

    if (Notification.permission === 'granted') {
      telemetry.track('notifications.permission.granted', { source: 'already_granted' })
      return { granted: true }
    }

    if (Notification.permission === 'denied') {
      const error = 'Notifications are blocked. Please enable them in browser settings.'
      telemetry.track('notifications.permission.denied', { reason: 'blocked' })
      return { granted: false, error }
    }

    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      telemetry.track('notifications.permission.granted', { source: 'user_granted' })
      return { granted: true }
    } else {
      telemetry.track('notifications.permission.denied', { reason: 'user_denied' })
      return { granted: false, error: 'Permission denied by user' }
    }

  } catch (error: unknown) {
    console.error('Notification permission error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    telemetry.track('notifications.permission.denied', { reason: 'error', error: errorMessage })
    return { granted: false, error: errorMessage }
  }
}

/**
 * Schedule local notifications based on preferences
 */
export async function scheduleNotifications(preferences: NotificationPreferences): Promise<void> {
  try {
    if (!preferences.enabled) {
      await clearScheduledNotifications()
      return
    }

    // Clear existing notifications first
    await clearScheduledNotifications()

    const now = new Date()
    const notifications: ScheduledNotification[] = []

    // Schedule daily notifications for next 7 days
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      
      const [hours, minutes] = preferences.dailyTime.split(':').map(Number)
      targetDate.setHours(hours, minutes, 0, 0)

      // Skip if time has already passed today
      if (i === 0 && targetDate <= now) {
        continue
      }

      // Check quiet hours
      if (!isInQuietHours(targetDate, preferences)) {
        notifications.push({
          id: `daily-${targetDate.toISOString()}`,
          type: 'daily',
          scheduledFor: targetDate,
          title: 'Time to train? 💪',
          body: 'Your next session is ready.'
        })
      }
    }

    // Schedule weekly notifications for next 4 weeks
    for (let i = 0; i < 4; i++) {
      const targetDate = getNextWeeklyDate(now, preferences.weeklyDay, i)
      const [hours, minutes] = preferences.weeklyTime.split(':').map(Number)
      targetDate.setHours(hours, minutes, 0, 0)

      if (!isInQuietHours(targetDate, preferences)) {
        const weeklyBody = await generateWeeklySummary()
        notifications.push({
          id: `weekly-${targetDate.toISOString()}`,
          type: 'weekly',
          scheduledFor: targetDate,
          title: 'Weekly Training Summary 📊',
          body: weeklyBody
        })
      }
    }

    // Store notifications in IndexedDB for persistence
    await storeScheduledNotifications(notifications)

    // Set up timers for notifications within next 24 hours
    const upcomingNotifications = notifications.filter(n => 
      n.scheduledFor.getTime() - now.getTime() < 24 * 60 * 60 * 1000
    )

    for (const notification of upcomingNotifications) {
      const delay = notification.scheduledFor.getTime() - now.getTime()
      if (delay > 0) {
        setTimeout(() => {
          showNotification(notification)
        }, delay)
      }
    }

    telemetry.track('notifications.scheduled.local', { 
      count: notifications.length,
      upcoming: upcomingNotifications.length 
    })

  } catch (error) {
    console.error('Notification scheduling error:', error)
    throw error
  }
}

/**
 * Clear all scheduled notifications
 */
export async function clearScheduledNotifications(): Promise<void> {
  try {
    // Clear from IndexedDB
    await db.meta.where('key').startsWith('notification_').delete()
    
    // Note: We can't cancel setTimeout timers that are already set
    // This is a limitation of the current approach
    
  } catch (error) {
    console.error('Clear notifications error:', error)
  }
}

/**
 * Show a notification to the user
 */
async function showNotification(notification: ScheduledNotification): Promise<void> {
  try {
    if (Notification.permission !== 'granted') {
      return
    }

    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: notification.id,
      requireInteraction: false,
      silent: false
    })

    // Auto-close after 10 seconds
    setTimeout(() => {
      notif.close()
    }, 10000)

    telemetry.track('notifications.shown', { 
      type: notification.type,
      id: notification.id 
    })

  } catch (error) {
    console.error('Show notification error:', error)
  }
}

/**
 * Generate weekly summary body text
 */
async function generateWeeklySummary(): Promise<string> {
  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get sessions from last week
    const recentSessions = await db.sessions
      .where('created_at')
      .above(oneWeekAgo.toISOString())
      .toArray()

    const completedSessions = recentSessions.filter(s => s.status === 'completed')
    
    if (completedSessions.length === 0) {
      return "No workouts this week. Ready to get back on track?"
    }

    // Calculate total volume
    const sessionIds = completedSessions.map(s => s.id)
    const loggedSets = await db.logged_sets
      .where('session_id')
      .anyOf(sessionIds)
      .and(set => !set.voided)
      .toArray()

    const totalVolume = loggedSets.reduce((sum, set) => {
      return sum + (set.weight || 0) * (set.reps || 0)
    }, 0)

    const streak = await calculateStreak()

    return `${completedSessions.length} workouts, ${Math.round(totalVolume)}kg total volume. ${streak > 1 ? `${streak} day streak! 🔥` : 'Keep it up! 💪'}`

  } catch (error) {
    console.error('Weekly summary error:', error)
    return "Check your progress in the app!"
  }
}

/**
 * Calculate current workout streak
 */
async function calculateStreak(): Promise<number> {
  try {
    const sessions = await db.sessions
      .orderBy('created_at')
      .reverse()
      .toArray()

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const session of sessions) {
      const sessionDate = new Date(session.created_at)
      sessionDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak && session.status === 'completed') {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Streak calculation error:', error)
    return 0
  }
}

/**
 * Check if a time falls within quiet hours
 */
function isInQuietHours(date: Date, preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false
  }

  const timeStr = date.toTimeString().slice(0, 5) // HH:MM format
  const start = preferences.quietHoursStart
  const end = preferences.quietHoursEnd

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return timeStr >= start || timeStr <= end
  } else {
    return timeStr >= start && timeStr <= end
  }
}

/**
 * Get the next occurrence of a specific weekday
 */
function getNextWeeklyDate(from: Date, targetWeekday: number, weeksOffset: number = 0): Date {
  const date = new Date(from)
  const currentWeekday = date.getDay()
  
  let daysUntilTarget = targetWeekday - currentWeekday
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7
  }
  
  date.setDate(date.getDate() + daysUntilTarget + (weeksOffset * 7))
  return date
}

/**
 * Store scheduled notifications in IndexedDB
 */
async function storeScheduledNotifications(notifications: ScheduledNotification[]): Promise<void> {
  try {
    const metaEntries = notifications.map(n => ({
      key: `notification_${n.id}`,
      value: JSON.stringify(n)
    }))

    await db.meta.bulkPut(metaEntries)
  } catch (error) {
    console.error('Store notifications error:', error)
  }
}

/**
 * Get stored scheduled notifications
 */
export async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  try {
    const metaEntries = await db.meta.where('key').startsWith('notification_').toArray()
    return metaEntries.map(entry => JSON.parse(entry.value))
  } catch (error) {
    console.error('Get notifications error:', error)
    return []
  }
}
