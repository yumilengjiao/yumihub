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
  const lastSlash = Math.max(absPath.lastIndexOf("/"), absPath.lastIndexOf("\\"));

  // 如果没找到斜杠（比如就在当前目录），则 dir 为空或当前点
  const dir = lastSlash !== -1 ? absPath.slice(0, lastSlash) : ".";
  return dir
}
