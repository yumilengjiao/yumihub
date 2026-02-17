import { cn } from "@/lib/utils"
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"
import useUserStore from "@/store/userStore"
import { convertFileSrc } from "@tauri-apps/api/core"
import { useMemo } from "react"
import { ThemeComponentProps } from "@/types/node"

export const Avatar = ({ node }: ThemeComponentProps) => {
  const { user } = useUserStore()

  const {
    disableHover = false,
    shape = "rounded-full",
    size = 64,
    paddingY = 16,
    // 注意：不再从这里解构 start/span 用于 grid 布局，防止和 style 冲突
  } = node.props || {}

  const displayAvatar = useMemo(() => {
    const avatarPath = user?.avatar
    if (!avatarPath) return defaultAvatar
    if (avatarPath.startsWith("http")) return avatarPath
    try {
      return convertFileSrc(avatarPath)
    } catch (e) {
      return defaultAvatar
    }
  }, [user?.avatar])

  return (
    <div
      // min-w-0 / min-h-0 是 Grid/Flex 子项防止被内容撑破的关键
      className={cn(
        "w-full h-full flex items-center justify-center shrink-0 min-w-0 min-h-0",
        node.className
      )}
      style={{
        // 既然后端算好了 grid-row，这里直接用，不再画蛇添足
        ...node.style,

        // 如果 node.style 里没有 padding，才使用默认 paddingY
        paddingTop: node.style?.paddingTop || `${paddingY}px`,
        paddingBottom: node.style?.paddingBottom || `${paddingY}px`,
      }}
    >
      <div
        // 强制锁死尺寸，不受外界 Grid 拉伸影响
        className={cn(
          "relative overflow-hidden bg-zinc-200 shadow-inner shrink-0",
          "ring-4 ring-white/50",
          shape
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          // 彻底锁死宽高的四道金牌，防止变形
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
        }}
      >
        <div
          className={cn(
            "h-full w-full bg-cover bg-center transition-transform duration-700",
            !disableHover && "hover:scale-110"
          )}
          style={{ backgroundImage: `url(${displayAvatar})` }}
        />
      </div>
    </div>
  )
}
