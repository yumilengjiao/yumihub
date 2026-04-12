//! 游戏模块

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use lazy_static::lazy_static;

use crate::game::entity::RunningGame;

pub mod commands;
pub mod entity;

lazy_static! {
    /// 当前正在运行的游戏，key 为游戏 ID
    pub static ref RUNNING_GAMES: Arc<Mutex<HashMap<String, RunningGame>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
