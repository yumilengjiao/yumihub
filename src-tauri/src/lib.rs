mod cmd;
mod config;
mod error;
mod life_cycle;
mod state;
mod user;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(life_cycle::init)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd::get_user_info_cmd,
            cmd::get_game_meta_cmd,
            cmd::get_game_meta_list_cmd,
            cmd::set_user_info_cmd,
            cmd::set_game_meta_cmd,
            cmd::set_game_meta_list_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
