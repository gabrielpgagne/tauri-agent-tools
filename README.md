# tauri-dev-tools

DOM-targeted pixel capture for Tauri apps. Screenshot specific DOM elements with real screen pixels — not canvas renders.

## The Problem

Debugging frontend issues in Tauri desktop apps requires manually screenshotting, cropping, and describing what you see. Existing tools either hijack your cursor (xcap-based), render DOM to canvas (html2canvas — can't capture WebGL/video/canvas), or have no authentication.

## The Solution

Combine a bridge's knowledge of element positions (`getBoundingClientRect`) with real pixel screenshots (`import -window` + ImageMagick crop). No other tool does this.

```bash
# Screenshot a specific DOM element with real pixels
tauri-dev-tools screenshot --selector ".wf-toolbar" -o /tmp/toolbar.png
tauri-dev-tools screenshot --selector "#canvas-area" -o /tmp/canvas.png

# Explore DOM structure first
tauri-dev-tools dom --depth 3
tauri-dev-tools dom ".wf-canvas" --depth 4

# Then screenshot what you found
tauri-dev-tools screenshot --selector ".wf-canvas .block-node" -o /tmp/block.png
```

## Install

```bash
npm install -g tauri-dev-tools
```

**System requirements:**
- **Linux X11:** `xdotool`, `imagemagick` (`sudo apt install xdotool imagemagick`)
- **Linux Wayland/Sway:** `swaymsg`, `grim`, `imagemagick`
- **macOS:** `imagemagick` (`brew install imagemagick`) — all other tools are built-in. Grant Screen Recording permission in System Settings → Privacy & Security → Screen Recording.

## Quick Start

### 1. Add the bridge to your Tauri app

See [rust-bridge/README.md](rust-bridge/README.md) for step-by-step integration (~120 lines of Rust).

The bridge runs a localhost-only, token-authenticated HTTP server during development. It auto-cleans up on exit.

### 2. Use the CLI

```bash
# DOM-targeted screenshot (needs bridge)
tauri-dev-tools screenshot --selector ".toolbar" -o /tmp/toolbar.png
tauri-dev-tools screenshot --selector "#main-canvas" --max-width 800 -o /tmp/canvas.png

# Full window screenshot (no bridge needed, works with any window)
tauri-dev-tools screenshot --title "My App" -o /tmp/full.png

# Explore DOM
tauri-dev-tools dom --depth 3
tauri-dev-tools dom ".sidebar" --depth 2 --styles

# Evaluate JS
tauri-dev-tools eval "document.title"
tauri-dev-tools eval "document.querySelectorAll('.item').length"

# Wait for conditions
tauri-dev-tools wait --selector ".toast-message" --timeout 5000
tauri-dev-tools wait --title "My App" --timeout 10000

# Window info
tauri-dev-tools info --title "My App" --json
```

## Commands

### `screenshot`

Capture a screenshot of a window or DOM element.

| Option | Description |
|--------|-------------|
| `-s, --selector <css>` | CSS selector — screenshot just this element (requires bridge) |
| `-t, --title <regex>` | Window title to match |
| `-o, --output <path>` | Output file path (default: auto-named) |
| `--format <png\|jpg>` | Output format (default: png) |
| `--max-width <number>` | Resize to max width |
| `--port <number>` | Bridge port (auto-discover if omitted) |
| `--token <string>` | Bridge token (auto-discover if omitted) |

### `dom`

Query DOM structure from the Tauri app.

| Option | Description |
|--------|-------------|
| `[selector]` | Root element to explore (default: body) |
| `--mode <mode>` | Output mode: `dom` (default) or `accessibility` |
| `--depth <number>` | Max child depth (default: 3) |
| `--tree` | Compact tree view (default) |
| `--styles` | Include computed styles |
| `--count` | Just output match count |
| `--first` | Only return first match |
| `--json` | Full structured JSON output |

### `eval`

Evaluate a JavaScript expression in the Tauri app.

```bash
tauri-dev-tools eval "document.title"
```

### `wait`

Wait for a condition to be met.

| Option | Description |
|--------|-------------|
| `-s, --selector <css>` | Wait for CSS selector to match |
| `-e, --eval <js>` | Wait for JS expression to be truthy |
| `-t, --title <regex>` | Wait for window with title (no bridge) |
| `--timeout <ms>` | Maximum wait time (default: 10000) |
| `--interval <ms>` | Polling interval (default: 500) |

### `info`

Show window geometry and display server info.

```bash
tauri-dev-tools info --title "My App" --json
```

### `list-windows`

List all visible windows, marking Tauri apps.

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--tauri` | Only show Tauri app windows |

### `ipc-monitor`

Monitor Tauri IPC calls in real-time (read-only). Monkey-patches `window.__TAURI__.core.invoke` to capture calls, then polls and restores on exit.

| Option | Description |
|--------|-------------|
| `--filter <command>` | Only show specific IPC commands (supports `*` wildcards) |
| `--interval <ms>` | Poll interval in milliseconds (default: 500) |
| `--duration <ms>` | Auto-stop after N milliseconds |
| `--json` | Output one JSON object per line |

### `console-monitor`

Monitor console output (log/warn/error/info/debug) in real-time. Monkey-patches console methods to capture entries, then polls and restores on exit.

| Option | Description |
|--------|-------------|
| `--level <level>` | Filter by level (log, warn, error, info, debug) |
| `--filter <regex>` | Filter messages by regex pattern |
| `--interval <ms>` | Poll interval in milliseconds (default: 500) |
| `--duration <ms>` | Auto-stop after N milliseconds |
| `--json` | Output one JSON object per line |

### `storage`

Inspect localStorage, sessionStorage, and cookies from the Tauri webview. One-shot read — no writes.

| Option | Description |
|--------|-------------|
| `--type <type>` | Storage type: `local`, `session`, `cookies`, `all` (default: all) |
| `--key <name>` | Get a specific key's value |
| `--json` | Output as JSON |

### `page-state`

Query webview page state: URL, title, viewport, scroll position, document size, and Tauri detection.

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

## How It Works

```
screenshot --selector ".toolbar" --title "My App"
  │
  ├─► Bridge client ──► POST /eval ──► getBoundingClientRect(".toolbar")
  │                                     returns { x, y, width, height }
  │
  ├─► Platform adapter ──► import -window WID png:- (capture full window)
  │
  ├─► Compute crop region:
  │     element rect from bridge + viewport offset (outerHeight - innerHeight)
  │
  └─► convert png:- -crop WxH+X+Y +repage png:- (crop to element)
```

The crop accounts for window decoration (title bar, borders) by comparing `window.innerHeight` from the bridge with the actual window height from `xdotool`.

## Platform Support

| Platform | Display Server | Status |
|----------|---------------|--------|
| Linux | X11 | Supported |
| Linux | Wayland (Sway) | Supported |
| macOS | CoreGraphics | Supported |
| Windows | - | Planned |

## Design Decisions

### Why no write operations

All commands are read-only. We don't inject clicks, keystrokes, scroll events, or any input into the Tauri webview. Reasons:

- **Native input injection is risky.** X11 input injection (e.g. via `xdotool`) operates system-wide, not per-window — it can grab the mouse cursor and require a hard reboot to recover.
- **Simulated events don't work.** `dispatchEvent()` creates events with `isTrusted: false`. Frameworks (React, Vue, Angular) and browsers reject untrusted events for security-sensitive operations.
- **Input injection is fragile across platforms.** X11 (`xdotool`), Wayland (no global input protocol by design), and macOS (requires Accessibility permission + sandbox restrictions) each have different security models. A cross-platform injection layer would be unreliable.
- **Read-only is a safer contract for dev tool automation.** Tools that can only observe cannot corrupt application state, trigger unintended side effects, or create security vulnerabilities in CI pipelines.

### Why no MCP server mode

This tool is a CLI that runs commands and exits — not a persistent MCP server. Reasons:

- **No daemon to manage.** No port to monitor, no process to restart, no state to leak between sessions.
- **No `.mcp.json` auto-start risk.** MCP servers start automatically when a project opens in supporting editors. A dev tool that auto-starts and connects to your running app on project open is a footgun.
- **No transport complexity.** No WebSocket/stdio state machine, no reconnection logic, no transport-layer bugs.
- **Composable with any agent framework.** Commands return structured output (`--json`) that any tool-use system can call directly. Define each command as a tool — no MCP SDK dependency required.

## Safety Guarantees

- **No input injection** — no mouse moves, clicks, keystrokes, or cursor changes
- **No xcap crate** — uses `xdotool` + ImageMagick `import` (read-only X11 operations)
- **No daemon** — CLI runs and exits, no background processes
- **No `.mcp.json`** — never auto-starts
- **All OS interactions read-only** — `xdotool search`, `getwindowgeometry`, `import -window`
- **Token authenticated bridge** — random 32-char token, localhost-only
- **`execFile` (array args)** — never `exec` (shell string), prevents command injection
- **Window ID validated** — must match `/^\d+$/`

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
