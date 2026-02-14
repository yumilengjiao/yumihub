//! AST处理的第一阶段
//! 此模块用于抽象语法树的常规化处理，即补全一些默认需要的属性

use serde_json::json;

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig, NodeType},
        ctx::ThemeContext,
    },
    transform::{LogicStep, walk_node},
};

/// 对抽象语法树进行常规化处理,补全缺失信息
///
/// * `ast`: 主题配置的抽象语法树
/// * `ctx`: 上下文信息
pub fn run(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    let logic_steps: &[LogicStep] = &[fill_id, fill_props];
    // global节点的遍历处理
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, logic_steps);
    };

    // 不同路由页面的遍历处理
    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, logic_steps);
    }
}

// 填充id
fn fill_id(node: &mut AstNode, ctx: &mut ThemeContext) {
    if node.id.is_none() {
        node.id = Some(ctx.id_idx);
        ctx.id_idx += 1;
    }
}

// 填充span
fn fill_props(node: &mut AstNode, _ctx: &mut ThemeContext) {
    let props = node.props.get_or_insert(json!({}));
    let Some(obj) = props.as_object_mut() else {
        return;
    };

    let nt = node.nt.get_or_insert(NodeType::Node);

    match nt {
        NodeType::Row => {
            // 获取总列数
            let total_cols = obj
                .entry("cols")
                .or_insert(json!(20))
                .as_i64()
                .unwrap_or(20);

            if node.children.is_none() {
                return;
            }
            let children = node.children.as_mut().unwrap();

            // =====================================================
            // 第一步：确定所有节点的 start (推算水位线)
            // =====================================================
            let mut current_waterline = 1;

            for child in children.iter_mut() {
                let p = child
                    .props
                    .get_or_insert(json!({}))
                    .as_object_mut()
                    .unwrap();

                // 补全 start: 只有在没写的时候才插入
                if let Some(st) = p.get("start").and_then(|v| v.as_i64()) {
                    current_waterline = st;
                } else {
                    p.insert("start".to_string(), json!(current_waterline));
                }

                // 更新下一位的参考水位线:
                // 如果用户写了 span，水位线直接跳过这段 span；
                // 如果没写 span，我们先假设它至少占 1 格，给下一个组件留个起步位
                if let Some(sp) = p.get("span").and_then(|v| v.as_i64()) {
                    current_waterline += sp;
                } else {
                    current_waterline += 1;
                }
            }

            // =====================================================
            // 第二步：根据补全后的 start 重新排序 (确保计算 end_point 的逻辑是有序的)
            // =====================================================
            children.sort_by_key(|c| {
                c.props
                    .as_ref()
                    .and_then(|p| p.get("start"))
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0)
            });

            // =====================================================
            // 第三步：计算每一个没有 span 的节点的跨度 (吃到下一个 start)
            // =====================================================
            let count = children.len();
            for i in 0..count {
                // 注意：这里需要再次检查 props 是否存在，因为我们要修改它
                let current_start = children[i]
                    .props
                    .as_ref()
                    .unwrap()
                    .get("start")
                    .unwrap()
                    .as_i64()
                    .unwrap();

                // 如果当前节点已经有了 span (不管是配置带的还是第一步带的)，就跳过计算
                // 这样就不会把用户写的 span: 2 覆盖成 1 了
                if children[i].props.as_ref().unwrap().get("span").is_some() {
                    continue;
                }

                // 寻找下一个边界
                let end_point = if i + 1 < count {
                    // 下一个节点的 start 是当前节点的物理边界
                    children[i + 1]
                        .props
                        .as_ref()
                        .unwrap()
                        .get("start")
                        .unwrap()
                        .as_i64()
                        .unwrap()
                } else {
                    // 最后一个节点直接吃到容器边缘 (total_cols + 1)
                    total_cols + 1
                };

                let computed_span = (end_point - current_start).max(1);

                // 补全缺失的 span
                let p = children[i].props.as_mut().unwrap().as_object_mut().unwrap();
                p.insert("span".to_string(), json!(computed_span));
            }
        }
        NodeType::Col => {
            // 获取总行数
            let total_rows = obj
                .entry("rows")
                .or_insert(json!(20))
                .as_i64()
                .unwrap_or(20);

            if node.children.is_none() {
                return;
            }
            let children = node.children.as_mut().unwrap();

            // =====================================================
            // 第一步：确定所有节点的 start (推算水位线)
            // =====================================================
            let mut current_waterline = 1;

            for child in children.iter_mut() {
                let p = child
                    .props
                    .get_or_insert(json!({}))
                    .as_object_mut()
                    .unwrap();

                // 补全 start: 只有在没写的时候才插入
                if let Some(st) = p.get("start").and_then(|v| v.as_i64()) {
                    current_waterline = st;
                } else {
                    p.insert("start".to_string(), json!(current_waterline));
                }

                // 更新下一位的参考水位线:
                // 如果用户写了 span，水位线直接跳过这段 span；
                // 如果没写 span，我们先假设它至少占 1 格，给下一个组件留个起步位
                if let Some(sp) = p.get("span").and_then(|v| v.as_i64()) {
                    current_waterline += sp;
                } else {
                    current_waterline += 1;
                }
            }

            // =====================================================
            // 第二步：根据补全后的 start 重新排序 (确保计算 end_point 的逻辑是有序的)
            // =====================================================
            children.sort_by_key(|c| {
                c.props
                    .as_ref()
                    .and_then(|p| p.get("start"))
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0)
            });

            // =====================================================
            // 第三步：计算每一个没有 span 的节点的跨度 (吃到下一个 start)
            // =====================================================
            let count = children.len();
            for i in 0..count {
                // 注意：这里需要再次检查 props 是否存在，因为我们要修改它
                let current_start = children[i]
                    .props
                    .as_ref()
                    .unwrap()
                    .get("start")
                    .unwrap()
                    .as_i64()
                    .unwrap();

                // 如果当前节点已经有了 span (不管是配置带的还是第一步带的)，就跳过计算
                // 这样就不会把用户写的 span: 2 覆盖成 1 了
                if children[i].props.as_ref().unwrap().get("span").is_some() {
                    continue;
                }

                // 寻找下一个边界
                let end_point = if i + 1 < count {
                    // 下一个节点的 start 是当前节点的物理边界
                    children[i + 1]
                        .props
                        .as_ref()
                        .unwrap()
                        .get("start")
                        .unwrap()
                        .as_i64()
                        .unwrap()
                } else {
                    // 最后一个节点直接吃到容器边缘 (total_rows + 1)
                    total_rows + 1
                };

                let computed_span = (end_point - current_start).max(1);

                // 补全缺失的 span
                let p = children[i].props.as_mut().unwrap().as_object_mut().unwrap();
                p.insert("span".to_string(), json!(computed_span));
            }
        }
        _ => {}
    }
}
