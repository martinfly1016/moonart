# Semrush Opportunity Radar

This is the ongoing MojiMoon research track for finding tool-type search demand from Semrush and deciding which opportunities should become MojiMoon pages or product features.

It is broader than the Beyond Lets-Emoji project. Beyond Lets-Emoji focuses on emoji copy and static emoji-reference competitors. This radar also looks for adjacent tool workflows that fit MojiMoon's identity: expressive text, emoji art, symbols, copy/paste utilities, chat decoration, social/profile formatting, and lightweight visual generators.

## Goal

Use Semrush continuously to find opportunities that can be integrated into MojiMoon as useful tools, not just articles.

Good opportunities should usually satisfy at least three of these:

- The query implies a repeatable task or utility.
- The output can be copied, downloaded, customized, or reused.
- The workflow fits mobile usage.
- The page can connect naturally to existing MojiMoon tools.
- There is enough search demand or a clear long-tail cluster.
- Competitors have thin content, weak mobile UX, too many ads, or static reference pages.
- The page can be shipped in Japanese and English without creating two unrelated products.

## Research Sources

Primary Semrush inputs:

- Keyword Overview
- Keyword Magic Tool
- Organic Research for competitor domains
- SERP competitor pages
- related questions and phrase-match queries
- country/language splits, especially US and JP

Competitor/source buckets:

- emoji reference and emoji copy sites
- kaomoji and emoticon sites
- fancy text and symbol generators
- Discord, Slack, and social bio tools
- ASCII art and text art tools
- image-to-emoji or sticker-style utilities
- seasonal greeting and message decoration pages

## Opportunity Types

### Emoji And Symbol Copy

Examples:

- emoji copy by topic
- aesthetic symbols
- arrows, hearts, stars, brackets, dividers
- warning, check, cross, currency, math, zodiac, weather symbols
- Japanese-style copy/paste decoration sets

MojiMoon fit:

- Strong. These can reuse existing emoji-list, emoji-copy, special-character, and copy draft patterns.

### Text Decoration Tools

Examples:

- fancy text generator
- small caps text
- bubble text
- upside down text
- bold italic Unicode text
- aesthetic bio text
- Discord / Instagram / TikTok name styles

MojiMoon fit:

- Strong if built as practical conversion tools with copy history and mobile previews.
- Avoid launching generic thin pages unless there is a distinct MojiMoon visual or workflow advantage.

### Chat And Community Tools

Examples:

- Slack emoji generator
- Discord emoji maker
- emoji combination builder
- reaction emoji sets
- channel name symbols
- status message decoration

MojiMoon fit:

- Strong. These connect to existing Slack emoji work and emoji-combination pages.

### Emoji Art And Text Art

Examples:

- emoji text generator
- image to emoji art
- ASCII art generator
- heart text art
- birthday text art
- good night / love / thank you emoji art

MojiMoon fit:

- Strong when the result is generated, previewed, copied, or downloaded.
- Prioritize mobile editing and a compact preview over long galleries.

### Seasonal And Intent Pages

Examples:

- birthday emoji message
- thank you emoji
- good night emoji
- congratulations emoji
- apology / sorry emoji
- Christmas, Halloween, New Year decoration

MojiMoon fit:

- Medium to strong.
- Best when presented as a compact picker or builder, not only a list article.

### Lower-Fit Areas

Be cautious with:

- pure dictionary-style emoji meanings
- generic blog articles with no tool workflow
- high-competition generator keywords where MojiMoon cannot offer a differentiated interface
- unrelated AI image/generic design tools that do not connect to expressive text, emoji, or copy/paste workflows

## Scoring

Use a simple 1-5 score for each candidate:

| Factor | Question |
| --- | --- |
| Demand | Is there measurable volume or a large long-tail cluster? |
| Fit | Does it belong naturally on MojiMoon? |
| Tool Potential | Can it become an interactive utility? |
| Mobile Advantage | Can MojiMoon beat competitors on mobile UX? |
| Integration | Can it reuse existing data, components, or navigation? |
| Bilingual Potential | Can Japanese and English versions ship together? |
| Difficulty | Is the first useful version realistic to build quickly? |

Prioritize candidates with high demand, high tool potential, and high integration. Avoid topics that only score well on volume.

## Research Output Format

For each Semrush research pass, record:

```text
Date:
Market:
Seed keyword/domain:
Competitors observed:
Candidate keywords:
Intent:
Volume/KD/CPC if available:
SERP notes:
MojiMoon fit:
Recommended page/tool:
Priority:
Next action:
```

## Current Active Track

Beyond Lets-Emoji remains the first active cluster:

- topic emoji copy pages
- stronger mobile copy workflow
- scalable topic navigation
- bilingual pages by default
- GA4/GSC performance monitoring

See:

- `docs/beyond-lets-emoji.md`
- `docs/recent-page-monitor.md`

## Candidate Exploration Backlog

Next Semrush passes should investigate:

- `fancy text generator`
- `aesthetic text generator`
- `discord emoji maker`
- `slack emoji generator` adjacent terms
- `emoji text generator`
- `image to emoji`
- `text art generator`
- `heart text art`
- `birthday emoji`
- `thank you emoji`
- `good night emoji`
- Japanese equivalents for symbols, kaomoji, decoration, and copy/paste workflows

## Operating Rule

Do not treat Semrush research as a one-time report. Treat it as a recurring product discovery loop:

1. Find opportunity clusters.
2. Score fit and tool potential.
3. Ship small bilingual tool pages.
4. Submit important URLs to GSC.
5. Track GA4 first, then GSC.
6. Expand, merge, or retire based on measured performance.
