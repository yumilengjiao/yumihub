import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import { open } from "@tauri-apps/plugin-dialog"
import { X, Upload, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { createPortal } from "react-dom" // 关键：导入传送门

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackgroundSettingDialog({ isOpen, onClose }: Props) {
  const { config, updateConfig } = useConfigStore()
  const bgConfig = config.interface.globalBackground || { path: "", opacity: 1, blur: 0 }

  const handleSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    });
    if (selected && typeof selected === 'string') {
      updateConfig(d => {
        d.interface.globalBackground = { ...bgConfig, path: selected }
      })
    }
  };

  // 使用 Portal 将组件渲染到 body 上
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 对话框主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-50 dark:bg-zinc-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold tracking-tight">{t`设置全局背景`}</h3>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 图片路径 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t`背景图片`}</label>
                <div className="flex gap-2">
                  <div className="flex-1 truncate p-3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl text-sm italic">
                    {bgConfig.path || t`未选择图片...`}
                  </div>
                  <button onClick={handleSelectFile} className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                    <Upload size={18} />
                  </button>
                  {bgConfig.path && (
                    <button onClick={() => updateConfig(d => { d.interface.globalBackground!.path = "" })}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* 透明度 */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-zinc-500">{t`不透明度`}</label>
                  <span className="font-mono text-blue-500">{(bgConfig.opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0.1" max="1" step="0.01"
                  value={bgConfig.opacity}
                  onChange={(e) => updateConfig(d => { d.interface.globalBackground!.opacity = parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* 模糊度 */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <label className="text-zinc-500">{t`模糊程度`}</label>
                  <span className="font-mono text-blue-500">{bgConfig.blur}px</span>
                </div>
                <input
                  type="range" min="0" max="40" step="1"
                  value={bgConfig.blur}
                  onChange={(e) => updateConfig(d => { d.interface.globalBackground!.blur = parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 flex justify-end">
              <button onClick={onClose} className="px-8 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95">
                {t`完成`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body // 传送到 body
  );
}
