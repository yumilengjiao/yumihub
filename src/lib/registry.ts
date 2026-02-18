/**
 * @module 组件注册表，用于注册所有支持自定义主题的组件
 */

import SurfaceBase from "@/components/custom/Surface";
import GameShelf from "@/components/custom/GameShelf";
import { Background } from "@/components/custom/Background";
import { ThemeComponentProps } from "@/types/node";
import AppButton from "@/components/custom/AppButton";
import AppIcon from "@/components/custom/AppIcon";
import MainContentSlot from "@/components/custom/MainContnetSlot";
import SideBar from "@/components/custom/Sidebar";
import TitleBar from "@/components/custom/TitleBar";
import Entry from "@/components/custom/Entry";
import { Avatar } from "@/components/custom/Avatar";
import WindowToggleIcon from "@/components/custom/WindowToogleButton";
import Title from "@/components/custom/Title";


export const COMPONENT_MAP: Record<string, React.FC<ThemeComponentProps>> = {
  // 基础形态
  'node': SurfaceBase,

  // 容器形态
  'row': SurfaceBase,
  'col': SurfaceBase,
  'sidebar': SideBar,
  'background': Background,
  'page': MainContentSlot,
  'titlebar': TitleBar,

  // 业务形态
  'appbutton': AppButton,
  'appicon': AppIcon,
  'avatar': Avatar,
  'chart': SurfaceBase,
  'entry': Entry,
  'gameshelf': GameShelf,
  'title': Title,
  'windowtoggleicon': WindowToggleIcon,
}
