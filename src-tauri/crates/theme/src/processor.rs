use std::collections::HashMap;

use crate::entity::Node;

pub trait Processor {
    fn process(&self, node: &mut Node, parent_type: &str);
}

pub struct ConsumeProcessor {
    pub mapping: HashMap<String, String>,
}

impl ConsumeProcessor {
    pub fn new(mapping: HashMap<String, String>) -> Self {
        Self { mapping }
    }
}

impl Processor for ConsumeProcessor {
    fn process(&self, node: &mut Node, _parent_type: &str) {}
}

pub struct SpanProcessor {}

impl SpanProcessor {
    pub fn new() -> Self {
        Self {}
    }
}

impl Processor for SpanProcessor {
    fn process(&self, node: &mut Node, parent_type: &str) {}
}
