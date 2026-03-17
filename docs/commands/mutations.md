# mutations

Watch DOM mutations on a CSS selector in real-time (read-only).

!!! note "Bridge Required"
    This command requires an active bridge connection.

## Usage

```bash
tauri-agent-tools mutations <selector> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `<selector>` | CSS selector of the element to observe | (required) |
| `--attributes` | Also watch attribute changes | — |
| `--interval <ms>` | Poll interval in milliseconds | `500` |
| `--duration <ms>` | Auto-stop after N milliseconds | — |
| `--json` | Output one JSON object per line | — |
| `--port <number>` | Bridge port (auto-discover if omitted) | — |
| `--token <string>` | Bridge token (auto-discover if omitted) | — |

## Examples

### Watch for child additions/removals

```bash
tauri-agent-tools mutations "#todo-list" --duration 10000
```

```
[14:30:00.500] childList #todo-list +.todo-item
[14:30:02.100] childList #todo-list -.todo-item
```

### Watch attribute changes too

```bash
tauri-agent-tools mutations ".sidebar" --attributes --duration 5000
```

```
[14:30:01.200] attr .sidebar class: sidebar → sidebar expanded
```

### JSON output for automation

```bash
tauri-agent-tools mutations "#app" --json --duration 10000
```

### Quick 5-second observation

```bash
tauri-agent-tools mutations "body" --duration 5000 --interval 200
```

## How It Works

1. Patches a `MutationObserver` into the webview targeting the specified selector
2. Polls the accumulated mutation log at the configured interval
3. Formats and outputs each mutation entry
4. Disconnects the observer and cleans up global state on exit (Ctrl+C, SIGTERM, or `--duration`)

## Important Notes

- **Always use `--duration`** in automation to avoid indefinite execution.
- The observer watches `childList` and `subtree` by default. Add `--attributes` to also track attribute changes.
- If a previous session didn't clean up (e.g., hard kill), the command will warn and drain the existing log.
