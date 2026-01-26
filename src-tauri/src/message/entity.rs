//! 消息系统的实体

use tokio::sync::broadcast;

use crate::config::entity::GameMeta;

#[derive(Clone, Debug)]
pub enum SystemEvent {
    // 资源任务消息
    ResourceTaskCreated {
        meta: GameMeta,
        // 只有在为真的时候资源模块才会下载资源
        needs_resource_sync: bool,
    },
    // 系统状态消息
    BackendReady,
}

// 集中式消息管理器
pub struct MessageHub {
    // 所有的消息都通过这个主干道发送
    pub main_tx: broadcast::Sender<SystemEvent>,
}

impl MessageHub {
    pub fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { main_tx: tx }
    }

    // 提供一个便捷的订阅方法
    pub fn subscribe(&self) -> broadcast::Receiver<SystemEvent> {
        self.main_tx.subscribe()
    }

    // 提供一个便捷的发布方法
    pub fn publish(&self, event: SystemEvent) {
        let _ = self.main_tx.send(event);
    }
}
