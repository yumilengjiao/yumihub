import { open } from '@tauri-apps/plugin-dialog';
import MainButton from "@/components/TitleBar/MainButton";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { PopoverContent } from "@radix-ui/react-popover";
import { CirclePlus } from "lucide-react";
import { useState } from "react";

export default function AddGameDialog() {
  const [readyToAddGame, setReadyToAddGame] = useState(true)
  const handleSelectPath = async () => {
    alert("打开系统选择框")
    // 唤起原生对话框
    const selected = await open({
      multiple: false,      // 是否允许多选
      directory: true,     // 是选择文件还是文件夹 (选游戏 exe 就设为 false)
    });

    if (selected) {
      console.log("用户选择了路径:", selected);
      // selected 返回的是文件的绝对路径字符串（单选）或数组（多选）
    } else {
      console.log("用户取消了选择");
    }
  };
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
            <Dialog>
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
      </Popover>
    </>
  )
}

