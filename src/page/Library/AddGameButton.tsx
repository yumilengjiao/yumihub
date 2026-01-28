import React, { useState } from 'react';
import { Plus, FilePlus, FolderSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import BigPendingCard from './BigPendingCard';
import { open } from '@tauri-apps/plugin-dialog';
import { recognizeGame } from '@/api/uniform';
import gameData from '@/mock/game';
import PendingCard from './PendingCard';

interface AddGameButtonProps {
  className?: string;
}

const AddGameButton: React.FC<AddGameButtonProps> = ({
  className
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [matchSuccess, setMatchSuccess] = useState<boolean>(false)
  const [matchMutiSuccess, setMatchMutiSuccess] = useState<boolean>(false)
  const [singleGameBootPath, setSingleGameBootPath] = useState<string>("")
  const [mutiGameBootPath, setMutiGameBootPath] = useState<string[]>([])

  // 单个游戏导入按钮触发
  const onImportSingle = async () => {
    let selected = await open({
      title: "请选择单个游戏启动文件(非游戏目录)",
      multiple: false,
      directory: false,
    })
    if (selected === null)
      return
    setSingleGameBootPath(selected)
    setMatchSuccess(true)
    console.log(selected)
  }

  // 批量游戏导入按钮触发
  const onImportBatch = async () => {
    let selected = await open({
      title: "请选择多个游戏的目录(非启动文件)",
      multiple: true,
      directory: true,
    })
    if (selected === null)
      return
    setMatchMutiSuccess(true)
    setMutiGameBootPath(selected)
    console.log(selected)
  }

  // 处理点击并收起
  const handleAction = async (action: () => void | Promise<void>) => {
    setIsExpanded(false);
    await action();
  };

  return (
    <div className={cn("fixed bottom-12 right-12 z-50", className)}>
      {matchSuccess
        && <BigPendingCard
          absPath={singleGameBootPath}
          onCancel={() => setMatchSuccess(false)}
          onConfirm={() => setMatchSuccess(false)}
        />}
      {matchMutiSuccess
        && <PendingCard
          pathList={mutiGameBootPath}
          onCancel={() => setMatchMutiSuccess(false)}
          onConfirmAll={() => { setMatchMutiSuccess(false) }}
        />
      }
      <motion.div
        layout
        animate={{
          width: isExpanded ? 460 : 80,
          height: 80,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          layout: { duration: 0.3 } // 显式声明布局动画时间
        }}
        className="bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[40px] overflow-hidden flex flex-row-reverse items-center"
      >
        {/* 右侧锚点图标：保持不动 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-20 h-20 shrink-0 flex items-center justify-center text-zinc-100 active:scale-90 transition-transform"
        >
          {/* 这里用旋转动画来代替图标切换 */}
          <motion.div animate={{ rotate: isExpanded ? 45 : 0 }}>
            <Plus size={48} strokeWidth={4} />
          </motion.div>
        </button>

        {/* 左侧弹出的内容 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, transition: { duration: 0.1 } }}
              className="flex items-center gap-8 pr-4"
            >
              <OptionButton
                icon={<FilePlus size={32} strokeWidth={3.5} />}
                label="SINGLE"
                onClick={() => handleAction(onImportSingle)}
              />

              <div className="w-px h-10 bg-zinc-800" />

              <OptionButton
                icon={<FolderSearch size={32} strokeWidth={3.5} />}
                label="BATCH"
                onClick={() => handleAction(onImportBatch)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const OptionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon, label, onClick
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all active:scale-95 group"
  >
    {icon}
    <span className="text-xl font-black tracking-tighter whitespace-nowrap">{label}</span>
  </button>
);



export default AddGameButton
