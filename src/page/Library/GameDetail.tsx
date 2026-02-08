import useGameStore from '@/store/gameStore';
import useConfigStore from '@/store/configStore';
import { GameMeta } from '@/types/game';
import { useNavigate, useParams } from 'react-router';
import { motion, Variants } from 'framer-motion';
import {
  Play, ArrowLeft, Image as ImageIcon,
  CheckCircle2, Building2, RefreshCw, FolderOpen,
  DatabaseBackup, ArchiveRestore, Monitor, HardDrive, Save
} from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useState } from 'react';
import { Cmds } from '@/lib/enum';
import { Trans } from '@lingui/react/macro';
import { t } from "@lingui/core/macro"
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { requestBangumiById } from '@/api/bangumiApi';
import { requestVNDBById } from '@/api/vndbApi';
import { transBangumiToGameMeta, transVNDBToGameMeta } from '@/lib/resolve';

// --- 动画配置 ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const { getGameMetaById, setGameMeta } = useGameStore();
  const { updateConfig } = useConfigStore();
  const navigate = useNavigate();

  const { config } = useConfigStore()

  const [game, setGame] = useState<GameMeta>(getGameMetaById(id!)!);
  const [syncMode, setSyncMode] = useState<'bangumi' | 'vndb'>('bangumi');
  const [inputId, setInputId] = useState('');

  useEffect(() => {
    async function getGame() {
      try {
        const gameInfo = await invoke<GameMeta>(Cmds.GET_GAME_META, { id: id })
        setGame(gameInfo);
      } catch (error) { console.error(error) }
    }
    getGame()
  }, [id]);

  const backupArchive = async () => {
    const promise = invoke(Cmds.BACKUP_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: t`正在备份存档...`,
      success: t`存档备份完毕`,
      error: (err: any) => t`备份失败: ` + (err.details || '未知错误')
    });
  }

  const restoreGameArchive = () => {
    const promise = invoke(Cmds.RESTORE_ARCHIVE_BY_ID, { id: game.id })
    toast.promise(promise, {
      loading: t`正在恢复存档...`,
      success: t`存档恢复完毕`,
      error: (err: any) => t`恢复失败: ` + (err.details || '未知错误')
    });
  }

  const handleSync = async () => {
    if (!inputId) return toast.error(t`请输入 ID`);
    const currentMode = syncMode
    const token = config.auth.bangumiToken
    const promise = currentMode === 'bangumi' ? requestBangumiById(inputId, token) : requestVNDBById(inputId);

    toast.promise(promise, {
      loading: t`正在同步...`,
      success: (newData: any) => { // 先用 any 接收
        // 校验是否为空
        if (!newData) {
          throw new Error("未找到对应数据");
        }

        let updatedData: GameMeta;

        // 直接判断发起请求时用的模式
        if (currentMode === 'bangumi') {
          console.log("处理 Bangumi 数据");
          updatedData = transBangumiToGameMeta(game, newData);
        } else {
          console.log("处理 VNDB 数据");
          updatedData = transVNDBToGameMeta(game, newData["results"][0]);
        }
        updatedData.localBackground = ""
        updatedData.localCover = ""

        setGame(updatedData);
        setGameMeta(updatedData);

        return t`同步成功`;
      },
      error: (err: any) => t`同步失败: ` + (err?.message || err)
    })
  }

  const pickPath = async (field: keyof GameMeta) => {
    const isFile = field === 'localBackground' || field === 'localCover' || field === 'absPath';
    const selected = await open({
      directory: !isFile,
      multiple: false,
      defaultPath: game[field] as string,
    });
    if (field === 'localBackground' || field === 'localCover') {
      await invoke(Cmds.AUTHORIZE_PATH_ACCESS, { path: selected })
    }
    if (selected && typeof selected === 'string') {
      updateField(field, selected);
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
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* 背景层 */}
      <div className="fixed top-0 left-0 w-full h-98 pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${game.localBackground ? convertFileSrc(game.localBackground) : game.background})`,
            filter: 'blur(50px) brightness(0.9)'
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-white/10 via-white/60 dark:via-zinc-950/40 to-[#f8f9fa] dark:to-zinc-950" />
      </div>

      <div className="relative z-10 max-w-(screen-2xl) mx-auto px-16 pt-16 pb-40">

        {/* 返回按钮 */}
        <motion.div variants={itemVariants} className="mb-14">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-4 px-6 py-3 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-black/5 dark:border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl rounded-2xl active:scale-95 transition-all">
            <ArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xl font-black tracking-tighter"><Trans>返回库</Trans></span>
          </button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-20 items-start">

          {/* 封面图 */}
          <motion.div variants={itemVariants} className="relative shrink-0 z-20 group">
            {game.isPassed && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-5 -right-5 bg-amber-400 text-white p-3 rounded-full shadow-2xl border-4 border-white dark:border-zinc-900 z-50"
              >
                <CheckCircle2 size={40} fill="currentColor" strokeWidth={3} />
              </motion.div>
            )}
            <div
              onClick={() => pickPath('localCover')}
              className="relative w-80 aspect-3/4 bg-white dark:bg-zinc-800 p-3 rounded-[3.5rem] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.3)] border-2 border-white/60 dark:border-zinc-700 cursor-pointer overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
            >
              <img src={game.localCover ? convertFileSrc(game.localCover) : game.cover} className="w-full h-full object-cover rounded-[2.5rem]" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <ImageIcon size={48} className="mb-2" />
                <span className="font-black text-xs uppercase tracking-widest"><Trans>更换封面</Trans></span>
              </div>
            </div>
          </motion.div>

          {/* 右侧主要信息区 */}
          <div className="flex-1 min-w-0 pt-4">
            <motion.div variants={itemVariants}>
              <input
                value={game.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="bg-transparent text-7xl! font-[1000] mb-8 w-full border-none focus:ring-0 p-0 text-slate-900 dark:text-zinc-100 tracking-tighter drop-shadow-sm"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mb-10">
              {/* 厂商输入 - 增加阴影 */}
              <div className="flex items-center gap-4 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-md px-6 py-3 rounded-[1.8rem] border border-black/5 dark:border-white/20 shadow-lg shadow-black/5">
                <Building2 size={24} className="text-custom-500" />
                <input
                  value={game.developer || ""}
                  placeholder={t`制作商`}
                  onChange={(e) => updateField('developer', e.target.value)}
                  className="bg-transparent border-none focus:ring-0 p-0 text-3xl font-black text-slate-800 dark:text-zinc-200 w-64 tracking-tight"
                />
              </div>

              {/* 备份恢复 - 增加阴影和边框可见度 */}
              <button onClick={backupArchive} className="flex items-center gap-2 px-6 py-4 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-md border border-black/5 dark:border-white/20 shadow-lg shadow-black/5 rounded-[1.5rem] font-bold text-sm hover:bg-white hover:text-custom-600 transition-all active:scale-95">
                <DatabaseBackup size={18} /> <Trans>备份</Trans>
              </button>
              <button onClick={restoreGameArchive} className="flex items-center gap-2 px-6 py-4 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-md border border-black/5 dark:border-white/20 shadow-lg shadow-black/5 rounded-[1.5rem] font-bold text-sm hover:bg-white hover:text-custom-600 transition-all active:scale-95">
                <ArchiveRestore size={18} /> <Trans>恢复</Trans>
              </button>
            </motion.div>

            {/* 启动与同步区 */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8 mb-12">
              <button
                onClick={() => invoke(Cmds.START_GAME, { game: game })}
                className="flex items-center gap-4 px-14 py-8 bg-custom-500 text-white rounded-[2.5rem] font-black text-4xl shadow-2xl shadow-custom-500/40 hover:bg-custom-600 transition-all active:scale-95"
              >
                <Play fill="currentColor" size={36} /><Trans>启动</Trans>
              </button>

              {/* 同步组件 - 阴影增强 */}
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 rounded-[2.2rem] p-2 pr-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-[1.5rem] p-1 shrink-0">
                  <button onClick={() => setSyncMode('bangumi')} className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all", syncMode === 'bangumi' ? "bg-white dark:bg-zinc-700 shadow-md text-custom-600" : "opacity-30")}>BGM</button>
                  <button onClick={() => setSyncMode('vndb')} className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all", syncMode === 'vndb' ? "bg-white dark:bg-zinc-700 shadow-md text-custom-600" : "opacity-30")}>VNDB</button>
                </div>
                <input
                  placeholder="ID..."
                  value={inputId}
                  onChange={e => setInputId(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 p-0 w-32 font-black text-2xl! tracking-tight px-2"
                />
                <button onClick={handleSync} className="flex items-center justify-center w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:rotate-180 transition-all shadow-lg">
                  <RefreshCw size={20} />
                </button>
              </div>
            </motion.div>

            {/* 数据统计 */}
            <motion.div variants={itemVariants} className="flex gap-12 border-t border-black/10 dark:border-white/5 pt-8">
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{t`已游玩 (分钟)`}</span>
                {/* 这里的 input 已经通过全局 style 去除了小箭头 */}
                <input
                  type="number"
                  value={game.playTime}
                  onChange={(e) => updateField('playTime', parseInt(e.target.value) || 0)}
                  className="bg-transparent border-none focus:ring-0 p-0 text-4xl! font-[1000] font-mono text-custom-500 w-32 outline-none appearance-none m-0"
                />
              </div>
              <StatItem label={t`空间占用`} value={`${(game.size ? (game.size / 1024 / 1024).toFixed(0) : "0")}MB`} />
              <div className="flex flex-col">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{t`最后运行`}</span>
                <span className="text-2xl font-black font-mono text-zinc-600 dark:text-zinc-300 pt-2">
                  {game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleDateString() : "NEVER"}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 详情与设置面板 */}
        <motion.div variants={itemVariants} className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* 简介卡片 - 增强阴影和背景不透明度 */}
          <div className="lg:col-span-2">
            <div className="h-full bg-white/90 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[3.5rem] p-12 border border-black/5 dark:border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <div className="w-8 h-1 bg-custom-500 rounded-full" /> <Trans>简介</Trans>
              </h3>
              <textarea
                value={game.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full h-full bg-transparent border-none p-0 text-xl leading-relaxed text-zinc-700 dark:text-zinc-300 resize-none focus:ring-0 font-medium placeholder:text-zinc-300"
                placeholder={t`暂无描述...`}
              />
            </div>
          </div>

          {/* 设置列表 */}
          <div className="flex flex-col gap-6">
            {/* 开关组 - 增强阴影 */}
            <div className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 dark:border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-6">
              <ToggleItem
                label={t`首页展示`}
                icon={<Monitor size={20} />}
                isEnabled={game.isDisplayed}
                onToggle={() => updateField('isDisplayed', !game.isDisplayed)}
              />
              <ToggleItem
                label={t`标记通关`}
                icon={<CheckCircle2 size={20} />}
                isEnabled={game.isPassed}
                onToggle={() => updateField('isPassed', !game.isPassed)}
                activeColor="bg-amber-400"
              />
            </div>

            {/* 路径组 */}
            <div className="flex flex-col gap-4">
              <PathItem title={t`执行路径`} icon={<HardDrive size={18} />} value={game.absPath} onClick={() => pickPath('absPath')} />
              <PathItem title={t`存档目录`} icon={<Save size={18} />} value={game.saveDataPath || ""} onClick={() => pickPath('saveDataPath')} />
              <PathItem title={t`背景图片`} icon={<ImageIcon size={18} />} value={game.localBackground || ""} onClick={() => pickPath('localBackground')} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- 辅助组件 ---

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-4xl font-[1000] font-mono text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

// PathItem - 增强亮色模式下的可读性
function PathItem({ title, value, onClick, icon }: { title: string, value: string, onClick: () => void, icon: any }) {
  return (
    <div onClick={onClick} className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-5 rounded-[2rem] border border-black/5 dark:border-white/20 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-zinc-400">{icon}</span>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-mono truncate text-zinc-600 dark:text-zinc-400 w-full font-bold">{value || t`未设定 (点击选择)`}</span>
        <FolderOpen size={16} className="text-zinc-400 group-hover:text-custom-500 transition-colors shrink-0" />
      </div>
    </div>
  )
}

function ToggleItem({ label, isEnabled, onToggle, icon, activeColor = "bg-custom-500" }: { label: string, isEnabled: boolean, onToggle: () => void, icon: any, activeColor?: string }) {
  return (
    <div className="flex items-center justify-between cursor-pointer group select-none" onClick={onToggle}>
      <div className="flex items-center gap-3">
        <span className="text-zinc-400 group-hover:text-custom-500 transition-colors">{icon}</span>
        <span className="text-lg font-black text-slate-700 dark:text-zinc-200">{label}</span>
      </div>
      <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${isEnabled ? `${activeColor} justify-end` : 'bg-slate-200 dark:bg-zinc-700 justify-start'}`}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-5 h-5 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}
