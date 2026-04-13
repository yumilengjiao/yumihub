import { Cmds } from "@/lib/enum"
import { Companion } from "@/types/companion"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface CompanionStore {
  companions: Companion[]
  fetchCompanions: () => Promise<void>
  updateCompanions: (companions: Companion[]) => Promise<void>
}

const useCompanionStore = create<CompanionStore>()(
  immer((set) => ({
    companions: [],

    async fetchCompanions() {
      const data = await invoke<Companion[]>(Cmds.GET_COMPANIONS)
      set(s => { s.companions = data })
    },

    async updateCompanions(companions) {
      set(s => { s.companions = companions })
      await invoke(Cmds.UPDATE_COMPANIONS, { companions })
    },
  }))
)

export default useCompanionStore
