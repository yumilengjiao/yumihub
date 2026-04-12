use sqlx::{Pool, Sqlite};
use tauri::State;
use tauri_plugin_log::log::info;

use crate::{
    config::GLOBAL_CONFIG,
    error::AppError,
    game::entity::GameEvent,
    message::{traits::MessageHub, GAME_HUB},
    user::entity::User,
};

#[tauri::command]
pub async fn get_user_info(pool: State<'_, Pool<Sqlite>>) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM account LIMIT 1")
        .fetch_optional(&*pool)
        .await
        .map_err(AppError::from)?;
    Ok(user.unwrap_or_default())
}

#[tauri::command]
pub async fn update_user_info(
    pool: State<'_, Pool<Sqlite>>,
    account: User,
) -> Result<(), AppError> {
    let is_network = account.avatar.starts_with("http");

    sqlx::query(
        "INSERT OR REPLACE INTO account \
         (id, user_name, avatar, favorite_game, games_count, total_play_time, \
          games_completed_number, selected_disk, last_play_at, created_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    .map_err(AppError::from)?;

    let allow = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .storage
        .allow_downloading_resources;

    if is_network && allow {
        info!("触发用户头像下载任务");
        GAME_HUB.publish(GameEvent::UserResourceTask { meta: account });
    }

    Ok(())
}
