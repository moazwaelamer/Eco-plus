---
name: aos-git-workflow
description: AZTEAC (AOS ch. 12) branch names, commit message format with Linear ID, and pull request rules. Use before creating a branch, writing a commit message, or opening/merging a pull request.
---

# AOS Git workflow (Chapter 12)

## Branches
| Branch | Purpose |
|---|---|
| `main` | Production-ready, always deployable. **No direct pushes, ever** (not even one-line fixes). |
| `staging` | Integration branch for QA. |
| `feature/AZT-42-short-name` | New feature, created from `main`, merged back to `main` by PR. |
| `bugfix/AZT-55-short-name` | Non-urgent bug fix. |
| `hotfix/AZT-60-short-name` | Urgent production fix: from `main`, merged to `main` after review **and also into `staging`**. |

Name pattern: `type/[issue-id]-short-description`, three or four words at most.

## Commits
Format (Conventional Commits + Linear ID): `type(scope): description [AZT-42]`

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`.
Description is imperative ("add room availability check", not "added" or "adds").
Examples: `feat(booking): add availability check [AZT-42]`, `fix(auth): resolve token refresh loop [AZT-55]`.

**No orphan commits.** Every commit references a Linear issue. If there is no issue, create one first.

## Pull requests
- Under **400 lines** changed. Larger work is split: API endpoints, migrations, UI components, wiring each as its own PR.
- Description says what changed and why ("see the ticket" is not a description). Include a link to the Linear issue, and screenshots or a recording for UI changes.
- **Self-review first**: read every changed file as the reviewer, run it locally, run the tests, check naming and style.
- At least one approval from another developer; the Lead Developer must review anything touching authentication, payments or database migrations.
- Reviewed within 24 hours.

## Working rules
- Commit or push only when the user asks (project rule in CLAUDE.md).
- Delete local branches after they are merged (`git branch -d`).
- Never rewrite shared history.

## Checklist before opening a PR
1. Branch name and every commit follow the formats above.
2. Tests pass; docs updated if public APIs, env vars or setup changed.
3. PR under 400 lines, described, linked to Linear, screenshots for UI.
4. Self-review done.
