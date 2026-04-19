-- 收藏夹表
CREATE TABLE IF NOT EXISTS "collections" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 收藏夹与游戏的关联表
CREATE TABLE IF NOT EXISTS "collection_games" (
    "collection_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "added_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("collection_id", "game_id"),
    FOREIGN KEY ("collection_id") REFERENCES "collections" (
        "id"
    ) ON DELETE CASCADE,
    FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_collection_games_collection" ON "collection_games" (
    "collection_id"
);
CREATE INDEX IF NOT EXISTS "idx_collection_games_game" ON "collection_games" (
    "game_id"
);
