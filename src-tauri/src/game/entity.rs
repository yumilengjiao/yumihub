use crate::{
    message::traits::{MessageEvent, MessageHub},
    user::entity::User,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct GameMeta {
    pub id: String,
    pub name: String,
    pub abs_path: String,
    pub cover: String,
    pub background: String,
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

#[derive(Clone, Debug)]
pub enum GameEvent {
    // 用户资源任务
    UserResourceTask { meta: User },
    // 游戏资源任务消息
    GameResourceTask { meta: GameMeta },
    // 系统状态消息
    BackendReady,
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
