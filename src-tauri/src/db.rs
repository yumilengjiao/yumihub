//! db模块用来进行数据库的一些初始化操作

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::fs;
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
            is_passed INTEGER,
            is_displayed INTEGER,
            cover TEXT,
            background TEXT,
            description TEXT,
            developer TEXT,
            local_cover TEXT,
            local_background TEXT,
            save_data_path TEXT,
            backup_data_path TEXT,
            play_time INTEGER DEFAULT 0,
            length INTEGER DEFAULT 0,
            size INTEGER,
            last_played_at TEXT 
        );

        -- 文件路径权限
        CREATE TABLE IF NOT EXISTS authorized_scopes (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL UNIQUE,
            authorized_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 游戏游玩时长日期表
        CREATE TABLE IF NOT EXISTS game_play_sessions (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,          -- 关联 games 表的 id
            play_date DATE NOT NULL,        -- 日期（例如 2025-05-20）
            duration_minutes INTEGER DEFAULT 0, -- 当日时长（分钟）
            last_played_at DATETIME        -- 该日最后一次运行的时间
        );

        -- 创建索引加速按日期查询
        CREATE INDEX IF NOT EXISTS idx_play_date ON game_play_sessions (play_date);

        -- 游戏快照表
        CREATE TABLE IF NOT EXISTS game_screenshots (
            id TEXT PRIMARY KEY,
            -- 关联 games 表的 id
            game_id TEXT NOT NULL,
            -- 截图在硬盘的绝对路径
            file_path TEXT NOT NULL,
            -- 截图时间
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            -- 瞬间感想
            thoughts Text
        );

        CREATE TABLE IF NOT EXISTS companions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            -- 程序别名，如 "翻译程序"、"手柄映射"
            name TEXT NOT NULL,
            -- 程序的绝对路径
            path TEXT NOT NULL,
            -- 启动参数，例如 "-windowed" 或 "--minimized"
            args TEXT,
            -- 是否在联动启动时包含此程序
            trigger_mode TEXT NOT NULL DEFAULT 'game',
            -- 是否启用此程序的连携启动
            is_enabled INTEGER DEFAULT 1,
            -- 排序权重，如果希望某些程序先启动
            sort_order INTEGER DEFAULT 0,
            -- 备注
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 用户信息表
        CREATE TABLE IF NOT EXISTS account (
            id TEXT PRIMARY KEY,
            user_name TEXT NOT NULL,
            avatar TEXT,
            games_count INTEGER DEFAULT 0,
            favorite_game TEXT,
            total_play_time INTEGER DEFAULT 0,
            games_completed_number INTEGER DEFAULT 0,
            selected_disk TEXT,
            last_play_at TEXT,
            created_at TEXT
        );

        -- 初始化默认用户 (如果不存在)
        INSERT OR IGNORE INTO account (id, user_name, created_at) 
        VALUES ('default', 'user', datetime('now'));
    "#;
    // 执行建表语句
    sqlx::query(create_tables_sql)
        .execute(&pool)
        .await
        .expect("数据库表初始化失败");
    pool
}
