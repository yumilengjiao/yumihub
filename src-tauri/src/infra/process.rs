//! 进程与窗口工具（仅 Windows）

/// 根据 PID 列表批量显示或隐藏窗口
#[cfg(target_os = "windows")]
pub fn toggle_windows_by_pids(pids: Vec<u32>, visible: bool) {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, ShowWindow, SW_HIDE, SW_SHOW,
    };

    struct Param {
        pids: Vec<u32>,
        show: windows::Win32::UI::WindowsAndMessaging::SHOW_WINDOW_CMD,
    }

    let param = Param {
        pids,
        show: if visible { SW_SHOW } else { SW_HIDE },
    };

    unsafe extern "system" fn callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let param = &*(lparam.0 as *const Param);
        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if param.pids.contains(&pid) {
            ShowWindow(hwnd, param.show);
        }
        BOOL::from(true)
    }

    unsafe {
        let _ = EnumWindows(Some(callback), LPARAM(&param as *const _ as isize));
    }
}

#[cfg(not(target_os = "windows"))]
pub fn toggle_windows_by_pids(_pids: Vec<u32>, _visible: bool) {}

/// 按进程名强制终止（跨平台）
pub fn kill_by_name(name: &str) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/IM", name, "/T"])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn();

    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("pkill")
        .args(["-9", "-x", name])
        .spawn();
}

/// 按 PID 强制终止进程
pub fn kill_by_pid(pid: u32) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/PID", &pid.to_string(), "/T"])
        .spawn();

    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("kill")
        .args(["-9", &pid.to_string()])
        .spawn();
}
