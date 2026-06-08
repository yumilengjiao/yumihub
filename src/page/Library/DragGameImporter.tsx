import { useEffect, useRef, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { AnimatePresence, motion } from "framer-motion"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { t } from "@lingui/core/macro"
import { Cmds } from "@/lib/enum"
import BigPendingCard from "./BigPendingCard"
import PendingCard from "./PendingCard"

type PathKind = {
  path: string
  kind: "file" | "directory" | "unknown"
}

export default function DragGameImporter() {
  const [isDragging, setIsDragging] = useState(false)
  const [singleGameBootPath, setSingleGameBootPath] = useState("")
  const [batchGamePaths, setBatchGamePaths] = useState<string[]>([])
  const [showSingleImport, setShowSingleImport] = useState(false)
  const [showBatchImport, setShowBatchImport] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let unlisten: (() => void) | undefined
    let disposed = false

    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }

    const hideOverlay = () => {
      clearHideTimer()
      hideTimerRef.current = setTimeout(() => setIsDragging(false), 80)
    }

    const classifyAndImport = async (paths: string[]) => {
      const uniquePaths = Array.from(new Set(paths)).filter(Boolean)
      if (uniquePaths.length === 0) return

      try {
        const pathKinds = await invoke<PathKind[]>(Cmds.GET_PATH_KINDS, { paths: uniquePaths })
        const directories = pathKinds.filter(item => item.kind === "directory").map(item => item.path)
        const files = pathKinds.filter(item => item.kind === "file").map(item => item.path)
        const unknownCount = pathKinds.length - directories.length - files.length

        if (unknownCount > 0) {
          toast.warning(t`有 ${unknownCount} 个拖入项目无法识别，已跳过`)
        }

        if (directories.length === 0 && files.length === 1) {
          setBatchGamePaths([])
          setShowBatchImport(false)
          setSingleGameBootPath(files[0])
          setShowSingleImport(true)
          return
        }

        const importPaths = [...directories, ...files]
        if (importPaths.length === 0) {
          toast.error(t`没有可导入的游戏路径`)
          return
        }

        setShowSingleImport(false)
        setBatchGamePaths(importPaths)
        setShowBatchImport(true)
      } catch (error) {
        console.error("拖拽导入失败:", error)
        toast.error(t`拖拽导入失败`)
      }
    }

    getCurrentWebview()
      .onDragDropEvent(async event => {
        const payload = event.payload

        if (payload.type === "enter" || payload.type === "over") {
          clearHideTimer()
          setIsDragging(true)
          return
        }

        if (payload.type === "drop") {
          hideOverlay()
          await classifyAndImport(payload.paths)
          return
        }

        hideOverlay()
      })
      .then(fn => {
        if (disposed) {
          fn()
        } else {
          unlisten = fn
        }
      })
      .catch(error => {
        console.error("拖拽监听初始化失败:", error)
      })

    return () => {
      disposed = true
      clearHideTimer()
      unlisten?.()
    }
  }, [])

  return (
    <>
      {showSingleImport && (
        <BigPendingCard
          absPath={singleGameBootPath}
          onCancel={() => setShowSingleImport(false)}
        />
      )}

      {showBatchImport && (
        <PendingCard
          pathList={batchGamePaths}
          onCancel={() => setShowBatchImport(false)}
          onConfirmAll={() => setShowBatchImport(false)}
        />
      )}

      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center backdrop-blur-2xl"
            style={{
              backgroundColor: "color-mix(in oklch, var(--background) 76%, transparent)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="flex h-44 w-44 items-center justify-center rounded-full border shadow-2xl"
              style={{
                backgroundColor: "color-mix(in oklch, var(--card) 82%, transparent)",
                borderColor: "color-mix(in oklch, var(--primary) 32%, transparent)",
                boxShadow: "0 28px 90px color-mix(in oklch, var(--foreground) 18%, transparent)",
              }}
            >
              <Upload className="h-24 w-24 text-primary" strokeWidth={1.8} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
