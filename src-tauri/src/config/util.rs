use crate::config::{
    entity::{GameMeta, GameMetaList},
    GLOBAL_CONFIG,
};

// 从全局配置中提取单个游戏元数据
pub fn extract_game(id: String) -> Option<GameMeta> {
    let global_config = GLOBAL_CONFIG.read().unwrap();
    global_config
        .game_meta_list
        .iter()
        .find(|g| g.id == id)
        .cloned()
}
// 从全局配置中提取游戏元数据列表
// TODO: 这个方法有错误,返回的是空数组
pub fn extract_game_list() -> GameMetaList {
    println!("开始提取列表");
    let global_config = GLOBAL_CONFIG.read().expect("提取出现错误");
    println!("提取的游戏列表为{:?}", global_config);
    global_config.game_meta_list.clone()
}
