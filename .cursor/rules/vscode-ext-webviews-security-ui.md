---
title: VS Code Webviews Security and UI Rules
description: Rules for secure, maintainable VS Code webviews: CSP, sanitization, message passing, and lifecycle.
glob: "{src}/**/*.{ts,tsx,js,mjs,cjs}"
alwaysApply: false
---

# VS Code Webviews Security and UI Rules

## Security baseline
- Treat all workspace content as untrusted input.
- Prefer templating helpers and always sanitize any workspace-derived content you inject into HTML. :contentReference[oaicite:10]{index=10}
- Never rely on sanitization alone; also use a strict Content Security Policy (CSP). :contentReference[oaicite:11]{index=11}

## CSP and resources
- Prefer `webview.asWebviewUri(...)` for loading local extension assets.
- Prefer nonce-based script tags and disallow inline scripts/styles unless unavoidable.

## Message passing
- Prefer `postMessage` and a typed message protocol:
  - `type: 'init' | 'selectItem' | 'persistState' | ...`
  - `payload` as a discriminated union
- Validate inbound messages from the webview before acting.

## Lifecycle
- Dispose webview resources aggressively:
  - event listeners
  - file watchers
  - timers
- Keep webview state serializable; persist only what you must.

## Common pitfalls
- String-concatenated HTML with unsanitized workspace content.
- Missing CSP → trivial injection escalation path.
