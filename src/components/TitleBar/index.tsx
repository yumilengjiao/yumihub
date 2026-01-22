import { Expand, Minimize2, Minus, X } from "lucide-react";
import MainButton from "./MainButton";
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { cn } from "@/lib/utils";
import { ButtonGroupSeparator } from "./ButtonGroupSeparator";

const minisizeWindow = (window: Window) => {
  window.minimize()
}
const toogleMaximizeWindow = (window: Window) => {
  window.toggleMaximize()
}
const closeWindow = (window: Window) => {
  window.close()
}

export default function index() {

  const appWindow = getCurrentWindow()
  return (
    <div className="fixed w-full h-[7vh] z-10 flex justify-end cursor-pointer" data-tauri-drag-region >
      <div className={cn(
        "relative flex gap-4 justify-end pl-10 pr-6 rounded-bl-[70px]",
        "bg-background/40 backdrop-blur-sm cursor-default"
      )}>
        <MainButton onClick={() => minisizeWindow(appWindow)} className="cursor-pointer">
          <Minus className="h-full w-auto block" />
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={() => toogleMaximizeWindow(appWindow)} className="cursor-pointer">
          <Expand className="h-full w-auto" />
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={() => toogleMaximizeWindow(appWindow)} className="cursor-pointer">
          <Minimize2 className="h-full w-auto" />
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={() => closeWindow(appWindow)} className="cursor-pointer">
          <X className="h-full w-auto" />
        </MainButton>
      </div>
    </div>
  )
}

