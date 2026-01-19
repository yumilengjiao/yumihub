//! 此模块为全局数据管理模块，所有游戏元数据都可以再次获得，并且
//! 做出以下约定，此模块的所有数据只能由那个数据类型对应的模块更
//! 改,也就是说只有那个数据的模块能调用set函数，不允许其他模块如
//! Controller模块更改，方便数据的同步处理

use crate::{config::entity::GameMetaList, state::game::update_game_list};
mod game;
mod gui;
mod resource;
mod user;

/// 得到所有游戏元数据
pub fn get_game_list() {}

/// 设置所有游戏元数据
pub fn set_game_list(game_list: GameMetaList) {
    tauri::async_runtime::spawn(async move {
        update_game_list(&game_list).await;
    });
}

/// 得到单个游戏元数据
pub fn get_game(id: &str) {}

/// 设置单个游戏元数据
pub fn set_game() {}

/// 得到用户数据
pub fn get_user_info() {}

/// 设置用户数据
pub fn set_user_info() {}

/// 得到gui配置数据
pub fn get_gui_info() {}

/// 设置gui配置数据
pub fn set_gui_info() {}
