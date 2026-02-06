use std::str::FromStr;

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_log::log::{debug, info, warn};

use crate::{
    companion::{self},
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{entity::GameMeta, RUNNING_GAMES},
    screenshot,
    shortcut::entity::ShortcutSetting,
    util::toggle_windows_by_pids,
};

/// 从数据库读取并刷新实机监听
/// 这个函数在两个地方调用：1. 程序启动时；2. 用户保存快捷键设置后
pub async fn refresh_shortcuts<R: Runtime>(handle: &AppHandle<R>) -> Result<(), AppError> {
    let pool = handle.state::<SqlitePool>();
    let global_shortcut = handle.global_shortcut();

    // 获取当前开关状态
    let is_shortcut_enabled = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Mutex(e.to_string()))?
        .system
        .hotkey_activation;

    // 核心改动：如果开关关闭，直接注销并彻底返回
    if !is_shortcut_enabled {
        debug!("快捷键已禁用，正在注销所有监听...");
        global_shortcut
            .unregister_all()
            .map_err(|e| AppError::Generic(e.to_string()))?;
        return Ok(()); // 关键：提前结束函数
    }

    // 下面是开启热键状态时候的逻辑

    // 获取所有全局快捷键配置
    let shortcuts = sqlx::query_as::<_, ShortcutSetting>(
        "SELECT id, key_combo, is_global FROM shortcut WHERE is_global = 1 AND key_combo IS NOT NULL"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    // 先清空旧的，再注册新的
    global_shortcut
        .unregister_all()
        .map_err(|e| AppError::Generic(e.to_string()))?;

    debug!("开始注册全局快捷键，共 {} 个", shortcuts.len());

    for setting in shortcuts {
        if let Some(combo) = setting.key_combo {
            // 注意：Tauri 的快捷键字符串需要符合其标准格式（如 "CommandOrControl+Shift+G"）
            if let Ok(shortcut) = Shortcut::from_str(&combo) {
                let h = handle.clone();
                let id = setting.id.clone();

                global_shortcut
                    .on_shortcut(shortcut, move |_app, _shortcut, event| {
                        if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                            let inner_h = h.clone();
                            let inner_id = id.clone();
                            tauri::async_runtime::spawn(async move {
                                let _ = handle_shortcut_action(&inner_h, &inner_id).await;
                            });
                        }
                    })
                    .map_err(|e| AppError::Generic(e.to_string()))?;
            } else {
                warn!("无效的快捷键格式: {}", combo);
            }
        }
    }

    Ok(())
}

/// 快捷键触发后的逻辑分发中心
async fn handle_shortcut_action<R: Runtime>(
    handle: &AppHandle<R>,
    id: &str,
) -> Result<(), AppError> {
    let pool = handle.state::<SqlitePool>();

    match id {
        // 启动上次游戏
        "launch_last" => {
            // 从数据库按最后玩过的时间排序，取第一条
            let last_game = sqlx::query_as::<_, GameMeta>(
                "SELECT * FROM games ORDER BY last_played_at DESC LIMIT 1",
            )
            .fetch_optional(&*pool)
            .await
            .map_err(|e| AppError::DB(e.to_string()))?;

            if let Some(game) = last_game {
                println!("快捷键：正在启动上次游玩的游戏 -> {}", game.name);
                // 调用start_game 逻辑
                crate::game::commands::execute_start_game((*pool).clone(), game).await?;
            } else {
                println!("快捷键提示：库中还没有游玩记录");
            }
        }

        // 老板键
        "boss_key" => {
            if let Some(window) = handle.get_webview_window("main") {
                let is_currently_visible = window.is_visible().unwrap_or(false);
                let target_visible = !is_currently_visible;

                // 切换主窗口显隐
                if is_currently_visible {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }

                // 收集需要操作的 PID
                let mut all_pids: Vec<u32> = {
                    let games = RUNNING_GAMES.lock().unwrap();
                    games.values().map(|s| s.game_pid).collect()
                };

                // 加上受控的连携程序 PID
                let companion_pids = companion::commands::get_controlled_pids();
                all_pids.extend(companion_pids);

                // 执行批量显隐
                if !all_pids.is_empty() {
                    // 使用之前定义的 Win32 工具函数
                    toggle_windows_by_pids(all_pids, target_visible);
                }
            }
        }

        // 紧急停止
        "emergency_stop" => {
            info!("快捷键：执行紧急停止清理...");

            // 获取所有正在运行的游戏进程并强杀
            {
                let mut games = RUNNING_GAMES.lock().unwrap();
                for (_, status) in games.drain() {
                    #[cfg(target_os = "windows")]
                    let _ = std::process::Command::new("taskkill")
                        .args(["/F", "/PID", &status.game_pid.to_string(), "/T"])
                        .spawn();
                }
            }

            // 调用连携模块的 exit (内部已经包含进程名强杀)
            companion::exit();

            // 如果主窗口被藏起来了，紧急停止时最好把它呼出来，方便用户确认状态
            if let Some(window) = handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }

        // 截图等其他功能
        "screenshot" => {
            let app_handle = handle.clone();
            let pool = handle.state::<SqlitePool>().inner().clone(); // 克隆连接池引用

            // 立即获取当前运行的游戏 ID（锁的时间越短越好）
            let current_game_id = {
                let games = RUNNING_GAMES.lock().unwrap();
                // 尝试获取第一个正在运行的游戏 ID，如果没有则为 None
                games.keys().next().cloned()
            };

            // 异步执行截图、保存、入库、通知
            tauri::async_runtime::spawn(async move {
                // 调用我们刚才在 screenshot 模块写好的函数
                match screenshot::commands::capture_game_screenshot(&pool, current_game_id).await {
                    Ok(_) => {
                        // 使用插件发送低调通知
                        use tauri_plugin_notification::NotificationExt;
                        let _ = app_handle
                            .notification()
                            .builder()
                            .title("📸 快照已保存")
                            .body("已保存截图")
                            .show();
                    }
                    Err(e) => {
                        eprintln!("截图失败: {}", e);
                    }
                }
            });
        }
        _ => println!("警告：触发了未定义逻辑的快捷键 ID: {}", id),
    }
    Ok(())
}
