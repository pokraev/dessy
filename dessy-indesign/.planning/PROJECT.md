# Dessy InDesign Plugin

## What This Is

A UXP plugin for Adobe InDesign that lets users import Excel data and map it onto tagged template placeholders. Personal tool for streamlining data-driven layout workflows — select an Excel file, map columns to template tags, preview the result, and apply to create a filled-in copy of the template.

## Core Value

Reliably fill tagged InDesign templates with Excel data (text, images, styling) through a clear mapping UI — no manual copy-paste, no errors.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] UXP plugin adds a tool/panel to InDesign
- [ ] User can select an Excel file (.xlsx) from disk
- [ ] Plugin parses Excel and displays columns and rows
- [ ] User picks which row to apply
- [ ] Template uses tagged text placeholders (e.g., `{{ProductName}}`)
- [ ] Manual mapping UI: user maps Excel columns to template placeholders
- [ ] Text placeholders filled from mapped Excel columns
- [ ] Image placeholders filled from file paths in Excel cells
- [ ] Styling applied from Excel data (colors, font properties, visibility)
- [ ] Preview of mapping result before applying
- [ ] Undo support after applying
- [ ] Creates a filled-in copy of the template (non-destructive)

### Out of Scope

- Batch export (PDF generation, multi-page output) — not needed, just creates a filled copy
- Public distribution / Adobe Exchange — personal tool only
- Auto-matching columns to placeholders — manual mapping UI preferred
- CEP/ExtendScript legacy approach — UXP only

## Context

- Adobe UXP is the modern plugin platform for InDesign (HTML/JS-based panels)
- Template placeholders are inline tagged text like `{{FieldName}}` inside text frames
- Image data comes as local file paths in Excel cells
- This is a personal productivity tool — polish matters less than reliability

## Constraints

- **Tech stack**: Adobe UXP plugin platform (HTML, JS, InDesign DOM API)
- **Excel format**: .xlsx files (modern Excel format)
- **Images**: Local file paths only (no URL fetching)
- **Scope**: Single-user, personal tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| UXP over CEP/ExtendScript | Modern platform, better DX, future-proof | — Pending |
| Tagged text over named frames | More flexible, works inside text flows | — Pending |
| Manual mapping over auto-match | User control over column-to-placeholder assignment | — Pending |
| Copy-based workflow | Non-destructive — original template stays intact | — Pending |

---
*Last updated: 2026-03-29 after initialization*
