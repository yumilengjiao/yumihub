use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{companion::entity::Companion, error::AppError};

#[tauri::command]
pub async fn get_companions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<Companion>, AppError> {
    sqlx::query_as::<_, Companion>(
        "SELECT id, name, path, args, is_enabled, is_window_managed, \
         trigger_mode, sort_order, description FROM companions",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)
}

#[tauri::command]
pub async fn update_companions(
    companions: Vec<Companion>,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await.map_err(AppError::from)?;

    sqlx::query("DELETE FROM companions")
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;

    for c in companions {
        sqlx::query(
            "INSERT INTO companions \
             (name, path, args, is_enabled, is_window_managed, trigger_mode, sort_order, description) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(c.name).bind(c.path).bind(c.args)
        .bind(c.is_enabled).bind(c.is_window_managed)
        .bind(c.trigger_mode).bind(c.sort_order).bind(c.description)
        .execute(&mut *tx)
        .await
        .map_err(AppError::from)?;
    }

    tx.commit().await.map_err(AppError::from)
}
