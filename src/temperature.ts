import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { Plugin, PluginModule } from "@opencode-ai/plugin"

function clampTemperature(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined
  return Math.min(2, Math.max(0, value))
}

export function projectStateFile(directory: string): string {
  return join(directory, ".opencode", "temperature.json")
}

export function globalStateFile(): string {
  const configRoot = process.env.XDG_CONFIG_HOME || join(homedir(), ".config")
  return join(configRoot, "opencode", "temperature.json")
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

export function readTemperature(directory: string, modelKey: string): number | undefined {
  return readModelValue(projectStateFile(directory), modelKey) ?? readModelValue(globalStateFile(), modelKey)
}

const server: Plugin = async ({ directory }) => {
  return {
    "chat.params": async (input, output) => {
      if (input.model.capabilities.temperature === false) return
      const modelKey = `${input.model.providerID}/${input.model.id}`
      const value = readTemperature(directory, modelKey)
      if (value !== undefined) output.temperature = value
    },
  }
}

export default {
  id: "temperature.slider",
  server,
} satisfies PluginModule & { id: string }