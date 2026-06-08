import { useMemo } from "react"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { ResponsiveRadar } from "@nivo/radar"
import useGameStore from "@/store/gameStore"
import { useDarkMode } from "./useDarkMode"

export function DeveloperRadar() {
  const { gameMetaList } = useGameStore()
  const dark = useDarkMode()

  const data = useMemo(() => {
    const normalize = (name: string) => {
      const n = name.trim().toLowerCase()
      if (n.includes("key") || n.includes("visual arts")) return "Key"
      if (n.includes("yuzusoft") || n.includes("柚子")) return "Yuzusoft"
      if (n.includes("alicesoft")) return "AliceSoft"
      if (n.includes("august")) return "August"
      if (n.includes("smee")) return "SMEE"
      if (n.includes("nitroplus")) return "Nitroplus"
      return name.trim().split(/[/／、,，&|+]/)[0]?.trim() || t`未知`
    }
    const stats: Record<string, number> = {}
    gameMetaList.filter(g => g.isPassed && g.developer?.trim()).forEach(g => {
      const d = normalize(g.developer); stats[d] = (stats[d] || 0) + 1
    })
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, value]) => ({ tag, value }))
  }, [gameMetaList])

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-zinc-300 dark:text-zinc-700 font-semibold"><Trans>暂无通关数据</Trans></p>
      </div>
    )
  }

  return (
    <ResponsiveRadar
      data={data} keys={["value"]} indexBy="tag"
      margin={{ top: 48, right: 64, bottom: 30, left: 64 }}
      gridLabelOffset={14} gridLevels={3}
      fillOpacity={0.3} dotSize={6} dotBorderWidth={2}
      colors={["hsl(var(--custom-500))"]}
      dotColor={dark ? "#fff" : "hsl(var(--custom-500))"}
      dotBorderColor="hsl(var(--custom-500))"
      blendMode={dark ? "screen" : "multiply"}
      theme={{
        text: { fill: dark ? "#71717a" : "#9ca3af", fontSize: 12, fontWeight: 600 },
        grid: { line: { stroke: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" } },
        tooltip: { container: { background: dark ? "#18181b" : "#fff", color: dark ? "#fafafa" : "#18181b", fontSize: 12, borderRadius: 10 } },
      }}
    />
  )
}
