# Semrush Research Conclusion - 2026-05-23

## Executive Decision

The next MojiMoon build should be:

```text
Fancy Text Generator / おしゃれ文字変換
```

Recommended route pair:

- `/fancy-text-generator/`
- `/en/fancy-text-generator/`

This should be built as a real Unicode text conversion tool, not an article or static list.

## Why This Is The Best Next Opportunity

The fancy/stylish text cluster has the strongest combination of:

- measurable US and JP demand
- strong fit with MojiMoon's copy/paste identity
- fast implementation using existing text-tool patterns
- natural internal links to special characters, kaomoji, emoji copy, emoji combinations, and Slack emoji
- bilingual potential from day one
- room to expand into standalone sub-tools later

## Semrush Metrics Captured

Slow, one-keyword-at-a-time Semrush collection was used after the proxy showed a request-frequency warning.

| Keyword | Market | Volume | KD | Intent | Global Volume | CPC | Notes |
| --- | --- | ---: | ---: | --- | ---: | ---: | --- |
| `fancy text generator` | US | 60.5K | 67 | Informational | 236.7K | $0.32 | Strong head term, but competitive. |
| `small text generator` | US | 27.1K | 34 | Informational | 60.0K | $0.01 | Strong P0 sub-tool and likely future standalone route. |
| `upside down text generator` | US | 9.9K | 28 | Informational | 19.6K | $0.01 | Good second standalone route candidate. |
| `bubble text generator` | US | 1.3K | 28 | Informational | 3.4K | $0 | Include as MVP style tab; standalone route can wait. |
| `aesthetic text generator` | US | 880 | 50 | Informational | 5.1K | $0 | Use as supporting social-bio language, not the main target. |
| `おしゃれ 文字` | JP | 14.8K | 35 | Informational | 15.0K | $0 | Best Japanese positioning anchor. |
| `特殊文字 コピペ` | JP | 9.9K | N/A | N/A | 9.9K | $0 | Existing page should be strengthened. |

Additional Japanese note:

- Exact `フォント変換 コピペ` showed 0 volume in Semrush JP.
- Related `フォント 変換 コピペ` showed 2.9K volume / KD 44.
- Therefore, include `フォント変換` wording in copy, but do not make it the primary target.

## Product Recommendation

MVP feature set:

- input text
- live transformed output rows
- grouped style tabs:
  - Popular
  - Cute / Kawaii
  - Small Text
  - Bold / Italic
  - Bubble / Circled
  - Upside Down
  - Gothic / Serif
  - Fullwidth / Aesthetic
- copy button per output row
- recent/favorite support if easy to reuse from existing patterns
- compatibility note that output is Unicode text, not font files
- internal links to:
  - `/special-characters/`
  - `/kaomoji/`
  - `/emoji-copy/`
  - `/emoji-combinations/`
  - `/slack-emoji-generator/`

## SEO Positioning

Japanese page:

```text
title: おしゃれ文字変換・フォント変換 | コピペできる可愛い文字 - MojiMoon
description: 普通の文字を、おしゃれ文字・かわいい文字・小さい文字・丸文字・逆さ文字に変換してコピペできる無料ツール。Instagram、X、LINE、Discordの名前やプロフィールに使えます。
```

English page:

```text
title: Fancy Text Generator | Copy and Paste Unicode Fonts - MojiMoon
description: Convert plain text into fancy Unicode styles, small text, bubble letters, upside down text, bold, italic, gothic, and aesthetic text for bios, names, chats, and posts.
```

## Priority Queue

| Priority | Work | Reason |
| --- | --- | --- |
| P0 | Build `/fancy-text-generator/` and `/en/fancy-text-generator/` | Best demand, fit, speed, and bilingual value. |
| P0 | Include `small text` prominently in MVP | US 27.1K, KD 34. |
| P0 | Include `upside down text` prominently in MVP | US 9.9K, KD 28. |
| P0 | Strengthen `/special-characters/` | JP `特殊文字 コピペ` remains strong at 9.9K. |
| P1 | Create standalone `/small-text-generator/` if MVP performs | Strong sub-tool demand. |
| P1 | Create standalone `/upside-down-text-generator/` if MVP performs | Easier KD and clear utility intent. |
| P1 | Add Discord emoji maker later | Good tool fit, but more export/QA work. |
| P1 | Add text-art / ASCII generator later | Good brand fit, but larger implementation scope. |

## Additional Direction Check

The user suggested three additional Japanese directions:

- fullwidth/halfwidth text conversion
- kanji / hiragana / katakana conversion
- seal / stamp maker

Quick data check:

| Direction | Representative Keyword | Market | Volume | KD | Intent | Global Volume | CPC | Keyword Ideas | Initial Read |
| --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | --- |
| Fullwidth / halfwidth conversion | `全角 変換` | JP | 14.8K | 28 | Informational | 15.0K | $1.34 | 2.3K | Strong tool fit, easy KD, high cluster volume. |
| Kana conversion | `ひらがな カタカナ 変換` | JP | 2.4K | 9 | Informational | 2.5K | $0 | 297 | Very easy KD, useful as a module but lower demand. |
| Seal / stamp maker | `印鑑 作成` | JP | 18.1K | 47 | Commercial | 18.4K | $0.91 | 862 | Large demand, but commercial and less aligned with MojiMoon's text-copy identity. |

Useful related terms:

| Keyword | Market | Volume | KD / Source | Notes |
| --- | --- | ---: | --- | --- |
| `全角 半角 変換` | JP | 14.8K | 32 / Semrush | Same cluster as `全角 変換`. |
| `半角 全角 変換` | JP | 14.8K | 28 / Semrush | Same cluster; likely should be covered in the same tool. |
| `excel 全角 半角 変換` | JP | 2.4K | 17 / Semrush | Spreadsheet use case; useful FAQ/section, not MojiMoon's main angle. |
| `excel 半角 全角 変換` | JP | 2.4K | 17 / Semrush | Same as above. |
| `カタカナ ひらがな 変換` | JP | 2.4K | Public API | Should be handled by the same kana converter UI. |
| `漢字 ひらがな 変換` | JP | 1.6K | Public API | Furigana/reading conversion; more complex than simple Unicode/kana normalization. |
| `ひらがな 漢字 変換` | JP | 1.6K | Public API | Harder to solve accurately because it requires IME-like candidate selection. |
| `ふりがな 変換` | JP | 590 | Public API | Could be a later reading-support tool if implementation quality is high. |
| `電子印鑑 作成` | JP | 2.4K | Public API | Commercial office-tool intent; high CPC in public data. |
| `印鑑 作成 画像` | JP | 2.4K | 31 / Semrush | More image/export oriented. |
| `印鑑 画像 作成` | JP | 2.4K | 32 / Semrush | More image/export oriented. |
| `エクセル で 印鑑 作成` | JP | 1.0K | 20 / Semrush | Practical office intent, but outside current MojiMoon core. |

Initial priority among these three:

1. `全角 / 半角 変換`: best fit for MojiMoon. It is text-only, copy/paste oriented, high-volume, and easy to add near the fancy text tool.
2. `ひらがな / カタカナ 変換`: good utility module, very easy KD, but lower volume. Better as part of a broader Japanese text converter than a first standalone page.
3. `印鑑 作成`: high volume and monetizable, but commercial intent and image/export requirements make it less aligned with the current Unicode/text tool roadmap.

Recommendation:

- Add a future Japanese text converter cluster after the fancy text generator:

```text
/zenkaku-hankaku-converter/
```

- Consider the product label:

```text
全角・半角変換ツール
```

- Include modules for:
  - halfwidth to fullwidth
  - fullwidth to halfwidth
  - kana normalization
  - optional hiragana/katakana conversion

- Defer stamp/seal maker unless MojiMoon intentionally expands into office/image generators.

## Operating Note

The Semrush proxy rate-limited rapid automated navigation with:

```text
请求过于频繁, 请1分钟后再试
```

Future Semrush collection should use one keyword at a time with at least 60 seconds between page loads, or use Semrush exports for larger keyword sets.

Detailed research log:

- `docs/semrush-opportunity-research-2026-05-23.md`
- `docs/semrush-opportunity-radar.md`
- `docs/semrush-access-runbook.md`
