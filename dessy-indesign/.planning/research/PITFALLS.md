# Pitfalls Research

**Domain:** Adobe InDesign UXP Plugin (data-driven template filling)
**Researched:** 2026-03-29
**Confidence:** MEDIUM — UXP for InDesign is young (introduced v18.5 / 2023); many findings come from official community forums and developer blogs rather than comprehensive official documentation.

---

## Critical Pitfalls

### Pitfall 1: Undo Stack Fragmentation

**What goes wrong:**
Every DOM mutation made from plugin code creates a separate undo step. After applying a template fill with 20 placeholders, the user must hit Cmd+Z 20+ times to revert, which is completely unusable.

**Why it happens:**
UXP plugins run asynchronously alongside InDesign. Without explicit batching, InDesign records each property assignment as an independent undo event. Developers discover this late — it's not obvious from the API surface.

**How to avoid:**
Wrap all document mutations inside `app.doScript()` with `UndoModes.ENTIRE_SCRIPT`:

```javascript
const { app, ScriptLanguage, UndoModes } = require('indesign');
app.doScript(
  () => { /* all placeholder replacements here */ },
  ScriptLanguage.UXPSCRIPT,
  [],
  UndoModes.ENTIRE_SCRIPT,
  'Fill template from Excel'
);
```

Note: `doScript` with `UndoModes.ENTIRE_SCRIPT` only works correctly for synchronous inner functions. If your fill logic is async, move the async parts (file reading, parsing) outside `doScript` and only put synchronous DOM writes inside it.

**Warning signs:**
- Testing the apply action and pressing Cmd+Z once does not revert all changes
- Each text replacement appears as a separate item in the History panel

**Phase to address:** Core template-filling phase (the phase that implements `applyMapping()`)

---

### Pitfall 2: Bracket Notation on InDesign Collections Silently Breaks

**What goes wrong:**
Code like `doc.pages[0]` or `frame.paragraphs[1]` returns `undefined` instead of an error. The DOM works fine during development, then mysteriously fails after an InDesign update.

**Why it happens:**
As of InDesign 18.4+, collection objects returned by the InDesign DOM no longer support the `[]` subscript operator. The correct API is `.item(index)`. Old tutorials and even some community snippets still use bracket notation.

**How to avoid:**
Always use `.item(n)` for indexed access and `.itemByName()` / `.itemByRange()` for named/range access. Never use array bracket notation on InDesign collections. Lint for `\.\w+\[` patterns across DOM-touching code.

**Warning signs:**
- Variables holding collection items are `undefined` without thrown errors
- Logic that walks text frames or pages skips items silently

**Phase to address:** Project scaffolding / first DOM interaction (whichever phase writes the first document traversal code)

---

### Pitfall 3: Image Placement Path Format Errors

**What goes wrong:**
Placing an image from a local path fails with "Cannot create the link resource from the given URI" or silently places nothing. This blocks the core image-fill feature entirely.

**Why it happens:**
Two separate issues combine:
1. UXP's `place()` method expects the path to begin with a leading `/` (absolute POSIX path). Node-style paths without the leading slash fail.
2. In InDesign 21.0+, paths using the `file:///` URI scheme (three slashes) fail when the plugin is installed via double-click; they only work in the UXP Developer Tool or with a single slash `file:/`.

**How to avoid:**
- Pass a plain absolute path string with a leading slash directly to `place()`: `frame.place("/Users/name/images/photo.jpg")`
- Do not use `file://` URIs at all — use the raw path string
- Normalize Excel-sourced paths at parse time: strip any `file://` prefix, ensure the path starts with `/` on macOS or a drive letter on Windows

**Warning signs:**
- Image frames remain empty after the fill operation
- Console shows "link resource" errors
- Plugin works in UXP Developer Tool but fails after production install

**Phase to address:** Image placeholder filling phase

---

### Pitfall 4: DOM Module Import Not Required at Top Level

**What goes wrong:**
Code fails with "app is not defined" or enumerators like `UndoModes` are undefined, even though the same pattern worked in older InDesign UXP examples.

**Why it happens:**
Before InDesign 18.4, the InDesign DOM was globally available. From 18.4 onward, it is a JavaScript module that must be explicitly required. Any code that relies on `app` being a global will fail silently or throw at runtime.

**How to avoid:**
Always import at the top of every file that touches InDesign:
```javascript
const { app, Document, UndoModes, ScriptLanguage } = require('indesign');
```
Never assume `app` is global. Never copy-paste snippets from pre-18.4 era without checking for missing imports.

**Warning signs:**
- `ReferenceError: app is not defined` at runtime
- Enumerators resolve to `undefined`, causing silent no-ops (e.g., wrong undo mode applied)

**Phase to address:** Project scaffolding (establish import pattern in the starter template)

---

### Pitfall 5: Async DOM Operations Are Severely Slower Than ExtendScript

**What goes wrong:**
A fill operation that takes a few seconds with synchronous ExtendScript takes 2-3 minutes with async UXP DOM calls on the same document. The plugin appears frozen.

**Why it happens:**
UXP plugins share CPU time with InDesign's own logic on a time-sliced basis. Async/await calls into the InDesign DOM have significant per-call overhead because each `await` yields control back to InDesign's scheduler. Deeply nested loops over text content with individual await calls multiply this overhead badly.

**How to avoid:**
- Move all DOM-heavy logic (text traversal, placeholder replacement, image placement) into a synchronous function and call it via `app.doScript()` — the inner function runs synchronously without async overhead
- Batch reads: collect all text frame contents in one pass, compute replacements in JS, then write in a second pass
- Avoid `await` inside tight loops that iterate over text runs or characters

**Warning signs:**
- Simple operations (replacing 10 placeholders) take more than 5 seconds
- InDesign becomes unresponsive while the plugin runs
- CPU usage stays pinned on InDesign during fill

**Phase to address:** Core template-filling phase; establish the `doScript` pattern before writing any loops

---

### Pitfall 6: Manifest Permissions Missing for File System Access

**What goes wrong:**
`require('uxp').storage.localFileSystem.getFileForOpening()` returns an error or the file picker never appears. The Excel file cannot be read. Image paths cannot be resolved.

**Why it happens:**
UXP sandboxes file system access by default. Reading files outside the plugin's own folder requires an explicit `localFileSystem` permission declaration in `manifest.json`. Missing this permission is a silent failure mode — the API may return `null` or throw without a clear message.

**How to avoid:**
Include in `manifest.json` under `requiredPermissions`:
```json
{
  "requiredPermissions": {
    "localFileSystem": "request"
  }
}
```
After adding or changing permissions in the manifest, do a full unload + reload of the plugin in the UXP Developer Tool — a simple "Reload" is not sufficient.

**Warning signs:**
- File picker shows but no file is returned after selection
- `getFileForOpening()` resolves to `null`
- Error message mentioning "permission" or "sandbox" in console

**Phase to address:** Project scaffolding / manifest setup (before any file-reading code is written)

---

### Pitfall 7: Strict Equality Fails on InDesign DOM Objects

**What goes wrong:**
Comparisons like `if (frame === selectedFrame)` or `switch(color.model)` against enum constants always fail, causing incorrect branching. The `instanceof` operator also always returns `false` for InDesign objects.

**Why it happens:**
InDesign DOM objects are proxied JavaScript objects. Strict reference equality (`===`) does not work across these proxies. Enum constants (e.g., `ColorModel.PROCESS`) may not compare equal to the value returned by the API even when they appear identical in console output.

**How to avoid:**
- Use `.equals()` method for object identity comparison: `frame.equals(selectedFrame)`
- Compare enum values as strings: `color.model.toString()` or use `.valueOf()` before comparison
- Avoid `instanceof` entirely; use property checks like `'textFrames' in obj` instead
- Use the `in` operator for property existence checks; `hasOwnProperty()` does not work on DOM objects

**Warning signs:**
- Switch statements on InDesign enums always fall through to default
- Object comparison logic always evaluates to the else branch
- `instanceof Document` always returns false

**Phase to address:** First document traversal phase; document the patterns in a shared utility module

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Calling DOM inside async loops without doScript | Simpler code, easier async/await flow | 2-3x slower execution; fragmented undo history | Never for production fill operations |
| Skipping manifest `localFileSystem` permission during early dev | Plugin loads faster, less manifest noise | File picker silently fails in production install | Never — set permissions before writing any file code |
| Copying pre-18.4 UXP snippets verbatim | Faster prototyping | Bracket notation on collections, global `app` — both silently break | Never without auditing for v18.4 API changes |
| Using `window.alert()` for debug output | Quick debugging | Crashes InDesign in v19.x+ | Never — use `console.log()` exclusively |
| Hardcoding `file:///` URIs for image paths | Works in dev tool | Fails in production install (InDesign 21.0+) | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| SheetJS (.xlsx parsing) | Trying to pass `ArrayBuffer` from `fs.readFileSync` directly to InDesign `place()` | Use SheetJS only for parsing Excel data; use the raw path string for image placement separately |
| SheetJS + UXP storage | Using Node-style `fs` to read the xlsx file | Use `require('uxp').storage.localFileSystem` to get an Entry, then read with `file.read({ format: storage.formats.binary })` to get `ArrayBuffer` for SheetJS |
| InDesign `place()` for images | Passing a `File` entry object from UXP storage API | Pass the `.nativePath` string (with leading `/`) from the `File` entry |
| InDesign color objects | Setting RGB values on a CMYK document swatch | Create the swatch with the correct color space matching the document; CMYK documents require CMYK color values |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Awaiting DOM reads inside character/word loops | Fill takes minutes not seconds | Move all DOM traversal into synchronous `doScript` inner function | At ~50+ text runs in a story |
| Re-reading `doc.stories` collection on every iteration | Exponential slowdown | Cache the collection reference before the loop | At ~10+ stories in document |
| Multiple separate `doScript` calls for one fill operation | Multiple undo steps, overhead per call | One `doScript` wrapping the entire fill operation | Every time — even one extra step breaks the UX |
| Re-querying placeholders after each replacement | Stale iterators, missed or double-replaced tokens | Collect all placeholder locations in a first pass, then apply replacements in reverse index order | At ~5+ placeholders |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Evaluating Excel cell content as code | Arbitrary code execution if a malicious xlsx file is opened | Treat all Excel values as plain strings; never `eval()` or `new Function()` cell content |
| Resolving image paths without validation | Plugin could read from unintended filesystem locations (low severity for personal tool) | Validate that resolved paths exist before passing to `place()`; catch errors from place() |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress feedback during fill operation | User assumes plugin crashed during a long fill | Show a loading state in the panel UI before calling `doScript`; update to "Done" after |
| Applying fill directly to the template document | Destroys the original template; user must undo manually | Always duplicate the document first (`doc.duplicate()`) before applying any changes |
| Silently skipping unmatched placeholders | User doesn't know `{{ProductImage}}` was left unfilled | Report unfilled placeholders back to the UI after the fill completes |
| Showing raw error objects in UI | Confusing messages like "[object Object]" | Catch all errors and display `error.message` or a human-readable fallback |
| No confirmation before overwriting an existing output document | Destructive if the user runs fill twice on the same copy | Detect if a document with the output name is already open and warn |

---

## "Looks Done But Isn't" Checklist

- [ ] **Undo:** Pressing Cmd+Z once after a fill reverts ALL changes in a single step — verify with doScript batching
- [ ] **Image placement:** Images actually appear in frames (not just empty linked placeholders) — verify by checking `frame.graphics.length > 0` after place()
- [ ] **Manifest permissions:** Plugin file picker works after a production install (not just in UXP Developer Tool) — verify by installing via double-click
- [ ] **Template safety:** Original template document is untouched after a fill — verify by checking document modification state on the source file
- [ ] **Unfilled placeholder report:** Placeholders with no mapped column show up in the plugin UI as warnings, not silently left as `{{Tag}}` in the output
- [ ] **Windows path compatibility:** Image paths from Excel work on Windows (backslash separators, drive letters like `C:\`) — test path normalization with Windows-style paths

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Undo stack fragmentation shipped to production | MEDIUM | Wrap all fill logic in `doScript` — requires refactoring but is localized to the apply function |
| Bracket notation on collections | LOW | Search-replace `\.(\w+)\[(\d+)\]` with `.$1.item($2)` across DOM-touching code |
| Missing manifest permissions | LOW | Add permission to manifest, full plugin unload + reload |
| Direct template mutation (no copy) | HIGH | Requires redesign of apply flow; all fill logic must target a copy, not the source |
| Image paths using `file:///` scheme | LOW | Normalize paths at parse time; strip URI scheme before passing to `place()` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Undo stack fragmentation | Core fill implementation | Single Cmd+Z reverts all changes |
| Bracket notation on collections | Scaffolding / first DOM code | Code review: no `collection[n]` patterns |
| Image path format errors | Image placeholder phase | Images appear in frames after production install |
| Missing `require('indesign')` imports | Scaffolding / starter template | `app` resolves correctly; no ReferenceError on load |
| Async DOM performance | Core fill implementation | Fill of 20 placeholders completes in < 5 seconds |
| Missing manifest permissions | Scaffolding | File picker returns a file after production install |
| DOM object equality | First document traversal code | Enum comparisons and object matching work correctly |
| Direct template mutation | Copy/duplicate phase | Source document shows "unmodified" after fill |

---

## Sources

- [Adobe Tech Blog: Creating the First UXP Plugin for InDesign](https://medium.com/adobetech/what-went-into-creating-the-first-ever-uxp-based-plugin-for-adobe-indesign-78bc701c5cbd) — first-hand account of undo fragmentation, coordinate system, cross-platform bugs
- [Adobe Developer Forums: No consistent undo/redo control](https://indesign.uservoice.com/forums/913162-adobe-indesign-sdk-scripting-bugs-and-features/suggestions/50340987-no-consistent-way-to-control-undo-redo-of-script-e) — community-confirmed undo issue
- [Adobe Developer Forums: How to place image from file system](https://forums.creativeclouddeveloper.com/t/how-to-place-image-from-file-system-in-uxp-indesign-script/7974) — leading-slash requirement confirmed
- [Adobe Developer Forums: UXP plugin Promises forever pending](https://community.adobe.com/t5/indesign-discussions/uxp-plugin-promises-are-forever-pending/td-p/14387348) — async thread blocking
- [Roland Dreger: indesign-uxp-scripting what_is_new.md](https://github.com/RolandDreger/indesign-uxp-scripting/blob/main/what_is_new.md) — breaking changes: collection subscript, require() import, .equals(), hasOwnProperty()
- [Adobe InDesign UXP file operations](https://developer.adobe.com/indesign/uxp/resources/recipes/file-operation/) — UXP storage API and permissions
- [SheetJS InDesign/UXP demo](https://docs.sheetjs.com/docs/demos/extensions/extendscript/) — xlsx parsing with UXP storage
- [Adobe InDesign UserVoice: UXP plugin bugs](https://indesign.uservoice.com/forums/913162-adobe-indesign-sdk-scripting-bugs-and-features/category/472282-uxp-plugins) — community-reported platform bugs
- [Adobe Developer Forums: Event listeners crash on rebuild](https://forums.creativeclouddeveloper.com/t/event-listeners-crash-indesign-when-rebuilding-a-uxp-plugin/7535) — dev-loop stability issues
- [Adobe Developer Forums: window.alert crashes InDesign](https://forums.creativeclouddeveloper.com/t/window-alert-in-a-uxp-plugin-crashes-indesign/6647) — debug API pitfall

---
*Pitfalls research for: InDesign UXP data-merge plugin*
*Researched: 2026-03-29*
