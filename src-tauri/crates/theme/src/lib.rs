use std::path::PathBuf;

use crate::{
    errors::ThemeErr,
    schema::{ctx::ThemeContext, ir::ThemeIr},
};

mod constant;
pub mod errors;
mod parse;
pub mod schema;
mod transform;

pub fn load(theme_cfg_path: PathBuf) -> Result<ThemeIr, Vec<ThemeErr>> {
    let mut ctx = ThemeContext::load();
    let mut ast = parse::parse_to_ast(theme_cfg_path).map_err(|e| vec![e])?;
    // 注入变量信息到上下文
    if let Some(vars) = ast.config.variables.take() {
        ctx.variables = vars
    }
    // 处理抽象语法树
    transform::run(&mut ast, &mut ctx)?;

    println!("处理后的抽象语法树:{:#?}", ast);

    Ok(ThemeIr::default())
}
