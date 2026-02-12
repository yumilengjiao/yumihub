use crate::{
    errors::ThemeErr,
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
};

mod normalize;

pub fn run(ast_config: &mut AstThemeConfig, ctx: &mut ThemeContext) -> Result<(), Vec<ThemeErr>> {
    normalize::run(ast_config, ctx);
    Ok(())
}

/// 遍历递归的基本函数
///
/// * `node`: 节点
/// * `ctx`: 上下文
/// * `f`: 逻辑闭包
fn walk_node<F>(node: &mut AstNode, ctx: &mut ThemeContext, f: &F)
where
    F: Fn(&mut AstNode, &mut ThemeContext),
{
    // 执行当前阶段的逻辑
    f(node, ctx);

    // 递归子节点
    if let Some(children) = &mut node.children {
        for child in children {
            walk_node(child, ctx, f);
        }
    }
}
