/**
 * @module 组件注册表，用于注册所有支持自定义主题的组件
 */

import { SurfaceBase } from "@/layout/Surface";
import { ThemeComponentProps } from "@/types/node";


export const COMPONENT_MAP: Record<string, React.FC<ThemeComponentProps>> = {
  // 基础形态
  'Node': SurfaceBase,

  // 容器形态
  'Row': SurfaceBase,
  'Col': SurfaceBase,


  // 业务形态
  'Button': SurfaceBase,
  'Chart': SurfaceBase,
};
