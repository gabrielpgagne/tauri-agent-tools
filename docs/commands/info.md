# info

Show window geometry and display server info.

!!! success "No Bridge Required"
    This command works with any window — no Tauri bridge needed.

## Usage

```bash
tauri-agent-tools info --title <regex> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --title <regex>` | Window title to match (required) | — |
| `--json` | Output as JSON | — |

## Examples

### Text output

```bash
tauri-agent-tools info --title "My App"
```

```
Window ID:      12345678
Name:           My Tauri App
Position:       100, 50
Size:           1920x1080
Display Server: x11
```

### JSON output

```bash
tauri-agent-tools info --title "My App" --json
```

```json
{
  "windowId": "12345678",
  "pid": 1234,
  "name": "My Tauri App",
  "x": 100,
  "y": 50,
  "width": 1920,
  "height": 1080,
  "displayServer": "x11"
}
```

## Notes

- The `--title` flag accepts a regex pattern for matching
- Window geometry includes decoration (title bar, borders)
- Display server is one of: `x11`, `wayland`, `darwin`
