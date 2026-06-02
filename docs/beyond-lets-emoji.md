# Beyond Lets-Emoji

Beyond Lets-Emoji is the ongoing MojiMoon project for building a better emoji content and tool experience than static emoji reference sites.

The goal is not to copy lets-emoji.com text. The goal is to learn from its topic coverage and then present each topic as a faster, more useful, mobile-first copy experience.

This project sits inside the broader [Semrush Opportunity Radar](./semrush-opportunity-radar.md), which continuously researches other tool-type search opportunities that can be integrated into MojiMoon.

## Reference Competitors

These sites are reference targets for Beyond Lets-Emoji because they prove that blog-style pages can win large Japanese search traffic in emoji, kaomoji, special character, and SNS decoration queries.

Reference URLs to track:

- `https://hatarakitakunai.blog/`
- `https://hatarakitakunai.blog/post-sitemap.xml`
- `https://hatarakitakunai.blog/feed/`
- `https://hatarakitakunai.blog/kaomoji_souko/`
- `https://hatarakitakunai.blog/yumekawa/`
- `https://hatarakitakunai.blog/cute_set/`
- `https://fasme.asia/lifestyle/culture/tokusyumozi-fasme4941/`

Why they matter:

- `hatarakitakunai.blog` is a focused long-tail content library for kaomoji, ASCII art, symbols, and "ryosangata otaku" cute aesthetics. Its public Yoast sitemap exposes hundreds of post URLs, and the RSS feed shows continued 2026 publishing.
- `hatarakitakunai.blog` pages use a repeatable formula: topic-specific title, short intro, visible item count, many copyable items, related posts, and a storage/history utility.
- `fasme.asia` is broader lifestyle media, but its special-character page ranks with a single large editorial roundup covering cute kaomoji, symbols, divider lines, arrows, hearts, stars, ribbons, flowers, message symbols, and color-based iPhone emoji combinations.
- Public Semrush snapshots show both domains receiving large Japan-heavy organic traffic from terms that overlap MojiMoon's target set, including `可愛い 絵文字`, `絵文字 コピペ`, `絵文字 キラキラ`, `顔 文字 かわいい`, and `可愛い 顔 文字`.

MojiMoon response:

- Do not copy their collections verbatim.
- Beat blog pages with an actual copy workflow: search, filter, card actions, draft composer, recent history, mobile bottom sheet, and cross-links between emoji, kaomoji, special characters, and combinations.
- Use their successful topics as demand signals, then create structured tool pages and original curated datasets.
- Track their sitemaps/RSS monthly to catch new topic patterns early.

## Principles

- Tool first, article second.
- Mobile experience must be better than reference sites.
- Every topic page should let users search, tap items, build a copy draft, and reuse recent items.
- Navigation must scale as the page set grows.
- Japanese and English pages ship together by default.
- Sitemap and hreflang updates are part of every page launch.
- Performance is judged by GA4 and GSC data, not by intuition alone.

## Current Shipped Cluster

Emoji copy topic pages:

- `/emoji-copy/heart/`
- `/emoji-copy/kawaii/`
- `/emoji-copy/sparkle/`
- `/emoji-copy/tear/`
- `/emoji-copy/smile/`
- `/emoji-copy/hand-sign/`
- `/emoji-copy/flower/`
- `/emoji-copy/star/`
- `/emoji-copy/thank-you/`
- `/emoji-copy/sorry/`
- `/emoji-copy/warning/`
- `/emoji-copy/birthday/`
- `/emoji-copy/good-night/`
- `/emoji-copy/good-morning/`
- `/emoji-copy/otsukaresama/`
- `/emoji-copy/congratulations/`
- `/emoji-copy/love/`
- `/emoji-copy/birthday-message/`
- `/emoji-copy/love-message/`
- `/en/emoji-copy/heart/`
- `/en/emoji-copy/kawaii/`
- `/en/emoji-copy/sparkle/`
- `/en/emoji-copy/tear/`
- `/en/emoji-copy/smile/`
- `/en/emoji-copy/hand-sign/`
- `/en/emoji-copy/flower/`
- `/en/emoji-copy/star/`
- `/en/emoji-copy/thank-you/`
- `/en/emoji-copy/sorry/`
- `/en/emoji-copy/warning/`
- `/en/emoji-copy/birthday/`
- `/en/emoji-copy/good-night/`

Generated Japanese copy-page expansion:

- Kaomoji long-tail pages for shy, sleepy, confused, surprised, greetings, thank-you, sorry, hug, kiss, animals, angel, wink, peace, OK/NO, good morning, otsukaresama, good night, and message-oriented otsukaresama.
- Special-character long-tail pages for flowers, ribbons, divider lines, brackets, crowns, music notes, checks, numbers, Instagram, name decoration, and cute symbols.
- Emoji-combination long-tail pages for pink, blue, black, purple, green, love, birthday, thank-you, good-night, and thank-you-message clusters.

Shared experience:

- topic navigation
- search and category tabs
- click-to-add cards
- mobile bottom copy draft sheet
- recent history
- sitemap + hreflang

Kawaii copy workspace:

- `/kawaii-copy/`
- `/kawaii-copy/yumekawa/`
- `/kawaii-copy/name-frame/`
- `/kawaii-copy/divider-line/`
- `/kawaii-copy/ribbon/`
- `/kawaii-copy/ryosangata-otaku/`
- `/kawaii-copy/food/`
- `/kawaii-copy/instagram-profile/`
- `/kawaii-copy/instagram-name/`
- `/kawaii-copy/line-name/`
- `/kawaii-copy/profile/`
- `/kawaii-copy/oshi-profile/`
- `/kawaii-copy/ryosangata-profile/`
- `/kawaii-copy/yumekawa-text/`
- `/kawaii-copy/cute-divider/`

This batch intentionally ships Japanese pages first because the newly added reference competitors and demand signals are Japan-heavy. The workspace adds a cross-tool copy flow for face marks, symbols, dividers, name frames, emoji combinations, global recent history, and saved drafts.

Generated Japanese pages are managed from `_content/ja-copy-pages.json` through `npm run generate:content`. The recent-page monitor now appends this generated source by default, so new generated pages enter the GA4/GSC baseline automatically.

## Measurement

Run the monitor:

```bash
npm run monitor:recent-pages -- --days 28
```

The default run includes fixed core pages plus all generated Japanese copy pages from `_content/ja-copy-pages.json`. Use `--no-generated` only when comparing the older fixed baseline.

Preview the resolved monitor set without making API requests:

```bash
npm run monitor:recent-pages -- --list-pages
```

Default output:

```text
reports/recent-pages/<end-date>/
```

Primary metrics:

- GSC impressions: Google discovery and testing.
- GSC clicks: actual search traffic.
- GSC CTR: title/snippet fit.
- GSC average position: ranking potential.
- GSC top queries: whether Google understands the page intent.
- GA4 page views: all-source traffic.
- GA4 active users: real audience size.
- GA4 engaged sessions and engagement rate: usefulness after landing.

Recommended cadence:

- First 7 days after launch: run every 2-3 days, mainly watching GA4 and indexing.
- Weeks 2-4: run weekly, watching GSC impressions, queries, CTR, and position.
- After 4 weeks: decide whether to expand, rewrite titles, add internal links, or merge weak topics.

## Evaluation Rules

Do not judge a newly shipped page by GSC immediately. Search Console lags.

Useful signals:

- GA appears before GSC: page is reachable and receiving internal/direct traffic.
- GSC impressions appear with low clicks: improve title, meta description, and above-the-fold copy.
- GSC position is near 5-15: add internal links and better query-specific sections.
- Queries are mismatched: adjust heading, intro, FAQ, and card labels.
- No impressions after 3-4 weeks: reconsider topic demand, sitemap discovery, and internal links.

## Candidate Next Topics

High priority:

- Expand winning topic pages with query-specific copy after GSC data appears.
- Add internal links from related tools to the strongest new topics.

Medium priority:

- `flag emoji` / `国旗絵文字` needs a fuller country/region data model before shipping.

Content direction:

- Prefer topic pages that naturally become tools.
- Use explanatory text only after the working copy interface.
- Keep each topic connected to related emoji, kaomoji, special characters, and combinations pages.

## Default Shipping Checklist

- Add Japanese page.
- Add English page.
- Add or update shared data labels and search tags.
- Add topic navigation entry where relevant.
- Add reciprocal language switch.
- Add canonical and hreflang.
- Add sitemap entries for both languages.
- Run build and syntax checks.
- Check mobile screenshot for the new page.
- Run `npm run monitor:recent-pages -- --days 28` after deployment to refresh the baseline.
