# Cross-Tool Agent Config Decision Memo

Date: 2026-03-14

Research method:
- NotebookLM notebook `cfd9196a-eddb-40bc-9df0-a125cfa804e7`
- Source pack recorded in [2026-03-14-cross-tool-agent-config-notebooklm-pack.json](/Users/keygaze/dev/tools/my-agent-config/docs/research/2026-03-14-cross-tool-agent-config-notebooklm-pack.json)

## Decision

Use ECC as an upstream component library and build a thin customization overlay on top of it.

Do not maintain a deletion-heavy personal base as the long-term control plane.

## Why

- Official Claude Code docs keep pointing back to one constraint: context fills fast, and overloaded always-on instructions reduce quality. That favors a selective install plus small project overlays over a giant home prompt.
- Official settings docs support hierarchical scopes and scoped overrides. That makes a minimal home base plus per-project additions a better fit than one giant monolithic config.
- Official hooks docs make hooks valuable but operationally sensitive. A thin overlay lets us keep upstream hook improvements while gating which ones we actually deploy.
- Official sub-agent and cost guidance both favor specialization and smaller summaries over dumping everything into the main session context.
- ECC is strongest as a reusable library of agents, skills, hooks, and cross-tool patterns. It already ships Claude, Codex, Cursor, and OpenCode material, which is exactly the kind of surface that should stay easy to update.

## Keep / Ignore / Replace

Keep:
- Upstream agents, skills, rules, hooks, scripts, and `.codex` reference material as source assets.
- Upstream directory layout and update flow on `main`.
- Cross-tool patterns that are already stable in ECC, especially hooks, Codex roles, and shared instruction conventions.

Ignore by default:
- Unselected language stacks during render.
- Large always-loaded indexes that do not help the chosen stacks.
- Runtime state in `~/.claude` and `~/.codex`.

Replace with overlay-owned files:
- Stack selection manifest
- Generated Claude agent index
- Generated Codex managed config snippet
- Project-level AGENTS overlays
- Custom skills under `overlay/custom/skills`
- Upstream impact summaries and scheduling templates

## Architecture Recommendation

- `main` stays a clean upstream mirror.
- `personal` only owns overlay files, generated docs, tests, and custom skills.
- `config/stacks.json` declares stacks, defaults, protected paths, and cross-tool mappings.
- `scripts/agent-config.js` is the control-plane entrypoint.
- Claude output is a minimal home base with selected agents/rules/skills plus shared infra.
- Codex output is a minimal home base with selected skills split into `ecc/` and `custom/`, plus generated AGENTS/config artifacts.
- Project overlays stay small and additive. They should reference the home-level base instead of copying the full harness into every repo.

## Update Workflow Recommendation

- Fetch upstream weekly.
- Compare `main..upstream/main`.
- Filter changes down to selected stacks plus shared runtime assets.
- Report only relevant impact.
- Never auto-merge or auto-deploy.

## Practical Conclusion

ECC is good enough to be the upstream library. The smart part is not rewriting it from scratch or trimming it manually forever. The smart part is adding a small, testable overlay that decides what gets installed for Claude Code, what gets installed for Codex, and where custom skills live.
