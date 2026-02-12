use thiserror::Error;

#[derive(Error, Debug)]
pub enum ThemeErr {
    #[error("解析失败，配置文件中存在语法错误，位置:{0}")]
    Syntax(String),

    #[error("解析失败，必填字段缺失:{0}")]
    FiledMissing(String),

    #[error("解析失败，未知字段:{0}")]
    UnknownField(String),

    #[error("解析失败，不存在的节点类型:{0}")]
    NonExistentNode(String),

    #[error("解析失败，存在类型冲突: type-{0},field-{1}")]
    TypeConflict(String, String),

    #[error("解析失败，存在重复的id: {0}")]
    IdRepeat(String),

    #[error("IO操作时发生错误: {0}")]
    Io(String),
}
