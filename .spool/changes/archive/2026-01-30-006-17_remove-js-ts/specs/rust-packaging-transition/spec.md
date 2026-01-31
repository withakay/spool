## MODIFIED Requirements

### Requirement: Transition plan preserves `spool` command name

The transition plan MUST keep the user-facing `spool` command stable.

#### Scenario: Users can upgrade without changing command name

- GIVEN a user who previously installed Spool via any supported distribution method
- WHEN they upgrade to a Rust-only version
- THEN `spool --help` and `spool --version` behave consistently

## ADDED Requirements

### Requirement: Distribution does not require Node, Bun, or npm

Spool distribution and installation MUST NOT require Node.js, Bun, or npm.

#### Scenario: Install and run without Node

- GIVEN a machine without Node.js or Bun installed
- WHEN a user installs Spool via a Rust-native method (for example, prebuilt binaries or `cargo install`)
- THEN `spool --version` runs successfully
