//! AST处理的第三阶段
//! 负责AST中的种种属性映射为taiwind的utility classes
//! 以及将各种taiwind无法在运行期间识别的布局信息识别并完善到inline_style中

use std::fmt::format;

use serde_json::json;

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig, NodeType},
        ctx::ThemeContext,
    },
    transform::{style, util, walk_node},
};

/// 样式参数解析入口
///
/// * `ast`: 抽象语法树
/// * `ctx`: 上下文对象
pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[resolve_span]);
    };
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, &[resolve_span]);
    }
}

pub fn resolve_span(ast_node: &mut AstNode, _ctx: &mut ThemeContext) {
    let n_type = match ast_node.nt.as_ref() {
        Some(t) => t,
        None => return,
    };

    match n_type {
        NodeType::Row => {
            // 设置 Row 自身的 Grid 容器属性
            let cols = util::get_prop_as_i64(ast_node, "cols").unwrap_or(12);
            let style = ast_node.inline_style.get_or_insert_with(Default::default);
            style.insert("width".to_string(), json!("100%"));
            style.insert("height".to_string(), json!("100%"));
            style.insert("display".to_string(), json!("grid"));
            style.insert(
                "grid-template-columns".to_string(),
                json!(format!("repeat({}, minmax(0, 1fr))", cols)),
            );

            // 遍历直系子节点，注入位置信息
            if let Some(children) = &mut ast_node.children {
                for child in children {
                    let (start, span) = util::extract_grid_props(child);
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
            let rows = util::get_prop_as_i64(ast_node, "rows").unwrap_or(12);
            let style = ast_node.inline_style.get_or_insert_with(Default::default);
            style.insert("width".to_string(), json!("100%"));
            style.insert("height".to_string(), json!("100%"));
            style.insert("display".to_string(), json!("grid"));
            // 纵向布局
            style.insert(
                "grid-template-rows".to_string(),
                json!(format!("repeat({}, minmax(0, 1fr))", rows)),
            );

            // 遍历直系子节点，注入纵向位置
            if let Some(children) = &mut ast_node.children {
                for child in children {
                    let (start, span) = util::extract_grid_props(child);
                    let grid_val = format!("{} / span {}", start, span);

                    child
                        .inline_style
                        .get_or_insert_with(Default::default)
                        .insert("grid-row".to_string(), json!(grid_val));
                }
            }
        }

        NodeType::Background => {
            let style = ast_node.inline_style.get_or_insert_default();
            style.insert("width".to_string(), json!("100%"));
            style.insert("height".to_string(), json!("100%"));
        }

        NodeType::GameShelf => {
            // 先提取出原始的数字值（注意：这里要先拿出来，因为后面要改 props）
            let basis_num = ast_node
                .props
                .as_ref()
                .and_then(|p| p.get("basis"))
                .and_then(|v| v.as_u64())
                .unwrap_or(7); // 默认一行显示 7 个

            // 将数字转换为 Tailwind 格式的字符串
            let sm_basis_tailwind = format!("sm:basis-1/{}", basis_num);

            // 获取 props 的可变引用并修改内部的值
            if let Some(props_map) = ast_node.props.get_or_insert_default().as_object_mut() {
                // 直接覆盖原来的 "basis" 字段
                props_map.insert("basis".to_string(), serde_json::json!(sm_basis_tailwind));
            } else {
                // 如果 props 为空或不是对象，初始化并插入
                let mut new_map = serde_json::Map::new();
                new_map.insert("basis".to_string(), serde_json::json!(sm_basis_tailwind));
                ast_node.props = Some(serde_json::Value::Object(new_map));
            }
        }
        _ => {}
    }
}
