# 所有可用的组件

你应先浏览[PROTOCOL](./PROTOCOL.md)来查看一个自定义主题基本该如何编写

---

## Row [容器组件]

普通容器，一个简单的元素，会自动占满宽度和高度，一般情况下不需要使用该组件,常规样式属性也可以生效
允许子节点：✅ 是

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

- props: <Object>

  - sourceType: <string>

    - 说明: 指定数据来源类型

      可选值:

      selectedGame: 指定背景就为当前GameShelf选中的游戏的背景

      specifiedGame: 指定背景为特定游戏的背景图,需配合sourceValue使用

      none: 默认无背景图

  - sourceValue: <string>

    - 说明: 用来指定特定游戏,值为游戏的id值，需要查看App的数据库文件查看，位于C:\Users\username\AppData\Local\io.github.yumilengjiao.yumihub下的app.db文件

  - overlayColor: <string>

    - 遮罩颜色: 相当于背景图的蒙层,默认是bg-transparent(透明)

  - opacity: <number>

    - 背景图像透明度: 取值为0~1

  - variant <string>

    - 说明: 视觉效果预设效果，会自动应用一组预定义的 CSS 组合。

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

## SideBar

侧边栏

允许子节点：✅ 是

属性定义 (Properties)

- props <Object>

  - mode <string>

    - 说明: 用于指定侧边栏的形式

      可选值:

          normalFixed: 普通固定形式
          trigger:      触发模式，鼠标移动到靠边的位置时侧边栏弹出，注意:此模式时需要手动设置span: 0 
  - side <string>

    - 说明: 指定侧边栏的位置

      可选值:

          left: 侧边栏位于左边
          right: 侧边栏位于右边
          top: 侧边栏位于上方
          bottom: 侧边栏位于下方

  - zIndex <number>

    - 说明: 用于指定层级，默认为100

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## TitleBar

顶部标题栏

允许子节点：✅ 是

属性定义 (Properties)

- props <Object>

  - variant

    标题栏的变体封装

    可选值:

        default: 直角矩形
        full: 默认显示就是占据一行,背景纯色
        capsule: 类似灵动岛,子元素居中排开
        cornerArc: 在角落有一个圆弧的形状容器，里面的子元素从指定方向(growDirection)排开

  - position <string>

    可设置为absolute，在absolute的时候必须确保设置span = 0，且父元素要在inlineStyle设置position: relative

  - align

    用来控制水平方向上的位置

    可选值：

        start: 靠左
        center: 居中
        end: 靠右

  - valign

    用来控制垂直方向上的位置

    可选值:

        top: 靠上
        botom: 靠下

  - orientation

    用来控制整个容器的条状是竖着的还是水平的

    可选值:

        horizontal (横条)
        vertical (竖条)

  - growthDirection <string>

    用于控制子元素的排列顺序方向,仅在variant为CornerArc时有用

    可选值:

        row: 从左往右摆放子元素，正常顺序
        row-reverse: 从左往右摆放子元素，相反顺序
        col: 从上往下摆放子元素，正常顺序
        col-reverse: 从上往下摆放子元素，相反顺序

  - thickness <string>

    用于控制栏的宽度，默认50px, 注意: 并不是指显示出来的栏的宽度，显示栏的宽度只由内容决定，这个属性是值控制拖拽区域的宽度

  - cornerRadius <string>,

    调整CornerArc变体下的圆弧大小，默认70px

  - zIndex

    控制栏的层级

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## Icon [叶子节点]

用于展示图标，所有图标均来自于Lucide的图标库

允许子节点：❎ 否

属性定义 (Properties)

- props <Object>

  - name <string>

    - 说明: 通过name指定icon图标,name可以从Lucide的官方库中查询

  - size <number>

    - 说明: 指定icon图标的实际大小

  - color <string>

    - 说明: 指定icon图标的颜色

  - strokeWidth <string>

    - 说明: 指定icon图标的线粗

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## WTIcon [叶子节点]

特殊的Icon,会自动监听窗口是否最大化来展示不同图标，可指定窗口是否最大化时的图标,一般外面套一层Button使用

- props <Object>
  
  - normalIcon

    窗口未最大化时的icon,也是可以直接输入Lucide图标的名字

  - maximizedIcon

    窗口最大化时的图标

  - size <number>

    图标大小

  - color <string>

    图标颜色

  - strokeWidth

    图标线条粗细
- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## Avatar [叶子节点]

允许子节点：❎ 否

属性定义 (Properties)

- props <Object>

  - disableHover <boolean>

    - 说明: 通过name指定icon图标,name可以从Lucide的官方库中查询

  - size <number>

    - 说明: 指定头像的实际大小

  - paddingY <number>

    - 说明: 指定上下内边距

  - shape <string>

    - 说明: 指定头像的形状

      可选值:

      rounded-none: 直角正方形

      rounded-sm / rounded: 微圆角

      rounded-lg: 大圆角正方形

      rounded-2xl: 超大圆角

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

- props <Object>

  - variant <string>

    - 说明: 封面卡片的交互与视觉预设。
  
        可选值:

        scale: (默认) 选中项向上放大，未选中项缩小。

        border: 选中项显示紫色边框和外边距偏移。

        glow: 选中项带有紫色霓虹外发光，未选中项带有轻微模糊。

  - basis

    - 说明: 控制游戏列表的大小(一行展示多少个游戏)

        用法: basis: 7(页面一面展示7个游戏, 最低不超过4，最大不超过12)

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 原生 CSS 属性注入。具有最高优先级，会覆盖变体中的同名属性。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

- className <string | string[]>

  - 说明: Tailwind 实用类注入。通过 cn() 与内部样式合并。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

---

## Button [叶子节点]

用于通过action属性调用提供的点击事件
允许子节点：✅是

属性定义 (Properties)

- props: <Object>

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
            params: {
              destination: "/"
            }
          },
          {
            command: "alert",
            params: {
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
        params: {
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

## Description [叶子节点]

段落组件，显示一串文本

- props <Object>

  - mode <string>

    说明：组件模式,默认"gameDesc"

        可选值:
        gameDesc: content为当前GameShelf选中游戏的游戏简介内容
        developer: content为当前GameShelf选中游戏的游戏开发商
        custom: 直接应用content属性里面的自定义内容

  - variant <string>

    说明：组件风格

        可选值:
        faded: 减淡消失
        card: 卡片样式

  - content <string>

    说明：段落内容，仅在mode为custom时生效

  - lineClamp <number>

    说明: 文本截断行数,用于控制文本最多显示多少行

  - fontSize <number>

    说明: 用于指定文字大小信息,默认16

  - textAlign <string>

    说明: 用于指定文字对齐方式

        可选值：
        left(默认)：左对齐
        center: 居中
        right: 右对齐
        justify：两端对齐

  - width <string>

    说明: 用于控制文本的宽度，默认"100%"

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Entry [叶子节点]

就是一个融合了副标题和图标的一个选项
允许子节点：❎ 否

属性定义 (Properties)

- props <Object>

  - title <string>

    - 选项的展示文字

  - icon <string>

    - 选项的图标,可以在Lucide的库中查询图标名字

  - path <string>

    - 用于在指定path路由页面时变成亮起状态，可选值有"/" || "/library" || "/user" || "/setting"

  - showTitle <boolean>

    - 用于控制是否展示文字，并不能通过title为空来起到没有文字的效果因为会有默认文字项必须通过此属性显示说明

  - activeColor <string>

    - 激活时的颜色，激活就是指处于path中值所处的页面时

  - autoActive <boolean>

    - 用于控制是否要根据path路径自动判别是否激活，默认为true，为false时active生效

  - active <boolean>

    - 用于直接控制是否激活(autoActive == false时生效)

- actions

  - 说明: 该属性中可以填入点击事件执行的函数

  - 用法: 参照按钮

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

---

## Title [叶子节点]

用于显示文字

属性定义 (Properties)

- props <Object>

  - mode <string>

    - 通过不同模式可以展示不同功能的标题内容

      可选值:

          gameName: 展示当前GameShelf中选择的Game的名称
          time: 显示当前时间
          custom: 显示自定义静态内容,显示content属性中的静态内容
          greeting: 显示问候语
  - content <string>

    - 在mode == custom时生效，标题内展示的文字即为content的值

  - variant <string>

    - 文字的不同视觉风格

      可选值:

          hero: 描边标题
          subtle: 优雅副标题
          neon: 霓虹灯外发光
          glass: 适合在毛玻璃上的文字展示

  - size <number>

    - 指定文字尺寸

  - color <string>,

    - 文字颜色，默认 #ffffff

  - timeFormat

    - 时间格式（简单实现）,默认"HH:mm:ss"

- className <string | string[]>

  - 说明: 注入 Tailwind 类名到组件的最外层容器。

        用法: 可以使用所有taiwind中的实用类,如：className: ["bg-pink","text-xl"] 或 ["bg-pink text-xl"]

- inlineStyle <Object>

  - 说明: 注入原生 CSS 样式。

        用法: 适用于变体不能达到想要的效果时，如 inlineStyle: {"box-sizing": "border-box"}。

## Page

用来决定不同路由页面展示画面的地方,相当于一个插槽,这个组件放在哪里路由页面渲染到哪片区域

允许子节点：❎ 否
