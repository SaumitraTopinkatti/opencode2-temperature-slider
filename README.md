# opencode2-temperature-slider

OpenCode temperature control without a persistent TUI widget.

Use a slash command inside a session:

```text
/temp 1.0
/temp 0.7
/temp reset
```

`/temp <value>` sets the temperature for the current session.
`/temp reset` removes the session override.
`/temp` with no value reports the current session override, if any.

## Precedence

Temperature is resolved in this order:

1. Session override
2. Project override
3. Global default
4. OpenCode/model default

Session overrides apply to every model request made by that session, including
after switching models.

## State files

Project overrides:

```text
<project>/.opencode/temperature.json
```

Global defaults:

```text
~/.config/opencode/temperature.json
```

Session overrides:

```text
~/.config/opencode/temperature-sessions.json
```

`XDG_CONFIG_HOME` is honored on systems that set it.

## How it works

The plugin still has two OpenCode integration points:
| File | Role |
| --- | --- |
| `src/temperature.ts` | Server `chat.params` hook |
| `src/temperature-command.ts` | TUI slash command |
| `src/state.ts` | Shared state-file helpers |

The server hook receives the current `sessionID`, so the session override is
applied directly to the model request instead of becoming part of the prompt.

## Install

Add the plugin to both `opencode.json` and `tui.json` using the same GitHub
spec:

```json
"github:SaumitraTopinkatti/opencode2-temperature-slider#<commit>"
```

Restart OpenCode after changing the pinned commit.

## Usage

```text
/temp 1.2
→ session temperature = 1.2

/temp
→ show current session override

/temp reset
→ remove session override and fall back to project/global/model defaults
```

Values are clamped to `0..2`.

## Global defaults

The existing global file remains model-specific. Example:

```json
{
  "version": 1,
  "models": {
    "openrouter/deepseek/deepseek-v4.1-flash": {
      "temperature": 1.0
    }
  }
}
```

`/temp` does not modify global or project defaults.
