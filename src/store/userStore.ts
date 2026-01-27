import { User } from "@/types/user"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface UserStore {
  user: User | null

  /**
   * 初始化设置用户数据
   * @param user 初始化从数据库查的数据
   */
  setUser: (user: User) => void

  /**
   * 更新并且更新数据库
   * @param user 要更新的用户数据
   */
  updateUser: (user: User) => void
}

const useUserStore = create<UserStore>()(
  immer((set) => ({
    user: null,
    setUser: (user) => {
      set(state => {
        state.user = user
      })
    },
    updateUser: (user) => {
      set(state => {
        state.user = user
      })
      invoke("update_user_info", {
        user: user
      })
    }
  }))
)

export default useUserStore
