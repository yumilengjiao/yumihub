//! AST处理第五阶段
//! 负责校验数据/结构的合法性

use crate::{
    errors::ThemeErr,
    schema::{
        ast::{AstNode, AstThemeConfig, NodeType},
        ctx::ThemeContext,
    },
    transform::{util, walk_node},
};

pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    let steps = &[
        check_id_presence,
        check_nt_presence,
        check_grid_bounds,
        check_style_integrity,
    ];
    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, steps);
    };

    // 不同路由页面的遍历处理
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, steps);
    }
}

/// 校验 ID 是否存在
fn check_id_presence(node: &mut AstNode, ctx: &mut ThemeContext) {
    if node.id.is_none() {
        ctx.err_list.push(ThemeErr::FiledMissing("id".to_string()));
    }
}

/// 校验节点类型是否存在
fn check_nt_presence(node: &mut AstNode, ctx: &mut ThemeContext) {
    if node.nt.is_none() {
        ctx.err_list.push(ThemeErr::FiledMissing("nt".to_string()));
    }
}

/// 校验栅格边界冲突
fn check_grid_bounds(node: &mut AstNode, ctx: &mut ThemeContext) {
    if let (Some(n_type), Some(children)) = (&node.nt, &node.children) {
        let limit = match n_type {
            NodeType::Row => util::get_prop_as_i64(node, "cols").unwrap_or(12),
            NodeType::Col => util::get_prop_as_i64(node, "rows").unwrap_or(12),
            _ => return,
        };

        for child in children {
            let (start, span) = util::extract_grid_props(child);
            if start + span - 1 > limit {
                // 这里借用 TypeConflict 来表达：类型(Row/Col) 与 字段(start/span) 存在数值冲突
                ctx.err_list.push(ThemeErr::TypeConflict(
                    format!("{:?}", n_type),
                    format!("child_id:{:?} layout overflow", child.id),
                ));
            }
        }
    }
}

/// 校验样式是否成功生成
fn check_style_integrity(node: &mut AstNode, ctx: &mut ThemeContext) {
    match &node.nt {
        Some(NodeType::Row) | Some(NodeType::Col) => {
            let has_display = node
                .inline_style
                .as_ref()
                .and_then(|s| s.get("display"))
                .is_some();

            if !has_display {
                ctx.err_list
                    .push(ThemeErr::FiledMissing("display:grid".to_string()));
            }
        }
        _ => {}
    }
}
