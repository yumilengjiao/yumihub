//! 执行AST——>IR转换的核心模块

use crate::{
    errors::ThemeErr,
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
};

mod normalize;
mod resolve;
mod style;

// 各种normalize阶段处理函数
pub type LogicStep = fn(&mut AstNode, &mut ThemeContext);

/// 解析处理语法树的主要函数,用于将AST—->IR,转换成为前端可以轻松解析的完整的规范化的节点树
///
/// * `ast_config`: 磁盘上读取的抽象语法树配置
/// * `ctx`: 上下文对象
pub fn run(ast_config: &mut AstThemeConfig, ctx: &mut ThemeContext) -> Result<(), Vec<ThemeErr>> {
    // 变量注入
    resolve::resolve_variables(ast_config, ctx);
    // 补全必须值
    normalize::run(ast_config, ctx);
    // 样式解析
    style::run(ast_config, ctx);
    Ok(())
}

/// 遍历递归的基本函数
///
/// * `node`: 节点
/// * `ctx`: 上下文
/// * `f`: 逻辑闭包
fn walk_node(node: &mut AstNode, ctx: &mut ThemeContext, funcs: &[LogicStep]) {
    // 执行当前阶段的逻辑
    for f in funcs {
        f(node, ctx);
    }

    // 递归子节点
    if let Some(children) = &mut node.children {
        for child in children {
            walk_node(child, ctx, funcs);
        }
    }
}
