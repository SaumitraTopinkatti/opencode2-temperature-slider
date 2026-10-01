# opencode2-temperature-slider

OpenCode temperature control without a persistent TUI widget.

Use the slash command:

```text
/temp
```

OpenCode opens a small input dialog. Enter a temperature from `0` to `2`, then press Enter.

You can also enter:

```text
reset
```

to remove the current session override.

The `/temperature` alias is also registered.

## Precedence

Temperature is resolved in this order:

1. Session override
2. Project override
3. Global default
4. OpenCode/model default

Session overrides apply to every model request made by that session, including after switching models.

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

`XDG_CONFIG_HOME` is honored when set.

## How it works

| File | Role |
| --- | --- |
| `src/temperature.ts` | Server `chat.params` hook |
| `src/temperature-command.ts` | TUI `/temp` command + dialog |
| `src/state.ts` | Shared state helpers |

The server hook receives the current `sessionID`, so session temperature is applied directly to the model request.

OpenCode's slash-command UI currently dispatches registered slash commands by command name. It does not expose arbitrary `/command args` to the TUI plugin handler. The plugin therefore uses `/temp` followed by a native prompt dialog for the value.

## Install

Add the plugin to both `opencode.json` and `tui.json`:

```json
"github:SaumitraTopinkatti/opencode2-temperature-slider#<commit>"
```

Restart OpenCode after changing the pinned commit.

## Global defaults

The global file remains model-specific. Example:

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

`/temp` only changes the current session.
