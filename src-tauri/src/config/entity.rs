use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::util::extract_game_list;
use crate::message::entity::{MessageHub, SystemEvent};
use crate::message::MESSAGE_HUB;
use crate::state;
use crate::state::traits::{Entity, Registerable, SyncData, UpdateConfig};

// 游戏元数据结构体
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameMeta {
    pub id: String,
    pub name: String,
    pub abs_path: String,
    pub cover: String,
    pub background: String,
    pub local_cover: Option<String>,
    pub local_background: Option<String>,
    pub play_time: usize,
    pub length: usize,
    pub size: Option<u64>,
    pub last_played_at: Option<DateTime<Local>>,
}

//更新本模块变量
impl UpdateConfig<Config> for GameMeta {
    fn update(&self, config: &mut Config) {
        if let Some(game) = config.game_meta_list.iter_mut().find(|g| g.id == self.id) {
            *game = self.clone();
        }
    }
}

//同步到STATE_SYSTEM
impl SyncData for GameMeta {
    fn sync_data(&self) {
        state::game::update_game(self.clone())
    }

    fn publish_sync_event(&self) {
        MESSAGE_HUB.publish(SystemEvent::ResourceTaskCreated {
            meta: self.clone(),
            needs_resource_sync: true,
        });
    }
}

//添加新的数据到本模块全局变量
impl Registerable<Config> for GameMeta {
    fn add_to_self_module(&self, config: &mut Config) {
        config.game_meta_list.push(self.clone());
    }
}

/// 游戏元数据集合
pub type GameMetaList = Vec<GameMeta>;

//更新本模块变量
impl UpdateConfig<Config> for GameMetaList {
    fn update(&self, config: &mut Config) {
        config.game_meta_list = self.clone();
    }
}

//同步到STATE_SYSTEM
impl SyncData for GameMetaList {
    fn sync_data(&self) {
        let game_list = extract_game_list();
        state::game::update_game_list(game_list);
    }
    fn publish_sync_event(&self) {
        for game_meta in self.iter() {
            MESSAGE_HUB.publish(SystemEvent::ResourceTaskCreated {
                meta: game_meta.clone(),
                needs_resource_sync: true,
            });
        }
    }
}

//添加新的批量游戏数据到本模块全局变量
impl Registerable<Config> for GameMetaList {
    fn add_to_self_module(&self, config: &mut Config) {
        config.game_meta_list.extend(self.clone());
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
    // TODO:同步所有数据信息,目前数据不够所以和上面的GameList同步方法一样只是覆盖更新游戏列表数据
    fn sync_data(&self) {
        let game_list = extract_game_list();
        state::game::update_game_list(game_list);
    }
    fn publish_sync_event(&self) {
        // TODO: 目前这里不知道干什么
    }
}
