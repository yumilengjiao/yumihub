use std::{fs::File, io::BufReader, path::PathBuf};

use crate::{errors::ThemeErr, schema::ast::AstThemeConfig};

/// 将主题配置文件转化成抽象语法树
///
/// * `them_config_path`: 主题配置文件的路径
pub fn parse_to_ast(theme_config_path: PathBuf) -> Result<AstThemeConfig, ThemeErr> {
    let config_file = File::open(theme_config_path).map_err(|_| ThemeErr::Io)?;
    let config_reader = BufReader::new(config_file);
    let config =
        serde_json::from_reader::<_, AstThemeConfig>(config_reader).map_err(|_| ThemeErr::Io)?;
    Ok(config)
}
