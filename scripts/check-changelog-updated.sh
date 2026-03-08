#!/bin/bash
# Check if app/config/buildLogs.ts has been modified in the current branch
# compared to the base branch (main/master).
# Used as a Claude hook to ensure the user-facing changelog is updated before creating a PR.

BASE_BRANCH="main"

# Check if main exists, fallback to master
if ! git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
  BASE_BRANCH="master"
  if ! git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
    echo "CHANGELOG_CHECK: Could not determine base branch. Skipping check."
    exit 0
  fi
fi

# Get list of changed files compared to base branch
CHANGED_FILES=$(git diff --name-only "origin/$BASE_BRANCH"...HEAD 2>/dev/null)

if echo "$CHANGED_FILES" | grep -q "app/config/buildLogs.ts"; then
  echo "CHANGELOG_CHECK: buildLogs.ts has been updated."
  exit 0
else
  echo "CHANGELOG_CHECK_FAILED: app/config/buildLogs.ts has NOT been updated."
  echo ""
  echo "Before creating a PR, you MUST add a new entry to app/config/buildLogs.ts"
  echo "to document user-facing changes for the What's New page (/whats-new)."
  echo ""
  echo "Add a new entry at the TOP of the buildLogs array with:"
  echo '  - id: unique identifier (e.g., "2026-03-feature-name")'
  echo '  - date: today'"'"'s date in YYYY-MM-DD format'
  echo '  - title: short user-friendly title'
  echo '  - description: 1-2 sentence description for users'
  echo '  - category: "feature" | "improvement" | "fix" | "announcement"'
  echo '  - highlights: array of bullet points (optional)'
  echo ""
  echo "If this PR contains ONLY internal/infra changes with no user-facing impact,"
  echo "you may skip this by adding a comment in the PR description: [skip changelog]"
  exit 2
fi
