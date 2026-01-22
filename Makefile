.PHONY: build test test-watch test-coverage lint clean install-local help

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

install-local:
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
	@echo "  install-local  - Install spool CLI globally from this repo"
	@echo "  clean          - Remove build artifacts"
	@echo "  help           - Show this help message"
