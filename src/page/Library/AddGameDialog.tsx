import { open } from '@tauri-apps/plugin-dialog';
import MainButton from "@/components/TitleBar/MainButton";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn, recognizeGame } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { PopoverContent } from "@radix-ui/react-popover";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import usePossibleGameStore from '@/store/possibleGamesStore';


export default function AddGameDialog() {
  const [readyToAddGame, setReadyToAddGame] = useState(false)
  const { possibleGames, extendPossibleGames, reset } = usePossibleGameStore()

  console.log(possibleGames)
  // 处理选择单个文件
  const handleSelectPath = async () => {
    const selected = await open({
      multiple: false,      // 是否允许多选
      directory: false,     // 是选择文件还是文件夹
    });

    if (selected) {
      const res = await recognizeGame(selected)
      extendPossibleGames(res)
      setReadyToAddGame(true)
    } else {
      console.log("用户取消了选择");
      setReadyToAddGame(false)
      reset()
    }
  };

  //处理对话框打开关闭时的逻辑
  const onOpenChange = (open: boolean) => {
    if (!open) {
      reset()
    }
    setReadyToAddGame(open)
  }
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <MainButton>
            <CirclePlus className="h-full w-auto" />
          </MainButton>
        </PopoverTrigger>
        <PopoverContent
          className=" w-64 bg-primary-foreground border-2 border-slate-950 rounded-2xl p-8 transition-all duration-300"
          align="end"
        >
          <div className="mb-2">选择导入方式</div>
          <div className="flex justify-between">
            <Dialog open={readyToAddGame} onOpenChange={onOpenChange}>
              <DialogTrigger asChild>
                <Button size="lg" onClick={handleSelectPath}>单个</Button>
              </DialogTrigger>
              <DialogPortal>
                {/* 这个 Overlay 是背后的黑色遮罩，也能帮你占满全屏 */}
                <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />

                <DialogContent className={cn(
                  "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
                  "bg-primary-foreground border border-zinc-800 shadow-2xl",
                  "max-w-none! w-[80vw] h-[70vh] rounded-2xl p-10"
                )}>
                  <DialogHeader>
                    <DialogTitle>这是全屏弹窗内容</DialogTitle>
                  </DialogHeader>
                </DialogContent>
              </DialogPortal>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg">批量</Button>
              </DialogTrigger>
              <DialogPortal>
                {/* 这个 Overlay 是背后的黑色遮罩，也能帮你占满全屏 */}
                <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />

                <DialogContent className={cn(
                  "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
                  "bg-primary-foreground border border-zinc-800 shadow-2xl",
                  "max-w-none! w-[80vw] h-[70vh] rounded-2xl p-10"
                )}>
                  <DialogHeader>
                    <DialogTitle>这是全屏弹窗内容</DialogTitle>
                  </DialogHeader>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover >
    </>
  )
}

