//! 游戏启动与生命周期管理

use std::{
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::Instant,
};

use chrono::Local;
use sqlx::SqlitePool;
use tauri_plugin_log::log::error;
use uuid::Uuid;

use crate::{
    backup::commands::backup_by_game_id,
    companion,
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{
        entity::{GameMeta, RunningGame},
        RUNNING_GAMES,
    },
    infra::process::kill_by_name,
};

/// 启动游戏进程，并异步等待结束后记录会话、触发自动备份、关闭连携程序
pub async fn launch(pool: SqlitePool, game: GameMeta) -> Result<(), AppError> {
    let start_time = Local::now();
    let start_instant = Instant::now();
    let game_id = game.id.clone();
    let exe_path = PathBuf::from(&game.abs_path);

    let game_dir = exe_path
        .parent()
        .ok_or_else(|| AppError::Process("无法解析游戏目录".into()))?;

    // ── 1. 启动随游戏触发的连携程序 ──────────────────────────────────────────
    let companion_names = companion::commands::launch_game_companions(&pool).await;

    // ── 2. 启动游戏主进程 ────────────────────────────────────────────────────
    let mut child = Command::new(&exe_path)
        .current_dir(game_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| AppError::Resolve(game.abs_path.clone(), format!("启动失败: {}", e)))?;

    let pid = child.id();

    RUNNING_GAMES
        .lock()
        .unwrap()
        .insert(game_id.clone(), RunningGame { pid });

    // ── 3. 异步监听进程退出 ───────────────────────────────────────────────────
    let pool_clone = pool.clone();
    let game_id_clone = game_id.clone();

    tauri::async_runtime::spawn(async move {
        if let Err(e) = (async {
            // 等待游戏进程退出
            child.wait().map_err(|e| AppError::Process(e.to_string()))?;

            let duration_minutes = (start_instant.elapsed().as_secs() / 60) as i64;

            // 自动备份
            if GLOBAL_CONFIG.read().unwrap().storage.auto_backup {
                if let Err(e) = backup_by_game_id(pool.clone(), game_id_clone.clone()).await {
                    error!("自动备份游戏 {} 失败: {}", game_id_clone, e);
                }
            }

            // 清理运行状态
            RUNNING_GAMES.lock().unwrap().remove(&game_id_clone);

            // 关闭随游戏启动的连携程序
            for name in &companion_names {
                kill_by_name(name);
            }

            // 写入会话记录
            let mut tx = pool_clone
                .begin()
                .await
                .map_err(AppError::from)?;

            sqlx::query(
                "INSERT INTO game_play_sessions \
                 (id, game_id, play_date, duration_minutes, last_played_at) \
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(Uuid::new_v4().to_string())
            .bind(&game_id_clone)
            .bind(start_time)
            .bind(duration_minutes)
            .bind(Local::now())
            .execute(&mut *tx)
            .await
            .map_err(AppError::from)?;

            sqlx::query(
                "UPDATE games SET play_time = play_time + ?, last_played_at = ? WHERE id = ?",
            )
            .bind(duration_minutes)
            .bind(Local::now())
            .bind(&game_id_clone)
            .execute(&mut *tx)
            .await
            .map_err(AppError::from)?;

            tx.commit().await.map_err(AppError::from)?;

            Ok::<(), AppError>(())
        })
        .await
        {
            error!("游戏进程监听出错 [{}]: {}", game_id, e);
        }
    });

    Ok(())
}
