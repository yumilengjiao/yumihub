use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::synchronize::{synchronize_data_to_state_system, SyncType};
use crate::state::traits::{Entity, SyncData, UpdateConfig};

/// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameMeta {
    pub id: String,
    pub name: String,
    pub abs_path: String,
    pub cover: String,
    pub background: String,
    pub play_time: usize,
    pub size: u64,
    pub last_played_at: Option<DateTime<Local>>,
}

impl UpdateConfig<Config> for GameMeta {
    fn update(&self, config: &mut Config) {
        if let Some(game) = config.game_meta_list.iter_mut().find(|g| g.id == self.id) {
            *game = self.clone();
        }
    }
}

impl SyncData for GameMeta {
    fn sync_data(self) {
        synchronize_data_to_state_system(SyncType::GAME);
    }
}

/// 修改最后一次游玩的时间
impl GameMeta {
    fn update_last_played(&mut self) {
        self.last_played_at = Some(Local::now());
    }
}

/// 游戏元数据集合
pub type GameMetaList = Vec<GameMeta>;

impl UpdateConfig<Config> for GameMetaList {
    fn update(&self, config: &mut Config) {
        config.game_meta_list = self.clone();
    }
}

impl SyncData for GameMetaList {
    fn sync_data(self) {
        synchronize_data_to_state_system(SyncType::GAMELIST);
    }
}

/// 全局配置类型
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub gui_config: Value,
    pub game_meta_list: GameMetaList,
}

impl Entity for Config {}

impl UpdateConfig<Config> for Config {
    fn update(&self, config: &mut Config) {
        println!("config开始自更新");
        *config = self.clone();
    }
}

impl SyncData for Config {
    fn sync_data(self) {
        synchronize_data_to_state_system(SyncType::ALL);
    }
}
