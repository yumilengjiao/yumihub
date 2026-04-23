import { useState, useEffect, useCallback } from 'react'
import { fetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseNotes: string
}
export function useUpdateChecker() {
  const [checking, setChecking] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const checkUpdate = useCallback(async () => {
    setChecking(true)
    try {
      const current = await getVersion()
      const res = await fetch(
        'https://api.github.com/repos/yumilengjiao/yumihub/releases/latest',
        { method: 'GET', headers: { 'User-Agent': 'YumiHub-UpdateChecker' } }
      )
      // 1. 优先检查 HTTP 状态码，处理 404 (无Release) 和 403 (限流) 等情况
      if (!res.ok) {
        console.warn(`检查更新失败: GitHub API 返回状态码 ${res.status}`)
        return
      }
      const data = await res.json()
      // 2. 运行时校验关键数据是否存在，避免 undefined.replace 报错
      if (!data || !data.tag_name) {
        console.warn('检查更新失败: 返回的数据结构异常，缺少 tag_name')
        return
      }
      const latest = data.tag_name.replace(/^v/, '')
      const hasUpdate = compareVersions(latest, current) > 0
      setUpdateInfo({
        hasUpdate,
        currentVersion: current,
        latestVersion: latest,
        releaseUrl: data.html_url || '',
        releaseNotes: data.body || '',
      })
      setLastChecked(new Date())
    } catch (e) {
      console.error('检查更新失败:', e)
    } finally {
      setChecking(false)
    }
  }, [])
  useEffect(() => { checkUpdate() }, [checkUpdate]) // 建议补全依赖项，消除 ESLint 警告
  return { checking, updateInfo, lastChecked, checkUpdate }
}
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
