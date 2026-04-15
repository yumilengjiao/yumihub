import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import { TokenRow } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"

export default function AuthSetting() {
  const { config, updateConfig } = useConfigStore()

  return (
    <SettingSection
      title="Bangumi"
      description={t`用于访问敏感条目，可在 Bangumi 开发者平台生成`}
    >
      <TokenRow
        label="Access Token"
        value={config.auth.bangumiToken}
        placeholder={t`在此粘贴你的个人令牌...`}
        onChange={v => updateConfig(d => { d.auth.bangumiToken = v })}
      />
    </SettingSection>
  )
}
