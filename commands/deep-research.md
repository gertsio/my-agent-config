---
description: Research any topic in depth using the researcher agent. Searches the web, synthesizes findings, and delivers a cited report.
---

# Deep Research Command

Invokes the **researcher** agent to produce a cited research report from multiple web sources.

## What This Command Does

1. **Parse topic** from arguments
2. **Launch researcher agent** with the topic
3. **Search multiple sources** using firecrawl, exa, or built-in WebSearch/WebFetch
4. **Deep-read key sources** for full content
5. **Synthesize report** with inline citations and source attribution
6. **Deliver** — short reports in chat, long reports saved to file

## When to Use

- Researching a topic before making a decision
- Technology evaluation or comparison
- Competitive analysis or market sizing
- Due diligence on companies or technologies
- "What's the current state of X?"
- Any question requiring synthesis from multiple sources

## How It Works

The researcher agent follows a 6-step workflow:

1. Clarifies the research goal (or uses defaults if told to "just research it")
2. Breaks the topic into 3-5 sub-questions
3. Searches across available tools (firecrawl > exa > WebSearch)
4. Deep-reads 3-5 key sources in full
5. Synthesizes findings into a structured report with citations
6. Delivers the report (chat or file depending on length)

## Arguments

$ARGUMENTS:
- `<topic>` — The research topic or question (required)
- `--quick` — Produce a brief overview (3-5 sources, exec summary + takeaways only)

## Example Usage

```
/deep-research Impact of WebAssembly on edge computing
/deep-research --quick Best Rust web frameworks in 2026
/deep-research Competitive landscape for AI code editors
/deep-research Current state of nuclear fusion energy
```

## Integration with Other Commands

After research:
- `/plan` — Plan implementation based on research findings
- `/tdd` — Implement with test-driven development
- `/code-review` — Review completed implementation

## Related

- **Agent**: `agents/researcher.md`
- **Skill**: `skills/deep-research/SKILL.md`
- **Skill**: `skills/exa-search/SKILL.md`
- **Skill**: `skills/search-first/SKILL.md`
