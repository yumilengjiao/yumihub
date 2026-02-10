import useSessionStore from "@/store/sessionStore"
import { ResponsiveCalendar } from '@nivo/calendar'
import { useEffect, useMemo, useState } from "react"

interface CalendarHeatMapParams {
  year: string
}

const CalendarHeatMap = ({ year }: CalendarHeatMapParams) => {
  const { sessions, fetchSessions } = useSessionStore()
  // 监听 dark 模式的状态
  const [isDark, setIsDark] = useState(false)
  const calendarData = useMemo(() => {
    const dayMap = new Map<string, number>()
    sessions.forEach((session) => {
      const dateKey = session.playDate.substring(0, 10)
      const currentMinutes = dayMap.get(dateKey) || 0
      dayMap.set(dateKey, currentMinutes + session.durationMinutes)
    })
    return Array.from(dayMap.entries()).map(([day, totalMinutes]) => ({
      day,
      // 确保是数字类型，小时数
      value: Number((totalMinutes / 60).toFixed(1))
    }))
  }, [sessions])

  useEffect(() => {
    try {
      fetchSessions(year)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    // 初始化检查
    setIsDark(document.documentElement.classList.contains("dark"))

    // 2. 监听 HTML 节点的 class 变化
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])


  return (
    <div className="w-1100 h-full">
      <ResponsiveCalendar
        data={calendarData}
        from={`${year}-01-01`}
        to={`${year}-12-31`}

        // 3. 使用 isDark 状态替代原本的判断
        emptyColor={isDark ? "#27272a" : "#f4f4f5"}
        monthBorderColor={isDark ? "#18181b" : "#ffffff"}
        dayBorderColor={isDark ? "#18181b" : "#ffffff"}

        colors={['#97e3d5', '#61cdbb', '#e8c1a0', '#f47560']}
        minValue={0}
        maxValue={8}
        margin={{ top: 40, right: 10, bottom: 10, left: 40 }}

        theme={{
          text: {
            fontSize: 14,
            // 4. 文字颜色也随状态实时变化
            fill: isDark ? "#a1a1aa" : "#71717a",
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
      />
    </div>
  )
}

export default CalendarHeatMap
