//! Tauri 应用入口
//!
//! 模块组织：
//! ```
//! src/
//! ├── infra/          基础工具（archive, fs, process）—— 无业务逻辑
//! ├── error.rs        统一错误类型
//! ├── message/        消息总线（GAME_HUB, CONFIG_HUB）
//! ├── config/         配置读写与变更分发
//! ├── game/           游戏实体与启动逻辑
//! ├── companion/      连携程序管理
//! ├── screenshot/     截图
//! ├── shortcut/       快捷键
//! ├── backup/         存档备份
//! ├── resource/       资源下载
//! ├── user/           用户实体
//! ├── theme.rs        主题加载
//! ├── sys.rs          系统监控
//! ├── tray.rs         系统托盘
//! ├── db.rs           数据库初始化
//! ├── life_cycle.rs   程序生命周期
//! └── commands/       所有 #[tauri::command]（按业务拆分）
//! ```

use std::sync::Mutex;

use tauri::RunEvent;

use crate::theme::ThemeState;

mod backup;
mod commands;
mod companion;
mod config;
mod db;
mod error;
mod game;
mod infra;
mod life_cycle;
mod message;
mod resource;
mod screenshot;
mod shortcut;
mod sys;
mod theme;
mod tray;
mod user;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(ThemeState {
            active: Mutex::new(None),
            all_names: Mutex::new(Vec::new()),
        })
        .setup(life_cycle::init)
        .invoke_handler(tauri::generate_handler![
            // ── 用户 ──────────────────────────────────
            commands::get_user_info,
            commands::update_user_info,
            // ── 游戏 ──────────────────────────────────
            commands::get_game_meta_list,
            commands::get_game_meta_by_id,
            commands::add_new_game,
            commands::add_new_game_list,
            commands::update_game,
            commands::delete_game_by_id,
            commands::delete_all_games,
            commands::start_game,
            commands::get_sessions,
            commands::get_sessions_by_year,
            // ── 压缩包 ────────────────────────────────
            commands::get_archive_list,
            commands::extract_archive,
            // ── 截图 ──────────────────────────────────
            commands::get_screenshots_by_year_month,
            commands::update_screenshot_by_id,
            commands::delete_screenshot_by_id,
            // ── 配置 ──────────────────────────────────
            commands::get_config,
            commands::update_config,
            // ── 快捷键 ────────────────────────────────
            commands::get_shortcuts,
            commands::update_shortcuts,
            // ── 备份 ──────────────────────────────────
            commands::backup_archive,
            commands::backup_archive_by_id,
            commands::restore_archive_by_id,
            commands::restore_all_archives,
            // ── 连携程序 ──────────────────────────────
            commands::get_companions,
            commands::update_companions,
            // ── 系统工具 ──────────────────────────────
            commands::get_start_up_path,
            commands::get_system_fonts,
            commands::get_game_size,
            commands::get_disks,
            commands::get_disk_usage,
            commands::authorize_path_access,
            commands::clear_app_data,
            commands::get_theme,
            commands::get_all_theme_names,
        ])
        .build(tauri::generate_context!())
        .expect("构建 Tauri 应用失败")
        .run(|handle, event| match event {
            RunEvent::Exit | RunEvent::ExitRequested { .. } => life_cycle::exit(handle),
            _ => {}
        })
}
