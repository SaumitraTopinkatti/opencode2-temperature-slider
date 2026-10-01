import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Plugin, PluginModule } from "@opencode-ai/plugin"
import { clampTemperature, globalStateFile, readSessionTemperature, sessionStateFile } from "./state.js"

function projectStateFile(directory: string): string {
  return join(directory, ".opencode", "temperature.json")
}

function readModelValue(file: string, modelKey: string): number | undefined {
  try {
    if (!existsSync(file)) return undefined
    const parsed = JSON.parse(readFileSync(file, "utf8")) as {
      version?: number
      models?: Record<string, { temperature?: number }>
    }
    const value = Number(parsed?.models?.[modelKey]?.temperature)
    return clampTemperature(value)
  } catch {
    return undefined
  }
}
export function readTemperature(directory: string, modelKey: string, sessionID?: string): number | undefined {
  if (sessionID) {
    const sessionValue = readSessionTemperature(sessionID)
    if (sessionValue !== undefined) return sessionValue
  }
  return readModelValue(projectStateFile(directory), modelKey) ?? readModelValue(globalStateFile(), modelKey)
}

export { globalStateFile, sessionStateFile } from "./state.js"

const server: Plugin = async ({ directory }) => ({
  "chat.params": async (input, output) => {
    if (input.model.capabilities.temperature === false) return
    const modelKey = `${input.model.providerID}/${input.model.id}`
    const value = readTemperature(directory, modelKey, input.sessionID)
    if (value !== undefined) output.temperature = value
  },
})

export default {
  id: "temperature.control",
  server,
} satisfies PluginModule & { id: string }
