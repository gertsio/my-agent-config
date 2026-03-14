# Custom Skills

This repo splits custom assets into two layers:

- public shared logic in `overlay/custom/skills/`
- local-only personal data in `private/skills/`

## Rules

- Public skill bodies contain workflow, triggers, and output rules.
- Local private profiles contain personal background, voice notes, proof points, or other identity data.
- Claude command aliases must stay thin and must not duplicate private profile content.
- `private/` stays gitignored and must never be tracked.

## Directory Convention

```text
overlay/custom/skills/<skill>/SKILL.md
overlay/custom/skills/<skill>/profile.template.md
private/skills/<skill>/profile.md
overlay/custom/commands/<alias>.md
```

## Current Private-Profile Skills

- `writing`
- `upwork-proposal`

Both work without a private profile, but they become personalized only when the matching local profile exists.
