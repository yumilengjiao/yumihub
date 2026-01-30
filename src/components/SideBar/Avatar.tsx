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
    if (user?.avatar.startsWith("http://") || user?.avatar.startsWith("https://")) {
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
      "relative shrink-0 rounded-full overflow-hidden border-border/50 bg-muted shadow-inner",
      "w-16 h-16 aspect-square",
      className
    )}>
      <div className={cn(
        "h-full w-full bg-cover",
      )}
        style={{
          backgroundImage: `url(${userAvatar})`
        }}
      />
      {/* 这是一个非常细微的覆盖层，让图片更有质感 */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full" />
    </div>
  );
};
