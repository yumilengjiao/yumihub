use serde::Serialize;

#[derive(Serialize, Clone, Copy)]
pub struct SystemStats {
    pub cpu_usage: f64,
    pub memory_usage: f64,
}
