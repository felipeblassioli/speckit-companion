
---
title: VS Code Extension Manifest and Contributions
description: Rules for package.json (engines, contributes, activation events), command IDs, settings schema, and compatibility discipline.
glob: "{package.json,**/package.json}"
alwaysApply: false
---

# VS Code Extension Manifest and Contributions

## Compatibility
- Always set `engines.vscode` to the minimum version you actually support. :contentReference[oaicite:6]{index=6}
- Prefer a conservative minimum; raise it only when you use newer APIs.

## Command contribution discipline
- Every `contributes.commands[]` entry must have:
  - stable `command` ID (do not rename casually)
  - clear `title`
  - optional `category` (recommended for grouping)
- Every contributed command must be registered in code via `registerCommand`.

## Activation events
- Prefer narrow activation events (activate only when needed). :contentReference[oaicite:7]{index=7}
- If you contribute language features, prefer language-scoped activation (not global).

## Configuration (settings)
- Prefer:
  - `contributes.configuration.title` with your extension name
  - settings keys prefixed with your extension ID: `extName.featureX.enabled`
  - explicit defaults
  - explicit JSON schema types and enums
- Validate settings at runtime; never assume user config is valid.

## Remote / web extension awareness
- If you intend remote support, design for it (filesystem, processes, sockets). :contentReference[oaicite:8]{index=8}
- If you build a web extension, explicitly separate browser-only constraints (no Node APIs).

## Common pitfalls
- “Hidden” implicit coupling: a command exists in code but not in `contributes` (or vice-versa).
- Over-broad activation leading to slow startup and wasted resources. :contentReference[oaicite:9]{index=9}
