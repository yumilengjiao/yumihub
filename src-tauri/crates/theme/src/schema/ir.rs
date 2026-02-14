use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use crate::schema::ast::{AstNode, AstPageConfig, AstThemeConfig};

/// 一个theme.json文件对应的配置结构体
///
/// * `config`: 配置文件元信息
/// * `layout`: 布局信息
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ThemeIr {
    pub config: MetaConfig,
    pub layout: Layout,
}

impl From<AstThemeConfig> for ThemeIr {
    fn from(ast: AstThemeConfig) -> Self {
        Self {
            config: MetaConfig {
                version: ast.config.version,
                theme_name: ast.config.theme_name,
            },
            layout: Layout {
                // 如果 global 是 None，我们给它一个默认的空 Node
                global: ast.layout.global.map(Node::from).unwrap_or_default(),
                pages: ast
                    .layout
                    .pages
                    .into_iter()
                    .map(|(k, v)| (k, PageConfig::from(v)))
                    .collect(),
            },
        }
    }
}

/// 配置文件元信息
///
/// * `version`: 协议版本
/// * `theme_name`: 主题名称
/// * `variables`: css变量
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MetaConfig {
    pub version: String,
    pub theme_name: String,
}

/// 布局配置信息
///
/// * `global`: 全局组件的节点树
/// * `pages`: 各个路由界面的节点树
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Layout {
    pub global: Node,
    pub pages: HashMap<String, PageConfig>,
}

/// 每个路由界面的配置信息
///
/// * `name`: 一级路由名称
/// * `content`: 路由内容(AstNode,节点树)
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct PageConfig {
    pub name: String,
    pub content: Node,
}

impl From<AstPageConfig> for PageConfig {
    fn from(ast: AstPageConfig) -> Self {
        Self {
            name: ast.name,
            content: Node::from(ast.content),
        }
    }
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

/// 节点,所有元素都是AstNode
///
/// * `id`: 节点标识,作为react组件的key,如果没有在配置文件里面写默认用树路径
/// * `node_type`: 节点类型，判定是Container还是Component
/// * `style`: 节点的style属性
/// * `props`: 节点的参数
/// * `children`: [容器]--子Node
/// * `actions`: 可以触发的事件
/// * `hooks`: 给组件注入需要的数据,相当于一个任务,前端看到任务会注入相对应的数据
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Node {
    pub id: u32,
    pub node_type: String,
    pub class_name: String,
    pub style: HashMap<String, Value>, // 这里写的是taiwind的类
    pub children: Option<Vec<Node>>,
    pub actions: Option<HashMap<String, Action>>,
    pub hooks: Option<Vec<String>>,
}

impl From<AstNode> for Node {
    fn from(ast: AstNode) -> Self {
        // 处理 ID: u32 -> String (如果不存在则给个占位符)
        let id = ast.id.unwrap();

        // 处理 NodeType: Option<NodeType> -> String
        let node_type = match ast.nt {
            Some(nt) => format!("{:?}", nt).to_lowercase(),
            None => "node".to_string(),
        };

        // 处理 class_list (对应 AST 的 class_list)
        let class_name = ast.class_list.unwrap_or_default().join(" ");

        // 处理 Style (对应 AST 的 inline_style)
        let style = ast.inline_style.unwrap_or_default();

        // 递归处理 Children
        let children = ast
            .children
            .map(|children_vec| children_vec.into_iter().map(Node::from).collect());

        // 转移 Action 和 Hook (完全匹配，直接 map 即可)
        let actions = ast.actions.map(|a| {
            a.into_iter()
                .map(|(k, v)| {
                    (
                        k,
                        Action {
                            command: v.command,
                            params: v.params,
                        },
                    )
                })
                .collect()
        });

        Node {
            id,
            node_type,
            class_name,
            style,
            children,
            actions,
            hooks: ast.hooks,
        }
    }
}
