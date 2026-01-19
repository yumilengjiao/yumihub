use lazy_static::lazy_static;
use tokio::sync::RwLock;

use crate::user::entity::User;

lazy_static! {
    pub static ref user: RwLock<User> = RwLock::new(User::default());
}

//用于异步更新用户信息
pub async fn update_user_info(new_user: &User) {
    {
        println!("传入的user: {:?}", new_user);
        let mut write = user.write().await;
        *write = new_user.clone();
    }
    let user_read = user.read().await;
    println!("成功同步数据,同步成功的数据是{:?}", user_read);
}
