use crate::{config::entity::GameMetaList, error::AppError, state};

#[tauri::command]
pub fn get_user_info() {
    println!("I was invoked from JavaScript!");
}

#[tauri::command]
pub fn get_game_meta_list() -> Result<GameMetaList, AppError> {
    state::get_game_list()
}

#[tauri::command]
pub fn get_game_meta() {
    println!("I was invoked from JavaScript!");
}
