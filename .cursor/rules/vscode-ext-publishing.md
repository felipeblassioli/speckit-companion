---
title: VS Code Extension Bundling, Packaging, Publishing
description: Production rules for bundling (esbuild/webpack), prepublish hooks, VSIX packaging, and Marketplace publishing via vsce.
glob: "{package.json,**/*.{ts,tsx,js,mjs,cjs},.vscodeignore}"
alwaysApply: false
---

# VS Code Extension Bundling, Packaging, Publishing

## Bundling
- Prefer bundling to reduce install size and improve load times.
- Ensure `vscode:prepublish` runs your production bundle step; `vsce` runs it before publishing. :contentReference[oaicite:16]{index=16}
- Keep dev scripts separate from production bundle scripts (debuggable vs minified). :contentReference[oaicite:17]{index=17}

## Packaging discipline
- Use `.vscodeignore` aggressively to avoid shipping:
  - tests
  - source maps (if not needed)
  - fixtures
  - local caches
- Treat the VSIX as a production artifact; inspect its contents before publishing.

## Publishing
- Publishing is done with `vsce` (packaging/publishing tool). :contentReference[oaicite:18]{index=18}
- You will need an Azure DevOps Personal Access Token (PAT) to publish. :contentReference[oaicite:19]{index=19}
- Always keep `README.md`, `CHANGELOG.md`, and versioning consistent with the release. :contentReference[oaicite:20]{index=20}

## Linux publishing nuance
- `vsce` uses keytar/libsecret for credential storage on Linux; you may need `libsecret` installed.
- If you can’t (or won’t) use keytar, prefer `VSCE_PAT` or `VSCE_STORE=file`.