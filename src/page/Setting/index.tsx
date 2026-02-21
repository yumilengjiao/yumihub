import { motion, Variants } from "framer-motion"
import BaseSetting from "./BaseSetting"
import InterfaceSetting from "./InterfaceSetting"
import SysSetting from "./SysSetting"
import ResourceSetting from "./ResourceSetting"
import AuthSetting from "./AuthSetting"
import { useMemo } from "react"
import { convertFileSrc } from "@tauri-apps/api/core"
import useConfigStore from "@/store/configStore"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
}

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
}

export default function Setting() {
  const globalBackground = useConfigStore(state => state.config.interface.globalBackground)

  // 统一解析背景配置
  const bgConfig = useMemo(() => {
    const isStr = typeof globalBackground === "string";
    return {
      path: isStr ? globalBackground : (globalBackground?.path || ""),
      opacity: isStr ? 1 : (globalBackground?.opacity ?? 1),
      blur: isStr ? 0 : (globalBackground?.blur ?? 0)
    };
  }, [globalBackground]);

  const bgStyle = useMemo(() => {
    if (!bgConfig.path.trim()) return null;

    const blurAmount = bgConfig.blur;
    return {
      backgroundImage: `url("${convertFileSrc(bgConfig.path)}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: bgConfig.opacity,
      filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
      // 这里的 scale 动态计算：模糊越大，放大倍率稍微增加以抵消边缘缩进
      transform: blurAmount > 0 ? `scale(${1 + (blurAmount * 0.015)})` : "scale(1)",
      transition: "filter 0.3s ease, opacity 0.3s ease", // 让滑块调节时有平滑过渡感
    };
  }, [bgConfig]);

  return (
    <div className="relative h-full w-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">

      {bgStyle && (
        <div
          className="absolute inset-0 z-0 pointer-events-none will-change-[filter,transform]"
          style={bgStyle}
        />
      )}

      <div className="absolute inset-0 z-5 pointer-events-none bg-white/5 dark:bg-black/10" />

      <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-none pt-28 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1300px] mx-auto px-10 grid grid-cols-12 gap-10"
        >
          {/* 左列布局 */}
          <div className="col-span-6 space-y-10 mt-12">
            {[BaseSetting, SysSetting, AuthSetting].map((Component, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Component />
              </motion.div>
            ))}
          </div>

          {/* 右列布局 */}
          <div className="col-span-6 space-y-10">
            {[InterfaceSetting, ResourceSetting].map((Component, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Component />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
