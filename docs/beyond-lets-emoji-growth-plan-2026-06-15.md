# Beyond Lets-Emoji Growth Plan - 2026-06-15

## Objective

Build a high-probability growth path from the current MojiMoon traffic base toward a materially larger AdSense outcome.

Practical revenue path using the current rough AdSense assumption:

- Current state: about `25k-30k PV/month` -> about `$70-$100/month`
- Phase 1 target: about `100k PV/month` -> about `$300/month`
- Phase 2 target: about `330k PV/month` -> about `$1,000/month`

The immediate goal is not ad optimization. It is traffic scaling.

## Core Principle

Do not spread effort evenly across many experiments.

For the next 8-12 weeks, the default action is:

1. Scale the page groups already winning in GSC.
2. Repair pages with proven impressions but weak click capture.
3. Give newly-entering tools a fair observation window before expanding them.
4. Ship at most one new tool only after the current winners are scaled harder.

## P0 Work

### 1. `/special-characters/` cluster expansion

Primary pages:

- `/special-characters/`
- `/special-characters/star/`
- `/special-characters/heart/`
- `/special-characters/line/`
- `/special-characters/cute/`
- `/special-characters/name-decoration/`
- `/special-characters/instagram/`

Why this is P0:

- This is the clearest confirmed traffic winner.
- It already shows strong exact-intent capture for `特殊文字コピペ`, `特殊文字 コピペ`, and `可愛い記号`.
- It can distribute authority into child pages and grow as a cluster, not only as one page.

Execution pattern:

- Add stronger intent entrances on the hub page.
- Add clearer internal routing from the hub into child pages by use case.
- Expand or strengthen child pages that match current winning search language.
- Prefer child-page and intent-route reinforcement over broad unrelated expansion.

Success signal:

- The cluster grows clicks week over week and spreads traffic into more child pages.

### 2. `/en/emoji-combinations/` repair

Why this is P0:

- It already has strong impressions, especially for `emoji combos`.
- The problem is not discovery. The problem is weak click capture and incomplete intent matching.

Execution pattern:

- Strengthen exact phrases near the top: `emoji combos`, `emoji combos copy and paste`, `emoji combo copy paste`.
- Add explicit use-case entrances for bios, captions, comments, and aesthetic intent.
- Add nearby-tool routes where the user may actually want single emoji or symbols instead of combos.
- Re-check CTR and click change before spinning up many new English pages.

Success signal:

- `emoji combos` and close variants recover clicks instead of only gaining impressions.

## P1 Work

### 3. Japanese emoji-combinations expansion

Primary pages:

- `/emoji-combinations/`
- `/emoji-combinations/birthday/`
- strongest JP generated or use-case pages that already show impressions and clicks

Why:

- JP combo pages already show real ranking wins.
- This cluster can become the second major traffic engine after special-characters.

Execution pattern:

- Expand internal links from the hub to the pages already proving demand.
- Reinforce generic and use-case intent at the top of the hub.
- Prefer proven themes such as cute, birthday, color, and profile use cases.

### 4. Observation window for `/twitter-fonts/` and `/zenkaku-hankaku-converter/`

Why:

- Both are too early to judge properly.
- Overreacting before they have 2-3 real GSC windows would create churn.

Execution pattern:

- Watch query capture first.
- Make only small intent-aligned edits unless query evidence justifies bigger expansion.
- Upgrade either page to P0 only if impressions and ranking start compounding.

## P2 Work

### 5. One new tool only after current winners are scaled

Priority order:

1. `Twitter Character Counter`
2. `ASCII Art Generator`

Rule:

- Do not open multiple new tool tracks at once while the main winners still have obvious upside.

## Weekly Operating Rhythm

### Weeks 1-2

- Push `/special-characters/` cluster expansion
- Repair `/en/emoji-combinations/`

### Weeks 3-4

- Review GSC query deltas
- Keep only the patterns that moved clicks, CTR, or ranking in the right direction
- Continue scaling winning subpages and internal routes

### Weeks 5-8

- Apply the strongest learned templates to JP emoji-combinations pages
- Continue cluster-based expansion instead of one-off pages

### Weeks 9-12

- If the site is approaching `60k-80k PV/month`, consider opening one new tool track
- If not, continue compounding the current winners

## Metrics That Matter

Track only these core indicators each week:

1. Total site monthly PV run-rate
2. `/special-characters/` cluster click growth
3. `/en/emoji-combinations/` click and CTR recovery for `emoji combos`
4. Whether new or updated pages begin earning impressions within 14 days

## Practical Expectation

The high-probability version of success is:

- Use the next `8-12 weeks` to move toward `60k-100k PV/month`
- Reach roughly `$180-$300/month` before pushing for the next phase

The low-probability mistake is:

- Starting too many new ideas before current winning clusters are fully exploited

