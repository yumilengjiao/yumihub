//! 截图数据结构

use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    pub id: String,
    pub game_id: String,
    pub file_path: String,
    pub created_at: String,
    pub thoughts: Option<String>, // NULL = 未填写感想
}
