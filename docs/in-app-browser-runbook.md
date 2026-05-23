# Codex In-App Browser Runbook

Use this runbook when a remote Codex session should operate the Codex App right-side preview browser.

The goal is to use the in-app browser directly, not Chrome screenshots.

## When To Use

Use the Codex in-app browser for:

- Semrush research through `sem.3ue.co`
- logged-in web tools shown in the Codex right-side preview panel
- DOM/text extraction from web pages
- click/fill/navigation tasks where screenshot-only interaction is too brittle

Avoid using Chrome, screenshots, `osascript`, or Computer Use as the first choice unless the in-app browser is unavailable.

## Short Prompt To Give An Agent

```text
请用 Codex 右侧预览框 in-app browser 操作网页。不要用 Chrome/截图。用 `mcp__node_repl__.js` 加载 `/Users/cathy/.codex/plugins/cache/openai-bundled/browser/*/scripts/browser-client.mjs`，初始化 `agent.browsers.get('iab')`，设置 visibility true，然后复用 `tab` 做 goto/click/fill/innerText。若路径失效，先 find 最新 browser-client.mjs。
```

## Full Prompt To Give An Agent

```text
请使用 Codex App 右侧预览框的 in-app browser，不要用 Chrome、截图、osascript 或 Computer Use 来操作网页。

调用方式：
1. 先读取 Browser skill，并使用 Node REPL 的 `mcp__node_repl__.js`。
2. 使用当前版本的 browser-client：
   - 优先查找路径：`/Users/cathy/.codex/plugins/cache/openai-bundled/browser/*/scripts/browser-client.mjs`
   - 如果旧路径失效，用 `find /Users/cathy/.codex -path '*browser-client.mjs'` 找最新版本。
3. 初始化 browser runtime，连接 `agent.browsers.get('iab')`，设置 visibility true。
4. 后续所有网页操作都复用同一个 `tab`。

重要限制：
- 不要把用户名、密码、cookie、`__gmitm` session 参数写进文件或日志。
- 不要用 Chrome + 截图替代右侧预览框，除非 in-app browser 明确不可用。
- 如果 `node_repl` 报旧路径错误，先找最新 browser-client 路径再重试。
```

## Find Current Browser Client

If the known browser plugin version has changed, find the current file:

```bash
find /Users/cathy/.codex -path '*browser-client.mjs'
```

Use the path under:

```text
/Users/cathy/.codex/plugins/cache/openai-bundled/browser/<version>/scripts/browser-client.mjs
```

Example current path when this runbook was written:

```text
/Users/cathy/.codex/plugins/cache/openai-bundled/browser/26.519.41501/scripts/browser-client.mjs
```

## Initialization Snippet

Run this with `mcp__node_repl__.js`:

```js
if (!globalThis.agent) {
  const { setupBrowserRuntime } = await import('/Users/cathy/.codex/plugins/cache/openai-bundled/browser/26.519.41501/scripts/browser-client.mjs');
  await setupBrowserRuntime({ globals: globalThis });
}

if (!globalThis.browser) {
  globalThis.browser = await agent.browsers.get('iab');
}

await browser.nameSession('Semrush research');
await (await browser.capabilities.get('visibility')).set(true);

if (typeof tab === 'undefined') {
  globalThis.tab = await browser.tabs.selected().catch(async () => await browser.tabs.new());
}
```

If the import path fails, run the `find` command above, replace the versioned path, then retry.

## Common Browser Operations

Open a page:

```js
await tab.goto('https://dash.3ue.co/zh-Hans/#/login');
await tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 15000 });
```

Read page text:

```js
const text = await tab.playwright.locator('body').innerText({ timeoutMs: 15000 });
nodeRepl.write(text);
```

Click a button by visible text:

```js
await tab.playwright.getByRole('button', { name: '打开' }).click();
```

Fill inputs:

```js
await tab.playwright.locator('input').nth(0).fill('USERNAME');
await tab.playwright.locator('input').nth(1).fill('PASSWORD');
```

Wait briefly:

```js
await tab.playwright.waitForTimeout(3000);
```

Take a screenshot only for visual confirmation:

```js
await nodeRepl.emitImage(await tab.screenshot({ fullPage: false }));
```

## Semrush Flow

1. Open:

```text
https://dash.3ue.co/zh-Hans/#/login
```

2. Log in to Tools Share with user-provided credentials.
3. Confirm the URL becomes:

```text
https://dash.3ue.co/zh-Hans/#/page/m/home
```

4. Find the active `SEMRUSH` subscription card.
5. Click `打开`.
6. Confirm Semrush opens under:

```text
https://sem.3ue.co/
```

7. Open keyword pages directly in the in-app browser, for example:

```text
https://sem.3ue.co/analytics/keywordoverview/?db=us&q=fancy%20text%20generator
```

## Semrush Device Limit

If Tools Share says Semrush has too many simultaneous devices:

- Close other `sem.3ue.co` sessions, especially Chrome tabs.
- Return to Tools Share home.
- Click the active Semrush card's `打开` button again.

Do not keep both Chrome and the in-app browser using Semrush at the same time.

## Security Notes

- Credentials may be typed into the browser during the session.
- Do not write credentials into docs, work logs, shell history, screenshots, or commits.
- Do not store cookies, tokens, or session URLs.
- Treat `__gmitm` values as temporary session parameters.
