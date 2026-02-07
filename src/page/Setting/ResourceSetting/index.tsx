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
import SwitchCard from "@/components/SwitchCard";
import ConfirmDialog from "./ComfirmDialog";

export default function ResourceSetting() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { i18n } = useLingui()
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    desc: string;
    danger?: boolean;
    action?: () => void;
  }>({
    open: false,
    title: "",
    desc: "",
  });

  const openConfirm = (opts: {
    title: string;
    desc: string;
    danger?: boolean;
    action: () => void;
  }) => {
    setConfirm({
      open: true,
      title: opts.title,
      desc: opts.desc,
      danger: opts.danger,
      action: opts.action,
    });
  };
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
        <SwitchCard
          className="mb-3!"
          title={t`允许资源下载到本地`}
          checked={true}
          onCheckedChange={(v) => alert("aaa")}
        />

        <div className="space-y-1">
          <PathCard className="" title={t`游戏存档备份目录`} onSelect={() => console.log('')} />
          <PathCard className="hover:bg-zinc-200 dark:hover:bg-zinc-600" title={t`游戏资源存储目录`} onSelect={() => console.log('')} />
        </div>

        <div className="pt-4">
          <Button
            onClick={() =>
              openConfirm({
                title: t`确认执行备份？`,
                desc: t`将立即对所有游戏的本地存档与配置进行全量备份，该过程可能需要一些时间。`,
                action: handleQuickBackup,
              })
            }
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            <Trans>立即执行一键备份</Trans>
          </Button>
        </div>
        <div className="pt-4">
          <Button
            onClick={() =>
              openConfirm({
                title: t`确认还原所有存档？`,
                desc: t`该操作将覆盖当前所有游戏的本地存档，且无法撤销，请确认你已经做好备份。`,
                danger: true,
                action: handleQuickRestore,
              })
            }
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            <Trans>一键还原存档</Trans>
          </Button>
        </div>
        <div className="pt-4">
          <Button
            onClick={() =>
              openConfirm({
                title: t`确认清除所有程序数据？`,
                desc: t`该操作将删除所有程序配置、游戏信息及本地数据，且无法恢复。请谨慎操作。`,
                danger: true,
                action: () => {
                  alert("清除中")
                },
              })
            }
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold gap-2"
          >
            <DatabaseBackup size={18} />
            <Trans>清除程序所有数据</Trans>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.desc}
        danger={confirm.danger}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={() => {
          confirm.action?.();
          setConfirm((c) => ({ ...c, open: false }));
        }}
      />

    </CommonCard >
  );
}
