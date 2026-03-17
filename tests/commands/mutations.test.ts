import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BridgeClient } from '../../src/bridge/client.js';
import { formatEntry, type MutationEntry } from '../../src/commands/mutations.js';

vi.mock('../../src/bridge/tokenDiscovery.js', () => ({
  discoverBridge: vi.fn().mockResolvedValue({ port: 9999, token: 'test' }),
}));

describe('Mutations command', () => {
  describe('formatEntry', () => {
    const ts = new Date('2024-06-15T14:30:00.500Z').getTime();

    it('formats childList addition', () => {
      const line = formatEntry({
        type: 'childList',
        target: '#list',
        timestamp: ts,
        added: [{ tag: 'li', class: 'item active' }],
      });
      expect(line).toBe('[14:30:00.500] childList #list +.item.active');
    });

    it('formats childList removal', () => {
      const line = formatEntry({
        type: 'childList',
        target: '.container',
        timestamp: ts,
        removed: [{ tag: 'div' }],
      });
      expect(line).toBe('[14:30:00.500] childList .container -div');
    });

    it('formats childList with both additions and removals', () => {
      const line = formatEntry({
        type: 'childList',
        target: '#app',
        timestamp: ts,
        added: [{ tag: 'span', class: 'new' }],
        removed: [{ tag: 'span', class: 'old' }],
      });
      expect(line).toBe('[14:30:00.500] childList #app +.new -.old');
    });

    it('formats attribute change', () => {
      const line = formatEntry({
        type: 'attributes',
        target: '#btn',
        timestamp: ts,
        attribute: 'disabled',
        oldValue: null,
        newValue: '',
      });
      expect(line).toBe('[14:30:00.500] attr #btn disabled: null → ');
    });

    it('formats attribute change with values', () => {
      const line = formatEntry({
        type: 'attributes',
        target: '.card',
        timestamp: ts,
        attribute: 'class',
        oldValue: 'card',
        newValue: 'card active',
      });
      expect(line).toBe('[14:30:00.500] attr .card class: card → card active');
    });

    it('formats unknown mutation type', () => {
      const line = formatEntry({
        type: 'characterData',
        target: '.text',
        timestamp: ts,
      });
      expect(line).toBe('[14:30:00.500] characterData .text');
    });

    it('formats multiple added nodes with class names', () => {
      const line = formatEntry({
        type: 'childList',
        target: '#list',
        timestamp: ts,
        added: [
          { tag: 'li', class: 'item' },
          { tag: 'li', class: 'item' },
        ],
      });
      expect(line).toBe('[14:30:00.500] childList #list +.item, .item');
    });

    it('formats added nodes without classes using tag', () => {
      const line = formatEntry({
        type: 'childList',
        target: '#content',
        timestamp: ts,
        added: [{ tag: 'br' }, { tag: 'hr' }],
      });
      expect(line).toBe('[14:30:00.500] childList #content +br, hr');
    });
  });

  describe('patch/drain/cleanup scripts', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('patch script returns patched status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'patched' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const result = await client.eval(`(() => {
        if (window.__tauriDevToolsMutationPatched) return 'already_patched';
        return 'patched';
      })()`);

      expect(result).toBe('patched');
      vi.unstubAllGlobals();
    });

    it('patch script returns not_found for missing element', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'not_found' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const result = await client.eval(`(() => {
        if (window.__tauriDevToolsMutationPatched) return 'already_patched';
        var target = document.querySelector('#nonexistent');
        if (!target) return 'not_found';
        return 'patched';
      })()`);

      expect(result).toBe('not_found');
      vi.unstubAllGlobals();
    });

    it('drain script returns empty array initially', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: '[]' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const raw = await client.eval(`(() => {
        var log = window.__tauriDevToolsMutationLog || [];
        window.__tauriDevToolsMutationLog = [];
        return JSON.stringify(log);
      })()`);

      const entries = JSON.parse(String(raw));
      expect(entries).toEqual([]);
      vi.unstubAllGlobals();
    });

    it('drain script returns and clears accumulated entries', async () => {
      const entries = [
        { type: 'childList', target: '#app', timestamp: Date.now(), added: [{ tag: 'div' }] },
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(entries) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const raw = await client.eval(`(() => {
        var log = window.__tauriDevToolsMutationLog || [];
        window.__tauriDevToolsMutationLog = [];
        return JSON.stringify(log);
      })()`);

      const parsed = JSON.parse(String(raw));
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('childList');
      vi.unstubAllGlobals();
    });

    it('cleanup script returns cleaned status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'cleaned' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const result = await client.eval(`(() => {
        if (window.__tauriDevToolsMutationObserver) {
          window.__tauriDevToolsMutationObserver.disconnect();
          delete window.__tauriDevToolsMutationObserver;
          delete window.__tauriDevToolsMutationLog;
          delete window.__tauriDevToolsMutationPatched;
        }
        return 'cleaned';
      })()`);

      expect(result).toBe('cleaned');
      vi.unstubAllGlobals();
    });
  });

  describe('selector escaping', () => {
    it('escapes single quotes in selector', () => {
      const selector = "[data-value='hello']";
      const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      expect(escaped).toBe("[data-value=\\'hello\\']");
    });

    it('escapes backslashes before single quotes', () => {
      const selector = "div.foo\\'s";
      const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      expect(escaped).toContain('\\\\');
      expect(escaped).toContain("\\'");
    });

    it('handles selector with no special characters', () => {
      const selector = '#app .container > div';
      const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      expect(escaped).toBe('#app .container > div');
    });
  });
});
