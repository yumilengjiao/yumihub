import useGameStore from '@/store/gameStore'
import useConfigStore from '@/store/configStore'
import { GameMeta } from '@/types/game'
import { useNavigate, useParams } from 'react-router'
import { motion, Variants } from 'framer-motion'
import {
  Play, ArrowLeft, Image as ImageIcon,
  CheckCircle2, Building2, RefreshCw, FolderOpen,
  DatabaseBackup, ArchiveRestore, Monitor, HardDrive, Save
} from 'lucide-react'
import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { Cmds } from '@/lib/enum'
import { Trans } from '@lingui/react/macro'
import { t } from "@lingui/core/macro"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { requestBangumiById } from '@/api/bangumiApi'
import { requestVNDBById } from '@/api/vndbApi'
import { transBangumiToGameMeta, transVNDBToGameMeta } from '@/lib/resolve'

// --- 动画配置 ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function GameDetail() {
  const { id } = useParams<{ id: string }>()
  const { getGameMetaById, setGameMeta } = useGameStore()
  const { updateConfig } = useConfigStore()
  const navigate = useNavigate()

  const game = getGameMetaById(id!)!;
  const [description, setDescription] = useState("暂无游戏介绍。点击此处添加描述，记录你的冒险点滴...");

  const [game, setGame] = useState<GameMeta>(getGameMetaById(id!)!)
  const [syncMode, setSyncMode] = useState<'bangumi' | 'vndb'>('bangumi')
  const [inputId, setInputId] = useState('')

  useEffect(() => {
    async function getGame() {
      try {
        const gameInfo = await invoke<GameMeta>(Cmds.GET_GAME_META, { id: id })
        setGame(gameInfo)
      } catch (error) { console.error(error) }
    }
    getGame()
  }, [id])

  const backupArchive = async () => {
    const promise = invoke(Cmds.BACKUP_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: t`正在备份存档...`,
      success: t`存档备份完毕`,
      error: (err: any) => t`备份失败: ` + (err.details || '未知错误')
    })
  }

  const restoreGameArchive = () => {
    const promise = invoke(Cmds.RESTORE_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: t`正在恢复存档...`,
      success: t`存档恢复完毕`,
      error: (err: any) => t`恢复失败: ` + (err.details || '未知错误')
    })
  }

  const handleSync = async () => {
    if (!inputId) return toast.error(t`请输入 ID`)
    const currentMode = syncMode
    const token = config.auth.bangumiToken
    const promise = currentMode === 'bangumi' ? requestBangumiById(inputId, token) : requestVNDBById(inputId)

    toast.promise(promise, {
      loading: t`正在同步...`,
      success: (newData: any) => { // 先用 any 接收
        // 校验是否为空
        if (!newData) {
          throw new Error("未找到对应数据")
        }

        let updatedData: GameMeta

        // 直接判断发起请求时用的模式
        if (currentMode === 'bangumi') {
          console.log("处理 Bangumi 数据")
          updatedData = transBangumiToGameMeta(game, newData)
        } else {
          console.log("处理 VNDB 数据")
          updatedData = transVNDBToGameMeta(game, newData)
        }
        updatedData.localBackground = ""
        updatedData.localCover = ""

        setGame(updatedData)
        setGameMeta(updatedData)

        return t`同步成功`
      },
      error: (err: any) => t`同步失败: ` + (err?.message || err)
    })
  }

  const pickPath = async (field: keyof GameMeta) => {
    const isFile = field === 'localBackground' || field === 'localCover' || field === 'absPath'
    const selected = await open({
      directory: !isImage,
      multiple: false,
      defaultPath: game[field] as string,
    })
    if (field === 'localBackground' || field === 'localCover') {
      await invoke(Cmds.AUTHORIZE_PATH_ACCESS, { path: selected })
    }
    if (selected && typeof selected === 'string') {
      updateField(field, selected)
    }
  }

  const updateField = <K extends keyof GameMeta>(field: K, value: GameMeta[K]) => {
    const updatedGame = { ...game, [field]: value }
    setGame(updatedGame)
    setGameMeta(updatedGame)

    if (field === 'isDisplayed') {
      updateConfig((prev) => {
        const currentOrder = prev.basic.gameDisplayOrder || []
        if (value === true) {
          if (!currentOrder.includes(game.id)) {
            prev.basic.gameDisplayOrder = [...currentOrder, game.id]
          }
        } else {
          prev.basic.gameDisplayOrder = currentOrder.filter(orderId => orderId !== game.id)
        }
      })
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="fixed inset-0 bg-[#f8f9fa] dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 overflow-y-auto z-50 scroll-smooth"
    >
      {/* 全局样式：隐藏数字输入框的箭头 */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none 
          margin: 0 
        }
        input[type=number] {
          -moz-appearance: textfield
        }
      `}</style>

      <div className="relative min-h-full pb-60">

        {/* 顶部横幅 */}
        <div className="relative h-125 w-full shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-[10px]"
            style={{ backgroundImage: `url(${game.local_background ? convertFileSrc(game.local_background) : game.background})` }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/50 to-[#fcfdfe]" />

          <div className="relative z-30 pt-24 px-16 max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-6 px-10 py-5 bg-white shadow-xl border border-slate-100 rounded-[2rem] text-slate-800 hover:text-emerald-600 transition-all active:scale-95"
            >
              <ArrowLeft size={32} strokeWidth={3} className="group-hover:-translate-x-3 transition-transform" />
              <span className="text-3xl font-[1000] tracking-tighter">返回库</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-20 max-w-7xl mx-auto px-16 -mt-32"
          >
            {/* 头部信息 */}
            <div className="flex flex-col md:flex-row gap-16 items-end">
              <div className="w-72 aspect-3/4 bg-white p-4 rounded-[3.5rem] shadow-2xl border border-white shrink-0">
                <img
                  src={game.local_cover ? convertFileSrc(game.local_cover) : game.cover}
                  className="w-full h-full object-cover rounded-[2.5rem]"
                />
              </div>

              <div className="flex-1 pb-4">
                <input
                  value={game.name}
                  onChange={(e) => setGameMeta({ ...game, name: e.target.value })}
                  className="bg-transparent text-7xl! font-[1000] mb-10 w-full border-none focus:ring-0 p-0 text-slate-900 tracking-tighter"
                />

                <div className="flex flex-wrap gap-8 items-center">
                  <button
                    onClick={() => invoke('launch_game', { path: game.absPath })}
                    className="flex items-center gap-6 px-16 py-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-[1000] text-3xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                  >
                    <Play fill="currentColor" size={32} /> 启动游戏
                  </button>

                  <div className="flex gap-12 bg-white border border-slate-100 px-12 py-5 rounded-[2rem] shadow-sm">
                    <StatItem label="已游玩" value={`${game.playTime}H`} color="text-emerald-500" />
                    <div className="w-px bg-slate-100 h-16" />
                    <StatItem label="占用空间" value={`${(game.size ? (game.size / 1024 / 1024).toFixed(1) : "0")}MB`} />
                  </div>
                </div>
              </div>
            </div>

            {/* 💡 核心改动：使用 items-stretch 确保两列高度对齐 */}
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">

              {/* 简介卡片 */}
              <div className="lg:col-span-2">
                <div className={CARD_STYLE}>
                  <h3 className="text-lg font-black text-slate-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Info size={24} className="text-emerald-500" /> 游戏简介
                  </h3>
                  {/* flex-1 确保输入框撑满卡片剩余高度 */}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full flex-1 bg-slate-50 border-none rounded-2xl p-8 text-2xl text-slate-600 leading-relaxed resize-none outline-none focus:ring-1 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {/* 系统信息卡片 */}
              <div className="lg:col-span-1">
                <div className={CARD_STYLE}>
                  <h4 className="text-lg font-black text-slate-400 uppercase mb-8 tracking-[0.2em]">系统信息</h4>
                  <div className="space-y-12">
                    <InfoItem label="最后运行时间" value={game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleString() : "从未启动"} icon={<Clock size={20} />} />
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><HardDrive size={20} /> 启动路径</p>
                      <p onClick={() => pickPath('absPath')} className="text-sm font-mono bg-slate-50 p-5 rounded-xl border border-slate-100 break-all cursor-pointer hover:bg-white transition-all text-slate-500 leading-normal">
                        {game.absPath}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部配置项 */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className={CARD_STYLE}>
                  <p className="text-sm font-black text-slate-400 uppercase mb-6 flex items-center gap-3"><Save size={24} /> 存档目录</p>
                  <div onClick={() => pickPath('saveDataPath')} className={INPUT_STYLE}>
                    <span className="text-xl font-mono text-slate-500 truncate pr-6">{game.saveDataPath || "点击配置路径..."}</span>
                    <FolderOpen size={28} className="text-emerald-500" />
                  </div>
                </div>
                <div className={CARD_STYLE}>
                  <p className="text-sm font-black text-slate-400 uppercase mb-6 flex items-center gap-3"><ImageIcon size={24} /> 自定义背景</p>
                  <div onClick={() => pickPath('background')} className={INPUT_STYLE}>
                    <span className="text-xl font-mono text-slate-500 truncate pr-6">{game.background || "默认图片..."}</span>
                    <ImageIcon size={28} className="text-emerald-500" />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// --- 辅助组件 ---

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-4xl font-[1000] font-mono text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  )
}

// 子组件保持不变
function StatItem({ label, value, color = "text-slate-800" }: { label: string, value: string, color?: string }) {
  return (
    <div className="text-center min-w-25">
      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">{label}</p>
      <p className={`text-4xl font-[1000] font-mono ${color}`}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-slate-400">
        {icon} <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-[1000] text-slate-800 ml-8 leading-none">{value}</p>
    </div>
  )
}
