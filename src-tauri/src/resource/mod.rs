//! 资源管理模块
//!
//! 监听 GAME_HUB 事件，异步下载游戏封面/背景/用户头像到本地。
//! 使用信号量控制并发数。

use std::sync::Arc;

use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error, info};
use tokio::sync::Semaphore;

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::entity::{GameEvent, GameMeta, ResourceTarget},
    message::{traits::MessageHub, GAME_HUB},
    user::entity::User,
};

pub fn init(handle: &AppHandle) {
    start(handle);
    info!("资源管理模块已启动");
}

fn start(handle: &AppHandle) {
    let mut rx = GAME_HUB.subscribe();
    let handle = handle.clone();

    let concurrency = GLOBAL_CONFIG
        .read()
        .expect("读取全局配置失败")
        .system
        .download_concurrency as usize;

    let sem = Arc::new(Semaphore::new(concurrency));

    tauri::async_runtime::spawn(async move {
        while let Ok(event) = rx.recv().await {
            match event {
                GameEvent::GameResourceTask { meta, target } => {
                    let sem = Arc::clone(&sem);
                    let handle = handle.clone();
                    tauri::async_runtime::spawn(async move {
                        let _permit = sem.acquire_owned().await.unwrap();
                        if let Err(e) = download_game_assets(&handle, meta, target).await {
                            error!("游戏资源下载失败: {}", e);
                        }
                    });
                }
                GameEvent::UserResourceTask { meta } => {
                    let handle = handle.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = download_user_avatar(&handle, meta).await {
                            error!("用户头像下载失败: {}", e);
                        }
                    });
                }
            }
        }
    });
}

// ── 游戏资源下载 ──────────────────────────────────────────────────────────────

async fn download_game_assets(
    handle: &AppHandle,
    meta: GameMeta,
    target: ResourceTarget,
) -> Result<(), AppError> {
    debug!("开始下载游戏资源: {} {:?}", meta.name, target);

    let save_dir = GLOBAL_CONFIG.read().unwrap().storage.meta_save_path.clone();

    // 确定需要下载哪些字段
    let tasks: Vec<(&str, &str)> = match target {
        ResourceTarget::All => vec![("cover", &meta.cover), ("background", &meta.background)],
        ResourceTarget::CoverOnly => vec![("cover", &meta.cover)],
        ResourceTarget::BackgroundOnly => vec![("background", &meta.background)],
    };

    let mut local_cover = meta.local_cover.clone();
    let mut local_background = meta.local_background.clone();

    for (label, url) in tasks {
        if !url.starts_with("http") {
            continue;
        }

        let save_path = save_dir.join(format!("{}_{}.jpg", meta.id, label));

        match download_file(url, &save_path).await {
            Ok(local_path) => {
                debug!("{} 下载完成: {}", label, local_path);
                match label {
                    "cover" => local_cover = Some(local_path),
                    "background" => local_background = Some(local_path),
                    _ => {}
                }
            }
            Err(e) => error!("{} 下载失败: {}", label, e),
        }
    }

    // 写回数据库
    let pool = handle.state::<Pool<Sqlite>>();
    sqlx::query("UPDATE games SET local_cover = ?, local_background = ? WHERE id = ?")
        .bind(&local_cover)
        .bind(&local_background)
        .bind(&meta.id)
        .execute(&*pool)
        .await
        .map_err(AppError::from)?;

    Ok(())
}

// ── 用户头像下载 ──────────────────────────────────────────────────────────────

async fn download_user_avatar(handle: &AppHandle, user: User) -> Result<(), AppError> {
    if !user.avatar.starts_with("http") {
        return Ok(());
    }

    info!("开始下载用户头像");

    let avatar_dir = GLOBAL_CONFIG
        .read()
        .unwrap()
        .storage
        .meta_save_path
        .join("user");

    tokio::fs::create_dir_all(&avatar_dir).await?;

    let save_path = avatar_dir.join(format!("{}-avatar.jpg", user.id));
    let local_path = download_file(&user.avatar, &save_path).await?;

    let pool = handle.state::<Pool<Sqlite>>();
    sqlx::query(
        "INSERT OR REPLACE INTO account \
         (id, user_name, avatar, games_count, favorite_game, total_play_time, \
          games_completed_number, selected_disk, last_play_at, created_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&user.id)
    .bind(&user.user_name)
    .bind(&local_path)
    .bind(user.games_count)
    .bind(&user.favorite_game)
    .bind(user.total_play_time)
    .bind(user.games_completed_number)
    .bind(&user.selected_disk)
    .bind(user.last_play_at)
    .bind(user.created_at)
    .execute(&*pool)
    .await
    .map_err(AppError::from)?;

    info!("用户头像已更新");
    Ok(())
}

// ── 通用 HTTP 下载 ────────────────────────────────────────────────────────────

async fn download_file(url: &str, save_path: &std::path::Path) -> Result<String, AppError> {
    let res = reqwest::get(url).await?;

    if !res.status().is_success() {
        return Err(AppError::Network(format!(
            "HTTP {} — {}",
            res.status(),
            url
        )));
    }

    let data = res.bytes().await?;
    tokio::fs::write(save_path, data).await?;

    Ok(save_path.to_string_lossy().to_string())
}
