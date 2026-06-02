# Beyond Lets-Emoji Monitor - 2026-06-02

Date range:

- GA4/GSC monitor: `2026-05-02` to `2026-05-30`
- Output files are local-only because `reports/recent-pages/` is ignored:
  - `reports/recent-pages/2026-05-30/recent-pages_2026-05-02_2026-05-30.md`
  - `reports/recent-pages/2026-05-30/recent-pages_2026-05-02_2026-05-30.json`
  - `reports/recent-pages/2026-05-30/recent-pages_2026-05-02_2026-05-30.csv`

## Summary

| Metric | Value |
| --- | ---: |
| Pages tracked | 92 |
| GSC clicks | 345 |
| GSC impressions | 13,095 |
| GSC CTR | 2.63% |
| GSC avg position | 7.04 |
| GA page views | 688 |
| GA active users | 486 |
| GA sessions | 537 |
| GA engagement rate | 62.38% |

## Strongest Signals

| Page | GSC Clicks | Impressions | CTR | Position | Note |
| --- | ---: | ---: | ---: | ---: | --- |
| `/emoji-copy/sparkle/` | 84 | 3,313 | 2.54% | 5.26 | High impressions, CTR still worth improving. |
| `/emoji-copy/kawaii/` | 90 | 2,401 | 3.75% | 7.06 | Good traffic base; recent content work should be monitored. |
| `/kawaii-copy/divider-line/` | 23 | 648 | 3.55% | 6.68 | Good proof that copy-tool pages can compete with blog pages. |
| `/kawaii-copy/` | 19 | 484 | 3.93% | 7.12 | Hub is receiving broad cute-copy demand. |
| `/special-characters/flower/` | 10 | 409 | 2.44% | 5.20 | Generated special-character page is already near page one. |
| `/special-characters/line/` | 9 | 294 | 3.06% | 7.10 | Generated divider/line topic is working. |
| `/special-characters/number/` | 7 | 187 | 3.74% | 5.96 | Generated number-symbol topic is working. |
| `/emoji-combinations/birthday/` | 10 | 99 | 10.10% | 4.74 | Strong generated combination page, should receive more internal links. |

## Follow-Up Optimizations Made

Based on low CTR or near-page-one impressions, updated `_content/ja-copy-pages.json` and regenerated output pages/data for:

- `/special-characters/ribbon/`
  - Added visible coverage for `ˏˋ ˎˊ コピペ`, `ドットリボン コピペ`, and `でかい リボン 絵文字 コピペ`.
- `/kaomoji/sleepy/`
  - Reframed around `うとうと顔文字` as well as `眠い顔文字`.
  - Added visible sections for `うとうと 顔文字`, `おやすみ 絵文字 コピペ`, and `寝る 顔文字`.
- `/kaomoji/hug/`
  - Reframed around `ぎゅー顔文字` as well as `ハグ顔文字`.
  - Added visible sections for `ぎゅー 顔文字`, `ぎゅーして 顔文字`, and `ぎゅー 顔文字 かわいい`.
- `/kaomoji/thank-you/`
  - Reframed around `感謝顔文字` as well as `ありがとう顔文字`.
  - Added visible sections for `感謝 顔文字 かわいい`, `ありがとう かわいい文字`, and `ありがとう aa コピペ`.

## Next Actions

- Add more internal links toward generated winners:
  - `/special-characters/flower/`
  - `/special-characters/line/`
  - `/special-characters/number/`
  - `/emoji-combinations/birthday/`
- Watch the four updated pages after the next crawl cycle:
  - `/special-characters/ribbon/`
  - `/kaomoji/sleepy/`
  - `/kaomoji/hug/`
  - `/kaomoji/thank-you/`
- Keep zero-impression generated pages in the monitor, but avoid rewriting them until they have either indexing evidence or GA traffic.
