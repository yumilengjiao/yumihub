-- 游戏元数据表
CREATE TABLE "games" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abs_path" TEXT NOT NULL,
    "is_passed" INTEGER DEFAULT 0,
    "is_displayed" INTEGER DEFAULT 1,
    "cover" TEXT,
    "background" TEXT,
    "description" TEXT,
    "developer" TEXT,
    "local_cover" TEXT,
    "local_background" TEXT,
    "save_data_path" TEXT,
    "backup_data_path" TEXT,
    "play_time" INTEGER DEFAULT 0,
    "length" INTEGER DEFAULT 0,
    "size" INTEGER,
    "last_played_at" TEXT
);

-- 文件路径权限
CREATE TABLE "authorized_scopes" (
    "id" TEXT PRIMARY KEY,
    "path" TEXT NOT NULL UNIQUE,
    "authorized_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 游戏游玩时长日期表
CREATE TABLE "game_play_sessions" (
    "id" TEXT PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "play_date" DATE NOT NULL,
    "duration_minutes" INTEGER DEFAULT 0,
    "last_played_at" DATETIME
);

CREATE INDEX "idx_play_date" ON "game_play_sessions" ("play_date");

-- 游戏快照表
CREATE TABLE "game_screenshots" (
    "id" TEXT PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "thoughts" TEXT
);

-- 游戏的连携程序表
CREATE TABLE "companions" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "args" TEXT,
    "trigger_mode" TEXT NOT NULL DEFAULT 'game',
    "is_enabled" INTEGER DEFAULT 1,
    "is_window_managed" INTEGER DEFAULT 0,
    "sort_order" INTEGER DEFAULT 0,
    "description" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- APP 快捷键表
CREATE TABLE "shortcut" (
    "id" TEXT PRIMARY KEY,
    "key_combo" TEXT,
    "is_global" BOOLEAN DEFAULT 0
);

-- 用户信息表
CREATE TABLE "account" (
    "id" TEXT PRIMARY KEY,
    "user_name" TEXT NOT NULL,
    "avatar" TEXT,
    "games_count" INTEGER DEFAULT 0,
    "favorite_game" TEXT,
    "total_play_time" INTEGER DEFAULT 0,
    "games_completed_number" INTEGER DEFAULT 0,
    "selected_disk" TEXT,
    "last_play_at" TEXT,
    "created_at" TEXT
);

-- 初始化数据
INSERT INTO "shortcut" ("id", "key_combo", "is_global")
VALUES ('launch_last', 'Ctrl+L', 1),
('confirm_launch', 'Enter', 0),
('screenshot', 'Alt+F12', 1),
('nav_home', NULL, 0),
('nav_library', NULL, 0),
('nav_profile', NULL, 0),
('nav_settings', NULL, 0),
('boss_key', NULL, 1),
('emergency_stop', NULL, 1);

INSERT INTO "account" ("id", "user_name", "created_at")
VALUES ('default', 'user', DATETIME('now'));
