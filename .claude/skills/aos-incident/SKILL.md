---
name: aos-incident
description: AZTEAC (AOS ch. 23) incident severity levels, response steps, and the blameless post-mortem template. Use when a production bug, outage, failed deployment or security problem is reported, or when writing a post-mortem.
---

# AOS incident response (Chapter 23)

## Severity (by user impact, not by effort)
| Level | Meaning | Response |
|---|---|---|
| P0 Critical | Site down, data loss, security breach | Immediate, all hands; CEO notified at once; client told within 30 minutes |
| P1 High | Major feature broken, significant impact | Fix within 4 hours; inform the client if user-facing |
| P2 Medium | Minor feature broken, workaround exists | Fix within 24 hours, normal process |
| P3 Low | Cosmetic, no user impact | Next sprint |

## Four steps (same for every level)
1. **Acknowledge:** confirm it is real, assign severity, claim ownership; log in Linear with the `Urgent` label and the severity in the title.
2. **Communicate:** notify the team (WhatsApp) and, for P0/P1, the client; keep a timeline in the Notion Incidents page. Say what is happening (symptoms), what we are doing, and when the next update comes. Over-communicate.
3. **Fix:** restore service first, fix properly second, prevent recurrence third. Roll back first if that restores service. For P0/P1 the Lead Developer or AI & Operations Lead may deploy a hotfix before review; it still goes through a branch and a PR, with review concurrent or right after.
4. **Post-mortem:** required for P0 and P1 within **48 hours**, recommended for P2 with systemic causes, not needed for P3.

No items enter a running sprint except P0/P1 incidents.

## Post-mortem template (blameless)
1. **Incident summary:** what happened, which services, total duration; readable by anyone in the company.
2. **Timeline of events:** timestamps from detection to confirmed restoration.
3. **Root cause analysis:** the systemic cause (missing test, skipped step, monitoring gap); use the five whys. "A developer made a mistake" is never the root cause.
4. **What we did well.**
5. **What we could improve:** specific ("add an integration test for the availability check"), not vague.
6. **Action items:** each becomes a Linear issue with an owner and a deadline; tracked in retrospectives.

File the finished post-mortem in the Technical Wiki under "Incidents".
