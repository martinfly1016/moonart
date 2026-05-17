# MojiMoon Daily Report Cron

This setup sends a daily MojiMoon data report by email through Vercel Cron and AgentMail.

## Schedule

Vercel Cron uses UTC. The configured schedule is:

```json
{
  "path": "/api/daily-report",
  "schedule": "0 0 * * *"
}
```

That runs every day at 00:00 UTC, which is 09:00 in Asia/Tokyo.

## Report Content

The report includes:

- Core GA user metrics: UV / active users, PV / page views, sessions, average session duration.
- Day-over-day and same-weekday comparisons.
- Tool distribution by page group: Moon text, emoji combinations, special characters, emoji copy, kaomoji, English pages.
- SEO overview from Google Search Console.
- SEO keyword table.
- Traffic source / refer distribution from GA.
- Search appearance when available from GSC.
- Country / region distribution from GA and GSC.

GA data uses yesterday. GSC data uses the latest stable day, defaulting to 3 days ago, because Search Console usually has reporting delay.

## Required Vercel Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```bash
GA4_PROPERTY_ID=503343497
GSC_SITE=sc-domain:mojimoon.com

GOOGLE_OAUTH_CLIENT_JSON=<contents of .secrets/google-oauth-client.json>
GOOGLE_GA_TOKEN_JSON=<contents of .secrets/google-analytics-token.json>
GOOGLE_GSC_TOKEN_JSON=<contents of .secrets/google-oauth-token.json>

  AGENTMAIL_API_KEY=<agentmail api key>
  AGENTMAIL_INBOX_ID=<agentmail inbox id or inbox email address>
  REPORT_EMAIL_TO=your-email@example.com

CRON_SECRET=<random long secret>
```

`CRON_SECRET` is optional in the code, but recommended. If set, manual calls must include:

```bash
Authorization: Bearer <CRON_SECRET>
```

## Local Test

Generate a report without sending email:

```bash
npm run daily:report
```

Send a local test email:

```bash
AGENTMAIL_API_KEY=... AGENTMAIL_INBOX_ID=... REPORT_EMAIL_TO=... npm run daily:report -- --send
```

## Vercel Endpoint

The deployed endpoint is:

```text
/api/daily-report
```

Vercel Cron will call it automatically. You can also manually test it:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://mojimoon.com/api/daily-report
```

## Notes

- Do not commit Google OAuth tokens or email API keys.
- Refresh tokens can expire if OAuth app access is revoked. If that happens, re-run the local Google OAuth flow and update the Vercel token JSON environment variables.
- If the site remains on GitHub Pages only, Vercel Cron will not run. The repository needs to be connected to a Vercel project, or a separate Vercel project should host the API route.
