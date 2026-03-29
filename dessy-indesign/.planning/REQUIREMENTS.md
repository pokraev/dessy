# Requirements: Dessy InDesign Plugin

**Defined:** 2026-03-29
**Core Value:** Reliably fill tagged InDesign templates with Excel data through a clear mapping UI

## v1 Requirements

### Excel Import

- [ ] **EXCEL-01**: User can select an .xlsx file from disk via file picker
- [ ] **EXCEL-02**: Plugin parses Excel headers and data rows from the first sheet
- [ ] **EXCEL-03**: User can select which data row to apply from a list

### Template Scanning

- [ ] **SCAN-01**: Plugin detects `{{Tag}}` placeholders in text frames across all pages
- [ ] **SCAN-02**: Plugin lists all discovered tags in the panel UI
- [ ] **SCAN-03**: Plugin detects tags in image/graphic frames
- [ ] **SCAN-04**: Plugin highlights tagged frames on the InDesign canvas

### Mapping

- [ ] **MAP-01**: User can manually map Excel columns to template tags via a UI
- [ ] **MAP-02**: UI shows visual feedback for mapped vs unmapped tags
- [ ] **MAP-03**: Plugin warns about type mismatches (e.g., image tag mapped to text column)
- [ ] **MAP-04**: User can save and load mapping presets for reuse

### Data Fill

- [ ] **FILL-01**: Plugin fills text placeholders with mapped Excel column values
- [ ] **FILL-02**: Plugin places images from local file paths in Excel into image-tagged frames
- [ ] **FILL-03**: All fill operations are grouped as a single undo step
- [ ] **FILL-04**: Plugin creates a copy of the template before filling (non-destructive)

### Preview

- [ ] **PREV-01**: User can preview how the fill will look before committing changes

### Error Handling

- [ ] **ERR-01**: Plugin reports which tags were not filled after merge
- [ ] **ERR-02**: Plugin warns when image file paths in Excel don't exist on disk
- [ ] **ERR-03**: Plugin detects and reports overset text after fill

## v2 Requirements

### Excel Import

- **EXCEL-04**: Support multiple sheets within a workbook

### Extras

- **EXTRA-01**: Apply styling (colors, fonts, visibility) from Excel data
- **EXTRA-02**: Multi-sheet support with sheet selector UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| Batch export / multi-page generation | Not needed — creates a single filled copy |
| Auto-matching columns to placeholders | Manual mapping preferred for control |
| Adobe Exchange distribution | Personal tool only |
| CSV/TXT import | Excel-only is sufficient |
| CEP/ExtendScript legacy support | UXP only |
| Remote image URLs | Local file paths only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXCEL-01 | — | Pending |
| EXCEL-02 | — | Pending |
| EXCEL-03 | — | Pending |
| SCAN-01 | — | Pending |
| SCAN-02 | — | Pending |
| SCAN-03 | — | Pending |
| SCAN-04 | — | Pending |
| MAP-01 | — | Pending |
| MAP-02 | — | Pending |
| MAP-03 | — | Pending |
| MAP-04 | — | Pending |
| FILL-01 | — | Pending |
| FILL-02 | — | Pending |
| FILL-03 | — | Pending |
| FILL-04 | — | Pending |
| PREV-01 | — | Pending |
| ERR-01 | — | Pending |
| ERR-02 | — | Pending |
| ERR-03 | — | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
