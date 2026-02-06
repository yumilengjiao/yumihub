import useGameStore from '@/store/gameStore';
import useConfigStore from '@/store/configStore';
import { GameMeta } from '@/types/game';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, FolderOpen, ArrowLeft,
  HardDrive, Clock, Info, Image as ImageIcon,
  CheckCircle2, Monitor, Building2,
  DatabaseBackup,
  ArchiveRestore
} from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useState } from 'react';
import { Cmds } from '@/lib/enum';
import { Trans } from '@lingui/react/macro';
import { t } from "@lingui/core/macro"
import { toast } from 'sonner';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const { getGameMetaById, setGameMeta } = useGameStore();
  const { updateConfig } = useConfigStore();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameMeta>(getGameMetaById(id!)!)

  const backupArchive = async () => {
    const promise = invoke(Cmds.BACKUP_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: '正在备份存档...',
      success: '存档备份完毕',
      error: (err: any) => ({
        message: '备份存档失败',
        description: err.details || '未知错误'
      })
    });
  }

  const restoreGameArchive = () => {
    const promise = invoke(Cmds.RESTORE_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: '正在恢复存档...',
      success: '存档恢复完毕',
      error: (err: any) => ({
        message: '恢复存档失败',
        description: err.details || '未知错误'
      })
    });
  }

  useEffect(() => {
    async function getGame() {
      try {
        const gameInfo = await invoke<GameMeta>(Cmds.GET_GAME_META, { id: id })
        setGame(gameInfo)
      } catch (error) {
        console.error(error)
      }
    }
    getGame()
  }, [])

  // 这里的 CARD_STYLE 和 INPUT_STYLE 增加了暗色模式适配
  const CARD_STYLE = "bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-700 p-10 flex flex-col w-full h-full";
  const INPUT_STYLE = "flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-700 p-6 rounded-2xl hover:bg-white dark:hover:bg-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group";

  const pickPath = async (field: keyof GameMeta) => {
    const isFile = field === 'background' || field === 'cover' || field === 'absPath';
    const selected = await open({
      directory: !isFile,
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      setGameMeta({ ...game, [field]: selected });
      setGame({ ...game, [field]: selected })
    }
  }

  const updateField = <K extends keyof GameMeta>(field: K, value: GameMeta[K]) => {
    const updatedGame = { ...game, [field]: value };
    setGame(updatedGame);
    setGameMeta(updatedGame);
    if (field === 'isDisplayed') {
      updateConfig((prev) => {
        const currentOrder = prev.basic.gameDisplayOrder || [];
        if (value === true) {
          if (!currentOrder.includes(game.id)) {
            prev.basic.gameDisplayOrder = [...currentOrder, game.id];
          }
        } else {
          prev.basic.gameDisplayOrder = currentOrder.filter(orderId => orderId !== game.id);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fcfdfe] dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 overflow-y-auto z-50">
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="relative min-h-full pb-60">
        <div className="relative h-125 w-full shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-[10px]"
            style={{ backgroundImage: `url(${game.localBackground ? convertFileSrc(game.localBackground) : game.background})` }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/50 dark:via-zinc-950/50 to-[#fcfdfe] dark:to-zinc-950" />
          <div className="relative z-30 pt-24 px-16 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="group flex items-center gap-6 px-10 py-5 bg-white dark:bg-zinc-800 shadow-xl border border-slate-100 dark:border-zinc-700 rounded-[2rem] text-slate-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95">
              <ArrowLeft size={32} strokeWidth={3} className="group-hover:-translate-x-3 transition-transform" />
              <span className="text-3xl font-[1000] tracking-tighter"><Trans>返回库</Trans></span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="relative z-20 max-w-7xl mx-auto px-16 -mt-32">

            <div className="flex flex-col md:flex-row gap-16 items-end">
              <div className="relative w-72 aspect-3/4 bg-white dark:bg-zinc-800 p-4 rounded-[3.5rem] shadow-2xl border border-white dark:border-zinc-700 shrink-0 group">
                <img src={game.localCover ? convertFileSrc(game.localCover) : game.cover} className="w-full h-full object-cover rounded-[2.5rem]" />
                {game.isPassed && (
                  <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-3 rounded-full shadow-lg border-4 border-white dark:border-zinc-800 z-40">
                    <CheckCircle2 size={32} fill="currentColor" className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <input
                  value={game.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="bg-transparent text-7xl! font-[1000] mb-4 w-full border-none focus:ring-0 p-0 text-slate-900 dark:text-zinc-100 tracking-tighter"
                />
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex items-center gap-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-100 dark:border-zinc-700 px-6 py-3 rounded-[1.5rem] shadow-sm focus-within:border-emerald-400 focus-within:shadow-xl focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all group">
                    <Building2 size={24} className="text-emerald-500 group-focus-within:scale-110 transition-transform" />
                    <input
                      value={game.developer || ""}
                      placeholder="未设定制作商"
                      onChange={(e) => updateField('developer', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 p-0 text-4xl! font-black text-slate-600 dark:text-zinc-400 w-64 placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  <button onClick={() => backupArchive()} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 rounded-2xl font-bold text-xl shadow-sm hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-lg transition-all active:scale-95 group">
                    <DatabaseBackup size={20} className="group-hover:rotate-12 transition-transform" /><Trans>立即备份</Trans>
                  </button>
                  <button onClick={() => restoreGameArchive()} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 rounded-2xl font-bold text-xl shadow-sm hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-lg transition-all active:scale-95 group">
                    <ArchiveRestore size={20} className="group-hover:rotate-12 transition-transform" /> <Trans>从备份存档恢复</Trans>
                  </button>
                </div>

                <div className="flex flex-wrap gap-8 items-center">
                  <button onClick={() => invoke(Cmds.START_GAME, { game: game })} className="flex items-center gap-6 px-16 py-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-[1000] text-3xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all active:scale-95" >
                    <Play fill="currentColor" size={32} /><Trans>启动游戏</Trans>
                  </button>
                  <div className="flex gap-12 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 px-12 py-5 rounded-[2rem] shadow-sm">
                    <StatItem label={t`已游玩`} value={`${(game.playTime / 60).toFixed(2)}H`} color="text-emerald-500" />
                    <div className="w-px bg-slate-100 dark:bg-zinc-700 h-16" />
                    <StatItem label={t`占用空间`} value={`${(game.size ? (game.size / 1024 / 1024).toFixed(1) : "0")}MB`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
              <div className="lg:col-span-2">
                <div className={CARD_STYLE}>
                  <h3 className="text-lg font-black text-slate-400 dark:text-zinc-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Info size={24} className="text-emerald-500" /><Trans> 游戏简介</Trans>
                  </h3>
                  <textarea value={game.description} onChange={(e) => updateField('description', e.target.value)} placeholder={t`输入游戏描述...`} className="w-full flex-1 bg-slate-50 dark:bg-zinc-900/50 border-none rounded-2xl p-8 text-2xl text-slate-600 dark:text-zinc-400 leading-relaxed resize-none outline-none focus:ring-1 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition-all min-h-80" />
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-10">
                <div className={CARD_STYLE}>
                  <h4 className="text-lg font-black text-slate-400 dark:text-zinc-500 uppercase mb-8 tracking-[0.2em]"><Trans>管理与状态</Trans></h4>
                  <div className="space-y-10">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-slate-400 dark:text-zinc-500">
                        <Clock size={20} /> <span className="text-lg font-black uppercase tracking-widest"><Trans>游玩时长 (分钟)</Trans></span>
                      </div>
                      <input
                        type="number"
                        value={game.playTime}
                        onChange={(e) => updateField('playTime', parseInt(e.target.value) || 0)}
                        className="ml-8 text-2xl! font-[1000] text-emerald-500 bg-transparent border-none focus:ring-0 p-4 w-full leading-normal"
                      />
                    </div>

                    <div className="space-y-8">
                      <ToggleItem
                        icon={<Monitor size={20} />}
                        label={t`首页展示`}
                        isEnabled={game.isDisplayed}
                        onToggle={() => updateField('isDisplayed', !game.isDisplayed)}
                      />
                      <ToggleItem
                        icon={<CheckCircle2 size={20} />}
                        label={t`标记通关`}
                        isEnabled={game.isPassed}
                        onToggle={() => updateField('isPassed', !game.isPassed)}
                        activeColor="bg-amber-400"
                      />
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-zinc-700 w-full" />
                    <InfoItem label={t`最后运行`} value={game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleString() : t`"从未启动"`} icon={<Clock size={20} />} />
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase flex items-center gap-2"><HardDrive size={20} /><Trans>启动路径</Trans></p>
                      <p onClick={() => pickPath('absPath')} className="text-sm font-mono bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-100 dark:border-zinc-700 break-all cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all text-slate-500 dark:text-zinc-400">
                        {game.absPath}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className={CARD_STYLE}>
                  <p className="text-sm font-black text-slate-400 dark:text-zinc-500 uppercase mb-6 flex items-center gap-3"><Save size={24} /><Trans> 存档目录</Trans></p>
                  <div onClick={() => pickPath('saveDataPath')} className={INPUT_STYLE}>
                    <span className="text-xl font-mono text-slate-500 dark:text-zinc-400 truncate pr-6">{game.saveDataPath || t`点击配置路径...`}</span>
                    <FolderOpen size={28} className="text-emerald-500" />
                  </div>
                </div>
                <div className={CARD_STYLE}>
                  <p className="text-sm font-black text-slate-400 dark:text-zinc-500 uppercase mb-6 flex items-center gap-3"><ImageIcon size={24} /> <Trans>自定义背景</Trans></p>
                  <div onClick={() => pickPath('background')} className={INPUT_STYLE}>
                    <span className="text-xl font-mono text-slate-500 dark:text-zinc-400 truncate pr-6">{game.background || t`默认图片...`}</span>
                    <ImageIcon size={28} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div >
  );
}

// --- 辅助组件 (适配 dark:) ---
function ToggleItem({ label, isEnabled, onToggle, icon, activeColor = "bg-emerald-500" }: { label: string, isEnabled: boolean, onToggle: () => void, icon: any, activeColor?: string }) {
  return (
    <div className="flex items-center justify-between cursor-pointer group select-none" onClick={onToggle}>
      <div className="flex items-center gap-3 text-slate-700 dark:text-zinc-200">
        <span className="text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">{icon}</span>
        <span className="text-xl font-[1000]">{label}</span>
      </div>

      <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${isEnabled ? `${activeColor} justify-end` : 'bg-slate-200 dark:bg-zinc-700 justify-start'}`}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-6 h-6 bg-white dark:bg-zinc-200 rounded-full shadow-md"
        />
      </div>
    </div>
  );
}

function StatItem({ label, value, color = "text-slate-800 dark:text-zinc-100" }: { label: string, value: string, color?: string }) {
  return (
    <div className="text-center min-w-25">
      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mb-2 uppercase">{label}</p>
      <p className={`text-4xl font-[1000] font-mono ${color}`}>{value}</p>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-slate-400 dark:text-zinc-500">
        {icon} <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-[1000] text-slate-800 dark:text-zinc-200 ml-8 leading-none">{value}</p>
    </div>
  );
}
