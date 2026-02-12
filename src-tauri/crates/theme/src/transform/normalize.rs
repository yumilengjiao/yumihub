use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

/// 对抽象语法树进行常规化处理,补全缺失信息
///
/// * `ast`: 主题配置的抽象语法树
/// * `ctx`: 上下文信息
pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    // 递归遍历时逻辑处理闭包
    let logic_func = |ast_node: &mut AstNode, ctx: &mut ThemeContext| {
        if let None = &mut ast_node.id {
            ast_node.id = Some(ctx.id_idx);
            ctx.id_idx += 1;
        }
    };

    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        let widget = &mut global_node.widget;
        walk_node(widget, ctx, &logic_func);
    };

    // 不同路由页面的遍历处理
    for (_, v) in &mut ast.layout.pages {
        walk_node(&mut v.content, ctx, &logic_func);
    }
}
