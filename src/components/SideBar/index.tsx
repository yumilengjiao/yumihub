import { cn } from "@/lib/utils";
import Trigger from "./Trigger";
import { useState } from "react";

export default function index() {
  const [active, setActive] = useState(false)
  return (
    <div>
      <Trigger onEnter={() => setActive(true)} />
      <div className={cn(
        "transition-all duration-900",
        active && "fixed w-full h-full bg-background opacity-70 z-3"
      )}></div>
      <div className={cn(
        "fixed z-10 h-full w-[30vw] bg-primary-foreground rounded-tr-4xl shadow-2xl",
        "transition-all duration-300",
        active ? "translate-x-0" : "-translate-x-full"
      )}
        onMouseLeave={() => setActive(false)}
      >
      </div>
    </div >
  )
}

