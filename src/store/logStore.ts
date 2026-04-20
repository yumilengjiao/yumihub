import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: number
  level: LogLevel
  message: string
  time: string
}

interface LogStore {
  logs: LogEntry[]
  addLog: (entry: LogEntry) => void
  clear: () => void
}

let _id = 0

export const useLogStore = create<LogStore>()(
  immer(set => ({
    logs: [],

    addLog(entry) {
      set(s => {
        s.logs.push(entry)
        if (s.logs.length > 2000) s.logs.splice(0, s.logs.length - 2000)
      })
    },

    clear() {
      set(s => { s.logs = [] })
    },
  }))
)

export function nextLogId() {
  return _id++
}
