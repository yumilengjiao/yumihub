//! 此模块定义了所有数据一些通用的trait

/// 标记trait，实现该标记的类型可以被同步到自己模块的全局变量中
pub trait Entity {}

/// 实现了该特征通过调用update方法更改自己在config模块的全局config变量,
/// 该特征并不保证数据同步到state_system
pub trait UpdateConfig<T: Entity> {
    fn update(&self, entity: &mut T);
}
/// 实现特征的实体需要实现sync_data方法来让自己的数据同步到STATE_SYSTEM
pub trait SyncData {
    // 同步数据到STATE_SYSTEM
    fn sync_data(&self);
    // 数据需要第二次处理
    fn publish_sync_event(&self);
}

/// 实现此特征的元素可以被添加到自己模块中的全局变量中
pub trait Registerable<T: Entity> {
    fn add_to_self_module(&self, entity: &mut T);
}
