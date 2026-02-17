use crate::schema::ast::AstNode;

// --- 辅助函数：从 props 中安全提取 start 和 span ---
pub fn extract_grid_props(node: &AstNode) -> (i64, i64) {
    let start = get_prop_as_i64(node, "start").unwrap();
    let span = get_prop_as_i64(node, "span").unwrap();
    (start, span)
}

// --- 辅助函数：获取 i64 类型的 prop ---
pub fn get_prop_as_i64(node: &AstNode, key: &str) -> Option<i64> {
    node.props
        .as_ref()
        .and_then(|p| p.as_object())
        .and_then(|obj| obj.get(key))
        .and_then(|v| v.as_i64())
}
