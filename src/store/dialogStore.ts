import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Options {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm?: () => void
  onCancel?: () => void
}

interface ConfirmState {
  isOpen: boolean
  options: Options
  confirm: (options: Options) => void
  close: () => void
}

const useDialogStore = create<ConfirmState>()(
  immer((set) => ({
    isOpen: false,
    options: { title: "" },

    confirm: (options) =>
      set((state) => {
        state.isOpen = true
        state.options = {
          confirmText: "确认",
          cancelText: "取消",
          variant: "default",
          ...options,
        }
      }),

    close: () =>
      set((state) => {
        state.isOpen = false
      }),
  }))
)

export default useDialogStore
