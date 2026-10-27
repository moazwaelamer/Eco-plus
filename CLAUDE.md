# EcoPlus: rules for Claude Code

Monorepo: `apps/backend` (NestJS), `apps/frontend` and `apps/dashboard` (Flutter, not started), `docs/`.
Backend details and rules are in `apps/backend/README.md` and `apps/backend/AGENTS.md`. Read only what the task needs.

## Working style
- One module at a time: build, test, stop. Do not scaffold things that are not asked for.
- Match surrounding code. No comments that restate the code.
- Never commit to `main`. Every task, fix or doc change gets its own branch (`feat/moa-xxx-name`, `fix/...`, `docs/...`, `chore/...`), then a pull request into `main`. Commit or push only when the user asks.

## Non-negotiables (from the product design)
- Points = weight x material factor x level multiplier, only after the employee weighs. The weighed value is the truth.
- `points_ledger` is append-only. Weighing is one all-or-nothing transaction and idempotent.
- Rewards and redemption are out of the MVP: points work like a loyalty card.
- The handover code is never shown to the driver.
- Feasibility numbers in the project document are placeholders until real quotes exist.

## Checks before a pull request
`cd apps/backend && npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build`
