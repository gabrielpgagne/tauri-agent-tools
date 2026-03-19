import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Build the test dir path eagerly to avoid hoisting issues with vi.mock
const TEST_DIR = join('/tmp', `tauri-test-${process.pid}`);

// Mock os.tmpdir to return our test directory
vi.mock('node:os', () => ({
  tmpdir: () => join('/tmp', `tauri-test-${process.pid}`),
}));

// Import after mocking so the module picks up the mocked tmpdir
const { discoverBridge, discoverBridgesByPid } = await import(
  '../../src/bridge/tokenDiscovery.js'
);

describe('tokenDiscovery', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  function writeTokenFile(
    pid: number,
    data: { port: number; token: string; pid: number },
  ) {
    const filePath = join(TEST_DIR, `tauri-dev-bridge-${pid}.token`);
    return writeFile(filePath, JSON.stringify(data));
  }

  describe('discoverBridge', () => {
    it('returns config from a valid token file with live PID', async () => {
      await writeTokenFile(process.pid, {
        port: 8080,
        token: 'abc123',
        pid: process.pid,
      });

      const config = await discoverBridge();
      expect(config).toEqual({ port: 8080, token: 'abc123' });
    });

    it('returns null when no token files exist', async () => {
      const config = await discoverBridge();
      expect(config).toBeNull();
    });

    it('cleans up stale token files from dead processes', async () => {
      // PID 999999 is almost certainly dead
      await writeTokenFile(999999, {
        port: 8080,
        token: 'stale',
        pid: 999999,
      });

      const config = await discoverBridge();
      expect(config).toBeNull();

      // Verify the stale file was removed
      const files = await readdir(TEST_DIR);
      const tokenFiles = files.filter((f) => f.startsWith('tauri-dev-bridge-'));
      expect(tokenFiles).toHaveLength(0);
    });

    it('skips malformed JSON files', async () => {
      const filePath = join(TEST_DIR, 'tauri-dev-bridge-12345.token');
      await writeFile(filePath, 'not valid json{{{');

      // Also write a valid one so we can verify it still works
      await writeTokenFile(process.pid, {
        port: 9090,
        token: 'valid',
        pid: process.pid,
      });

      const config = await discoverBridge();
      expect(config).toEqual({ port: 9090, token: 'valid' });
    });

    it('skips files missing required fields', async () => {
      const filePath = join(TEST_DIR, 'tauri-dev-bridge-77777.token');
      await writeFile(filePath, JSON.stringify({ port: 8080 })); // missing token and pid

      const config = await discoverBridge();
      expect(config).toBeNull();
    });

    it('returns the first live bridge when multiple exist', async () => {
      await writeTokenFile(process.pid, {
        port: 1111,
        token: 'first',
        pid: process.pid,
      });

      // Write a second token file using a different "fake" pid number in filename
      const filePath = join(TEST_DIR, `tauri-dev-bridge-${process.pid + 100000}.token`);
      await writeFile(
        filePath,
        JSON.stringify({ port: 2222, token: 'second', pid: process.pid }),
      );

      const config = await discoverBridge();
      expect(config).not.toBeNull();
      expect([1111, 2222]).toContain(config!.port);
    });
  });

  describe('discoverBridgesByPid', () => {
    it('returns a map of PID to config for live bridges', async () => {
      await writeTokenFile(process.pid, {
        port: 8080,
        token: 'abc123',
        pid: process.pid,
      });

      const result = await discoverBridgesByPid();
      expect(result).toBeInstanceOf(Map);
      expect(result.get(process.pid)).toEqual({ port: 8080, token: 'abc123' });
    });

    it('returns empty map when no token files exist', async () => {
      const result = await discoverBridgesByPid();
      expect(result.size).toBe(0);
    });

    it('excludes stale PIDs', async () => {
      await writeTokenFile(999999, {
        port: 8080,
        token: 'stale',
        pid: 999999,
      });

      const result = await discoverBridgesByPid();
      expect(result.size).toBe(0);
    });
  });
});
