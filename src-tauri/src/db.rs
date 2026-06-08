//! 数据库初始化模块

use database::setup_database;
use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::info;

use crate::error::AppError;

pub fn init(handle: &AppHandle) -> Result<(), AppError> {
    let pool = tauri::async_runtime::block_on(async { connect(handle).await })?;
    handle.manage(pool);
    Ok(())
}

async fn connect(handle: &AppHandle) -> Result<Pool<Sqlite>, AppError> {
    let app_dir = handle
        .path()
        .app_local_data_dir()
        .map_err(|e| AppError::Resolve("app_local_data_dir".into(), e.to_string()))?;

    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("app.db");
    let pool = setup_database(&db_path).await?;

    info!("数据库就绪: {:?}", db_path);
    Ok(pool)
}
