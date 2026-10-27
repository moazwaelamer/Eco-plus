---
name: aos-wiki
description: AZTEAC (AOS ch. 22) Technical Wiki: what to record, entry format, structure and maintenance. Use after solving a bug that took more than 30 minutes, finding an API quirk, finishing a hard configuration, or making an important technical decision.
---

# AOS Technical Wiki (Chapter 22)

The Guidebook says how we work; the Wiki records what we learn.

## When to write an entry
**If solving it took more than thirty minutes, it goes in the Wiki.** Four kinds:
- **Bug solutions:** exact error or symptoms, the specific root cause, the fix with code.
- **API quirks:** undocumented behaviour, rate limits, header formats, workarounds.
- **Configuration recipes:** step-by-step setups that were hard to get right (Coolify health checks, n8n with SSL PostgreSQL, Traefik subdomains).
- **Decision records:** the decision, alternatives considered, criteria, and what tipped it.
- Post-mortems are filed under "Incidents" (see `aos-incident`).

If the same category of problem appears three times, it becomes a Guidebook standard.

## Entry format
- Descriptive title ("PostgreSQL JSONB `->>` returns text, mismatch with integer columns", not "Bug fix").
- Date, author, **Problem** (with the exact error text so search finds it), **Solution** (specific enough to follow without context), tags.
- Organised by technology: Next.js, Node.js/Express, PostgreSQL, Coolify, n8n, Flutter, Shopify, WordPress, General. Newest first. Use the AZTEAC wiki template, not a blank page.

## Maintenance
At least **two entries per developer per sprint**, checked in the retrospective ("what did we learn, is it in the Wiki?"). Monthly review: deprecate or archive outdated entries and promote repeated patterns.

In this repository, decisions go in `docs/decisions/DECISIONS.md` and one report per finished piece in `docs/reports/`.
