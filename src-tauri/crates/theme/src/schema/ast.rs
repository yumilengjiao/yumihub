use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// 一个theme.json文件对应的配置结构体
///
/// * `config`: 配置文件元信息
/// * `layout`: 布局信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AstThemeConfig {
    pub config: AstMetaConfig,
    pub layout: AstLayout,
}

/// 配置文件元信息
///
/// * `version`: 协议版本
/// * `theme_name`: 主题名称
/// * `variables`: css变量
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AstMetaConfig {
    pub version: String,
    pub theme_name: String,
    pub variables: Option<HashMap<String, String>>,
}

/// 布局配置信息
///
/// * `global`: 全局组件的根节点
/// * `pages`: 各个路由界面的节点树配置项
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AstLayout {
    pub global: Option<AstNode>,
    pub pages: HashMap<String, AstPageConfig>,
}

/// 每个路由界面的配置信息
///
/// * `name`: 一级路由名称
/// * `content`: 路由内容(AstNode,节点树)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AstPageConfig {
    pub name: String,
    pub content: AstNode,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum NodeType {
    Node,
    Row,
    Col,
    Component,
}

impl From<&str> for NodeType {
    fn from(s: &str) -> Self {
        match s {
            "row" => NodeType::Row,
            "col" => NodeType::Col,
            "component" => NodeType::Component,
            _ => NodeType::Node,
        }
    }
}

/// 节点,所有元素都是AstNode
///
/// * `id`: 节点标识,作为react组件的key,如果没有在配置文件里面写默认用树路径
/// * `nt`: 节点类型(node_type)，判定是Container还是Component
/// * `style`: 节点的taiwind属性
/// * `props`: 节点的参数
/// * `children`: [容器]--子Node
/// * `actions`: 可以触发的事件
/// * `hooks`: 给组件注入需要的数据,相当于一个任务,前端看到任务会注入相对应的数据
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AstNode {
    pub id: Option<u32>,
    pub nt: Option<NodeType>,
    pub style: Option<Vec<String>>, // 这里写的是taiwind的类
    pub props: Option<Value>,
    pub children: Option<Vec<AstNode>>,
    pub consume: Option<Vec<String>>,
    pub actions: Option<HashMap<String, Action>>,
    pub hooks: Option<Vec<String>>,
}

/// 事件
///
/// * `command`: 事件名称
/// * `params`:  传递给命令的参数
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Action {
    pub command: String,
    pub params: Option<Value>,
}
