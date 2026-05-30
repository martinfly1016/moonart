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

Concise conclusion file:

- `docs/semrush-research-conclusion-2026-05-23.md`

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

## Continuation Browser Research - 2026-05-23

Semrush session status during continuation:

- Codex in-app browser was unavailable in this environment.
- Direct Semrush metrics still were not collected.
- This continuation used public SERP/browser checks and existing local MojiMoon page review.

### Updated Market Read

The public SERP increasingly confirms that the P0 opportunity is not only a single `fancy text generator` page. The stronger pattern is a compact Unicode/copy-paste tool matrix:

- fancy text generator
- small text generator
- upside down text generator
- bubble / circled text generator
- aesthetic / social bio text
- special characters / symbols
- kaomoji
- dividers and profile decorations

This matters because MojiMoon already has several adjacent pages:

- `/special-characters/`
- `/en/special-characters/`
- `/kaomoji/`
- `/en/kaomoji/`
- `/emoji-combinations/`
- `/en/emoji-combinations/`
- `/slack-emoji-generator/`
- `/en/slack-emoji-generator/`

The first new page should therefore behave like a hub-style tool and not as an isolated thin converter.

### Competitor Pattern Updates

#### GlamGlyphs

Observed pattern:

- Positions itself around fancy text, symbols, emoji, dividers, and bio-ready glyphs.
- Exposes many focused pages from one ecosystem: fancy text, small text, Instagram bio symbols, TikTok bio symbols, Discord symbols, name symbols, cute symbols, aesthetic symbols, dividers, hearts, stars, arrows, brackets, kaomoji, and more.

Implication for MojiMoon:

- Build `fancy text generator` with internal links into symbol and emoji tools from day one.
- Do not wait to create the larger matrix, but design the page so future style-specific routes can reuse the same data/transform engine.

Source:

- `https://glamglyphs.com/`

#### TypeWarp

Observed pattern:

- Uses a many-tool directory model.
- Groups tools by intent: dark/horror, social fonts, style/fancy, text tools, symbols, translators.
- Explains the Unicode distinction clearly: output is standard Unicode text rather than a downloaded font.

Implication for MojiMoon:

- The MojiMoon page should include a short, practical compatibility note: "These are Unicode characters, not font files."
- Tool tabs should be organized by user intent rather than by technical Unicode block.

Source:

- `https://www.typewarp.com/`

#### Japanese Fancy Text Competitors

Observed competitors:

- `https://fontemoji.art/ja`
- `https://www.i2text.com/ja/cool-text-font-generator`
- `https://fancytextcopyandpaste.com/ja`
- `https://www.i2symbol.com/ja/cool-letters`
- `https://fancymytext.com/jp/`

Common pattern:

- Japanese pages often position around `おしゃれ文字`, `かわいいフォント`, `フォント変換`, `特殊文字`, `インスタ`, and `コピペ`.
- The strongest Japanese fit is probably not a literal translation of `fancy text generator`; it should target `おしゃれ文字変換`, `おしゃれ文字 コピペ`, `かわいい文字`, and connect to `特殊文字 コピペ`.

Implication for MojiMoon:

- Japanese route should probably be framed as:

```text
おしゃれ文字変換・フォント変換
```

- English route can be framed as:

```text
Fancy Text Generator
```

Suggested first route pair remains:

- `/fancy-text-generator/`
- `/en/fancy-text-generator/`

But the Japanese page title/meta should emphasize `おしゃれ文字変換` first.

#### Japanese Special Character Competitors

Observed competitors:

- `https://mojihenkan.com/special-characters/`
- `https://fontnavi.com/symbol/`

Common pattern:

- Larger symbol inventory claims are used prominently.
- Competitors emphasize one-click copy, symbol categories, and SNS/profile usage.
- Some pages include broader categories than MojiMoon currently exposes, including math symbols, music symbols, zodiac, chess, kana/kanji, line drawing, and boxed/circled characters.

Implication for MojiMoon:

- Existing `/special-characters/` is directionally correct, but should be expanded after P0 with more categories and stronger search filters.
- Before creating many subpages, strengthen the base data set and navigation.

### Discord / Custom Emoji Update

Public checks still support the P1 custom emoji cluster, especially because official platform requirements create clear tool constraints:

- Discord support states custom emoji files must be under 256KB and use supported image formats such as JPEG, PNG, GIF, or WebP.
- Discord help also references 128 x 128 px as the optimal upload size, with display resizing after upload.
- Slack support recommends square images under 128KB with transparent backgrounds.

Implication for MojiMoon:

- A future `/en/discord-emoji-maker/` should not just duplicate the Slack text-stamp page.
- It should add platform presets and validation:
  - Discord: 128 x 128, under 256KB, PNG/GIF/WebP/JPEG
  - Slack: square, under 128KB, transparent background preferred
  - optional later: Twitch emote sizes
- The current Slack generator engine can be reused, but the product should become a "custom chat emoji maker" engine with platform-specific routes.

Sources:

- `https://support.discord.com/hc/articles/360036479811`
- `https://discord.com/blog/beginners-guide-to-custom-emojis`
- `https://slack.com/intl/en-gb/help/articles/206870177-Add-customised-emoji-and-aliases-to-your-workspace`

### ASCII / Text Art Update

Observed competitors:

- `https://textartify.com/`
- `https://www.fontb.com/ascii-generator`
- `https://ezascii.com/`
- `https://ascii-art-generator.net/`

Common pattern:

- Competitors bundle text-to-ASCII banners, image-to-ASCII, galleries, symbol libraries, kaomoji, and quick copy tools.
- Text-to-ASCII pages often advertise many FIGlet-style fonts and copy/download image output.
- Image-to-ASCII is useful but heavier and can be awkward on mobile when copied into narrow text fields.

Implication for MojiMoon:

- Keep ASCII/Text Art as P1, not P0.
- First version should favor mobile-copyable text outputs:
  - short one-line text art
  - text banners with a small set of readable styles
  - emoji/text dividers
  - copy/download
- Image-to-ASCII can come later if Semrush confirms enough demand or if the image-to-emoji direction becomes strategic.

### Refined Build Recommendation

First build:

```text
Fancy Text Generator / おしゃれ文字変換
```

Why this should come before Discord and ASCII:

- It reuses the existing text-tool page model.
- It is bilingual from day one.
- It reinforces `/special-characters/` instead of creating a disconnected feature.
- It can create multiple future route targets without needing new rendering infrastructure.

MVP feature set:

- Input text with live conversion.
- Style tabs:
  - Popular
  - Cute / Kawaii
  - Small Text
  - Bold / Italic
  - Bubble / Circled
  - Upside Down
  - Gothic / Serif
  - Fullwidth / Aesthetic
- Output rows with:
  - preview text
  - style label
  - copy button
  - favorite/recent support if quick to reuse from current patterns
- Compatibility note:
  - Unicode text, not real font files.
  - Some platforms may not display every style.
- Internal links:
  - special characters
  - kaomoji
  - emoji combinations
  - emoji copy
  - Slack emoji generator

Suggested Japanese metadata:

```text
title: おしゃれ文字変換・フォント変換 | コピペできる可愛い文字 - MojiMoon
description: 普通の文字を、おしゃれ文字・かわいい文字・小さい文字・丸文字・逆さ文字に変換してコピペできる無料ツール。Instagram、X、LINE、Discordの名前やプロフィールに使えます。
```

Suggested English metadata:

```text
title: Fancy Text Generator | Copy and Paste Unicode Fonts - MojiMoon
description: Convert plain text into fancy Unicode styles, small text, bubble letters, upside down text, bold, italic, gothic, and aesthetic text for bios, names, chats, and posts.
```

### Semrush Data Still Needed

Chrome/Semrush access note from continuation:

- The user restored the browser login and Chrome could open Semrush Keyword Overview URLs.
- Local automation could read the active Chrome tab title/URL, confirming the Semrush keyword overview page opened.
- Codex Chrome Extension control still failed after restarting Chrome.
- macOS screen capture returned a black image, Computer Use timed out, and Chrome had AppleScript JavaScript execution disabled.
- Direct `curl` to `sem.3ue.co` without browser session still redirected to the expired-login page.
- After enabling Chrome's Apple Events JavaScript setting, DOM text extraction worked for Semrush Keyword Overview pages.
- A rapid automated keyword loop triggered a "requests too frequent" warning from the Semrush proxy. Stop automated batches immediately when this appears. Future Semrush browser collection should use slower pacing, small batches, and preferably Semrush exports for larger keyword lists.

Result: DOM text extraction is now possible, but the Semrush proxy rate-limited rapid collection. Most exact Semrush KD, intent, SERP features, and Keyword Magic cluster data still need slower manual collection or Semrush export. Public keyword API values below are verified and current for this research pass, but they are not a replacement for Semrush KD and SERP data.

Partial Semrush data captured before the rate-limit warning:

| Market | Keyword | Semrush Volume | KD | Intent | Global Volume | CPC | Keyword Ideas / Notes |
| --- | --- | ---: | ---: | --- | ---: | ---: | --- |
| US | `fancy text generator` | 60,500 | 67 | Informational | 236,700 | 0.32 | 637 keyword ideas; requires roughly 168 referring domains per Semrush estimate. |
| US | `small text generator` | 27,100 | 34 | Informational | 60,000 | 0.01 | Strong P0 sub-tool. Keyword Ideas count did not render in the captured text. |
| US | `upside down text generator` | 9,900 | 28 | Informational | 19,600 | 0.01 | 51 keyword ideas; easier KD than the head term. |
| US | `bubble text generator` | 1,300 | 28 | Informational | 3,400 | 0 | 143 keyword ideas; small exact term, but cluster includes `text bubble generator` 1.0K. |
| US | `aesthetic text generator` | 880 | 50 | Informational | 5,100 | 0 | 55 keyword ideas; lower exact demand and harder than expected. |
| JP | `おしゃれ 文字` | 14,800 | 35 | Informational | 15,000 | 0 | 578 keyword ideas; related `文字 フォント おしゃれ` 8.1K and `おしゃれ 文字 コピペ` 2.9K. |
| JP | `特殊文字 コピペ` | 9,900 | N/A | N/A | 9,900 | 0 | 41 keyword ideas; related `instagram 特殊 文字 コピペ` 2.9K. |
| JP | `フォント変換 コピペ` | 0 | N/A | N/A | 30 | 0 | Exact no-volume result, but related `フォント 変換 コピペ` shows 2.9K / KD 44. Treat spacing variant as the useful signal. |

Important handling note:

- Do not continue automated Semrush browser collection at high speed.
- For additional Semrush metrics, use manual export or collect one keyword at a time with 15-30 second pauses.
- Several partial pages loaded without summary values before the rate-limit warning; do not treat those as zero-volume Semrush results.

Public API re-check from `https://app.seodata.dev/v1/keyword` on 2026-05-23:

| Market | Keyword | Volume | CPC | Competition | Cache |
| --- | --- | ---: | ---: | ---: | --- |
| US | `fancy text generator` | 74,000 | 3.97 | 0 | cached |
| US | `small text generator` | 27,100 | 0.07 | 0 | cached |
| US | `upside down text generator` | 12,100 | 0.11 | 0 | cached |
| US | `ascii art generator` | 12,100 | 2.66 | 0 | cached |
| US | `bubble text generator` | 1,900 | 0 | 0 | cached |
| US | `discord emoji maker` | 1,900 | 0 | 0 | cached |
| US | `aesthetic text generator` | 1,300 | 0 | 0 | cached |
| JP | `おしゃれ 文字` | 18,100 | 0.36 | 0.02 | cached |
| JP | `特殊文字 コピペ` | 12,100 | 2.35 | 0 | cached |
| JP | `絵文字 組み合わせ` | 8,100 | 0 | 0 | cached |
| JP | `フォント変換 コピペ` | 3,600 | 1.84 | 0 | fresh |
| JP | `おしゃれ文字変換` | 1,600 | 0.92 | 0 | fresh |
| JP | `アスキーアート 作成` | 880 | 0 | 0 | cached |
| JP | `かわいい文字 コピペ` | 0 | 0 | 0 | fresh |

Updated interpretation:

- `fancy text generator` remains the strongest English entry point, but KD 67 makes it a competitive head term. The page needs to be a useful tool hub, not only an exact-match page.
- `small text generator` is large enough for a prominent MVP section and likely a standalone route soon after launch.
- `upside down text generator` has meaningful volume and easier KD; it is a good second standalone route once the shared converter engine exists.
- `bubble text generator` is smaller but easier and has a broader bubble-letter cluster. Include it as a style tab in MVP; route decision can wait.
- `aesthetic text generator` has lower exact-match Semrush volume and harder KD than public API suggested. Treat it as supporting social-bio language rather than the primary URL target.
- Japanese positioning should lead with `おしゃれ 文字` / `おしゃれ文字` and include `文字 フォント おしゃれ`, `おしゃれ 文字 コピペ`, and `フォント 変換 コピペ` variants in copy. Do not rely on exact `フォント変換 コピペ` as the primary target.
- `特殊文字 コピペ` remains a high-value existing-page opportunity and should be strengthened even if the fancy text generator ships first.

When Semrush access is readable, validate these exact items before or immediately after launch:

| Market | Seed | Need |
| --- | --- | --- |
| US | `fancy text generator` | Volume, KD, intent, top pages, Keyword Magic clusters |
| US | `small text generator` | Whether standalone route should launch with MVP |
| US | `upside down text generator` | Whether standalone route should launch later |
| US | `bubble text generator` | Long-tail value and SERP difficulty |
| US | `aesthetic text generator` | Cluster terms around bio/social |
| JP | `おしゃれ 文字` | Confirm whether `文字変換` or `コピペ` modifiers dominate |
| JP | `おしゃれ文字変換` | Volume/KD and top URLs |
| JP | `フォント変換 コピペ` | Whether to mention `フォント変換` in title |
| JP | `かわいい文字 コピペ` | Fit for style tab/standalone page |
| JP | `特殊文字 コピペ` | Expansion terms for existing page |

### Updated Priority Queue

| Priority | Work | Rationale |
| --- | --- | --- |
| P0 | Build `/fancy-text-generator/` and `/en/fancy-text-generator/` | Best demand/fit/speed combination; strengthens the whole text-tool cluster. |
| P0 | Expand special-character data categories | Helps existing indexed page and feeds the fancy text tool with internal links. |
| P1 | Add standalone style routes only after data review | `small text`, `upside down`, `bubble text` may deserve routes, but should share one engine. |
| P1 | Plan `/en/discord-emoji-maker/` on top of Slack engine | Strong tool intent but more image/export QA. |
| P1 | Plan `/text-art-generator/` and `/en/text-art-generator/` | Good brand fit, but implementation scope is larger. |

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
