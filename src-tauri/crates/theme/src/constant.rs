use std::{collections::HashMap, error::Error, sync::OnceLock};

use lazy_static::lazy_static;

lazy_static! {
    /// 全局数据映射表
    pub static ref DATA_MAP: OnceLock<HashMap<&'static str, &'static str>> = OnceLock::default();
}

pub fn inject_map(map: HashMap<&'static str, &'static str>) -> Result<(), Box<dyn Error>> {
    DATA_MAP.set(map).map_err(|_| "DATA_MAP 已经被设置过了")?;
    Ok(())
}
