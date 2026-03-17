# dom

Query DOM structure from the Tauri app.

!!! note "Bridge Required"
    This command requires an active bridge connection.

## Usage

```bash
tauri-agent-tools dom [selector] [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `[selector]` | Root element to explore (positional argument) | `body` |
| `-s, --selector <css>` | Root element to explore (flag alternative) | — |
| `--mode <mode>` | Output mode: `dom` or `accessibility` | `dom` |
| `--depth <number>` | Max child depth | `3` |
| `--tree` | Compact tree view (default) | — |
| `--styles` | Include computed styles (display, visibility, opacity, position, overflow) | — |
| `--count` | Just output match count | — |
| `--first` | Only return first match (depth 0) | — |
| `--json` | Full structured JSON output | — |
| `--port <number>` | Bridge port (auto-discover if omitted) | — |
| `--token <string>` | Bridge token (auto-discover if omitted) | — |

## Examples

### Explore full page

```bash
tauri-agent-tools dom --depth 3
```

```
body (1920x1080)
  div#app (1920x1080)
    header.navbar (1920x64)
      nav.nav-links (400x64)
    main.content (1920x1016)
      div.sidebar (300x1016)
```

### Explore a subtree

```bash
tauri-agent-tools dom ".sidebar" --depth 2
```

### Count matching elements

```bash
tauri-agent-tools dom --count ".list-item"
```

```
12
```

### Include computed styles

```bash
tauri-agent-tools dom ".toolbar" --styles --json
```

### Accessibility tree

```bash
tauri-agent-tools dom --mode accessibility --depth 2
```

```
[document]
  [banner]
    [navigation] "Main menu"
      [link] "Home"
      [link] "Settings"
  [main]
    [heading] "Dashboard" (level=1)
```

### JSON output

```bash
tauri-agent-tools dom ".header" --json
```

```json
{
  "tag": "header",
  "id": "main-header",
  "classes": ["header", "sticky"],
  "rect": { "width": 1920, "height": 64 },
  "children": [...]
}
```

## Output Formats

**Tree view** (default): compact indented tree showing tag, id, classes, text content, and dimensions. Elements with zero height are marked `[hidden]`.

**Accessibility mode** (`--mode accessibility`): shows ARIA roles, accessible names, and states (disabled, checked, expanded, selected, required, current, level).

**JSON** (`--json`): full structured output with all attributes, dimensions, and optional computed styles.
