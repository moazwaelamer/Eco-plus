---
name: aos-report
description: How to produce an AZTEAC report (Word) from the official report template: structure, placeholders to replace, styles to clone, and checks. Use when asked for a report, architecture document, post-mortem document or any formal AZTEAC document.
---

# AZTEAC report from the template

The template is `AZTEAC-Report-Template.docx` in this folder. Always build from it (clone its styled elements); never restyle by hand. Use the `docx` skill's editing route (unzip, edit `word/document.xml`, zip, validate); python-docx plus lxml deep copies also works well.

## Structure to keep
1. **Cover:** `REPORT · <TYPE>` label, big title, italic subtitle line, metadata row (type, author, version, date).
2. **01 Document control:** metadata table (Document ID `AZT-REP-NNNN`, owner, status, classification, last updated, distribution, reviewers, approver) and revision history.
3. **02 Contents:** one line per chapter with a page number. Page numbers are `PAGEREF` fields to bookmarks on the chapter titles, with `updateFields` on so Word refreshes them on open.
4. **03 Executive summary:** one standalone lead sentence, two short context paragraphs, a Key takeaways box (three lines), optionally one pull quote.
5. Body chapters (label `NN · Topic`, title, lead sentence, H2/H3, bullets, numbered lists that restart, data tables with status dots, NOTE and CAUTION callouts, code block).
6. **Conclusions & next steps:** immediate actions with a named owner and a date, open questions.
7. **Appendix & sign-off:** sources and the sign-off table (Author, Reviewer, Approver).

## Rules
- Header text is the document name; footer holds the document ID, version and live PAGE / NUMPAGES fields.
- Status colours in tables: green `1F8A5B` good, amber `C99A2A` partial or degraded, red `B33A3A` bad, grey `5A6478` not started.
- Body text 10 pt; no more than two paragraphs without a subheading; bullets of one or two lines; tables for more than five or six items.
- Replace every placeholder (names, dates, "Month 00", "AZT-REP-0000"); check none is left.
- Validate with `scripts/office/validate.py --original <template>`. Render to PDF when a converter exists (LibreOffice or Word) and look at the pages.

## Gotchas
- The cover subtitle paragraph holds a drawing run; set text on the first run that contains `w:t`, do not remove drawing runs.
- Create a new `w:num` with `startOverride` for each numbered list, or numbering continues across lists.
- `w:updateFields` must sit before `w:hdrShapeDefaults`/`w:compat` in `settings.xml` or schema validation fails.
- Table cells need dual widths (`tblGrid` and `tcW`) in DXA.
