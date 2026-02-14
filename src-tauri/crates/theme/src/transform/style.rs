//! AST处理的第三阶段，负责AST中的种种属性映射为taiwind的utility classes
//! 以及将各种taiwind无法在运行期间识别的布局信息识别并完善到inline_style中

use serde_json::json;

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig, NodeType},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

/// 样式参数解析入口
///
/// * `ast`: 抽象语法树
/// * `ctx`: 上下文对象
pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[resolve_span]);
    };
}

pub fn resolve_span(ast_node: &mut AstNode, _ctx: &mut ThemeContext) {
    let n_type = match &ast_node.nt {
        Some(t) => t,
        None => return,
    };

    match n_type {
        NodeType::Row => {
            // 设置 Row 自身的 Grid 容器属性
            let cols = get_prop_as_i64(ast_node, "cols").unwrap_or(12);
            let style = ast_node.inline_style.get_or_insert_with(Default::default);
            style.insert("display".to_string(), json!("grid"));
            style.insert(
                "grid-template-columns".to_string(),
                json!(format!("repeat({}, minmax(0, 1fr))", cols)),
            );

            // 遍历直系子节点，注入位置信息
            if let Some(children) = &mut ast_node.children {
                for child in children {
                    let (start, span) = extract_grid_props(child);
                    let grid_val = format!("{} / span {}", start, span);

                    child
                        .inline_style
                        .get_or_insert_with(Default::default)
                        .insert("grid-column".to_string(), json!(grid_val));
                }
            }
        }
        NodeType::Col => {
            // 设置 Col 自身的 Grid 容器属性
            let rows = get_prop_as_i64(ast_node, "rows").unwrap_or(12);
            let style = ast_node.inline_style.get_or_insert_with(Default::default);
            style.insert("display".to_string(), json!("grid"));
            // 纵向布局
            style.insert(
                "grid-template-rows".to_string(),
                json!(format!("repeat({}, minmax(0, 1fr))", rows)),
            );

            // 遍历直系子节点，注入纵向位置
            if let Some(children) = &mut ast_node.children {
                for child in children {
                    let (start, span) = extract_grid_props(child);
                    let grid_val = format!("{} / span {}", start, span);

                    child
                        .inline_style
                        .get_or_insert_with(Default::default)
                        .insert("grid-row".to_string(), json!(grid_val));
                }
            }
        }
        _ => {}
    }
}

// --- 辅助函数：从 props 中安全提取 start 和 span ---
fn extract_grid_props(node: &AstNode) -> (i64, i64) {
    let start = get_prop_as_i64(node, "start").unwrap();
    let span = get_prop_as_i64(node, "span").unwrap();
    (start, span)
}

// --- 辅助函数：获取 i64 类型的 prop ---
fn get_prop_as_i64(node: &AstNode, key: &str) -> Option<i64> {
    node.props
        .as_ref()
        .and_then(|p| p.as_object())
        .and_then(|obj| obj.get(key))
        .and_then(|v| v.as_i64())
}
