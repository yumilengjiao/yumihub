//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
//! set方法则是调用各自数据对应的模块
use crate::{
    config::{
        self,
        entity::{GameMeta, GameMetaList},
    },
    error::AppError,
    resolve::{resolve_game, resolve_games},
    state,
    user::{self, entity::User},
};

// ---------------用户类---------------
#[tauri::command]
pub fn get_user_info() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn set_user_info(user: User) {
    user::synchronize::update_data(user);
}

// -----------游戏类信息类-------------
#[tauri::command]
pub fn get_game_meta_list_cmd() -> Result<GameMetaList, AppError> {
    state::get_game_list()
}

#[tauri::command]
pub fn get_game_meta() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn update_game_meta_list(games: GameMetaList) {
    config::synchronize::update_data(games);
}

#[tauri::command]
pub fn update_game_meta(game: GameMeta) {
    config::synchronize::update_data(game);
}

#[tauri::command]
pub fn add_batch_games(parent_path: String) {
    resolve_games(&parent_path);
}

#[tauri::command]
pub fn add_game(game_path: String) {
    resolve_game(&game_path);
}
