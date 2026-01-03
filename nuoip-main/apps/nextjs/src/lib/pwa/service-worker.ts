/**
 * Registers the service worker if not already registered
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    // Check if already registered
    if (navigator.serviceWorker.controller) {
      return await navigator.serviceWorker.ready
    }

    // Try to register
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.warn('Service worker registration failed:', error)
    return null
  }
}

/**
 * Waits for service worker to be ready, registering it if necessary
 */
export async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  
  try {
    // First try to get existing registration
    let registration = navigator.serviceWorker.controller
      ? await navigator.serviceWorker.ready
      : null

    // If not registered, register it
    if (!registration) {
      registration = await registerServiceWorker()
    }

    return registration
  } catch (error) {
    console.warn('Service worker not available:', error)
    return null
  }
}

