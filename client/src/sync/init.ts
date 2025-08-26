import { requestFlush } from './queue'

export function initSync() {
  // Manual: "Sync now" button
  window.addEventListener('gymbud:sync-now', () => requestFlush())

  // Auto: come back online
  window.addEventListener('online', () => {
    // small delay lets network settle
    setTimeout(() => requestFlush(), 200)
  })
}
