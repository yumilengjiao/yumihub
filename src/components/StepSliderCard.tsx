import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function StepSliderCard({ title, description, value, min = 1, max = 100, step = 1, unit = "", onChange, className }: any) {
  return (
    <div className={cn("flex items-center justify-between gap-8 p-6 rounded-[24px] hover:bg-zinc-50 transition-all", className)}>
      <div className="flex flex-col space-y-1 shrink-0">
        <Label className="text-2xl font-bold tracking-tight text-zinc-900">{title}</Label>
        {description && <p className="text-sm text-zinc-500 font-medium">{description}</p>}
      </div>

      <div className="flex flex-1 items-center justify-end gap-8 max-w-[400px]">
        <span className="text-3xl font-black text-amber-500 min-w-[60px] text-right">
          {value}<span className="text-sm ml-1 text-zinc-400">{unit}</span>
        </span>
        <Slider
          value={[value]} min={min} max={max} step={step}
          onValueChange={(vals) => onChange(vals[0])}
          className="relative flex items-center w-full h-4 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white"
        />
      </div>
    </div>
  );
}
