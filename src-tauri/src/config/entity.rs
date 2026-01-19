use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameMeta {
    id: String,
    name: String,
    abs_path: String,
    cover: String,
    play_time: u64,
    size: u64,
}

type GameMetaList = Vec<GameMeta>;

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub gui_config: Value,
    pub hot_key: Value,
    pub game_meta_list: GameMetaList,
}
