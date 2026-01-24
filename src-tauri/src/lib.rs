mod cmd;
mod config;
mod error;
mod life_cycle;
mod state;
mod user;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(life_cycle::init)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd::get_user_info,
            cmd::set_user_info,
            cmd::get_game_meta,
            cmd::get_game_meta_list_cmd,
            cmd::update_game_meta,
            cmd::update_game_meta_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
