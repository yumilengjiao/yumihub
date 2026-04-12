use crate::{
    config::{
        entity::{Config, ConfigEvent},
        GLOBAL_CONFIG,
    },
    error::AppError,
    message::{traits::MessageHub, CONFIG_HUB},
};

#[tauri::command]
pub fn get_config() -> Result<Config, AppError> {
    GLOBAL_CONFIG
        .read()
        .map(|c| c.clone())
        .map_err(|e| AppError::Lock(e.to_string()))
}

/// 只对发生变化的子配置发布事件，避免无意义的副作用
#[tauri::command]
pub async fn update_config(config: Config) -> Result<(), AppError> {
    let old = GLOBAL_CONFIG
        .read()
        .map_err(|e| AppError::Lock(e.to_string()))?
        .clone();

    if old.basic != config.basic {
        CONFIG_HUB.publish(ConfigEvent::Basic { base: config.basic });
    }
    if old.interface != config.interface {
        CONFIG_HUB.publish(ConfigEvent::Interface { interface: config.interface });
    }
    if old.storage != config.storage {
        CONFIG_HUB.publish(ConfigEvent::Storage { storage: config.storage });
    }
    if old.system != config.system {
        CONFIG_HUB.publish(ConfigEvent::System { sys: config.system });
    }
    if old.auth != config.auth {
        CONFIG_HUB.publish(ConfigEvent::Authorization { auth: config.auth });
    }

    Ok(())
}
