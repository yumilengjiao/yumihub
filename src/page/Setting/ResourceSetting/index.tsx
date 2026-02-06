import CommonCard from "@/components/CommonCard";
import { PathCard } from "@/components/PathCard";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { Trans } from "@lingui/react/macro"
import { t } from "@lingui/core/macro"
import { useLingui } from "@lingui/react";
import { Cmds } from "@/lib/enum";

export default function ResourceSetting() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { i18n } = useLingui()

  const handleQuickBackup = async () => {
    setIsBackingUp(true);
    const tid = toast.loading("正在执行全量备份...");
    try {
      await invoke(Cmds.BACKUP_ARCHIVE)
      toast.success("备份成功", { id: tid })
    } catch (e) {
      toast.error("备份失败: " + e, { id: tid })
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleQuickRestore = async () => {
    const tid = toast.loading("正在执行全量恢复...");
    try {
      await invoke(Cmds.RESTORE_ALL_ARCHIVES)
      toast.success("恢复成功", { id: tid })
    } catch (e) {
      toast.error("恢复失败: " + e, { id: tid })
    } finally {
      setIsBackingUp(false);
    }

  }

  return (
    <CommonCard key={i18n.locale} title={t`资源管理`} icon="📂" className="dark:bg-zinc-800">
      <div className="space-y-4">
        <div className="space-y-1">
          <PathCard className="" title={t`游戏存档备份目录`} onSelect={() => console.log('')} />
          <PathCard className="hover:bg-zinc-200 dark:hover:bg-zinc-600" title={t`游戏元数据存储目录`} onSelect={() => console.log('')} />
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <Button
            onClick={handleQuickBackup}
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 transition-all active:scale-[0.98]"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            <Trans>立即执行一键备份</Trans>
          </Button>
          <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium">
            <Trans>
              将所有游戏的本地存档与配置打包至备份目录
            </Trans>
          </p>
        </div>
        <div className="pt-4 border-t border-zinc-100">
          <Button
            onClick={handleQuickRestore}
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 transition-all active:scale-[0.98]"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            <Trans>
              一键还原存档
            </Trans>
          </Button>
          <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium">
            <Trans>
              将所有游戏的本地存档还原到游戏
            </Trans>
          </p>
        </div>
      </div>
    </CommonCard>
  );
}
