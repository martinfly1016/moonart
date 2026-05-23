# Semrush Opportunity Research - 2026-05-23

## Scope

This is the first broader MojiMoon opportunity pass after defining the Semrush Opportunity Radar.

The goal is to look beyond the Beyond Lets-Emoji topic cluster and find tool-type search demand that can be integrated into MojiMoon.

## Data Status

Semrush proxy status during this pass:

- Direct Semrush proxy access redirected to `dash.3ue.co`.
- The proxy response indicated the login was expired or invalid.
- Exact Semrush `Volume`, `KD`, `CPC`, `Intent`, and Keyword Magic clusters still need to be filled after the Semrush session is restored.

Because the session was unavailable, this pass used:

- existing historical Semrush notes from MojiMoon work logs
- current public SERP checks
- public keyword volume cross-checks from `seodata.dev`
- fit scoring from `docs/semrush-opportunity-radar.md`

Treat the numbers below as directional until the Semrush session is restored.

## Executive Summary

Best next tool-family candidate:

```text
Unicode / Fancy Text Tools
```

Why:

- The demand is clearly tool-shaped.
- The output is copy/paste text, which matches MojiMoon's core behavior.
- Several sub-tools are easy to ship as compact mobile utilities.
- It can connect to existing `special-characters`, `kaomoji`, `emoji-copy`, and social/chat use cases.
- It creates a broader tool matrix rather than only adding more emoji topic pages.

Recommended first build:

```text
/fancy-text-generator/
/en/fancy-text-generator/
```

Do not make it a generic article page. Build it as a fast converter with style tabs, preview rows, copy buttons, favorites/recent history, and links into symbol/emoji tools.

## Directional Keyword Snapshot

Public US cross-checks:

| Keyword | US Volume | CPC | Notes |
| --- | ---: | ---: | --- |
| `fancy text generator` | 74,000 | 3.97 | Large head term, competitive, but very strong tool intent. |
| `small text generator` | 27,100 | 0.07 | Strong sub-tool. Good candidate as a style module and standalone SEO route later. |
| `upside down text generator` | 12,100 | 0.11 | Simple utility, easy to implement, clear copy/paste intent. |
| `ascii art generator` | 12,100 | 2.66 | Strong fit with MojiMoon's existing text-art identity. More implementation complexity. |
| `text art generator` | 3,600 | 3.08 | Smaller but high fit. Can connect to moon emoji text and ASCII art. |
| `discord emoji maker` | 1,900 | 0 | Better phrasing than `discord emoji generator`; platform-specific intent. |
| `bubble text generator` | 1,900 | 0 | Good sub-style for fancy text cluster. |
| `aesthetic text generator` | 1,300 | 0 | Lower exact volume than expected, but likely part of a broader cluster. |
| `heart text art` | 880 | 0 | Intent/seasonal cluster candidate, not first priority. |
| `emoji text generator` | 880 | 0 | Fits existing moon emoji text, but exact term is smaller. |
| `image to emoji` | 590 | 0 | Interesting, but volume appears smaller and implementation may be heavier. |
| `slack emoji generator` | 140 | 0 | Existing page is useful; exact query is small. |
| `discord emoji generator` | 70 | 0 | Much weaker than `discord emoji maker`. |

Public Japan cross-checks:

| Keyword | JP Volume | CPC | Notes |
| --- | ---: | ---: | --- |
| `おしゃれ 文字` | 18,100 | 0.36 | Very promising Japanese fancy/aesthetic text intent. |
| `特殊文字 コピペ` | 12,100 | 2.35 | Strong existing fit with special characters. |
| `絵文字 組み合わせ` | 8,100 | 0 | Existing emoji combinations page should be strengthened and monitored. |
| `アスキーアート 作成` | 880 | 0 | Fits text-art direction, lower exact demand. |

Historical Semrush context already in the repo:

- `可愛い 顔文字`: 90.5K/mo, KD 20
- `顔文字 かわいい`: 90.5K/mo, KD 20
- `顔文字`: 74.0K/mo, KD 57
- `泣く 顔文字`: 22.2K/mo, KD 25
- `顔文字 一覧`: 14.8K/mo, KD 30
- `猫 顔文字`: 12.1K/mo, KD 15
- `顔文字 コピペ`: 8.1K/mo, KD 15
- `可愛い 顔文字 コピペ`: 4.4K/mo, KD 16
- `うさぎ 顔文字`: 4.4K/mo, KD 19

This confirms that Japanese copy/paste expression tools are already a strong MojiMoon lane.

## SERP And Competitor Notes

### Fancy / Unicode Text

Observed competitors and patterns:

- `fontmaker.io`
- `fontgenix.com`
- `texttrick.com`
- `yaytext.app`
- `glamglyphs.com`
- `fancytext.in`
- `styledtext.com`

Common competitor behavior:

- Many pages expose a simple input box plus a long list of transformed styles.
- Some bundle many adjacent tools: Instagram fonts, TikTok bio, Discord text, symbols, kaomoji, dividers, cute fonts, etc.
- Several pages are broad directories rather than focused mobile workflows.

MojiMoon opportunity:

- Build a cleaner mobile-first converter.
- Make output rows easy to scan, copy, favorite, and reuse.
- Group styles by user intent rather than dumping a huge undifferentiated list:
  - cute / kawaii
  - small text
  - bold / italic
  - bubble / circled
  - upside down
  - gothic / serif
  - social bio
  - Discord / gaming name
- Connect the tool to existing symbols, kaomoji, and emoji pages.

### ASCII / Text Art

Observed competitors:

- `asciify.art`
- `asciiartgenerator.app`
- i2Symbol text/ASCII tools

Common competitor behavior:

- Image-to-ASCII and text-to-ASCII are often separate workflows.
- Some tools support download/copy, but mobile editing can be heavy.
- SERP includes both practical generators and general ASCII art references.

MojiMoon opportunity:

- MojiMoon already has moon emoji text art and image input.
- A broader `/text-art-generator/` could unify:
  - text to emoji art
  - text to ASCII-style art
  - image to emoji/text art
  - copy text
  - download image
- This is a stronger product direction than a thin `emoji text generator` page alone.

### Discord / Slack Emoji

Observed sources:

- Slack's own custom emoji guidance
- Discord's emoji/reaction guidance and Emoji Studio rollout
- Fotor Discord emoji maker
- Kittl Discord emoji maker
- MakeEmoji
- Emoji Studio for Slack
- MojiMoon already ranks/appears for Slack Emoji Generator in current SERP checks

Important insight:

- `discord emoji maker` appears more promising than `discord emoji generator`.
- `slack emoji generator` exact-match demand is small, but MojiMoon already has a live tool and should keep it as part of a broader custom emoji cluster.
- Platform terms are product-led: users want correct sizing, transparent background, readable tiny previews, and download-ready files.

MojiMoon opportunity:

- Expand existing Slack emoji generator into a custom emoji hub:
  - `/en/slack-emoji-generator/`
  - `/en/discord-emoji-maker/`
  - Japanese equivalents if Semrush confirms demand
- Reuse the same core image/text rendering engine.
- Add platform presets: Slack, Discord, Twitch, Teams.
- Add tiny-size preview because emoji often appears very small in chat.

## Scoring

Scores are 1-5, where 5 is strongest. Difficulty is scored as ease of first useful launch.

| Candidate | Demand | Fit | Tool Potential | Mobile Advantage | Integration | Bilingual | Difficulty | Priority |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Fancy text generator cluster | 5 | 5 | 5 | 4 | 5 | 5 | 4 | P0 |
| Small text / upside down / bubble sub-tools | 4 | 5 | 5 | 5 | 5 | 5 | 5 | P0 |
| Japanese stylish/special text cluster | 5 | 5 | 5 | 4 | 5 | 5 | 4 | P0 |
| Text art / ASCII art generator | 4 | 5 | 5 | 4 | 4 | 4 | 3 | P1 |
| Discord emoji maker | 3 | 4 | 5 | 4 | 4 | 4 | 3 | P1 |
| Emoji text generator expansion | 3 | 5 | 5 | 4 | 5 | 5 | 4 | P1 |
| Image to emoji | 2 | 5 | 5 | 4 | 4 | 4 | 2 | P2 |
| Seasonal text art pages | 2 | 4 | 4 | 4 | 4 | 5 | 4 | P2 |

## Recommended Roadmap

### P0: Unicode / Fancy Text Generator

Suggested routes:

- `/fancy-text-generator/`
- `/en/fancy-text-generator/`

Japanese positioning should target:

- `おしゃれ 文字`
- `特殊文字 コピペ`
- related stylish text / copy-paste phrasing found in the next Semrush session

English positioning should target:

- `fancy text generator`
- `small text generator`
- `upside down text generator`
- `bubble text generator`
- `aesthetic text generator`

MVP tool:

- input text
- live transformed output rows
- grouped style tabs
- copy button per row
- mobile copy draft / recent history if useful
- favorites
- social preview labels: Instagram, TikTok, Discord, X, profile bio
- internal links to special characters, kaomoji, emoji copy, emoji combinations

Implementation advantage:

- Mostly Unicode mapping and existing copy UI.
- Can ship faster than image-heavy tools.
- Good bridge between Japanese and English demand.

### P1: Strengthen Existing Japanese Special Characters

Suggested routes:

- strengthen `/special-characters/`
- strengthen `/en/special-characters/`
- consider Japanese topic pages under `/special-characters/` if Semrush confirms:
  - stylish text
  - hearts/stars/arrows
  - dividers/borders
  - brackets

Reason:

- `特殊文字 コピペ` appears strong.
- Existing MojiMoon infrastructure already supports this page family.

### P1: Text Art / ASCII Art Generator

Suggested routes:

- `/text-art-generator/`
- `/en/text-art-generator/`
- possibly `/ascii-art-generator/` only if Semrush confirms the exact keyword is worth a separate route

MVP direction:

- Start with text-to-art and emoji/text output rather than full image-to-ASCII.
- Connect directly to current moon emoji text generator.
- Later add image-to-art if performance and demand justify it.

### P1: Discord Emoji Maker

Suggested routes:

- `/en/discord-emoji-maker/`
- Japanese route only after Semrush JP validation.

MVP direction:

- Reuse Slack emoji generator engine.
- Add platform selector with size and export presets.
- Add tiny preview at 16px/32px/64px.
- Keep the workflow narrow: upload/type, crop/fit, preview, download.

## What To Check In Semrush Once Login Is Restored

For each P0/P1 candidate, collect:

- US and JP `Volume`
- KD
- CPC
- Intent
- Keyword Magic clusters
- phrase-match variants
- top SERP URLs
- SERP features
- competitor organic pages

Immediate Semrush seeds:

```text
fancy text generator
small text generator
upside down text generator
bubble text generator
aesthetic text generator
おしゃれ 文字
特殊文字 コピペ
絵文字 組み合わせ
ascii art generator
text art generator
discord emoji maker
emoji text generator
```

## Decision

The next build should likely be:

```text
Fancy Text Generator / Stylish Text Generator
```

This has the best combination of demand, MojiMoon fit, implementation speed, mobile UX advantage, bilingual potential, and internal-link value.

The product framing should be:

- not a font article
- not a static list
- a fast Unicode text styling tool for bios, usernames, chats, Discord, TikTok, Instagram, and copy/paste decoration

## Sources

- Semrush public keyword tools and methodology pages:
  - `https://www.semrush.com/free-tools/keyword-search-volume-checker/`
  - `https://www.semrush.com/free-tools/keyword-checker`
  - `https://www.semrush.com/analytics/keywordmagic/`
- Public keyword cross-check:
  - `https://app.seodata.dev/v1/keyword`
- Public SERP checks for:
  - `fancy text generator`
  - `small text generator`
  - `upside down text generator`
  - `ascii art generator`
  - `discord emoji maker`
  - `slack emoji generator`
  - `emoji text generator`
  - `image to emoji generator`
- Historical MojiMoon Semrush notes:
  - `docs/work-log-2026-05-17.md`
  - `docs/work-log-2026-05-18.md`
