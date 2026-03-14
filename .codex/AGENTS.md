# ECC for Codex CLI

This file is intentionally short.

Use Codex as a minimal global runtime:
- keep global instructions small
- keep globally available skills curated
- move stack-specific guidance into project overlays
- do not mirror Claude hook/command/subagent behavior

Global default skills should stay small and composable:
- `coding-standards`
- `search-first`
- `security-review`
- `strategic-compact`
- `tdd-workflow`
- `verification-loop`

Project overlays can add reviewed, Codex-compatible skills for API, frontend, backend, Docker, database, and deployment work.
