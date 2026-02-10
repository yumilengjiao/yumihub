import { ArchiveEntry } from "@/types/game"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 该函数由shadcn自动生成,使用与clsx相同
 * @param 输入的css类名集合
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 从绝对路径(启动路径)获取父目录
 * @param 启动路径
 * @returns 游戏父目录
 */
export function getParentDir(absPath: string) {
  const lastSlash = Math.max(absPath.lastIndexOf("/"), absPath.lastIndexOf("\\"))

  // 如果没找到斜杠（比如就在当前目录），则 dir 为空或当前点
  const dir = lastSlash !== -1 ? absPath.slice(0, lastSlash) : "."
  return dir
}

/**
 * 压缩包结构分析
 * 自动提取所有文件的公共父目录
 * 剔除那个“纯目录”条目（即名字只有前缀、没有子项的条目）
 * 返回干净的列表供显示
 * @param entries - 条目项
 * @returns 压缩包结构信息
 */
export const analyzeArchiveStructure = (entries: ArchiveEntry[]) => {
  if (!entries || entries.length === 0) return { rootName: "", cleanedEntries: [] }

  // 统一路径分隔符
  const paths = entries.map(e => ({
    ...e,
    normalized: e.name.replace(/\\/g, '/').replace(/\/$/, '') // 统一去掉末尾的反斜杠
  }))

  // 提取第一个条目的第一级目录
  const firstPath = paths[0].normalized
  const firstSlashIndex = firstPath.indexOf('/')

  // 如果第一个条目完全没有斜杠，说明它本身就在根目录，直接判定为散件
  if (firstSlashIndex === -1) {
    return { rootName: "", cleanedEntries: entries }
  }

  const candidateRoot = firstPath.substring(0, firstSlashIndex)

  // 3. 修正后的检查逻辑：
  // 必须满足：要么是以 candidateRoot/ 开头，要么本身就是 candidateRoot
  const isCommonRoot = paths.every(p =>
    p.normalized === candidateRoot || p.normalized.startsWith(candidateRoot + '/')
  )

  if (isCommonRoot) {
    const cleanedEntries = paths
      .map(e => {
        // 使用正则安全地切掉前缀和紧跟的斜杠
        // 比如 "アマカノ/config/startup.xml" -> "config/startup.xml"
        const prefixRegex = new RegExp(`^${candidateRoot}[/\\\\]?`)
        const newName = e.name.replace(prefixRegex, '')
        return { ...e, name: newName }
      })
      // 过滤掉切完后变为空字符串的项（即父目录本身）
      .filter(e => e.name.trim() !== "" && e.name !== "/" && e.name !== "\\")

    return { rootName: candidateRoot, cleanedEntries }
  }

  return { rootName: "", cleanedEntries: entries }
}
