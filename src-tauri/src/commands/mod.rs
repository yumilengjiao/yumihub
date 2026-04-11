//! 所有前端调用命令的入口模块
//!
//! 子模块按业务划分，每个模块只暴露 `#[tauri::command]` 函数。
//! `lib.rs` 的 `invoke_handler` 直接从此模块引入。

pub mod archive;
pub mod backup;
pub mod companion;
pub mod config;
pub mod game;
pub mod screenshot;
pub mod shortcut;
pub mod system;
pub mod user;

// 统一重新导出，让 lib.rs 只需 `use crate::commands::*`
pub use archive::*;
pub use backup::*;
pub use companion::*;
pub use config::*;
pub use game::*;
pub use screenshot::*;
pub use shortcut::*;
pub use system::*;
pub use user::*;
