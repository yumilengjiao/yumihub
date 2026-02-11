use std::collections::HashMap;

use custom_theme::{
    engine::ThemeEngine,
    processor::{ConsumeProcessor, SpanProcessor},
};

use crate::error::AppError;

pub fn init() -> Result<(), AppError> {
    let theme_engine = get_process_engine();
    Ok(())
}

pub fn get_process_engine() -> ThemeEngine {
    let map = HashMap::from([("gameList", "useGameList")]);
    let consum_processor = Box::new(ConsumeProcessor::new(map));
    let span_processor = Box::new(SpanProcessor::new());
    let processors = vec![consum_processor, span_processor];
    ThemeEngine::with_processors(processors)
}
