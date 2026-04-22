/**
 * 支持的后端调用命令枚举
 */
export enum Cmds {
  // 用户
  GET_USER_INFO = "get_user_info",
  UPDATE_USER_INFO = "update_user_info",

  // 游戏
  GET_GAME_META = "get_game_meta_by_id",
  GET_GAME_META_LIST = "get_game_meta_list",
  DELETE_GAME_BY_ID = "delete_game_by_id",
  DELETE_ALL_GAMES = "delete_all_games",
  UPDATE_GAME = "update_game",
  ADD_NEW_GAME = "add_new_game",
  ADD_NEW_GAME_LIST = "add_new_game_list",
  START_GAME = "start_game",
  GET_SESSIONS = "get_sessions",
  GET_SESSIONS_BY_YEAR = "get_sessions_by_year",

  // 压缩包
  GET_ARCHIVE_LIST = "get_archive_list",
  EXTRACT_ARCHIVE = "extract_archive",

  // 配置
  GET_CONFIG = "get_config",
  UPDATE_CONFIG = "update_config",

  // 截图
  GET_SCREENSHOTS_BY_YEAR_MONTH = "get_screenshots_by_year_month",
  UPDATE_SCREENSHOT_BY_ID = "update_screenshot_by_id",
  DELETE_SCREENSHOT_BY_ID = "delete_screenshot_by_id",

  // 备份
  BACKUP_ARCHIVE = "backup_archive",
  BACKUP_ARCHIVE_BY_ID = "backup_archive_by_id",
  RESTORE_ALL_ARCHIVES = "restore_all_archives",
  RESTORE_ARCHIVE_BY_ID = "restore_archive_by_id",

  // 快捷键
  GET_SHORTCUTS = "get_shortcuts",
  UPDATE_SHORTCUTS = "update_shortcuts",

  // 收藏夹
  GET_COLLECTIONS = "get_collections",
  GET_COLLECTION_GAME_IDS = "get_collection_game_ids",
  CREATE_COLLECTION = "create_collection",
  DELETE_COLLECTION = "delete_collection",
  RENAME_COLLECTION = "rename_collection",
  ADD_GAME_TO_COLLECTION = "add_game_to_collection",
  REMOVE_GAME_FROM_COLLECTION = "remove_game_from_collection",

  // 系统工具
  GET_START_UP_PATH = "get_start_up_path",
  GET_SYSTEM_FONTS = "get_system_fonts",
  GET_GAME_SIZE = "get_game_size",
  GET_DISKS = "get_disks",
  GET_DISK_USAGE = "get_disk_usage",
  GET_LOG_DIR = "get_log_dir",
  AUTHORIZE_PATH_ACCESS = "authorize_path_access",
  GET_COMPANIONS = "get_companions",
  UPDATE_COMPANIONS = "update_companions",
  CLEAR_APP_DATA = "clear_app_data",
  GET_THEMES = "get_theme",
  GET_ALL_THEME_NAMES = "get_all_theme_names",
  GET_DEFAULT_THEME_UPDATED = "get_default_theme_updated",
  GET_NON_DEFAULT_THEME_OUTDATED = "get_non_default_theme_outdated",
}
