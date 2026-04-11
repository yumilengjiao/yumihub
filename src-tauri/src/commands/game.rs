//! 游戏相关命令

use sqlx::{Pool, Row, Sqlite, Transaction};
use tauri::State;
use tauri_plugin_log::log::{debug, error, info, warn};

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{
        commands::execute_start_game,
        entity::{GameEvent, GameMeta, GameMetaList, PlaySession, ResourceTarget},
    },
    message::{traits::MessageHub, GAME_MESSAGE_HUB},
};

/// 查询所有游戏数据
#[tauri::command]
pub async fn get_game_meta_list(pool: State<'_, Pool<Sqlite>>) -> Result<GameMetaList, AppError> {
    let games = sqlx::query_as(
        "SELECT id, name, abs_path, is_passed, is_displayed, cover, background,
                description, developer, local_cover, local_background, save_data_path,
                backup_data_path, play_time, length, size, last_played_at
         FROM games",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    info!("查询数据成功");
    Ok(games)
}

/// 通过 id 查询单个游戏数据
#[tauri::command]
pub async fn get_game_meta_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<GameMeta, AppError> {
    let game = sqlx::query_as(
        "SELECT id, name, abs_path, is_passed, is_displayed, cover, background,
                description, developer, local_cover, local_background, save_data_path,
                backup_data_path, play_time, length, size, last_played_at
         FROM games WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(game)
}

/// 添加单个游戏到游戏库
#[tauri::command]
pub async fn add_new_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    debug!("接收到要添加的新数据: {:?}", game);

    sqlx::query(
        r#"INSERT OR REPLACE INTO games
        (id, name, abs_path, is_passed, is_displayed, cover, background, description,
         developer, save_data_path, backup_data_path, play_time, length, size, last_played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&game.id)
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(game.is_passed)
    .bind(game.is_displayed)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.description)
    .bind(&game.developer)
    .bind(&game.save_data_path)
    .bind(&game.backup_data_path)
    .bind(game.play_time)
    .bind(game.length)
    .bind(game.size)
    .bind(game.last_played_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    let allow_downloading = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Generic(e.to_string()))?
        .storage
        .allow_downloading_resources;

    if allow_downloading {
        GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask {
            meta: game,
            target: ResourceTarget::All,
        });
    }

    Ok(())
}

/// 批量添加游戏到游戏库
#[tauri::command]
pub async fn add_new_game_list(
    pool: State<'_, Pool<Sqlite>>,
    games: Vec<GameMeta>,
) -> Result<(), AppError> {
    debug!("接受到了新的游戏列表: {:?}", games);

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let allow_downloading = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Generic(e.to_string()))?
        .storage
        .allow_downloading_resources;

    for game in games {
        sqlx::query(
            "INSERT OR REPLACE INTO games
            (id, name, abs_path, is_passed, is_displayed, cover, background, description,
             developer, save_data_path, backup_data_path, play_time, length, size, last_played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&game.id)
        .bind(&game.name)
        .bind(&game.abs_path)
        .bind(game.is_passed)
        .bind(game.is_displayed)
        .bind(&game.cover)
        .bind(&game.background)
        .bind(&game.description)
        .bind(&game.developer)
        .bind(&game.save_data_path)
        .bind(&game.backup_data_path)
        .bind(game.play_time)
        .bind(game.length)
        .bind(game.size)
        .bind(game.last_played_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

        if allow_downloading {
            GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask {
                meta: game,
                target: ResourceTarget::All,
            });
        }
    }

    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 更新单个游戏信息
#[tauri::command]
pub async fn update_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    debug!("后端收到要更新的游戏: {}", game.id);

    let mut tx: Transaction<'_, Sqlite> = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 查询旧数据，判断哪些资源发生了变化
    let row = sqlx::query("SELECT cover, background FROM games WHERE id = ?")
        .bind(&game.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let resource_target = match row {
        Some(old) => {
            let cover_changed = old.get::<String, _>("cover") != game.cover;
            let bg_changed = old.get::<String, _>("background") != game.background;
            match (cover_changed, bg_changed) {
                (true, true) => Some(ResourceTarget::All),
                (true, false) => Some(ResourceTarget::CoverOnly),
                (false, true) => Some(ResourceTarget::BackgroundOnly),
                _ => None,
            }
        }
        // 数据库里没有说明是新游戏，全量下载
        None => Some(ResourceTarget::All),
    };

    sqlx::query(
        r#"UPDATE games SET
            name = ?, abs_path = ?, is_passed = ?, is_displayed = ?,
            cover = ?, background = ?, description = ?, developer = ?,
            local_cover = COALESCE(?, local_cover),
            local_background = COALESCE(?, local_background),
            save_data_path = ?, backup_data_path = ?,
            play_time = ?, length = ?, size = ?, last_played_at = ?
        WHERE id = ?"#,
    )
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(game.is_passed)
    .bind(game.is_displayed)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.description)
    .bind(&game.developer)
    .bind(&game.local_cover)
    .bind(&game.local_background)
    .bind(&game.save_data_path)
    .bind(&game.backup_data_path)
    .bind(game.play_time)
    .bind(game.length)
    .bind(game.size)
    .bind(game.last_played_at)
    .bind(&game.id)
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;

    // 有资源变动且允许下载时，才触发下载任务
    if let Some(target) = resource_target {
        let allow_downloading = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?
            .storage
            .allow_downloading_resources;

        if allow_downloading && (game.cover.starts_with("http") || game.background.starts_with("http")) {
            debug!("已向资源模块发送下载指令: {:?}", target);
            GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask { meta: game, target });
        }
    }

    Ok(())
}

/// 删除单个游戏
#[tauri::command]
pub async fn delete_game_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<(), AppError> {
    debug!("要删除的游戏信息: {}", id);

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query("DELETE FROM games WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            error!("删除游戏信息出错: {}", e);
            AppError::DB(e.to_string())
        })?;

    // 查出截图 id，用于后续删除物理文件
    let screenshot_ids: Vec<String> = sqlx::query("SELECT id FROM game_screenshots WHERE game_id = ?")
        .bind(&id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?
        .into_iter()
        .map(|row| row.get("id"))
        .collect();

    sqlx::query("DELETE FROM game_screenshots WHERE game_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query("DELETE FROM game_play_sessions WHERE game_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;

    // 从显示顺序中移除
    let mut config = GLOBAL_CONFIG.write().unwrap();
    let screenshot_dir = config.storage.screenshot_path.clone();
    let target_dirs = vec![
        config.storage.meta_save_path.clone(),
        config.storage.backup_save_path.clone(),
    ];
    config.basic.game_display_order.retain(|s| s != &id);
    drop(config);

    // 删除游戏截图文件
    for s_id in &screenshot_ids {
        if let Ok(entries) = std::fs::read_dir(&screenshot_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name().to_string_lossy().into_owned();
                if file_name.contains(s_id.as_str()) {
                    if let Err(e) = std::fs::remove_file(entry.path()) {
                        warn!("无法删除截图文件: {}", e);
                    }
                }
            }
        }
    }

    // 删除游戏相关资源文件/目录
    for dir in target_dirs {
        if !dir.exists() || !dir.is_dir() {
            continue;
        }
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name().to_string_lossy().into_owned();
                if file_name.contains(&id) {
                    let path = entry.path();
                    let result = if path.is_dir() {
                        std::fs::remove_dir_all(&path)
                    } else {
                        std::fs::remove_file(&path)
                    };
                    match result {
                        Ok(_) => info!("成功清理资源: {:?}", path),
                        Err(e) => warn!("无法删除 {:?}: {}", path, e),
                    }
                }
            }
        }
    }

    Ok(())
}

/// 删除所有游戏数据
#[tauri::command]
pub async fn delete_all_games(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query("DELETE FROM games").execute(&mut *tx).await.map_err(|e| AppError::DB(e.to_string()))?;
    sqlx::query("DELETE FROM game_screenshots").execute(&mut *tx).await.map_err(|e| AppError::DB(e.to_string()))?;
    sqlx::query("DELETE FROM game_play_sessions").execute(&mut *tx).await.map_err(|e| AppError::DB(e.to_string()))?;
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;

    let config = GLOBAL_CONFIG.read().unwrap();
    let target_dirs = vec![
        config.storage.meta_save_path.clone(),
        config.storage.backup_save_path.clone(),
        config.storage.screenshot_path.clone(),
    ];
    drop(config);

    for path in target_dirs {
        if path.exists() {
            let _ = std::fs::remove_dir_all(&path);
            let _ = std::fs::create_dir_all(&path);
        }
    }

    Ok(())
}

/// 启动游戏进程
#[tauri::command]
pub async fn start_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    execute_start_game(pool.inner().clone(), game).await
}

/// 获取所有游戏会话记录
#[tauri::command]
pub async fn get_sessions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<PlaySession>, AppError> {
    let rows = sqlx::query_as::<_, PlaySession>(
        "SELECT id, game_id, play_date, duration_minutes, last_played_at FROM game_play_sessions",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(rows)
}

/// 获取指定年份的游戏会话记录
#[tauri::command]
pub async fn get_sessions_by_year(
    year: String,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<PlaySession>, AppError> {
    let rows = sqlx::query_as::<_, PlaySession>(
        r#"SELECT id, game_id, play_date, duration_minutes, last_played_at
           FROM game_play_sessions
           WHERE strftime('%Y', play_date) = ?"#,
    )
    .bind(year)
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(rows)
}
