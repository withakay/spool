.DEFAULT_GOAL := help

MAX_RUST_FILE_LINES ?= 1000
BUMP ?= none

.PHONY: \
	build test test-watch test-coverage lint check check-max-lines clean help \
	version-bump version-bump-patch version-bump-minor version-bump-major \
	rust-build rust-build-release rust-test rust-test-coverage rust-lint rust-install install

build: ## Build the project
	$(MAKE) rust-build

test: ## Run tests
	$(MAKE) rust-test

test-watch: ## Run tests in watch mode (requires cargo-watch)
	@set -e; \
	if cargo watch -V >/dev/null 2>&1; then \
		cargo watch -x "test --manifest-path spool-rs/Cargo.toml --workspace"; \
	else \
		echo "cargo-watch is not installed."; \
		echo "Install: cargo install cargo-watch"; \
		exit 1; \
	fi

test-coverage: ## Run coverage (requires cargo-llvm-cov)
	@set -e; \
	if cargo llvm-cov --version >/dev/null 2>&1; then \
		cargo llvm-cov --manifest-path spool-rs/Cargo.toml --workspace --tests; \
	else \
		echo "cargo-llvm-cov is not installed."; \
		echo "Install: cargo install cargo-llvm-cov"; \
		exit 1; \
	fi

lint: ## Run linter
	$(MAKE) rust-lint

check: ## Run pre-commit hooks via prek
	@set -e; \
	if prek --version >/dev/null 2>&1; then \
		prek run --all-files; \
	else \
		echo "prek is not installed."; \
		echo "Install: cargo install prek"; \
		exit 1; \
	fi

check-max-lines: ## Fail if Rust files exceed 1000 lines (override MAX_RUST_FILE_LINES=...)
	python3 "spool-rs/tools/check_max_lines.py" --max-lines "$(MAX_RUST_FILE_LINES)" --root "spool-rs"

version-bump: ## Bump workspace version (BUMP=none|patch|minor|major)
	@set -e; \
	MANIFEST="spool-rs/Cargo.toml"; \
	STAMP=$$(date +%Y%m%d%H%M); \
	NEW_VERSION=$$(python3 "spool-rs/tools/version_bump.py" --manifest "$$MANIFEST" --stamp "$$STAMP" --bump "$(BUMP)"); \
	echo "Bumped workspace version to $$NEW_VERSION"

version-bump-patch: ## Bump patch version (x.y.z -> x.y.(z+1)) + stamp
	$(MAKE) version-bump BUMP=patch

version-bump-minor: ## Bump minor version (x.y.z -> x.(y+1).0) + stamp
	$(MAKE) version-bump BUMP=minor

version-bump-major: ## Bump major version (x.y.z -> (x+1).0.0) + stamp
	$(MAKE) version-bump BUMP=major

rust-build: ## Build Rust spool (debug)
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool

rust-build-release: ## Build Rust spool (release)
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool --release

rust-test: ## Run Rust tests
	cargo test --manifest-path spool-rs/Cargo.toml --workspace

rust-test-coverage: ## Run Rust tests with coverage (fallback to regular tests)
	@set -e; \
	if cargo llvm-cov --version >/dev/null 2>&1; then \
		cargo llvm-cov --manifest-path spool-rs/Cargo.toml --workspace --tests; \
	else \
		echo "cargo-llvm-cov is not installed, falling back to regular tests."; \
		echo "Install: cargo install cargo-llvm-cov"; \
		cargo test --manifest-path spool-rs/Cargo.toml --workspace; \
	fi

rust-lint: ## Run Rust fmt/clippy
	cargo fmt --manifest-path spool-rs/Cargo.toml --all -- --check
	cargo clippy --manifest-path spool-rs/Cargo.toml --workspace --all-targets -- \
		-D warnings \
		-D clippy::dbg_macro \
		-D clippy::todo \
		-D clippy::unimplemented

rust-install: ## Install Rust spool as 'spool' into ~/.local/bin (override INSTALL_DIR=...)
	@set -e; \
	$(MAKE) rust-build-release; \
	INSTALL_DIR=$${INSTALL_DIR:-$${HOME}/.local/bin}; \
	mkdir -p "$$INSTALL_DIR"; \
	cp "spool-rs/target/release/spool" "$$INSTALL_DIR/spool"; \
	chmod +x "$$INSTALL_DIR/spool"; \
	"$$INSTALL_DIR/spool" --version

install: version-bump rust-install ## Bump version date + install Rust spool as 'spool'

clean: ## Remove build artifacts
	rm -rf spool-rs/target

help: ## Show this help message
	@echo "Available targets:" \
	&& awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
