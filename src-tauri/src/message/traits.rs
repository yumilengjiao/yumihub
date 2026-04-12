//! 消息系统 trait 定义

use tokio::sync::broadcast::Receiver;

/// 标记 trait：实现此 trait 的类型才能作为消息事件
pub trait MessageEvent: Clone + Send + 'static {}

/// 消息中心 trait
pub trait MessageHub<T: MessageEvent> {
    fn new(capacity: usize) -> Self;
    fn subscribe(&self) -> Receiver<T>;
    fn publish(&self, event: T);
}
