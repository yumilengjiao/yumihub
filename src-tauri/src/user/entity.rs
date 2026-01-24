use serde::{Deserialize, Serialize};

use crate::{
    state::traits::{Entity, SyncData, UpdateConfig},
    user::synchronize,
};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub user_id: String,
    pub user_name: String,
    pub total_play_time: usize,
    pub library_paths: Vec<String>,
    pub folders: Vec<String>,
}

impl Entity for User {}

impl UpdateConfig<User> for User {
    fn update(&self, user_profile: &mut User) {
        *user_profile = self.clone();
    }
}

impl SyncData for User {
    fn sync_data(&self) {
        synchronize::synchronize_user_to_state_system(self);
    }
}
