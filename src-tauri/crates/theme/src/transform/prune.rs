//! AST处理第四阶段
//! 此模块用于将语法树中一些无用的字段进行剔除，对数据进行体积上的减小

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

/// ast结构清理以及重构的入口
///
/// * `ast`: 抽象语法树
/// * `ctx`: 上下文对象
pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[clear_props]);
    };

    // 不同路由页面的遍历处理
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, &[clear_props]);
    }
}

fn clear_props(ast: &mut AstNode, _ctx: &mut ThemeContext) {
    ast.props = None;
}
