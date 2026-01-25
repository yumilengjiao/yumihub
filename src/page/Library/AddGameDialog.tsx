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
import usePendingGamesStore from '@/store/pendingGamesStore';
import { invoke } from '@tauri-apps/api/core';
import { Cmds } from '@/lib/enum';
import PendingCard from '@/components/PendingGameCard';
import BigPendingCard from '@/components/BigPendingCard';

export default function AddGameDialog() {
  // 控制单个按钮的弹框
  const [readyToAddGameFirst, setReadyToAddGameFirst] = useState(false)
  // 控制批量按钮的弹框
  const [readyToAddGameSecond, setReadyToAddGameSecond] = useState(false)
  const { pendingGames, readyGames, extendPendingGames, reset, resetReadyGames } = usePendingGamesStore()

  // 处理选择单个文件
  const handleOneGame = async () => {
    const selected = await open({
      multiple: false,      // 是否允许多选
      directory: false,     // 是选择文件还是文件夹
      title: '请选择对应目录',
    });

    if (selected) {
      const res = await recognizeGame(selected, 0)
      extendPendingGames(res)
      setReadyToAddGameFirst(true)
    } else {
      console.log("用户取消了选择");
      setReadyToAddGameFirst(false)
      reset()
    }
  }

  // 处理选择多个文件
  const handleMutiGames = async () => {
    const selected = await open({
      multiple: true,      // 是否允许多选
      directory: true,     // 是选择文件还是文件夹
      title: '请选择对应目录',
    });
    // 判空检查
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      setReadyToAddGameSecond(false)
      return;
    }

    // 确保 selected 是数组（Tauri 单选返回字符串，多选返回数组）
    const paths = Array.isArray(selected) ? selected : [selected];

    if (paths.length <= 1) {
      alert("请选择1个以上的游戏")
      console.error("选择了小于等于1个游戏");
      setReadyToAddGameSecond(false)
      return;
    }

    for (const absPath of paths) {
      const res = await recognizeGame(absPath, 1);
      extendPendingGames(res);
      setReadyToAddGameSecond(true);
    }
  }

  //处理对话框打开关闭时的逻辑
  const onOpenChangeFirst = (open: boolean) => {
    if (!open) {
      reset()
    }
    setReadyToAddGameFirst(open)
  }
  const onOpenChangeSecond = (open: boolean) => {
    if (!open) {
      reset()
    }
    setReadyToAddGameSecond(open)
  }

  // mode用于告知是哪个Dialog需要关闭
  const saveData = async (mode: number) => {
    await invoke(Cmds.UPDATE_GAME_META_LIST, {
      games: readyGames
    })
    resetReadyGames()
    switch (mode) {
      // 1代表关闭第一个Dialog
      case 1:
        onOpenChangeFirst(false)
        break
      // 2代表关闭第二个Dialog
      case 2:
        onOpenChangeSecond(false)
        break
    }
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
            <Dialog open={readyToAddGameFirst} onOpenChange={onOpenChangeFirst}>
              <DialogTrigger asChild>
                <Button size="lg" onClick={handleOneGame}>单个</Button>
              </DialogTrigger>
              <DialogPortal>
                <DialogOverlay className="fixed inset-0 bg-black/50 z-30" />
                <DialogContent className={cn(
                  "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
                  "bg-primary-foreground border border-zinc-800 shadow-2xl",
                  "max-w-none! w-[80vw] h-[70vh] rounded-2xl p-6"
                )}>
                  <DialogHeader>
                    <DialogTitle>导入游戏</DialogTitle>
                  </DialogHeader>
                  {pendingGames[0] && <BigPendingCard data={pendingGames[0]}></BigPendingCard>}
                  <div className='flex gap-2 justify-end pb-2 pr-2 absolute bottom-3 right-6'>
                    <Button size={"lg"} onClick={() => onOpenChangeFirst(false)}>取消</Button>
                    <Button size={"lg"} onClick={() => saveData(1)}>确定</Button>
                  </div>
                </DialogContent>
              </DialogPortal>
            </Dialog>
            <Dialog open={readyToAddGameSecond} onOpenChange={onOpenChangeSecond}>
              <DialogTrigger asChild>
                <Button size="lg" onClick={handleMutiGames}>批量</Button>
              </DialogTrigger>
              <DialogPortal>
                <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
                <DialogContent className={cn(
                  "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
                  "bg-primary-foreground border border-zinc-800 shadow-2xl",
                  "max-w-none! w-[80vw] h-[70vh] rounded-2xl p-6"
                )}>
                  <DialogHeader>
                    <DialogTitle>候选游戏</DialogTitle>
                  </DialogHeader>
                  <div className='w-full h-full bg-slate-300 overflow-y-scroll'>
                    <div className='aspect-auto'>
                      {pendingGames.map((pendingGame, index) => {
                        return <PendingCard key={index} data={pendingGame}></PendingCard>
                      })}
                    </div>
                  </div>
                  <Button className='absolute right-28 bottom-3' size={"lg"} onClick={() => onOpenChangeSecond(false)}>取消</Button>
                  <Button className='absolute right-6 bottom-3' size={"lg"} onClick={() => saveData(2)}>保存</Button>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover >
    </>
  )
}
