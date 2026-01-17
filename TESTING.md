# Pre-Commit Testing Guide

## Overview
This project uses Git pre-commit hooks to automatically run E2E tests before allowing commits. This prevents broken code from being pushed to GitHub.

## Setup

### Automatic Setup
After cloning the repo:

```bash
npm run setup-hooks
```

### Manual Setup
Make the pre-commit hook executable:

```bash
chmod +x .git/hooks/pre-commit
```

## How It Works

1. **Before each commit**: The pre-commit hook automatically runs all E2E tests
2. **If tests pass**: ✅ Commit proceeds normally
3. **If tests fail**: ❌ Commit is blocked until you fix the tests

## Workflow

```bash
# 1. Make code changes
# 2. Run tests locally to verify (recommended)
npm run cy:run

# 3. Fix any failing tests
# 4. Stage changes
git add .

# 5. Commit (tests will run automatically)
git commit -m "Your message"
# Tests run here...
# If all pass ✅, commit succeeds
# If any fail ❌, commit is blocked
```

## Bypassing the Hook (Not Recommended)

If you absolutely need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "Your message"
```

⚠️ **Warning**: This should only be used in emergencies. Always ensure tests pass before merging to main.

## Test Commands

```bash
# Run all tests
npm run cy:run

# Run specific test file
npm run cy:run:spec cypress/e2e/auth.cy.ts

# Open interactive test runner
npm run cy:open
```

## Current Test Status

- ✅ 54/55 tests passing (98%)
- Test suites:
  - admin-restaurants.cy.ts: 13/13 ✅
  - admin-working-hours.cy.ts: 12/12 ✅
  - admin-working-days.cy.ts: 12/12 ✅
  - admin-calendar-integration.cy.ts: 10/10 ✅
  - auth.cy.ts: 3/3 ✅
  - admin-blocked-slots.cy.ts: 4/5 (1 flaky test)

## Flaky Tests

The "removes an existing daily blocked slot" test has occasional timing issues. This is being investigated.

## GitHub Actions

Tests also run automatically on GitHub Actions:
- On push to `main`
- On pull requests to `main`
- Results visible at: Actions tab → E2E Tests → Cypress Test Results

See README.md for test status badges and details.
