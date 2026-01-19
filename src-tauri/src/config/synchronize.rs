use crate::{
    config::{entity::UpdateConfig, util::extract_game_list, GLOBAL_CONFIG},
    state::{self, traits::SyncData},
};

/// 用于更改全局配置文件某些数据内容配置信息,通过传GameList，GameMeta等数据
/// 来自动实现GLOBAL_CONFIG的动态更新,并且实现数据同步到STATE_SYSTEM
pub fn update_data<T: UpdateConfig + SyncData>(new_value: T) {
    {
        let mut global_config = GLOBAL_CONFIG.write().expect("获取写锁失败");
        new_value.update(&mut global_config);
    }

    //方法不放在update里,而是用sync_data，不然会造成死锁问题
    new_value.sync_data();
}

/// 用于定义需要同步到STATE_SYSTEM的数据的类型
pub enum SyncType {
    ALL,
    GAME,
    GAMELIST,
}

// 更新游戏信息到state_system
pub fn synchronize_data_to_state_system(sync_type: SyncType) {
    use SyncType::*;
    match sync_type {
        // TODO: 这里将来要加载所有数据而不仅仅是集合
        ALL => {
            let game_list = extract_game_list();
            state::set_game_list(game_list);
        }
        GAME => println!("ALL"),
        GAMELIST => {
            let game_list = extract_game_list();
            state::set_game_list(game_list);
        }
    }
}
