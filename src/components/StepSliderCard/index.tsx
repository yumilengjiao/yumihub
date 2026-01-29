import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StepSliderCardProps {
  title: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}

export default function StepSliderCard({
  title,
  description,
  value,
  min = 1,
  max = 100,
  step = 1,
  unit = "",
  onChange,
  className
}: StepSliderCardProps) {
  return (
    <div className={cn("flex items-center justify-between gap-12 p-6 transition-all", className)}>
      {/* 左侧：文字描述 */}
      <div className="flex flex-col space-y-2 shrink-0">
        <Label className="text-4xl font-black tracking-tight text-zinc-900">
          {title}
        </Label>
        {description && (
          <p className="text-xl text-zinc-500 font-medium">{description}</p>
        )}
      </div>

      {/* 右侧：数值 + 滑动条 */}
      <div className="flex flex-1 items-center justify-end gap-10 max-w-[600px]">
        {/* 数字展示区：随着滑动实时变化 */}
        <div className="flex flex-col items-end min-w-[120px]">
          <span className="text-[40px] font-black text-violet-400 leading-none">
            {value}
            <span className="text-xl ml-1 text-zinc-400 font-medium">{unit}</span>
          </span>
        </div>

        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(vals) => onChange(vals[0])}
          className={cn(
            "relative flex items-center select-none touch-none w-full group cursor-pointer",
            "**:[data-orientation=horizontal]:h-4",
            "[&_.relative]:h-4 [&_span[role=slider]]:h-10 [&_span[role=slider]]:w-10",
            "[&_span[role=slider]]:border-4 [&_span[role=slider]]:border-white",
            "[&_span[role=slider]]:shadow-xl [&_span[role=slider]]:bg-violet-600"
          )}
        />
      </div>
    </div>
  );
}
