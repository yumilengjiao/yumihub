use std::path::{Path, PathBuf};

use crate::{
    error::AppError,
    game::entity::ArchiveEntry,
    infra::archive::{extract_rar, extract_zip, list_rar, list_zip},
};

#[tauri::command]
pub async fn get_archive_list(path: String) -> Result<Vec<ArchiveEntry>, AppError> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(AppError::Resolve(path, "文件不存在".into()));
    }
    match p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase().as_str() {
        "zip" => list_zip(&path),
        "rar" => list_rar(&path),
        _ => Err(AppError::Fs("不支持的压缩格式".into())),
    }
}

#[tauri::command]
pub async fn extract_archive(
    archive_path: String,
    dest_path: Option<String>,
) -> Result<String, AppError> {
    let src = PathBuf::from(&archive_path);
    if !src.exists() {
        return Err(AppError::Fs(format!("源文件不存在: {}", archive_path)));
    }
    let dst = dest_path
        .map(PathBuf::from)
        .unwrap_or_else(|| { let mut d = src.clone(); d.set_extension(""); d });

    let result = match src.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase().as_str() {
        "zip" => extract_zip(&src, &dst),
        "rar" => extract_rar(&src, &dst),
        _ => return Err(AppError::Fs("不支持的压缩格式".into())),
    }?;

    Ok(result.to_string_lossy().to_string())
}
