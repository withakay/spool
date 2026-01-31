## Context

We want a per-project web UI that makes it easy to browse Spool artifacts and project docs. The server should be runnable from Spool (`spool serve`) and should not require committing any generated site artifacts.

The user preference is to lean on Caddy as the external server process.

## Goals / Non-Goals

**Goals:**
- Start a local server with one command.
- Browse Markdown as HTML with lightweight navigation.
- Configurable bind address and port (defaults: `127.0.0.1:9009`).
- Per-project lifecycle management (start/stop), with state stored under `.spool/`.
- Optional token gating when binding to non-loopback.

**Non-Goals:**
- A full hosted docs solution (TLS, users, OAuth).
- GitHub default-branch discovery.
- A perfect Markdown renderer (start simple).

## Proposed Architecture

### Process model

- `spool serve` generates a project-specific Caddy configuration and starts `caddy run` in the background.
- Spool stores server state under `.spool/.state/docs-server/`:
  - `Caddyfile`
  - `pid` (or a JSON state file including pid/port/bind/token)
  - generated UI assets (single-page app) and a file manifest

### Serving and navigation

- Serve a small static web app (SPA) from `.spool/.state/docs-server/site/`.
- At server start, Spool generates a `manifest.json` describing available Markdown files under the allowed roots.
- The SPA renders navigation from the manifest and renders Markdown to HTML client-side.

This avoids needing a Caddy Markdown plugin and keeps behavior deterministic.

### Path allowlist

To reduce accidental exposure, the server should only expose:
- `.spool/changes/`
- `.spool/specs/`
- `.spool/modules/`
- `.spool/planning/` (if exists)
- `.spool/research/` (if exists)
- `docs/` (if exists)
- `documents/` (if exists)

Everything else in the repo root should be inaccessible.

## Configuration

Use project config loaded via existing cascading config sources.

Proposed keys (project-level):
- `serve.port` (number, default 9009)
- `serve.bind` (string, default `127.0.0.1`)
- `serve.token` (string, optional; if absent and binding is non-loopback, Spool generates one)

## Token gating

Token gating should be enforced by the server (not only the UI).

Pragmatic approach:
- Use a path-based token prefix that Caddy can enforce reliably (e.g. `/t/<token>/...`).
- Print the tokenized URL and ensure the SPA uses relative paths under the token prefix.
- Optionally also accept `?token=<token>` by redirecting into the path prefix (nice-to-have).

If token enforcement is not feasible with stock Caddy, default to loopback-only binding and refuse non-loopback binding without an explicit override.

## Port selection

If the configured port is busy, attempt ports by incrementing until a free port is found. The chosen port should be recorded in the state file and printed.

## Open Questions

- Should we store state as a single JSON file instead of ad-hoc files?
- Should stop/status be `spool serve stop|status` or a separate `spool server` command group?
