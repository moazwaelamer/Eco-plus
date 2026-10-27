---
name: aos
description: Index of the AZTEAC Operating System (AOS): the core philosophy, the four values, the key rules, and which aos-* skill to load for each kind of work. Use at the start of any task in an AZTEAC project, or when unsure which standard applies.
---

# AZTEAC Operating System (AOS) v1.0

Source: *AOS Guidebook v1.0 (April 2026)*. These `aos-*` skills turn its standards into working rules for this repository. When this repository's `CLAUDE.md` and the AOS differ, follow the AOS, except "commit or push only when the user asks".

## Philosophy
We are engineers, not coders. Before every technical decision ask: **"Will this work at 10x load and 10x complexity, maintained by someone who did not write it?"** Reliability is the measure of success, not speed alone.

## Four values
- **Ownership:** if you touch it you own it until it is handed off; approving a PR shares responsibility for it in production.
- **Transparency:** report problems the moment they appear; update Linear when an estimate slips.
- **Craftsmanship:** done means on staging, reviewed, edge cases handled, documented; consistent names, clean history, meaningful commits.
- **Continuous improvement:** every retrospective yields an action, every incident a post-mortem.

## Which skill for which job
| Doing this | Load |
|---|---|
| Branch, commit message, pull request | `aos-git-workflow` |
| Reviewing or preparing a review | `aos-code-review` |
| Endpoints, auth, secrets, config, CORS | `aos-security` |
| Writing tests, calling something done | `aos-testing-dod` |
| Naming, folder layout, formatting | `aos-code-style` |
| Schema, migrations, backups | `aos-database` |
| Environments, Coolify, CI/CD, domains, rollback | `aos-deploy` |
| Outage, production bug, post-mortem | `aos-incident` |
| Planning, Linear issues, kickoff, sprint review | `aos-project` |
| Public website (Next.js) | `aos-web` |
| Flutter app and store releases | `aos-mobile` |
| Recording what was learned | `aos-wiki` |
| A formal Word report | `aos-report` |

## Key rules (one line each)
1. No work without a Linear issue; no commit without its ID.
2. No direct pushes to `main`; every PR under 400 lines, self-reviewed, approved by another developer.
3. Secrets only in environment variables; validate server-side; parameterise SQL; authorise at the API.
4. Done = tests pass, reviewed, works on staging, documented, closed in Linear.
5. Three environments are sacred: development never touches a remote database.
6. Every migration has a tested down; backups are off-server, tested monthly, 7-4-3.
7. More than 30 minutes to solve it? Write a Wiki entry.
8. P0/P1 incidents: restore service first, blameless post-mortem within 48 hours.

## Changing the AOS
Propose changes through the guidebook's own update process (chapter 24); do not improvise a different process.
