# Design Document – Claude Code Permission Verification

## Overview

This document describes enhancements to the Claude Code permission verification system.
The original implementation relied on WebView confirmation without verifying whether permissions were actually applied.

The new system performs **real validation** by inspecting the `bypassPermissionsModeAccepted` field in `~/.claude.json`.

## Problems with the Existing System

1. Trusts user confirmation without verification
2. Cannot detect permission revocation
3. No retry or recovery strategy

## Enhanced Architecture

### Key Components

* **PermissionManager** – central coordinator
* **PermissionCache** – in-memory state with events
* **ConfigReader** – file I/O and monitoring
* **PermissionWebview** – user interaction UI

### Core Responsibilities

* Verify real permission state
* Monitor configuration changes
* Automatically close UI once permission is detected
* Provide retry and recovery paths

## Core Component Responsibilities

### PermissionManager

* Entry point and orchestrator
* Manages lifecycle of terminal + WebView
* Coordinates cache and config reader
* Handles retries and cleanup

### PermissionCache

* Caches permission state in memory
* Emits events when permission transitions from false → true
* Avoids repeated disk access

### ConfigReader

* Reads and writes `~/.claude.json`
* Watches file changes via `fs.watchFile`
* Handles malformed or missing config safely

### PermissionWebview

* UI only
* Delegates logic to PermissionManager
* No direct file access

## Key Architectural Principles

* **No globalState dependency**
* **File is the source of truth**
* **Event-driven permission propagation**
* **Simple retry, no retry handlers**
