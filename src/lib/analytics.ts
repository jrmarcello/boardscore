// Google Analytics 4 integration
// Measurement ID is loaded from environment variable

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string

// Initialize GA4
export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics: VITE_GA_MEASUREMENT_ID not set')
    return
  }

  // Don't track in development
  if (import.meta.env.DEV) {
    console.log('Google Analytics: disabled in development')
    return
  }

  // Add gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)
}

// Track page views (for SPA navigation)
export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || import.meta.env.DEV) return
  
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: path,
  })
}

// Track custom events
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (!GA_MEASUREMENT_ID || import.meta.env.DEV) return
  
  window.gtag?.('event', eventName, params)
}

// Predefined events for BoardScore
export const analytics = {
  // Auth events
  login: () => trackEvent('login', { method: 'google' }),
  logout: () => trackEvent('logout'),

  // Room events
  roomCreated: (hasPassword: boolean) =>
    trackEvent('room_created', { has_password: hasPassword }),
  roomJoined: (isOwner: boolean) =>
    trackEvent('room_joined', { is_owner: isOwner }),
  roomDeleted: () => trackEvent('room_deleted'),

  // Player events
  playerAdded: () => trackEvent('player_added'),
  playerRemoved: () => trackEvent('player_removed'),
  scoreChanged: (delta: number) =>
    trackEvent('score_changed', { delta }),
  scoresReset: (playerCount: number) =>
    trackEvent('scores_reset', { player_count: playerCount }),
  boardCleared: (playerCount: number) =>
    trackEvent('board_cleared', { player_count: playerCount }),

  // Feature usage
  tvModeOpened: () => trackEvent('tv_mode_opened'),
  themeChanged: (theme: 'light' | 'dark') =>
    trackEvent('theme_changed', { theme }),
  nicknameChanged: () => trackEvent('nickname_changed'),
}
