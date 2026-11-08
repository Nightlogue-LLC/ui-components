/**
 * Best-effort vibration for web demos. Native apps should supply their own haptic
 * adapter through TactileTileOptions.onPressFeedback instead.
 * Browsers may decline vibration in embedded frames or without device support.
 */
export function tryBrowserVibration(durationMs = 12): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  try {
    return navigator.vibrate(durationMs);
  } catch {
    return false;
  }
}
