import { Cmds } from "@/lib/enum"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface CompaionParams {
  companions: Companion[],
  fetchCompanions: () => Promise<void>,
  updateCompanions: (conpaions: Companion[]) => Promise<void>
}

const useCompanionStore = create<CompaionParams>()(immer((set) => ({
  companions: [],
  async fetchCompanions() {
    const compaions = await invoke<Companion[]>(Cmds.GET_COMPAIONS)
    set(state => {
      state.companions = compaions
    })
  },
  async updateCompanions(companions) {
    set(state => {
      state.companions = companions
    })
    await invoke(Cmds.UPDATE_COMPAIONS, { companions: companions })
  },
})))

useCompanionStore.getState().fetchCompanions()

export default useCompanionStore
