use serde::Serialize;

/// 游戏元数据结构体
#[derive(Debug, Serialize)]
struct GameMeta {
    id: String,
    name: String,
    abs_path: String,
    cover: String,
    play_time: u64,
    size: u64,
}

type GameMetaList = Vec<GameMeta>;
