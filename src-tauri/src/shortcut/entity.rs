use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutSetting {
    pub id: String,
    pub key_combo: Option<String>,
    pub is_global: bool,
}
