/**
 * @module 组件注册表，用于注册所有支持自定义主题的组件
 */

import SurfaceBase from "@/layout/Surface";
import GameShelf from "@/page/Home/Custom/GameShelf";
import { Background } from "@/page/Home/Custom/Background";
import { ThemeComponentProps } from "@/types/node";
import AppButton from "@/page/Home/Custom/AppButton";
import AppIcon from "@/page/Home/Custom/AppIcon";
import MainContentSlot from "@/layout/MainContnetSlot";
import SideBar from "@/layout/Sidebar";


export const COMPONENT_MAP: Record<string, React.FC<ThemeComponentProps>> = {
  // 基础形态
  'node': SurfaceBase,

  // 容器形态
  'row': SurfaceBase,
  'col': SurfaceBase,
  'sidebar': SideBar,
  'background': Background,
  'page': MainContentSlot,


  // 业务形态
  'appbutton': AppButton,
  'appicon': AppIcon,
  'chart': SurfaceBase,
  'gameshelf': GameShelf,
};
