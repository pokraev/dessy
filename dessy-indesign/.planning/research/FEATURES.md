# Feature Research

**Domain:** InDesign data merge / Excel-to-template UXP plugin
**Researched:** 2026-03-29
**Confidence:** MEDIUM — competitive landscape verified via official docs and product pages; some UX preference claims from community forums (single-source)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Excel (.xlsx) file import | Native data merge only supports CSV/TXT; every real workflow uses Excel — the gap is the entire reason plugins exist | LOW | SheetJS (xlsx library) handles parsing in UXP context |
| Display parsed columns and rows | User must see what data they have before mapping | LOW | Table/grid component in panel UI |
| Manual column-to-placeholder mapping UI | Users need to control which Excel column maps to which `{{tag}}` — even auto-match tools offer manual override | MEDIUM | Drag-drop or dropdown per-placeholder |
| Text placeholder fill (`{{FieldName}}` syntax) | Core functionality — without this nothing works | MEDIUM | Find/replace via InDesign DOM `findText()` or `changeText()` |
| Image placeholder fill (file path from Excel cell) | Standard data merge capability; InDesign's native `@column` convention sets this expectation | MEDIUM | Use InDesign `place()` API on a tagged graphics frame |
| Row selection (which record to apply) | User picks one record at a time for single-layout workflows | LOW | Dropdown or stepper in panel |
| Non-destructive copy workflow | Pros never want to destroy the template; "create a copy, then fill" is standard practice | LOW | `document.duplicate()` then operate on copy |
| Undo support | InDesign is a destructive editing environment; ops without undo feel dangerous | MEDIUM | Wrap all DOM changes in `app.doScript()` with UndoMode — single undo step |
| Clear error feedback on unresolved placeholders | Native InDesign data merge's #1 pain point is cryptic "placeholder not found" errors with no location info; users explicitly request better UX here | MEDIUM | Scan template for all `{{tags}}`, report which are unmapped before applying |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Inline style application from data (colors, font weight, visibility) | Competitors like MyDataMerge charge premium for conditional styling; applying character/paragraph styles based on data values is rare in lightweight tools | HIGH | Must map style names to InDesign paragraph/character style objects via DOM |
| Overset text detection after fill | DesignMerge Pro highlights this as a pro feature; native merge only reports it post-hoc | MEDIUM | Check `textFrame.overflows` after replacement and surface warning in panel |
| Relative image path resolution | Absolute paths break when moving files; native merge requires exact platform-style paths — relative paths significantly reduce friction | MEDIUM | Resolve paths relative to the .indd document location using `app.activeDocument.filePath` |
| Mapping preset save/load | Reuse same column mapping across multiple sessions without re-mapping | MEDIUM | Persist mapping config to a JSON file in plugin storage or alongside the .indd |
| Preview of mapped values in panel (before apply) | Shows what text/images will replace each placeholder without touching the document | LOW | Read-only data display in panel using parsed Excel row + current mapping |
| Template placeholder scanner (detect all `{{tags}}` in document) | Eliminates manual hunting for placeholder names; tells user what the template expects | LOW | Iterate all text frames, regex-scan contents, return unique tag list |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing but create scope problems for a personal, single-record-fill tool.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Batch export / multi-record PDF generation | "Merge all 500 rows at once and export PDFs" — power users ask for this | InDesign's native batch-split is broken; third-party workarounds involve bookmarks, scripts, and Acrobat post-processing. Adds an order of magnitude of complexity with no value for the single-layout use case | Apply one record at a time; user exports from InDesign's own Export dialog manually |
| Auto-matching columns to placeholders by name | "Why do I have to map when names match?" — reasonable question | Fragile when Excel headers have spaces, casing differences, or extra characters. Native data merge auto-links by name and generates constant "placeholder not found" errors. Users end up debugging invisible match failures | Keep manual mapping; surface the column names and tag names side-by-side so visual matching is trivial |
| Online / URL-based image fetch | Users occasionally want to pull images from a CDN or Google Drive URL | File system access from UXP is sandboxed; URL fetching requires CORS-safe servers and async fetch + temp file write — significant complexity, fragile on corporate networks | Require local paths only; document this clearly at onboarding |
| Conditional content (show/hide fields based on data values) | Advanced data merge feature (InData, DesignMerge Pro) — users with complex catalogs want it | This requires a mini rule engine. For a personal single-record tool, manually hiding frames before applying is good enough | Note as v2 candidate if the tool evolves toward catalog publishing |
| GREP-based post-merge text transform | MyDataMerge offers this; power users want it | Adds a scripting surface that's hard to validate without a test harness — complexity outweighs benefit at this scope | Let InDesign's own GREP Find/Change handle post-merge cleanup |
| Public distribution / Adobe Exchange listing | More users = more value | Requires Adobe review process, security audit, and ongoing maintenance burden for a personal productivity tool | Stay local install; distribute via .ccx file to self only |

---

## Feature Dependencies

```
[Excel file import]
    └──requires──> [Column/row display]
                       └──requires──> [Row selection]
                                          └──requires──> [Manual mapping UI]
                                                             └──requires──> [Text placeholder fill]
                                                             └──requires──> [Image placeholder fill]

[Template placeholder scanner]
    └──enhances──> [Manual mapping UI]
                   (scanner tells user what tags exist; mapping UI assigns columns to those tags)

[Preview of mapped values]
    └──requires──> [Manual mapping UI]
    └──requires──> [Row selection]

[Overset text detection]
    └──requires──> [Text placeholder fill]
    (can only detect overflow after content has been placed)

[Inline style application]
    └──requires──> [Manual mapping UI]
    (needs a mapping extended with style rules per field)

[Mapping preset save/load]
    └──requires──> [Manual mapping UI]
    (saves the mapping state)

[Non-destructive copy workflow]
    └──requires──> [Any fill operation]
    (copy must happen before fill, not after)

[Undo support]
    └──conflicts──> [Non-destructive copy]
    (if user works on a copy, undo is less critical — but still expected for the fill step itself)
```

### Dependency Notes

- **Excel import requires column display:** The panel is useless until data is parsed and shown. These are effectively a single atomic step.
- **Template scanner enhances mapping UI:** Knowing the tags in the document lets the UI pre-populate the "placeholder" side of the mapping table, reducing user effort.
- **Overset detection requires fill:** Detection only makes sense as a post-fill validation step; it cannot be predicted before applying data because text length varies per record.
- **Inline styling requires extended mapping:** Style rules are per-field metadata on top of the column-to-tag assignment, so the mapping data model must support it before styling can be added.
- **Undo vs. copy-based workflow:** These partially address the same user fear (data loss). The copy approach is higher value — if a copy is created, the original is always safe. Undo is still expected for iterating within a session.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Excel (.xlsx) import and column/row display — without this, nothing else is possible
- [ ] Template placeholder scanner (`{{tags}}` in document) — reduces friction in mapping setup
- [ ] Manual column-to-placeholder mapping UI — the core user interaction
- [ ] Row selection (which record to apply) — single-record workflow
- [ ] Non-destructive copy of template before fill — protects the original
- [ ] Text placeholder fill — replaces `{{FieldName}}` with Excel cell value
- [ ] Image placeholder fill — places local image file into tagged graphics frame
- [ ] Clear error feedback for unresolved placeholders — surfaces mismatches before applying
- [ ] Undo as single step (wrapping fill in one undo group)

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Preview of mapped values in panel — add when repeated apply/undo cycles show up as friction in personal use
- [ ] Mapping preset save/load — add when re-configuring the same template repeatedly becomes annoying
- [ ] Relative image path resolution — add when absolute path breakage causes real problems in practice
- [ ] Overset text detection with panel warning — add when long text strings start causing silent layout issues

### Future Consideration (v2+)

Features to defer until there is clear need.

- [ ] Inline style application from data — substantial complexity; defer until template use cases require it
- [ ] Conditional content (show/hide fields) — catalog-publishing scope, not single-record fill
- [ ] Multiple records per page / batch — fundamentally different product mode; adds significant complexity

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Excel import + display | HIGH | LOW | P1 |
| Template placeholder scanner | HIGH | LOW | P1 |
| Manual mapping UI | HIGH | MEDIUM | P1 |
| Row selection | HIGH | LOW | P1 |
| Text placeholder fill | HIGH | MEDIUM | P1 |
| Image placeholder fill | HIGH | MEDIUM | P1 |
| Non-destructive copy | HIGH | LOW | P1 |
| Error feedback (unresolved tags) | HIGH | MEDIUM | P1 |
| Undo support | HIGH | MEDIUM | P1 |
| Preview of values in panel | MEDIUM | LOW | P2 |
| Mapping preset save/load | MEDIUM | MEDIUM | P2 |
| Relative image path resolution | MEDIUM | LOW | P2 |
| Overset text detection | MEDIUM | LOW | P2 |
| Inline style application | LOW | HIGH | P3 |
| Conditional content (show/hide) | LOW | HIGH | P3 |
| Batch multi-record export | LOW | HIGH | P3 (anti-feature for now) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Adobe Native Data Merge | MyDataMerge (macOS standalone app) | InData (CEP plugin) | DesignMerge Pro | Our Approach |
|---------|------------------------|-------------------------------------|---------------------|-----------------|--------------|
| Excel .xlsx support | No — CSV/TXT only | Yes | Yes | Yes | Yes — core reason to exist |
| Column-to-tag mapping | Auto-link by name (fragile) | Auto-link + manual override | Template scripting | Panel-driven | Manual mapping — explicit, predictable |
| Image fill via file path | Yes (absolute, platform-specific) | Yes (with custom path resolver) | Yes | Yes | Yes — local paths, relative resolution in v1.x |
| Inline styling / conditional | No | Yes (character/para styles + conditions) | Yes (scripting language) | Yes (rules builder) | v2+ only |
| Batch / multi-record | Yes (core feature) | Yes | Yes | Yes | Deliberately out of scope |
| Overset text detection | Post-hoc report only | Not mentioned | Not mentioned | Yes (preview mode) | v1.x |
| Undo | No (merge is destructive) | N/A (standalone app) | No | No | Yes — key differentiator for iterative use |
| Plugin platform | N/A built-in | Standalone macOS app | CEP (legacy) | CEP (legacy) | UXP — modern, supported |
| Error reporting | Cryptic, no location | Better | Unknown | Good | Named tag, actionable message |

---

## Sources

- [Adobe InDesign Data Merge official docs](https://helpx.adobe.com/indesign/using/data-merge.html) — MEDIUM confidence (official, but describes built-in native feature)
- [MyDataMerge product site](https://mydatamerge.com/) — MEDIUM confidence (vendor marketing, features list confirmed comprehensive)
- [InData – Em Software](https://emsoftware.com/products/indata/) — LOW confidence (product page CSS only rendered; feature info from community descriptions)
- [DesignMerge Pro – Meadows Publishing Solutions](https://meadowsps.com/designmerge-pro/) — MEDIUM confidence (official product page, detailed feature list)
- [DataLinker – Teacup Software](https://teacupsoftware.com/product/datalinker) — MEDIUM confidence (official product page)
- [Adobe InDesign UXP overview](https://developer.adobe.com/indesign/uxp/) — HIGH confidence (official Adobe developer docs)
- [CreativePro: Troubleshooting Data Merge Errors](https://creativepro.com/troubleshooting-data-merge-errors/) — MEDIUM confidence (editorial, practitioner-written)
- [Adobe UserVoice: "dreaded placeholder not found" error](https://indesign.uservoice.com/forums/601021-adobe-indesign-feature-requests/suggestions/39078319-the-dreaded-data-merge-there-is-at-least-one-data) — MEDIUM confidence (real user pain point evidence)
- [Adobe community: Catalog Data Merge Plugins](https://community.adobe.com/t5/indesign/catalog-data-merge-plugins/td-p/10466740) — LOW confidence (community discussion, not official)
- [CreativePro: Data Merging Part 2 & 3](https://creativepro.com/data-merging-part-2/) — MEDIUM confidence (practitioner editorial series)

---

*Feature research for: InDesign data merge / Excel-to-template UXP plugin (Dessy)*
*Researched: 2026-03-29*
