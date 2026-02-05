//! 工具模块,用来写一些常用的工具

use std::fs::{self, File};
use std::io::Read;
use std::io::Write;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;
use windows::core::BOOL;
use zip::write::FileOptions;
use zip::{ZipArchive, ZipWriter};

use windows::Win32::Foundation::{HWND, LPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowThreadProcessId, ShowWindow, SW_HIDE, SW_SHOW,
};

use crate::error::AppError;

/// 通过游戏的父目录(游戏目录),获取单个游戏的启动路径
///
/// * `parent_path`: 游戏文件目录
pub fn get_start_up_program(parent_path: String) -> Result<String, AppError> {
    // 将传入的字符串转为 Path 对象
    let root_path = Path::new(&parent_path);

    // 检查是否为有效目录
    if !root_path.is_dir() {
        return Err(AppError::Resolve(parent_path, "路径不存在".to_string()));
    }

    // 2. 读取目录（使用 flatten 直接过滤掉读取失败的项）
    let entries = fs::read_dir(root_path)
        .map_err(|e| AppError::Resolve(parent_path.clone(), e.to_string()))?;

    let mut exe_files: Vec<PathBuf> = Vec::new();

    for entry in entries.flatten() {
        let file_path = entry.path(); // 这里拿到的已经是 [parent_path] + [file_name] 的完整路径

        if file_path.is_file() {
            if let Some(extension) = file_path.extension() {
                // 使用之前说的忽略大小写比较
                if extension.eq_ignore_ascii_case("exe") {
                    let file_name = file_path
                        .file_name()
                        .unwrap()
                        .to_string_lossy()
                        .to_lowercase();

                    // 过滤掉卸载程序等干扰项
                    if !file_name.contains("uninst") && !file_name.contains("crashpad") {
                        exe_files.push(file_path);
                    }
                }
            }
        }
    }

    // 搜索最佳匹配逻辑
    if exe_files.is_empty() {
        return Err(AppError::Resolve(
            parent_path.clone(),
            "未找到游戏启动路径".to_string(),
        ));
    }

    // 尝试寻找包含 "game" 或者和文件夹同名的 exe
    let folder_name = root_path
        .file_name()
        .unwrap()
        .to_string_lossy()
        .to_lowercase();

    let best_match = exe_files
        .iter()
        .find(|p| {
            let name = p.file_name().unwrap().to_string_lossy().to_lowercase();
            name.contains("game") || name.contains(&folder_name)
        })
        .unwrap_or(&exe_files[0]); // 找不到最像的，就取第一个 exe

    // 将 PathBuf 转为字符串并统一斜杠
    // 如果前端传的是绝对路径，这里返回的就是绝对路径
    // 如果前端传的是相对路径，这里返回的就是相对路径
    Ok(best_match.to_string_lossy().replace("\\", "/"))
}

/// 把一个目录下的所有文件迁移到另一个目录下
///
/// * `src`: 原目录地址
/// * `dst`: 迁移目录地址
pub async fn copy_dir_recursive(
    src: impl AsRef<Path>,
    dst: impl AsRef<Path>,
) -> Result<(), AppError> {
    let src = src.as_ref();
    let dst = dst.as_ref();

    // 创建目标目录
    tokio::fs::create_dir_all(dst)
        .await
        .map_err(|e| AppError::File(format!("创建目录失败 {}: {}", dst.display(), e)))?;

    // 读取目录内容
    let mut entries = tokio::fs::read_dir(src)
        .await
        .map_err(|e| AppError::File(format!("读取目录失败 {}: {}", src.display(), e)))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| AppError::File(format!("遍历目录项失败: {}", e)))?
    {
        let file_type = entry
            .file_type()
            .await
            .map_err(|e| AppError::File(format!("获取文件类型失败: {}", e)))?;

        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if file_type.is_dir() {
            // 递归调用自身（注意：异步递归在某些编译器版本下可能需要 BoxFuture，
            // 但简单的异步递归通常没问题）
            Box::pin(copy_dir_recursive(src_path, dst_path)).await?;
        } else {
            // 异步文件复制
            tokio::fs::copy(&src_path, &dst_path).await.map_err(|e| {
                AppError::File(format!(
                    "复制文件失败 {:?} 到 {:?}: {}",
                    src_path, dst_path, e
                ))
            })?;
        }
    }

    Ok(())
}

/// 将一个目录打包成压缩包移动到另一个目录
/// 增加安全检查：如果目录总内容不大于 1KB，则拒绝备份
///
/// * `src`: 原目录地址
/// * `dst`: 目的目录地址
pub fn zip_directory_sync(src: &Path, dst: &Path) -> Result<(), Box<dyn std::error::Error>> {
    // 计算总大小检查
    let mut total_size = 0u64;
    for entry in WalkDir::new(src).into_iter().filter_map(|e| e.ok()) {
        if entry.path().is_file() {
            total_size += entry.metadata()?.len();
        }
    }

    if total_size <= 1024 {
        // 如果你觉得需要更详细的错误信息，可以自定义，这里先用字符串错误代替
        return Err(format!(
            "存档内容过小 ({:.2} KB)，可能是空文件夹或损坏，已拦截备份以保护旧数据。",
            total_size as f64 / 1024.0
        )
        .into());
    }

    // 打包逻辑
    let file = File::create(dst)?;
    let mut zip = ZipWriter::new(file);
    let options: FileOptions<()> =
        FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(src).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = path.strip_prefix(src)?;

        if path.is_file() {
            zip.start_file(name.to_string_lossy(), options)?;
            let mut f = File::open(path)?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer)?;
            zip.write_all(&buffer)?;
        } else if !name.as_os_str().is_empty() {
            zip.add_directory(name.to_string_lossy(), options)?;
        }
    }

    zip.finish()?;
    Ok(())
}

/// 辅助函数-解压一个压缩包并把里面的所有文件解压到另一个目录
///
/// * `zip_path`: 压缩包路径
/// * `extract_to`: 解压目的地
pub fn extract_zip_sync(
    zip_path: &Path,
    extract_to: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(zip_path)?;
    let mut archive = ZipArchive::new(file)?;

    // 如果目标目录不存在则创建，如果存在则可选清空（这里采取先删除后创建确保覆盖纯净）
    if extract_to.exists() {
        fs::remove_dir_all(extract_to)?;
    }
    fs::create_dir_all(extract_to)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => extract_to.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }
            let mut outfile = File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }
    Ok(())
}

/// 计算一个目录的大小
///
/// * `path`: 目录地址
pub fn get_dir_size<P: AsRef<Path>>(path: P) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file())
        .filter_map(|entry| entry.metadata().ok())
        .map(|meta| meta.len())
        .sum()
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------窗口工具相关--------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------

struct EnumParam {
    pids: Vec<u32>,
    show_cmd: windows::Win32::UI::WindowsAndMessaging::SHOW_WINDOW_CMD,
}

pub fn toggle_windows_by_pids(pids: Vec<u32>, visible: bool) {
    let show_cmd = if visible { SW_SHOW } else { SW_HIDE };

    // 把数据封装进结构体
    let param = EnumParam { pids, show_cmd };

    unsafe {
        let _ = EnumWindows(
            Some(enum_window_callback),
            LPARAM(&param as *const _ as isize), // 传结构体的指针
        );
    }
}

/// 根据进程 PID 列表切换窗口显示或隐藏
///
/// * `pids`: 所有要操作窗口的pid
/// * `visible`: 隐藏还是可见
// 定义一个结构体用来传递多个参数
unsafe extern "system" fn enum_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    // 还原结构体引用
    let param = &*(lparam.0 as *const EnumParam);

    let mut process_id = 0;
    GetWindowThreadProcessId(hwnd, Some(&mut process_id));

    if param.pids.contains(&process_id) {
        // 使用结构体里带进来的指令（SW_SHOW 或 SW_HIDE）
        ShowWindow(hwnd, param.show_cmd);
    }
    BOOL::from(true)
}
