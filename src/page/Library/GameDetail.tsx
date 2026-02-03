import useGameStore from '@/store/gameStore';
import { GameMeta } from '@/types/game';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, FolderOpen, ArrowLeft,
  HardDrive, Clock, Info, Image as ImageIcon,
  CheckCircle2, Monitor, Building2
} from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useState } from 'react';
import { Cmds } from '@/lib/enum';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const { getGameMetaById, setGameMeta } = useGameStore();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameMeta>(getGameMetaById(id!)!)

  // 获取数据
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

  const CARD_STYLE = "bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10 flex flex-col w-full h-full";
  const INPUT_STYLE = "flex items-center justify-between bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:bg-white hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group";

  // 通用路径选择逻辑
  const pickPath = async (field: keyof GameMeta) => {
    const isImage = field === 'background' || field === 'cover';
    const selected = await open({
      directory: !isImage,
      multiple: false,
      filters: isImage ? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] : undefined,
    });
    if (selected && typeof selected === 'string') {
      setGameMeta({ ...game, [field]: selected });
    }
  }

  // 更新数值或开关状态
  const updateField = <K extends keyof GameMeta>(field: K, value: GameMeta[K]) => {
    setGame({ ...game, [field]: value })
    setGameMeta({ ...game, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-[#fcfdfe] text-slate-800 overflow-y-auto z-50">
      {/* 注入 CSS 修复数字输入框箭头遮挡 */}
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
            style={{ backgroundImage: `url(${game.local_background ? convertFileSrc(game.local_background) : game.background})` }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/50 to-[#fcfdfe]" />
          <div className="relative z-30 pt-24 px-16 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="group flex items-center gap-6 px-10 py-5 bg-white shadow-xl border border-slate-100 rounded-[2rem] text-slate-800 hover:text-emerald-600 transition-all active:scale-95">
              <ArrowLeft size={32} strokeWidth={3} className="group-hover:-translate-x-3 transition-transform" />
              <span className="text-3xl font-[1000] tracking-tighter">返回库</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="relative z-20 max-w-7xl mx-auto px-16 -mt-32">

            {/* 头部区域 */}
            <div className="flex flex-col md:flex-row gap-16 items-end">
              <div className="relative w-72 aspect-3/4 bg-white p-4 rounded-[3.5rem] shadow-2xl border border-white shrink-0 group">
                <img src={game.local_cover ? convertFileSrc(game.local_cover) : game.cover} className="w-full h-full object-cover rounded-[2.5rem]" />
                {game.isPassed && (
                  <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-3 rounded-full shadow-lg border-4 border-white z-40">
                    <CheckCircle2 size={32} fill="currentColor" className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-4">
                {/* 游戏名修改 */}
                <input
                  value={game.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="bg-transparent text-7xl! font-[1000] mb-4 w-full border-none focus:ring-0 p-0 text-slate-900 tracking-tighter"
                />

                {/* ✅ 制作商修改区：去掉发行商，强化制作商展示 */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-100 px-6 py-3 rounded-[1.5rem] shadow-sm focus-within:border-emerald-400 focus-within:shadow-xl focus-within:bg-white transition-all group">
                    <Building2 size={24} className="text-emerald-500 group-focus-within:scale-110 transition-transform" />
                    <input
                      value={game.developer || ""}
                      placeholder="未设定制作商"
                      onChange={(e) => updateField('developer', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 p-0 text-4xl! font-black text-slate-600 w-64 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 items-center">
                  <button onClick={() => invoke('launch_game', { path: game.absPath })} className="flex items-center gap-6 px-16 py-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-[1000] text-3xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all active:scale-95">
                    <Play fill="currentColor" size={32} /> 启动游戏
                  </button>
                  <div className="flex gap-12 bg-white border border-slate-100 px-12 py-5 rounded-[2rem] shadow-sm">
                    <StatItem label="已游玩" value={`${(game.playTime / 60).toFixed(2)}H`} color="text-emerald-500" />
                    <div className="w-px bg-slate-100 h-16" />
                    <StatItem label="占用空间" value={`${(game.size ? (game.size / 1024 / 1024).toFixed(1) : "0")}MB`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
              <div className="lg:col-span-2">
                <div className={CARD_STYLE}>
                  <h3 className="text-lg font-black text-slate-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Info size={24} className="text-emerald-500" /> 游戏简介
                  </h3>
                  <textarea value={game.description} onChange={(e) => updateField('description', e.target.value)} placeholder="输入游戏描述..." className="w-full flex-1 bg-slate-50 border-none rounded-2xl p-8 text-2xl text-slate-600 leading-relaxed resize-none outline-none focus:ring-1 focus:ring-emerald-100 transition-all min-h-80" />
                </div>
              </div>

              <div className="lg:col-span-1 flex flex-col gap-10">
                <div className={CARD_STYLE}>
                  <h4 className="text-lg font-black text-slate-400 uppercase mb-8 tracking-[0.2em]">管理与状态</h4>
                  <div className="space-y-10">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Clock size={20} /> <span className="text-lg font-black uppercase tracking-widest">游玩时长 (分钟)</span>
                      </div>
                      <input
                        type="number"
                        value={game.playTime}
                        onChange={(e) => updateField('playTime', parseInt(e.target.value) || 0)}
                        className="ml-8 text-2xl! font-[1000] text-emerald-500 bg-transparent border-none focus:ring-0 p-4 w-full leading-normal"
                      />
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    <div className="space-y-8">
                      <ToggleItem
                        icon={<Monitor size={20} />}
                        label="首页展示"
                        isEnabled={game.isDisplayed}
                        onToggle={() => updateField('isDisplayed', !game.isDisplayed)}
                      />
                      <ToggleItem
                        icon={<CheckCircle2 size={20} />}
                        label="标记通关"
                        isEnabled={game.isPassed}
                        onToggle={() => updateField('isPassed', !game.isPassed)}
                        activeColor="bg-amber-400"
                      />
                    </div>

                    <div className="h-px bg-slate-100 w-full" />
                    <InfoItem label="最后运行" value={game.lastPlayedAt ? new Date(game.lastPlayedAt).toLocaleString() : "从未启动"} icon={<Clock size={20} />} />
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><HardDrive size={20} /> 启动路径</p>
                      <p onClick={() => pickPath('absPath')} className="text-sm font-mono bg-slate-50 p-5 rounded-xl border border-slate-100 break-all cursor-pointer hover:bg-white transition-all text-slate-500">
                        {game.absPath}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
    </div>
  );
}

// --- 辅助组件 ---

function ToggleItem({ label, isEnabled, onToggle, icon, activeColor = "bg-emerald-500" }: { label: string, isEnabled: boolean, onToggle: () => void, icon: any, activeColor?: string }) {
  return (
    <div className="flex items-center justify-between cursor-pointer group select-none" onClick={onToggle}>
      <div className="flex items-center gap-3 text-slate-700">
        <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">{icon}</span>
        <span className="text-xl font-[1000]">{label}</span>
      </div>

      <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${isEnabled ? `${activeColor} justify-end` : 'bg-slate-200 justify-start'}`}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-6 h-6 bg-white rounded-full shadow-md"
        />
      </div>
    </div>
  );
}

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
  );
}
