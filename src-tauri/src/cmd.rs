//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
use crate::{
    config::{
        self,
        entity::{GameMeta, GameMetaList},
    },
    error::AppError,
    state,
    user::{self, entity::User},
};

// ---------------用户类---------------

#[tauri::command]
pub fn get_user_info() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn update_user_info(user: User) {
    user::synchronize::update_data(user);
}

// -----------游戏类信息类-------------

#[tauri::command]
pub fn get_game_meta_list() -> Result<GameMetaList, AppError> {
    state::get_game_list()
}

#[tauri::command]
pub fn get_game_meta() {
    println!("I was invoked from JavaScript!");
}

/// 用于添加单个游戏到游戏库
///
/// * `game`: 要添加的单个游戏信息
#[tauri::command]
pub fn add_new_game(game: GameMeta) {
    config::synchronize::add_data(game);
}

#[tauri::command]
/// 用于添加多个游戏到游戏库
///
/// * `games`: 要添加的游戏列表
pub fn add_new_game_list(games: GameMetaList) {
    config::synchronize::add_data(games);
}

/// 更新单个游戏数据,虽然内部在处理不存在游戏的时候也会添加新游戏
/// 到游戏列表,但不推荐使用此方法作为添加新游戏,应使用add_new_game
///
/// * `game`: 要更新的游戏数据
#[tauri::command]
pub fn update_game_meta(game: GameMeta) {
    config::synchronize::update_data(game, true);
}

/// 异步覆盖更新所有游戏数据
///
/// * `games`: 要覆盖更新的游戏列表数据
#[tauri::command]
pub fn update_game_meta_list(games: GameMetaList) {
    println!("开始更新游戏数据");
    config::synchronize::update_data(games, true);
}
