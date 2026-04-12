//! 数据库初始化模块

use database::setup_database;
use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::info;

pub fn init(handle: &AppHandle) {
    tauri::async_runtime::block_on(async {
        let pool = connect(handle).await;
        handle.manage(pool);
    });
}

async fn connect(handle: &AppHandle) -> Pool<Sqlite> {
    let app_dir = handle
        .path()
        .app_local_data_dir()
        .expect("无法获取应用数据目录");

    std::fs::create_dir_all(&app_dir).expect("无法创建应用数据目录");

    let db_path = app_dir.join("app.db");
    let pool = setup_database(&db_path)
        .await
        .expect("数据库初始化失败");

    info!("数据库就绪: {:?}", db_path);
    pool
}
