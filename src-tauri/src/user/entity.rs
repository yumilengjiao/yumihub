use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub user_name: String,
    pub avatar: String,
    pub games_count: i64,
    pub favorite_game: String,
    // 分钟
    pub total_play_time: i64,
    pub games_completed_number: i64,
    pub selected_disk: Option<String>,
    pub last_play_at: Option<DateTime<Local>>,
    pub created_at: Option<DateTime<Local>>,
}
