# Claude-Reviewed Skills + Minimal Codex Runtime

This repo now treats Claude Code and Codex differently on purpose.

## Goals

- Keep `main` close to upstream ECC.
- Keep `personal` limited to overlay-owned logic.
- Review core Claude skills before trusting them as defaults.
- Select only the stacks you want installed for Claude.
- Preserve protected runtime files in `~/.claude` and `~/.codex`.
- Keep Codex globally minimal.
- Keep custom skills separate from upstream-imported skills.
- Report upstream changes without auto-merging them.

## Skill Review

The review catalog lives at [skill-review.json](/Users/keygaze/dev/tools/my-agent-config/config/skill-review.json).

It is the machine-readable source of truth for:
- reviewed core skills
- keep/trim/rewrite/drop decisions
- Claude default approval
- Codex compatibility approval

The human review matrix lives at [claude-skill-review.md](/Users/keygaze/dev/tools/my-agent-config/docs/claude-skill-review.md).

## Manifest

The stack manifest lives at [stacks.json](/Users/keygaze/dev/tools/my-agent-config/config/stacks.json).

It controls:
- Claude global defaults versus project overlays
- shared low-overhead defaults
- tool-specific protected paths
- stack-to-commands/rules/skills/agents mappings

The custom skill catalog lives at [custom-skills.json](/Users/keygaze/dev/tools/my-agent-config/config/custom-skills.json).

## Commands

Render Claude home output:

```bash
npm run agent-config:render:claude -- --output ./build/claude-home
```

Render Codex home output:

```bash
npm run agent-config:render:codex -- --output ./build/codex-home
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
- workflow and harness defaults only at the global level
- selected `agents/`
- selected `commands/`
- selected `rules/`
- selected `skills/`
- shared `contexts/`, `hooks/`, `mcp-configs/`, `scripts/`
- generated `rules/common/agents.md`

Claude project overlay:
- generated root `AGENTS.md`
- real `.claude/agents/`, `.claude/commands/`, `.claude/skills/` installs for the selected stacks
- `.claude/STACK-OVERLAY.md` for stack rule guidance

Codex render:
- minimal root `AGENTS.md`
- generated `.codex/AGENTS.md`
- generated `.codex/config.ecc.toml`
- only reviewed `codex_allowed` skills under `.agents/skills/ecc/`
- custom skills under `.agents/skills/custom/`
- no broad role inventory by default

## Custom Skills

Add your own skills under [overlay/custom/skills](/Users/keygaze/dev/tools/my-agent-config/overlay/custom/skills/README.md).

Private personal data belongs in gitignored local files under `private/skills/`.

See [custom-skills.md](/Users/keygaze/dev/tools/my-agent-config/docs/custom-skills.md) for the public-skill/private-profile split.

Rules:
- never edit upstream skill directories for personal behavior
- prefer custom skills for personal workflows, tone, or private preferences
- keep names distinct from upstream skills to avoid confusion
- keep personal profile data out of the repo and in local private profiles

## Migration Direction

Claude:
- keep the valuable runtime model
- keep global installs cross-project only
- use explicit project overlays for language-specific installs

Codex:
- stop mirroring Claude behavior
- keep the global runtime minimal
- use project overlays for stack-specific extras

## Scheduling

A weekly macOS `launchd` template lives at [com.gertsio.my-agent-config.upstream-check.plist](/Users/keygaze/dev/tools/my-agent-config/ops/launchd/com.gertsio.my-agent-config.upstream-check.plist).

It is notify-only. It does not merge or deploy anything.
