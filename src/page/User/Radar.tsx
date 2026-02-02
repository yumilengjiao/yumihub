import useGameStore from '@/store/gameStore'
import { ResponsiveRadar } from '@nivo/radar'
import { useMemo } from 'react'

const Radar = () => {
  const { gameMetaList } = useGameStore()

  const radarData = useMemo(() => {
    // 1. 过滤掉未通关或没有制作商的游戏
    const passedGames = gameMetaList.filter(game => game.isPassed && game.developer?.trim());

    // 2. 针对 Galgame 厂商的归一化逻辑
    const normalizeDeveloper = (name: string): string => {
      const cleanName = name.trim();
      const lowerName = cleanName.toLowerCase();

      // --- 核心品牌归一化 (根据你的 Galgame 库偏好可自行增减) ---

      // Visual Arts 系 (Key, Saga Planets 等)
      if (lowerName.includes('key') || lowerName.includes('visual arts') || lowerName.includes('visualarts')) {
        return 'Key';
      }

      // 柚子社
      if (lowerName.includes('yuzusoft') || lowerName.includes('柚子')) {
        return 'Yuzusoft';
      }

      // AliceSoft
      if (lowerName.includes('alicesoft') || lowerName.includes('アリスソフト')) {
        return 'AliceSoft';
      }

      // August (八月社)
      if (lowerName.includes('august') || lowerName.includes('オーガスト')) {
        return 'August';
      }

      if (lowerName.includes('smee')) return 'SMEE';
      if (lowerName.includes('hooksoft')) return 'Hooksoft';

      // Nitroplus
      if (lowerName.includes('nitroplus') || lowerName.includes('nitro+')) {
        return 'Nitroplus';
      }

      // --- 通用拆分逻辑 ---
      // 如果没命中上面的大厂映射，则按符号拆分取第一个
      // 例如 "EUREKA ViEW／Marmalade" -> "EUREKA ViEW"
      const separators = /[/／、,，&|+]/;
      const parts = cleanName.split(separators).map(s => s.trim());

      return parts[0] || "未知制作商";
    };

    // 3. 统计
    const stats: Record<string, number> = {};
    passedGames.forEach(game => {
      const normalizedDev = normalizeDeveloper(game.developer!);
      stats[normalizedDev] = (stats[normalizedDev] || 0) + 1;
    });

    // 4. 转换数据
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        tag: name,
        value: count,
      }));
  }, [gameMetaList]);

  // 防止数据为空时雷达图崩溃
  if (radarData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/20 font-black">
        暂无通关厂商数据
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
          margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
          gridLabelOffset={12}
          theme={{
            text: { fill: "#ffffff", fontWeight: 900 },
            axis: {
              ticks: {
                text: {
                  fill: "#ffffff",
                  fontSize: 10,
                  textShadow: "0 0 10px rgba(16,185,129,0.4), 1px 1px 2px rgba(0,0,0,0.8)"
                }
              }
            },
            grid: {
              line: { stroke: "rgba(255, 255, 255, 0.1)", strokeWidth: 1 }
            }
          }}
          gridLevels={2}
          fillOpacity={0.5}
          colors={['#10b981']}
          blendMode="screen"
          dotSize={8}
          dotColor="#ffffff"
          dotBorderWidth={2}
          dotBorderColor="#10b981"
          isInteractive={true}
          animate={true}
        />
      </div>
    </div>
  )
}

export default Radar
