import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { open } from "@tauri-apps/plugin-dialog";
import { Trans } from "@lingui/react/macro";
import {t} from "@lingui/core/macro"

interface PathCardProps {
  title: string;
  path?: string;
  // 修改：让 onSelect 返回选择后的路径字符串
  onSelect: (selectedPath: string) => void;
  className?: string;
}

export function PathCard({ title, path, onSelect, className }: PathCardProps) {
  const handleBrowse = async () => {
    try {
      // 调用 Tauri 原生选择框
      const selected = await open({
        directory: true, // 设置为 true 表示选择文件夹
        multiple: false,
        title: `选择${title}`
      });

      // 如果用户选择了路径（不是取消）
      if (selected && typeof selected === 'string') {
        onSelect(selected);
      }
    } catch (err) {
      console.error("无法打开路径选择框:", err);
    }
  };

  return (
    <div className={cn("flex items-center justify-between gap-8 p-6 rounded-[24px] hover:bg-zinc-50 transition-all", className)}>
      <div className="flex flex-col space-y-1 overflow-hidden">
        <Label className="text-2xl font-bold tracking-tight text-zinc-900">{title}</Label>
        {/* 路径通常很长，增加提示和截断 */}
        <p className="text-sm text-zinc-400 font-mono truncate" title={path}>
          {path || t`尚未选择路径...`}
        </p>
      </div>

      <Button
        onClick={handleBrowse}
        className="h-14 px-8 rounded-2xl bg-emerald-100 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all gap-3 border-none shadow-none group"
      >
        <span className="text-lg font-bold"><Trans>浏览</Trans></span>
        <FolderOpen size={20} className="group-hover:scale-110 transition-transform" />
      </Button>
    </div>
  );
}
