//! 压缩包基础工具（ZIP / RAR）
//!
//! 此模块只做 IO，不含任何业务逻辑，可被任何上层模块调用。

use std::{
    fs::File,
    io::{Read, Write},
    path::{Path, PathBuf},
};

use unrar::Archive as RarArchive;
use walkdir::WalkDir;
use zip::{write::FileOptions, ZipArchive, ZipWriter};

use crate::error::AppError;

// ── 公开数据类型 ─────────────────────────────────────────────────────────────

/// 压缩包内单个条目的元数据（不解压）
#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveEntry {
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub encrypted: bool,
}

// ── 读取（不解压）────────────────────────────────────────────────────────────

/// 列出 ZIP 内所有条目的元数据
pub fn list_zip(path: &str) -> Result<Vec<ArchiveEntry>, AppError> {
    let file = File::open(path)?;
    let mut archive = ZipArchive::new(file).map_err(|e| AppError::Fs(e.to_string()))?;
    let entries = (0..archive.len())
        .map(|i| {
            archive.by_index(i).map(|f| ArchiveEntry {
                name: f.name().to_string(),
                size: f.size(),
                is_dir: f.is_dir(),
                encrypted: f.encrypted(),
            })
        })
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Fs(e.to_string()))?;
    Ok(entries)
}

/// 列出 RAR 内所有条目的元数据
pub fn list_rar(path: &str) -> Result<Vec<ArchiveEntry>, AppError> {
    let archive = RarArchive::new(path)
        .open_for_listing()
        .map_err(|e| AppError::Fs(format!("无法打开 RAR 文件: {:?}", e)))?;

    archive
        .map(|entry| {
            entry
                .map(|h| ArchiveEntry {
                    name: h.filename.to_string_lossy().into_owned(),
                    size: h.unpacked_size,
                    is_dir: h.is_directory(),
                    encrypted: h.is_encrypted(),
                })
                .map_err(|e| AppError::Fs(format!("读取 RAR 头部出错: {:?}", e)))
        })
        .collect()
}

// ── 解压 ──────────────────────────────────────────────────────────────────────

/// 解压 ZIP 到目标目录，返回解压后的第一级根目录路径
pub fn extract_zip(zip_path: &Path, extract_to: &Path) -> Result<PathBuf, AppError> {
    let file = File::open(zip_path)?;
    let mut archive = ZipArchive::new(file).map_err(|e| AppError::Fs(e.to_string()))?;

    std::fs::create_dir_all(extract_to)?;

    let mut first_dir: Option<String> = None;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| AppError::Fs(e.to_string()))?;
        let enclosed = match file.enclosed_name() {
            Some(p) => p.to_owned(),
            None => continue,
        };

        if first_dir.is_none() {
            if let Some(comp) = enclosed.components().next() {
                first_dir = Some(comp.as_os_str().to_string_lossy().into_owned());
            }
        }

        let out = extract_to.join(&enclosed);
        if file.name().ends_with('/') {
            std::fs::create_dir_all(&out)?;
        } else {
            if let Some(p) = out.parent() {
                std::fs::create_dir_all(p)?;
            }
            let mut outfile = File::create(&out)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }

    Ok(match first_dir {
        Some(d) => extract_to.join(d),
        None => extract_to.to_path_buf(),
    })
}

/// 解压 RAR 到目标目录，返回解压后的第一级根目录路径
pub fn extract_rar(rar_path: &Path, extract_to: &Path) -> Result<PathBuf, AppError> {
    std::fs::create_dir_all(extract_to)?;

    let mut archive = RarArchive::new(rar_path)
        .open_for_processing()
        .map_err(|e| AppError::Fs(format!("打开 RAR 失败: {:?}", e)))?;

    let mut first_dir: Option<String> = None;

    while let Some(header) = archive
        .read_header()
        .map_err(|e| AppError::Fs(e.to_string()))?
    {
        let filename = header.entry().filename.clone();
        if first_dir.is_none() {
            if let Some(comp) = filename.components().next() {
                first_dir = Some(comp.as_os_str().to_string_lossy().into_owned());
            }
        }
        archive = header
            .extract_with_base(extract_to)
            .map_err(|e| AppError::Fs(format!("解压失败: {:?} ({})", filename, e)))?;
    }

    Ok(match first_dir {
        Some(d) => extract_to.join(d),
        None => extract_to.to_path_buf(),
    })
}

// ── 打包 ──────────────────────────────────────────────────────────────────────

/// 将目录打包成 ZIP 文件
/// 安全检查：内容小于 1 KB 时拒绝，避免覆盖旧备份
pub fn zip_dir(src: &Path, dst: &Path) -> Result<(), AppError> {
    // 大小安全检查
    let total: u64 = WalkDir::new(src)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum();

    if total <= 1024 {
        return Err(AppError::Fs(format!(
            "存档内容过小 ({:.2} KB)，已拦截备份以保护旧数据",
            total as f64 / 1024.0
        )));
    }

    let file = File::create(dst)?;
    let mut zip = ZipWriter::new(file);
    let opts: FileOptions<()> =
        FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(src).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = path
            .strip_prefix(src)
            .map_err(|e| AppError::Fs(e.to_string()))?;

        if path.is_file() {
            zip.start_file(name.to_string_lossy(), opts)
                .map_err(|e| AppError::Fs(e.to_string()))?;
            let mut buf = Vec::new();
            File::open(path)?.read_to_end(&mut buf)?;
            zip.write_all(&buf)?;
        } else if !name.as_os_str().is_empty() {
            zip.add_directory(name.to_string_lossy(), opts)
                .map_err(|e| AppError::Fs(e.to_string()))?;
        }
    }

    zip.finish().map_err(|e| AppError::Fs(e.to_string()))?;
    Ok(())
}
