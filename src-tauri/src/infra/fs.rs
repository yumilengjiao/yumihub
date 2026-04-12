//! 文件系统通用工具

use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::error::AppError;

/// 递归复制目录（异步）
pub async fn copy_dir(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> Result<(), AppError> {
    let src = src.as_ref();
    let dst = dst.as_ref();

    tokio::fs::create_dir_all(dst).await?;

    let mut entries = tokio::fs::read_dir(src).await?;
    while let Some(entry) = entries.next_entry().await? {
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if entry.file_type().await?.is_dir() {
            Box::pin(copy_dir(src_path, dst_path)).await?;
        } else {
            tokio::fs::copy(&src_path, &dst_path).await?;
        }
    }
    Ok(())
}

/// 计算目录总大小（字节）
pub fn dir_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}

/// 在父目录中推断游戏主启动程序路径
///
/// 规则：
/// 1. 只看当前目录（不递归），找所有 `.exe`
/// 2. 过滤掉 `uninst` / `crashpad` 等非主程序
/// 3. 优先选名字含 `game` 或与文件夹同名的 exe；否则取第一个
pub fn detect_game_exe(parent_path: &str) -> Result<String, AppError> {
    let root = Path::new(parent_path);
    if !root.is_dir() {
        return Err(AppError::Resolve(
            parent_path.to_string(),
            "路径不存在".into(),
        ));
    }

    let folder_name = root
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase();

    let exes: Vec<PathBuf> = std::fs::read_dir(root)
        .map_err(|e| AppError::Resolve(parent_path.to_string(), e.to_string()))?
        .flatten()
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.extension()
                    .map(|ext| ext.eq_ignore_ascii_case("exe"))
                    .unwrap_or(false)
        })
        .filter(|p| {
            let name = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
            !name.contains("uninst") && !name.contains("crashpad")
        })
        .collect();

    if exes.is_empty() {
        return Err(AppError::Resolve(
            parent_path.to_string(),
            "未找到游戏启动程序".into(),
        ));
    }

    let best = exes
        .iter()
        .find(|p| {
            let name = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
            name.contains("game") || name.contains(&folder_name)
        })
        .unwrap_or(&exes[0]);

    Ok(best.to_string_lossy().replace('\\', "/"))
}
