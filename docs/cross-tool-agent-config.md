# Cross-Tool Agent Config

This repo now supports a research-first control plane for Claude Code and Codex.

## Goals

- Keep `main` close to upstream ECC.
- Keep `personal` limited to overlay-owned logic.
- Select only the stacks you want installed.
- Preserve protected runtime files in `~/.claude` and `~/.codex`.
- Keep custom skills separate from upstream-imported skills.
- Report upstream changes without auto-merging them.

## Manifest

The stack manifest lives at [config/stacks.json](/Users/keygaze/dev/tools/my-agent-config/config/stacks.json).

It controls:
- default stacks
- shared always-on assets
- tool-specific protected paths
- stack-to-rules/skills/agents mappings

## Commands

Render Claude home output:

```bash
npm run agent-config:render:claude -- --stacks typescript,python --output ./build/claude-home
```

Render Codex home output:

```bash
npm run agent-config:render:codex -- --stacks typescript,python --output ./build/codex-home
```

Render a project overlay:

```bash
npm run agent-config:render-project:claude -- --stacks python --project-dir /path/to/project
npm run agent-config:render-project:codex -- --stacks typescript --project-dir /path/to/project
```

Check upstream impact:

```bash
npm run agent-config:check-upstream -- --stacks typescript,python
```

## Output Shape

Claude render:
- selected `agents/`
- selected `rules/`
- selected `skills/`
- shared `commands/`, `contexts/`, `hooks/`, `mcp-configs/`, `scripts/`
- generated `rules/common/agents.md`

Codex render:
- generated root `AGENTS.md`
- generated `.codex/AGENTS.md`
- generated `.codex/config.ecc.toml`
- selected skills under `.agents/skills/ecc/`
- custom skills under `.agents/skills/custom/`
- upstream Codex role configs under `agents/`

## Custom Skills

Add your own skills under [overlay/custom/skills](/Users/keygaze/dev/tools/my-agent-config/overlay/custom/skills/README.md).

Rules:
- never edit upstream skill directories for personal behavior
- prefer custom skills for personal workflows, tone, or private preferences
- keep names distinct from upstream skills to avoid confusion

## Scheduling

A weekly macOS `launchd` template lives at [com.gertsio.my-agent-config.upstream-check.plist](/Users/keygaze/dev/tools/my-agent-config/ops/launchd/com.gertsio.my-agent-config.upstream-check.plist).

It is notify-only. It does not merge or deploy anything.
