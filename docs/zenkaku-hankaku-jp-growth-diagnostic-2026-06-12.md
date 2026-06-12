# Zenkaku/Hankaku JP Growth Diagnostic - 2026-06-12

## Question

Why has `/zenkaku-hankaku-converter/` not grown in Japanese search traffic even though the relevant Semrush keywords still show high volume and low KD?

## Sources

- Google Search Console, `sc-domain:mojimoon.com`
- Page: `https://mojimoon.com/zenkaku-hankaku-converter/`
- Main window: 2026-05-23 to 2026-06-09
- Comparison windows:
  - Previous week: 2026-05-27 to 2026-06-02
  - Recent week: 2026-06-03 to 2026-06-09
- Semrush KD spot check captured on 2026-06-12
- Local and production HTML for `/zenkaku-hankaku-converter/`

## Observed GSC Pattern

Page-level GSC totals for 2026-05-23 to 2026-06-09:

| Page | Clicks | Impressions | CTR | Avg Position |
| --- | ---: | ---: | ---: | ---: |
| `/zenkaku-hankaku-converter/` | 2 | 179 | 1.12% | 8.17 |

Weekly comparison:

| Window | Clicks | Impressions | CTR | Avg Position |
| --- | ---: | ---: | ---: | ---: |
| 2026-05-27 to 2026-06-02 | 1 | 86 | 1.16% | 9.38 |
| 2026-06-03 to 2026-06-09 | 1 | 72 | 1.39% | 6.89 |

Visible query rows for 2026-05-23 to 2026-06-09:

| Query | Clicks | Impressions | Avg Position |
| --- | ---: | ---: | ---: |
| `hankaku` | 0 | 8 | 4.63 |
| `hankaku zenkaku` | 0 | 1 | 5.00 |
| `hannaku` | 0 | 2 | 8.50 |
| `sns 全角` | 0 | 1 | 10.00 |
| `zenkaku` | 0 | 9 | 6.33 |
| `zenkaku converter` | 0 | 1 | 10.00 |
| `zenkaku hankaku` | 0 | 8 | 3.63 |
| `半角 数字 変換` | 0 | 1 | 68.00 |
| `半角ジェネレーター` | 0 | 1 | 11.00 |

GSC returned no rows for the full-site query filter `全角 半角 変換` in the same window.

Note: GSC query/country dimension rows are privacy-filtered and do not reconcile to page-level totals. Use page totals for overall trend and query rows for directional query mix only.

## Diagnosis

The page is not failing because keyword difficulty became too high. It is failing to scale because Google has not yet placed MojiMoon into the Japanese head-term candidate set.

Main reasons:

1. The page is still in early testing.
   - Page-level impressions exist, but only 179 impressions over 18 days.
   - Recent-week average position improved from 9.38 to 6.89, so Google is testing the page, but volume has not expanded.

2. Query matching is skewed toward romanized searches.
   - Visible query rows are mostly `zenkaku`, `hankaku`, and `zenkaku hankaku`.
   - The Japanese high-volume head terms `全角 半角 変換`, `全角 変換`, and `半角 全角 変換` are essentially absent.

3. The page title/H1 are relevant but not aggressive enough for exact Japanese head terms.
   - Current title: `全角・半角変換ツール | 英数字・カタカナ・記号を無料変換 - MojiMoon`
   - Current H1: `全角・半角変換ツール`
   - This is semantically close, but the exact query variants with spaces and bidirectional phrasing are not prominent enough across headings, intro copy, and FAQ.

4. Internal links are broad but weakly anchored.
   - Many internal links use `全角半角`.
   - Fewer links use stronger anchors like `全角 半角 変換`, `半角 全角 変換`, `全角を半角に変換`, or `半角を全角に変換`.
   - The linking pages are mostly emoji/kawaii/special-character pages, which are useful for crawl discovery but not perfect topical reinforcement for office/form/text-normalization intent.

5. Search intent may be more utilitarian than MojiMoon's current topical authority.
   - The target cluster has office, form input, Excel, CSV, and Japanese text-normalization intent.
   - MojiMoon has stronger perceived authority in emoji, kawaii copy, special characters, and social text decoration. The converter needs more internal context that makes MojiMoon look credible for practical text cleanup.

## Recommended Fix

Priority should be page relevance and internal anchor reinforcement, not abandoning the tool.

1. Rewrite title/H1/hero to include exact head terms:
   - `全角 半角 変換ツール | 半角 全角 変換・英数字/カタカナ対応 - MojiMoon`
   - H1 candidate: `全角 半角 変換ツール`
   - Add a subheading that explicitly says `全角を半角に変換、半角を全角に変換できます。`

2. Add exact-match sections:
   - `全角を半角に変換`
   - `半角を全角に変換`
   - `全角数字を半角数字に変換`
   - `半角カタカナを全角カタカナに変換`
   - `Excelで使う全角・半角変換`

3. Strengthen internal anchors from high-crawl pages:
   - Replace generic `全角半角` anchors in primary navigation or related cards where appropriate with `全角半角変換`.
   - Add contextual links using `全角 半角 変換`, `半角 全角 変換`, and `英数字を半角に変換`.

4. Add one or two supporting pages only after the main page is strengthened:
   - `/zenkaku-to-hankaku/`
   - `/hankaku-to-zenkaku/`
   These should not be created before the canonical page clearly targets the main cluster.

5. Re-submit the page in GSC and monitor for two signals over 7-14 days:
   - Whether visible query rows start including `全角 変換`, `全角 半角 変換`, and `半角 全角 変換`.
   - Whether impressions expand beyond the current low daily range while average position stays top 10.

## Bottom Line

The market opportunity still exists, but MojiMoon is currently being tested for low-volume romanized queries rather than the Japanese head terms. The next lever is exact Japanese query reinforcement plus stronger internal anchors, not building a different tool.
