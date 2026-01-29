import { cn } from "@/lib/utils";
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"
import useUserStore from "@/store/userStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

interface AvatarProps {
  src?: string;
  className?: string;
}

export const Avatar = ({ src, className }: AvatarProps) => {
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
        setUserAvatar("")
      }
    }
  }, [user])
  return (
    <div className={cn(
      "relative shrink-0 rounded-full overflow-hidden border-border/50 bg-muted shadow-inner",
      "w-16 h-16 aspect-square", // 默认大小
      className
    )}>
      {src ? (
        <img
          src={src}
          alt="User"
          className="h-full w-full object-cover"
        />
      ) : (
        /* 如果没图，显示一个默认的灰色背景 */
        <div className={cn(
          "h-full w-full bg-cover",
        )}
          style={{ backgroundImage: `url(${userAvatar})` || `url(${defaultAvatar})` }}
        />
      )}

      {/* 这是一个非常细微的覆盖层，让图片更有质感 */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full" />
    </div>
  );
};
