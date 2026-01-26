use tauri::RunEvent;

mod cmd;
mod config;
mod db;
mod error;
mod life_cycle;
mod message;
mod resource;
mod user;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(life_cycle::init)
        .invoke_handler(tauri::generate_handler![
            cmd::get_user_info,
            cmd::update_user_info,
            cmd::get_game_meta_by_id,
            cmd::get_game_meta_list,
            cmd::update_game_meta_list,
            cmd::add_new_game,
            cmd::add_new_game_list
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            match event {
                RunEvent::Exit => {
                    // TODO:此处保存config
                    life_cycle::exit()
                }
                RunEvent::ExitRequested { .. } => {
                    // TODO:此处保存config
                    life_cycle::exit()
                }
                _ => {}
            }
        })
}
