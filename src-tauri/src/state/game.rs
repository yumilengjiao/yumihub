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

/// cmd调用-从state中获取完整的游戏信息列表
pub fn get_game_list() -> Result<GameMetaList, AppError> {
    if let Ok(games) = game_list.try_read() {
        Ok(games.clone())
    } else {
        Err(AppError::Fetch("无法获取游戏列表".to_string()))
    }
}

/// cmd调用-用id查找返回单个游戏信息
///
/// * `id`: 游戏信息的id
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

/// 模块调用-用于异步覆盖更新整个游戏列表数据
///
/// * `new_game_list`: 新的游戏列表
pub fn update_game_list(new_game_list: GameMetaList) {
    tauri::async_runtime::spawn(async move {
        let mut write = game_list.write().await;
        *write = new_game_list.clone();
    });
}

/// 模块调用-用于异步添加一整个游戏列表数据到此系统
///
/// * `new_game_list`: 要添加的游戏列表
pub async fn add_game_list(new_game_list: GameMetaList) {
    tauri::async_runtime::spawn(async move {
        let mut write = game_list.write().await;
        write.extend(new_game_list);
    });
}

/// 模块调用-用于异步更新STATE_SYSTEM的单个游戏数据,存在则更新,不存在则添加
///
/// * `new_game`: [TODO:parameter]
pub fn update_game(new_game: GameMeta) {
    tauri::async_runtime::spawn(async move {
        println!("传如带同步的newgamelist: {:?}", new_game);
        let mut write = game_list.write().await;
        if let Some(old_game) = write.iter_mut().find(|g| g.id == new_game.id) {
            *old_game = new_game;
        } else {
            game_list.write().await.push(new_game);
        }
    });
}
