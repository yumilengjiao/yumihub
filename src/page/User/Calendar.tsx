import useSessionStore from "@/store/sessionStore";
import { ResponsiveCalendar } from '@nivo/calendar'
import { useEffect, useMemo } from "react";

interface CalendarHeatMapParams {
  year: string
}

const CalendarHeatMap = ({ year }: CalendarHeatMapParams) => {
  const { sessions, fetchSessions } = useSessionStore()

  const calendarData = useMemo(() => {
    const dayMap = new Map<string, number>();
    sessions.forEach((session) => {
      const dateKey = session.playDate.substring(0, 10);
      const currentMinutes = dayMap.get(dateKey) || 0;
      dayMap.set(dateKey, currentMinutes + session.durationMinutes);
    });
    return Array.from(dayMap.entries()).map(([day, totalMinutes]) => ({
      day,
      // 确保是数字类型，小时数
      value: Number((totalMinutes / 60).toFixed(1))
    }));
  }, [sessions]);

  useEffect(() => {
    try {
      fetchSessions(year)
    } catch (error) {
      console.error(error)
    }
  }, [])


  return (
    <div className="w-1100 h-full">
      <ResponsiveCalendar
        data={calendarData}
        from="2026-01-01"
        to="2026-12-31"
        emptyColor="#eeeeee"
        colors={['#97e3d5', '#61cdbb', '#e8c1a0', '#f47560']}

        // --- 核心修复：手动指定值范围 ---
        minValue={0}
        maxValue={8} // 超过 8 小时就显示最深的红色

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
}

export default CalendarHeatMap
