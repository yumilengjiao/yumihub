//! 配置相关命令

use tauri_plugin_log::log::error;

use crate::{
    config::{
        entity::{Config, ConfigEvent},
        GLOBAL_CONFIG,
    },
    error::AppError,
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB},
};

/// 获取配置信息
#[tauri::command]
pub fn get_config() -> Result<Config, AppError> {
    GLOBAL_CONFIG
        .read()
        .map(|c| c.clone())
        .map_err(|e| {
            error!("{}", e);
            AppError::Mutex(e.to_string())
        })
}

/// 更新配置信息，通过消息系统分发各子模块处理
#[tauri::command]
pub async fn update_config(config: Config) -> Result<(), AppError> {
    let old_config = GLOBAL_CONFIG
        .read()
        .map_err(|e| {
            error!("无法获取全局配置信息，无法更新配置，错误: {}", e);
            AppError::Mutex(e.to_string())
        })?
        .clone();

    if old_config.basic != config.basic {
        CONFIG_MESSAGE_HUB.publish(ConfigEvent::Basic { base: config.basic });
    }
    if old_config.interface != config.interface {
        CONFIG_MESSAGE_HUB.publish(ConfigEvent::Interface {
            interface: config.interface,
        });
    }
    if old_config.storage != config.storage {
        CONFIG_MESSAGE_HUB.publish(ConfigEvent::Storage {
            stroage: config.storage,
        });
    }
    if old_config.system != config.system {
        CONFIG_MESSAGE_HUB.publish(ConfigEvent::System { sys: config.system });
    }
    if old_config.auth != config.auth {
        CONFIG_MESSAGE_HUB.publish(ConfigEvent::Authorization { auth: config.auth });
    }

    Ok(())
}
