<div align="center">

# YumiHub

一个二次元本地游戏管理工具

简体中文 | [English](./README.en.md)

</div>

---

## 📍 目录

* [📖 简介](#-简介)
* [🌟 核心特性](#-核心特性)
* [🛠️ 技术栈](#-技术栈)
* [📸 界面展示](#-界面展示)
* [📥 安装](#-安装)
* [🎨 主题](#-主题)
* [🚀 快速开始 (开发)](#-快速开始-开发)
* [⚖️ 免责声明](#-免责声明)
* [📄 许可](#-许可)

## 📖 简介

YumiHub 是一个基于 Tauri 开发的本地游戏 (Galgame) 库管理工具，用于整合游戏资源、元数据抓取及外部程序启动。

## 🌟 核心特性

* **资源导入**：支持 `ZIP` / `RAR` 压缩包直接导入。
* **程序连携**：支持游戏启动时同时连锁启动其他手动添加的程序(如翻译器,手柄映射程序等)。
* **数据绑定**：集成 Bangumi 与 VNDB API，自动获取封面及详情。
* **界面交互**：基于 React 19 与 Tailwind CSS 的响应式设计。

## 🛠️ 技术栈

* **前端框架**: React 19
* **桌面框架**: Tauri 2.0 (Rust)
* **样式库**: Tailwind CSS / Shadcn UI
* **状态管理**: Zustand
* **数据库**: SQLite (SQLx)
* **运行环境**: Bun

## 📸 界面展示

<p align="center">
  <em>首页</em><br>
  <img src="./assets/base_graph.png" width="80%" />
  <br><br>
  <em>游戏库界面</em><br>
  <img src="./assets/library.png" width="80%" />
  <br><br>
  <em>连携程序管理</em><br>
  <img src="./assets/companion.png" width="80%" />
</p>

## 📥 安装

你可以从 [Releases 页面](https://github.com/yumilengjiao/yumihub/releases) 下载对应平台的安装包直接使用。

## 🎨 主题

你可以从[themes](./themes)目录中下载主题文件，每个文件都是一个主题，将下载的主题文件(如neon-glass.json5)放入程序
的themes目录路径下，位于**C:\Users\yourusername\AppData\Local\io.github.yumilengjiao.yumihub\themes**下，
默认你会再这个目录下看到一个default.json5的文件，请不要删除它否则程序会出现错误,将你下载的主题文件放
至此目录下后重启程序后你可以在设置页面的 `个性化界面->主题选择` 中更改主题，重启生效

你可以在[主题样式浏览](./themes/theme_sample)中查看每个主题的样式

## 🚀 快速开始 (开发)

1. **克隆仓库**:

   ```shell
   git clone https://github.com/yumilengjiao/yumihub.git
   cd yumihub

2. **安装环境**: 确保已安装 Bun 和 Rust

3. **安装依赖**:

    ```
    bun install
    ```

4. **启动开发**:

    ```
    bun tauri dev
    ```

5. **打包构建**:

    ```
    bun tauri build
    ```

## ⚖️ 免责声明

本项目资源来源于网络，若有侵权请联系。

## 📄 许可

本项目采用 [MIT License](./LICENSE) 开源。
