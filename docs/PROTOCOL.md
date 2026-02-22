# 主题插件开发协议 (V1.0)

## 简述

该文档说明了自定义主题配置文件的编写规则,如果你需要该软件页面效果的高度自定义可以查看此文件

## 说明

一个主题就是一个json文件,编写好主题后需要把你的主题文件,例如cyberpunk.json放入App本地资源路径下的themes目
录下(`windows上是C:\Users\yumillengjiao\AppData\Local\io.github.yumilengjiao.yumihub\themes\`),重启程序时程
序时会自动读取该目录下的所有themes文件

## 开发

自定义主题的开发非常简单,只需要编写一个符合语法规范的**json**文件就可以了,而这个json文件的基本格式(示例)如下:

```json5
{
  // ==========================================
  // 基础元数据配置
  // ==========================================
  config: {
    version: "1.0",         // 配置协议版本，用于后续兼容性升级
    themeName: "default",   // 主题唯一标识符(主题名)
    author: "user1",        // 作者名
    variables: {
      // 此处可存放全局 CSS 变量或主题色，例如：
      // "primary-color": "#FF00AA" 引用的时候可以直接$primary-color,不要有空格和特殊符号
    }
  },

  // ==========================================
  // 页面布局与结构定义
  // ==========================================
  layout: {
    // 全局默认配置：应用于所有页面的通用组件
    global: {
      nt: "Row",
      props: {
        cols: 24,
      },
      children: [
        {
          nt: "SideBar",
          props: {
            span: 0,
            mode: "trigger",
            side: "left"
          },
          children: [
            {
              nt: "Col",
              props: {
                rows: 32
              }
            }
          ]
        }
      ]
    },

    // 路由页面配置
    pages: {
      // 首页路由
      "/": {
        name: "首页",
        content: {
          nt: "Background",
          props: {
            sourceType: "selectedGame",
          },
          children: [
            {
              nt: "Col",
              props: {
                rows: 64
              }
            }
          ]
        }
      }
    }
  }
}
```

请参阅上方json基本格式的注释编写一个基本的注释文件,目前page中的页面定义仅支持"/"页面,下面将
针对一些重要的字段进行说明:

`layout.global.widget`
widget是一个[Node](#node)对象,一般的,这个Node对象的nt(node type)会是一个容器类型的nt,因为这个对象的宽高是
占据整个视口的,所以编写成一个容器对象更有利于组织子Node

## Node

在这个程序中,所有的组件分为**Container**Node和**Component**Node,你可以理解Node是
所有元素的父特征，它定义了Container和Component的共同属性，具体的一个Node的所有属性和功能如下:

```jsonc
{
  // 核心识别 (Identity)
  "id": "string",          // [必填] 节点的唯一标识。用于状态追踪、联动逻辑及 React 渲染优化。
  "nt": "string",        // [必填] 节点类型(node nt)。决定了它是容器(Container)还是具体组件(Component)。

  // 视觉表现 (Visual)
  "className": ["bg-white","text-xl"], // [可选]，由于taiwind的静态解析机制不推荐使用className
  "inlineStyle": {
    backgroundColor: "#ffffff"
  }

  // 业务数据 (Business Data)
  "props": {               // [可选] 业务属性。内部具体字段取决于 nt 的定义。
    "visible": true,       // [可选] 逻辑开关：是否渲染该节点
    "start": 1             // [可选] 说明从父元素的第几行(列)开始,默认第一格开始
    "span": 3               // [可选] 说明元素占几格,默认占满
  },

  // 交互行为 (Interaction)
  "actions": {             // [可选] 事件监听。
    "onClick": {           // [可选] 点击事件
      "command": "string", // [必填*] 执行的指令名称
      "params": {}         // [可选] 指令所需的参数对象
    }
  },

}
```

具体所有组件信息请参照[THEME_SCHEMA](./THEME_SCHEMA.md)

每个组件的props属性都可以填写start和span属性来确认组件的占用空间和开始位置，使用Col和Row组件来划分空间，当然Col和
Row组件也是可以嵌套使用的，每个组件的特殊属性可以在[THEME_SCHEMA](./THEME_SCHEMA.md)查找
