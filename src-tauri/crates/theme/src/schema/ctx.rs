use crate::errors::ThemeErr;

pub struct ThemeContext {
    pub id_idx: u32,
    pub err_list: Vec<ThemeErr>,
}

impl ThemeContext {
    pub fn load() -> Self {
        Self {
            id_idx: 0,
            err_list: vec![],
        }
    }
}
