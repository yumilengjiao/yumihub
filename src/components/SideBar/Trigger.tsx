interface TriggerProps {
  onEnter: () => void
}
export default function Trigger({ onEnter }: TriggerProps) {
  return (
    <div
      className="fixed left-0 top-0 h-full w-4 z-[60] group"
      onMouseEnter={onEnter}
    >
      {/* 视觉提示条 */}
      <div className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-400/20 to-transparent" />
    </div>
  )
}
