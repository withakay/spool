## 1. Proposal Validation
- [ ] 1.1 Add spec deltas for removing Bun/Node/TypeScript requirements
- [ ] 1.2 Add spec deltas for Rust-only packaging/testing expectations
- [ ] 1.3 Run `spool validate 006-17_remove-js-ts --strict`

## 2. Implementation
- [ ] 2.1 Remove legacy TypeScript implementation directory `spool-bun/`
- [ ] 2.2 Remove Node/Bun toolchain files (package.json/tsconfig/vitest/biome/build scripts)
- [ ] 2.3 Remove TypeScript tests under `test/` and any TS-only QA tooling
- [ ] 2.4 Update `Makefile` to be Rust-only (remove bun targets; keep optional watch/coverage via cargo tools)
- [ ] 2.5 Update CI workflows to run Rust-only checks
- [ ] 2.6 Update docs (`README.md`, `AGENTS.md`, templates) to remove Node/Bun references

## 3. Verification
- [ ] 3.1 Run `make build`
- [ ] 3.2 Run `make test`
- [ ] 3.3 Run `make lint`
