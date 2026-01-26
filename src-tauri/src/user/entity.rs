use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub user_name: String,
    pub avatar: String,
    pub games_count: i64,
    pub favorite_vn_id: String,
    pub total_play_time: i64,
    pub games_completed_number: i64,
    pub last_play_at: Option<DateTime<Local>>,
    pub created_at: Option<DateTime<Local>>,
}
