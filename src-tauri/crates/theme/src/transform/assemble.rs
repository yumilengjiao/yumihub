//! 这是AST处理的最后一个阶段
//! 将庞大繁杂的AST转化成只有前端需要的IR结构

use crate::schema::{ast::AstThemeConfig, ctx::ThemeContext, ir::ThemeIr};

pub fn run(ast: AstThemeConfig, _ctx: &mut ThemeContext) -> ThemeIr {
    ThemeIr::from(ast)
}
