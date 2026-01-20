//! 前端发送的所有调用请求命令在此定义，get方法只会调用state_system,
//! set方法则是调用各自数据对应的模块
use crate::{
    config::{
        self,
        entity::{GameMeta, GameMetaList},
    },
    error::AppError,
    state,
    user::{self, entity::User},
};

#[tauri::command]
pub fn get_user_info_cmd() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn get_game_meta_list_cmd() -> Result<GameMetaList, AppError> {
    state::get_game_list()
}

#[tauri::command]
pub fn get_game_meta_cmd() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn set_user_info_cmd(user: User) {
    user::synchronize::update_data(user);
}

#[tauri::command]
pub fn set_game_meta_list_cmd(games: GameMetaList) {
    config::synchronize::update_data(games);
}

#[tauri::command]
pub fn set_game_meta_cmd(game: GameMeta) {
    config::synchronize::update_data(game);
}
