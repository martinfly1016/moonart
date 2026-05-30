# Semrush Access Runbook

Use this runbook when Semrush access through `sem.3ue.co` expires.

Do not store usernames, passwords, cookies, tokens, or account secrets in this repository.

For remote sessions, prefer the Codex right-side preview browser. See:

```text
docs/in-app-browser-runbook.md
```

## Browser Research Principles

- Prefer DOM/text extraction over screenshots for keyword metrics and page data.
- Use screenshots only when DOM/text extraction is unavailable or when a visual layout check is truly needed.
- Reuse one research tab for keyword pages instead of opening a new tab for every query.
- Close temporary research tabs when they are no longer needed.
- Do not keep duplicate Semrush sessions open across Chrome and the Codex in-app browser.
- Control request frequency when using the `sem.3ue.co` Semrush proxy.
  - Do not run rapid automated keyword loops.
  - Use small batches, then pause before continuing.
  - Leave at least 15-30 seconds between Keyword Overview navigations unless the user is manually operating the page.
  - If the page reports requests are too frequent, stop the batch immediately and wait before trying again.
  - Prefer Semrush exports for larger keyword sets instead of browser-by-browser page collection.

## Login Flow

1. Open the available browser surface. Prefer the Codex in-app browser when it is available; otherwise use Chrome.
2. Go to:

```text
https://dash.3ue.co/zh-Hans/#/login
```

3. Log in with the user-provided Tools Share account credentials.
4. After login, confirm the page is:

```text
https://dash.3ue.co/zh-Hans/#/page/m/home
```

5. In `我的订阅`, find the `SEMRUSH` subscription card.
6. Use the active card whose expiry is still valid.
7. Keep the default or user-selected node unless instructed otherwise.
8. Click `打开`.
9. Confirm Chrome opens Semrush through:

```text
https://sem.3ue.co/
```

The Semrush URL normally includes a `__gmitm` parameter. Treat it as session-specific and do not store it in docs or logs.

## After Login

Preferred research entry points:

- Keyword Overview
- Keyword Magic Tool
- Organic Research
- Domain Overview
- competitor pages and SERP checks

For MojiMoon research, start from:

- `docs/semrush-opportunity-radar.md`
- latest `docs/semrush-opportunity-research-*.md`
- `docs/beyond-lets-emoji.md`

## If Login Fails

- Check whether the Tools Share login page reports an expired or invalid session.
- Ask the user for fresh credentials only when needed.
- Do not write credentials into files, shell history, work logs, reports, or commits.
- If Semrush opens but data pages fail, return to the Tools Share home page and try a different active node.

## Security Notes

- Credentials can be typed into the browser during the session.
- Credentials must not be committed, echoed into terminal output, or included in Markdown docs.
- Session URLs and `__gmitm` values should not be treated as reusable permanent links.
