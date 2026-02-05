use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    id: String,
    game_id: String,
    file_path: String,
    created_at: String,
    thoughts: String,
}
