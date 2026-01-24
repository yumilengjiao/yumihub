//! 此模块为全局数据管理模块，所有游戏元数据都可以再次获得，并且
//! 做出以下约定，此模块的所有数据只能由那个数据类型对应的模块更
//! 改,也就是说只有那个数据的模块能调用set函数，不允许其他模块如
//! Controller模块更改,方便数据的同步处理,而此模块的其他子模块都
//! 是其他内部模块用来同步数据用的

use crate::{
    config::entity::{GameMeta, GameMetaList},
    error::AppError,
    state::user_data::update_user_info,
    user::entity::User,
};
pub mod game;
mod gui;
mod resource;
pub mod traits;
mod user_data;

// TODO: 用来自定义状态管理模块初始化逻辑，比如设定环境变量什么的
pub fn init() {
    println!("状态管理中心初始化");
}

/// 得到用户数据
pub fn get_user_info() -> Result<User, AppError> {
    user_data::get_user_info()
}

/// 得到gui配置数据
pub fn get_gui_info() {}

/// 得到单个游戏元数据
pub fn get_game(id: &str) -> Result<GameMeta, AppError> {
    game::get_game_by_id(id)
}

/// 得到所有游戏元数据
pub fn get_game_list() -> Result<GameMetaList, AppError> {
    game::get_game_list()
}

/// 设置用户数据
/// TODO: 到时候把bege迁移到user模块,像game一样
pub fn set_user_info(new_user: User) {
    tauri::async_runtime::spawn(async move {
        update_user_info(&new_user).await;
    });
}
