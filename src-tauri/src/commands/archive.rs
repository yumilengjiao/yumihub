//! 压缩包相关命令

use std::path::{Path, PathBuf};

use crate::{
    error::AppError,
    game::entity::ArchiveEntry,
    util::{extract_rar_sync, extract_zip_sync, parse_rar, parse_zip},
};

/// 提取压缩包内所有文件的元数据信息
#[tauri::command]
pub async fn get_archive_list(path: String) -> Result<Vec<ArchiveEntry>, AppError> {
    let path_buf = Path::new(&path);

    if !path_buf.exists() {
        return Err(AppError::Resolve(
            path_buf.to_string_lossy().to_string(),
            "文件路径不存在".to_string(),
        ));
    }

    let extension = path_buf
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "zip" => parse_zip(&path),
        "rar" => parse_rar(&path),
        _ => Err(AppError::File("暂不支持该压缩格式".to_string())),
    }
}

/// 解压压缩包到指定目录，返回解压后的根目录路径
#[tauri::command]
pub async fn extract_archive(
    archive_path: String,
    dest_path: Option<String>,
) -> Result<String, AppError> {
    let src = PathBuf::from(&archive_path);

    if !src.exists() {
        return Err(AppError::File(format!("源文件不存在: {}", archive_path)));
    }

    // 未传目标路径时，默认解压到压缩包同名目录
    let final_dest = match dest_path {
        Some(d) => PathBuf::from(d),
        None => {
            let mut d = src.clone();
            d.set_extension("");
            d
        }
    };

    let ext = src
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    let parent_dir = match ext.as_str() {
        "zip" => extract_zip_sync(&src, &final_dest).map_err(|e| AppError::File(e.to_string()))?,
        "rar" => extract_rar_sync(&src, &final_dest)?,
        _ => return Err(AppError::Generic("不支持的压缩格式".to_string())),
    };

    Ok(parent_dir)
}
