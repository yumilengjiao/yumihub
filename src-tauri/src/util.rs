//! 工具模块,用来写一些常用的工具

use std::fs;
use std::path::{Path, PathBuf};

use crate::error::AppError;

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

    // 3. 搜索最佳匹配逻辑
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
    // 如果你前端传的是绝对路径，这里返回的就是绝对路径
    // 如果你前端传的是相对路径，这里返回的就是相对路径
    Ok(best_match.to_string_lossy().replace("\\", "/"))
}
