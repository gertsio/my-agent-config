# Custom Skills Namespace

Put personal or team-owned skills here instead of editing upstream-imported skills.

- `overlay/custom/skills/<skill-name>/SKILL.md` stays owned by this fork.
- The Claude renderer installs custom skills into the normal `skills/` target.
- The Codex renderer installs custom skills into `.agents/skills/custom/`.

This keeps upstream updates clean while giving you a stable place to add new behavior.
