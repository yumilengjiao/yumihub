import React, { useMemo } from 'react'
import {
  File,
  Folder,
  X,
  ChevronRight,
  FolderOpen,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { open } from '@tauri-apps/plugin-dialog'
import { cn } from "@/lib/utils"
import { Trans } from '@lingui/react/macro'

interface ArchivePreviewDialogProps {
  isOpen: boolean;
  path: string;                // 压缩包路径
  entries: any[];              // 清单数组
  displayPath: string;         // 目的地路径 (config.storage.galRootDir)
  suggestedFolderName: string;
  setCustomPath: (p: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const ArchivePreviewDialog: React.FC<ArchivePreviewDialogProps> = ({
  isOpen,
  entries = [],
  displayPath,
  suggestedFolderName,
  setCustomPath,
  onClose,
  onConfirm
}) => {

  // 1. 核心判定逻辑：计算是否存在唯一的“根文件夹壳”
  const rootDir = useMemo(() => {
    if (!entries || entries.length === 0) return null
    try {
      const firstPath = entries[0].name.replace(/\\/g, '/')
      const parts = firstPath.split('/')
      if (parts.length <= 1) return null

      const root = parts[0]
      // 检查是否包内所有条目都以此根目录开头
      const isConsistent = entries.every(e => {
        const p = e.name.replace(/\\/g, '/')
        return p.startsWith(root + '/') || p === root
      })
      return isConsistent ? root : null
    } catch (e) {
      return null
    }
  }, [entries])

  // 2. 预览清单处理：如果存在 rootDir，则全量剥离该前缀
  const visibleEntries = useMemo(() => {
    if (!entries || entries.length === 0) return []

    return entries
      .map(e => {
        let name = e.name.replace(/\//g, '\\');

        // 如果有共同根目录前缀，彻底切掉它，实现扁平化展示
        if (rootDir) {
          const prefix = rootDir.replace(/\//g, '\\') + '\\';
          if (name.startsWith(prefix)) {
            name = name.substring(prefix.length);
          } else if (name === rootDir.replace(/\//g, '\\') || name === rootDir.replace(/\//g, '\\') + '\\') {
            // 过滤掉根文件夹条目本身，不显示孤零零的一个根目录
            return null;
          }
        }

        // 过滤掉处理后为空的情况
        if (!name) return null;

        return { ...e, name };
      })
      .filter(Boolean) as any[];
  }, [entries, rootDir])

  // 3. 最终展示路径拼接
  const visualFinalPath = useMemo(() => {
    if (!displayPath) return "未选择路径"
    const base = displayPath.replace(/[\\/]$/, "")
    const combined = `${base}\\${suggestedFolderName}`
    // 统一为 Windows 风格的反斜杠展示
    return combined.replace(/\//g, '\\').replace(/\\\\/g, '\\')
  }, [displayPath, suggestedFolderName])

  const handleSelectFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: "选择安装目的地" })
    if (selected && typeof selected === 'string') {
      setCustomPath(selected)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="relative w-full max-w-4xl bg-white shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
          >
            {/* Header */}
            <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">确认解压清单</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Files will be placed in the folder below</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 cursor-pointer">
                <X size={24} />
              </button>
            </div>

            {/* Path Selection */}
            <div className="px-10 py-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">解压至目的地</span>
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all cursor-pointer active:scale-95"
                >
                  <FolderOpen size={14} /> 更改目录
                </button>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm text-slate-600 shadow-inner break-all">
                {visualFinalPath}
              </div>
            </div>

            {/* File Manifest */}
            <div className="flex-1 overflow-hidden flex flex-col px-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  内容预览
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {visibleEntries.map((entry, i) => (
                  <div
                    key={i}
                    // 彻底移除点击交互，预览列表仅供观察，防止用户产生“进入”文件夹的错觉
                    className="flex items-center gap-4 px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent"
                  >
                    <div className={entry.isDir ? "text-blue-500" : "text-slate-400"}>
                      {entry.isDir ? (
                        <Folder size={18} fill="currentColor" fillOpacity={0.1} />
                      ) : (
                        <File size={18} />
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm font-bold text-slate-600">
                      {entry.name}
                    </span>
                  </div>
                ))}
                {visibleEntries.length === 0 && (
                  <div className="py-20 text-center text-slate-400 text-sm italic">
                    压缩包内容为空
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-slate-100 flex justify-end items-center gap-6">
              <button
                onClick={onClose}
                className="text-sm font-black text-slate-400 hover:text-slate-600 transition-colors cursor-pointer uppercase tracking-widest"
              >
                放弃
              </button>
              <button
                disabled={!displayPath}
                onClick={onConfirm}
                className={cn(
                  "px-8 py-5 rounded-2xl font-black text-sm transition-all flex items-center shadow-2xl gap-2",
                  displayPath
                    ? "bg-custom-600 text-white hover:bg-custom-600/80 cursor-pointer active:scale-95 shadow-slate-200"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <Trans>确认并开始解压</Trans>
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ArchivePreviewDialog;
