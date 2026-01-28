interface SwitchProps {
  checked: boolean
  onChange: (checkChange: boolean) => void
}

export const SuperSwitch = ({ checked, onChange }: SwitchProps) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      // 这里的 h-10 w-20 你可以随便改，只要内部 span 比它小，且用了 flex items-center，就永远居中
      className={`
        relative flex items-center cursor-pointer rounded-full p-1 transition-all duration-300
        ${checked ? 'bg-violet-600 w-20 h-10' : 'bg-zinc-600 w-20 h-10'}
      `}
    >
      <div className={`
        bg-white rounded-full shadow-md transition-all duration-300
        ${checked ? 'translate-x-10 h-8 w-8' : 'translate-x-0 h-8 w-8'}
      `} />
    </div>
  );
};

export default SuperSwitch
