use crate::{
    message::traits::{MessageEvent, MessageHub},
    user::entity::User,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use tokio::sync::broadcast;

/// 游戏元数据结构体
///
/// * `id`: 唯一标识
/// * `name`: 游戏名
/// * `abs_path`: 游戏启动程序绝对路径
/// * `is_passed`: 是否通关
/// * `is_displayed`: 是否展示到首页
/// * `cover`: 封面地址(网络)
/// * `background`: 背景地址(网络)
/// * `description`: 游戏描述(简介)
/// * `developer`: 游戏开发商
/// * `local_cover`: 游戏封面(本地)
/// * `local_background`: 游戏背景(本地)
/// * `save_data_path`: 游戏存档路径
/// * `backup_data_path`: 游戏备份压缩包路径
/// * `play_time`: 游玩时长
/// * `length`: 游戏总时长
/// * `size`: 游戏大小
/// * `last_played_at`: 上一次游玩时间
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
    pub save_data_path: Option<String>,
    pub backup_data_path: Option<String>,
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

/// 压缩包模型
#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveEntry {
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub encrypted: bool,
}
