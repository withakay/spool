pub(crate) fn main() {
    // Ensure internal logging can be enabled for debugging without changing user output.
    let filter = crate::util::env_filter();
    let _ = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr)
        .try_init();
    let _ = tracing_log::LogTracer::init();

    let args: Vec<String> = std::env::args().skip(1).collect();

    // Match TS behavior: `--no-color` sets NO_COLOR=1 globally before command execution.
    if args.iter().any(|a| a == "--no-color") {
        // Rust 1.93+ marks `set_var` unsafe due to potential UB when racing with
        // other threads reading the environment. We do this before any command
        // execution or thread spawning.
        unsafe {
            std::env::set_var("NO_COLOR", "1");
        }
    }

    if let Err(e) = super::run::run(&args) {
        if !e.is_silent() {
            eprintln!();
            eprintln!("✖ Error: {e}");
        }
        std::process::exit(1);
    }
}
