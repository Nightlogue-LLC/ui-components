import { afterEach, describe, expect, it, vi } from 'vitest';
import { tryBrowserVibration } from './browser-vibration.js';

const originalVibrate = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
afterEach(() => {
  if (originalVibrate) Object.defineProperty(navigator, 'vibrate', originalVibrate);
  else Reflect.deleteProperty(navigator, 'vibrate');
});

describe('tryBrowserVibration', () => {
  it('returns false when unavailable', () => {
    Reflect.deleteProperty(navigator, 'vibrate');
    expect(tryBrowserVibration()).toBe(false);
  });

  it('requests a short tap when supported', () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    expect(tryBrowserVibration()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(12);
  });

  it('handles denied vibration without crashing', () => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => false });
    expect(tryBrowserVibration()).toBe(false);
  });

  it('handles exceptions from the host environment', () => {
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: () => {
        throw new Error('Blocked');
      },
    });
    expect(tryBrowserVibration()).toBe(false);
  });
});
