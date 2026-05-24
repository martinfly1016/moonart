# Recent Page Monitor

This monitor supports the ongoing [Beyond Lets-Emoji](./beyond-lets-emoji.md) project.

This monitor tracks newly shipped page clusters with both Google Search Console and GA4.

Default tracked set:

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

Run:

```bash
npm run monitor:recent-pages -- --days 28
```

Outputs:

```text
reports/recent-pages/<end-date>/recent-pages_<start>_<end>.md
reports/recent-pages/<end-date>/recent-pages_<start>_<end>.json
reports/recent-pages/<end-date>/recent-pages_<start>_<end>.csv
```

Key metrics:

- GSC impressions: whether Google is discovering and testing the page.
- GSC clicks and CTR: whether the title/snippet/query match is good enough to earn traffic.
- GSC position: whether the page is close enough to improve with internal links and copy.
- GA page views and active users: all-source demand, including direct/internal traffic before GSC catches up.
- GA engaged sessions and engagement rate: whether visitors do anything useful after landing.
- Top GSC queries: which intent Google associates with each page.

Notes:

- GSC data is delayed by several days, so GA usually moves first.
- Query rows are privacy-filtered; page totals are more reliable than summed query totals.
- New pages should be judged over at least 2-4 weeks, not on the first GSC window after launch.
