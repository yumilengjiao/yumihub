//! 游戏启动与生命周期管理

use std::{
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::{Duration, Instant},
};
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System, UpdateKind};

use chrono::Local;
use sqlx::SqlitePool;
use tauri_plugin_log::log::error;
use uuid::Uuid;

use crate::{
    backup::commands::backup_by_game_id,
    companion,
    config::read_config,
    error::AppError,
    game::{
        RUNNING_GAMES,
        entity::{GameMeta, RunningGame},
    },
    infra::process::kill_by_name,
};

/// 轮询间隔
const POLL_INTERVAL: Duration = Duration::from_secs(2);
/// 判定会话彻底结束前的宽限期：应对"启动器退出 → 真正游戏进程还没拉起来"
/// 之间的短暂空档，避免误判会话已结束
const EXIT_GRACE_PERIOD: Duration = Duration::from_secs(5);

/// 判断 child 路径是否落在 parent 目录下（按路径组件比较，Windows 下忽略大小写，
/// 避免 "C:\Games\Foo" 误匹配到 "C:\Games\FooBar"）
fn path_starts_with_ci(child: &Path, parent: &Path) -> bool {
    let to_lower = |p: &Path| -> Vec<String> {
        p.components()
            .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
            .collect()
    };
    let child_c = to_lower(child);
    let parent_c = to_lower(parent);
    parent_c.len() <= child_c.len() && child_c.starts_with(parent_c.as_slice())
}

/// 持续监控，直到"游戏目录范围内的进程"全部退出（并经过宽限期确认）后才返回。
/// 用于应对启动的可执行文件只是个启动器（拉起真正游戏主程序后自己退出）的情况：
/// 启动器退出后会继续在游戏目录范围内扫描是否有新进程被拉起，
/// 直到一段宽限期内都没有任何匹配进程存活，才认为会话真正结束。
async fn wait_for_game_session_end(initial_pid: u32, game_dir: &Path) {
    let mut sys = System::new();
    let mut last_alive_at = Instant::now();
    let refresh_kind = ProcessRefreshKind::nothing().with_exe(UpdateKind::Always);

    loop {
        sys.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh_kind);

        let any_alive = sys.process(Pid::from_u32(initial_pid)).is_some()
            || sys.processes().values().any(|p| {
                p.exe()
                    .is_some_and(|exe| path_starts_with_ci(exe, game_dir))
            });

        if any_alive {
            last_alive_at = Instant::now();
        } else if last_alive_at.elapsed() >= EXIT_GRACE_PERIOD {
            break;
        }

        tokio::time::sleep(POLL_INTERVAL).await;
    }
}

/// 启动游戏进程，并异步等待结束后记录会话、触发自动备份、关闭连携程序
pub async fn launch(pool: SqlitePool, game: GameMeta) -> Result<(), AppError> {
    let start_time = Local::now();
    let start_instant = Instant::now();
    let game_id = game.id.clone();
    let exe_path = PathBuf::from(&game.abs_path);
    let game_dir = exe_path
        .parent()
        .ok_or_else(|| AppError::Process("无法解析游戏目录".into()))?
        .to_path_buf();
    // ── 启动随游戏触发的连携程序 ──────────────────────────────────────────
    let companion_names = companion::commands::launch_game_companions(&pool).await;
    // ── 启动游戏主进程（注意：它可能只是一个启动器）─────────────────────────
    let child = Command::new(&exe_path)
        .current_dir(&game_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| AppError::Resolve(game.abs_path.clone(), format!("启动失败: {}", e)))?;
    let pid = child.id();
    // 后续改为基于目录扫描的轮询监控，不再需要持有 child 去 wait()；
    // Drop 一个 Child 不会杀掉对应的子进程，丢弃是安全的
    drop(child);
    RUNNING_GAMES
        .lock()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .insert(game_id.clone(), RunningGame { pid });
    // ── 异步监听进程退出 ───────────────────────────────────────────────────
    let pool_clone = pool.clone();
    let game_id_clone = game_id.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = (async {
            // 等待游戏会话结束：启动器退出后会继续在游戏目录范围内扫描，
            // 直到宽限期内都不再有存活进程才视为结束
            wait_for_game_session_end(pid, &game_dir).await;
            let duration_minutes = (start_instant.elapsed().as_secs() / 60) as i64;
            // 自动备份
            let auto_backup = read_config()
                .map(|cfg| cfg.storage.auto_backup)
                .unwrap_or_else(|e| {
                    error!("读取自动备份配置失败: {}", e);
                    false
                });
            if auto_backup
                && let Err(e) = backup_by_game_id(pool.clone(), game_id_clone.clone()).await
            {
                error!("自动备份游戏 {} 失败: {}", game_id_clone, e);
            }
            // 清理运行状态
            match RUNNING_GAMES.lock() {
                Ok(mut running) => {
                    running.remove(&game_id_clone);
                }
                Err(e) => error!("清理运行中游戏状态失败: {}", e),
            }
            // 关闭随游戏启动的连携程序
            for name in &companion_names {
                kill_by_name(name);
            }
            // 写入会话记录
            let mut tx = pool_clone.begin().await.map_err(AppError::from)?;
            sqlx::query(
                "INSERT INTO game_play_sessions \
                 (id, game_id, play_date, duration_minutes, last_played_at) \
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(Uuid::new_v4().to_string())
            .bind(&game_id_clone)
            .bind(start_time)
            .bind(duration_minutes)
            .bind(Local::now())
            .execute(&mut *tx)
            .await
            .map_err(AppError::from)?;
            sqlx::query(
                "UPDATE games SET play_time = play_time + ?, last_played_at = ? WHERE id = ?",
            )
            .bind(duration_minutes)
            .bind(Local::now())
            .bind(&game_id_clone)
            .execute(&mut *tx)
            .await
            .map_err(AppError::from)?;
            tx.commit().await.map_err(AppError::from)?;
            Ok::<(), AppError>(())
        })
        .await
        {
            error!("游戏进程监听出错 [{}]: {}", game_id, e);
        }
    });
    Ok(())
}
