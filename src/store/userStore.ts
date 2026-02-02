import { User } from "@/types/user"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface UserStore {
  user: User | null

  /**
   * 设置/更新并且更新数据库
   * @param user 要更新的用户数据
   */
  setUser: (user: User) => void
}

const useUserStore = create<UserStore>()(
  immer((set) => ({
    user: null,
    setUser: (user) => {
      set(state => {
        state.user = user
      })
      invoke("update_user_info", {
        account: user
      })
    }
  }))
)

export default useUserStore
