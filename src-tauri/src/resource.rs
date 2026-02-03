//! 资源模块,用于缓存二进制文件到本地而不走网络io

use std::sync::Arc;

use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log::{debug, error, info};
use tokio::sync::Semaphore;

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::entity::{GameEvent, GameMeta, ResourceTarget},
    message::{traits::MessageHub, GAME_MESSAGE_HUB},
    user::entity::User,
};

/// 资源模块初始化函数
pub fn init(app_handle: &AppHandle) {
    start_resource_manager(app_handle);
    info!("资源模块初始化函数成功")
}

/// 启动一个监听器负责监听游戏数据是否更新是否需要下载新的静态资源到本地
fn start_resource_manager(app_handle: &AppHandle) {
    let mut rx = GAME_MESSAGE_HUB.subscribe();
    let handle = app_handle.clone();

    // 获取并发数配置
    let num = GLOBAL_CONFIG
        .read()
        .expect("读取全局变量出错")
        .system
        .download_concurrency;

    let semaphore = Arc::new(Semaphore::new(num as usize));

    tauri::async_runtime::spawn(async move {
        info!("资源管理系统已启动，正在监听消息...");

        while let Ok(event) = rx.recv().await {
            match event {
                // 假设 GameResourceTask 现在接收 (GameMeta, ResourceTarget)
                GameEvent::GameResourceTask { meta, target } => {
                    let cp_handle = handle.clone();
                    let permit_semaphore = Arc::clone(&semaphore);

                    tauri::async_runtime::spawn(async move {
                        // 获取并发许可
                        let _permit = permit_semaphore.acquire_owned().await.unwrap();
                        debug!("处理游戏资源任务: {}, 目标: {:?}", meta.name, target);

                        let mut updated_meta = meta.clone();

                        // 根据 target 筛选需要处理的字段
                        let mut tasks = Vec::new();
                        match target {
                            ResourceTarget::All => {
                                tasks.push(("cover", &meta.cover));
                                tasks.push(("background", &meta.background));
                            }
                            ResourceTarget::CoverOnly => tasks.push(("cover", &meta.cover)),
                            ResourceTarget::BackgroundOnly => {
                                tasks.push(("background", &meta.background))
                            }
                        }

                        // 遍历并下载
                        for (label, url) in tasks {
                            if !url.starts_with("http") {
                                continue;
                            }

                            let file_name = format!("{}_{}.jpg", meta.id, label);
                            let assets_dir =
                                GLOBAL_CONFIG.read().unwrap().storage.meta_save_path.clone();
                            let save_path = assets_dir.join(file_name);

                            match reqwest::get(url).await {
                                Ok(res) if res.status().is_success() => {
                                    if let Ok(data) = res.bytes().await {
                                        if tokio::fs::write(&save_path, data).await.is_ok() {
                                            let local_path =
                                                save_path.to_string_lossy().to_string();
                                            // 更新相应的 local 字段
                                            match label {
                                                "cover" => {
                                                    updated_meta.local_cover = Some(local_path)
                                                }
                                                "background" => {
                                                    updated_meta.local_background = Some(local_path)
                                                }
                                                _ => {}
                                            }
                                            debug!("{} 下载成功并保存至本地", label);
                                        }
                                    }
                                }
                                Ok(res) => error!("下载 {} 失败, 状态码: {}", label, res.status()),
                                Err(e) => error!("下载 {} 网络错误: {}", label, e),
                            }
                        }

                        // 同步到数据库
                        let pool = cp_handle.state::<Pool<Sqlite>>();
                        if let Err(e) = update_game_into_db(&pool, &updated_meta).await {
                            error!("同步数据库失败: {}", e);
                        } else {
                            debug!("游戏数据同步成功: {}", updated_meta.name);
                        }
                    });
                }

                GameEvent::UserResourceTask { meta } => {
                    // User 部分逻辑保持原样，仅做少量结构优化
                    let cp_handle = handle.clone();
                    tauri::async_runtime::spawn(async move {
                        info!("开始下载用户头像...");
                        let asset_path = GLOBAL_CONFIG
                            .read()
                            .unwrap()
                            .storage
                            .meta_save_path
                            .join("user");

                        // 确保文件夹存在
                        let _ = tokio::fs::create_dir_all(&asset_path).await;

                        let file_name = format!("{}-avatar.jpg", meta.id);
                        let save_path = asset_path.join(file_name);
                        let mut updated_user = meta.clone();

                        if let Ok(res) = reqwest::get(&meta.avatar).await {
                            if res.status().is_success() {
                                if let Ok(data) = res.bytes().await {
                                    if tokio::fs::write(&save_path, data).await.is_ok() {
                                        updated_user.avatar =
                                            save_path.to_string_lossy().to_string();

                                        let pool = cp_handle.state::<Pool<Sqlite>>();
                                        let _ = update_user_into_db(&pool, &updated_user).await;
                                        info!("用户头像同步完成");
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    });
}

/// 将下载好资源的数据的图片地址写入并更新到数据库
///
/// * `pool`: 数据库连接池
/// * `updated_meta`: 要更新的游戏数据
async fn update_game_into_db(pool: &Pool<Sqlite>, updated_meta: &GameMeta) -> Result<(), AppError> {
    sqlx::query(
        r#"
    update games set
        local_cover = ?,
        local_background = ?
        where id = ?
    "#,
    )
    .bind(&updated_meta.local_cover)
    .bind(&updated_meta.local_background)
    .bind(&updated_meta.id)
    .execute(pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 将下载好资源的数据的图片地址写入并更新到数据库
///
/// * `pool`: 数据库连接池
/// * `updated_meta`: 要更新的用户数据
async fn update_user_into_db(pool: &Pool<Sqlite>, updated_meta: &User) -> Result<(), AppError> {
    sqlx::query(
        r#"
    INSERT OR REPLACE INTO user 
    (id, user_name, avatar,  games_count, favorite_game, total_play_time, games_completed_number, last_play_at, created_at) 
    VALUES (?, ?,  ?, ?, ?, ?, ?, ?, ? )
    "#,
    )
    .bind(&updated_meta.id)
    .bind(&updated_meta.user_name)
    .bind(&updated_meta.avatar)
    .bind(updated_meta.games_count)
    .bind(&updated_meta.favorite_game)
    .bind(updated_meta.total_play_time)
    .bind(updated_meta.games_completed_number)
    .bind(updated_meta.last_play_at)
    .bind(updated_meta.created_at)
    .execute(pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}
