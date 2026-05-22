# Google Data APIs

MojiMoon can pull data from both Google Search Console and Google Analytics 4 through local command line scripts.

## Credentials

Use the existing OAuth Desktop client JSON:

```text
.secrets/google-oauth-client.json
```

Tokens are cached locally and must not be committed:

```text
.secrets/google-oauth-token.json
.secrets/google-analytics-token.json
```

## Google Search Console

Default package command:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode queries
```

Useful modes:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pages
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pageQueries --page /kaomoji/
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode devices
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pages --days 7
```

Reports are written to:

```text
reports/gsc/<end-date>/
```

## Google Analytics 4

First list visible GA4 properties:

```bash
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --list-properties
```

Then use the GA4 property id:

```bash
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode pages
```

Useful modes:

```bash
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode pages
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode landingPages
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode pageSources --page /kaomoji/
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode sources
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode devices
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode daily
npm run ga -- --auth oauth --credentials .secrets/google-oauth-client.json --property 503343497 --mode pages --days 7
```

Reports are written to:

```text
reports/ga/<end-date>/
```

## Combined Site Metrics

Once the GA4 property id is known:

```bash
npm run site:metrics -- --ga-property 503343497
```

For a specific page cluster:

```bash
npm run site:metrics -- --ga-property 503343497 --page /kaomoji/
```

This writes GSC and GA reports under:

```text
reports/site-metrics/<end-date-or-latest>/
```

## Recent Page Monitor

Use this after shipping new page clusters. It tracks the current emoji-copy topic pages in both Japanese and English by default:

```bash
npm run monitor:recent-pages -- --days 28
```

The monitor writes Markdown, JSON, and CSV under:

```text
reports/recent-pages/<end-date>/
```

It combines:

- GSC clicks, impressions, CTR, average position, and top visible queries per page.
- GA4 page views, active users, sessions, engaged sessions, engagement rate, and landing-page sessions.

To monitor a custom page set:

```bash
npm run monitor:recent-pages -- --pages /emoji-copy/tear/,/en/emoji-copy/tear/
```

For a reusable page set, pass a JSON file:

```bash
npm run monitor:recent-pages -- --page-file docs/recent-pages.json
```

## Notes

- GSC defaults to `sc-domain:mojimoon.com`.
- MojiMoon GA4 property id is `503343497`.
- GA4 Data API must be enabled to run reports.
- GA Admin API is only required for `--list-properties`; you can skip it if you already know the GA4 property id.
- The first GA run may open an OAuth URL because GA uses a separate token cache from GSC.
