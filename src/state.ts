import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

const SESSION_STATE_VERSION = 1

export type SessionTemperatureState = {
  version: number
  sessions: Record<string, { temperature: number }>
}

export function clampTemperature(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined
  return Math.min(2, Math.max(0, value))
}

function configRoot(): string {
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config")
}

export function globalStateFile(): string {
  return join(configRoot(), "opencode", "temperature.json")
}
export function sessionStateFile(): string {
  return join(configRoot(), "opencode", "temperature-sessions.json")
}

function readState(file: string): SessionTemperatureState {
  try {
    if (!existsSync(file)) return { version: SESSION_STATE_VERSION, sessions: {} }
    const parsed = JSON.parse(readFileSync(file, "utf8")) as SessionTemperatureState
    if (!parsed || typeof parsed !== "object" || !parsed.sessions) {
      return { version: SESSION_STATE_VERSION, sessions: {} }
    }
    return { version: SESSION_STATE_VERSION, sessions: parsed.sessions }
  } catch {
    return { version: SESSION_STATE_VERSION, sessions: {} }
  }
}

function writeState(file: string, state: SessionTemperatureState): void {
  mkdirSync(dirname(file), { recursive: true })
  const temp = file + ".tmp"
  writeFileSync(temp, JSON.stringify(state, null, 2))
  renameSync(temp, file)
}
export function readSessionTemperature(sessionID: string): number | undefined {
  const value = readState(sessionStateFile()).sessions[sessionID]?.temperature
  return typeof value === "number" ? clampTemperature(value) : undefined
}

export function writeSessionTemperature(sessionID: string, value: number): number | undefined {
  const temperature = clampTemperature(value)
  if (temperature === undefined) return undefined
  const file = sessionStateFile()
  const state = readState(file)
  state.sessions[sessionID] = { temperature }
  writeState(file, state)
  return temperature
}

export function clearSessionTemperature(sessionID: string): void {
  const file = sessionStateFile()
  const state = readState(file)
  delete state.sessions[sessionID]
  if (Object.keys(state.sessions).length === 0) {
    try {
      unlinkSync(file)
    } catch {
      // already gone
    }
    return
  }
  writeState(file, state)
}
