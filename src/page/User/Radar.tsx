import useGameStore from '@/store/gameStore'
import { Trans } from '@lingui/react/macro'
import { ResponsiveRadar } from '@nivo/radar'
import { useMemo, useState, useEffect } from 'react'
import { t } from '@lingui/core/macro'

const Radar = () => {
  const { gameMetaList } = useGameStore()

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const radarData = useMemo(() => {
    const passedGames = gameMetaList.filter(game => game.isPassed && game.developer?.trim());
    const normalizeDeveloper = (name: string): string => {
      const cleanName = name.trim();
      const lowerName = cleanName.toLowerCase();
      if (lowerName.includes('key') || lowerName.includes('visual arts')) return 'Key';
      if (lowerName.includes('yuzusoft') || lowerName.includes('柚子')) return 'Yuzusoft';
      if (lowerName.includes('alicesoft')) return 'AliceSoft';
      if (lowerName.includes('august')) return 'August';
      if (lowerName.includes('smee')) return 'SMEE';
      if (lowerName.includes('hooksoft')) return 'Hooksoft';
      if (lowerName.includes('nitroplus')) return 'Nitroplus';
      const separators = /[/／、,，&|+]/;
      return cleanName.split(separators).map(s => s.trim())[0] || t`未知制作商`;
    };

    const stats: Record<string, number> = {};
    passedGames.forEach(game => {
      const normalizedDev = normalizeDeveloper(game.developer!);
      stats[normalizedDev] = (stats[normalizedDev] || 0) + 1;
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ tag: name, value: count }));
  }, [gameMetaList]);

  if (radarData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/30 font-black">
        <Trans>暂无通关制作商数据</Trans>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full">
        <ResponsiveRadar
          data={radarData}
          keys={['value']}
          indexBy="tag"
          margin={{ top: 60, right: 60, bottom: 30, left: 60 }}
          gridLabelOffset={12}

          theme={{
            text: {
              fill: isDark ? "#a1a1aa" : "#3f3f46", // zinc-400 : zinc-700
              fontWeight: 600
            },
            grid: {
              line: {
                stroke: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                strokeWidth: 1
              }
            },
            tooltip: {
              container: {
                background: isDark ? "#18181b" : "#ffffff",
                color: isDark ? "#fafafa" : "#18181b",
                fontSize: "12px",
                borderRadius: "8px",
              },
            },
          }}

          gridLevels={3}
          fillOpacity={0.4}
          colors={isDark ? ['#10b981'] : ['#059669']} // 暗色深绿，亮色稍微浅一点
          blendMode={isDark ? "screen" : "multiply"} // 混合模式根据模式切换

          dotSize={6}
          dotColor={isDark ? "#10b981" : "#ffffff"}
          dotBorderWidth={2}
          dotBorderColor={isDark ? "#ffffff" : "#059669"}

          isInteractive={true}
          animate={true}
        />
      </div>
    </div>
  )
}

export default Radar
