---
name: aos-testing-dod
description: AZTEAC (AOS ch. 15) testing priorities and the Definition of Done. Use when deciding what tests to write, or before calling a task finished or moving a Linear issue to Done.
---

# AOS testing and Definition of Done (Chapter 15)

## Philosophy
Never ship untested code. Priority when time is limited:
1. **Integration tests** for critical API endpoints, against a **real test database** (seeded before, cleaned after), not mocks.
2. **End-to-end tests** for critical user flows: login/registration, the primary business action, payment.
3. **Manual testing** for UI and UX (a checklist per project, kept in the repo).
4. **Unit tests** for complex business logic.
5. **Visual tests** (before/after screenshots or golden files) for shared UI components.

Rule: every critical user flow (if it breaks, the client's business is hit) has at least one automated test.

A good integration test creates its own data, makes a valid request, checks the response, tries the conflict case, and checks the database state.

Manual testing happens at three points: by the developer before the PR, by the reviewer during review, by the team at Sprint Review.

## Definition of Done (all five, no exceptions)
| # | Condition |
|---|---|
| 1 | All automated tests pass (existing and new) |
| 2 | Reviewed and approved by at least one other developer |
| 3 | Works on **staging**, not just localhost |
| 4 | Documentation updated if public APIs, environment variables or setup changed |
| 5 | Linear issue moved to Done with a closing comment saying what was delivered |

Until all five are true the task stays "In Review". "It works on my machine" fails #3; "I forgot to update the README" fails #4.
