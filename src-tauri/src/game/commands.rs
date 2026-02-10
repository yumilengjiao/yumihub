use std::{path::{Path, PathBuf}, process::{Command, Stdio}, time::Instant};

use chrono::Local;
use sqlx::SqlitePool;
use tauri_plugin_log::log::{ error};
use uuid::Uuid;

use crate::{
    backup::commands::backup_archive_by_game_id,
    companion::{self, entity::Companion},
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{
        entity::{GameMeta, RunningGameStatus},
        RUNNING_GAMES,
    },
};

/// 启动一个游戏并启动连携程序
///
/// * `pool`: 数据库连接池
/// * `game`: 游戏信息
pub async fn execute_start_game(pool: SqlitePool, game: GameMeta) -> Result<(), AppError> {
    let start_time = Local::now();
    let start_instant = Instant::now();
    let game_id = game.id.clone();
    let game_abs_path = PathBuf::from(&game.abs_path);

    // 解析工作目录
    let game_dir = game_abs_path
        .parent()
        .ok_or_else(|| AppError::Process("无法获取游戏目录".into()))?;

    // 启动连携程序
    let mut game_companions_names = Vec::new();
    let companions = sqlx::query_as::<_, Companion>(
        "SELECT * FROM companions WHERE is_enabled = 1 AND trigger_mode = 'game' ORDER BY sort_order DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    for comp in companions {
        if let Some(file_name) = Path::new(&comp.path).file_name() {
            if let Some(name_str) = file_name.to_str() {
                game_companions_names.push(name_str.to_string());
            }
        }
        companion::commands::launch_companion(comp);
    }

    // --- 2. 启动游戏主进程 (高度兼容模式) ---
    let mut cmd = Command::new(&game_abs_path);
    
    // 设置工作目录，解决 90% 的老游戏启动乱码问题
    cmd.current_dir(game_dir);
    
    // 管道重定向，防止某些程序因 stdin 阻塞
    cmd.stdin(Stdio::null());
    cmd.stdout(Stdio::inherit()); 
    cmd.stderr(Stdio::inherit());

    // Windows 专属优化：DETACHED_PROCESS 或 CREATE_NEW_PROCESS_GROUP
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        // 0x00000008 是 DETACHED_PROCESS，防止控制台游戏带起一个黑窗口
    }

    let mut child = cmd.spawn()
        .map_err(|e| AppError::Resolve(game.abs_path.clone(), format!("启动失败: {}", e)))?;

    let game_pid = child.id();

    // 记录游戏主进程 PID 到全局状态
    {
        let mut games = RUNNING_GAMES.lock().unwrap();
        games.insert(game_id.clone(), RunningGameStatus { game_pid });
    }

    // 异步监听
    let pool_clone = pool.clone();
    let game_id_clone = game_id.clone();

    tauri::async_runtime::spawn(async move {
        let res: Result<(), AppError> = async move {
            // 等待游戏结束
            let _ = child.wait().map_err(|e| AppError::Process(e.to_string()))?;
            let duration = start_instant.elapsed();

            // 检查自动备份
            let auto_backup = GLOBAL_CONFIG
                .read()
                .map_err(|e| AppError::Mutex(e.to_string()))?
                .storage
                .auto_backup;

            if auto_backup {
                let result = backup_archive_by_game_id(pool.clone(), game_id_clone.clone()).await;
                if result.is_err() {
                    error!("无法保存id为{} 的数据", game_id_clone);
                }
            }

            // 清理运行状态
            {
                let mut games = RUNNING_GAMES.lock().unwrap();
                games.remove(&game_id_clone);
            }

            // 关闭连携程序
            for name in game_companions_names {
                #[cfg(target_os = "windows")]
                let _ = std::process::Command::new("taskkill")
                    .args(["/F", "/IM", &name, "/T"])
                    .spawn();

                #[cfg(target_os = "macos")]
                let _ = std::process::Command::new("pkill")
                    .args(["-9", "-x", &name])
                    .spawn();
            }

            // 数据库持久化记录
            let mut tx = pool_clone.begin().await.map_err(|e| AppError::DB(e.to_string()))?;

            sqlx::query(r#"INSERT INTO game_play_sessions (id, game_id, play_date, duration_minutes, last_played_at) VALUES (?, ?, ?, ?, ?)"#)
                .bind(Uuid::new_v4().to_string())
                .bind(&game_id_clone)
                .bind(start_time)
                .bind((duration.as_secs() / 60) as i64)
                .bind(Local::now())
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::DB(e.to_string()))?;

            sqlx::query(r#"UPDATE games SET play_time = play_time + ?, last_played_at = ? WHERE id = ?"#)
                .bind((duration.as_secs() / 60) as i64)
                .bind(Local::now())
                .bind(&game_id_clone)
                .execute(&mut *tx)
                .await
                .map_err(|e| AppError::DB(e.to_string()))?;

            tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
            
            
            Ok(())
        }.await;

        if let Err(e) = res {
            error!("游戏的进程监听出现错误: {}", e);
        }
    });

    Ok(())
}
