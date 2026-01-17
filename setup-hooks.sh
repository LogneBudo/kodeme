#!/bin/sh
# Setup script to install git hooks

echo "Setting up git hooks..."

# Make pre-commit hook executable (on Unix/Mac)
if [ -f .git/hooks/pre-commit ]; then
  chmod +x .git/hooks/pre-commit
  echo "✅ Pre-commit hook installed and made executable"
fi

echo ""
echo "Git hooks are now active!"
echo "• Tests will run automatically before each commit"
echo "• Commit will be blocked if tests fail"
echo ""
echo "To bypass hooks (not recommended):"
echo "  git commit --no-verify"
