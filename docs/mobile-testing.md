# Mobile Testing

MojiMoon has a high share of mobile traffic, so text tool changes should be checked on small mobile viewports before release.

## Automated Audit

Run:

```bash
npm run mobile:audit
```

The audit starts a local static server, launches the local Google Chrome in headless mode, emulates three common mobile viewports, and writes screenshots plus a Markdown report to:

```text
reports/mobile-audit/
```

Default viewports:

- iPhone SE: `375x667`
- iPhone 15: `390x844`
- Pixel: `412x915`

Default pages:

- `/emoji-copy/`
- `/kaomoji/`
- `/kaomoji/cat/`
- `/special-characters/`
- `/emoji-combinations/`

To test a narrower page set:

```bash
MOBILE_AUDIT_PAGES="/kaomoji/,/kaomoji/rabbit/" npm run mobile:audit
```

## What It Checks

- Page-level horizontal overflow
- Small tap targets on buttons, tabs, cards, pagination, and category links
- Mobile screenshots for visual review
- Long-page scroll height, so content-heavy SEO pages stay visible in the report

Horizontal scrolling inside category tab bars is allowed. The audit only fails when the whole page becomes wider than the mobile viewport.

## iOS Simulator

The current Mac has Safari and Chrome, but not a usable iOS Simulator command line (`xcrun simctl` is missing). Chrome mobile emulation is the default regression path for now.

Install the Xcode Simulator later if Safari-specific issues appear, such as clipboard behavior, input focus, sticky layout, or font rendering differences.
