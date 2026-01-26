#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UiOptions {
    pub no_color: bool,
    pub interactive: bool,
}

pub fn resolve_ui_options(
    cli_no_color: bool,
    no_color_env: Option<&str>,
    cli_no_interactive: bool,
    spool_interactive_env: Option<&str>,
) -> UiOptions {
    let interactive = resolve_interactive(cli_no_interactive, spool_interactive_env);
    UiOptions {
        no_color: cli_no_color || no_color_env_set(no_color_env),
        interactive,
    }
}

pub fn no_color_env_set(value: Option<&str>) -> bool {
    matches!(value, Some("1") | Some("true"))
}

pub fn resolve_interactive(cli_no_interactive: bool, env: Option<&str>) -> bool {
    if cli_no_interactive {
        return false;
    }

    match env {
        Some("1") => true,
        Some("0") => false,
        _ => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_color_env_set_matches_ts_values() {
        assert!(!no_color_env_set(None));
        assert!(!no_color_env_set(Some("0")));
        assert!(no_color_env_set(Some("1")));
        assert!(no_color_env_set(Some("true")));
        assert!(!no_color_env_set(Some("TRUE")));
    }

    #[test]
    fn resolve_interactive_respects_cli_and_env() {
        assert_eq!(resolve_interactive(false, None), true);
        assert_eq!(resolve_interactive(false, Some("1")), true);
        assert_eq!(resolve_interactive(false, Some("0")), false);
        assert_eq!(resolve_interactive(true, None), false);
        assert_eq!(resolve_interactive(true, Some("1")), false);
    }

    #[test]
    fn resolve_ui_options_combines_sources() {
        assert_eq!(
            resolve_ui_options(false, None, false, None),
            UiOptions {
                no_color: false,
                interactive: true
            }
        );
        assert_eq!(
            resolve_ui_options(true, None, false, None),
            UiOptions {
                no_color: true,
                interactive: true
            }
        );
        assert_eq!(
            resolve_ui_options(false, Some("1"), false, Some("0")),
            UiOptions {
                no_color: true,
                interactive: false
            }
        );
    }
}
