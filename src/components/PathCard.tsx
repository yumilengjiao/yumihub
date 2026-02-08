import { Search, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { open } from "@tauri-apps/plugin-dialog";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";

interface PathCardProps {
  title: string;
  path?: string;
  /** * onSelect 现在是可选的。
   * 如果不传 onSelect，组件会自动进入“只读浏览”模式。
   */
  onSelect?: (selectedPath: string) => void;
  /** 强制开启只读模式，即便传了 onSelect 也不允许修改 */
  readOnly?: boolean;
  className?: string;
}

export function PathCard({ title, path, onSelect, readOnly = false, className }: PathCardProps) {
  // 判断当前是否为“只读”状态
  const isViewOnly = readOnly || !onSelect;

  const handleAction = async () => {
    try {
      let selected: string | null = ""
      if (onSelect && !readOnly) {
        selected = await open({
          directory: true,
          multiple: false,
          title: isViewOnly ? t`查看${title}` : t`选择${title}`,
          defaultPath: path
        });
      } else {
        open({
          directory: false,
          multiple: false,
          title: isViewOnly ? t`查看${title}` : t`选择${title}`,
          defaultPath: path
        });

      }
      // 只有在非只读模式且有回调时，才执行修改
      if (selected && typeof selected === 'string' && !isViewOnly) {
        onSelect?.(selected);
      }
    } catch (err) {
      console.error("无法打开路径选择框:", err);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-8 p-6 rounded-[24px] transition-all",
      "bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800",
      !isViewOnly && "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-custom-500/30",
      className
    )}>
      <div className="flex flex-col space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <Label className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </Label>
          {/* 状态小标签 */}
          {isViewOnly && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
              <Trans>只读</Trans>
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-400 font-mono truncate max-w-[400px]" title={path}>
          {path || t`尚未选择路径...`}
        </p>
      </div>

      <Button
        onClick={handleAction}
        // 根据模式切换样式：只读模式用灰色/幽灵色，编辑模式用自定义色
        className={cn(
          "h-12 px-6 rounded-2xl transition-all gap-3 border-none shadow-none group",
          isViewOnly
            ? "bg-zinc-200/50 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            : "bg-custom-100 hover:bg-custom-500 text-custom-600 hover:text-white"
        )}
      >
        <span className="font-bold">
          {isViewOnly ? <Trans>查看</Trans> : <Trans>更改</Trans>}
        </span>

        {/* 图标区分核心逻辑 */}
        {isViewOnly ? (
          <Search size={18} className="group-hover:scale-110 transition-transform opacity-70" />
        ) : (
          <Edit3 size={18} className="group-hover:rotate-12 transition-transform" />
        )}
      </Button>
    </div>
  );
}
