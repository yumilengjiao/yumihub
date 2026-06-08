/**
 * @module 组件注册表，用于注册所有支持自定义主题的组件
 */

import GameShelf from "@/components/custom/GameShelf";
import { Background } from "@/components/custom/Background";
import type { ThemeComponentProps } from "@/types/node";
import AppButton from "@/components/custom/AppButton";
import AppIcon from "@/components/custom/AppIcon";
import MainContentSlot from "@/components/custom/MainContentSlot";
import Sidebar from "@/components/custom/Sidebar";
import TitleBar from "@/components/custom/TitleBar";
import Entry from "@/components/custom/Entry";
import { Avatar } from "@/components/custom/Avatar";
import WindowToggleIcon from "@/components/custom/WindowToogleIcon";
import Title from "@/components/custom/Title";
import Description from "@/components/custom/Description";
import SurfaceBase from "@/components/custom/SurfaceBase";
import type { ComponentType } from "react";


export const COMPONENT_MAP: Record<string, ComponentType<ThemeComponentProps>> = {
  // 基础形态
  'node': SurfaceBase,

  // 容器形态
  'row': SurfaceBase,
  'col': SurfaceBase,
  'sidebar': Sidebar,
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
  'description': Description
}
