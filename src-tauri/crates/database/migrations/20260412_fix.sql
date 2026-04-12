-- ============================================================
-- Migration: 20260412_fix_schema.sql
-- 修复初始 schema 中的类型不一致、缺失约束和索引问题
-- 注意：SQLite 不支持 ALTER COLUMN，需要重建表
-- ============================================================

PRAGMA foreign_keys = OFF;

-- ────────────────────────────────────────────────────────────
-- 1. 修复 games 表
--
--    问题：
--    - last_played_at 类型为 TEXT，应为 DATETIME
--      （SQLx chrono feature 在 SQLite 里需要 DATETIME 才能自动转换）
--    - length DEFAULT 0，但语义是"未知"，应为 NULL
--    - cover/background/description/developer 允许 NULL，
--      但 Rust 端是 String（非 Option），写入时会绑定空字符串
--      → 改为 NOT NULL DEFAULT '' 与 Rust 端保持一致
-- ────────────────────────────────────────────────────────────
CREATE TABLE "games_new" (
    "id"                TEXT    PRIMARY KEY,
    "name"              TEXT    NOT NULL,
    "abs_path"          TEXT    NOT NULL,
    "is_passed"         INTEGER NOT NULL DEFAULT 0,
    "is_displayed"      INTEGER NOT NULL DEFAULT 1,
    "cover"             TEXT    NOT NULL DEFAULT '',
    "background"        TEXT    NOT NULL DEFAULT '',
    "description"       TEXT    NOT NULL DEFAULT '',
    "developer"         TEXT    NOT NULL DEFAULT '',
    "local_cover"       TEXT,
    "local_background"  TEXT,
    "save_data_path"    TEXT,
    "backup_data_path"  TEXT,
    "play_time"         INTEGER NOT NULL DEFAULT 0,
    "length"            INTEGER,              -- NULL = 未知（原为 DEFAULT 0）
    "size"              INTEGER,
    "last_played_at"    DATETIME             -- 从 TEXT 改为 DATETIME
);

INSERT INTO "games_new"
SELECT
    id, name, abs_path, is_passed, is_displayed,
    COALESCE(cover, ''),
    COALESCE(background, ''),
    COALESCE(description, ''),
    COALESCE(developer, ''),
    local_cover, local_background,
    save_data_path, backup_data_path,
    play_time,
    NULLIF(length, 0),   -- 原来 DEFAULT 0 的记录迁移为 NULL（表示未知）
    size,
    -- TEXT -> DATETIME：SQLite 的 DATETIME 本质也是字符串，直接保留值即可
    last_played_at
FROM "games";

DROP TABLE "games";
ALTER TABLE "games_new" RENAME TO "games";

-- ────────────────────────────────────────────────────────────
-- 2. 修复 account 表
--
--    问题：
--    - last_play_at 和 created_at 类型为 TEXT，应为 DATETIME
--    - favorite_game 允许 NULL 但 Rust 端是 String，改为 NOT NULL DEFAULT ''
-- ────────────────────────────────────────────────────────────
CREATE TABLE "account_new" (
    "id"                        TEXT    PRIMARY KEY,
    "user_name"                 TEXT    NOT NULL,
    "avatar"                    TEXT    NOT NULL DEFAULT '',
    "games_count"               INTEGER NOT NULL DEFAULT 0,
    "favorite_game"             TEXT    NOT NULL DEFAULT '',
    "total_play_time"           INTEGER NOT NULL DEFAULT 0,
    "games_completed_number"    INTEGER NOT NULL DEFAULT 0,
    "selected_disk"             TEXT,
    "last_play_at"              DATETIME,    -- 从 TEXT 改为 DATETIME
    "created_at"                DATETIME     -- 从 TEXT 改为 DATETIME
);

INSERT INTO "account_new"
SELECT
    id, user_name,
    COALESCE(avatar, ''),
    games_count,
    COALESCE(favorite_game, ''),
    total_play_time, games_completed_number,
    selected_disk,
    last_play_at,
    created_at
FROM "account";

DROP TABLE "account";
ALTER TABLE "account_new" RENAME TO "account";

-- ────────────────────────────────────────────────────────────
-- 3. 修复 game_screenshots 表
--
--    问题：
--    - thoughts 是 TEXT（隐含 NOT NULL），但 Rust 端是 Option<String>
--      → 改为显式 NULL 允许
--    - 无 game_id 索引，按游戏查截图会全表扫描
--    - 无外键约束
-- ────────────────────────────────────────────────────────────
CREATE TABLE "game_screenshots_new" (
    "id"         TEXT     PRIMARY KEY,
    "game_id"    TEXT     NOT NULL REFERENCES "games" ("id") ON DELETE CASCADE,
    "file_path"  TEXT     NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thoughts"   TEXT     -- 显式 NULL 允许（原来隐式 NOT NULL）
);

INSERT INTO "game_screenshots_new"
SELECT id, game_id, file_path, created_at, NULLIF(thoughts, '')
FROM "game_screenshots";

DROP TABLE "game_screenshots";
ALTER TABLE "game_screenshots_new" RENAME TO "game_screenshots";

CREATE INDEX "idx_screenshots_game_id" ON "game_screenshots" ("game_id");

-- ────────────────────────────────────────────────────────────
-- 4. 修复 game_play_sessions 表
--
--    问题：
--    - 无外键约束，删游戏时会留下孤儿会话记录
--    - 无 game_id 索引
-- ────────────────────────────────────────────────────────────
CREATE TABLE "game_play_sessions_new" (
    "id"                TEXT     PRIMARY KEY,
    "game_id"           TEXT     NOT NULL REFERENCES "games" ("id") ON DELETE CASCADE,
    "play_date"         DATE     NOT NULL,
    "duration_minutes"  INTEGER  NOT NULL DEFAULT 0,
    "last_played_at"    DATETIME
);

INSERT INTO "game_play_sessions_new"
SELECT id, game_id, play_date, duration_minutes, last_played_at
FROM "game_play_sessions";

DROP TABLE "game_play_sessions";
ALTER TABLE "game_play_sessions_new" RENAME TO "game_play_sessions";

CREATE INDEX "idx_play_date"    ON "game_play_sessions" ("play_date");
CREATE INDEX "idx_sessions_game_id" ON "game_play_sessions" ("game_id");

-- ────────────────────────────────────────────────────────────
-- 5. 修复 companions 表
--
--    问题：
--    - 有 created_at 字段，但 Rust 实体 Companion 没有该字段
--      → SELECT * 时 SQLx FromRow 会因多余列而 panic
--      → 删掉该字段
-- ────────────────────────────────────────────────────────────
CREATE TABLE "companions_new" (
    "id"                INTEGER PRIMARY KEY,
    "name"              TEXT    NOT NULL,
    "path"              TEXT    NOT NULL,
    "args"              TEXT,
    "trigger_mode"      TEXT    NOT NULL DEFAULT 'game',
    "is_enabled"        INTEGER NOT NULL DEFAULT 1,
    "is_window_managed" INTEGER NOT NULL DEFAULT 0,
    "sort_order"        INTEGER NOT NULL DEFAULT 0,
    "description"       TEXT
    -- 删除了 created_at（Rust 实体中没有此字段）
);

INSERT INTO "companions_new"
SELECT id, name, path, args, trigger_mode,
       is_enabled, is_window_managed, sort_order, description
FROM "companions";

DROP TABLE "companions";
ALTER TABLE "companions_new" RENAME TO "companions";

PRAGMA foreign_keys = ON;
