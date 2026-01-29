import { Expand, LampCeiling, Minimize2, Minus, X } from "lucide-react";
import MainButton from "./MainButton";
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { cn } from "@/lib/utils";
import { ButtonGroupSeparator } from "./ButtonGroupSeparator";
import { useEffect, useState } from "react";

const minisizeWindow = (window: Window) => {
  window.minimize()
}
const toogleMaximizeWindow = (window: Window) => {
  window.toggleMaximize()
}
const closeWindow = (window: Window) => {
  window.close()
}
const switchTheme = () => {
  const html = document.documentElement
}


export default function index() {
  const [isMax, setIsMax] = useState(false)

  const appWindow = getCurrentWindow()

  useEffect(() => {
    // 定义一个更新状态的函数
    const updateIsMax = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMax(maximized);
    };

    // 初始化检查一次
    updateIsMax();

    //  监听窗口大小改变事件
    // 无论是手动拖拽还是点击按钮，只要窗口大小变了就重新检测
    const unlisten = appWindow.onResized(() => {
      updateIsMax();
    });

    // 监听最大化事件
    const unlistenMax = appWindow.onResized(() => {
      updateIsMax();
    });

    return () => {
      // 组件卸载时取消监听
      unlisten.then(f => f());
    };
  }, []);

  return (
    <div className="fixed w-full h-[5vh] z-10 flex justify-end cursor-pointer" data-tauri-drag-region >
      <div className={cn(
        "relative flex justify-end pl-8 pr-5 rounded-bl-[70px]",
        "bg-background/40 backdrop-blur-sm cursor-default"
      )}>
        <MainButton onClick={() => alert("nihao")}>
          <LampCeiling className="h-full w-auto block" />
        </MainButton>

        <ButtonGroupSeparator />
        <MainButton onClick={() => minisizeWindow(appWindow)}>
          <Minus className="h-full w-auto block" />
        </MainButton>

        <ButtonGroupSeparator />
        {!isMax
          ?
          <MainButton onClick={() => {
            toogleMaximizeWindow(appWindow)
          }} >
            <Expand className="h-full w-auto block" />
          </MainButton>
          :
          <MainButton onClick={() => {
            toogleMaximizeWindow(appWindow)
          }} >
            <Minimize2 className="h-full w-auto block" />
          </MainButton>
        }

        <ButtonGroupSeparator />
        <MainButton onClick={() => closeWindow(appWindow)} >
          <X className="h-full w-auto block" />
        </MainButton>

      </div>
    </div>
  )
}

