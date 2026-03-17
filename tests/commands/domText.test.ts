import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/bridge/tokenDiscovery.js', () => ({
  discoverBridge: vi.fn().mockResolvedValue({ port: 9999, token: 'test' }),
}));

describe('DOM --text option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('text search via bridge', () => {
    it('returns matching elements as JSON', async () => {
      const matches = [
        { tag: 'span', id: 'greeting', text: 'Hello World', rect: { width: 120, height: 20 } },
        { tag: 'p', classes: ['intro'], text: 'Hello everyone', rect: { width: 500, height: 40 } },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(matches) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'Hello', '--json']);

      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      logSpy.mockRestore();
      vi.unstubAllGlobals();

      expect(output).toHaveLength(2);
      expect(output[0].tag).toBe('span');
      expect(output[1].tag).toBe('p');
    });

    it('outputs match count with --count', async () => {
      const matches = [
        { tag: 'span', text: 'Hello', rect: { width: 50, height: 20 } },
        { tag: 'div', text: 'Hello again', rect: { width: 100, height: 30 } },
        { tag: 'p', text: 'Hello there', rect: { width: 200, height: 40 } },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(matches) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'Hello', '--count']);

      expect(logSpy.mock.calls[0][0]).toBe('3');
      logSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('returns only first match with --first', async () => {
      const matches = [
        { tag: 'span', id: 'first', text: 'Target text', rect: { width: 50, height: 20 } },
        { tag: 'div', text: 'Target text too', rect: { width: 100, height: 30 } },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(matches) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'Target', '--first', '--json']);

      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      logSpy.mockRestore();
      vi.unstubAllGlobals();

      // Should be a single object, not an array
      expect(output.tag).toBe('span');
      expect(output.id).toBe('first');
    });

    it('returns first match as tree line (non-JSON)', async () => {
      const matches = [
        { tag: 'span', id: 'hit', text: 'Found it', rect: { width: 60, height: 18 } },
        { tag: 'p', text: 'Found it too', rect: { width: 400, height: 30 } },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(matches) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'Found', '--first']);

      // Only one call — second match not printed
      expect(logSpy.mock.calls).toHaveLength(1);
      const output = logSpy.mock.calls[0][0] as string;
      expect(output).toContain('span#hit');
      expect(output).toContain('"Found it"');
      logSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('throws when --first is used and no matches found', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: '[]' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      program.exitOverride();
      registerDom(program);

      await expect(
        program.parseAsync(['node', 'test', 'dom', '--text', 'nonexistent', '--first']),
      ).rejects.toThrow('No elements found containing');

      vi.unstubAllGlobals();
    });

    it('shows friendly message when no matches found in tree mode', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: '[]' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'xyz']);

      expect(logSpy.mock.calls[0][0]).toContain('No elements found containing "xyz"');
      logSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('formats tree output for text matches', async () => {
      const matches = [
        { tag: 'button', classes: ['primary'], text: 'Click me', rect: { width: 80, height: 32 } },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: JSON.stringify(matches) }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', 'Click']);

      // Tree format: tag.classes "text" (WxH)
      expect(logSpy.mock.calls[0][0]).toContain('button.primary');
      expect(logSpy.mock.calls[0][0]).toContain('"Click me"');
      expect(logSpy.mock.calls[0][0]).toContain('(80x32)');
      logSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('scopes text search to provided selector', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: '[]' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '#sidebar', '--text', 'Nav']);
      logSpy.mockRestore();

      // Verify the eval script uses the selector as the root
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.js).toContain("document.querySelector('#sidebar')");

      vi.unstubAllGlobals();
    });

    it('escapes special characters in text pattern', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: '[]' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const { Command } = await import('commander');
      const { registerDom } = await import('../../src/commands/dom.js');
      const program = new Command();
      registerDom(program);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await program.parseAsync(['node', 'test', 'dom', '--text', "it's"]);
      logSpy.mockRestore();

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      // The single quote should be escaped in the JS string
      expect(body.js).toContain("\\'s");

      vi.unstubAllGlobals();
    });
  });

  describe('buildSerializerScript export', () => {
    it('is importable from dom.js', async () => {
      const { buildSerializerScript } = await import('../../src/commands/dom.js');
      expect(typeof buildSerializerScript).toBe('function');
    });

    it('generates script with correct selector and depth', async () => {
      const { buildSerializerScript } = await import('../../src/commands/dom.js');
      const script = buildSerializerScript('body', 5, false);
      expect(script).toContain('body');
      expect(script).toContain('5');
      expect(script).toContain('false');
    });

    it('generates script with styles when requested', async () => {
      const { buildSerializerScript } = await import('../../src/commands/dom.js');
      const script = buildSerializerScript('.container', 3, true);
      expect(script).toContain('.container');
      expect(script).toContain('true');
    });

    it('escapes single quotes in selector', async () => {
      const { buildSerializerScript } = await import('../../src/commands/dom.js');
      const script = buildSerializerScript("[data-name='test']", 2, false);
      expect(script).toContain("\\'test\\'");
    });
  });
});
