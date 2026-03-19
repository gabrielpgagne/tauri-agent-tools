import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectDisplayServer } from '../../src/platform/detect.js';

describe('detectDisplayServer', () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.WAYLAND_DISPLAY;
    delete process.env.DISPLAY;
    delete process.env.XDG_SESSION_TYPE;
  });

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('returns "darwin" on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expect(detectDisplayServer()).toBe('darwin');
  });

  it('returns "wayland" when WAYLAND_DISPLAY is set', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    expect(detectDisplayServer()).toBe('wayland');
  });

  it('returns "x11" when DISPLAY is set', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.DISPLAY = ':0';
    expect(detectDisplayServer()).toBe('x11');
  });

  it('prefers WAYLAND_DISPLAY over DISPLAY', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    process.env.DISPLAY = ':0';
    expect(detectDisplayServer()).toBe('wayland');
  });

  it('falls back to XDG_SESSION_TYPE=wayland', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.XDG_SESSION_TYPE = 'wayland';
    expect(detectDisplayServer()).toBe('wayland');
  });

  it('falls back to XDG_SESSION_TYPE=x11', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.XDG_SESSION_TYPE = 'x11';
    expect(detectDisplayServer()).toBe('x11');
  });

  it('returns "unknown" when no display server detected', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    expect(detectDisplayServer()).toBe('unknown');
  });

  it('darwin takes priority over WAYLAND_DISPLAY', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    expect(detectDisplayServer()).toBe('darwin');
  });
});
