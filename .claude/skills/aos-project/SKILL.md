---
name: aos-project
description: AZTEAC (AOS ch. 4 and appendices B, C) Scrum process, Linear usage, how to write tasks, and the project kickoff and sprint review templates. Use when planning work, writing issues, starting a project, or preparing a sprint review or retrospective.
---

# AOS project management (Chapter 4, Appendices B and C)

**Rule: if work is not in Linear, it does not exist.** No task starts without a Linear issue; no code is committed without a Linear reference.

## Scrum
- Two-week sprints (one-week only if agreed at kickoff).
- **Planning** on the first Monday (max two hours): the team pulls items from the prioritised backlog until capacity is full and commits collectively.
- **Daily standup**, 15 minutes: what I finished, what I do today, what blocks me. By voice if remote, never as a WhatsApp text.
- **Sprint review** on the last Friday: demo working features live (no slides); if it cannot be demonstrated, it is not done.
- **Retrospective** right after: Keep / Stop / Start, with at least one concrete action and an owner.
- The Sprint Backlog is locked after planning; only P0/P1 incidents may enter mid-sprint.

## Linear
- One workspace per client project plus one for internal work.
- States: Backlog, Todo, In Progress, In Review (PR open), Done (merged, on staging, verified). There is no "In QA".
- Labels: Bug, Feature, Improvement, Urgent, Blocked.
- A good task has: an outcome title, a description with context and links, **acceptance criteria**, and an estimate. Good: "Add room availability check to booking flow" with three criteria and 3 points. Bad: "Fix booking bug".

## Kickoff template (Appendix B)
Project overview (name, client, lead, team, start and target launch dates); goals and 3 to 5 measurable success criteria in the client's language; technology stack decisions (state "default AZTEAC stack" or justify each deviation, including Flutter state-management library and any native choice); timeline with sprint milestones and slack; risk register (description, likelihood, impact, mitigation).

## Sprint review template (Appendix C)
Sprint information (number, dates, attendees, client reps); completed items (Linear ID, description, demo plan); incomplete items (why, progress, carry over or back to backlog); blockers and resolutions; client feedback verbatim (captured in Linear); retrospective Keep / Stop / Start.

## Reports
Formal reports use the AZTEAC report template (see `aos-report`).
