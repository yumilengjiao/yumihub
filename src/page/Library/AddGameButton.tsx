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
      {/* 弹窗部分逻辑保持不变 */}
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
          width: isExpanded ? 320 : 60,
          height: 60,
          // 💡 优化：根据展开状态切换背景深度
          backgroundColor: isExpanded ? "var(--popover)" : "var(--primary)",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
        // 💡 优化：使用 bg-primary (闭合时) 和 bg-popover (展开时)，增加 border-border
        className={cn(
          "shadow-2xl rounded-full overflow-hidden flex flex-row items-center border transition-colors duration-300",
          isExpanded ? "border-border" : "border-primary-foreground/10"
        )}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex-1 flex items-center justify-evenly pl-4"
            >
              <OptionButton
                icon={<FilePlus size={22} strokeWidth={2.5} />}
                label="SINGLE"
                onClick={() => handleAction(onImportSingle)}
              />

              {/* 分割线改用 border 变量 */}
              <div className="w-px h-6 bg-border shrink-0" />

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
            // 💡 优化：文字颜色根据背景自动反转
            className={cn(
              "w-full h-full flex items-center justify-center active:scale-90 transition-all",
              isExpanded ? "text-foreground" : "text-primary-foreground"
            )}
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
    // 💡 优化：使用 text-muted-foreground 和 hover:text-primary
    className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95 group shrink-0"
  >
    <div className="opacity-80 group-hover:opacity-100">{icon}</div>
    <span className="text-[10px] font-black tracking-[0.2em] whitespace-nowrap uppercase mt-0.5">{label}</span>
  </button>
)

export default AddGameButton
