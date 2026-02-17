use std::collections::HashMap;

use serde_json::Value;

use crate::errors::ThemeErr;

pub struct ThemeContext {
    pub id_idx: u32,
    pub err_list: Vec<ThemeErr>,
    pub variables: HashMap<String, Value>,
}

impl ThemeContext {
    pub fn load() -> Self {
        Self {
            id_idx: 0,
            err_list: vec![],
            variables: HashMap::new(),
        }
    }
}
