//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use custom_theme::schema::ir::ThemeIr;
use font_kit::source::SystemSource;
use sqlx::{Pool, Sqlite, SqlitePool};
use sqlx::{Row, Transaction};
use sysinfo::Disks;
use tauri::{async_runtime, AppHandle, Manager, Runtime, State};
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::log::{debug, error, info};
use uuid::Uuid;

use crate::backup::commands::backup_archive_by_game_id;
use crate::companion::entity::Companion;
use crate::game::commands::execute_start_game;
use crate::game::entity::{ArchiveEntry, PlaySession, ResourceTarget};
use crate::screenshot::commands::delete_game_screenshot;
use crate::screenshot::entity::Screenshot;
use crate::shortcut::commands::refresh_shortcuts;
use crate::shortcut::entity::ShortcutSetting;
use crate::util::{extract_rar_sync, extract_zip_sync, get_dir_size, parse_rar, parse_zip};
use crate::{
    config::{
        entity::{Config, ConfigEvent},
        GLOBAL_CONFIG,
    },
    error::AppError,
    game::entity::{GameEvent, GameMeta, GameMetaList},
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB, GAME_MESSAGE_HUB},
    user::entity::User,
    util::{self, zip_directory_sync},
};

// --------------------------------------------------------
// --------------------------用户类------------------------
// --------------------------------------------------------

/// 获取用户信息
///
/// * `pool`: 连接池,tauri自动注入
#[tauri::command]
pub async fn get_user_info(pool: State<'_, Pool<Sqlite>>) -> Result<User, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM account LIMIT 1")
        .fetch_optional(&*pool) // 使用 fetch_optional 防止表为空时直接崩溃
        .await
        .map_err(|e| {
            error!("获取用户信息失败: {}", e);
            AppError::DB(e.to_string())
        })?;

    // 如果数据库没数据，返回一个默认值
    Ok(user.unwrap_or_default())
}

/// 更新用户数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `account`: 用户信息
#[tauri::command]
pub async fn update_user_info(
    pool: State<'_, Pool<Sqlite>>,
    account: User,
) -> Result<(), AppError> {
    // 先查询头像是否是网络资源是就下载资源
    let is_network_resource =
        account.avatar.starts_with("http://") || account.avatar.starts_with("https://");
    debug!("更新的用户数据: {:?}", account);

    sqlx::query(
        r#"
        INSERT OR REPLACE INTO account
        (
            id,
            user_name,
            avatar,
            favorite_game,
            games_count,
            total_play_time,
            games_completed_number,
            selected_disk,
            last_play_at,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&account.id)
    .bind(&account.user_name)
    .bind(&account.avatar)
    .bind(&account.favorite_game)
    .bind(account.games_count)
    .bind(account.total_play_time)
    .bind(account.games_completed_number)
    .bind(&account.selected_disk)
    .bind(account.last_play_at)
    .bind(account.created_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    if is_network_resource {
        let allow_downloading = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?
            .storage
            .allow_downloading_resources;
        if allow_downloading {
            return Ok(());
        }
        info!("发送消息到消息平台下载用户头像资源");
        GAME_MESSAGE_HUB.publish(GameEvent::UserResourceTask {
            meta: account.clone(),
        });
    }

    info!("用户信息修改成功");
    Ok(())
}

// --------------------------------------------------------
// ----------------------游戏类信息类----------------------
// --------------------------------------------------------

/// 从数据库查询所有游戏数据
///
/// * `pool`: 连接池,tauri自动注入
#[tauri::command]
pub async fn get_game_meta_list(pool: State<'_, Pool<Sqlite>>) -> Result<GameMetaList, AppError> {
    println!("开始查询数据");
    let games = sqlx::query_as(
        "SELECT id,
                name,
                abs_path,
                is_passed,
                is_displayed,
                cover,
                background, 
                description,
                developer,
                local_cover,
                local_background,
                save_data_path,
                backup_data_path,
                play_time,
                length,
                size,
                last_played_at 
        FROM games",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    info!("查询数据成功");
    Ok(games)
}

/// 通过id查询单个游戏数据
///
/// * `pool`: 连接池,tauri自动注入
/// * `id`: 游戏的唯一id
#[tauri::command]
pub async fn get_game_meta_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<GameMeta, AppError> {
    let game = sqlx::query_as(
        "SELECT id,
                name,
                abs_path,
                is_passed,
                is_displayed,
                cover,
                background,
                description,
                developer,
                local_cover,
                local_background,
                save_data_path,
                backup_data_path,
                play_time,
                length,
                size,
                last_played_at
        FROM games where id = ?",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    Ok(game)
}

/// 用于添加/修改单个游戏到游戏库
///
/// * `pool`: 连接池,tauri自动注入
/// * `game`: 要添加的单个游戏信息
#[tauri::command]
pub async fn add_new_game(
    pool: State<'_, Pool<Sqlite>>,
    game: GameMeta, // 确保 GameMeta 的字段已经是 i64
) -> Result<(), AppError> {
    debug!("接收到要添加的新数据: {:?}", game);
    sqlx::query(
        r#"
        INSERT OR REPLACE INTO games 
        (
            id,
            name,
            abs_path,
            is_passed,
            is_displayed,
            cover,
            background,
            description,
            developer,
            save_data_path,
            backup_data_path,
            play_time,
            length,
            size,
            last_played_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&game.id)
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(game.is_passed)
    .bind(game.is_displayed)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.description)
    .bind(&game.developer)
    .bind(&game.save_data_path)
    .bind(&game.backup_data_path)
    .bind(game.play_time) // i64
    .bind(game.length) // i64
    .bind(game.size) // Option<i64>
    .bind(game.last_played_at)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    let allow_downloading = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Generic(e.to_string()))?
        .storage
        .allow_downloading_resources;
    if !allow_downloading {
        return Ok(());
    }
    // 向消息模块发布信息说明有资源需要下载
    GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask {
        meta: game,
        target: ResourceTarget::All,
    });
    Ok(())
}

/// 用于添加多个游戏到游戏库
///
/// * `pool`: 连接池,tauri自动注入
/// * `games`: 要添加的游戏列表
#[tauri::command]
pub async fn add_new_game_list(
    pool: State<'_, Pool<Sqlite>>,
    games: Vec<GameMeta>, // 假设 GameMetaList 是 Vec 的包装，这里直接用 Vec
) -> Result<(), AppError> {
    debug!("接受到了新的游戏列表: {:?}", games);
    // 开启事务
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    for game in games {
        sqlx::query(
            "INSERT OR REPLACE INTO games 
                (
                    id,
                    name,
                    abs_path,
                    is_passed,
                    is_displayed,
                    cover,
                    background,
                    description,
                    developer,
                    save_data_path,
                    backup_data_path,
                    play_time,
                    length,
                    size,
                    last_played_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&game.id)
        .bind(&game.name)
        .bind(&game.abs_path)
        .bind(game.is_passed)
        .bind(game.is_displayed)
        .bind(&game.cover)
        .bind(&game.background)
        .bind(&game.description)
        .bind(&game.developer)
        .bind(&game.save_data_path)
        .bind(&game.backup_data_path)
        .bind(game.play_time) // i64
        .bind(game.length) // i64
        .bind(game.size) // Option<i64>
        .bind(game.last_played_at)
        .execute(&mut *tx) // 这里在事务中执行
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

        let allow_downloading = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?
            .storage
            .allow_downloading_resources;

        if !allow_downloading {
            return Ok(());
        }

        GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask {
            meta: game,
            target: ResourceTarget::All,
        });
    }

    // 提交事务
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 更新单个游戏信息
///
/// * `pool`: 数据库连接池，自动获取
/// * `game`: 新的游戏数据
#[tauri::command]
pub async fn update_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    debug!("后端收到要更新的游戏: {}", game.id);
    let mut tx: Transaction<'_, Sqlite> = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 先查询旧的数据,资源和新数据是否匹配
    let row = sqlx::query("SELECT cover, background FROM games WHERE id = ?")
        .bind(&game.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let mut resource_target: Option<ResourceTarget> = None;

    if let Some(old_row) = row {
        let old_cover: String = old_row.get("cover");
        let old_background: String = old_row.get("background");

        let cover_changed = old_cover != game.cover;
        let bg_changed = old_background != game.background;

        // 根据变化情况决定 ResourceTarget
        if cover_changed && bg_changed {
            resource_target = Some(ResourceTarget::All);
        } else if cover_changed {
            resource_target = Some(ResourceTarget::CoverOnly);
        } else if bg_changed {
            resource_target = Some(ResourceTarget::BackgroundOnly);
        }
    } else {
        // 如果数据库里压根没这游戏（新添加的情况），下载全部
        resource_target = Some(ResourceTarget::All);
    }

    sqlx::query(
        r#"
        UPDATE games SET 
            name = ?,
            abs_path = ?,
            is_passed = ?,
            is_displayed = ?,
            cover = ?,
            background = ?,
            description = ?,
            developer = ?,
            local_cover = COALESCE(?, local_cover), -- 前端数据传过来为空的时候保留原来的数据
            local_background = COALESCE(?, local_background), -- 前端数据传过来为空的时候保留原来的数据
            save_data_path = ?, 
            backup_data_path = ?,
            play_time = ?,
            length = ?,
            size = ?, 
            last_played_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&game.name)
    .bind(&game.abs_path)
    .bind(game.is_passed)
    .bind(game.is_displayed)
    .bind(&game.cover)
    .bind(&game.background)
    .bind(&game.description)
    .bind(&game.developer)
    .bind(&game.local_cover)
    .bind(&game.local_background)
    .bind(&game.save_data_path)
    .bind(&game.backup_data_path)
    .bind(game.play_time)
    .bind(game.length)
    .bind(game.size)
    .bind(game.last_played_at)
    .bind(&game.id) // ID 放在最后匹配 WHERE
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    // 提交事务
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;

    // 如果有资源变动，发布下载任务给 Resource Manager
    if let Some(target) = resource_target {
        let allow_downloading = GLOBAL_CONFIG
            .read()
            .map_err(|e| AppError::Generic(e.to_string()))?
            .storage
            .allow_downloading_resources;
        if !allow_downloading {
            return Ok(());
        }
        // 只有当新路径是网络路径时才触发任务
        if game.cover.starts_with("http") || game.background.starts_with("http") {
            debug!("已向资源模块发送下载指令: {:?}", target);
            GAME_MESSAGE_HUB.publish(GameEvent::GameResourceTask { meta: game, target });
        }
    }

    Ok(())
}

/// 用于删除单个游戏信息
///
/// * `pool`: 连接池,tauri自动注入
/// * `id`: 游戏信息id
#[tauri::command]
pub async fn delete_game_by_id(pool: State<'_, Pool<Sqlite>>, id: String) -> Result<(), AppError> {
    debug!("要删除的游戏信息: {}", id);
    // 开启事务
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    sqlx::query(
        r#"
            delete from games where id = ?
        "#,
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        error!("删除游戏信息出错: {}", e);
        AppError::DB(e.to_string())
    })?;
    tx.commit().await.map_err(|e| AppError::DB(e.to_string()))?;
    Ok(())
}

/// 异步删除所有游戏数据
///
/// * `pool`: 连接池,tauri自动注入
#[tauri::command]
pub async fn delete_game_list(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM games").execute(&*pool).await.ok();
    Ok(())
}

/// 启动游戏进程
///
/// * `game`: 游戏信息
#[tauri::command]
pub async fn start_game(pool: State<'_, Pool<Sqlite>>, game: GameMeta) -> Result<(), AppError> {
    let pool_cl = pool.inner().clone();
    execute_start_game(pool_cl, game).await
}

/// 获取所有游戏启动的会话记录
///
/// * `pool`: 数据库连接池-自动注入
#[tauri::command]
pub async fn get_sessions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<PlaySession>, AppError> {
    let rows = sqlx::query_as::<_, PlaySession>(
        r#"
            select
                id,
                game_id,
                play_date,
                duration_minutes,
                last_played_at
            from game_play_sessions
        "#,
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;
    Ok(rows)
}

/// 获取指定年份内所有游戏启动的会话记录
///
/// * `pool`: 数据库连接池-自动注入
#[tauri::command]
pub async fn get_sessions_by_year(
    year: String, // 接收前端传来的年份字符串
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<PlaySession>, AppError> {
    let rows = sqlx::query_as::<_, PlaySession>(
        r#"
            SELECT
                id,
                game_id,
                play_date,
                duration_minutes,
                last_played_at
            FROM game_play_sessions
            WHERE strftime('%Y', play_date) = ?
        "#,
    )
    .bind(year) // 绑定参数，防止 SQL 注入
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(rows)
}

// --------------------------------------------------------
// ------------------------压缩类--------------------------
// --------------------------------------------------------

/// 提取(游戏)压缩包内所有文件的元数据信息
///
/// * `path`: 压缩包路径
#[tauri::command]
pub async fn get_archive_list(path: String) -> Result<Vec<ArchiveEntry>, AppError> {
    let path_buf = Path::new(&path);
    if !path_buf.exists() {
        return Err(AppError::Resolve(
            path_buf.to_string_lossy().to_string(),
            "文件路径不存在".to_string(),
        ));
    }

    let extension = path_buf
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "zip" => parse_zip(&path),
        "rar" => parse_rar(&path),
        _ => Err(AppError::File("暂不支持该压缩格式".to_string())),
    }
}

/// 解压压缩包到指定目录
///
/// * `archive_path`: 压缩包路径
/// * `dest_path`: 目的路径
#[tauri::command]
pub async fn extract_archive(
    archive_path: String,
    dest_path: Option<String>,
) -> Result<String, AppError> {
    let src = PathBuf::from(&archive_path);

    let final_dest = if let Some(d) = dest_path {
        PathBuf::from(d)
    } else {
        // 如果没有传路径，默认解压到压缩包同名目录下（Galgame常见做法）
        let mut d = src.clone();
        d.set_extension(""); // 去掉 .zip 或 .rar
        d
    };

    if !src.exists() {
        return Err(AppError::File(format!("源文件不存在: {}", archive_path)));
    }

    let ext = src
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    let parent_dir = match ext.as_str() {
        "zip" => extract_zip_sync(&src, &final_dest).map_err(|e| AppError::File(e.to_string()))?,
        "rar" => extract_rar_sync(&src, &final_dest)?,
        _ => return Err(AppError::Generic("不支持的压缩格式".to_string())),
    };

    Ok(parent_dir)
}

// --------------------------------------------------------
// ------------------------配置类--------------------------
// --------------------------------------------------------

/// 获取配置信息
#[tauri::command]
pub fn get_config() -> Result<Config, AppError> {
    let result = GLOBAL_CONFIG.read();
    match result {
        Ok(config) => Ok(config.clone()),
        Err(e) => {
            error!("{}", e);
            Err(AppError::Mutex(e.to_string()))
        }
    }
}

/// 更新配置信息
///
/// * `app`: app句柄，自动注入
/// * `config`: 要更新的配置信息
#[tauri::command]
pub async fn update_config(config: Config) {
    let result = GLOBAL_CONFIG.read();
    match result {
        Ok(old_config) => {
            if old_config.basic != config.basic {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Basic { base: config.basic });
            }
            if old_config.interface != config.interface {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Interface {
                    interface: config.interface,
                });
            }
            if old_config.storage != config.storage {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Storage {
                    stroage: config.storage,
                });
            }
            if old_config.system != config.system {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::System { sys: config.system });
            }
            if old_config.auth != config.auth {
                CONFIG_MESSAGE_HUB.publish(ConfigEvent::Authorization { auth: config.auth });
            }
        }
        Err(e) => {
            error!("无法获取全局配置信息,无法更新配置,错误: {}", e);
        }
    }
}

// --------------------------------------------------------
// ----------------------游戏快照类------------------------
// --------------------------------------------------------

/// 根据年月份查看快照数据
///
/// * `pool`: 数据库连接池-自动注入
/// * `year`: 年份
/// * `month`: 月份
#[tauri::command]
pub async fn get_screenshots_by_year_month(
    pool: State<'_, SqlitePool>,
    year: i32, // 例如 2026
    month: u8, // 1 ~ 12
) -> Result<Vec<Screenshot>, AppError> {
    // 月份补零：2 -> "02"
    let month_str = format!("{:02}", month);
    let year_str = year.to_string();

    let rows = sqlx::query_as::<_, Screenshot>(
        r#"
        SELECT *
        FROM game_screenshots
        WHERE strftime('%Y', created_at) = ?
          AND strftime('%m', created_at) = ?
        ORDER BY created_at DESC
        "#,
    )
    .bind(year_str)
    .bind(month_str)
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(rows)
}

/// 修改快照信息(修改游戏感想)
///
/// * `pool`: 数据库连接池-自动注入
/// * `screenshot_id`: 快照id
/// * `thoughts`: 感想
#[tauri::command]
pub async fn update_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
    thoughts: Option<String>,
) -> Result<(), AppError> {
    let result = sqlx::query(
        r#"
        UPDATE game_screenshots
        SET thoughts = ?
        WHERE id = ?
        "#,
    )
    .bind(thoughts)
    .bind(screenshot_id)
    .execute(&*pool)
    .await
    .map_err(|e| AppError::DB(e.to_string()))?;

    // 可选：如果你想知道有没有更新到行
    if result.rows_affected() == 0 {
        return Err(AppError::Generic("screenshot not found".into()));
    }

    Ok(())
}

/// 根据id删除一个快照信息及其截图
///
/// * `pool`: 数据库连接池-自动注入
/// * `screenshot_id`: 快照id
#[tauri::command]
pub async fn delete_screenshot_by_id(
    pool: State<'_, SqlitePool>,
    screenshot_id: String,
) -> Result<(), AppError> {
    delete_game_screenshot(&pool, &screenshot_id).await
}

// --------------------------------------------------------
// -----------------------快捷键类-------------------------
// --------------------------------------------------------

#[tauri::command]
/// 查询所有快捷键
///
/// * `pool`: 数据库连接池-自动注入
pub async fn get_shortcuts(
    pool: State<'_, Pool<Sqlite>>,
) -> Result<Vec<ShortcutSetting>, AppError> {
    let shortcuts =
        sqlx::query_as::<_, ShortcutSetting>("SELECT id, key_combo, is_global FROM shortcut")
            .fetch_all(pool.inner())
            .await
            .map_err(|e| AppError::DB(e.to_string()))?;

    Ok(shortcuts)
}

/// 修改快捷键接口,直接更新所有快捷键
///
/// * `app_handle`: app句柄-自动注入
/// * `pool`: 数据库连接池-自动注入
/// * `shortcuts`: 所有快捷键
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

    // 更新完数据库后，刷新实机运行的监听
    refresh_shortcuts(&app_handle).await?;

    Ok(())
}

// --------------------------------------------------------
// ----------------------连携程序类------------------------
// --------------------------------------------------------

/// 查询所有的连携程序信息
///
/// * `pool`: 数据库连接池-自动注入
#[tauri::command]
pub async fn get_companions(pool: State<'_, Pool<Sqlite>>) -> Result<Vec<Companion>, AppError> {
    // 按 sort_order 从小到大排序，权重小的先启动
    let rows = sqlx::query_as::<_, Companion>(
        r#"
        SELECT id, name, path, args, is_enabled, is_window_managed, trigger_mode, sort_order, description 
        FROM companions
        "#,
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| AppError::DB(format!("数据库查询失败: {}", e)))?;

    Ok(rows)
}

/// 更新所有连携程序信息
///
/// * `companions`: 连携程序
/// * `pool`: 数据库连接池-自动注入
#[tauri::command]
pub async fn update_companions(
    companions: Vec<Companion>,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<(), AppError> {
    // 开启事务
    let mut tx = pool
        .begin()
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 清空原有的所有连携程序数据
    sqlx::query("DELETE FROM companions")
        .execute(&mut *tx)
        .await
        .map_err(|e| AppError::DB(format!("数据删除失败: {}", e)))?;

    // 批量插入新数据
    for item in companions {
        sqlx::query(
            r#"
            INSERT INTO companions 
            (
                name,
                path,
                args,
                is_enabled,
                is_window_managed,
                trigger_mode,
                sort_order,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
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

// --------------------------------------------------------
// ------------------------工具类--------------------------
// --------------------------------------------------------

/// 从父目录获取游戏的启动文件的文件名字
///
/// * `parent_path`: 游戏父目录
#[tauri::command]
pub fn get_start_up_path(parent_path: String) -> Result<String, AppError> {
    util::get_start_up_program(parent_path)
}

/// 将数据库的所有指定了游戏存档的游戏都进行备份
///
/// * `pool`: 数据库连接池，由tauri自动注入
#[tauri::command]
pub async fn backup_archive(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    // 获取备份根目录
    let backup_root = {
        let config = GLOBAL_CONFIG.read().unwrap();
        config.storage.backup_save_path.clone()
    };

    // 遍历并异步执行打包
    for row in games {
        let save_path: Option<String> = row.get("save_data_path");
        let backup_dir = backup_root.clone();
        let game_id: String = row.get("id");

        if save_path.is_none() {
            continue;
        }
        let save_path: PathBuf = save_path.unwrap().into();

        // 使用 spawn_blocking 将同步的压缩逻辑丢到后台线程池，不阻塞主异步流
        async_runtime::spawn_blocking(move || {
            let zip_file_path = backup_dir.join(format!("game_{}.zip", game_id));
            if let Err(e) = zip_directory_sync(&save_path, &zip_file_path) {
                eprintln!("备份游戏 {} 失败: {}", game_id, e);
            }
        })
        .await
        .map_err(|e| AppError::File(e.to_string()))?;
    }

    Ok(())
}

/// 通过指定游戏id进行单个游戏的存档备份
///
/// * `pool`: 数据库连接池，由tauri自动注入
/// * `id`: 游戏id
#[tauri::command]
pub async fn backup_archive_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<(), AppError> {
    let pool = (*pool).clone();
    backup_archive_by_game_id(pool, id).await
}

/// 从备份存档恢复游戏存档
///
/// * `pool`: 连接池-自动注入
/// * `id`: 游戏id
#[tauri::command]
pub async fn restore_archive_by_id(
    pool: State<'_, Pool<Sqlite>>,
    id: String,
) -> Result<(), AppError> {
    // 查询原存档路径
    let game = sqlx::query("SELECT save_data_path FROM games WHERE id = ?")
        .bind(&id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let save_path_str: Option<String> = game.get("save_data_path");
    if save_path_str.is_none() {
        return Err(AppError::Resolve(
            "none".into(),
            "该游戏未设置存档路径".into(),
        ));
    }
    let save_path = PathBuf::from(save_path_str.unwrap());

    // 获取备份文件路径
    let backup_root = {
        let config = GLOBAL_CONFIG.read().unwrap();
        config.storage.backup_save_path.clone()
    };
    let zip_file_path = backup_root.join(format!("game_{}.zip", id));

    if !zip_file_path.exists() {
        return Err(AppError::File(format!("未找到 ID 为 {} 的备份文件", id)));
    }

    // 执行解压覆盖
    async_runtime::spawn_blocking(move || {
        if let Err(e) = extract_zip_sync(&zip_file_path, &save_path) {
            error!("恢复游戏 {} 失败: {}", id, e);
            return Err(AppError::File(e.to_string()));
        }
        Ok(())
    })
    .await
    .map_err(|e| AppError::File(e.to_string()))??;

    Ok(())
}

/// 一键把所有有备份的游戏存档全部覆盖恢复到游戏存档目录
///
/// * `pool`: 连接池-自动注入
#[tauri::command]
pub async fn restore_all_archives(pool: State<'_, Pool<Sqlite>>) -> Result<(), AppError> {
    println!("开始恢复所有游戏数据");
    let games = sqlx::query("SELECT id, save_data_path FROM games")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::DB(e.to_string()))?;

    let backup_root = {
        let config = GLOBAL_CONFIG.read().unwrap();
        config.storage.backup_save_path.clone()
    };

    for row in games {
        let id: String = row.get("id");
        let save_path_str: Option<String> = row.get("save_data_path");

        if let Some(s_path) = save_path_str {
            let save_path = PathBuf::from(s_path);
            let zip_file_path = backup_root.join(format!("game_{}.zip", id));

            // 如果备份文件不存在则跳过当前游戏
            if !zip_file_path.exists() {
                continue;
            }

            // 同样使用 spawn_blocking 避免阻塞
            async_runtime::spawn_blocking(move || {
                if let Err(e) = extract_zip_sync(&zip_file_path, &save_path) {
                    eprintln!("全量恢复：备份游戏 {} 失败: {}", id, e);
                }
            })
            .await
            .map_err(|e| AppError::File(e.to_string()))?;
        }
    }

    Ok(())
}

/// 获取系统字体
#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();

    // 获取所有已安装的字体族名称
    let mut fonts = source.all_families().unwrap_or_default();

    fonts.sort();

    // 过滤掉一些奇怪的系统符号字体
    fonts
        .into_iter()
        .filter(|name| !name.starts_with('@')) // 过滤掉 Windows 里的垂直字体
        .collect()
}

/// 获取游戏的存储大小
///
/// * `dir`: 游戏目录
#[tauri::command]
pub fn get_game_size(dir: String) -> u64 {
    let parent_dir = Path::new(&dir);
    get_dir_size(parent_dir)
}

/// 获取系统有哪些挂载卷
#[tauri::command]
pub fn get_disks() -> Vec<String> {
    let disks = Disks::new_with_refreshed_list();
    disks
        .iter()
        .map(|disk| disk.mount_point().to_string_lossy().to_string())
        .collect()
}

/// 获取指定磁盘的使用率
///
/// * `path`: 磁盘盘符
#[tauri::command]
pub fn get_disk_usage(path: String) -> Result<f64, String> {
    let disks = Disks::new_with_refreshed_list();

    // 注意：Windows 路径处理通常比较敏感，建议用 contains 或标准化处理
    let target_disk = disks
        .iter()
        .find(|disk| disk.mount_point().to_string_lossy() == path);

    if let Some(disk) = target_disk {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total - available;
        let usage_percentage = (used as f64 / total as f64) * 100.0;
        Ok(usage_percentage)
    } else {
        Err("找不到指定的磁盘挂载点".to_string())
    }
}

/// 添加指定的文件路径，使其可以被赋予访问权限
///
/// * `app_handle`: app句柄自动注入
/// * `pool`: 数据库连接池自动注入
/// * `path`: 要赋予权限的路径
#[tauri::command]
pub async fn authorize_path_access<R: Runtime>(
    app_handle: AppHandle<R>,
    pool: State<'_, SqlitePool>,
    path: String,
) -> Result<(), AppError> {
    // 调用 Tauri FS Scope 实时授权
    // 允许递归访问该目录下所有资源（图片、子文件夹等）
    let scope = app_handle.fs_scope();
    scope
        .allow_directory(&path, true)
        .map_err(|e| AppError::Auth(format!("Tauri 权限注入失败: {}", e)))?;
    let asset_scope = app_handle.asset_protocol_scope();
    asset_scope
        .allow_file(&path)
        .map_err(|e| AppError::Auth(format!("Tauri 权限注入失败: {}", e)))?;

    // 持久化到权限表
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT OR IGNORE INTO authorized_scopes (id, path) VALUES (?, ?)")
        .bind(&id)
        .bind(&path)
        .execute(pool.inner())
        .await
        .map_err(|e| AppError::DB(format!("数据库记录权限失败: {}", e)))?;
    Ok(())
}

/// 清空所有程序相关的数据
///
/// * `pool`: 数据库连接池-自动注入
#[tauri::command]
pub async fn clear_app_data(pool: State<'_, SqlitePool>) -> Result<(), String> {
    // 获取所有表名
    let rows = sqlx::query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    // 禁用外键约束，防止因为关联关系导致删除失败
    sqlx::query("PRAGMA foreign_keys = OFF;")
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    // 遍历并清空每一张表
    for row in rows {
        let table_name: String = row.get("name");
        // 使用 DELETE FROM 而不是 DROP TABLE
        let delete_query = format!("DELETE FROM \"{}\"", table_name);
        sqlx::query(&delete_query)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 重置所有自增 ID
    sqlx::query("DELETE FROM sqlite_sequence")
        .execute(&*pool)
        .await
        .ok();

    // 重新启用外键约束
    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&*pool)
        .await
        .ok();

    // VACUUM,重写数据库文件，把由于删除数据腾出的空白空间物理回收。
    // 执行完这一步，数据库文件的大小会瞬间缩减。
    sqlx::query("VACUUM;").execute(&*pool).await.ok();

    // 清空资源目录

    let config = GLOBAL_CONFIG.read().unwrap();
    let target_dirs = vec![
        config.storage.meta_save_path.clone(),
        config.storage.backup_save_path.clone(),
        config.storage.screenshot_path.clone(),
    ];
    // 释放锁，避免占用太久
    drop(config);

    for path in target_dirs {
        if std::path::Path::new(&path).exists() {
            // 删除并重建
            let _ = std::fs::remove_dir_all(&path);
            let _ = std::fs::create_dir_all(&path);
        }
    }

    Ok(())
}

/// 获取所有主题
///
/// * `state`: tauri的状态管理
#[tauri::command]
pub fn get_themes(state: tauri::State<'_, Mutex<Vec<ThemeIr>>>) -> Result<Vec<ThemeIr>, AppError> {
    // 锁定并读取数据
    let themes = state
        .try_lock()
        .map_err(|e| AppError::Mutex(e.to_string()))?;
    println!("前端请求的themes是：{:#?}", themes);

    Ok(themes.clone())
}
