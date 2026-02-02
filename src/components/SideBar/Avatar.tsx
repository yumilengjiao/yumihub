import { cn } from "@/lib/utils";
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"
import useUserStore from "@/store/userStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

interface AvatarProps {
  className?: string;
}

export const Avatar = ({ className }: AvatarProps) => {
  const { user } = useUserStore()
  const [userAvatar, setUserAvatar] = useState<string>("")
  useEffect(() => {
    if (user?.avatar?.startsWith("http://") || user?.avatar?.startsWith("https://")) {
      setUserAvatar(user.avatar)
    } else {
      if (user?.avatar) {
        setUserAvatar(convertFileSrc(user.avatar))
        console.log(user.avatar)
      } else {
        setUserAvatar(defaultAvatar)
      }
    }
  }, [user])
  return (
    <div className={cn(
      "relative shrink-0 rounded-3xl overflow-hidden bg-zinc-200 shadow-inner",
      "ring-4 ring-white/50",
      className
    )}>
      <div
        className="h-full w-full bg-cover bg-center transition-transform duration-700 hover:scale-110"
        style={{ backgroundImage: `url(${userAvatar})` }}
      />
    </div>
  )
};
