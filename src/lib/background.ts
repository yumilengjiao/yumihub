import { convertFileSrc } from "@tauri-apps/api/core"
import type { BackgroundCrop } from "@/types/config"

const FULL_CROP: BackgroundCrop = { x: 0, y: 0, width: 1, height: 1 }

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function normalizeBackgroundCrop(crop?: BackgroundCrop | null): BackgroundCrop {
  if (!crop) return FULL_CROP

  const width = Math.min(1, Math.max(0.01, crop.width))
  const height = Math.min(1, Math.max(0.01, crop.height))
  const x = Math.min(1 - width, clamp01(crop.x))
  const y = Math.min(1 - height, clamp01(crop.y))

  return { x, y, width, height }
}

export function createBackgroundImageStyle(
  path: string,
  crop?: BackgroundCrop | null,
): React.CSSProperties {
  const normalized = normalizeBackgroundCrop(crop)
  const isFull =
    normalized.x === 0 &&
    normalized.y === 0 &&
    normalized.width === 1 &&
    normalized.height === 1

  if (isFull) {
    return {
      backgroundImage: `url("${convertFileSrc(path)}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }
  }

  const x = normalized.width >= 1 ? 50 : (normalized.x / (1 - normalized.width)) * 100
  const y = normalized.height >= 1 ? 50 : (normalized.y / (1 - normalized.height)) * 100

  return {
    backgroundImage: `url("${convertFileSrc(path)}")`,
    backgroundSize: `${100 / normalized.width}% ${100 / normalized.height}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: "no-repeat",
  }
}
