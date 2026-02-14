//! AST处理的第二阶段，负责把定义的变量进行解析注入

use serde_json::Value;

use crate::{
    schema::{
        ast::{AstNode, AstThemeConfig},
        ctx::ThemeContext,
    },
    transform::walk_node,
};

/// 解析变量入口
///
/// * `ast`: 抽象语法树，即反序列化后的配置文件
/// * `ctx`: 上下文对象
pub fn resolve_variables(ast: &mut AstThemeConfig, ctx: &mut ThemeContext) {
    if let Some(global_node) = &mut ast.layout.global {
        walk_node(global_node, ctx, &[replace_variables]);
    };

    for v in &mut ast.layout.pages.values_mut() {
        walk_node(&mut v.content, ctx, &[replace_variables]);
    }
}

/// 节点访问者：由 walk_node 调用
pub fn replace_variables(node: &mut AstNode, ctx: &mut ThemeContext) {
    // 处理 class_list (强制转字符串)
    if let Some(class_list) = node.class_list.as_mut() {
        for class_item in class_list.iter_mut() {
            *class_item = replace_inline_tokens(class_item, ctx);
        }
    }

    // 处理 inline_style (保留原始数据类型)
    if let Some(style_map) = node.inline_style.as_mut() {
        // k 是属性名（如 "color"），v 是属性值（如 "$text"）
        for (_k, v) in style_map.iter_mut() {
            deep_resolve_value(v, ctx);
        }
    }

    // 处理 props (内部递归，保留原始类型)
    if let Some(props) = node.props.as_mut() {
        deep_resolve_value(props, ctx);
    }
}

/// 深度递归解析对象(HashMap)或数组的字段值中的变量进行注入
fn deep_resolve_value(v: &mut Value, ctx: &ThemeContext) {
    match v {
        Value::String(s) => {
            *v = resolve_smart_value(s, ctx);
        }

        Value::Object(obj) => {
            for (_, val) in obj.iter_mut() {
                deep_resolve_value(val, ctx);
            }
        }

        Value::Array(arr) => {
            for val in arr.iter_mut() {
                deep_resolve_value(val, ctx);
            }
        }
        _ => {}
    }
}

/// 智能解析器：决定返回原始 Value 类型还是 String 类型
fn resolve_smart_value(s: &str, ctx: &ThemeContext) -> Value {
    // 纯变量引用时，例如 "$width" -> 需要保留原始类型 (Number/Bool等)
    if s.starts_with('$') && !s.contains(' ') {
        let var_name = &s[1..];
        if let Some(actual) = ctx.variables.get(var_name) {
            return actual.clone();
        }
    }

    // 混合字符串时，例如 "1px solid $color" -> 必须是 String
    Value::String(replace_inline_tokens(s, ctx))
}

/// 字符串插值替换工具 (String -> String)
fn replace_inline_tokens(s: &str, ctx: &ThemeContext) -> String {
    if !s.contains('$') {
        return s.to_string();
    }

    let mut result = s.to_string();
    for (key, val) in &ctx.variables {
        let token = format!("${}", key);
        if result.contains(&token) {
            let replacement = match val {
                Value::String(sv) => sv.clone(),
                Value::Number(nv) => nv.to_string(),
                Value::Bool(bv) => bv.to_string(),
                _ => "".to_string(),
            };
            result = result.replace(&token, &replacement);
        }
    }
    result
}
