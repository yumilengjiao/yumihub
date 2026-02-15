import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { convertFileSrc } from '@tauri-apps/api/core'
import useGameStore from "@/store/gameStore"
import { ThemeNode } from "@/types/node"

export const Background = ({ node, children }: { node: ThemeNode; children?: React.ReactNode }) => {
  const style = (node.style || {}) as any;

  // 1. 严格解构：提取控制参数，rest 剩下的是要注入到 style 的 CSS
  const {
    sourceType = 'selectedGame',
    sourceValue,
    overlayColor = "bg-transparent",
    blur = "0px",
    opacity = 1,
    variant = 'none',
    ...restStyles
  } = style;

  const selectedGame = useGameStore((state) => state.selectedGame);
  const gameMetaList = useGameStore((state) => state.gameMetaList);

  const variantPresets: Record<string, { overlay?: React.CSSProperties; bgClass?: string; containerClass?: string }> = {
    'bottom-blur': {
      overlay: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maskImage: 'linear-gradient(to top, black 0%, transparent 40%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 40%)',
      }
    },
    'vignette': {
      containerClass: "after:content-[''] after:absolute after:inset-0 after:shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"
    }
  };

  // 2. 这里的优先级：手动传入的 restStyles 必须能干掉 preset
  const finalOverlayStyle = useMemo(() => {
    const preset = variantPresets[variant]?.overlay || {};
    const manual: any = { ...restStyles };

    // 强制补全前缀，防止 Tauri 渲染失败
    if (manual.backdropFilter) manual.WebkitBackdropFilter = manual.backdropFilter;
    if (manual.maskImage) manual.WebkitMaskImage = manual.maskImage;

    return { ...preset, ...manual };
  }, [variant, restStyles]);

  // 图片处理
  const currentBgUrl = useMemo(() => {
    if (sourceType === 'selectedGame' && selectedGame) {
      return selectedGame.localBackground ? convertFileSrc(selectedGame.localBackground) : selectedGame.background;
    }
    if (sourceType === 'static' && sourceValue) return sourceValue;
    if (sourceType === 'specifiedGame' && sourceValue) {
      const game = gameMetaList.find(g => g.id === sourceValue);
      return game?.localBackground ? convertFileSrc(game.localBackground) : game?.background;
    }
    return "";
  }, [sourceType, sourceValue, selectedGame, gameMetaList]);

  const [displayBgs, setDisplayBgs] = useState<{ url: string, key: number }[]>([]);
  useEffect(() => {
    if (currentBgUrl) setDisplayBgs([{ url: currentBgUrl, key: Date.now() }]);
  }, [currentBgUrl]);

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden bg-black", variantPresets[variant]?.containerClass, node.className)}
      style={{ width: "100%", height: "100%" }} // 基础宽高，具体的 style 给各层分发
    >
      {/* 背景图层 (Z-0) - 永远全屏显示，不加 mask */}
      {displayBgs.map((bg) => (
        <div
          key={bg.key}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${bg.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${blur})`,
            opacity: opacity,
            zIndex: 0
          }}
        />
      ))}

      {/* 遮罩/模糊层 (Z-1) - 只在这一层玩 mask */}
      <div
        className={cn("absolute inset-0 z-[1] pointer-events-none", overlayColor)}
        style={finalOverlayStyle}
      />

      {/* 内容层 (Z-10) - 绝对高于模糊层，文字和海报永远清晰 */}
      <div className="relative z-[10] w-full h-full">
        {children}
      </div>
    </div>
  )
}
