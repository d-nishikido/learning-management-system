---
description: Fix GitHub issue
argument-hint: Issue number
---

Please analyze and fix the GitHub issue: $ARGUMENTS.

Sub agent: Frontend,Backend

Follow these steps:

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. `/sc:analyze` Search the codebase for relevant files
4. `/sc:implement` Implement the necessary changes to fix the issue
5. `/sc:test` Write and run tests to verify the fix(Do not E2E test)
6. `/sc:improve` Ensure code passes linting and type checking
8. `/sc:git` Create a descriptive commit message
9. NEVER delete an issue

Remenber to use the GitHub CLI (`gh`) for all GitHub-related tasks.