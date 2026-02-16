import { CSSProperties } from "react";

export interface ThemeComponentProps {
  node: ThemeNode;               // 必须接收 node
  children?: React.ReactNode;    // 可选接收子节点
}

export interface ThemeIr {
  config: {
    version: string;
    themeName: string;
  };
  layout: {
    global: ThemeNode;
    pages: Record<string, PageConfig>;
  };
}

export interface PageConfig {
  name: string;
  content: ThemeNode;
}


export interface ThemeNode {
  id: string
  nt: string
  style: CSSProperties & Record<string, any>
  className: string
  children?: ThemeNode[]
  props: Record<string, any>
  action?: any
  hooks?: any
}

export interface Action {
  command: string
  params?: any
}
