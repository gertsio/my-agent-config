# Claude Core Skill Review

This is the human review matrix for the first-pass core engineering skill set.

| skill | status | decision | claude_default | codex_allowed | notes |
|-------|--------|----------|----------------|---------------|-------|
| `security-review` | reviewed | trim | yes | yes | High-value default guardrail; trim repeated examples. |
| `tdd-workflow` | reviewed | trim | yes | yes | Keep the workflow, shorten repeated coverage language. |
| `verification-loop` | reviewed | keep_as_is | yes | yes | Already compact and clear. |
| `deployment-patterns` | reviewed | trim | no | yes | Strong opt-in infra skill, not a default. |
| `docker-patterns` | reviewed | trim | no | yes | Useful but too broad for always-on use. |
| `database-migrations` | reviewed | keep_as_is | no | yes | Good explicit-use skill. |
| `postgres-patterns` | reviewed | keep_as_is | no | yes | Compact enough already. |
| `coding-standards` | reviewed | trim | yes | yes | Important default, but should be shorter. |
| `frontend-patterns` | reviewed | trim | no | yes | Keep available for project overlays only. |
| `backend-patterns` | reviewed | trim | no | yes | Useful on demand, not default. |
| `e2e-testing` | reviewed | trim | no | yes | Good when needed, too large for default load. |
| `api-design` | reviewed | trim | no | yes | Strong opt-in design reference. |
| `python-patterns` | reviewed | rewrite | no | no | Too long and too broad in current form. |
| `python-testing` | reviewed | rewrite | no | no | Needs a smaller, more tactical rewrite. |
| `search-first` | reviewed | keep_as_is | yes | yes | Clear trigger and low overhead. |
| `strategic-compact` | reviewed | keep_as_is | yes | yes | Compact and directly useful. |
| `eval-harness` | reviewed | trim | no | yes | Advanced, good for explicit AI-eval work. |
| `iterative-retrieval` | reviewed | keep_as_is | no | yes | Valuable for context-constrained workflows. |
