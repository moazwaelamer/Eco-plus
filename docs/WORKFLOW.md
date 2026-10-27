# Workflow

1. Pick a task in Linear (project EcoPlus, `MOA-xxx`).
2. Branch from `main`: `feat/moa-228-vehicles`, `fix/...`, `docs/...`.
3. Commit in small steps. Message: `type(scope): what changed [MOA-228]`.
4. Before the pull request, from `apps/backend`: `npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build`.
5. Open a pull request into `main`. CI must be green. One review before merge.
6. Update the Linear task and, when the data model changed, the "Build status" section of the project document.

Nobody commits directly to `main`, including Claude. Every task, fix and doc change gets its own branch and its own pull request, so the history shows what changed and why.

Branch names: `feat/moa-228-vehicles`, `fix/handover-code-check`, `docs/status-update`, `chore/ci-paths`.

Branch protection for `main` (pull request required, CI required) is set on GitHub once the repo exists.
