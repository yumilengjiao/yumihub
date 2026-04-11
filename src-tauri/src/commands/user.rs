//! 用户相关命令

use sqlx::{Pool, Sqlite};
use tauri::State;
use tauri_plugin_log::log::{debug, error, info};

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::entity::GameEvent,
    message::{traits::MessageHub, GAME_MESSAGE_HUB},
    user::entity::User,
};

/// 获取用户信息
#[tauri::command]
pub async fn get_user_info(pool: State<'_, Pool<Sqlite>>) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM account LIMIT 1")
        .fetch_optional(&*pool)
        .await
        .map_err(|e| {
            error!("获取用户信息失败: {}", e);
            AppError::DB(e.to_string())
        })?;

    Ok(user.unwrap_or_default())
}

/// 更新用户数据
#[tauri::command]
pub async fn update_user_info(
    pool: State<'_, Pool<Sqlite>>,
    account: User,
) -> Result<(), AppError> {
    let is_network_resource =
        account.avatar.starts_with("http://") || account.avatar.starts_with("https://");
    debug!("更新的用户数据: {:?}", account);

    sqlx::query(
        r#"
        INSERT OR REPLACE INTO account
        (
            id, user_name, avatar, favorite_game, games_count,
            total_play_time, games_completed_number, selected_disk,
            last_play_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&account.id)
    .bind(&account.user_name)
    .bind(&account.avatar)
    .bind(&account.favorite_game)
    .bind(account.games_count)
    .bind(account.total_play_time)
    .bind(account.games_completed_number)
    .bind(&account.selected_disk)
    .bind(account.last_play_at)
    .bind(account.created_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    if is_network_resource {
        let allow_downloading = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?
            .storage
            .allow_downloading_resources;
        if !allow_downloading {
            return Ok(());
        }
        info!("发送消息到消息平台下载用户头像资源");
        GAME_MESSAGE_HUB.publish(GameEvent::UserResourceTask {
            meta: account.clone(),
        });
    }

    info!("用户信息修改成功");
    Ok(())
}
