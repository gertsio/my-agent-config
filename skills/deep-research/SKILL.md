---
name: deep-research
description: Multi-source deep research using firecrawl, exa, and built-in WebSearch/WebFetch. Searches the web, synthesizes findings, and delivers cited reports with source attribution. Use when the user wants thorough research on any topic with evidence and citations.
origin: ECC
---

# Deep Research

Produce thorough, cited research reports from multiple web sources.

## When to Activate

- User asks to research any topic in depth
- Competitive analysis, technology evaluation, or market sizing
- Due diligence on companies, investors, or technologies
- Any question requiring synthesis from multiple sources
- User says "research", "deep dive", "investigate", or "what's the current state of"

## Researcher Agent

This skill is the knowledge base for the `researcher` agent (`agents/researcher.md`).
Invoke directly via `/deep-research` command or by spawning the researcher as a subagent.

## Tool Requirements

Use the best available tools, in priority order:

### Tier 1: MCP Tools (best coverage)
- **firecrawl** — `firecrawl_search`, `firecrawl_scrape`, `firecrawl_crawl`, `firecrawl_agent`, `firecrawl_extract`, `firecrawl_map`
- **exa** — `web_search_exa`, `web_search_advanced_exa`, `crawling_exa`, `company_research_exa`, `deep_researcher_start`/`deep_researcher_check`

### Tier 2: Built-in Tools (always available)
- **WebSearch** — General web search, no API key required
- **WebFetch** — Fetch and read any URL

### Tier 3: Documentation Tools
- **Context7** — Library and API documentation lookup (`resolve-library-id`, `query-docs`)

Use Tier 1 when configured. Fall back to Tier 2 when MCPs are unavailable. Use Tier 3 for library/API-specific research. Both MCP tools together give the best coverage. Configure in `~/.claude.json`.

## Workflow

### Step 1: Understand the Goal

Ask 1-2 quick clarifying questions:
- "What's your goal — learning, making a decision, or writing something?"
- "Any specific angle or depth you want?"

If the user says "just research it" — skip ahead with reasonable defaults.

### Step 2: Plan the Research

Break the topic into 3-5 research sub-questions. Example:
- Topic: "Impact of AI on healthcare"
  - What are the main AI applications in healthcare today?
  - What clinical outcomes have been measured?
  - What are the regulatory challenges?
  - What companies are leading this space?
  - What's the market size and growth trajectory?

### Step 3: Execute Multi-Source Search

For EACH sub-question, search using available tools:

**With firecrawl (Tier 1):**
```
firecrawl_search(query: "<sub-question keywords>", limit: 8)
firecrawl_agent(query: "<complex research question>")
```

**With exa (Tier 1):**
```
web_search_exa(query: "<sub-question keywords>", numResults: 8)
web_search_advanced_exa(query: "<keywords>", numResults: 5, startPublishedDate: "2025-01-01")
```

**With built-in WebSearch (Tier 2 — always available):**
```
WebSearch(query: "<sub-question keywords>", max_results: 8)
```

**With Context7 (Tier 3 — for library/API docs):**
```
resolve-library-id(libraryName: "<library>")
query-docs(context7CompatibleLibraryID: "<id>", topic: "<topic>")
```

**Search strategy:**
- Use 2-3 different keyword variations per sub-question
- Mix general and news-focused queries
- Aim for 15-30 unique sources total
- Prioritize: academic, official, reputable news > blogs > forums

### Step 4: Deep-Read Key Sources

For the most promising URLs, fetch full content:

**With firecrawl (Tier 1):**
```
firecrawl_scrape(url: "<url>")
```

**With exa (Tier 1):**
```
crawling_exa(url: "<url>", tokensNum: 5000)
```

**With built-in WebFetch (Tier 2 — always available):**
```
WebFetch(url: "<url>", prompt: "Extract key findings, data, and claims from this article")
```

Read 3-5 key sources in full for depth. Do not rely only on search snippets.

### Step 5: Synthesize and Write Report

Structure the report:

```markdown
# [Topic]: Research Report
*Generated: [date] | Sources: [N] | Confidence: [High/Medium/Low]*

## Executive Summary
[3-5 sentence overview of key findings]

## 1. [First Major Theme]
[Findings with inline citations]
- Key point ([Source Name](url))
- Supporting data ([Source Name](url))

## 2. [Second Major Theme]
...

## 3. [Third Major Theme]
...

## Key Takeaways
- [Actionable insight 1]
- [Actionable insight 2]
- [Actionable insight 3]

## Sources
1. [Title](url) — [one-line summary]
2. ...

## Methodology
Searched [N] queries across web and news. Analyzed [M] sources.
Sub-questions investigated: [list]
```

### Step 6: Deliver

- **Short topics**: Post the full report in chat
- **Long reports**: Post the executive summary + key takeaways, save full report to a file

## Parallel Research with Subagents

For broad topics, use Claude Code's Task tool to parallelize:

```
Launch 3 research agents in parallel:
1. Agent 1: Research sub-questions 1-2
2. Agent 2: Research sub-questions 3-4
3. Agent 3: Research sub-question 5 + cross-cutting themes
```

Each agent searches, reads sources, and returns findings. The main session synthesizes into the final report.

## Quality Rules

1. **Every claim needs a source.** No unsourced assertions.
2. **Cross-reference.** If only one source says it, flag it as unverified.
3. **Recency matters.** Prefer sources from the last 12 months.
4. **Acknowledge gaps.** If you couldn't find good info on a sub-question, say so.
5. **No hallucination.** If you don't know, say "insufficient data found."
6. **Separate fact from inference.** Label estimates, projections, and opinions clearly.

## Examples

```
"Research the current state of nuclear fusion energy"
"Deep dive into Rust vs Go for backend services in 2026"
"Research the best strategies for bootstrapping a SaaS business"
"What's happening with the US housing market right now?"
"Investigate the competitive landscape for AI code editors"
```
