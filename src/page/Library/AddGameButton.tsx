import React, { useState } from 'react';
import { Plus, FilePlus, FolderSearch, PackagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
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

const AddGameButton: React.FC<AddGameButtonProps> = ({
  className
}) => {
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

  // 单个游戏导入按钮触发
  const onImportSingle = async () => {
    let selected = await open({ title: t`请选择单个游戏启动文件` });
    if (!selected) return;
    setSingleGameBootPath(selected as string);
    setMatchSuccess(true);
  };

  // 批量游戏导入按钮触发
  const onImportBatch = async () => {
    let selected = await open({ title: t`请选择多个游戏的目录`, multiple: true, directory: true });
    if (!selected) return;
    setMutiGameBootPath(selected as string[]);
    setMatchMutiSuccess(true);
  };

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
