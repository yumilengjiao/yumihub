use std::{
    fs::{self},
    path::PathBuf,
};

use crate::{errors::ThemeErr, schema::ast::AstThemeConfig};

/// 将主题配置文件转化成抽象语法树
///
/// * `them_config_path`: 主题配置文件的路径
pub fn parse_to_ast(theme_config_path: PathBuf) -> Result<AstThemeConfig, ThemeErr> {
    let config_file =
        fs::read_to_string(theme_config_path).map_err(|e| ThemeErr::Io(e.to_string()))?;
    let config = json5::from_str::<AstThemeConfig>(&config_file)
        .map_err(|e| ThemeErr::Syntax(e.to_string()))?;
    Ok(config)
}
