// Telemetry events for onboarding tracking
export type TelemetryEvent = 
  | { type: 'onb_step_viewed'; step_id: string }
  | { type: 'onb_saved'; step_id: string }
  | { type: 'onb_completed' }
  | { type: 'plan_created'; plan_id: string }
  | { type: 'baseline_session_seen'; session_id: string }

export class Telemetry {
  static track(event: TelemetryEvent) {
    // Log to console for development
    console.log('Telemetry:', event)
    
    // In production, this would send to analytics service
    // Example: PostHog, Mixpanel, or custom analytics endpoint
    
    // For now, store in localStorage for debugging
    try {
      const events = JSON.parse(localStorage.getItem('gymbud_telemetry') || '[]')
      events.push({
        ...event,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        url: window.location.href
      })
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('gymbud_telemetry', JSON.stringify(events))
    } catch (error) {
      console.warn('Failed to store telemetry event:', error)
    }
  }

  static getEvents(): any[] {
    try {
      return JSON.parse(localStorage.getItem('gymbud_telemetry') || '[]')
    } catch {
      return []
    }
  }

  static clearEvents() {
    localStorage.removeItem('gymbud_telemetry')
  }
}
