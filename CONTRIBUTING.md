# Contributing to Spool

Thank you for your interest in contributing to Spool! This document provides guidelines and information to help you contribute effectively.

## Getting Started

### Prerequisites

- Rust toolchain (rustup + cargo)
- Make
- Git

### Building and Testing

```bash
# Build the project
make build

# Run tests
make test

# Run linter checks
make check

# Run tests with coverage
make test-coverage
```

## Commit Message Format

**Important:** This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This standard is required for automatic changelog generation and semantic versioning via Release Please.

### Format

Each commit message must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Where:
- `<type>` is **required** and must be one of:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that don't affect the meaning of the code (formatting, etc.)
  - `refactor`: Code change that neither fixes a bug nor adds a feature
  - `perf`: Performance improvement
  - `test`: Adding or updating tests
  - `build`: Changes to build system or dependencies
  - `ci`: Changes to CI configuration files and scripts
  - `chore`: Other changes that don't modify src or test files
  - `revert`: Reverts a previous commit

- `<scope>` is optional and can specify the area of change (e.g., `cli`, `core`, `templates`)
- `<subject>` is a brief description of the change (lowercase, no period at the end)
- `<body>` is optional and provides additional context
- `<footer>` is optional and can reference issues or include breaking change info

### Examples

```
feat: add support for custom workflow templates

fix(cli): resolve issue with path resolution on Windows

docs: update README with new installation instructions

chore: update dependencies
```

### Breaking Changes

If your commit introduces a breaking change, include `BREAKING CHANGE:` in the footer or add `!` after the type/scope:

```
feat!: remove deprecated command
```

or

```
feat: remove deprecated command

BREAKING CHANGE: The `old-command` has been removed. Use `new-command` instead.
```

## Pre-commit Hooks

This project uses [prek](https://github.com/j178/prek) for pre-commit hooks. The hooks will automatically check your changes before committing.

### Installing Hooks

```bash
# Install all hooks (pre-commit and pre-push)
prek install
prek install -t pre-push

# Run hooks manually
prek run

# Run hooks on all files
prek run --all-files
```

The pre-commit hooks include:
- Commit message validation (Conventional Commits format)
- Code formatting (`cargo fmt`)
- Linting (`cargo clippy`)
- Test coverage checks
- YAML and JSON validation
- Markdown linting

## Development Workflow

1. Fork the repository and create a new branch for your work
2. Make your changes following the coding conventions
3. Write or update tests as needed
4. Run `make test` and `make check` to ensure everything passes
5. Commit your changes with a conventional commit message
6. Push your branch and open a pull request

## Pull Request Guidelines

- Use a clear, descriptive title that follows Conventional Commits format
- Include a detailed description of your changes
- Reference any related issues
- Ensure all CI checks pass
- Keep pull requests focused on a single feature or fix

## Questions?

If you have questions or need help, feel free to open an issue or reach out to the maintainers.

Thank you for contributing!
