interface SwitchProps {
  checked: boolean
  onChange: (checkChange: boolean) => void
}

export const SuperSwitch = ({ checked, onChange }: SwitchProps) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`relative flex items-center cursor-pointer rounded-full p-1.5 transition-all duration-300 w-20 h-10 ${checked ? 'bg-custom-500' : 'bg-zinc-300'}`}
    >
      <div className={`bg-white rounded-full shadow-lg transition-all duration-300 h-7 w-7 ${checked ? 'translate-x-10' : 'translate-x-0'}`} />
    </div>
  )
}
export default SuperSwitch
