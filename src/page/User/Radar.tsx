import { ResponsiveRadar } from '@nivo/radar'

const Radar = ({ data }: any) => (
  /* 1. 容器层：关键是 h-full 和 flex 居中 */
  /* 请确保这个容器的父级有固定高度（比如 h-[400px]） */
  <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[300px]">

    {/* 2. 绘图层：强制高度 100% */}
    <div className="w-full h-full relative">
      <ResponsiveRadar
        data={data}
        theme={{
          text: {
            fontSize: 12,
            fontWeight: 600,
          }
        }}
        keys={['chardonay']}
        indexBy="tag"

        /* 3. 核心修正：margin 必须非常小！ */
        /* 之前不居中是因为 margin 占了太多垂直空间，
           我们要把 top 和 bottom 压到最小，让图表自己去撑开 */
        margin={{ top: 30, right: 45, bottom: 30, left: 45 }}

        /* 4. 标签偏移：也要小，防止撑大 viewBox 导致偏移 */
        gridLabelOffset={10}

        /* 5. 其他配置保持饱满 */
        gridLevels={3}
        fillOpacity={0.7}
        colors={{ scheme: "accent" }}
        dotSize={6}
        blendMode="normal"

        // 强制让它在容器内自适应中心
        isInteractive={true}
        animate={true}
      />
    </div>
  </div>
)

export default Radar
