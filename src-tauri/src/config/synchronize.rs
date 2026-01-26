//! 此模块供外部系统调用，用于将新数据同步到CONFIG和STATE_SYSTEM两个系统

use crate::{
    config::{entity::Config, GLOBAL_CONFIG},
    state::traits::{Registerable, SyncData, UpdateConfig},
};

/// 用于更改全局配置文件某些数据内容配置信息,通过传GameList，GameMeta等数据
/// 来自动实现GLOBAL_CONFIG的动态更新,并且实现数据同步到STATE_SYSTEM
///
/// * `new_value`: 需要同步到本模块和同步到STATE_SYSTEM全局静态变量的数据
/// * `mode`: 当值为true的时候会向消息中心发布消息,使资源模块下载资源
pub fn update_data<T: UpdateConfig<Config> + SyncData>(new_value: T, mode: bool) {
    // 这里必须缩小作用域否则有死锁问题
    {
        let mut global_config = GLOBAL_CONFIG.write().expect("获取写锁失败");
        new_value.update(&mut global_config); //更新自模块
    }
    //同步到STATE_SYSTEM
    {
        new_value.sync_data();
    }
    //是否需要二次处理
    if mode {
        new_value.publish_sync_event();
    }
}

/// 用于将新添加到库的游戏同步到配置模块和STATE_SYSTEM
///
/// * `new_data`: 新的游戏数据
pub fn add_data<T: Registerable<Config> + SyncData>(new_data: T) {
    // 这里必须缩小作用域否则有死锁问题
    {
        let mut global_config = GLOBAL_CONFIG.write().expect("获取写锁失败");
        new_data.add_to_self_module(&mut global_config); //添加到自模块
    }
    //同步到STATE_SYSTEM
    {
        new_data.sync_data();
    }
    //发送消息到消息订阅与发布模块
    new_data.publish_sync_event();
}
