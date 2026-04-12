use sqlx::{Pool, Sqlite, SqlitePool};
use tauri::State;

use crate::{
    error::AppError,
    shortcut::{commands::refresh_shortcuts, entity::ShortcutSetting},
};

#[tauri::command]
pub async fn get_shortcuts(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<ShortcutSetting>, AppError> {
    sqlx::query_as::<_, ShortcutSetting>("SELECT id, key_combo, is_global FROM shortcut")
        .fetch_all(pool.inner())
        .await
        .map_err(AppError::from)
}

#[tauri::command]
pub async fn update_shortcuts(
    app_handle: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
    shortcuts: Vec<ShortcutSetting>,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await.map_err(AppError::from)?;

    for s in shortcuts {
        sqlx::query("UPDATE shortcut SET key_combo = ? WHERE id = ?")
            .bind(&s.key_combo)
            .bind(&s.id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::from)?;
    }

    tx.commit().await.map_err(AppError::from)?;

    // 立即刷新运行中的监听
    refresh_shortcuts(&app_handle).await
}
