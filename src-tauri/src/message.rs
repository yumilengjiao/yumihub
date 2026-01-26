//! 全局消息事件系统
//! config会在特定数据更新时发送消息,资源模块消费,从网络io下载图片到本地

use lazy_static::lazy_static;

use crate::message::entity::MessageHub;

pub mod entity;

lazy_static! {
    // 只需要存储 Sender，因为 Receiver 可以通过 Sender 随时创建
    pub static ref MESSAGE_HUB: MessageHub = MessageHub::new(1024);
}

/// 消息模块的初始化函数,目前没有用
pub fn init() {}
