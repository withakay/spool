# Design: Add QA Testing Area

## Technical Approach

### Directory Structure

```
qa/
├── README.md              # QA testing area overview
├── ralph/
│   └── test-ralph-loop.sh # Integration test for Spool Ralph
└── demo/                 # Temporary demo directories (created/removed at runtime)
    └── ralph-<random>/
```

### Test Script Design (`qa/ralph/test-ralph-loop.sh`)

**Purpose**: Full integration test simulating real Spool Ralph workflow

**Key Steps**:
1. **Pre-flight Check**: Verify spool version is current
2. **Demo Environment Setup**:
   - Generate short random name (8 chars)
   - Create `qa/demo/ralph-<random>/`
   - Initialize spool project with `spool init`
3. **Create Simple Change**:
   - Create a new ungrouped change via `spool new change`
   - Write a simple `proposal.md` requesting a `hello-world.sh` script
   - Write minimal `tasks.md`
4. **Run Ralph Loop**:
   - Execute `spool ralph "<prompt>" --change <id> --allow-all --max-iterations 1`
   - Capture exit code and output
5. **Verification**:
   - Check that `hello-world.sh` was created
   - Verify script contains "hello world"
   - Validate file is executable or can be made executable
6. **Cleanup**:
   - Remove temporary demo directory
   - Report success/failure

**Exit Codes**:
- `0`: Test passed
- `1`: Test failed
- `2`: Pre-flight check failed (wrong spool version)

### Implementation Details

**Random Name Generation**: Use `openssl rand -hex 4` or `/dev/urandom` for cross-platform

**Version Check**: Parse `spool --version` and compare against expected

**Error Handling**: All key steps should have error handling with cleanup on failure

### Future Expansion

Once Ralph test is working, we can add:
- Test scripts for other harnesses (claude-code, codex)
- Workflow testing scripts
- Proposal-driven change lifecycle tests
