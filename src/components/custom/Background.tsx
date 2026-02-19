import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { convertFileSrc } from '@tauri-apps/api/core'
import useGameStore from "@/store/gameStore"
import { ThemeNode } from "@/types/node"

export const Background = ({ node, children }: { node: ThemeNode; children?: React.ReactNode }) => {

  const {
    sourceType = 'static',
    sourceValue,
    overlayColor = "bg-transparent",
    opacity = 1,
    variant = 'none',
    ...restStyles
  } = node.props || {};

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

  // 这里的优先级：手动传入的 restStyles 必须能干掉 preset
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
    switch (sourceType) {
      case 'selectedGame':
        if (!selectedGame) return "";
        return selectedGame.localBackground
          ? convertFileSrc(selectedGame.localBackground)
          : selectedGame.background;

      case 'specifiedGame':
        if (!sourceValue) return "";
        const game = gameMetaList.find(g => g.id === sourceValue);
        return game?.localBackground
          ? convertFileSrc(game.localBackground)
          : game?.background;

      case 'none':
      default:
        return ""; // 什么都不返回
    }
  }, [sourceType, sourceValue, selectedGame, gameMetaList]);

  const [displayBgs, setDisplayBgs] = useState<{ url: string, key: number }[]>([]);
  useEffect(() => {
    // 只要 currentBgUrl 变了，就更新数组
    // 如果是空字符串（none 模式），数组变为空，旧图会触发 transition-opacity 淡出
    if (currentBgUrl) {
      setDisplayBgs([{ url: currentBgUrl, key: Date.now() }]);
    } else {
      setDisplayBgs([]);
    }
  }, [currentBgUrl]);

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden", variantPresets[variant]?.containerClass, node.className)}
      style={{ width: "100%", height: "100%", ...node.style }} // 基础宽高，具体的 style 给各层分发
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
            opacity: opacity,
            zIndex: 0
          }}
        />
      ))}

      {/* 遮罩/模糊层 (Z-1) - 只在这一层玩 mask */}
      <div
        className={cn("absolute inset-0 z-1 pointer-events-none", overlayColor)}
        style={finalOverlayStyle}
      />

      {/* 内容层 (Z-10) - 绝对高于模糊层，文字和海报永远清晰 */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
