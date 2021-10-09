const DEFAULT_TIME_FN = performance.now.bind(performance)

/**
 * Creates a timer which executes a callback once per frame until the
 * timeout (duration) has been reached.
 * @param {Function} callback  Receives a value between 0 and 1, and timer
 *                             duration. The former represents proportion of
 *                             timer duration completed.
 * @param {int} duration       Timer duration in milliseconds
 * @param {Function} timeFn    Should return a function for getting the current
 *                             time in milliseconds. E.g., `Date.now` or
 *                             `performance.now.bind(performance)`.
 */
export function timer (callback, duration = 0, timeFn = DEFAULT_TIME_FN) {
  if (duration <= 0) {
    return
  }
  const animationStartTime = timeFn()

  let frame = requestAnimationFrame(function animate () {
    const now = timeFn()
    // normalized time since animation start
    const t = (now - animationStartTime) / duration
    if (t > 1) {
      // clamp to 1 when we hit target time
      return callback(1, duration)
    }
    callback(t, duration)
    frame = requestAnimationFrame(animate)
  })

  return () => cancelAnimationFrame(frame)
}
