use crate::{
    message::traits::{MessageEvent, MessageHub},
    user::entity::User,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use tokio::sync::broadcast;

// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default, sqlx::FromRow)]
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
    pub save_data_path: Option<String>,   // 游戏自己的存档原始路径
    pub backup_data_path: Option<String>, // 备份存档的路径
    pub play_time: i64,
    pub length: Option<i64>,
    pub size: Option<i64>,
    pub last_played_at: Option<DateTime<Local>>,
}

/// 游戏元数据集合
pub type GameMetaList = Vec<GameMeta>;

// 游戏时长模型
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlaySession {
    pub id: String,
    pub game_id: String,
    pub play_date: DateTime<Local>,
    pub duration_minutes: i64,
    pub last_played_at: DateTime<Local>,
}

// 截图模型
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct GameScreenshot {
    pub id: String,
    pub game_id: String,
    pub file_path: String,
    pub created_at: Option<DateTime<Local>>,
}

// 游戏运行状态模型
pub struct RunningGameStatus {
    pub game_pid: u32,
}

#[derive(Clone, Debug)]
pub enum GameEvent {
    // 用户资源任务
    UserResourceTask {
        meta: User,
    },
    // 游戏资源任务消息
    GameResourceTask {
        meta: GameMeta,
        target: ResourceTarget,
    },
}

// 资源任务的标志位，判断要下载哪些资源
#[derive(Clone, Debug)]
pub enum ResourceTarget {
    All,
    CoverOnly,
    BackgroundOnly,
}

impl MessageEvent for GameEvent {}

// 集中式消息管理器
pub struct GameMessageHub {
    pub game_tx: broadcast::Sender<GameEvent>,
}

impl MessageHub<GameEvent> for GameMessageHub {
    fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { game_tx: tx }
    }

    // 提供一个便捷的订阅方法
    fn subscribe(&self) -> broadcast::Receiver<GameEvent> {
        self.game_tx.subscribe()
    }

    // 提供一个便捷的发布方法
    fn publish(&self, event: GameEvent) {
        let _ = self.game_tx.send(event);
    }
}

// ----------------------------------------------------------------------------------
// ----------------------------------游戏压缩包相关----------------------------------
// ----------------------------------------------------------------------------------

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveEntry {
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub encrypted: bool,
}
