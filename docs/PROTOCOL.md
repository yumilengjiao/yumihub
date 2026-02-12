# 主题插件开发协议 (V1.0)

## 简述

该文档说明了自定义主题配置文件的编写规则,如果你需要该软件页面效果的高度自定义可以查看此文件

## 说明

一个主题就是一个json文件,编写好主题后需要把你的主题文件,例如cyberpunk.json放入App本地资源路径下的themes目
录下(`windows上是C:\Users\yumillengjiao\AppData\Local\io.github.yumilengjiao.yumihub\themes\`),重启程序时程
序时会自动读取该目录下的所有themes文件

## 开发

自定义主题的开发非常简单,只需要编写一个符合语法规范的**json**文件就可以了,而这个json文件的基本格式(示例)如下:

```jsonc
{
  // 元数据信息: 该主题插件的一些基本信息
  "config": {
    "version": "1.0", // 协议版本号-固定值
    "themeName": "cyberpunk", //主题名称,用于在设置界面选择主题时展示
    "variables": [] // [可选] 全局自定义变量(如：颜色、圆角、模糊度等)
  },
  // 布局配置,所有自定义的组件和效果都在此配置
  "layout": {
    // 全局层,在此定义的组件会常驻于所有页面
    "global": {
      widget:{}
    },
    // 页面映射表,定义不同路由界面呈现的不同组件
    "pages": {
      // "/"表示在"/"这个页面(即首页)目前支持首页自定义所以这是必填项
      "/": {
        "name": "首页", // 页面名称
        // 页面内容,具体这个页面有什么东西,放什么东西
        "content": {
          // 具体节点
          {
            "id": "p1-c1",
            "nt": "HeroBanner", //节点类型，具体参考[节点类型](#Node)
            "props": {
              "text": "GO!"
            }
          }
        }
      },
      // 和"/"路由配置相同,但目前不支持除了主页之外的页面配置所以可以删除"/game"这个对象
      "/games": {
        "name": "游戏库",
        "content": [
          {
            "id": "p2-c1",
            "nt": "GameGrid",
            "props": {
              "filter": "installed"
            }
          }
        ]
      }
    }
  }
}
```

请参阅上方json基本格式的注释编写一个基本的注释文件,下面将针对一些重要的字段进行说明:

`layout.global.widget`
widget是一个[Node](#node)对象,一般的,这个Node对象的nt(node type)会是一个容器类型的nt,因为这个对象的宽高是
占据整个视口的,所以编写成一个容器对象更有利于组织子Node

## Node

在这个程序中,所有的组件分为[Container](#container)Node和[Component](#component)Node,你可以理解Node是
所有元素的父特征，它定义了Container和Component的共同属性，具体的一个Node的所有属性和功能如下:

```jsonc
{
  // 核心识别 (Identity)
  "id": "string",          // [必填] 节点的唯一标识。用于状态追踪、联动逻辑及 React 渲染优化。
  "nt": "string",        // [必填] 节点类型(node nt)。决定了它是容器(Container)还是具体组件(Component)。

  // 视觉表现 (Visual)
  "style": ["bg-white","text-xl"],

  // 业务数据 (Business Data)
  "props": {               // [可选] 业务属性。内部具体字段取决于 nt 的定义。
    "visible": true,       // [可选] 逻辑开关：是否渲染该节点
  },

  // 交互行为 (Interaction)
  "actions": {             // [可选] 事件监听。
    "onClick": {           // [可选] 点击事件
      "command": "string", // [必填*] (若配置了onClick) 执行的指令名称
      "params": {}         // [可选] 指令所需的参数对象
    }
  },

}
```

## Container

Container 拥有 Node 的全部属性，并额外支持布局能力。

```jsonc
{
  "props": {
    "gap": "12px",
    "align": "center",
    "justify": "between",
    "wrap": false
  },
  "children": []
}
```

## ContainerVarients

### Box

该container没有什么特别之处,由于布局用的基本都是flex所以Box仅作为一个占位的元素使用

```jsonc
{
  "id": "nav-bar",
  "nt": "Box",
}
```

### Row

```jsonc
{
  "id": "nav-bar",
  "nt": "Row",
  "props": {
    "cols": "number",
    "align": "center",
    "justify": "between"
  },
  "children": []
}
```

### Col

```jsonc
{
  "id": "nav-col",
  "nt": "Col",
  "props": {
    "rows": "number",
    "align": "center",
    "justify": "between"
  },
  "children": []
}
```

### SideBar

```jsonc
{
  "nt": "Sidebar",
  "props": {
    "side": "left",
    "collapsible": true,
    "defaultWidth": "250px"
  },
  "children": []
}
```

## Component

Component 集成 Node 的所有属性，通过 nt 决定行为。Component不像Container一样有基本的Component对象，Component不像Container一样有基
本的Component对象，因为其更注重各种组件自己的功能

## ComponentVarients

### Button

```jsonc
{
  "nt": "Button",
  "props": {
    "content": "登录"
  },
  "style": {
    "width": "120px",
    "height": "40px",
    "color": "#FF0000"
  }
}
```

### Text

```jsonc
{
  "nt": "Text",
  "style": {
    "content": "string",
    "size": "string",
    "weight": "string",
    "color": "string"
  }
}
```

### Image

```jsonc
{
  "nt": "Image",
  "style": {
    "src": "string",
    "fit": "string"
  }
}
```

### Icon

```jsonc
{
  "nt": "Icon",
  "props": {
    "mode": "string",
    "name": "Settings",
    "size": 24,
    "strokeWidth": 2
  },
  "style": {
    "color": "#FF5733",
    "cursor": "pointer"
  }
}
```
