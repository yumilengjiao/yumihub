use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// 一个theme.json文件对应的配置结构体
///
/// * `config`: 配置文件元信息
/// * `layout`: 布局信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ThemeConfig {
    pub config: MetaConfig,
    pub layout: Layout,
}

/// 配置文件元信息
///
/// * `version`: 协议版本
/// * `theme_name`: 主题名称
/// * `variables`: css变量
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetaConfig {
    pub version: String,
    pub theme_name: String,
    pub variables: Option<HashMap<String, String>>,
}

/// 布局配置信息
///
/// * `global`: 全局组件的节点树
/// * `pages`: 各个路由界面的节点树
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Layout {
    pub global: Option<GlobalLayout>,
    pub pages: HashMap<String, PageConfig>,
}

/// 全局组件的配置
///
/// * `widget`: Node,节点树
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalLayout {
    widget: Option<Node>,
}

/// 每个路由界面的配置信息
///
/// * `name`: 一级路由名称
/// * `content`: 路由内容(Node,节点树)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PageConfig {
    pub name: String,
    pub content: Vec<Node>,
}

/// 节点,所有元素都是Node
///
/// * `id`: 节点标识,作为react组件的key,如果没有在配置文件里面写默认用树路径
/// * `node_type`: 节点类型，判定是Container还是Component
/// * `style`: 节点的taiwind属性
/// * `props`: 节点的参数
/// * `children`: [容器]--子Node
/// * `actions`: 可以触发的事件
/// * `hooks`: 给组件注入需要的数据,相当于一个任务,前端看到任务会注入相对应的数据
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Node {
    pub id: Option<String>,
    pub node_type: String,
    pub style: Option<Vec<String>>, // 这里写的是taiwind的类
    pub props: Option<Value>,
    pub children: Option<Vec<Node>>,
    pub consume: Option<Vec<String>>,
    pub actions: Option<HashMap<String, Action>>,
    pub hooks: Option<Vec<String>>,
}

/// 事件
///
/// * `command`: 事件名称
/// * `params`:  传递给命令的参数
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    pub command: String,
    pub params: Option<Value>,
}
