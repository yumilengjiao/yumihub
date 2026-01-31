import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputCardProps {
  title: string;
  description?: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function InputCard({ title, description, value, placeholder, onChange, className }: InputCardProps) {
  return (
    <div className={cn("flex items-center justify-between gap-12 p-8 transition-all", className)}>
      <div className="flex flex-col space-y-2">
        <Label className="text-[32px] font-black tracking-tight text-zinc-900 leading-none">
          {title}
        </Label>
        {description && <p className="text-xl text-zinc-500 font-medium">{description}</p>}
      </div>

      <div className="relative flex-1 max-w-100">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-24 w-full border-none bg-zinc-100/80 rounded-[28px] px-10",
            "text-[28px] font-bold text-violet-600 placeholder:text-zinc-400",
            "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-zinc-200/50 transition-colors",
            "text-right"
          )}
        />
      </div>
    </div>
  );
}
