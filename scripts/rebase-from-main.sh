#!/bin/bash
# Rebase current branch from main before creating a PR.
# Catches merge conflicts early so they can be resolved before the PR is opened.

set -e

BASE_BRANCH="main"

# Check if main exists, fallback to master
if ! git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
  BASE_BRANCH="master"
  if ! git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
    echo "REBASE_CHECK: Could not determine base branch. Skipping check."
    exit 0
  fi
fi

CURRENT_BRANCH=$(git branch --show-current)

# Don't rebase if we're on main/master itself
if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
  echo "REBASE_CHECK: On $BASE_BRANCH branch, skipping rebase."
  exit 0
fi

# Check for uncommitted changes that would block a rebase
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "REBASE_CHECK_FAILED: You have uncommitted changes."
  echo "Please commit or stash your changes before creating a PR."
  exit 2
fi

# Fetch latest main
echo "REBASE_CHECK: Fetching latest origin/$BASE_BRANCH..."
git fetch origin "$BASE_BRANCH" 2>/dev/null

# Check if rebase is needed
BEHIND=$(git rev-list --count "HEAD..origin/$BASE_BRANCH" 2>/dev/null || echo "0")

if [ "$BEHIND" = "0" ]; then
  echo "REBASE_CHECK: Branch is up to date with origin/$BASE_BRANCH."
  exit 0
fi

echo "REBASE_CHECK: Branch is $BEHIND commit(s) behind origin/$BASE_BRANCH. Rebasing..."

# Attempt rebase
if git rebase "origin/$BASE_BRANCH"; then
  echo "REBASE_CHECK: Successfully rebased onto origin/$BASE_BRANCH."
  exit 0
else
  # Rebase failed - abort and report
  git rebase --abort 2>/dev/null || true
  echo ""
  echo "REBASE_CHECK_FAILED: Merge conflicts detected when rebasing onto origin/$BASE_BRANCH."
  echo ""
  echo "Before creating a PR, you MUST resolve these conflicts:"
  echo "  1. Run: git rebase origin/$BASE_BRANCH"
  echo "  2. Resolve the conflicts in the listed files"
  echo "  3. Run: git add <resolved-files>"
  echo "  4. Run: git rebase --continue"
  echo "  5. Then retry creating the PR"
  exit 2
fi
