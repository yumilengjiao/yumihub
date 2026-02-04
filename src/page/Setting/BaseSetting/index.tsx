import CommonCard from "@/components/CommonCard"
import SelectCard from "@/components/SelectCard"
import SwitchCard from "@/components/SwitchCard"
import { cn } from "@/lib/utils"
import useConfigStore from "@/store/configStore"
import { i18n } from "@lingui/core"
import { t } from "@lingui/core/macro"
import { Plus, Settings2 } from "lucide-react"
import { useState } from "react"
import { CompanionManager } from "./CompanionManager"

export default function BaseSetting() {
  // 性能优化：仅订阅需要的字段
  const basic = useConfigStore(s => s.config.basic)
  const { config, updateConfig } = useConfigStore()
  // 控制全屏对话框状态
  const [isCompanionManagerOpen, setIsCompanionManagerOpen] = useState(false)

  const updateBasic = (key: keyof typeof basic, val: any) => {
    updateConfig((draft) => {
      (draft.basic as any)[key] = val;
    });
  };

  const updateLanguage = (lang: string) => {
    updateBasic('language', lang)
    i18n.activate(lang)
  }

  const langOpt = [
    { label: "简体中文", value: "zh" },
    { label: "English", value: "en" },
    { label: "日本語", value: "ja" },
    { label: "한국인", value: "ko" }
  ];

  return (
    <CommonCard title={t`基础设置`} icon="🛠️">
      <div className="space-y-1">
        <SwitchCard
          title={t`开机自启动`}
          checked={basic.autoStart}
          onCheckedChange={(v) => updateBasic('autoStart', v)}
        />
        <SwitchCard
          title={t`静默启动`}
          checked={basic.silentStart}
          onCheckedChange={(v) => updateBasic('silentStart', v)}
        />
        <SelectCard
          title={t`语言设置 / Language`}
          value={config.basic.language}
          options={langOpt}
          onValueChange={(v) => updateLanguage(v)}
        />
        <button
          onClick={() => setIsCompanionManagerOpen(true)}
          className={cn(
            "w-full h-16 mt-4 flex items-center justify-between px-6 rounded-xl transition-all",
            "bg-white border-2 hover:border-emerald-500 text-black hover:bg-emerald-50 ",
            "active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-emerald-600" />
            <span className="text-2xl font-bold tracking-tight">{t`管理连携启动程序`}</span>
          </div>
          <Plus className="w-6 h-6 text-emerald-600" />
        </button>      </div>

      {/* 连携程序管理对话框 */}
      {isCompanionManagerOpen && (
        <CompanionManager onClose={() => setIsCompanionManagerOpen(false)} />
      )}
    </CommonCard>
  );
}


