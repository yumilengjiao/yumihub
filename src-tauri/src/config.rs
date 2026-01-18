use std::{error::Error, path::PathBuf, sync::OnceLock};

use tauri::{App, Manager};

mod entity;
mod fs;

pub static CONFIG_PATH: OnceLock<PathBuf> = OnceLock::new();
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    set_config_path(app.path().app_config_dir()?);
    Ok(())
}

fn set_config_path(config_path: PathBuf) {
    CONFIG_PATH.set(config_path).unwrap();
}
