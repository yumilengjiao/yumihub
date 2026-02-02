/**
 * @module 此模块封装了项目中可能使用到的枚举常量值
 */


/**
 * 支持的调用后端的指令
 */
export enum Cmds {
  /**
   * 获得用户信息
   */
  GET_USER_INFO = "get_user_info",

  /**
   * 更新用户信息
   */
  SET_USER_INFO = "set_user_info",

  /**
   * 获取单个游戏元数据
   */
  GET_GAME_META = "get_game_meta_by_id",

  /**
   * 获取所有游戏元数据
   */
  GET_GAME_META_LIST = "get_game_meta_list",

  /**
   * 删除单个游戏信息
   */
  DELETE_GAME_BY_ID = "delete_game_by_id",

  /**
   * 更新后端游戏信息
   */
  UPDATE_GAME = "update_game",

  /**
   * 添加一个新的游戏到库
   */
  ADD_NEW_GAME = "add_new_game",

  /**
   * 添加批量游戏到库
   */
  ADD_NEW_GAME_LIST = "add_new_game_list",

  /**
   * 获取配置信息
   */
  GET_CONFIG = "get_config",

  /**
   * 更新配置信息
   */
  UPDATE_CONFIG = "update_config",

  /**
   * 备份游戏存档
   */
  BACKUP_ARCHIVE = "backup_archive",

  /**
   * 获取游戏启动路径
   */
  GET_START_UP_PATH = "get_start_up_path",

  /**
   * 获取系统的所有字体
   */
  GET_SYSTEM_FONTS = "get_system_fonts",

  /**
   * 获取游戏的存储大小
   */
  GET_GAME_SIZE = "get_game_size",

  /**
   * 获取操作系统上的挂载卷
   */
  GET_DISKS = "get_disks",

  /**
   * 获取指定磁盘的使用率
   */
  GET_DISK_USAGE = "get_disk_usage"
}

