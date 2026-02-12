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

pub fn load(them_cfg_path: PathBuf) -> Result<ThemeIr, Vec<ThemeErr>> {
    let mut ctx = ThemeContext::load();
    let mut ast = parse::parse_to_ast(them_cfg_path).map_err(|e| vec![e])?;
    transform::run(&mut ast, &mut ctx);
    println!("初始处理的抽象语法树:{:?}", ast);

    Ok(ThemeIr::default())
}
