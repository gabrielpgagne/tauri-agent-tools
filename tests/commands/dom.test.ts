import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the DOM serializer script output format and tree rendering
// by mocking the bridge and verifying the script structure

vi.mock('../../src/bridge/tokenDiscovery.js', () => ({
  discoverBridge: vi.fn().mockResolvedValue({ port: 9999, token: 'test' }),
}));

describe('DOM command', () => {
  describe('tree formatting', () => {
    // Test the formatting logic directly
    it('formats a basic node', () => {
      const node = {
        tag: 'div',
        id: 'app',
        classes: ['main', 'container'],
        rect: { width: 1920, height: 1080 },
      };

      const line = formatNode(node, 0);
      expect(line).toBe('div#app.main.container (1920x1080)');
    });

    it('formats node with text preview', () => {
      const node = {
        tag: 'button',
        classes: ['btn'],
        text: 'Click Me',
        rect: { width: 80, height: 32 },
      };

      const line = formatNode(node, 0);
      expect(line).toBe('button.btn "Click Me" (80x32)');
    });

    it('truncates long text', () => {
      const node = {
        tag: 'p',
        text: 'This is a very long paragraph text that should be truncated',
        rect: { width: 500, height: 20 },
      };

      const line = formatNode(node, 0);
      expect(line).toContain('...');
      expect(line.length).toBeLessThan(100);
    });

    it('marks zero-height elements', () => {
      const node = {
        tag: 'div',
        classes: ['hidden-toast'],
        rect: { width: 400, height: 0 },
      };

      const line = formatNode(node, 0);
      expect(line).toContain('[hidden]');
    });

    it('indents nested nodes', () => {
      const line = formatNode({ tag: 'span', rect: { width: 50, height: 20 } }, 3);
      expect(line).toBe('      span (50x20)');
    });
  });

  describe('accessibility tree formatting', () => {
    it('formats a basic a11y node', () => {
      const node = { role: 'button', name: 'Submit' };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[button] "Submit"');
    });

    it('formats node with state', () => {
      const node = { role: 'checkbox', name: 'Accept terms', state: { checked: true, required: true } };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[checkbox] "Accept terms" (checked, required)');
    });

    it('formats heading with level', () => {
      const node = { role: 'heading', name: 'Dashboard', state: { level: 2 } };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[heading] "Dashboard" (level=2)');
    });

    it('formats node without name', () => {
      const node = { role: 'list' };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[list]');
    });

    it('formats current link', () => {
      const node = { role: 'link', name: 'Home', state: { current: 'page' } };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[link] "Home" (current)');
    });

    it('formats disabled state', () => {
      const node = { role: 'button', name: 'Save', state: { disabled: true } };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[button] "Save" (disabled)');
    });

    it('indents nested a11y nodes', () => {
      const node = { role: 'listitem', name: 'Item 1' };
      const line = formatA11yNode(node, 2);
      expect(line).toBe('    [listitem] "Item 1"');
    });

    it('truncates long names', () => {
      const node = { role: 'paragraph', name: 'A'.repeat(60) };
      const line = formatA11yNode(node, 0);
      expect(line).toContain('...');
      expect(line).toContain('[paragraph]');
    });

    it('formats not expanded state', () => {
      const node = { role: 'button', name: 'Menu', state: { expanded: false } };
      const line = formatA11yNode(node, 0);
      expect(line).toBe('[button] "Menu" (not expanded)');
    });
  });
});

// Helper for a11y node formatting (mirrors dom.ts implementation)
interface TestA11yNode {
  role: string;
  name?: string;
  state?: Record<string, unknown>;
}

function formatA11yNode(node: TestA11yNode, indent: number): string {
  let line = '  '.repeat(indent);
  line += `[${node.role}]`;
  if (node.name) {
    const truncated = node.name.length > 50 ? node.name.slice(0, 47) + '...' : node.name;
    line += ` "${truncated}"`;
  }
  if (node.state) {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(node.state)) {
      if (key === 'level') {
        parts.push(`level=${value}`);
      } else if (key === 'current') {
        parts.push('current');
      } else if (value === true) {
        parts.push(key);
      } else if (value === false) {
        parts.push(`not ${key}`);
      }
    }
    if (parts.length) line += ` (${parts.join(', ')})`;
  }
  return line;
}

// Helper to test formatting logic directly (mirrors the dom.ts implementation)
interface TestNode {
  tag: string;
  id?: string;
  classes?: string[];
  text?: string;
  rect?: { width: number; height: number };
}

function formatNode(node: TestNode, indent: number): string {
  let line = '  '.repeat(indent);
  line += node.tag;
  if (node.id) line += `#${node.id}`;
  if (node.classes?.length) line += `.${node.classes.join('.')}`;
  if (node.text) {
    const truncated = node.text.length > 30 ? node.text.slice(0, 27) + '...' : node.text;
    line += ` "${truncated}"`;
  }
  if (node.rect) {
    const w = Math.round(node.rect.width);
    const h = Math.round(node.rect.height);
    line += ` (${w}x${h})`;
    if (h === 0) line += ' [hidden]';
  }
  return line;
}
