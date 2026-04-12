//! 快捷键注册与触发逻辑

use std::str::FromStr;

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_log::log::{debug, error, warn};

use crate::{
    companion,
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{entity::GameMeta, RUNNING_GAMES},
    infra::process::{kill_by_pid, toggle_windows_by_pids},
    screenshot,
    shortcut::entity::ShortcutSetting,
};

/// 从数据库重新加载并注册所有全局快捷键
pub async fn refresh_shortcuts<R: Runtime>(handle: &AppHandle<R>) -> Result<(), AppError> {
    let gs = handle.global_shortcut();

    // 关闭时注销所有，直接返回
    let enabled = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .system
        .hotkey_activation;

    gs.unregister_all()
        .map_err(|e| AppError::Generic(e.to_string()))?;

    if !enabled {
        debug!("快捷键功能已禁用");
        return Ok(());
    }

    let pool = handle.state::<SqlitePool>();
    let shortcuts = sqlx::query_as::<_, ShortcutSetting>(
        "SELECT id, key_combo, is_global FROM shortcut \
         WHERE is_global = 1 AND key_combo IS NOT NULL",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)?;

    debug!("注册全局快捷键 {} 个", shortcuts.len());

    for setting in shortcuts {
        let Some(combo) = setting.key_combo else {
            continue;
        };
        match Shortcut::from_str(&combo) {
            Ok(shortcut) => {
                let h = handle.clone();
                let id = setting.id.clone();
                gs.on_shortcut(shortcut, move |_app, _sc, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let inner_h = h.clone();
                        let inner_id = id.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = dispatch(&inner_h, &inner_id).await {
                                error!("快捷键 {} 处理失败: {}", inner_id, e);
                            }
                        });
                    }
                })
                .map_err(|e| AppError::Generic(e.to_string()))?;
            }
            Err(_) => warn!("无效快捷键格式: {}", combo),
        }
    }

    Ok(())
}

/// 快捷键动作分发
async fn dispatch<R: Runtime>(handle: &AppHandle<R>, id: &str) -> Result<(), AppError> {
    let pool = handle.state::<SqlitePool>();

    match id {
        // 启动上次游玩的游戏
        "launch_last" => {
            let game = sqlx::query_as::<_, GameMeta>(
                "SELECT * FROM games ORDER BY last_played_at DESC LIMIT 1",
            )
            .fetch_optional(&*pool)
            .await
            .map_err(AppError::from)?;

            if let Some(g) = game {
                crate::game::commands::launch((*pool).clone(), g).await?;
            }
        }

        // 老板键：隐藏/显示主窗口及受控游戏窗口
        "boss_key" => {
            if let Some(win) = handle.get_webview_window("main") {
                let visible = win.is_visible().unwrap_or(false);

                if visible {
                    let _ = win.hide();
                } else {
                    let _ = win.show();
                    let _ = win.set_focus();
                }

                let mut pids: Vec<u32> = RUNNING_GAMES
                    .lock()
                    .unwrap()
                    .values()
                    .map(|g| g.pid)
                    .collect();
                pids.extend(companion::commands::get_managed_pids());

                if !pids.is_empty() {
                    toggle_windows_by_pids(pids, !visible);
                }
            }
        }

        // 紧急停止：强杀所有游戏进程和连携程序
        "emergency_stop" => {
            let pids: Vec<u32> = RUNNING_GAMES
                .lock()
                .unwrap()
                .values()
                .map(|g| g.pid)
                .collect();

            for pid in pids {
                kill_by_pid(pid);
            }
            RUNNING_GAMES.lock().unwrap().clear();

            companion::exit();

            // 恢复主窗口
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }

        // 截图
        "screenshot" => {
            let pool_inner = pool.inner().clone();
            let game_id = RUNNING_GAMES.lock().unwrap().keys().next().cloned();
            let app = handle.clone();

            tauri::async_runtime::spawn(async move {
                match screenshot::commands::capture(&pool_inner, game_id).await {
                    Ok(_) => {
                        use tauri_plugin_notification::NotificationExt;
                        let _ = app
                            .notification()
                            .builder()
                            .title("📸 截图已保存")
                            .body("快照已保存到截图库")
                            .show();
                    }
                    Err(e) => error!("截图失败: {}", e),
                }
            });
        }

        _ => warn!("未知快捷键 ID: {}", id),
    }

    Ok(())
}
