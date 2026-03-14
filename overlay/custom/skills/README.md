# Custom Skills Namespace

Put personal or team-owned skills here instead of editing upstream-imported skills.

- `overlay/custom/skills/<skill-name>/SKILL.md` stays owned by this fork.
- `overlay/custom/skills/<skill-name>/profile.template.md` documents the expected local-only profile shape when a skill needs personal data.
- The Claude renderer installs custom skills into the normal `skills/` target.
- The Codex renderer installs custom skills into `.agents/skills/custom/`.
- Claude-only command aliases live in `overlay/custom/commands/`.
- Private profile data lives outside git in `private/skills/<skill-name>/profile.md`.

This keeps upstream updates clean while giving you a stable place to add new behavior.
