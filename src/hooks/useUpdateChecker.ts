import { useState, useEffect, useCallback } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { toast } from 'sonner'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'latest'
  | 'downloading'
  | 'installing'
  | 'ready'
  | 'error'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseNotes: string
  releaseDate?: string
}

export interface UpdateProgress {
  downloaded: number
  total?: number
  percent?: number
}

interface UpdateCheckerOptions {
  autoCheck?: boolean
  notify?: boolean
}

interface UpdateSnapshot {
  checking: boolean
  installing: boolean
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  lastChecked: Date | null
  progress: UpdateProgress | null
  error: string | null
}

const initialSnapshot: UpdateSnapshot = {
  checking: false,
  installing: false,
  status: 'idle',
  updateInfo: null,
  lastChecked: null,
  progress: null,
  error: null,
}

let snapshot: UpdateSnapshot = initialSnapshot
let cachedUpdate: Update | null = null
let inFlightCheck: Promise<UpdateInfo | null> | null = null
let inFlightInstall: Promise<void> | null = null

const listeners = new Set<() => void>()

export function useUpdateChecker(options: UpdateCheckerOptions = {}) {
  const { autoCheck = false, notify = false } = options
  const [state, setState] = useState(snapshot)

  useEffect(() => {
    const listener = () => setState(snapshot)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const checkUpdate = useCallback(async () => {
    try {
      const info = await checkForUpdates({ notify })
      return info
    } catch (e) {
      console.error('检查更新失败:', e)
      return null
    }
  }, [notify])

  const installUpdate = useCallback(async () => {
    try {
      await downloadAndInstallUpdate()
    } catch (e) {
      console.error('安装更新失败:', e)
    }
  }, [])

  useEffect(() => {
    if (autoCheck) {
      checkUpdate()
    }
  }, [autoCheck, checkUpdate])

  return {
    ...state,
    checkUpdate,
    installUpdate,
  }
}

async function checkForUpdates({ notify = false }: { notify?: boolean } = {}): Promise<UpdateInfo | null> {
  if (inFlightCheck) return inFlightCheck

  inFlightCheck = doCheckForUpdates({ notify }).finally(() => {
    inFlightCheck = null
  })

  return inFlightCheck
}

async function doCheckForUpdates({ notify }: { notify?: boolean }): Promise<UpdateInfo | null> {
  patchSnapshot({
    checking: true,
    status: 'checking',
    error: null,
  })

  try {
    const currentVersion = await getVersion()
    const update = await check()
    const info: UpdateInfo = update
      ? {
          hasUpdate: true,
          currentVersion: update.currentVersion || currentVersion,
          latestVersion: update.version,
          releaseNotes: update.body || '',
          releaseDate: update.date,
        }
      : {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseNotes: '',
        }

    cachedUpdate = update
    patchSnapshot({
      checking: false,
      status: update ? 'available' : 'latest',
      updateInfo: info,
      lastChecked: new Date(),
      progress: null,
    })

    if (notify && update) {
      toast.info(`发现新版本 v${update.version}`, {
        id: 'app-update-available',
        description: '可在设置页下载并安装，安装完成后会自动重启。',
        duration: 10000,
        dismissible: true,
      })
    }

    return info
  } catch (e) {
    const message = normalizeError(e)
    patchSnapshot({
      checking: false,
      status: 'error',
      error: message,
    })
    if (notify) toast.error('检查更新失败', { description: message })
    throw e
  }
}

async function downloadAndInstallUpdate(): Promise<void> {
  if (inFlightInstall) return inFlightInstall

  inFlightInstall = doDownloadAndInstallUpdate().finally(() => {
    inFlightInstall = null
  })

  return inFlightInstall
}

async function doDownloadAndInstallUpdate(): Promise<void> {
  try {
    const update = cachedUpdate ?? await ensureUpdate()
    if (!update) {
      toast.info('当前已是最新版本')
      return
    }

    let downloaded = 0
    let total: number | undefined

    patchSnapshot({
      installing: true,
      status: 'downloading',
      progress: { downloaded: 0 },
      error: null,
    })

    await update.downloadAndInstall((event: DownloadEvent) => {
      if (event.event === 'Started') {
        downloaded = 0
        total = event.data.contentLength
        patchSnapshot({
          status: 'downloading',
          progress: toProgress(downloaded, total),
        })
      }

      if (event.event === 'Progress') {
        downloaded += event.data.chunkLength
        patchSnapshot({
          status: 'downloading',
          progress: toProgress(downloaded, total),
        })
      }

      if (event.event === 'Finished') {
        patchSnapshot({
          status: 'installing',
          progress: toProgress(total ?? downloaded, total),
        })
      }
    })

    patchSnapshot({
      installing: false,
      status: 'ready',
      progress: toProgress(total ?? downloaded, total),
    })
    toast.success('更新安装完成，正在重启')

    await relaunch()
  } catch (e) {
    const message = normalizeError(e)
    patchSnapshot({
      installing: false,
      status: 'error',
      error: message,
    })
    toast.error('安装更新失败', { description: message })
    throw e
  }
}

async function ensureUpdate(): Promise<Update | null> {
  await checkForUpdates()
  return cachedUpdate
}

function patchSnapshot(patch: Partial<UpdateSnapshot>) {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach(listener => listener())
}

function toProgress(downloaded: number, total?: number): UpdateProgress {
  const percent = total && total > 0
    ? Math.min(100, Math.round((downloaded / total) * 100))
    : undefined

  return { downloaded, total, percent }
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}
