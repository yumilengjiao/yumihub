use lazy_static::lazy_static;
use tokio::sync::RwLock;

use crate::{config::entity::GameMetaList, error::AppError};

lazy_static! {
    pub static ref game_list: RwLock<GameMetaList> = RwLock::new(GameMetaList::default());
}

//用于异步更新游戏元数据
pub async fn update_game_list(new_game_list: &GameMetaList) {
    {
        println!("传如带同步的newgamelist: {:?}", new_game_list);
        let mut write = game_list.write().await;
        *write = new_game_list.clone();
    }
    let games = game_list.read().await;
    println!("成功同步数据,同步成功的数据是{:?}", games);
}

pub fn get_game_list() -> Result<GameMetaList, AppError> {
    if let Ok(games) = game_list.try_read() {
        Ok(games.clone())
    } else {
        Err(AppError::Fetch("无法获取游戏列表".to_string()))
    }
}
