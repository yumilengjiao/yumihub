/// 实现特征的实体需要实现sync_data方法来让自己的数据同步到STATE_SYSTEM
pub trait SyncData {
    fn sync_data(self);
}
