import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for API polling
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @param {Object} options - Additional options
 * @param {boolean} options.runOnMount - Run callback immediately on mount (default: true)
 * @param {Function} options.onError - Error handler
 */
export const usePolling = (callback, interval = 5000, enabled = true, options = {}) => {
  const { runOnMount = true, onError } = options
  const savedCallback = useRef()
  const intervalRef = useRef()
  const isPolling = useRef(false)

  // Save callback to ref to avoid re-creating interval
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Polling function
  const poll = useCallback(async () => {
    if (isPolling.current) return // Prevent concurrent calls

    isPolling.current = true
    try {
      if (savedCallback.current) {
        await savedCallback.current()
      }
    } catch (error) {
      console.error('Polling error:', error)
      if (onError) {
        onError(error)
      }
    } finally {
      isPolling.current = false
    }
  }, [onError])

  // Setup polling interval
  useEffect(() => {
    if (!enabled) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Run immediately on mount if enabled
    if (runOnMount) {
      poll()
    }

    // Setup interval
    intervalRef.current = setInterval(poll, interval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, poll, runOnMount])

  // Return manual trigger function
  const trigger = useCallback(() => {
    poll()
  }, [poll])

  return { trigger }
}

export default usePolling
