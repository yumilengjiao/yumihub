//! AST处理第五阶段
//! 负责校验数据/结构的合法性

use crate::{
    errors::ThemeErr,
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[check_id_presence, check_nt_presence]);
    };

    // 不同路由页面的遍历处理
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, &[check_id_presence, check_nt_presence]);
    }
}

/// 校验 ID 是否存在
pub fn check_id_presence(node: &mut AstNode, ctx: &mut ThemeContext) {
    if node.id.is_none() {
        ctx.err_list.push(ThemeErr::FiledMissing("id".to_string()));
    }
}

/// 校验节点类型是否存在
pub fn check_nt_presence(node: &mut AstNode, ctx: &mut ThemeContext) {
    if node.nt.is_none() {
        ctx.err_list.push(ThemeErr::FiledMissing("nt".to_string()));
    }
}
