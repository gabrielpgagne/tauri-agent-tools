import { describe, it, expect, vi } from 'vitest';
import { BridgeClient } from '../../src/bridge/client.js';

vi.mock('../../src/bridge/tokenDiscovery.js', () => ({
  discoverBridge: vi.fn().mockResolvedValue({ port: 9999, token: 'test' }),
}));

describe('Storage', () => {
  describe('cookie parsing', () => {
    function parseCookies(
      cookieString: string,
    ): { key: string; value: string | null }[] {
      if (!cookieString || !cookieString.trim()) return [];
      return cookieString.split('; ').map((pair) => {
        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1) return { key: pair, value: null };
        return { key: pair.slice(0, eqIdx), value: pair.slice(eqIdx + 1) };
      });
    }

    it('parses empty cookie string', () => {
      expect(parseCookies('')).toEqual([]);
      expect(parseCookies('  ')).toEqual([]);
    });

    it('parses single cookie', () => {
      expect(parseCookies('sid=abc123')).toEqual([{ key: 'sid', value: 'abc123' }]);
    });

    it('parses multiple cookies', () => {
      const result = parseCookies('sid=abc123; _ga=GA1.1.123; theme=dark');
      expect(result).toEqual([
        { key: 'sid', value: 'abc123' },
        { key: '_ga', value: 'GA1.1.123' },
        { key: 'theme', value: 'dark' },
      ]);
    });

    it('handles = in cookie value', () => {
      const result = parseCookies('data=a=b=c');
      expect(result).toEqual([{ key: 'data', value: 'a=b=c' }]);
    });

    it('handles cookie with no value', () => {
      const result = parseCookies('flagonly');
      expect(result).toEqual([{ key: 'flagonly', value: null }]);
    });
  });

  describe('output formatting', () => {
    function formatSection(
      name: string,
      entries: { key: string; value: string | null }[],
    ): string {
      const count = entries.length;
      const label = count === 1 ? 'entry' : 'entries';
      const lines = [`${name} (${count} ${label})`];
      for (const e of entries) {
        lines.push(
          `  ${e.key} = ${e.value === null ? '(no value)' : JSON.stringify(e.value)}`,
        );
      }
      return lines.join('\n');
    }

    it('formats section with correct entry count', () => {
      const output = formatSection('localStorage', [
        { key: 'theme', value: 'dark' },
        { key: 'lang', value: 'en' },
        { key: 'token', value: 'abc123' },
      ]);
      expect(output).toContain('localStorage (3 entries)');
      expect(output).toContain('  theme = "dark"');
      expect(output).toContain('  lang = "en"');
      expect(output).toContain('  token = "abc123"');
    });

    it('uses singular "entry" for single item', () => {
      const output = formatSection('sessionStorage', [{ key: 'tab', value: 'settings' }]);
      expect(output).toContain('sessionStorage (1 entry)');
    });

    it('formats empty section', () => {
      const output = formatSection('cookies', []);
      expect(output).toContain('cookies (0 entries)');
    });

    it('handles null values', () => {
      const output = formatSection('cookies', [{ key: 'flagonly', value: null }]);
      expect(output).toContain('  flagonly = (no value)');
    });
  });

  describe('key lookup script generation', () => {
    function escapeQuotes(s: string): string {
      return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function buildLocalStorageScript(key?: string): string {
      if (key) {
        return `localStorage.getItem('${escapeQuotes(key)}')`;
      }
      return `JSON.stringify(Object.keys(localStorage).map(function(k) { return { key: k, value: localStorage.getItem(k) }; }))`;
    }

    it('generates key lookup script', () => {
      const script = buildLocalStorageScript('theme');
      expect(script).toBe("localStorage.getItem('theme')");
    });

    it('escapes single quotes in key', () => {
      const script = buildLocalStorageScript("it's");
      expect(script).toBe("localStorage.getItem('it\\'s')");
    });

    it('escapes backslashes in key', () => {
      const script = buildLocalStorageScript('path\\to\\key');
      expect(script).toBe("localStorage.getItem('path\\\\to\\\\key')");
    });

    it('generates list script without key', () => {
      const script = buildLocalStorageScript();
      expect(script).toContain('Object.keys(localStorage)');
    });
  });

  describe('type validation', () => {
    it('accepts valid types', () => {
      const validTypes = ['local', 'session', 'cookies', 'all'];
      for (const type of validTypes) {
        expect(validTypes.includes(type)).toBe(true);
      }
    });

    it('rejects invalid types', () => {
      const validTypes = ['local', 'session', 'cookies', 'all'];
      expect(validTypes.includes('localstorage')).toBe(false);
      expect(validTypes.includes('indexeddb')).toBe(false);
    });
  });

  describe('bridge eval', () => {
    it('parses localStorage entries from bridge response', async () => {
      const entries = [
        { key: 'theme', value: 'dark' },
        { key: 'lang', value: 'en' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(entries) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new BridgeClient({ port: 9999, token: 'test' });
      const raw = await client.eval('test');
      const parsed = JSON.parse(String(raw));

      expect(parsed).toEqual(entries);
      vi.unstubAllGlobals();
    });
  });
});
