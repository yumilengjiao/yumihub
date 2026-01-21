import { useEffect, useState } from "react"
import { Card, CardContent } from "../ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../ui/carousel"
import { cn } from "@/lib/utils"
export const GameList = (props: {}) => {
  // ... 在你的组件内部
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState(0)

  console.log(currentIndex)
  useEffect(() => {
    if (!api) return
    // 监听滚动事件
    api.on("select", () => {
      // selectedScrollSnap() 会返回当前对齐在“激活位置”的索引
      // setCurrentIndex(api.selectedScrollSnap())
    })
  }, [api])
  return (
    <div className="overflow-hidden">
      {/* 总宽大小 */}
      <Carousel
        opts={{
          dragFree: true,
          align: "start",
          duration: 60,
          containScroll: false,
        }}
        className="pl-4"
        setApi={setApi}
      >
        {/* 可视大小 */}
        <CarouselContent className="items-end w-screen">
          {Array.from({ length: 20 }).map((_, index) => (
            <CarouselItem
              key={index}
              className={cn(
                "duration-300", // 动画放在这里
                "aspect-165/225",
                "rounded-b-2xl lg:basis-1/6 pl-4",
              )}
              onClick={(_) => {
                setCurrentIndex(index)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "bg-amber-950 object-cover border-none",
                "aspect-165/225  min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex != index && "scale-80"
              )}>
                <CardContent className=" flex aspect-square items-center justify-center">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div >
  )
}
