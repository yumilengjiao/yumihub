//! sys模块,用于监视cpu，内存等使用情况

use std::time::Duration;

use sysinfo::System;
use tauri::{AppHandle, Emitter};

use crate::sys::entity::SystemStats;

mod entity;

/// sys模块初始化函数
///
/// * `app_handle`: app句柄
pub fn init(app_handle: &AppHandle) {
    let handle = app_handle.clone();
    std::thread::spawn(move || {
        let mut sys = System::new_all();
        loop {
            // 刷新系统信息
            sys.refresh_cpu_usage();
            sys.refresh_memory();

            // 计算数据
            let cpu_usage = sys.global_cpu_usage() as f64;
            let used_mem = sys.used_memory() as f64;
            let total_mem = sys.total_memory() as f64;
            let memory_usage = (used_mem / total_mem) * 100.0;

            // 推送事件到所有窗口
            // 事件名称为 "sys-monitor"，载荷为 SystemStats 结构体
            let _ = handle.emit(
                "sys-monitor",
                SystemStats {
                    cpu_usage,
                    memory_usage,
                },
            );

            // 设置轮询间隔（例如 2 秒）
            std::thread::sleep(Duration::from_secs(2));
        }
    });
}
