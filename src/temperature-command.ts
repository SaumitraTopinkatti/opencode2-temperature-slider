import type { TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { clampTemperature, clearSessionTemperature, readSessionTemperature, writeSessionTemperature } from "./state.js"

const HELP = "Enter a value from 0 to 2, or reset."

function currentSessionID(api: TuiPluginApi): string | undefined {
  const route = api.route.current
  return route.name === "session" ? route.params.sessionID : undefined
}

function applyTemperature(api: TuiPluginApi, sessionID: string, raw: string): void {
  const value = raw.trim()

  if (!value) {
    api.ui.toast({ variant: "error", message: HELP })
    return
  }

  if (value.toLowerCase() === "reset") {
    clearSessionTemperature(sessionID)
    api.ui.toast({ variant: "success", message: "Session temperature reset." })
    return
  }

  const temperature = clampTemperature(Number(value))
  if (temperature === undefined) {
    api.ui.toast({ variant: "error", message: HELP })
    return
  }

  writeSessionTemperature(sessionID, temperature)
  api.ui.toast({
    variant: "success",
    message: `Session temperature set to ${temperature.toFixed(1)}.`,
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "temperature.command",
  async tui(api) {
    const run = () => {
      const sessionID = currentSessionID(api)
      if (!sessionID) {
        api.ui.toast({ variant: "warning", message: "Open a session first." })
        return
      }

      const current = readSessionTemperature(sessionID)

      api.ui.dialog.replace(() =>
        api.ui.DialogPrompt({
          title: "Set session temperature",
          placeholder: "1.0",
          value: current === undefined ? "" : current.toFixed(1),
          onConfirm: (value) => {
            api.ui.dialog.clear()
            applyTemperature(api, sessionID, value)
          },
          onCancel: () => api.ui.dialog.clear(),
        }),
      )
    }

    const command = {
      namespace: "palette",
      name: "temperature.set",
      title: "Set session temperature",
      desc: "Set the LLM temperature for the current session.",
      category: "Temperature",
      slashName: "temp",
      slashAliases: ["temperature"],
      run,
    }

    const keymap = (api as any).keymap
    if (keymap?.registerLayer) {
      keymap.registerLayer({
        commands: [command],
      })
      return
    }

    const unregister = api.command?.register(() => [
      {
        title: command.title,
        value: command.name,
        description: command.desc,
        category: command.category,
        slash: { name: command.slashName, aliases: command.slashAliases },
        onSelect: run,
      },
    ])
    if (unregister) api.lifecycle.onDispose(unregister)
  },
}

export default plugin
