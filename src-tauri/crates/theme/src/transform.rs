use crate::{
    errors::ThemeErr,
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
};

mod normalize;
mod resolve;

// 各种normalize阶段处理函数
pub type LogicStep = fn(&mut AstNode, &mut ThemeContext);

pub fn run(ast_config: &mut AstThemeConfig, ctx: &mut ThemeContext) -> Result<(), Vec<ThemeErr>> {
    resolve::resolve_variables(ast_config, ctx);
    normalize::run(ast_config, ctx);
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
