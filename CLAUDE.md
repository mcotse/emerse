# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Emerse is a Progressive Web App (PWA) for personal photo portfolio management. It features photo upload with multi-resolution compression, dynamic clustering (by date/location), gesture-based grid navigation with pinch-to-zoom, and offline support.

**Status:** Project is in planning phase. See PRD.md for full requirements and work breakdown structure.

## Planned Tech Stack

- Frontend: React/Next.js with TypeScript
- Styling: Tailwind CSS
- Storage: Amazon S3 with presigned URLs
- Backend: Serverless (AWS Lambda)
- Database: PostgreSQL or DynamoDB
- Image Processing: Sharp.js
- Testing: Playwright (e2e)
- PWA: Service worker, manifest.json

## Issue Tracking (Beads)

This project uses **bd** (beads) for issue tracking. Issues are stored in `.beads/` and sync with git.

```bash
bd onboard              # Get started
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>           # Complete work
bd sync                 # Sync with git
```

## Session Completion Protocol

When ending a work session, always:
1. File issues for remaining work
2. Run quality gates (tests, linters, builds) if code changed
3. Update issue status
4. Push to remote: `git pull --rebase && bd sync && git push`
5. Verify `git status` shows "up to date with origin"

## Development Approach

Manual setup tasks (AWS credentials, database provisioning, auth configuration) are deferred and documented in MANUAL_SETUP.md. Development proceeds with mock/placeholder configurations.
