use crate::companion::ACTIVE_PROCESSES;

/// 获取所有活跃的、且启用了“受窗口控制”的连携程序 PID
pub fn get_controlled_pids() -> Vec<u32> {
    let processes = ACTIVE_PROCESSES.lock().unwrap();
    processes
        .iter()
        .filter(|p| p.is_window_managed)
        .map(|p| p.child.id())
        .collect()
}

/// 获取所有连携程序的 PID (不管受不受控)
pub fn get_all_pids() -> Vec<u32> {
    let processes = ACTIVE_PROCESSES.lock().unwrap();
    processes.iter().map(|p| p.child.id()).collect()
}
