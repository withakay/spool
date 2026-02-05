use serde_json::Value;

use super::types::SpoolConfig;

/// Centralized default configuration values.
///
/// This is the single source of truth for defaults used by config loading and
/// JSON schema generation.
pub fn default_config() -> SpoolConfig {
    SpoolConfig::default()
}

pub fn default_config_json() -> Value {
    serde_json::to_value(default_config()).expect("default config should serialize")
}
