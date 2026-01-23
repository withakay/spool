#!/usr/bin/env bash
set -euo pipefail

# Integration test for Spool Ralph
# Simulates real-world usage: create demo project, run spool ralph, verify output

SPOOL_VERSION="0.20.3-local.20260123000000"
DEMO_DIR_PREFIX="demo"
SCRIPT_NAME="test-ralph-loop.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ -n "${DEMO_DIR:-}" ]] && [[ -d "$DEMO_DIR" ]]; then
        if [[ -n "${KEEP_DEMO_DIR:-}" ]] || [[ $exit_code -ne 0 ]]; then
            log_info "Keeping demo directory: $DEMO_DIR"
        else
            log_info "Cleaning up demo directory: $DEMO_DIR"
            rm -rf "$DEMO_DIR"
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Pre-flight: Check spool version
check_spool_version() {
    log_info "Checking spool version..."

    if ! command -v spool &> /dev/null; then
        log_error "spool not found on PATH. Please install spool."
        exit 2
    fi

    local installed_version=$(spool --version 2>/dev/null || echo "unknown")
    log_info "Installed spool version: $installed_version"

    # For local dev, just warn if versions don't match exactly
    if [[ "$installed_version" != "$SPOOL_VERSION" ]]; then
        log_warn "Spool version mismatch. Expected: $SPOOL_VERSION, Got: $installed_version"
        log_warn "Continuing anyway for local development..."
    fi
}

# Generate random name
generate_random_name() {
    # Use openssl or /dev/urandom
    if command -v openssl &> /dev/null; then
        openssl rand -hex 4
    else
        cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 8
    fi
}

# Setup demo environment
setup_demo() {
    local random_name=$(generate_random_name)
    local base_dir=$(pwd -P)
    DEMO_DIR="$DEMO_DIR_PREFIX/ralph-$random_name"

    # Convert to absolute path
    DEMO_DIR="$base_dir/$DEMO_DIR"

    log_info "Creating demo environment: $DEMO_DIR"
    mkdir -p "$DEMO_DIR"
    cd "$DEMO_DIR"

    # Initialize spool project
    log_info "Initializing spool project..."
    spool init --tools opencode

    # Return to base directory after init (spool init might change CWD)
    cd "$base_dir"
    cd "$DEMO_DIR"

    # Create a simple change via CLI
    log_info "Creating change via spool CLI..."
    local change_output
    change_output=$(spool new change "hello-world-test" --module 000 2>&1)
    if [[ "$change_output" =~ Created\ change\ \'([^\']+)\' ]]; then
        CHANGE_ID="${BASH_REMATCH[1]}"
    else
        log_error "Failed to parse change ID from output"
        log_error "$change_output"
        return 1
    fi

    CHANGE_DIR=".spool/changes/$CHANGE_ID"
    log_info "Created change: $CHANGE_ID"
}

# Run Ralph loop to create proposal artifacts
run_proposal_loop() {
    local change_id="$1"

    log_info "Running spool ralph to create proposal: $change_id"

    # Run ralph with prompt to create proposal artifacts
    local output
    set +e
    output=$(spool ralph "Create a full change proposal for $change_id using the spec-driven workflow. Generate proposal.md, any required specs, design.md if needed, and tasks.md. Use the spool-ff-change skill." \
        --change "$change_id" \
        --max-iterations 2 \
        --completion-promise "DONE" 2>&1)
    local exit_code=$?
    set -e

    # Check if it's an auth error (external issue, not test failure)
    if echo "$output" | grep -q "Token refresh failed\|401\|authentication"; then
        log_error "OpenCode authentication error detected"
        log_error "Ralph requires authenticated OpenCode to run"
        log_error "Please run 'opencode login' first, then retry this test"
        return 2
    fi

    # Check for other errors
    if [ $exit_code -ne 0 ]; then
        log_error "spool ralph failed with exit code $exit_code"
        log_error "Output:"
        printf '%s\n' "$output" | head -20
        return 1
    fi

    log_info "Proposal loop completed"
}

# Run Ralph loop to implement tasks
run_apply_loop() {
    local change_id="$1"

    log_info "Running spool ralph to implement tasks: $change_id"

    local output
    set +e
    output=$(spool ralph "Implement the tasks in tasks.md for $change_id. Create hello-world.sh and mark tasks complete." \
        --change "$change_id" \
        --max-iterations 2 \
        --completion-promise "DONE" 2>&1)
    local exit_code=$?
    set -e

    if echo "$output" | grep -q "Token refresh failed\|401\|authentication"; then
        log_error "OpenCode authentication error detected"
        log_error "Ralph requires authenticated OpenCode to run"
        log_error "Please run 'opencode login' first, then retry this test"
        return 2
    fi

    if [ $exit_code -ne 0 ]; then
        log_error "spool ralph failed with exit code $exit_code"
        log_error "Output:"
        printf '%s\n' "$output" | head -20
        return 1
    fi

    log_info "Apply loop completed"
}

# Verify results
verify_results() {
    local change_dir="$1"

    log_info "Verifying results..."

    # Check that proposal artifacts exist
    if [[ ! -f "$change_dir/proposal.md" ]]; then
        log_error "proposal.md not found"
        return 1
    fi
    log_info "✓ proposal.md exists"

    if [[ ! -f "$change_dir/tasks.md" ]]; then
        log_error "tasks.md not found"
        return 1
    fi
    log_info "✓ tasks.md exists"

    # Check if hello-world.sh exists
    if [[ ! -f "hello-world.sh" ]]; then
        log_error "hello-world.sh not found"
        return 1
    fi
    log_info "✓ hello-world.sh exists"

    # Check if file contains "hello world"
    if ! grep -q "hello world" "hello-world.sh"; then
        log_error "hello-world.sh does not contain 'hello world'"
        return 1
    fi
    log_info "✓ hello-world.sh contains 'hello world'"

    # Check if script is executable or can be made executable
    if [[ ! -x "hello-world.sh" ]]; then
        log_info "Making hello-world.sh executable..."
        chmod +x "hello-world.sh"
    fi

    log_info "✓ hello-world.sh is executable"

    # Test running it
    local output=$(./hello-world.sh 2>&1 || true)
    if [[ "$output" != *"hello world"* ]]; then
        log_error "hello-world.sh output: $output"
        return 1
    fi
    log_info "✓ hello-world.sh outputs 'hello world'"

    return 0
}

# Main test flow
main() {
    log_info "=== Spool Ralph Integration Test ==="

    check_spool_version
    setup_demo

    CHANGE_ID=$(basename "$CHANGE_DIR")

    cd "$DEMO_DIR"
    run_proposal_loop "$CHANGE_ID"
    run_apply_loop "$CHANGE_ID"
    verify_results "$CHANGE_DIR"

    log_info "=== All tests passed! ==="

    # Change to original directory so cleanup works correctly
    cd -

    return 0
}

# Run main
main "$@"
