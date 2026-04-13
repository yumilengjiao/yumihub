import { ArchiveEntry } from "@/types/game"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 从绝对路径获取父目录 */
export function getParentDir(absPath: string) {
  const lastSlash = Math.max(absPath.lastIndexOf("/"), absPath.lastIndexOf("\\"))
  return lastSlash !== -1 ? absPath.slice(0, lastSlash) : "."
}

/**
 * 分析压缩包结构，提取公共根目录
 * 返回干净的条目列表供显示
 */
export function analyzeArchiveStructure(entries: ArchiveEntry[]) {
  if (!entries || entries.length === 0) return { rootName: "", cleanedEntries: [] }

  const paths = entries.map(e => ({
    ...e,
    normalized: e.name.replace(/\\/g, "/").replace(/\/$/, ""),
  }))

  const firstPath = paths[0].normalized
  const firstSlashIndex = firstPath.indexOf("/")

  if (firstSlashIndex === -1) {
    return { rootName: "", cleanedEntries: entries }
  }

  const candidateRoot = firstPath.substring(0, firstSlashIndex)
  const isCommonRoot = paths.every(
    p => p.normalized === candidateRoot || p.normalized.startsWith(candidateRoot + "/")
  )

  if (isCommonRoot) {
    const prefixRegex = new RegExp(`^${candidateRoot}[/\\\\]?`)
    const cleanedEntries = paths
      .map(e => ({ ...e, name: e.name.replace(prefixRegex, "") }))
      .filter(e => e.name.trim() !== "" && e.name !== "/" && e.name !== "\\")
    return { rootName: candidateRoot, cleanedEntries }
  }

  return { rootName: "", cleanedEntries: entries }
}

/** 格式化游玩时间（分钟 → 小时分钟） */
export function formatPlayTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
