import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BridgeClient } from '../../src/bridge/client.js';

vi.mock('../../src/bridge/tokenDiscovery.js', () => ({
  discoverBridge: vi.fn(),
}));

import { discoverBridge } from '../../src/bridge/tokenDiscovery.js';
const mockDiscoverBridge = vi.mocked(discoverBridge);

// Import after mocks are set up
import { resolveBridge, addBridgeOptions } from '../../src/commands/shared.js';

describe('shared', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveBridge', () => {
    it('returns BridgeClient with explicit --port and --token (skips discovery)', async () => {
      const client = await resolveBridge({ port: 8080, token: 'explicit-token' });

      expect(client).toBeInstanceOf(BridgeClient);
      expect(mockDiscoverBridge).not.toHaveBeenCalled();
    });

    it('auto-discovers bridge when no explicit options given', async () => {
      mockDiscoverBridge.mockResolvedValue({ port: 9090, token: 'discovered' });

      const client = await resolveBridge({});

      expect(client).toBeInstanceOf(BridgeClient);
      expect(mockDiscoverBridge).toHaveBeenCalledOnce();
    });

    it('throws meaningful error when discovery fails', async () => {
      mockDiscoverBridge.mockResolvedValue(null);

      await expect(resolveBridge({})).rejects.toThrow('No bridge found');
    });

    it('merges explicit port with discovered token', async () => {
      mockDiscoverBridge.mockResolvedValue({ port: 9090, token: 'discovered' });

      const client = await resolveBridge({ port: 7777 });

      expect(client).toBeInstanceOf(BridgeClient);
      expect(mockDiscoverBridge).toHaveBeenCalledOnce();
    });

    it('merges explicit token with discovered port', async () => {
      mockDiscoverBridge.mockResolvedValue({ port: 9090, token: 'discovered' });

      const client = await resolveBridge({ token: 'my-token' });

      expect(client).toBeInstanceOf(BridgeClient);
      expect(mockDiscoverBridge).toHaveBeenCalledOnce();
    });
  });

  describe('addBridgeOptions', () => {
    it('adds --port and --token options to a command', async () => {
      const { Command } = await import('commander');
      const cmd = new Command('test-cmd');

      addBridgeOptions(cmd);

      const portOpt = cmd.options.find((o) => o.long === '--port');
      const tokenOpt = cmd.options.find((o) => o.long === '--token');

      expect(portOpt).toBeDefined();
      expect(tokenOpt).toBeDefined();
    });
  });
});
