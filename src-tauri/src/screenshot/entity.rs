use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

/// 截图模型
///
/// * `id`: 唯一标识
/// * `game_id`: 游戏id-外键
/// * `file_path`: 截图路径
/// * `created_at`: 创建时间
/// * `thoughts`: 心得体会
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    id: String,
    game_id: String,
    file_path: String,
    created_at: String,
    thoughts: String,
}
