use std::fs;
use std::path::Path;

use sqlx::SqlitePool;

pub async fn setup_database(db_path: &Path) -> Result<SqlitePool, sqlx::Error> {
    // 检查并创建父级目录
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            sqlx::Error::Configuration(format!("Failed to create database directory: {}", e).into())
        })?;
    }

    // 建立连接（带 rwc 模式自动创建文件）
    let db_url = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());
    let pool = SqlitePool::connect(&db_url).await?;

    // 执行迁移
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
