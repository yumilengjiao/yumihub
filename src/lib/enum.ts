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
  GET_GAME_META = "get_game_meta",

  /**
   * 获取所有游戏元数据
   */
  GET_GAME_META_LIST = "get_game_meta_list",

  /**
   * 更新后端游戏信息
   */
  UPDATE_GAME_META = "update_game_meta",

  /**
   * 覆盖更新后端所有游戏列表信息
   */
  UPDATE_GAME_META_LIST = "update_game_meta_list",

  /**
   * 添加一个新的游戏到库
   */
  ADD_NEW_GAME = "add_new_game",

  /**
   * 添加批量游戏到库
   */
  ADD_NEW_GAME_LIST = "add_new_game_list"
}

