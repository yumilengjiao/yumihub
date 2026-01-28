import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 该函数由shadcn自动生成,使用与clsx相同
 * @param 输入的css类名集合
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
