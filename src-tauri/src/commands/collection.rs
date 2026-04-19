use sqlx::{Pool, Sqlite};
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

/// 获取所有收藏夹（含每个收藏夹内的 game_id 列表）
#[tauri::command]
pub async fn get_collections(
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<Collection>, AppError> {
    let collections = sqlx::query_as::<_, Collection>(
        "SELECT id, name, description, created_at FROM collections ORDER BY created_at ASC",
    )
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)?;
    Ok(collections)
}

/// 获取某个收藏夹内所有游戏的 id
#[tauri::command]
pub async fn get_collection_game_ids(
    pool: State<'_, Pool<Sqlite>>,
    collection_id: String,
) -> Result<Vec<String>, AppError> {
    let rows = sqlx::query_scalar::<_, String>(
        "SELECT game_id FROM collection_games WHERE collection_id = ? ORDER BY added_at ASC",
    )
    .bind(&collection_id)
    .fetch_all(&*pool)
    .await
    .map_err(AppError::from)?;
    Ok(rows)
}

/// 创建收藏夹
#[tauri::command]
pub async fn create_collection(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
    name: String,
    description: Option<String>,
) -> Result<Collection, AppError> {
    sqlx::query(
        "INSERT INTO collections (id, name, description) VALUES (?, ?, ?)",
    )
    .bind(&id)
    .bind(&name)
    .bind(&description)
    .execute(&*pool)
    .await
    .map_err(AppError::from)?;

    let col = sqlx::query_as::<_, Collection>(
        "SELECT id, name, description, created_at FROM collections WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&*pool)
    .await
    .map_err(AppError::from)?;

    Ok(col)
}

/// 删除收藏夹（关联的 collection_games 行会通过 CASCADE 自动删除）
#[tauri::command]
pub async fn delete_collection(
    pool: State<'_, Pool<Sqlite>>,
    collection_id: String,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM collections WHERE id = ?")
        .bind(&collection_id)
        .execute(&*pool)
        .await
        .map_err(AppError::from)?;
    Ok(())
}

/// 重命名收藏夹
#[tauri::command]
pub async fn rename_collection(
    pool: State<'_, Pool<Sqlite>>,
    collection_id: String,
    name: String,
) -> Result<(), AppError> {
    sqlx::query("UPDATE collections SET name = ? WHERE id = ?")
        .bind(&name)
        .bind(&collection_id)
        .execute(&*pool)
        .await
        .map_err(AppError::from)?;
    Ok(())
}

/// 把游戏加入收藏夹（已存在则忽略）
#[tauri::command]
pub async fn add_game_to_collection(
    pool: State<'_, Pool<Sqlite>>,
    collection_id: String,
    game_id: String,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT OR IGNORE INTO collection_games (collection_id, game_id) VALUES (?, ?)",
    )
    .bind(&collection_id)
    .bind(&game_id)
    .execute(&*pool)
    .await
    .map_err(AppError::from)?;
    Ok(())
}

/// 从收藏夹移除游戏
#[tauri::command]
pub async fn remove_game_from_collection(
    pool: State<'_, Pool<Sqlite>>,
    collection_id: String,
    game_id: String,
) -> Result<(), AppError> {
    sqlx::query(
        "DELETE FROM collection_games WHERE collection_id = ? AND game_id = ?",
    )
    .bind(&collection_id)
    .bind(&game_id)
    .execute(&*pool)
    .await
    .map_err(AppError::from)?;
    Ok(())
}
