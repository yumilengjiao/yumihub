//! 配置文件磁盘 I/O

use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{error, info};

use crate::{
    config::{
        entity::Config,
        CONFIG_PATH, GLOBAL_CONFIG,
    },
    error::{AppError, FileAction},
};

/// 从磁盘加载配置，文件不存在时用默认值创建
pub fn load(app_handle: AppHandle) -> Result<(), AppError> {
    let config_path = CONFIG_PATH.get().expect("CONFIG_PATH 未初始化");

    // 各资源目录
    let base_dir = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|e| AppError::Config {
            action: FileAction::Read,
            path: "app_local_data_dir".into(),
            message: e.to_string(),
        })?;

    let backup_dir = base_dir.join("backup");
    let assets_dir = base_dir.join("assets");
    let screenshots_dir = base_dir.join("screenshots");

    // 确保目录存在并写入默认路径
    for dir in [&backup_dir, &assets_dir, &screenshots_dir] {
        std::fs::create_dir_all(dir)?;
    }

    {
        let mut cfg = GLOBAL_CONFIG.write().unwrap();
        cfg.storage.backup_save_path = backup_dir;
        cfg.storage.meta_save_path = assets_dir;
        cfg.storage.screenshot_path = screenshots_dir;
    }

    // 配置文件不存在 → 写入默认值
    if !config_path.exists() {
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        return save(&app_handle);
    }

    // 读取并解析
    let text = std::fs::read_to_string(config_path).map_err(|e| AppError::Config {
        action: FileAction::Read,
        path: config_path.to_string_lossy().into(),
        message: e.to_string(),
    })?;

    match serde_json::from_str::<Config>(&text) {
        Ok(cfg) => {
            *GLOBAL_CONFIG.write().unwrap() = cfg;
        }
        Err(e) => {
            error!("配置文件解析失败，使用默认值: {}", e);
        }
    }

    Ok(())
}

/// 将当前内存配置持久化到磁盘（程序退出时调用）
pub fn save(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("持久化配置到磁盘...");

    // 退出前更新最后游玩的游戏到展示顺序第一位
    if let Some(pool) = app_handle.try_state::<SqlitePool>() {
        let latest: Option<String> = tauri::async_runtime::block_on(async {
            sqlx::query_scalar(
                "SELECT id FROM games WHERE last_played_at IS NOT NULL \
                 ORDER BY last_played_at DESC LIMIT 1",
            )
            .fetch_optional(pool.inner())
            .await
            .ok()
            .flatten()
        });

        if let Some(id) = latest {
            // 更新 is_displayed = 1
            let _ = tauri::async_runtime::block_on(async {
                sqlx::query("UPDATE games SET is_displayed = 1 WHERE id = ?")
                    .bind(&id)
                    .execute(pool.inner())
                    .await
            });

            let mut cfg = GLOBAL_CONFIG.write().unwrap();
            let order = &mut cfg.basic.game_display_order;
            if order.first() != Some(&id) {
                order.retain(|x| x != &id);
                order.insert(0, id);
            }
        }
    }

    let config_path = CONFIG_PATH.get().expect("CONFIG_PATH 未初始化");
    let json = {
        let cfg = GLOBAL_CONFIG.read().unwrap();
        serde_json::to_string_pretty(&*cfg).unwrap()
    };

    std::fs::write(config_path, json).map_err(|e| AppError::Config {
        action: FileAction::Write,
        path: config_path.to_string_lossy().into(),
        message: e.to_string(),
    })?;

    info!("配置已保存");
    Ok(())
}
