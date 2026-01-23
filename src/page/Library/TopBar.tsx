import MainButton from "@/components/TitleBar/MainButton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowDownWideNarrow, CirclePlus, Search, Trash } from "lucide-react";

export default function TopBar() {
  return (
    <div className="h-full w-full flex justify-end px-15 pt-10 items-end">
      <Input placeholder="游戏名..." className={cn(
        "p-0 h-full rounded-none text-right text-5xl! w-xs border-0 border-b-black! border-b-2!"
      )} />
      <MainButton>
        <Search className="h-full w-auto" />
      </MainButton>
      <MainButton>
        <ArrowDownWideNarrow className="h-full w-auto" />
      </MainButton>
      <MainButton>
        <CirclePlus className="h-full w-auto" />
      </MainButton>
      <MainButton>
        <Trash className="h-full w-auto" />
      </MainButton>
    </div>
  )
}

