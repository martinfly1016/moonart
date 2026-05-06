# Google Search Console API

MojiMoon is a static site, so Google Search Console credentials must not be used in browser code. This integration uses a local or server-side Node script.

The recommended setup is **OAuth Desktop app** because it authorizes with the same Google account that already has Search Console access. Service accounts are also supported by the script, but Search Console sometimes refuses newly created service account emails in the user picker.

## Recommended Setup: OAuth Desktop

1. Open Google Cloud Console and enable **Google Search Console API** for a project.
2. Go to **APIs & Services** -> **Credentials**.
3. Click **Create credentials** -> **OAuth client ID**.
4. If Google asks for a consent screen, choose **External** or **Internal** depending on the account, add the app name, and add your own Google account as a test user if the app is in testing mode.
5. Choose application type **Desktop app**.
6. Download the OAuth client JSON.
7. Save it outside git:

```bash
mkdir -p .secrets
mv ~/Downloads/client_secret_*.json .secrets/google-oauth-client.json
chmod 600 .secrets/google-oauth-client.json
```

First run:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode queries
```

The script prints an authorization URL. Open it, log in with the Google account that owns Search Console, approve readonly Search Console access, and return to the terminal. The refresh token is saved to:

```text
.secrets/google-oauth-token.json
```

Later runs reuse that token automatically.

## Alternative Setup: Service Account

Service account mode is still supported:

```bash
npm run gsc -- --auth service --credentials .secrets/google-search-console.json --site sc-domain:mojimoon.com --mode queries
```

For this mode, the service account email must be added as a Search Console user for the property. Google Cloud IAM roles alone are not enough.

## Commands

Top queries:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode queries
```

Top pages:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pages
```

Queries for one tool page:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pageQueries --page /emoji-copy/
```

Daily trend:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode daily --start 2026-04-01 --end 2026-04-30
```

Filter by query text:

```bash
npm run gsc -- --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode pageQueries --query 絵文字
```

## Output

Reports are written to:

```text
reports/gsc/<end-date>/
```

Each run writes JSON and CSV by default. Use `--output json` or `--output csv` to write only one format.

## Notes

- Search Console data is usually delayed. The script defaults to ending 3 days before today.
- The script uses the readonly scope: `https://www.googleapis.com/auth/webmasters.readonly`.
- Generated reports and `.secrets/` should stay out of git.
