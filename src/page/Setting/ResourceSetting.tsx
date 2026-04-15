import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { DatabaseBackup, ArchiveRestore, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import useGameStore from "@/store/gameStore"
import { Cmds } from "@/lib/enum"
import { SwitchRow, PathRow } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"
import ConfirmDialog from "@/components/common/ConfirmDialog"
import { cn } from "@/lib/utils"

interface Confirm {
  open: boolean
  title: string
  desc: string
  danger?: boolean
  action?: () => void
}

export default function ResourceSetting() {
  const { config, updateConfig } = useConfigStore()
  const { setGameMetaList } = useGameStore()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>({ open: false, title: "", desc: "" })

  const openConfirm = (opts: Omit<Confirm, "open">) =>
    setConfirm({ open: true, ...opts })

  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }))

  const runWithToast = async (cmd: string, label: string) => {
    setBusy(true)
    const tid = toast.loading(label + "...")
    try {
      await invoke(cmd)
      toast.success(label + t` 完成`, { id: tid })
    } catch (e) {
      toast.error(label + t` 失败: ` + e, { id: tid })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingSection title={t`资源下载`}>
        <SwitchRow
          label={t`自动下载封面与背景`}
          description={t`添加/更新游戏时自动从网络获取资源到本地`}
          checked={config.storage.allowDownloadingResources}
          onCheckedChange={v => updateConfig(d => { d.storage.allowDownloadingResources = v })}
        />
        <SwitchRow
          label={t`游戏结束后自动备份存档`}
          checked={config.storage.autoBackup}
          onCheckedChange={v => updateConfig(d => { d.storage.autoBackup = v })}
        />
      </SettingSection>

      <SettingSection title={t`目录设置`}>
        <PathRow
          label={t`游戏统一解压目录`}
          path={config.storage.galRootDir}
          onSelect={v => updateConfig(d => { d.storage.galRootDir = v })}
        />
        <PathRow label={t`存档备份目录`} path={config.storage.backupSavePath} readOnly />
        <PathRow label={t`游戏资源目录`} path={config.storage.metaSavePath} readOnly />
        <PathRow label={t`截图保存目录`} path={config.storage.screenshotPath} readOnly />
      </SettingSection>

      <SettingSection title={t`数据操作`}>
        <DangerButton
          icon={<DatabaseBackup size={15} />}
          label={t`一键备份所有存档`}
          busy={busy}
          variant="default"
          onClick={() => openConfirm({
            title: t`确认全量备份？`,
            desc: t`将立即备份所有设置了存档路径的游戏。`,
            action: () => runWithToast(Cmds.BACKUP_ARCHIVE, t`备份`),
          })}
        />
        <DangerButton
          icon={<ArchiveRestore size={15} />}
          label={t`一键还原所有存档`}
          busy={busy}
          variant="danger"
          onClick={() => openConfirm({
            title: t`确认全量还原？`,
            desc: t`将覆盖所有已备份游戏的本地存档，此操作不可撤销。`,
            danger: true,
            action: () => runWithToast(Cmds.RESTORE_ALL_ARCHIVES, t`还原`),
          })}
        />
        <DangerButton
          icon={<Trash2 size={15} />}
          label={t`清除全部程序数据`}
          busy={busy}
          variant="danger"
          onClick={() => openConfirm({
            title: t`确认清除所有数据？`,
            desc: t`删除所有游戏记录、配置和本地资源，此操作不可恢复。`,
            danger: true,
            action: () => {
              invoke(Cmds.CLEAR_APP_DATA)
              setGameMetaList([])
            },
          })}
        />
      </SettingSection>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.desc}
        danger={confirm.danger}
        onConfirm={() => { confirm.action?.(); closeConfirm() }}
        onCancel={closeConfirm}
      />
    </>
  )
}

function DangerButton({
  icon, label, busy, variant, onClick,
}: {
  icon: React.ReactNode
  label: string
  busy: boolean
  variant: "default" | "danger"
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "flex items-center gap-3 px-5 py-4 w-full text-left",
        "hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none"
      )}
    >
      <span className={cn(
        "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
        variant === "danger"
          ? "bg-red-50 dark:bg-red-950/30 text-red-500"
          : "bg-custom-50 dark:bg-custom-950/30 text-custom-500"
      )}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : icon}
      </span>
      <span className={cn(
        "text-sm font-semibold",
        variant === "danger" ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-200"
      )}>
        {label}
      </span>
    </button>
  )
}
