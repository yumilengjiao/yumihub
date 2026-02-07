interface ProgressBarProps {
  label: string
  value: number
}

const ProgressBar = ({ label, value }: ProgressBarProps) => {
  // 根据数值自动计算颜色
  const getColor = (val: number) => {
    if (val > 90) return 'bg-red-500';
    if (val > 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1 text-xs font-medium text-gray-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar 
