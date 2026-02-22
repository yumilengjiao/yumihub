## Actions指南

你应先浏览[PROTOCOL](./PROTOCOL.md)来查看一个自定义主题基本该如何编写

actions是为一些特殊组件比如Button提供程序内行为的一些命令,你可以在Button或Entry等组件内使用以下参数
来说明时间触发时的行为,具体可查看

```jsonc
{
  "command": "行为名称",
  "params": { "参数名": "参数值" }
}
```

🛠️ 可用行为列表

1. 路由跳转 (Maps)

用于在应用内的不同页面间进行切换。

    参数: destination (String) - 目标路由路径。

    示例: { "command": "navigate", "params": { "destination": "/settings" } }

2. 窗口管理 (windowManage)

控制应用窗口的状态（最大化、最小化、关闭等）。

    参数: op (String) - 操作类型。

        maximize: 最大化

        unmaximize: 取消最大化

        minimize: 最小化

        close: 关闭应用

        hide: 隐藏窗口

        toggle: 切换最大化/原大小

    注意: 若不传 op 参数，系统将自动触发 toggle 智能切换。

3. 主题切换 (switchTheme)

在“白天模式”与“黑夜模式”之间进行循环切换。

    参数: 无。

    示例: { "command": "switchTheme" }

4. 系统弹窗 (alert)

触发一个轻量级的消息提示（Toast）。

    参数: content (String) - 提示文字内容内容。

    示例: { "command": "alert", "params": { "content": "操作成功！" } }

5. 外部链接 (openLink)

使用系统默认浏览器打开外部网页链接。

    参数: url (String) - 完整的网页 URL。

    示例: { "command": "openLink", "params": { "url": "https://github.com" } }

6. 启动最近游戏 (startUplastedGame)

自动识别并启动库中上一次运行的游戏。

    说明: 系统会自动根据 lastPlayedAt 时间戳进行排序,然后启动上一次游玩的游戏。

    示例: { "command": "startUplastedGame" }

7. 后端指令执行 (invoke)

直接调用 Tauri 后端暴露的原生 Rust 命令。

    参数:

        cmd: 指令名称。

        args: 指令对应的参数对象。

    示例: { "command": "invoke", "params": { "cmd": "my_custom_command", "args": { "id": 123 } } }

📝 使用技巧

    串行执行: 你可以传入一个 Action 数组，系统会按照顺序依次执行。例如：点击按钮先切换主题，然后弹窗提示。

    安全性: windowManage 中的 close 操作会直接关闭进程，请谨慎绑定。
