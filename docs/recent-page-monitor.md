# Recent Page Monitor

This monitor supports the ongoing [Beyond Lets-Emoji](./beyond-lets-emoji.md) project.

This monitor tracks newly shipped page clusters with both Google Search Console and GA4.

Default tracked set:

- Core follow-up pages such as `/zenkaku-hankaku-converter/`, `/emoji-list/`, `/kaomoji/love/`, and the main `/kawaii-copy/` hub pages.
- English emoji-copy topic pages that are manually maintained.
- All generated Japanese copy pages from `_content/ja-copy-pages.json`, including kaomoji, emoji-copy, emoji-combinations, special-characters, and kawaii-copy long-tail pages.

Use `--no-generated` to track only the fixed core list. Use `--pages` or `--page-file` for a narrow custom run.

To inspect the resolved default page list without making GA4 or GSC requests:

```bash
npm run monitor:recent-pages -- --list-pages
```

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
