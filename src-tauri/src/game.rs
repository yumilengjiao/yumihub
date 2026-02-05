//! 游戏模块,用于处理和游戏有关的信息

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use lazy_static::lazy_static;

use crate::game::entity::RunningGameStatus;

pub mod commands;
pub mod entity;

lazy_static! {
    // Key 是游戏 ID，Value 是运行状态
    pub static ref RUNNING_GAMES: Arc<Mutex<HashMap<String, RunningGameStatus>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
