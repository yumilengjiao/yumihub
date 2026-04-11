//! 连携程序相关命令

use sqlx::{Pool, Sqlite};
use tauri::State;

use crate::{
    companion::entity::Companion,
    error::AppError,
};

/// 查询所有连携程序
#[tauri::command]
pub async fn get_companions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<Companion>, AppError> {
    sqlx::query_as::<_, Companion>(
        "SELECT id, name, path, args, is_enabled, is_window_managed, trigger_mode, sort_order, description
         FROM companions",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(format!("数据库查询失败: {}", e)))
}

/// 全量替换所有连携程序（先清空再插入）
#[tauri::command]
pub async fn update_companions(
    companions: Vec<Companion>,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<(), AppError> {
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query("DELETE FROM companions")
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(format!("数据删除失败: {}", e)))?;

    for item in companions {
        sqlx::query(
            r#"INSERT INTO companions
            (name, path, args, is_enabled, is_window_managed, trigger_mode, sort_order, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(item.name)
        .bind(item.path)
        .bind(item.args)
        .bind(item.is_enabled)
        .bind(item.is_window_managed)
        .bind(item.trigger_mode)
        .bind(item.sort_order)
        .bind(item.description)
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(format!("数据更新失败: {}", e)))?;
    }

    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}
