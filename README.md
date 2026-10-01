# opencode2-temperature-slider

A spring-loaded temperature slider for the OpenCode TUI. Drag it to change the
LLM temperature per model — no restart needed.

![slider](https://img.shields.io/badge/opencode-1.18%2B-blue)

## What it does

A small slider appears next to the prompt input (session and home screens):

- **Hold left of center** — temperature decreases by `0.1` every 500 ms.
- **Hold right of center** — temperature increases by `0.1` every 500 ms.
- **Drag** — the thumb follows the mouse and the direction flips when you cross
  the center.
- **Release** — the thumb springs back to the center like a real spring.

The current value is shown next to the slider (one decimal). When no model can
be resolved — e.g. on the home screen before a session has a model — the slider
is disabled and shows `--`.

## Per-model values

Each model has its own temperature. The value follows the model, not the
session: every session that uses the same model shares its temperature, and
different models keep independent values. Model variants of the same model ID
share the temperature.

Temperature resolution is:

1. Project override, when present.
2. Global default, when present.
3. OpenCode/model default.

Project overrides are stored in:

<project>/.opencode/temperature.json

Global defaults are stored in:

~/.config/opencode/temperature.json

On systems with XDG_CONFIG_HOME, the global file is placed under that
directory instead.

## How it works

The plugin has two parts:

| File                          | Type           | Loaded via      |
| ----------------------------- | -------------- | --------------- |
| `src/temperature.ts`          | server plugin  | `opencode.json` |
| `src/temperature-slider.tsx`  | TUI plugin     | `tui.json`      |

## Install

Copy the two plugin files into your OpenCode config:

```powershell
# Windows
Copy-Item src\temperature.ts      "$env:USERPROFILE\.config\opencode\plugins\temperature.ts"
Copy-Item src\temperature-slider.tsx "$env:USERPROFILE\.config\opencode\plugins\temperature-slider.tsx"
```

```bash
# macOS / Linux
cp src/temperature.ts ~/.config/opencode/plugins/temperature.ts
cp src/temperature-slider.tsx ~/.config/opencode/plugins/temperature-slider.tsx
```

The server plugin is auto-discovered. The TUI plugin must be listed in
`~/.config/opencode/tui.json`:

```json
{
  "plugins": [
    "./plugins/temperature-slider.tsx"
  ]
}
```

Restart OpenCode. The slider appears next to the prompt.

## Usage

- Drag the slider left or right and hold to change the temperature in 0.1
  steps every 500 ms.
- Slider changes create or update the project override.
- Run /temp-reset to clear the project override for the current model and
  fall back to the global default, or the model default when no global value
  exists.
- Run /temp-global to promote the current model temperature to the global
  default and remove the current project's override.

## Requirements

- OpenCode 1.18+
- A terminal with mouse support (the TUI must be started with mouse enabled)

## License

MIT