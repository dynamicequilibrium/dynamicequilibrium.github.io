# Evidence-graded guides: how to maintain them

Patient-facing how-to pages at `/guides/<slug>/` (EN) and `/ru/guides/<slug>/` (RU), plus hubs at `/guides/` and `/ru/guides/`. Source files live here; `tools/build_guides.py` turns them into plain static HTML, which is committed. Hosting and the Pages workflow are unchanged. Standard library only, Python 3.8+.

```
python3 tools/build_guides.py            # rebuild pages + sitemap block
python3 tools/build_guides.py --check    # CI-style: fails on stale output or invalid content
python3 tools/build_guides.py --verify   # check every PMID/DOI against NCBI (network)
python3 tools/build_guides.py --check --brain ~/GitHub/scdnb   # flag guides whose source note was re-reviewed since
```

Edit a source file, run the build, review the diff, commit. Never edit `guides/` or `ru/guides/` by hand: the next build overwrites it.

## Layout of one guide

```
_src/guides/<slug>/
  meta.json     slug, category, grade, order, dates, related, sources[], figtext
  en.md  ru.md  frontmatter + prose (same structure in both languages)
  hero.svg      decorative banner (inlined, aria-hidden)
  fig-*.svg     data figures, inlined; text comes from meta.json "figtext"
```

`meta.json` essentials: `grade` (A|B|C), `category` (nutrition|movement|sleep), `source_note` and `source_reviewed` (the evidence-base note it was built from and its `last_reviewed` date at build time), `updated` (shown as "Last reviewed"; change it only when the content was actually re-checked), and `sources`. Each source has `id`, `type` (rct|meta|review|umbrella|cohort|guideline), `cite`, `pmid`, `doi`, and `note_en` / `note_ru`, the one line saying what the study showed.

Markdown frontmatter: `title`, `description` (meta tag), `blurb` (hub card), `lede`, `glance` (list). Supported body syntax: `##`/`###`, lists, pipe tables, `**bold**`, `*italic*`, links, `[^id]` or `[^id1,id2]` citations (numbered in order of first use; uncited sources still appear in the reference list), and blocks closed by a line of `:::`: `:::callout safety|tip|note Title`, `:::plan Title`, `:::details Summary`. `:::figure fig-x.svg | caption` is a single line with no closer.

## Adding a guide

1. Start from a graded note in `10-work/practice/evidence-base/` in the scdnb brain. Population evidence only, no patient data.
2. Copy an existing guide folder, rewrite `meta.json`, `en.md`, `ru.md`, `hero.svg` and one figure.
3. Run `--verify`, then the build, and read both pages in the browser, light and dark, plus a phone width.
4. Have `clinical-critic` review the new guide (claims against the note, safety boxes, example plans) and run `deslop` on the Russian text.
5. Add the slug to `related` in two or three sibling guides.

## Updating after new evidence

Run the `challenger` skill in the brain, accept changes into the evidence-base note, then update the guide: sources, numbers, grade, `source_reviewed`, `updated`. `--brain` lists guides whose note has moved on.

## Principles this protects

- Every claim traces to a citation; the grade describes the evidence, not how important the advice is.
- Caution boxes mirror the note's "who should avoid or modify". Do not weaken them in a rewrite.
- Charts marked "schematic" show the shape of a finding, not measured values. Real numbers are labelled as such.
- No patient data, no individual advice. Each page says so.
