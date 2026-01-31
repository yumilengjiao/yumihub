import { motion, Variants } from "framer-motion";
import BaseSetting from "./BaseSetting";
import InterfaceSetting from "./InterfaceSetting";
import SysSetting from "./SysSetting";
import ResourceSetting from "./ResourceSetting";

// 容器动画：让子组件交错显现
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

// 子项动画：带一点缩放和位移，增加灵动感
const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

export default function Setting() {
  return (
    <div className="h-full w-full bg-zinc-50 overflow-y-auto pt-28 pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1300px] mx-auto px-10 grid grid-cols-12 gap-10"
      >
        {/* 左列：稍微下移，打破水平对齐的呆板 */}
        <div className="col-span-6 space-y-10 mt-12">
          <motion.div variants={itemVariants}>
            <BaseSetting />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SysSetting />
          </motion.div>
        </div>

        {/* 右列：正常起始位 */}
        <div className="col-span-6 space-y-10">
          <motion.div variants={itemVariants}>
            <InterfaceSetting />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ResourceSetting />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
