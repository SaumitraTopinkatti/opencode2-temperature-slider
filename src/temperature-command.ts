import type { TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { clampTemperature, clearSessionTemperature, readSessionTemperature, writeSessionTemperature } from "./state.js"

const HELP = "Usage: /temp <0-2> or /temp reset"

function currentSessionID(api: TuiPluginApi): string | undefined {
  const route = api.route.current
  return route.name === "session" ? route.params.sessionID : undefined
}

function commandArgument(input: unknown): string {
  if (typeof input !== "string") return ""
  const raw = input.trim()
  return raw.replace(/^\/?(?:temp|temperature)(?:\s+|$)/i, "").trim()
}

const plugin: TuiPluginModule & { id: string } = {
  id: "temperature.command",
  async tui(api) {
    const run = (ctx: any) => {
      const sessionID = currentSessionID(api)
      if (!sessionID) {
        api.ui.toast({ variant: "warning", message: "Open a session first." })
        return
      }

      const argument = commandArgument(ctx.input)
      if (!argument) {
        const value = readSessionTemperature(sessionID)
        api.ui.toast({
          variant: "info",
          message:
            value === undefined
              ? "No session temperature override. " + HELP
              : `Session temperature: ${value.toFixed(1)}`,
        })
        return
      }

      if (argument.toLowerCase() === "reset") {
        clearSessionTemperature(sessionID)
        api.ui.toast({ variant: "success", message: "Session temperature reset." })
        return
      }

      const value = Number(argument)
      const temperature = clampTemperature(value)
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
      const unregister = keymap.registerLayer({
        commands: [command],
      })
      api.lifecycle.onDispose(unregister)
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
