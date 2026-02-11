use crate::entity::ThemeConfig;
use crate::processor::Processor;

pub struct ThemeEngine {
    // 持有一组处理器
    processors: Vec<Box<dyn Processor>>,
}

impl ThemeEngine {
    /// 初始化：在这里配置好所有的处理器和映射表
    pub fn new() -> Self {
        Self { processors: vec![] }
    }

    pub fn with_processors(processors: Vec<Box<dyn Processor>>) -> Self {
        Self { processors }
    }

    pub fn add_processor(&mut self, processor: Box<dyn Processor>) {
        self.processors.push(processor);
    }

    /// 执行解析：传入 mutable 的 config，直接原地修改
    pub fn process(&self, config: &mut ThemeConfig) {
        if let Some(ref mut global) = config.layout.global {
            if let Some(ref mut widget) = global.widget {
                self.traverse(widget, None);
            }
        }

        // 2. 处理各个页面
        for page in config.layout.pages.values_mut() {
            for node in page.content.iter_mut() {
                self.traverse(node, None);
            }
        }
    }

    /// 内部递归遍历
    fn traverse(&self, node: &mut crate::entity::Node, parent_type: Option<&str>) {
        // 让每一个处理器都过一遍这个节点
        for p in &self.processors {
            p.process(node, parent_type);
        }

        // 递归子节点
        if let Some(ref mut children) = node.children {
            let current_type = Some(node.node_type.as_str());
            for child in children {
                self.traverse(child, current_type);
            }
        }
    }
}
