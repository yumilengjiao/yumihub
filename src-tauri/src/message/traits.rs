use tokio::sync::broadcast::Receiver;

/// 标记trait,实现该trait才能被发布到消息中心
pub trait MessageEvent {}

/// 消息中心trait
pub trait MessageHub<T: MessageEvent> {
    fn new(capacity: usize) -> Self;
    // 提供一个便捷的订阅方法
    fn subscribe(&self) -> Receiver<T>;
    //提供一个便捷的发布方法
    fn publish(&self, event: T);
}
