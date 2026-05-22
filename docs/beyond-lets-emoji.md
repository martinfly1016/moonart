# Beyond Lets-Emoji

Beyond Lets-Emoji is the ongoing MojiMoon project for building a better emoji content and tool experience than static emoji reference sites.

The goal is not to copy lets-emoji.com text. The goal is to learn from its topic coverage and then present each topic as a faster, more useful, mobile-first copy experience.

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
- `/en/emoji-copy/heart/`
- `/en/emoji-copy/kawaii/`
- `/en/emoji-copy/sparkle/`
- `/en/emoji-copy/tear/`
- `/en/emoji-copy/smile/`
- `/en/emoji-copy/hand-sign/`

Shared experience:

- topic navigation
- search and category tabs
- click-to-add cards
- mobile bottom copy draft sheet
- recent history
- sitemap + hreflang

## Measurement

Run the monitor:

```bash
npm run monitor:recent-pages -- --days 28
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

- `flower emoji copy` / `花絵文字コピペ`
- `star emoji copy` / `星・月絵文字コピペ`
- `bowing / sorry emoji` / `謝る・土下座絵文字`
- `thank you emoji` / `ありがとう絵文字`

Medium priority:

- `warning emoji` / `警告マーク絵文字`
- `flag emoji` / `国旗絵文字`
- `birthday emoji` / `誕生日絵文字`
- `good night emoji` / `おやすみ絵文字`

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
