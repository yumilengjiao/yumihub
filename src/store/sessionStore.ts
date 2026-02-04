import { Cmds } from "@/lib/enum";
import { PlaySession } from "@/types/session";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface gameSesstionParam {
  sessions: PlaySession[],
  fetchSessions: (year?: string) => Promise<void>,
  getSessions: () => PlaySession[]
}

const useSessionStore = create<gameSesstionParam>()(immer((set, get) => ({
  sessions: [],
  async fetchSessions(year?: string) {
    const current_year = new Date().getFullYear().toString()
    const sessions = await invoke<PlaySession[]>(Cmds.GET_SESSIONS_BY_YEAR, { year: year ?? current_year })
    set((state) => {
      state.sessions = sessions
    })
  },
  getSessions() {
    return get().sessions
  },
})))


export default useSessionStore 
