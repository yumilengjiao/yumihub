import CommonCard from '@/components/CommonCard'
import useConfigStore from '@/store/configStore'
import { t } from '@lingui/core/macro'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Trans } from '@lingui/react/macro'

export default function AuthSetting() {
  const { config, updateConfig } = useConfigStore()
  const [isVisible, setIsVisible] = useState(false)

  const token = config.auth.bangumiToken || ''

  const handleTokenChange = (val: string) => {
    updateConfig((prev) => {
      if (!prev.auth) prev.auth = { bangumiToken: "" }
      prev.auth.bangumiToken = val
    })
  }

  return (
    <CommonCard
      title={t`权限相关`}
      icon="🔑"
      className="dark:bg-zinc-800 backdrop-blur-md border-black/5 dark:border-white/10 shadow-lg"
    >
      <div className="space-y-4 p-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            Bangumi Access Token
          </label>

          <div className="relative group">
            <input
              type={isVisible ? "text" : "password"}
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder={t`在此粘贴你的个人令牌...`}
              className="w-full bg-slate-100 dark:bg-zinc-700 border-none rounded-xl py-3 pl-4 pr-12 text-sm font-mono focus:ring-2 focus:ring-custom-500 transition-all text-slate-800 dark:text-zinc-200"
            />

            <button
              onClick={() => setIsVisible(!isVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-custom-500 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all"
              title={isVisible ? t`隐藏` : t`显示`}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed px-1">
            <Trans>用于访问敏感条目。你可以在 Bangumi 设置 - 开发者平台中生成此令牌。</Trans>
          </p>
        </div>
      </div>
    </CommonCard>
  )
}
