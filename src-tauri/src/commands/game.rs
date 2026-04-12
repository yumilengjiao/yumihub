use sqlx::{Pool, Row, Sqlite};
use tauri::State;
use tauri_plugin_log::log::{debug, info, warn};

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::{
        commands::launch,
        entity::{GameEvent, GameMeta, GameMetaList, PlaySession, ResourceTarget},
    },
    message::{traits::MessageHub, GAME_HUB},
};

#[tauri::command]
pub async fn get_game_meta_list(pool: State<'_, Pool<Sqlite>>) -> Result<GameMetaList, AppError> {
    let games = sqlx::query_as(
        "SELECT id, name, abs_path, is_passed, is_displayed, cover, background, \
         description, developer, local_cover, local_background, save_data_path, \
         backup_data_path, play_time, length, size, last_played_at \
         FROM games",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)?;
    info!("查询游戏列表成功");
    Ok(games)
}

#[tauri::command]
pub async fn get_game_meta_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<GameMeta, AppError> {
    sqlx::query_as(
        "SELECT id, name, abs_path, is_passed, is_displayed, cover, background, \
         description, developer, local_cover, local_background, save_data_path, \
         backup_data_path, play_time, length, size, last_played_at \
         FROM games WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(AppError::from)
}

#[tauri::command]
pub async fn add_new_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    debug!("添加新游戏: {:?}", game.name);
    insert_game(&pool, &game).await?;
    trigger_resource_download(&game, ResourceTarget::All)?;
    Ok(())
}

#[tauri::command]
pub async fn add_new_game_list(
    pool: State<'_, Pool<Sqlite>>,
    games: Vec<GameMeta>,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await.map_err(AppError::from)?;

    for game in &games {
        sqlx::query(INSERT_GAME_SQL)
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
            .map_err(AppError::from)?;
    }

    tx.commit().await.map_err(AppError::from)?;

    let allow = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .storage
        .allow_downloading_resources;
    if allow {
        for game in games {
            GAME_HUB.publish(GameEvent::GameResourceTask {
                meta: game,
                target: ResourceTarget::All,
            });
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn update_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    debug!("更新游戏: {}", game.id);

    // 检查资源是否变更
    let old = sqlx::query("SELECT cover, background FROM games WHERE id = ?")
        .bind(&game.id)
        .fetch_optional(&*pool)
        .await
        .map_err(AppError::from)?;

    let resource_target = match old {
        Some(row) => {
            let oc: String = row.get("cover");
            let ob: String = row.get("background");
            match (oc != game.cover, ob != game.background) {
                (true, true) => Some(ResourceTarget::All),
                (true, false) => Some(ResourceTarget::CoverOnly),
                (false, true) => Some(ResourceTarget::BackgroundOnly),
                _ => None,
            }
        }
        None => Some(ResourceTarget::All),
    };

    sqlx::query(
        "UPDATE games SET \
         name=?, abs_path=?, is_passed=?, is_displayed=?, cover=?, background=?, \
         description=?, developer=?, \
         local_cover=COALESCE(?, local_cover), local_background=COALESCE(?, local_background), \
         save_data_path=?, backup_data_path=?, play_time=?, length=?, size=?, last_played_at=? \
         WHERE id=?",
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
    .execute(&*pool)
    .await
    .map_err(AppError::from)?;

    if let Some(target) = resource_target {
        if game.cover.starts_with("http") || game.background.starts_with("http") {
            trigger_resource_download(&game, target)?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_game_by_id(pool: State<'_, Pool<Sqlite>>, id: String) -> Result<(), AppError> {
    let mut tx = pool.begin().await.map_err(AppError::from)?;

    // 收集截图 ID
    let screenshot_ids: Vec<String> =
        sqlx::query("SELECT id FROM game_screenshots WHERE game_id = ?")
            .bind(&id)
            .fetch_all(&mut *tx)
            .await
            .map_err(AppError::from)?
            .into_iter()
            .map(|r| r.get("id"))
            .collect();

    sqlx::query("DELETE FROM games WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    sqlx::query("DELETE FROM game_screenshots WHERE game_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    sqlx::query("DELETE FROM game_play_sessions WHERE game_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;

    tx.commit().await.map_err(AppError::from)?;

    // 从显示顺序中移除
    let mut cfg = GLOBAL_CONFIG.write().unwrap();
    let screenshot_dir = cfg.storage.screenshot_path.clone();
    let resource_dirs = [
        cfg.storage.meta_save_path.clone(),
        cfg.storage.backup_save_path.clone(),
    ];
    cfg.basic.game_display_order.retain(|s| s != &id);
    drop(cfg);

    // 删除截图物理文件
    for sid in &screenshot_ids {
        if let Ok(entries) = std::fs::read_dir(&screenshot_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().into_owned();
                if name.contains(sid.as_str()) {
                    let _ = std::fs::remove_file(entry.path());
                }
            }
        }
    }

    // 删除游戏资源文件
    for dir in &resource_dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().into_owned();
                if name.contains(&id) {
                    let p = entry.path();
                    let r = if p.is_dir() {
                        std::fs::remove_dir_all(&p)
                    } else {
                        std::fs::remove_file(&p)
                    };
                    if let Err(e) = r {
                        warn!("清理资源失败 {:?}: {}", p, e);
                    }
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_all_games(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let mut tx = pool.begin().await.map_err(AppError::from)?;
    sqlx::query("DELETE FROM games")
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    sqlx::query("DELETE FROM game_screenshots")
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    sqlx::query("DELETE FROM game_play_sessions")
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    tx.commit().await.map_err(AppError::from)?;

    let cfg = GLOBAL_CONFIG.read().unwrap();
    let dirs = [
        &cfg.storage.meta_save_path,
        &cfg.storage.backup_save_path,
        &cfg.storage.screenshot_path,
    ];
    for dir in dirs {
        if dir.exists() {
            let _ = std::fs::remove_dir_all(dir);
            let _ = std::fs::create_dir_all(dir);
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn start_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    launch(pool.inner().clone(), game).await
}

#[tauri::command]
pub async fn get_sessions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<PlaySession>, AppError> {
    sqlx::query_as(
        "SELECT id, game_id, play_date, duration_minutes, last_played_at FROM game_play_sessions",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)
}

#[tauri::command]
pub async fn get_sessions_by_year(
    year: String,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<PlaySession>, AppError> {
    sqlx::query_as(
        "SELECT id, game_id, play_date, duration_minutes, last_played_at \
         FROM game_play_sessions WHERE strftime('%Y', play_date) = ?",
    )
    .bind(year)
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)
}

// ── 内部复用 ──────────────────────────────────────────────────────────────────

const INSERT_GAME_SQL: &str = "INSERT OR REPLACE INTO games \
     (id, name, abs_path, is_passed, is_displayed, cover, background, description, \
      developer, save_data_path, backup_data_path, play_time, length, size, last_played_at) \
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

async fn insert_game(pool: &Pool<Sqlite>, game: &GameMeta) -> Result<(), AppError> {
    sqlx::query(INSERT_GAME_SQL)
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
        .execute(pool)
        .await
        .map_err(AppError::from)?;
    Ok(())
}

fn trigger_resource_download(game: &GameMeta, target: ResourceTarget) -> Result<(), AppError> {
    let allow = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .storage
        .allow_downloading_resources;
    if allow {
        GAME_HUB.publish(GameEvent::GameResourceTask {
            meta: game.clone(),
            target,
        });
    }
    Ok(())
}
