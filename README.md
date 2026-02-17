<div align="center">

# YumiHub

一个二次元本地游戏管理工具

简体中文 | [English](./README.en.md)

</div>

---

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
