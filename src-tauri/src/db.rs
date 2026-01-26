//! db模块用来进行数据库的一些初始化操作

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::{fs, time::Duration};
use tauri::{AppHandle, Manager};

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
    let app_dir = app_handle.path().app_data_dir().expect("找不到数据目录");
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).expect("创建数据库文件夹失败，请检查权限");
    }

    let db_path = app_dir.join("app.db");
    let db_url = format!(
        "sqlite://{}?mode=rwc&cache=shared",
        db_path.to_str().unwrap()
    );
    println!("数据库路径:{}", db_url);

    // 连接数据库（如果不存在会自动创建文件）
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("无法连接/创建数据库");

    let create_tables_sql = r#"
        -- 游戏元数据表
        CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            abs_path TEXT NOT NULL,
            cover TEXT,
            background TEXT,
            local_cover TEXT,
            local_background TEXT,
            play_time INTEGER DEFAULT 0,
            length INTEGER DEFAULT 0,
            size INTEGER,
            last_played_at TEXT 
        );

        -- 用户信息表
        CREATE TABLE IF NOT EXISTS user (
            id TEXT PRIMARY KEY,
            user_name TEXT NOT NULL,
            avatar TEXT,
            games_count INTEGER DEFAULT 0,
            favorite_vn_id TEXT,
            total_play_time INTEGER DEFAULT 0,
            games_completed_number INTEGER DEFAULT 0,
            last_play_at TEXT,
            created_at TEXT
        );

        -- 初始化默认用户 (如果不存在)
        INSERT OR IGNORE INTO user (id, user_name, created_at) 
        VALUES ('default', '本地用户', datetime('now'));
    "#;
    // 执行建表语句
    sqlx::query(create_tables_sql)
        .execute(&pool)
        .await
        .expect("数据库表初始化失败");
    pool
}
