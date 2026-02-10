import React, { useState } from 'react';
import { Plus, FilePlus, FolderSearch, PackagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeArchiveStructure, cn } from "@/lib/utils";
import BigPendingCard from './BigPendingCard';
import { open } from '@tauri-apps/plugin-dialog';
import PendingCard from './PendingCard';
import useConfigStore from '@/store/configStore';
import { toast } from 'sonner';
import ArchivePreviewDialog from './ArchivePreviewDialog';
import { invoke } from '@tauri-apps/api/core';
import { Cmds } from '@/lib/enum';
import { t } from "@lingui/core/macro"

interface AddGameButtonProps {
  className?: string;
}

const AddGameButton: React.FC<AddGameButtonProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [matchSuccess, setMatchSuccess] = useState<boolean>(false);
  const [matchMutiSuccess, setMatchMutiSuccess] = useState<boolean>(false);

  const [singleGameBootPath, setSingleGameBootPath] = useState<string>("");
  const [mutiGameBootPath, setMutiGameBootPath] = useState<string[]>([]);

  // 配置
  const { config } = useConfigStore();

  // 压缩包相关
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [archivePath, setArchivePath] = useState<string>("");
  const [archiveEntries, setArchiveEntries] = useState<any[]>([]);

  // 这个 customDestPath 是组件内的临时状态，仅用于本次解压预览
  const [customDestPath, setCustomDestPath] = useState<string>("");
  const [suggestedFolderName, setSuggestedFolderName] = useState<string>("");

  // 确认解压的函数
  const handleConfirmExtract = async () => {
    const finalPath = customDestPath || config.storage.galRootDir || "";
    if (!finalPath) return toast.error(t`未找到保存路径`);

    setIsPreviewOpen(false);

    // 重点：不要对 toast.promise 本身使用 await，除非你后面还有逻辑要跑
    toast.promise(
      // 这里去掉 async 关键字前的 await，让闭包保持纯净
      (async () => {
        // 1. 调用后端解压指令
        const parentDir = await invoke<string>(Cmds.EXTRACT_ARCHIVE, {
          archivePath: archivePath,
          destPath: finalPath,
        });

        // 2. 解压成功后的原有功能逻辑（完全保留）
        setCustomDestPath("");
        // 使用后端返回的实际物理路径
        setMutiGameBootPath([parentDir]);
        setMatchMutiSuccess(true);

        // 返回给 success 状态显示
        return parentDir;
      })(),
      {
        loading: '📦 正在后台解压任务，请稍候...',
        // 解决 'dir' is never read 警告：在消息中使用 dir
        success: (dir) => `✅ 成功解压至目录: ${dir}`,
        error: (e) => {
          console.error("解压异常:", e);
          return typeof e === 'string' ? e : (e.details || "解压过程出错");
        },
      }
    );
  }
  // --- 导入压缩包 ---
  const onImportArchive = async () => {
    const selected = await open({
      title: "选择压缩文件预览",
      filters: [{ name: 'Archive', extensions: ['zip', 'rar'] }]
    });
    if (!selected) return;

    try {
      const path = selected as string;
      const entries = await invoke(Cmds.GET_ARCHIVE_LIST, { path }) as any[];
      const { rootName, cleanedEntries } = analyzeArchiveStructure(entries);

      const fallbackFileName = path.split(/[\\/]/).pop()?.replace(/\.(zip|rar)$/i, "") || "NewGame";

      setSuggestedFolderName(rootName || fallbackFileName);
      setArchivePath(path);
      setArchiveEntries(cleanedEntries);

      // 注意：这里重置临时路径，弹窗初始会显示 config 里的路径
      setCustomDestPath("");
      setIsPreviewOpen(true);
    } catch (e) {
      toast.error(t`压缩包解析失败`);
    }
  }

  const onImportSingle = async () => {
    let selected = await open({ title: t`请选择单个游戏启动文件` });
    if (!selected) return;
    setSingleGameBootPath(selected as string);
    setMatchSuccess(true);
  };

  const onImportBatch = async () => {
    let selected = await open({ title: t`请选择多个游戏的目录`, multiple: true, directory: true });
    if (!selected) return;
    setMutiGameBootPath(selected as string[]);
    setMatchMutiSuccess(true);
  };

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsExpanded(false);
    await action();
  };

  return (
    <div className={cn("fixed bottom-10 right-10 z-50", className)}>
      {matchSuccess && (
        <BigPendingCard absPath={singleGameBootPath} onCancel={() => setMatchSuccess(false)} />
      )}

      {matchMutiSuccess && (
        <PendingCard
          pathList={mutiGameBootPath}
          onCancel={() => setMatchMutiSuccess(false)}
          onConfirmAll={() => setMatchMutiSuccess(false)}
        />
      )}

      <ArchivePreviewDialog
        isOpen={isPreviewOpen}
        path={archivePath}
        entries={archiveEntries}
        // 关键：展示时优先看临时路径，没有临时路径才看全局配置
        displayPath={customDestPath || config.storage.galRootDir || ""}
        suggestedFolderName={suggestedFolderName}
        // 这里的 setCustomPath 只会改变上面的 useState，不会动 configStore
        setCustomPath={setCustomDestPath}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmExtract}
      />

      <motion.div
        layout
        initial={false}
        animate={{
          width: isExpanded ? 460 : 60,
          height: 60,
          backgroundColor: "var(--primary)"
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={cn(
          "shadow-2xl rounded-full overflow-hidden flex flex-row items-center border transition-colors duration-300",
          isExpanded ? "border-border" : "border-primary-foreground/10"
        )}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.1 } }}
              className="flex-1 flex items-center justify-evenly pl-4 pr-2"
            >
              <OptionButton
                icon={<FilePlus size={22} strokeWidth={2.5} />}
                label="SINGLE"
                onClick={() => handleAction(onImportSingle)}
              />
              <div className="w-px h-6 bg-border shrink-0" />
              <OptionButton
                icon={<FolderSearch size={22} strokeWidth={2.5} />}
                label="BATCH"
                onClick={() => handleAction(onImportBatch)}
              />
              <div className="w-px h-6 bg-border shrink-0" />
              <OptionButton
                icon={<PackagePlus size={22} strokeWidth={2.5} />}
                label="ARCHIVE"
                onClick={() => handleAction(onImportArchive)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-[60px] h-[60px] shrink-0 flex items-center justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full h-full flex items-center justify-center active:scale-90 transition-all",
              // 按钮颜色反转：背景深则字浅，背景浅则字深
              isExpanded
                ? "text-zinc-100 dark:text-zinc-800"
                : "text-primary-foreground"
            )}
          >
            <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus size={28} strokeWidth={3} />
            </motion.div>
          </button>
        </div>      </motion.div>
    </div >
  );
};

const OptionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon, label, onClick
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center transition-all active:scale-95 group shrink-0 min-w-[70px]",
      // 核心逻辑：
      // 在明亮模式下（父级变黑锌），文字强制变白锌 (text-zinc-100)
      // 在黑暗模式下（父级变白锌），文字强制变黑锌 (text-zinc-800)
      "text-zinc-100 dark:text-zinc-800"
    )}
  >
    <div className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
      {icon}
    </div>
    <span className="text-[9px] font-black tracking-[0.2em] whitespace-nowrap uppercase mt-1">
      {label}
    </span>
  </button>
);

export default AddGameButton;
