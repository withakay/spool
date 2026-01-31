.DEFAULT_GOAL := help

.PHONY: \
	build test test-watch test-coverage lint clean help \
	version-bump rust-build rust-build-release rust-test rust-lint rust-install install

build:
	$(MAKE) rust-build

test:
	$(MAKE) rust-test

test-watch:
	@set -e; \
	if cargo watch -V >/dev/null 2>&1; then \
		cargo watch -x "test --manifest-path spool-rs/Cargo.toml --workspace"; \
	else \
		echo "cargo-watch is not installed."; \
		echo "Install: cargo install cargo-watch"; \
		exit 1; \
	fi

test-coverage:
	@set -e; \
	if cargo llvm-cov --version >/dev/null 2>&1; then \
		cargo llvm-cov --manifest-path spool-rs/Cargo.toml --workspace; \
	else \
		echo "cargo-llvm-cov is not installed."; \
		echo "Install: cargo install cargo-llvm-cov"; \
		exit 1; \
	fi

lint:
	$(MAKE) rust-lint

version-bump:
	@set -e; \
	MANIFEST="spool-rs/Cargo.toml"; \
	STAMP=$$(date +%Y%m%d%H%M); \
	NEW_VERSION=$$(python3 "spool-rs/tools/version_bump.py" --manifest "$$MANIFEST" --stamp "$$STAMP"); \
	echo "Bumped workspace version to $$NEW_VERSION"

rust-build:
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool

rust-build-release:
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool --release

rust-test:
	cargo test --manifest-path spool-rs/Cargo.toml --workspace

rust-lint:
	cargo fmt --manifest-path spool-rs/Cargo.toml --all -- --check
	cargo clippy --manifest-path spool-rs/Cargo.toml --workspace --all-targets -- \
		-D warnings \
		-D clippy::dbg_macro \
		-D clippy::todo \
		-D clippy::unimplemented

rust-install:
	@set -e; \
	$(MAKE) rust-build-release; \
	INSTALL_DIR=$${INSTALL_DIR:-$${HOME}/.local/bin}; \
	mkdir -p "$$INSTALL_DIR"; \
	cp "spool-rs/target/release/spool" "$$INSTALL_DIR/spool"; \
	chmod +x "$$INSTALL_DIR/spool"; \
	"$$INSTALL_DIR/spool" --version

install: version-bump rust-install

clean:
	rm -rf spool-rs/target

help:
	@echo "Available targets:"
	@echo "  build          - Build the project"
	@echo "  test           - Run tests"
	@echo "  test-watch     - Run tests in watch mode (requires cargo-watch)"
	@echo "  test-coverage  - Run coverage (requires cargo-llvm-cov)"
	@echo "  lint           - Run linter"
	@echo "  version-bump   - Bump workspace version date (YYYYMMDDHHMM)"
	@echo "  rust-build     - Build Rust spool (debug)"
	@echo "  rust-test      - Run Rust tests"
	@echo "  rust-lint      - Run Rust fmt/clippy"
	@echo "  rust-install   - Install Rust spool as 'spool' into ~/.local/bin (override INSTALL_DIR=...)"
	@echo "  install        - Bump version date + install Rust spool as 'spool'"
	@echo "  clean          - Remove build artifacts"
	@echo "  help           - Show this help message"
