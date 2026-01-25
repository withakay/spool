.DEFAULT_GOAL := help

.PHONY: build test test-watch test-coverage lint clean dev-install help

build:
	node build.js

test:
	pnpm test

test-watch:
	pnpm test:watch

test-coverage:
	pnpm test:coverage

lint:
	pnpm lint

dev-install:
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
	(pnpm -g remove "$$PKG" || { GLOBAL_ROOT=$$(pnpm root -g); rm -rf "$$GLOBAL_ROOT/$$PKG"; }); \
	$(MAKE) build; \
	pnpm -g add .

clean:
	rm -rf dist

help:
	@echo "Available targets:"
	@echo "  build          - Build the project"
	@echo "  test           - Run tests"
	@echo "  test-watch     - Run tests in watch mode"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  lint           - Run linter"
	@echo "  dev-install    - Reinstall spool CLI globally from this repo"
	@echo "  clean          - Remove build artifacts"
	@echo "  help           - Show this help message"
