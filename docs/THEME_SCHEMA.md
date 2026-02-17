# 所有可用的组件

---

## Row [容器组件]

水平分栏容器。用于将页面横向切分为多个**列**区域。
允许子节点：✅ 是

属性定义 (Properties)

- props <Object>

  - cols <number>

    - 说明: 将当前行划分为多少列基准（基于栅格系统）。

        默认值: 12

- className <string | string[]>

  - 说明: Tailwind 实用类注入。与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Col [容器组件]

垂直分栏容器。用于将页面横向切分为多个**行**区域。
允许子节点：✅ 是

属性定义 (Properties)

- props <Object>

  - rows <number>

    - 说明: 将当前行划分为多少行基准（基于栅格系统）。

      默认值: 12

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Background [容器组件]

页面最底层的氛围容器，负责壁纸渲染与视觉滤镜, 建议将Row或Col作为其子节点。
允许子节点：✅ 是

属性定义 (Properties)

- variant <string>

  - 说明: 视觉效果预设“套餐”，会自动应用一组预定义的 CSS 组合。

        可选值:

            none: 默认，无特效。

            bottom-blur: 底部渐变模糊。

            vignette: 电影感暗角，自动压低四周亮度。

            frosted: 全屏毛玻璃效果。

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## GameShelf [叶子节点]

用于展示游戏库中的封面图，支持横向滚动浏览、选中缩放效果以及快速启动游戏。
允许子节点：❎ 否

属性定义 (Properties)

- variant <string>

  - 说明: 封面卡片的交互与视觉预设。
  
        可选值:

        scale: (默认) 选中项向上放大，未选中项缩小。

        border: 选中项显示紫色边框和外边距偏移。

        glow: 选中项带有紫色霓虹外发光，未选中项带有轻微模糊。

- props <Object>

  - basis

    - 说明: 控制游戏列表的大小(一行展示多少个游戏)

        用法: basis: 7(页面一面展示7个游戏, 最低不超过4，最大不超过12)

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Button [叶子节点]

用于通过action属性调用提供的点击事件
允许子节点：✅是

属性定义 (Properties)

- variant <string>

  - 说明: 封面卡片的交互与视觉预设。
  
        可选值:

        // scale: 经典的缩放效果
        scale: "transition-transform hover:scale-105 active:scale-95",

        // border: 预留透明边框防止抖动，Hover时变色
        border: "border-2 border-transparent hover:border-purple-500 transition-colors box-border",

        // glow: 霓虹发光效果 (利用 drop-shadow 或 box-shadow)
        glow: "transition-shadow hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]",

- actions <Object>

  - 说明: 该属性中可以填入点击事件执行的函数

      用法:

       ```jsonc
        actions: [
          {
            command: "navigate",
            props: {
              destination: "/"
            }
          },
          {
            command: "alert",
            props: {
              style: "success",
              content: "你好"
            }
          },
        ]
        ```

  - 支持的actions:

    ```jsonc
      // 导航到特性页面
      {
        command: "navigate",
        props: {
          destination: "/" || "library" || "game" || "user" || "setting"
        }
      }
    ```

    ```jsonc
      // 提示信息
      {
        command: "alert",
        props: {
          message: "你好"
        }
      }
    ```

    ```jsonc
      // 打开外部链接
      {
        command: "open_link",
        props: {
          url: "https://github.com/yumilengjiao/yumihub"
        }
      }
    ```

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Entry [叶子节点]

用于通过action属性调用提供的点击事件
允许子节点：❎ 否

属性定义 (Properties)

- variant <string>

  - 说明: 封面卡片的交互与视觉预设。
  
        可选值:

        // scale: 经典的缩放效果
        scale: "transition-transform hover:scale-105 active:scale-95",

        // border: 预留透明边框防止抖动，Hover时变色
        border: "border-2 border-transparent hover:border-purple-500 transition-colors box-border",

        // glow: 霓虹发光效果 (利用 drop-shadow 或 box-shadow)
        glow: "transition-shadow hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]",

- actions <Object>

  - 说明: 该属性中可以填入点击事件执行的函数

      用法:

       ```jsonc
        actions: [
          {
            command: "navigate",
            props: {
              destination: "/"
            }
          },
          {
            command: "alert",
            props: {
              style: "success",
              content: "你好"
            }
          },
        ]
        ```

  - 支持的actions:

    ```jsonc
      // 导航到特性页面
      {
        command: "navigate",
        props: {
          destination: "/" || "library" || "game" || "user" || "setting"
        }
      }
    ```

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。
