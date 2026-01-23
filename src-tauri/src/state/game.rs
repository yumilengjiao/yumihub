use lazy_static::lazy_static;
use tokio::sync::RwLock;

use crate::{
    config::entity::{GameMeta, GameMetaList},
    error::AppError,
};
// 所有游戏信息
lazy_static! {
    pub static ref game_list: RwLock<GameMetaList> = RwLock::new(GameMetaList::default());
}

// 从state中获取完整的游戏信息列表
pub fn get_game_list() -> Result<GameMetaList, AppError> {
    if let Ok(games) = game_list.try_read() {
        Ok(games.clone())
    } else {
        Err(AppError::Fetch("无法获取游戏列表".to_string()))
    }
}

//用id查找返回单个游戏信息
pub fn get_game_by_id(id: &str) -> Result<GameMeta, AppError> {
    let guard = game_list
        .try_read()
        .map_err(|_| AppError::Fetch("无法获取写锁".to_string()))?;

    // 假设 GameMetaList 内部就是 Vec，或者实现了 Deref
    guard
        .iter()
        .find(|g| g.id == id)
        .cloned()
        .ok_or_else(|| AppError::Fetch(format!("未找到 id={} 的游戏", id)))
}

//用于异步更新游戏列表元数据
pub async fn update_game_list(new_game_list: &GameMetaList) {
    {
        println!("传如带同步的newgamelist: {:?}", new_game_list);
        let mut write = game_list.write().await;
        *write = new_game_list.clone();
    }
    let games = game_list.read().await;
    println!("成功同步数据,同步成功的数据是{:?}", games);
}

/// 用于异步更新单个游戏元数据,若数据存在则修改，数据不存在则添加
pub async fn update_game(new_game: GameMeta) {
    {
        println!("传如带同步的newgamelist: {:?}", new_game);
        let mut write = game_list.write().await;
        if let Some(old_game) = write.iter_mut().find(|g| g.id == new_game.id) {
            *old_game = new_game;
        } else {
            game_list.write().await.push(new_game);
        }
    }
    let games = game_list.read().await;
    println!("成功同步数据,同步成功的数据是{:?}", games);
}
