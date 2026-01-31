//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
use std::path::PathBuf;

use sqlx::Row;
use sqlx::{Pool, Sqlite};
use tauri::{async_runtime, State};
use tauri_plugin_log::log::{debug, error, info};

use crate::{
    config::{
        entity::{Config, ConfigEvent},
        GLOBAL_CONFIG,
    },
    error::AppError,
    game::entity::{GameEvent, GameMeta, GameMetaList},
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB, GAME_MESSAGE_HUB},
    user::entity::User,
    util::{self, zip_directory_sync},
};

// --------------------------------------------------------
// --------------------------用户类------------------------
// --------------------------------------------------------

#[tauri::command]
/// 获取用户信息
///
/// * `pool`: 连接池,tauri自动注入
pub async fn get_user_info(pool: State<'_, Pool<Sqlite>>) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM account LIMIT 1")
        .fetch_optional(&*pool) // 使用 fetch_optional 防止表为空时直接崩溃
        .await
        .map_err(|e| {
            error!("获取用户信息失败: {}", e);
            AppError::DB(e.to_string())
        })?;

    // 如果数据库没数据，返回一个默认值，或者报错
    Ok(user.unwrap_or_default())
}

/// 更新用户数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `account`: 用户信息
#[tauri::command]
pub async fn update_user_info(
    pool: State<'_, Pool<Sqlite>>,
    account: User,
) -> Result<(), AppError> {
    // 先查询头像是否是网络资源是就下载资源
    let is_network_resource =
        account.avatar.starts_with("http://") || account.avatar.starts_with("https://");

    sqlx::query(
        r#"
        INSERT OR REPLACE INTO account
        (
            id,
            user_name,
            avatar,
            games_count,
            favorite_game,
            total_play_time,
            games_completed_number,
            last_play_at,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&account.id)
    .bind(&account.user_name)
    .bind(&account.avatar)
    .bind(&account.favorite_game)
    .bind(account.games_count)
    .bind(account.total_play_time)
    .bind(account.games_completed_number)
    .bind(account.last_play_at)
    .bind(account.created_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    if is_network_resource {
        info!("发送消息到消息平台下载用户头像资源");
        GAME_MESSAGE_HUB.publish(GameEvent::UserResourceTask {
            meta: account.clone(),
        });
    }

    info!("用户信息修改成功");
    Ok(())
}

// --------------------------------------------------------
// ----------------------游戏类信息类----------------------
// --------------------------------------------------------

/// 从数据库查询所有游戏数据
///
/// * `pool`: 连接池,tauri自动注入
#[tauri::command]
pub async fn get_game_meta_list(pool: State<'_, Pool<Sqlite>>) -> Result<GameMetaList, AppError> {
    println!("开始查询数据");
    let games = sqlx::query_as(
        "SELECT id,
                name,
                abs_path,
                cover,
                background, 
                local_cover,
                local_background,
                save_data_path,
                backup_data_path,
                play_time,
                length,
                size,
                last_played_at 
        FROM games",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    info!("查询数据成功");
    Ok(games)
}

/// 通过id查询单个游戏数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `id`: 游戏的唯一id
#[tauri::command]
pub async fn get_game_meta_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<GameMeta, AppError> {
    let game = sqlx::query_as(
        "SELECT id,
                name,
                abs_path,
                cover,
                background,
                local_cover,
                local_background,
                save_data_path,
                backup_data_path,
                play_time,
                length,
                size,
                last_played_at
        FROM games where id = ?",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    Ok(game)
}

/// 用于添加/修改单个游戏到游戏库
///
/// * `pool`: 连接池,tauri自动注入
/// * `game`: 要添加的单个游戏信息
#[tauri::command]
pub async fn add_new_game(
    pool: State<'_, Pool<Sqlite>>,
    game: GameMeta, // 确保 GameMeta 的字段已经是 i64
) -> Result<(), AppError> {
    debug!("接收到要添加的新数据: {:?}", game);
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO games 
        (
            id,
            name,
            abs_path,
            cover,
            background,
            local_cover,
            local_background,
            save_data_path,
            backup_data_path,
            play_time,
            length,
            size,
            last_played_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&game.id)
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.local_cover)
    .bind(&game.local_background)
    .bind(game.play_time) // i64
    .bind(game.length) // i64
    .bind(game.size) // Option<i64>
    .bind(game.last_played_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    // 向消息模块发布信息说明有资源需要下载
    GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask { meta: game });
    Ok(())
}

/// 用于添加多个游戏到游戏库
///
/// * `pool`: 连接池,tauri自动注入
/// * `games`: 要添加的游戏列表
#[tauri::command]
pub async fn add_new_game_list(
    pool: State<'_, Pool<Sqlite>>,
    games: Vec<GameMeta>, // 假设 GameMetaList 是 Vec 的包装，这里直接用 Vec
) -> Result<(), AppError> {
    // 开启事务
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    for game in games {
        sqlx::query(
            "INSERT OR REPLACE INTO games 
                (
                    id,
                    name,
                    abs_path,
                    cover,
                    background,
                    local_cover,
                    local_background,
                    save_data_path,
                    backup_data_path,
                    play_time,
                    length,
                    size,
                    last_played_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&game.id)
        .bind(&game.name)
        .bind(&game.abs_path)
        .bind(&game.cover)
        .bind(&game.background)
        .bind(&game.local_cover)
        .bind(&game.local_background)
        .bind(game.play_time) // i64
        .bind(game.length) // i64
        .bind(game.size) // Option<i64>
        .bind(game.last_played_at)
        .execute(&mut *tx) // 这里在事务中执行
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;
        GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask { meta: game });
    }

    // 提交事务
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 用于删除单个游戏信息
///
/// * `pool`: 连接池,tauri自动注入
/// * `id`: 游戏信息id
#[tauri::command]
pub async fn delete_game(pool: State<'_, Pool<Sqlite>>, id: String) -> Result<(), AppError> {
    debug!("要删除的游戏信息: {}", id);
    // 开启事务
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query(
        r#"
        delete from games where id = ?
    "#,
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        error!("删除游戏信息出错: {}", e);
        AppError::DB(e.to_string())
    })?;
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 异步删除所有游戏数据
///
/// * `pool`: 连接池,tauri自动注入
#[tauri::command]
pub async fn delete_game_list(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM games").execute(&*pool).await.ok();
    Ok(())
}

// --------------------------------------------------------
// ------------------------配置类--------------------------
// --------------------------------------------------------

/// 更新配置信息
///
/// * `app`: app句柄，自动注入
/// * `config`: 要更新的配置信息
#[tauri::command]
pub async fn update_config(config: Config) {
    let result = GLOBAL_CONFIG.read();
    match result {
        Ok(old_config) => {
            if old_config.basic != config.basic {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Basic { base: config.basic });
            }
            if old_config.interface != config.interface {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Interface {
                    interface: config.interface,
                });
            }
            if old_config.storage != config.storage {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Storage {
                    stroage: config.storage,
                });
            }
            if old_config.system != config.system {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::System { sys: config.system });
            }
        }
        Err(e) => {
            error!("无法获取全局配置信息,无法更新配置,错误: {}", e);
        }
    }
}

// --------------------------------------------------------
// ------------------------工具类--------------------------
// --------------------------------------------------------

/// 从父目录获取游戏的启动文件的文件名字
///
/// * `parent_path`: 游戏父目录
#[tauri::command]
pub fn get_start_up_path(parent_path: String) -> Result<String, AppError> {
    util::get_start_up_program(parent_path)
}

/// 将数据库的所有指定了游戏存档的游戏都进行备份
///
/// * `pool`: 数据库连接池，由tauri自动注入
#[tauri::command]
pub async fn backup_archive(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 获取备份根目录
    let backup_root = {
        let config = GLOBAL_CONFIG.read().unwrap();
        config.storage.backup_save_path.clone()
    };

    // 遍历并异步执行打包
    for row in games {
        let save_path: Option<String> = row.get("save_data_path");
        let backup_dir = backup_root.clone();
        let game_id: String = row.get("id");

        if save_path.is_none() {
            continue;
        }
        let save_path: PathBuf = save_path.unwrap().into();

        // 使用 spawn_blocking 将同步的压缩逻辑丢到后台线程池，不阻塞主异步流
        async_runtime::spawn_blocking(move || {
            let zip_file_path = backup_dir.join(format!("game_{}.zip", game_id));
            if let Err(e) = zip_directory_sync(&save_path, &zip_file_path) {
                eprintln!("备份游戏 {} 失败: {}", game_id, e);
            }
        })
        .await
        .map_err(|e| AppError::File(e.to_string()))?;
    }

    Ok(())
}
