import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots, // 确保你的 shadcn carousel 包含 dots 扩展
} from "@/components/ui/carousel"
import { Link2, Rocket } from "lucide-react"
import SuperSwitch from "@/components/SuperSwitch";

// 定义组件接收的 Props，直接使用你的 GameMeta 类型逻辑
interface DashboardToolsProps {
  companionPath: string | undefined;
  isCompanionEnabled: boolean;
  onCompanionToggle: (enabled: boolean) => void;
  quote?: { text: string; from: string };
}

export function ToolBox({
  isCompanionEnabled,
  onCompanionToggle,
}: DashboardToolsProps) {
  return (
    <div className="w-full h-full relative">
      <Carousel className="w-full h-full">
        {/* 轮播指示点放在头顶 */}
        <div className="absolute -top-10 left-0 right-0 flex justify-center">
          <CarouselDots className="bg-zinc-800/50 rounded-full px-2 py-1" />
        </div>

        <CarouselContent className="h-full! absolute w-full">
          {/* 第一页 */}
          <CarouselItem className="aspect-auto h-full basis-full w-full px-8">
            <div className="flex h-full justify-around items-center">
              <div className="flex items-center gap-2">
                <Rocket className="w-15 h-15 text-blue-400" />
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[35px]">流畅模式</span>
              </div>
              <SuperSwitch
                checked={isCompanionEnabled}
                onChange={onCompanionToggle}
              />
            </div>
          </CarouselItem>

          {/* 第二页 */}
          <CarouselItem className="aspect-auto h-full basis-full w-full px-8">
            <div className="flex h-full justify-around items-center">
              <div className="flex items-center gap-2">
                <Link2 className="w-18 h-18 text-blue-400" />
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[35px]">伴随模式</span>
              </div>
              <SuperSwitch
                checked={isCompanionEnabled}
                onChange={onCompanionToggle}
              />
            </div>
          </CarouselItem>


          {/* 第三页 */}
          <CarouselItem className="aspect-auto h-full basis-full w-full px-8">
            <div className="flex h-full justify-around items-center">
              <div className="flex items-center gap-2">
                <Link2 className="w-18 h-18 text-blue-400" />
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[35px]">伴随模式</span>
              </div>
              <SuperSwitch
                checked={isCompanionEnabled}
                onChange={onCompanionToggle}
              />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div >
  )
}

export default ToolBox
