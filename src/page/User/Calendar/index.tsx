import { ResponsiveCalendar } from '@nivo/calendar'

// 模拟数据：[{ day: 'YYYY-MM-DD', value: number }]
const data = [
  { day: '2026-01-02', value: 100 },
  { day: '2026-01-15', value: 250 },
  { day: '2026-01-15', value: 350 },
  // ...更多数据
]

const CalendarHeatMap = () => (
  <div className="w-1100 h-full">
    <ResponsiveCalendar
      data={data}
      from="2026-01-01"
      to="2026-12-31"
      emptyColor="#eeeeee"
      colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
      /* 这里的 margin 很重要，如果设为 0，月份文字可能会被切掉 */
      margin={{ top: 40, right: 10, bottom: 10, left: 40 }}
      yearSpacing={40}
      monthBorderColor="#ffffff"
      monthBorderWidth={6}
      dayBorderWidth={2}
      dayBorderColor="#ffffff"
      theme={{
        text: {
          fontSize: 40
        }
      }}
    />
  </div>
)
export default CalendarHeatMap
