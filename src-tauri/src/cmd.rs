//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
use sqlx::{Pool, Sqlite};
use tauri::State;
use tauri_plugin_log::log::info;

use crate::{
    config::entity::{GameMeta, GameMetaList},
    error::AppError,
    message::{entity::SystemEvent, MESSAGE_HUB},
    user::entity::User,
};

// --------------------------------------------------------
// --------------------------用户类------------------------
// --------------------------------------------------------

#[tauri::command]
/// 获取用户信息
///
/// * `pool`: 连接池,tauri自动注入
pub async fn get_user_info(pool: State<'_, Pool<Sqlite>>) -> Result<User, AppError> {
    // 假设你目前只有一个用户，我们可以直接取第一条
    // 如果没有用户，这里会返回错误，你可以根据需要返回一个默认 User
    let user = sqlx::query_as::<_, User>("SELECT * FROM user LIMIT 1")
        .fetch_optional(&*pool) // 使用 fetch_optional 防止表为空时直接崩溃
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 如果数据库没数据，返回一个默认值，或者报错
    Ok(user.unwrap_or_default())
}

#[tauri::command]
/// 更新用户数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `user`: 用户信息
pub async fn update_user_info(pool: State<'_, Pool<Sqlite>>, user: User) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO user 
        (id, user_name, avatar, games_count, favorite_vn_id, total_play_time, games_completed_number, last_play_at, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&user.id)
    .bind(&user.user_name)
    .bind(&user.avatar)
    .bind(user.games_count)
    .bind(&user.favorite_vn_id)
    .bind(user.total_play_time)
    .bind(user.games_completed_number)
    .bind(user.last_play_at)
    .bind(user.created_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

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
        "SELECT id, name, abs_path, cover, background, local_cover, local_background, play_time, length, size, last_played_at FROM games"
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
        "SELECT id, name, abs_path, cover, background,local_cover,local_background, play_time, length, size, last_played_at FROM games"
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
    model: bool,    //说明是否需要再次下载静态资源
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO games 
        (id, name, abs_path, cover, background, local_cover, local_background, play_time, length, size, last_played_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&game.id)
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.local_cover)
    .bind(&game.local_background)
    .bind(game.play_time) // i64
    .bind(game.length)    // i64
    .bind(game.size)      // Option<i64>
    .bind(game.last_played_at) // DateTime<Local> (需开启 chrono feature)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    // 向消息模块发布信息说明有资源需要下载
    if model {
        MESSAGE_HUB.publish(SystemEvent::ResourceTaskCreated { meta: game })
    }
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
            "INSERT OR REPLACE INTO games (id, name, abs_path, cover, background, play_time, length) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&game.id)
        .bind(&game.name)
        .bind(&game.abs_path)
        .bind(&game.cover)
        .bind(&game.background)
        .bind(game.play_time)
        .bind(game.length)
        // ... 继续绑定其他字段
        .execute(&mut *tx) // 注意这里是在事务中执行
        .await
        .map_err(|e|AppError::DB(e.to_string()))?;
        MESSAGE_HUB.publish(SystemEvent::ResourceTaskCreated { meta: game });
    }

    // 提交事务
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 异步覆盖更新所有游戏数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `games`: 要覆盖更新的游戏列表数据
#[tauri::command]
pub async fn update_game_meta_list(
    pool: State<'_, Pool<Sqlite>>,
    games: Vec<GameMeta>,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM games").execute(&*pool).await.ok();
    add_new_game_list(pool, games).await
}
