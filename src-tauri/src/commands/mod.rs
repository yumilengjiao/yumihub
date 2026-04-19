//! 所有前端可调用命令的入口
//!
//! 按业务领域划分子模块，`lib.rs` 的 `invoke_handler` 直接使用 `commands::` 前缀。

pub mod archive;
pub mod backup;
pub mod collection;
pub mod companion;
pub mod config;
pub mod game;
pub mod screenshot;
pub mod shortcut;
pub mod system;
pub mod user;

pub use archive::*;
pub use backup::*;
pub use collection::*;
pub use companion::*;
pub use config::*;
pub use game::*;
pub use screenshot::*;
pub use shortcut::*;
pub use system::*;
pub use user::*;
