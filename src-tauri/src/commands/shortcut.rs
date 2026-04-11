//! 快捷键相关命令

use sqlx::{Pool, Sqlite, SqlitePool};
use tauri::State;

use crate::{
    error::AppError,
    shortcut::{commands::refresh_shortcuts, entity::ShortcutSetting},
};

/// 查询所有快捷键
#[tauri::command]
pub async fn get_shortcuts(
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<ShortcutSetting>, AppError> {
    sqlx::query_as::<_, ShortcutSetting>(
        "SELECT id, key_combo, is_global FROM shortcut",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| AppError::DB(e.to_string()))
}

/// 更新所有快捷键，更新后立即刷新监听
#[tauri::command]
pub async fn update_shortcuts(
    app_handle: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
    shortcuts: Vec<ShortcutSetting>,
) -> Result<(), AppError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    for shortcut in shortcuts {
        sqlx::query("UPDATE shortcut SET key_combo = ? WHERE id = ?")
            .bind(&shortcut.key_combo)
            .bind(&shortcut.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::DB(e.to_string()))?;
    }

    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;

    refresh_shortcuts(&app_handle).await?;

    Ok(())
}
