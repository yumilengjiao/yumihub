//! db模块用来进行数据库的一些初始化操作

use database::setup_database;
use sqlx::{Pool, Sqlite};
use tauri::{AppHandle, Manager};

use tauri_plugin_log::log::info;

/// db模块初始化函数
pub fn init(app_handle: &AppHandle) {
    tauri::async_runtime::block_on(async move {
        let pool = init_db(app_handle).await;
        app_handle.manage(pool);
    });
}

/// 数据库初始化函数,用于创建数据库和表结构
///
/// * `app_handle`: tauri程序句柄
pub async fn init_db(app_handle: &AppHandle) -> Pool<Sqlite> {
    let app_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("找不到数据目录");

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).expect("创建数据库文件夹失败");
    }

    let db_path = app_dir.join("app.db");

    let pool = setup_database(&db_path)
        .await
        .expect("数据库初始化/迁移失败");

    info!("数据库已就绪，路径: {:?}", db_path);

    pool
}
