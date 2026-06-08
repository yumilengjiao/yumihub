import { useEffect, useMemo } from "react"
import { ResponsiveCalendar } from "@nivo/calendar"
import useSessionStore from "@/store/sessionStore"
import { useDarkMode } from "./useDarkMode"

export function ActivityHeatmap({ year }: { year: string }) {
  const { sessions, fetchSessions } = useSessionStore()
  const dark = useDarkMode()

  useEffect(() => { fetchSessions(year) }, [year])

  const data = useMemo(() => {
    const map = new Map<string, number>()
    sessions.forEach(s => {
      const k = s.playDate.substring(0, 10)
      map.set(k, (map.get(k) || 0) + s.durationMinutes)
    })
    return Array.from(map.entries()).map(([day, m]) => ({ day, value: +(m / 60).toFixed(1) }))
  }, [sessions])

  return (
    <div className="w-[1100px] h-full">
      <ResponsiveCalendar
        data={data}
        from={`${year}-01-01`} to={`${year}-12-31`}
        emptyColor={dark ? "#27272a" : "#f4f4f5"}
        monthBorderColor={dark ? "#09090b" : "#ffffff"}
        dayBorderColor={dark ? "#09090b" : "#ffffff"}
        colors={["#97e3d5", "#61cdbb", "#e8c1a0", "#f47560"]}
        minValue={0} maxValue={8}
        margin={{ top: 36, right: 10, bottom: 10, left: 44 }}
        theme={{
          text: { fontSize: 13, fill: dark ? "#71717a" : "#a1a1aa" },
          tooltip: { container: { background: dark ? "#18181b" : "#fff", color: dark ? "#fafafa" : "#18181b", fontSize: 13, borderRadius: 10 } },
        }}
      />
    </div>
  )
}
