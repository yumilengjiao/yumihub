use serde_json::json;

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig, NodeType},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

// 各种normalize阶段处理函数
pub type LogicStep = fn(&mut AstNode, &mut ThemeContext);

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
            // 获取父容器的总容量 (默认 12 栅格)
            // 这里假设 rows 代表“总列数/总格数”
            let total_capacity = obj
                .entry("cols")
                .or_insert(json!(12)) // 默认是 12 格
                .as_u64()
                .unwrap_or(12) as i64;

            // 如果没有孩子，直接返回
            if node.children.is_none() {
                return;
            }
            let children = node.children.as_mut().unwrap();

            // =====================================================
            // 第一轮：统计已占用的空间 和 需要自动填充的子节点数量
            // =====================================================
            let mut used_span = 0;
            let mut unset_count = 0;

            for child in children.iter() {
                // 读取一下孩子的 props
                if let Some(child_props) = child.props.as_ref().and_then(|p| p.as_object()) {
                    if let Some(span) = child_props.get("span").and_then(|v| v.as_i64()) {
                        used_span += span;
                    } else {
                        unset_count += 1;
                    }
                } else {
                    unset_count += 1; // props 都没有，肯定没 span
                }
            }

            // =====================================================
            // 计算逻辑
            // =====================================================
            let remaining_span = total_capacity - used_span;

            // 情况 A: 空间已经爆了，或者刚好用完
            if remaining_span <= 0 {
                println!("无空间分配");
            }
            // 情况 B: 有剩余空间，且有孩子需要分配
            else if unset_count > 0 {
                let per_child = remaining_span / unset_count; // 整数除法
                let mut remainder = remaining_span % unset_count; // 余数，处理除不尽的情况

                // =====================================================
                // 第二轮：填补空缺
                // =====================================================
                for child in children.iter_mut() {
                    let child_props = child.props.get_or_insert(json!({}));

                    // 只有当没有 "span" 字段时才插入
                    if child_props.get("span").is_none() {
                        // 基础分配量
                        let mut my_span = per_child;

                        // 如果有余数（比如剩 5 格给 2 人分，第一人拿 3，第二人拿 2）
                        if remainder > 0 {
                            my_span += 1;
                            remainder -= 1;
                        }

                        // 写入 JSON
                        if let Some(p_obj) = child_props.as_object_mut() {
                            p_obj.insert("span".to_string(), json!(my_span));
                        }
                    }
                }
            }
        }
        NodeType::Col => {
            // 获取父容器的总容量 (默认 12 栅格)
            // 这里假设 rows 代表“总列数/总格数”
            let total_capacity = obj
                .entry("rows")
                .or_insert(json!(12)) // 默认是 12 格
                .as_u64()
                .unwrap_or(12) as i64;

            // 如果没有孩子，直接返回
            if node.children.is_none() {
                return;
            }
            let children = node.children.as_mut().unwrap();

            // =====================================================
            // 第一轮：统计已占用的空间 和 需要自动填充的子节点数量
            // =====================================================
            let mut used_span = 0;
            let mut unset_count = 0;

            for child in children.iter() {
                // 读取一下孩子的 props
                if let Some(child_props) = child.props.as_ref().and_then(|p| p.as_object()) {
                    if let Some(span) = child_props.get("span").and_then(|v| v.as_i64()) {
                        used_span += span;
                    } else {
                        unset_count += 1;
                    }
                } else {
                    unset_count += 1; // props 都没有，肯定没 span
                }
            }

            // =====================================================
            // 计算逻辑
            // =====================================================
            let remaining_span = total_capacity - used_span;

            // 情况 A: 空间已经爆了，或者刚好用完
            if remaining_span <= 0 {
                println!("无空间分配");
            }
            // 情况 B: 有剩余空间，且有孩子需要分配
            else if unset_count > 0 {
                let per_child = remaining_span / unset_count; // 整数除法
                let mut remainder = remaining_span % unset_count; // 余数，处理除不尽的情况

                // =====================================================
                // 第二轮：填补空缺
                // =====================================================
                for child in children.iter_mut() {
                    let child_props = child.props.get_or_insert(json!({}));

                    // 只有当没有 "span" 字段时才插入
                    if child_props.get("span").is_none() {
                        // 基础分配量
                        let mut my_span = per_child;

                        // 如果有余数（比如剩 5 格给 2 人分，第一人拿 3，第二人拿 2）
                        if remainder > 0 {
                            my_span += 1;
                            remainder -= 1;
                        }

                        // 写入 JSON
                        if let Some(p_obj) = child_props.as_object_mut() {
                            p_obj.insert("span".to_string(), json!(my_span));
                        }
                    }
                }
            }
        }
        _ => {}
    }
}
