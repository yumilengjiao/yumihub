interface TriggerProps {
  onEnter: () => void
}
export default function Trigger({ onEnter }: TriggerProps) {
  return (
    <div className="fixed h-[60vh] w-[3vw] left-0 z-1" onMouseEnter={() => onEnter()}></div>
  )
}

