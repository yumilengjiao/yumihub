use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 实现了该特性通过调用update方法更改自己在全局config
/// 变量内的信息
pub trait UpdateConfig {
    fn update(self, config: &mut Config);
}
/// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct GameMeta {
    id: String,
    name: String,
    abs_path: String,
    cover: String,
    play_time: u64,
    size: u64,
}

impl UpdateConfig for GameMeta {
    fn update(self, config: &mut Config) {
        if let Some(game) = config.game_meta_list.iter_mut().find(|g| g.id == self.id) {
            *game = self;
        }
    }
}

/// 游戏元数据集合
type GameMetaList = Vec<GameMeta>;

impl UpdateConfig for GameMetaList {
    fn update(self, config: &mut Config) {
        config.game_meta_list = self;
    }
}

/// 全局配置类型
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub gui_config: Value,
    pub hot_key: Value,
    pub game_meta_list: GameMetaList,
}
