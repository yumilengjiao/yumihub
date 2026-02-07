import { Cmds } from "@/lib/enum"
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
  setUser: (fields: Partial<User>) => void
}

const useUserStore = create<UserStore>()(
  immer((set, get) => ({
    user: null,

    setUser: (fields) => {
      set((state) => {
        if (state.user) {
          Object.assign(state.user, fields);
        } else {
          state.user = fields as User;
        }
      });

      const updatedUser = get().user;
      if (updatedUser) {
        invoke(Cmds.UPDATE_USER_INFO, {
          account: updatedUser,
        }).catch((err) => {
          console.error("同步用户信息失败:", err);
        });
      }
    },
  }))
)

export default useUserStore
