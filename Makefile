.DEFAULT_GOAL := help

.PHONY: \
	build test test-watch test-coverage lint clean help \
	rust-build rust-build-release rust-test rust-lint rust-install install \
	bun-build bun-test bun-test-watch bun-test-coverage bun-lint bun-dev-install bun-uninstall-global

build:
	$(MAKE) rust-build

test:
	$(MAKE) rust-test

test-watch:
	$(MAKE) bun-test-watch

test-coverage:
	$(MAKE) bun-test-coverage

lint:
	$(MAKE) rust-lint

rust-build:
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool

rust-build-release:
	cargo build --manifest-path spool-rs/Cargo.toml -p spool-cli --bin spool --release

rust-test:
	cargo test --manifest-path spool-rs/Cargo.toml --workspace

rust-lint:
	cargo fmt --manifest-path spool-rs/Cargo.toml --all -- --check
	cargo clippy --manifest-path spool-rs/Cargo.toml --workspace --all-targets -- -D warnings

rust-install: rust-build-release
	@set -e; \
	INSTALL_DIR=$${INSTALL_DIR:-$${HOME}/.local/bin}; \
	mkdir -p "$$INSTALL_DIR"; \
	cp "spool-rs/target/release/spool" "$$INSTALL_DIR/spool"; \
	chmod +x "$$INSTALL_DIR/spool"; \
	"$$INSTALL_DIR/spool" --version

install: bun-uninstall-global rust-install

bun-build:
	bun run build

bun-test:
	bun run test

bun-test-watch:
	bun run test:watch

bun-test-coverage:
	bun run test:coverage

bun-lint:
	bun run lint

bun-dev-install:
	@# Bump version to force reinstall, then restore
	@set -e; \
	PKG=$$(node -p "require('./package.json').name"); \
	ORIG_VERSION=$$(node -p "require('./package.json').version"); \
	restore() { \
		ORIG_VERSION="$$ORIG_VERSION" node -e 'const fs=require("fs"); const p=require("./package.json"); p.version=process.env.ORIG_VERSION; fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");'; \
	}; \
	trap 'restore' EXIT; \
	TIMESTAMP=$$(date +%Y%m%d%H%M%S); \
	BUMPED_VERSION=$$(ORIG_VERSION="$$ORIG_VERSION" TIMESTAMP="$$TIMESTAMP" node -e 'const v=process.env.ORIG_VERSION; const ts=process.env.TIMESTAMP; const next = v.includes("-local.") ? v.replace(/-local\.[0-9]{14}$$/, "-local." + ts) : (v + "-local." + ts); process.stdout.write(next);'); \
	BUMPED_VERSION="$$BUMPED_VERSION" node -e 'const fs=require("fs"); const p=require("./package.json"); p.version=process.env.BUMPED_VERSION; fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");'; \
	(bun remove -g "$$PKG" || true); \
	$(MAKE) build; \
	PACK_DIR=$$(mktemp -d); \
	trap 'rm -rf "$$PACK_DIR"; restore' EXIT; \
	bun pm pack --destination "$$PACK_DIR" --quiet; \
	TARBALL=$$(ls "$$PACK_DIR"/*.tgz); \
	bun add -g "$$TARBALL"; \
	BUN_BIN=$$(bun pm bin -g); \
	PATH="$$BUN_BIN:$$PATH"; \
	command -v spool-bun; \
	spool-bun --version

bun-uninstall-global:
	@set -e; \
	PKG=$$(node -p "require('./package.json').name"); \
	(bun remove -g "$$PKG" || true); \
	BUN_BIN=$$(bun pm bin -g); \
	(rm -f "$$BUN_BIN/spool" "$$BUN_BIN/spool-bun" || true)

spoolrs-build: rust-build-release

spoolrs-install: rust-install
	@echo "Deprecated: use 'make rust-install' or 'make install'"

clean:
	rm -rf dist
	rm -rf spool-rs/target

help:
	@echo "Available targets:"
	@echo "  build          - Build the project"
	@echo "  test           - Run tests"
	@echo "  lint           - Run linter"
	@echo "  rust-build     - Build Rust spool (debug)"
	@echo "  rust-test      - Run Rust tests"
	@echo "  rust-lint      - Run Rust fmt/clippy"
	@echo "  rust-install   - Install Rust spool as 'spool' into ~/.local/bin (override INSTALL_DIR=...)"
	@echo "  install        - Remove legacy Bun global spool + install Rust spool as 'spool'"
	@echo "  bun-build      - Build legacy TypeScript implementation"
	@echo "  bun-test       - Run legacy TypeScript tests"
	@echo "  test-watch     - Run legacy tests in watch mode"
	@echo "  test-coverage  - Run legacy tests with coverage"
	@echo "  bun-lint       - Run legacy TypeScript linter"
	@echo "  bun-dev-install - Reinstall legacy CLI globally as 'spool-bun'"
	@echo "  bun-uninstall-global - Uninstall legacy Bun global package + remove leftover shims"
	@echo "  clean          - Remove build artifacts"
	@echo "  help           - Show this help message"
