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
      const data = await res.json() as {
        tag_name: string
        html_url: string
        body: string
      }
      const latest = data.tag_name.replace(/^v/, '')
      const hasUpdate = compareVersions(latest, current) > 0
      setUpdateInfo({
        hasUpdate,
        currentVersion: current,
        latestVersion: latest,
        releaseUrl: data.html_url,
        releaseNotes: data.body || '',
      })
      setLastChecked(new Date())
    } catch (e) {
      console.error('检查更新失败:', e)
    } finally {
      setChecking(false)
    }
  }, [])

  // 启动时检查一次
  useEffect(() => { checkUpdate() }, [])

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
