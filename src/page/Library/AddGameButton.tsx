import React, { useState } from 'react';
import { Plus, FilePlus, FolderSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import BigPendingCard from './BigPendingCard';
import { open } from '@tauri-apps/plugin-dialog';
import PendingCard from './PendingCard';

interface AddGameButtonProps {
  className?: string;
}

const AddGameButton: React.FC<AddGameButtonProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [matchSuccess, setMatchSuccess] = useState<boolean>(false);
  const [matchMutiSuccess, setMatchMutiSuccess] = useState<boolean>(false);
  const [singleGameBootPath, setSingleGameBootPath] = useState<string>("");
  const [mutiGameBootPath, setMutiGameBootPath] = useState<string[]>([]);

  const onImportSingle = async () => {
    let selected = await open({
      title: "请选择单个游戏启动文件",
      multiple: false,
      directory: false,
    });
    if (selected === null) return;
    setSingleGameBootPath(selected);
    setMatchSuccess(true);
  };

  const onImportBatch = async () => {
    let selected = await open({
      title: "请选择多个游戏的目录",
      multiple: true,
      directory: true,
    });
    if (selected === null) return;
    setMatchMutiSuccess(true);
    setMutiGameBootPath(selected);
  };

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsExpanded(false);
    await action();
  };

  return (
    <div className={cn("fixed bottom-10 right-10 z-50", className)}>
      {matchSuccess && (
        <BigPendingCard
          absPath={singleGameBootPath}
          onCancel={() => setMatchSuccess(false)}
        />
      )}
      {matchMutiSuccess && (
        <PendingCard
          pathList={mutiGameBootPath}
          onCancel={() => setMatchMutiSuccess(false)}
          onConfirmAll={() => setMatchMutiSuccess(false)}
        />
      )}

      <motion.div
        layout
        initial={false}
        animate={{
          // 稍微加宽一点点（320），给 around 分布留出呼吸空间
          width: isExpanded ? 320 : 60,
          height: 60,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
        className="bg-zinc-900 shadow-2xl rounded-full overflow-hidden flex flex-row items-center border border-white/5"
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              // 使用 flex-1 占据左侧所有空间，justify-evenly 实现平分间距
              className="flex-1 flex items-center justify-evenly pl-4"
            >
              <OptionButton
                icon={<FilePlus size={22} strokeWidth={2.5} />}
                label="SINGLE"
                onClick={() => handleAction(onImportSingle)}
              />

              <div className="w-px h-6 bg-zinc-800 shrink-0" />

              <OptionButton
                icon={<FolderSearch size={22} strokeWidth={2.5} />}
                label="BATCH"
                onClick={() => handleAction(onImportBatch)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-[60px] h-[60px] shrink-0 flex items-center justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-full flex items-center justify-center text-zinc-100 active:scale-90 transition-transform"
          >
            <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus size={28} strokeWidth={3} />
            </motion.div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const OptionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon, label, onClick
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95 group shrink-0"
  >
    <div className="opacity-80 group-hover:opacity-100">{icon}</div>
    <span className="text-[10px] font-black tracking-[0.2em] whitespace-nowrap uppercase mt-0.5">{label}</span>
  </button>
)

export default AddGameButton
