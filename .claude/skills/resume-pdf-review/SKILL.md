---
name: resume-pdf-review
description: Render the résumé print layout to a real PDF, convert pages to images, and run a designer-grade visual review (page breaks, margins, hierarchy, orphans, contact block). Use when the user asks "檢查 PDF 好不好看", "review the printed résumé", after changing print CSS / templates / résumé structure, or before sharing a PDF with a recruiter.
---

# Résumé PDF Review — print-output visual QA

The on-screen preview never shows real pagination. This skill produces the
actual PDFs (Chromium print pipeline, same engine users hit with Ctrl+P),
rasterizes every page, and reviews them against a résumé-design checklist.

## Inputs

- **Target**: production `https://ngkaizhe.com/resume` (or any `/@user/resume`)
  by default; a local dev server works the same.
- **Matrix**: the single two-column print layout × locale(s) the user cares
  about (default: `zh-TW` + `en`), and photo on/off if it matters.

## Step 1 — Generate PDFs

Playwright MCP's `browser_run_code_unsafe` exposes the full `page` object, so
`page.pdf()` works directly (headless Chromium only — it is, in this setup):

```js
async (page) => {
  await page.context().addCookies([{ name: 'locale', value: 'zh-TW', url: 'https://ngkaizhe.com' }]);
  await page.goto('https://ngkaizhe.com/resume', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: null });  // clear any leftover screen emulation
  await page.pdf({ path: '.playwright-mcp/resume-zh.pdf', format: 'A4', printBackground: true });
  return 'done';
}
```

Notes:
- `page.pdf()` uses print CSS by default, **but a leftover
  `emulateMedia({media:'screen'})` from an earlier check (e.g. smoke-test
  T1.20/T1.25 restore steps) silently overrides it** — the PDF then contains
  the full screen UI (nav, filters). Always run
  `await page.emulateMedia({ media: null })` before the first `page.pdf()`.
- Output under `.playwright-mcp/` (gitignored).
- If the photo toggle matters for the review, capture both states.

## Step 2 — Rasterize

`pdftoppm` isn't installed in WSL; use dockerized poppler:

```bash
docker run --rm -v "$PWD/.playwright-mcp:/work" minidocks/poppler \
  pdftoppm -png -r 96 /work/resume-zh.pdf /work/resume-zh
```

Produces `resume-zh-1.png`, `-2.png`, … one per page. Read each PNG
with the Read tool for visual inspection.

## Step 3 — Review checklist

Score PASS / FLAG per item; a FLAG needs a one-line symptom.

**Page 1 above the fold**
- [ ] Name + contact row + summary all on page 1, no chrome (nav, filters, buttons) leaked into the PDF
- [ ] Photo (if enabled) doesn't collide with the contact row or push the summary off-page

**Pagination**
- [ ] No section heading stranded at the very bottom of a page (orphan heading)
- [ ] No experience block whose header (org + dates) is separated from its first bullet
- [ ] No single-line widows/orphans of a bullet across a page break
- [ ] Page count sane for the content volume (1–3 pages for ~15 entries; 5+ pages = leading/spacing problem)

**Typography & rhythm**
- [ ] Clear hierarchy: name > section headings > entry titles > body; no two levels visually identical
- [ ] Line length of body text comfortable (not full-bleed edge to edge)
- [ ] Consistent vertical spacing between sections (no accordion effect)
- [ ] Skills rows align; category labels don't wrap awkwardly

**Print hygiene**
- [ ] Links legible as text (bare domains — not raw long URLs, not invisible)
- [ ] No dark-theme bleed (white page, dark text) regardless of the viewer's screen theme
- [ ] Accent colors (impact green, verb colors) still readable in grayscale-ish print

## Step 4 — Report

Structured verdict per locale/photo variant: pages, PASS count, FLAGs with
page number + symptom, then what to fix first. Attach or Read the
worst-offending page image so the user sees the problem, not a description.

## Cleanup

Delete generated `.playwright-mcp/resume-*.pdf/png` after the report (or tell
the user where they are if they want to keep a copy — the PDFs are genuinely
useful artifacts).
