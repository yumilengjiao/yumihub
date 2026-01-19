use crate::config::{
    entity::{GameMeta, GameMetaList},
    GLOBAL_CONFIG,
};

/// 从全局配置中提取单个游戏元数据
pub fn extract_game(id: String) -> Option<GameMeta> {
    let global_config = GLOBAL_CONFIG.read().unwrap();
    global_config
        .game_meta_list
        .iter()
        .find(|g| g.id == id)
        .cloned()
}

/// 从全局配置中提取游戏元数据列表
pub fn extract_game_list() -> GameMetaList {
    let global_config = GLOBAL_CONFIG.read().expect("提取出现错误");
    global_config.game_meta_list.clone()
}
