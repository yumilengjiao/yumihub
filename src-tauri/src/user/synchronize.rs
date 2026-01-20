use crate::{
    state::{
        set_user_info,
        traits::{SyncData, UpdateConfig},
    },
    user::{entity::User, USER_PROFILE},
};

/// 用于更改user模块内全局用户数据信息,并且实现数据同步到STATE_SYSTEM
pub fn update_data<T: UpdateConfig<User> + SyncData>(new_value: T) {
    {
        let mut user_profile = USER_PROFILE.write().expect("获取写锁失败");
        new_value.update(&mut user_profile);
    }

    //方法不放在update里,而是用sync_data，不然会造成死锁问题
    new_value.sync_data();
}

pub fn synchronize_user_to_state_system(new_user: &User) {
    set_user_info(new_user.clone());
}
