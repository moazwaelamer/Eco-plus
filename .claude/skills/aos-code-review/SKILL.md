---
name: aos-code-review
description: AZTEAC (AOS ch. 13) code review process and etiquette: what to look for, severity prefixes, turnaround. Use when reviewing a diff or pull request or preparing one for review.
---

# AOS code review (Chapter 13)

Code review is mandatory for everything that enters `main`. Every PR needs one approval; the Lead Developer is a required reviewer for authentication, payment processing and database migrations. The reviewer shares responsibility for the code.

## What to look for, in order of importance
1. **Logic errors and edge cases**: null input, empty arrays, timeouts, double submit.
2. **Security**: unsanitised input, hardcoded secrets, authorisation that only hides UI instead of checking at the API (see `aos-security`).
3. **Performance**: N+1 queries, queries in loops, unstable references or missing memoisation, bundle growth.
4. **Standards**: naming (ch. 11), folder structure, commit format (ch. 12).
5. **Error handling**: no silent failures; endpoints return proper errors; UI shows error states; background jobs log and notify.

## Etiquette
- Comment on the code, not the person.
- Prefix **every** comment: `nit:` (non-blocking suggestion) or `blocking:` (must be fixed before merge).
- Explain **why**, not just what; every `blocking:` comment includes the reason.
- Complete the review within 24 hours, or tell the author so they can find another reviewer.

## Output format when reviewing
List findings most severe first, each as `blocking:` or `nit:`, with file and line, the problem, why it matters, and a concrete fix. End with an approve or request-changes verdict.

## Author side
Keep PRs under 400 lines so a review takes about 30 minutes. A first comment about formatting or an unused import means the self-review was skipped.
