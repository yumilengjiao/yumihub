import { ResponsiveRadar } from '@nivo/radar'

const Radar = ({ data /* see data tab */ }: any) => (
  <ResponsiveRadar /* or Radar for fixed dimensions */
    data={data}
    theme={{
      text: {
        fontSize: 30,
      }
    }}
    keys={['chardonay']}
    colors={{
      scheme: "accent"
    }}
    fillOpacity={0.9}
    indexBy="tag"
    margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
    gridLevels={3}
    gridLabelOffset={36}
    dotSize={10}
    dotColor={{ theme: 'background' }}
    dotBorderWidth={2}
    blendMode="normal"
  />
)

export default Radar
