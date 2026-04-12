//! 游戏相关数据结构

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use tokio::sync::broadcast;

use crate::{
    message::traits::{MessageEvent, MessageHub},
    user::entity::User,
};

// ── 游戏元数据 ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct GameMeta {
    pub id: String,
    pub name: String,
    pub abs_path: String,
    pub is_passed: bool,
    pub is_displayed: bool,
    pub cover: String,
    pub background: String,
    pub description: String,
    pub developer: String,
    pub local_cover: Option<String>,
    pub local_background: Option<String>,
    pub save_data_path: Option<String>,
    pub backup_data_path: Option<String>,
    pub play_time: i64,
    pub length: Option<i64>,
    pub size: Option<i64>,
    pub last_played_at: Option<DateTime<Local>>,
}

pub type GameMetaList = Vec<GameMeta>;

// ── 游戏会话 ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlaySession {
    pub id: String,
    pub game_id: String,
    pub play_date: DateTime<Local>,
    pub duration_minutes: i64,
    pub last_played_at: DateTime<Local>,
}

// ── 压缩包条目（转发 infra 类型） ─────────────────────────────────────────────
pub use crate::infra::archive::ArchiveEntry;

// ── 运行时状态 ────────────────────────────────────────────────────────────────

/// 正在运行中的游戏进程信息
pub struct RunningGame {
    pub pid: u32,
}

/// 资源下载目标
#[derive(Clone, Debug)]
pub enum ResourceTarget {
    All,
    CoverOnly,
    BackgroundOnly,
}

// ── 消息事件 ──────────────────────────────────────────────────────────────────

#[derive(Clone, Debug)]
pub enum GameEvent {
    /// 游戏封面 / 背景图片需要下载
    GameResourceTask {
        meta: GameMeta,
        target: ResourceTarget,
    },
    /// 用户头像需要下载
    UserResourceTask { meta: User },
}

impl MessageEvent for GameEvent {}

pub struct GameMessageHub {
    pub tx: broadcast::Sender<GameEvent>,
}

impl MessageHub<GameEvent> for GameMessageHub {
    fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { tx }
    }
    fn subscribe(&self) -> broadcast::Receiver<GameEvent> {
        self.tx.subscribe()
    }
    fn publish(&self, event: GameEvent) {
        let _ = self.tx.send(event);
    }
}
