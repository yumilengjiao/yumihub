use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
    pub play_time: i64,
    pub length: Option<i64>,
    pub size: Option<i64>,
    pub last_played_at: Option<DateTime<Local>>,
}

/// 游戏元数据集合
pub type GameMetaList = Vec<GameMeta>;

/// 全局配置类型
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub gui_config: Value,
    pub game_meta_list: GameMetaList,
}
