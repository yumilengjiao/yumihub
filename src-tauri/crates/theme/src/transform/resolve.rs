//! AST处理的第二阶段，负责把定义的变量进行解析

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

pub fn resolve_variables(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[replace_variables]);
    };

    // 不同路由页面的遍历处理
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, &[replace_variables]);
    }
}

pub fn replace_variables(node: &mut AstNode, ctx: &mut ThemeContext) {
    let props = match node.props.as_mut() {
        Some(p) => p.as_object_mut().unwrap(),
        None => return,
    };

    // 遍历 props 寻找变量引用
    for (_k, v) in props.iter_mut() {
        if let Some(str_val) = v.as_str()
            && str_val.starts_with('$')
        {
            let var_name = &str_val[1..];

            // 从上下文变量库中查表
            if let Some(actual_value) = ctx.variables.get(var_name) {
                // 原地替换，保留变量原始类型（数字还是字符串）
                *v = actual_value.clone();
            }
        }
    }
}
