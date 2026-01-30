//! 资源模块,用于缓存二进制文件到本地而不走网络io

use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error, info};

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::entity::{GameEvent, GameMeta},
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
    // 获取一个新的接收者
    let mut rx = GAME_MESSAGE_HUB.subscribe();
    let handle = app_handle.clone();

    // 启动一个下载图片的任务
    tauri::async_runtime::spawn(async move {
        println!("资源管理系统已启动，正在监听消息...");

        while let Ok(event) = rx.recv().await {
            match event {
                GameEvent::GameResourceTask { meta } => {
                    info!("收到新游戏通知: {}, 准备下载资源...", meta.name);
                    let res = reqwest::get(&meta.cover).await;
                    match res {
                        Ok(res) => {
                            if !res.status().is_success() {
                                error!(
                                    "获取网络资源失败,游戏id: {},状态码: {}",
                                    meta.id,
                                    res.status()
                                );
                            }
                            // 准备更新容器
                            let mut updated_meta = meta.clone();

                            // 要处理的字段
                            let targets = [
                                ("cover", &meta.cover),
                                ("background", &meta.background),
                                // 以后要加字段，直接在这里
                            ];

                            // 开始遍历处理所有字段
                            for (label, url) in targets {
                                // 只有网络地址才处理
                                if url.starts_with("http") {
                                    let file_name = format!("{}_{}.jpg", meta.id, label);
                                    let assets_dir = GLOBAL_CONFIG
                                        .read()
                                        .expect("路径未初始化")
                                        .storage
                                        .meta_save_path
                                        .clone();
                                    info!("资源路径是:{}", assets_dir.to_string_lossy());
                                    let save_path = assets_dir.join(file_name);

                                    // 执行请求
                                    if let Ok(res) = reqwest::get(url).await {
                                        if res.status().is_success() {
                                            if let Ok(data) = res.bytes().await {
                                                if tokio::fs::write(&save_path, data).await.is_ok()
                                                {
                                                    //因为上面改过名字了不用担心有非utf-8的字符
                                                    let local_path =
                                                        save_path.to_string_lossy().to_string();

                                                    match label {
                                                        "cover" => {
                                                            updated_meta.local_cover =
                                                                Some(local_path)
                                                        }
                                                        "background" => {
                                                            updated_meta.local_background =
                                                                Some(local_path)
                                                        }
                                                        // 以后增加字段，就这里补一个分支，编译器会提醒
                                                        _ => {}
                                                    }

                                                    info!(
                                                        "{} 下载成功: {} , 下载至:{}",
                                                        label,
                                                        meta.id,
                                                        save_path.to_string_lossy(),
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // 处理完字段后对meta数据进行更新
                            let pool = handle.state::<Pool<Sqlite>>();
                            let db_result = update_game_into_db(&pool, &updated_meta).await;
                            match db_result {
                                Ok(_) => {
                                    info!("游戏数据已成功同步至数据库: {}", updated_meta.id)
                                }
                                Err(e) => {
                                    error!("游戏数据保存失败: {}, 错误: {}", updated_meta.id, e)
                                }
                            }
                        }
                        Err(e) => {
                            error!("获取网络资源失败,游戏id: {},错误信息: {}", meta.id, e);
                        }
                    }
                }
                GameEvent::UserResourceTask { meta } => {
                    info!("接受到用户资源下载任务,开始下载任务");
                    let asset_path = GLOBAL_CONFIG
                        .read()
                        .expect("路径未初始化")
                        .storage
                        .meta_save_path
                        .join("user");
                    let file_name = format!("{}-{}.jpg", meta.id, "avatar");
                    let local_avatar = asset_path.join(&file_name).to_string_lossy().to_string();
                    let mut updated_meta = meta.clone();
                    let res = reqwest::get(meta.avatar).await;
                    match res {
                        Ok(response) => {
                            if response.status().is_success() {
                                if let Ok(data) = response.bytes().await {
                                    if tokio::fs::write(&local_avatar, data).await.is_ok() {
                                        updated_meta.avatar = local_avatar;
                                        info!("用户头像下载完毕")
                                    }
                                }
                            }
                        }
                        Err(e) => error!("下载网络资源错误: {}", e),
                    }
                    // 处理完字段后对user数据进行更新
                    let pool = handle.state::<Pool<Sqlite>>();
                    let db_result = update_user_into_db(&pool, &updated_meta).await;
                    match db_result {
                        Ok(_) => {
                            info!("用户数据已成功同步至数据库: {}", updated_meta.id)
                        }
                        Err(e) => {
                            error!("用户数据保存失败: {}, 错误: {}", updated_meta.id, e)
                        }
                    }
                }
                _ => (),
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
    INSERT OR REPLACE INTO games 
    (id, name, abs_path, cover, background, local_cover, local_background,save_data_path,backup_data_path, play_time, length, size, last_played_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    "#,
    )
    .bind(&updated_meta.id)
    .bind(&updated_meta.name)
    .bind(&updated_meta.abs_path)
    .bind(&updated_meta.cover)
    .bind(&updated_meta.background)
    .bind(&updated_meta.local_cover)
    .bind(&updated_meta.local_background)
    .bind(&updated_meta.save_data_path)
    .bind(&updated_meta.backup_data_path)
    .bind(updated_meta.play_time)
    .bind(updated_meta.length)
    .bind(updated_meta.size)
    .bind(updated_meta.last_played_at)
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
