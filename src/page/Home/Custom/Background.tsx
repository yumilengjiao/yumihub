import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { convertFileSrc } from '@tauri-apps/api/core'
import useGameStore from "@/store/gameStore"
import { ThemeComponentProps } from "@/types/node"
import Surface from "@/layout/Surface"


export const Background: React.FC<ThemeComponentProps> = ({ node }) => {
  // 1. 获取 style 和 children
  // 既然没有 props，我们假设所有业务配置都放在 style 里，或者 node 本身的字段里
  const { style = {}, children } = node;

  // 2. 从 style 中提取配置 (全部强制转换为对应类型)
  // 业务逻辑参数
  const sourceType = (style.sourceType as 'selectedGame' | 'static' | 'specifiedGame') || 'selectedGame';
  const sourceValue = style.sourceValue as string;
  const overlayColor = (style.overlayColor as string) || "bg-transparent";

  // 视觉参数
  const blur = (style.blur as string) || "0px";
  const opacity = style.opacity !== undefined ? Number(style.opacity) : 1;

  const { selectedGame, gameMetaList } = useGameStore()

  // 3. 计算背景列表 (逻辑保持不变)
  const backgrounds = useMemo(() => {
    if (sourceType === 'selectedGame') {
      return gameMetaList.map(g => ({
        id: g.id,
        url: g.localBackground ? convertFileSrc(g.localBackground) : g.background,
        active: selectedGame?.id === g.id
      }))
    }

    if (sourceType === 'static' && sourceValue) {
      return [{ id: 'static', url: sourceValue, active: true }]
    }

    if (sourceType === 'specifiedGame' && sourceValue) {
      const game = gameMetaList.find(g => g.id === sourceValue)
      return [{
        id: 'spec',
        url: game?.localBackground ? convertFileSrc(game.localBackground) : game?.background,
        active: true
      }]
    }

    return []
  }, [sourceType, sourceValue, gameMetaList, selectedGame?.id])

  return (
    <div
      // 继承 node.className 确保它在 Grid/Flex 中的位置正确
      className={cn("relative w-full h-full overflow-hidden", node.className)}
      // 这里的 style 只保留布局相关的（比如 width/height/flex），过滤掉我们自定义的逻辑属性
      // 或者简单点直接全传，浏览器会自动忽略不认识的 style 属性
      style={{ ...style }}
    >
      {/* --- 背景层 --- */}
      {backgrounds.map((bg) => (
        <img
          key={bg.id}
          src={bg.url}
          alt=""
          decoding="async"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 pointer-events-none",
            bg.active ? "opacity-100" : "opacity-0"
          )}
          style={{
            // 这里的样式是给 img 元素的，不要混入外层的 style
            filter: `blur(${blur})`,
            opacity: bg.active ? opacity : 0,
            zIndex: 0
          }}
        />
      ))}

      {/* --- 遮罩层 --- */}
      <div className={cn("absolute inset-0 z-[1] pointer-events-none", overlayColor)} />

      {/* --- 内容容器 (关键) --- */}
      <div className="relative z-[2] w-full h-full">
        {children?.map((child) => (
          <Surface key={child.id} node={child} />
        ))}
      </div>
    </div>
  )
}
