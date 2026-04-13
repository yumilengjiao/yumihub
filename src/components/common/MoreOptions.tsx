import React, { useState, useEffect, useRef } from "react"
import { MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface Entry {
  entryName: string
  entryFunc: () => void
}

interface MoreOptionsProps {
  entries?: Entry[]
  className?: string
}

const MoreOptions: React.FC<MoreOptionsProps> = ({ entries, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
      >
        <MoreVertical size={16} className="text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-[100] overflow-hidden border border-white/20 dark:border-zinc-700">
          <div className="py-1">
            {entries?.map((entry) => (
              <button
                key={entry.entryName}
                onClick={() => {
                  entry.entryFunc()
                  setIsOpen(false)
                }}
                className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                {entry.entryName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MoreOptions
