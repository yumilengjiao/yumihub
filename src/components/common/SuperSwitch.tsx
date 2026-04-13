interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  size?: "sm" | "md"
}

export function SuperSwitch({ checked, onChange, size = "md" }: SwitchProps) {
  const isLg = size === "md"
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex items-center cursor-pointer rounded-full p-1 transition-colors duration-300
        ${isLg ? "w-14 h-7" : "w-10 h-5"}
        ${checked ? "bg-custom-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
    >
      <div
        className={`bg-white rounded-full shadow-md transition-transform duration-300
          ${isLg ? "w-5 h-5" : "w-3 h-3"}
          ${checked ? (isLg ? "translate-x-7" : "translate-x-5") : "translate-x-0"}`}
      />
    </div>
  )
}

export default SuperSwitch
