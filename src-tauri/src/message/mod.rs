//! 全局消息总线
//!
//! 各模块通过此处的全局 Hub 发布 / 订阅事件，
//! 实现模块间的解耦通信。

use lazy_static::lazy_static;

use crate::{
    config::entity::ConfigMessageHub,
    game::entity::GameMessageHub,
    message::traits::MessageHub,
};

pub mod traits;

lazy_static! {
    pub static ref GAME_HUB: GameMessageHub = GameMessageHub::new(1024);
    pub static ref CONFIG_HUB: ConfigMessageHub = ConfigMessageHub::new(512);
}
