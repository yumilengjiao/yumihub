//! 全局消息事件系统
//! config会在特定数据更新时发送消息,资源模块消费,从网络io下载图片到本地

use lazy_static::lazy_static;

use crate::{
    config::entity::ConfigMessageHub, game::entity::GameMessageHub, message::traits::MessageHub,
};

pub mod entity;
pub mod traits;

//各个模块的MESSAGE_HUB都存在这里几种管理
lazy_static! {
    // 只需要存储 Sender，因为 Receiver 可以通过 Sender 随时创建
    pub static ref GAME_MESSAGE_HUB: GameMessageHub = GameMessageHub::new(1024);
    pub static ref CONFIG_MESSAGE_HUB: ConfigMessageHub = ConfigMessageHub::new(512);
}
