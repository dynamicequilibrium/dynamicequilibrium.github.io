#!/usr/bin/env python3
"""Build the evidence-graded patient guides (EN + RU) into plain static HTML.

    python3 tools/build_guides.py            # write guides/, ru/guides/, sitemap block
    python3 tools/build_guides.py --check    # fail if built files are stale or content is invalid
    python3 tools/build_guides.py --verify   # check every PMID against NCBI (needs network)
    python3 tools/build_guides.py --check --brain ~/GitHub/scdnb
                                             # also flag guides whose source note was re-reviewed since

Source of truth: _src/guides/<slug>/{meta.json, en.md, ru.md, figure + hero SVGs}.
Standard library only (Python 3.8+). Full how-to: _src/guides/README.md.
"""
import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_src" / "guides"
SITE = "https://dynamicequilibrium.org"
LANGS = ("en", "ru")
GRADES = ("A", "B", "C")
CATEGORIES = ("nutrition", "movement", "sleep")
SOURCE_TYPES = ("rct", "meta", "review", "umbrella", "cohort", "guideline")

# --------------------------------------------------------------------------- UI strings
T = {
    "en": {
        "lang_name": "English", "locale": "en_US", "prefix": "", "home": "/",
        "nav_label": "Sections",
        "nav": [("#who", "Who it’s for"), ("#how", "How it works"), ("#fees", "Fees"), ("#about", "About"), ("#faq", "FAQ")],
        "guides": "Guides", "guides_url": "/guides/", "how_i_work": "How I work", "how_url": "/methodology/",
        "cta_nav": "Request a consultation", "cta_drawer": "Request a consultation",
        "menu": "Menu", "close": "Close", "language": "Language", "theme": "Toggle light/dark theme", "skip": "Skip to content",
        "privacy": "Privacy", "terms": "Terms", "privacy_url": "/privacy.html", "terms_url": "/terms.html",
        "legal": "Dynamic Equilibrium offers consultative and educational support by a physician. It is not a medical service and does not replace formal diagnosis, treatment or emergency care from your own doctors. In an emergency, contact your local emergency services.",
        "breadcrumb": "Breadcrumb", "home_label": "Home",
        "cat": {"nutrition": "Nutrition", "movement": "Movement", "sleep": "Sleep"},
        "cat_blurb": {
            "nutrition": "Eating patterns with example days, swaps and shopping lists.",
            "movement": "How much, how often and how to start, without a gym membership.",
            "sleep": "Timing and routine: the cheapest health intervention there is.",
        },
        "grade_word": "Evidence", "grade_names": {"A": "Strong", "B": "Moderate", "C": "Limited but plausible"},
        "grade_plain": {
            "A": "Consistent results from high-quality meta-analyses or several trials, a clear size of benefit, well-understood risks.",
            "B": "At least one good systematic review or several solid trials. Promising, with real uncertainty about dose, groups or the long term.",
            "C": "Some human evidence, but small, mixed or specific to one condition. Reasonable and low-risk, not proven.",
        },
        "legend_title": "How I grade the evidence",
        "legend_intro": "Every guide carries a grade. It describes how well the research supports the advice, not how important the advice is. Grades come from a written rubric and are re-checked as new studies appear.",
        "legend_foot": "Grade D (animal, mechanistic or influencer-driven claims) and E (disproven or unsafe) are not published here.",
        "reviewed": "Last reviewed", "min_read": "min read", "print": "Print this guide", "toc": "On this page",
        "glance": "At a glance", "references": "References", "refs_intro": "Each reference links to PubMed or the publisher. The tag shows what kind of study it is; the grade above reflects all of them together, not any single one.",
        "pubmed": "PubMed", "doi": "DOI", "related": "Related guides", "all_guides": "All guides",
        "types": {"rct": "Randomised trial", "meta": "Meta-analysis", "review": "Systematic review",
                  "umbrella": "Umbrella review", "cohort": "Cohort study", "guideline": "Guideline"},
        "disc_title": "This is general information, not personal medical advice",
        "disc": "It summarises published research for adults in general. It does not know your diagnoses, medicines or history. If you have a medical condition, take regular medication or are pregnant, check with your own doctor before changing what you eat or how you train, and follow the plan you were given if it differs from this page.",
        "cta_h": "Want this fitted to you?", "cta_p": "A consultation turns general evidence into a short plan for your history, results and life.",
        "cta_b": "Request a consultation", "cta_url": "/#contact",
        "hub_eyebrow": "Guides", "hub_h": "Evidence-graded guides",
        "hub_lede": "Practical how-to guides built on published research: what to do, how to start, what an example day or week looks like, and exactly how strong the evidence is. Free to read, print and share.",
        "hub_title": "Evidence-graded guides — Dynamic Equilibrium",
        "hub_desc": "Practical guides to eating, movement and sleep, each with an example plan, safety notes and graded references to the research.",
        "grade_filter": "Grade",
        "sticky": "Request a consultation",
    },
    "ru": {
        "lang_name": "Русский", "locale": "ru_RU", "prefix": "/ru", "home": "/ru/",
        "nav_label": "Разделы",
        "nav": [("#who", "Для кого"), ("#how", "Как работаем"), ("#fees", "Стоимость"), ("#about", "Обо мне"), ("#faq", "Вопросы")],
        "guides": "Руководства", "guides_url": "/ru/guides/", "how_i_work": "Как я работаю", "how_url": "/ru/methodology/",
        "cta_nav": "Оставить запрос", "cta_drawer": "Запросить консультацию",
        "menu": "Меню", "close": "Закрыть", "language": "Язык", "theme": "Сменить тему", "skip": "К содержанию",
        "privacy": "Конфиденциальность", "terms": "Условия", "privacy_url": "/ru/privacy.html", "terms_url": "/ru/terms.html",
        "legal": "Dynamic Equilibrium — это консультационная и образовательная поддержка врача. Это не медицинская услуга, она не заменяет диагностику, лечение и неотложную помощь у ваших лечащих врачей. В экстренной ситуации звоните в местную службу экстренной помощи.",
        "breadcrumb": "Навигация", "home_label": "Главная",
        "cat": {"nutrition": "Питание", "movement": "Движение", "sleep": "Сон"},
        "cat_blurb": {
            "nutrition": "Модели питания с примерами дней, заменами и списками покупок.",
            "movement": "Сколько, как часто и с чего начать, без абонемента в зал.",
            "sleep": "Режим и ритуалы: самое дешёвое вмешательство для здоровья.",
        },
        "grade_word": "Доказательность", "grade_names": {"A": "Сильная", "B": "Умеренная", "C": "Ограниченная, но правдоподобная"},
        "grade_plain": {
            "A": "Согласованные результаты качественных метаанализов или нескольких исследований, понятный размер пользы, хорошо изученные риски.",
            "B": "Минимум один хороший систематический обзор или несколько надёжных исследований. Многообещающе, но остаётся неопределённость: доза, группы, отдалённые результаты.",
            "C": "Есть данные на людях, но они небольшие, противоречивые или относятся к одному состоянию. Разумно и безопасно, но не доказано.",
        },
        "legend_title": "Как я оцениваю доказательность",
        "legend_intro": "У каждого руководства есть оценка. Она показывает, насколько исследования подтверждают совет, а не насколько совет важен. Оценки следуют письменной шкале и пересматриваются, когда выходят новые работы.",
        "legend_foot": "Оценки D (опыты на животных, только механизм, заявления блогеров) и E (опровергнуто или небезопасно) здесь не публикуются.",
        "reviewed": "Проверено", "min_read": "мин чтения", "print": "Распечатать", "toc": "На странице",
        "glance": "Коротко", "references": "Источники", "refs_intro": "Каждый источник ведёт на PubMed или сайт издателя. Метка показывает тип исследования; оценка вверху отражает все источники вместе, а не какой-то один.",
        "pubmed": "PubMed", "doi": "DOI", "related": "Смотрите также", "all_guides": "Все руководства",
        "types": {"rct": "Рандомизированное исследование", "meta": "Метаанализ", "review": "Систематический обзор",
                  "umbrella": "Зонтичный обзор", "cohort": "Когортное исследование", "guideline": "Клинические рекомендации"},
        "disc_title": "Это общая информация, а не персональная медицинская рекомендация",
        "disc": "Здесь кратко изложены опубликованные исследования для взрослых в целом. Текст ничего не знает о ваших диагнозах, лекарствах и истории. Если у вас есть заболевание, вы постоянно принимаете лекарства или беременны, до изменения питания или тренировок обсудите это со своим врачом, а если вам дали персональный план, который расходится с этой страницей, следуйте плану.",
        "cta_h": "Нужно подогнать это под вас?", "cta_p": "Консультация превращает общие данные в короткий план под вашу историю, анализы и жизнь.",
        "cta_b": "Оставить запрос", "cta_url": "/ru/#contact",
        "hub_eyebrow": "Руководства", "hub_h": "Руководства с оценкой доказательности",
        "hub_lede": "Практические руководства на основе опубликованных исследований: что делать, с чего начать, как выглядит примерный день или неделя и насколько сильны данные. Можно читать, печатать и пересылать бесплатно.",
        "hub_title": "Руководства с оценкой доказательности — Dynamic Equilibrium",
        "hub_desc": "Практические руководства по питанию, движению и сну: примерный план, меры предосторожности и источники с оценкой доказательности.",
        "grade_filter": "Оценка",
        "sticky": "Оставить запрос",
    },
}

# --------------------------------------------------------------------------- tiny markdown
def esc(s):
    return html.escape(s, quote=True)


class Doc:
    """Per-render state: citation numbering in order of first use."""
    def __init__(self, sources):
        self.sources = {s["id"]: s for s in sources}
        self.order = []
        self.errors = []

    def cite(self, ids):
        out = []
        for i in ids.split(","):
            i = i.strip()
            if i not in self.sources:
                self.errors.append("unknown citation id: %s" % i)
                continue
            if i not in self.order:
                self.order.append(i)
            out.append('<a href="#ref-%s">%d</a>' % (esc(i), self.order.index(i) + 1))
        return '<sup class="cite">%s</sup>' % ", ".join(out)


def inline(text, doc):
    t = esc(text)
    t = re.sub(r"\[\^([a-z0-9_,\- ]+)\]", lambda m: doc.cite(m.group(1)), t)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: '<a href="%s">%s</a>' % (m.group(2), m.group(1)), t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)", r"<em>\1</em>", t)
    return t


def slugify(s):
    s = re.sub(r"[^\w\s-]", "", s.lower(), flags=re.U)
    return re.sub(r"[\s_]+", "-", s.strip())


def parse_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise ValueError("missing frontmatter")
    fm, key = {}, None
    for line in m.group(1).split("\n"):
        if re.match(r"^\s+- ", line) and key:
            fm[key].append(line.strip()[2:].strip().strip('"'))
        elif ":" in line:
            key, _, val = line.partition(":")
            key, val = key.strip(), val.strip()
            if val == "":
                fm[key] = []
            else:
                fm[key] = val.strip('"')
    return fm, m.group(2)


class Ctx:
    def __init__(self, meta, lang, doc, gdir):
        self.meta, self.lang, self.doc, self.gdir = meta, lang, doc, gdir
        self.headings = []


def load_svg(ctx, name, label, hidden=False):
    path = ctx.gdir / name
    if not path.exists():
        ctx.doc.errors.append("missing svg: %s" % name)
        return ""
    svg = re.sub(r"<\?xml.*?\?>\s*", "", path.read_text(encoding="utf-8"))
    figtext = ctx.meta.get("figtext", {})

    def sub(m):
        entry = figtext.get(m.group(1))
        if not entry or ctx.lang not in entry:
            ctx.doc.errors.append("figtext missing %s/%s in %s" % (m.group(1), ctx.lang, name))
            return ""
        return esc(entry[ctx.lang])

    svg = re.sub(r"\{\{t:([a-z0-9_]+)\}\}", sub, svg)
    attrs = 'aria-hidden="true" focusable="false"' if hidden else 'role="img" aria-label="%s"' % esc(label)
    return svg.replace("<svg", "<svg " + attrs, 1)


def render_blocks(lines, ctx):
    out, i = [], 0
    doc = ctx.doc
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.strip() == ":::":
            doc.errors.append("stray ::: closing line")
            i += 1
            continue
        m = re.match(r"^:::(\w+)(?:\s+(.*))?$", line)
        if m:
            kind, arg = m.group(1), (m.group(2) or "").strip()
            if kind == "figure":
                name, _, cap = arg.partition("|")
                out.append('<figure class="g-fig">%s<figcaption>%s</figcaption></figure>'
                           % (load_svg(ctx, name.strip(), cap.strip()), inline(cap.strip(), doc)))
                i += 1
                continue
            depth, j = 1, i + 1
            while j < len(lines) and depth:
                if re.match(r"^:::\w+", lines[j]):
                    depth += 1
                elif lines[j].strip() == ":::":
                    depth -= 1
                j += 1
            inner = render_blocks(lines[i + 1:j - 1], ctx)
            if kind == "callout":
                variant, _, title = arg.partition(" ")
                variant = variant if variant in ("safety", "tip", "note") else "note"
                head = '<h3 class="callout-h">%s</h3>' % inline(title, doc) if title else ""
                out.append('<aside class="callout callout-%s">%s%s</aside>' % (variant, head, inner))
            elif kind == "plan":
                out.append('<section class="plan-box"><h3 class="plan-h">%s</h3>%s</section>' % (inline(arg, doc), inner))
            elif kind == "details":
                out.append('<details class="g-details"><summary>%s</summary><div class="g-details-body">%s</div></details>' % (inline(arg, doc), inner))
            else:
                doc.errors.append("unknown block :::%s" % kind)
            i = j
            continue
        m = re.match(r"^(#{2,3})\s+(.*)$", line)
        if m:
            level, text = len(m.group(1)), m.group(2).strip()
            hid = slugify(text)
            if level == 2:
                ctx.headings.append((hid, text))
            out.append('<h%d id="%s">%s</h%d>' % (level, hid, inline(text, doc), level))
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head, body = rows[0], [r for r in rows[2:]] if len(rows) > 1 and re.match(r"^[\s:\-|]+$", "|".join(rows[1])) else rows[1:]
            th = "".join("<th scope=\"col\">%s</th>" % inline(c, doc) for c in head)
            tb = "".join("<tr>%s</tr>" % "".join(
                ("<th scope=\"row\">%s</th>" if k == 0 else "<td>%s</td>") % inline(c, doc) for k, c in enumerate(r)) for r in body)
            out.append('<div class="g-table"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (th, tb))
            continue
        if re.match(r"^(- |\d+\. )", line):
            ordered = bool(re.match(r"^\d+\. ", line))
            items = []
            while i < len(lines) and re.match(r"^(- |\d+\. )", lines[i]):
                items.append(re.sub(r"^(- |\d+\. )", "", lines[i]))
                i += 1
            tag = "ol" if ordered else "ul"
            out.append("<%s>%s</%s>" % (tag, "".join("<li>%s</li>" % inline(x, doc) for x in items), tag))
            continue
        if line.startswith("> "):
            buf = []
            while i < len(lines) and lines[i].startswith("> "):
                buf.append(lines[i][2:])
                i += 1
            out.append("<blockquote><p>%s</p></blockquote>" % inline(" ".join(buf), doc))
            continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(:::|#{2,3} |\||- |\d+\. |> )", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        out.append("<p>%s</p>" % inline(" ".join(buf), doc))
    return "\n".join(out)


# --------------------------------------------------------------------------- page chrome
def head_html(lang, title, desc, path_en, path_ru, canonical_path, og_title=None):
    s = T[lang]
    url = SITE + canonical_path
    other = "ru" if lang == "en" else "en"
    return """<!DOCTYPE html>
<html lang="%(lang)s">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>%(title)s</title>
  <meta name="description" content="%(desc)s"/>
  <meta name="theme-color" content="#F5F4F0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="robots" content="index,follow"/>

  <link rel="canonical" href="%(url)s"/>
  <link rel="alternate" hreflang="en" href="%(en)s"/>
  <link rel="alternate" hreflang="ru" href="%(ru)s"/>
  <link rel="alternate" hreflang="x-default" href="%(en)s"/>

  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="Dynamic Equilibrium"/>
  <meta property="og:locale" content="%(locale)s"/>
  <meta property="og:locale:alternate" content="%(olocale)s"/>
  <meta property="og:title" content="%(title)s"/>
  <meta property="og:description" content="%(desc)s"/>
  <meta property="og:url" content="%(url)s"/>
  <meta property="og:image" content="%(site)s/og/dynamic-equilibrium%(ogsuf)s.jpg"/>
  <meta property="og:image:alt" content="Dynamic Equilibrium"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="%(title)s"/>
  <meta name="twitter:description" content="%(desc)s"/>
  <meta name="twitter:image" content="%(site)s/og/dynamic-equilibrium%(ogsuf)s.jpg"/>

  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"/>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
  <link rel="manifest" href="/site.webmanifest"/>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Literata:opsz,wght@7..72,500;7..72,600&amp;family=Newsreader:opsz,wght@6..72,500;6..72,600&amp;display=swap"/>
  <link rel="stylesheet" href="/assets/site.css"/>
  <script defer src="/assets/site.js"></script>

  <!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HEBPPBGBBX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-HEBPPBGBBX');
</script>
</head>
""" % {"lang": lang, "title": esc(title), "desc": esc(desc), "url": url, "en": SITE + path_en, "ru": SITE + path_ru,
       "locale": s["locale"], "olocale": T[other]["locale"], "site": SITE, "ogsuf": "-en" if lang == "en" else ""}


def chrome_top(lang, path_en, path_ru):
    s = T[lang]
    pre = s["prefix"] + "/"
    links = "".join('<a href="%s%s">%s</a>' % (pre, h, t) for h, t in s["nav"])
    nav_links = links + '<a href="%s">%s</a><a class="btn btn-outline btn-sm" href="%s">%s</a>' % (s["guides_url"], s["guides"], s["cta_url"], s["cta_nav"])
    drawer_links = links + '<a href="%s">%s</a><a href="%s">%s</a><a class="btn btn-primary" href="%s">%s</a>' % (
        s["guides_url"], s["guides"], s["how_url"], s["how_i_work"], s["cta_url"], s["cta_drawer"])
    cur_en = ' aria-current="true"' if lang == "en" else ""
    cur_ru = ' aria-current="true"' if lang == "ru" else ""
    switch = '<a href="%s" hreflang="ru" lang="ru"%s>RU</a><a href="%s" hreflang="en" lang="en"%s>EN</a>' % (path_ru, cur_ru, path_en, cur_en)
    return """<body data-theme="light">
<a class="skip" href="#main">%(skip)s</a>
<header class="nav">
  <div class="container nav-inner">
    <a class="brand" href="%(home)s" aria-label="Dynamic Equilibrium">
      <img data-logo src="/images/logo-black.svg" alt="" width="40" height="40"/>
      <span>Dynamic Equilibrium</span>
    </a>
    <nav class="nav-links" aria-label="%(navlabel)s">%(nav)s</nav>
    <div class="nav-ctrls">
      <div class="lang-switch" role="group" aria-label="%(language)s">%(switch)s</div>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="%(theme)s" title="%(theme)s">◐</button>
      <button class="icon-btn menu-toggle" id="menuToggle" type="button" aria-label="%(menu)s" aria-controls="drawer" aria-expanded="false"><span class="burger" aria-hidden="true"></span></button>
    </div>
  </div>
</header>

<aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-label="%(menu)s">
  <button class="drawer-backdrop" type="button" data-drawer-close aria-label="%(close)s"></button>
  <div class="drawer-panel">
    <button class="icon-btn drawer-close" type="button" data-drawer-close aria-label="%(close)s">✕</button>
    <nav class="drawer-links" aria-label="%(navlabel)s">%(drawer)s</nav>
    <div class="drawer-foot"><div class="lang-switch" style="display:flex" role="group" aria-label="%(language)s">%(switch)s</div>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="%(theme)s">◐</button></div>
  </div>
</aside>
""" % {"skip": s["skip"], "home": s["home"], "navlabel": s["nav_label"], "nav": nav_links, "language": s["language"],
       "switch": switch, "theme": s["theme"], "menu": s["menu"], "close": s["close"], "drawer": drawer_links}


def chrome_bottom(lang):
    s = T[lang]
    return """<footer class="site">
  <div class="container foot">
    <div>© <span id="y">2026</span> Dynamic Equilibrium · Alexander Lebedev, MD, PhD</div>
    <div class="links">
      <a href="%(guides_url)s">%(guides)s</a>
      <a href="%(how_url)s">%(how)s</a>
      <a href="%(privacy_url)s">%(privacy)s</a>
      <a href="%(terms_url)s">%(terms)s</a>
      <a href="https://www.instagram.com/dr_alexander_lebedev" target="_blank" rel="noopener">Instagram</a>
      <a href="https://www.linkedin.com/in/alexandervlebedev/" target="_blank" rel="noopener">LinkedIn</a>
    </div>
    <p class="legal">%(legal)s</p>
  </div>
</footer>
</body>
</html>
""" % {"guides_url": s["guides_url"], "guides": s["guides"], "how_url": s["how_url"], "how": s["how_i_work"],
       "privacy_url": s["privacy_url"], "privacy": s["privacy"], "terms_url": s["terms_url"], "terms": s["terms"], "legal": esc(s["legal"])}


def grade_badge(lang, grade, long=True):
    s = T[lang]
    label = '<span class="grade-label">%s</span>' % esc(s["grade_names"][grade]) if long else ""
    return '<span class="grade grade-%s" title="%s"><b>%s</b>%s</span>' % (grade, esc(s["grade_plain"][grade]), grade, label)


def legend_html(lang):
    s = T[lang]
    rows = "".join('<li>%s<span>%s</span></li>' % (grade_badge(lang, g), esc(s["grade_plain"][g])) for g in GRADES)
    return ('<details class="g-details legend"><summary>%s</summary><div class="g-details-body"><p>%s</p><ul class="legend-list">%s</ul>'
            '<p class="note">%s</p></div></details>') % (esc(s["legend_title"]), esc(s["legend_intro"]), rows, esc(s["legend_foot"]))


def guide_path(lang, slug=None):
    base = "/guides/" if lang == "en" else "/ru/guides/"
    return base + (slug + "/" if slug else "")


# --------------------------------------------------------------------------- guide page
def render_guide(meta, lang, gdir, all_meta, title_index):
    s = T[lang]
    fm, body = parse_frontmatter((gdir / ("%s.md" % lang)).read_text(encoding="utf-8"))
    doc = Doc(meta["sources"])
    ctx = Ctx(meta, lang, doc, gdir)
    body_html = render_blocks(body.split("\n"), ctx)
    words = len(re.findall(r"\w+", body))
    minutes = max(1, round(words / 200.0))
    grade = meta["grade"]
    slug = meta["slug"]

    for req in ("title", "description", "lede", "glance"):
        if not fm.get(req):
            doc.errors.append("%s.md: missing frontmatter '%s'" % (lang, req))

    # references: cited first (in order), then any uncited source
    order = doc.order + [x["id"] for x in meta["sources"] if x["id"] not in doc.order]
    byid = {x["id"]: x for x in meta["sources"]}
    refs = []
    for n, rid in enumerate(order, 1):
        x = byid[rid]
        links = []
        if x.get("pmid"):
            links.append('<a href="https://pubmed.ncbi.nlm.nih.gov/%s/" rel="noopener">%s %s</a>' % (x["pmid"], s["pubmed"], x["pmid"]))
        if x.get("doi"):
            links.append('<a href="https://doi.org/%s" rel="noopener">%s</a>' % (esc(x["doi"]), s["doi"]))
        if x.get("url"):
            links.append('<a href="%s" rel="noopener">%s</a>' % (esc(x["url"]), esc(x["url"].split("/")[2])))
        note = x.get("note_" + lang)
        if not note:
            doc.errors.append("source %s: missing note_%s" % (rid, lang))
            note = ""
        refs.append('<li id="ref-%s"><span class="ref-type">%s</span> %s <span class="ref-note">%s</span> <span class="ref-links">%s</span></li>' % (
            esc(rid), esc(s["types"][x["type"]]), esc(x["cite"]), esc(note), " · ".join(links)))
    refs_html = '<ol class="refs">%s</ol>' % "".join(refs)

    toc = "".join('<li><a href="#%s">%s</a></li>' % (h, esc(t)) for h, t in ctx.headings)
    toc += '<li><a href="#references">%s</a></li>' % esc(s["references"])
    glance = "".join("<li>%s</li>" % inline(x, doc) for x in fm.get("glance", []))

    related = ""
    cards = []
    for r in meta.get("related", []):
        if r in title_index:
            rm = title_index[r]
            cards.append('<a class="gcard" href="%s"><span class="gcard-top">%s<span class="gcard-cat">%s</span></span><h3>%s</h3><p>%s</p></a>' % (
                guide_path(lang, r), grade_badge(lang, rm["grade"], long=False), esc(s["cat"][rm["category"]]),
                esc(rm["titles"][lang]), esc(rm["ledes"][lang])))
        else:
            doc.errors.append("related guide not found: %s" % r)
    if cards:
        related = '<section class="g-related"><h2>%s</h2><div class="grid-3">%s</div></section>' % (esc(s["related"]), "".join(cards))

    reviewed = meta["updated"]
    page_path = guide_path(lang, slug)
    en_path, ru_path = guide_path("en", slug), guide_path("ru", slug)
    hero = load_svg(ctx, "hero.svg", fm.get("title", slug), hidden=True)

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Organization", "@id": SITE + "/#org", "name": "Dynamic Equilibrium", "url": SITE + "/",
             "logo": SITE + "/images/logo-black.svg", "founder": {"@id": SITE + "/#person"}},
            {"@type": "Person", "@id": SITE + "/#person", "name": "Alexander Lebedev", "honorificSuffix": "MD, PhD",
             "jobTitle": "Physician and neuroscientist", "url": SITE + "/", "worksFor": {"@id": SITE + "/#org"}},
            {"@type": ["MedicalWebPage", "Article"], "url": SITE + page_path, "name": fm.get("title", ""),
             "headline": fm.get("title", ""), "description": fm.get("description", ""), "inLanguage": lang,
             "dateModified": reviewed, "datePublished": meta["published"], "lastReviewed": reviewed,
             "author": {"@id": SITE + "/#person"}, "reviewedBy": {"@id": SITE + "/#person"},
             "publisher": {"@id": SITE + "/#org"},
             "isPartOf": {"@type": "WebSite", "name": "Dynamic Equilibrium", "url": SITE + "/"},
             "citation": [dict([("@type", "ScholarlyArticle"), ("name", byid[r]["cite"])] +
                               ([("sameAs", "https://pubmed.ncbi.nlm.nih.gov/%s/" % byid[r]["pmid"])] if byid[r].get("pmid") else []))
                          for r in order]},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": s["guides"], "item": SITE + guide_path(lang)},
                {"@type": "ListItem", "position": 2, "name": fm.get("title", ""), "item": SITE + page_path}]},
        ],
    }

    page = head_html(lang, "%s — Dynamic Equilibrium" % fm.get("title", ""), fm.get("description", ""), en_path, ru_path, page_path)
    page += chrome_top(lang, en_path, ru_path)
    page += """
<main id="main">
<div class="container guide">
  <nav class="crumbs" aria-label="%(bc)s"><a href="%(home)s">%(home_label)s</a><span aria-hidden="true">›</span><a href="%(hub)s">%(guides)s</a><span aria-hidden="true">›</span><span>%(cat)s</span></nav>
  <div class="page-head">
    <span class="eyebrow">%(cat)s</span>
    <h1>%(title)s</h1>
    <p class="lede">%(lede)s</p>
    <div class="g-meta">
      <span class="g-meta-item"><span class="g-meta-k">%(gword)s</span> %(badge)s</span>
      <span class="g-meta-item"><span class="g-meta-k">%(reviewed_k)s</span> <time datetime="%(reviewed)s">%(reviewed)s</time></span>
      <span class="g-meta-item">%(minutes)d %(minread)s</span>
      <button class="btn btn-ghost btn-sm no-print" type="button" data-print>%(print)s</button>
    </div>
  </div>
  <div class="guide-hero" aria-hidden="true">%(hero)s</div>

  <div class="guide-layout">
    <div class="guide-main">
      <section class="card glance"><h2 class="glance-h">%(glance_h)s</h2><ul class="check">%(glance)s</ul></section>
      <div class="prose guide-prose">
%(body)s
        <h2 id="references">%(references)s</h2>
        <p class="note">%(refs_intro)s</p>
%(refs)s
      </div>
      %(legend)s
      <aside class="callout callout-note g-disclaimer"><h3 class="callout-h">%(disc_t)s</h3><p>%(disc)s</p></aside>
      %(related)s
      <div class="card g-cta">
        <div><h3>%(cta_h)s</h3><p class="muted">%(cta_p)s</p></div>
        <a class="btn btn-primary" href="%(cta_url)s">%(cta_b)s</a>
      </div>
    </div>
    <aside class="guide-side no-print" aria-label="%(toc)s">
      <p class="qhead">%(toc)s</p>
      <ul class="side-toc">%(toc_items)s</ul>
    </aside>
  </div>
</div>
</main>

<script type="application/ld+json">
%(ld)s
</script>
""" % {"bc": s["breadcrumb"], "home": s["home"], "home_label": s["home_label"], "hub": guide_path(lang), "guides": s["guides"], "cat": esc(s["cat"][meta["category"]]),
       "title": esc(fm.get("title", "")), "lede": inline(fm.get("lede", ""), doc), "gword": esc(s["grade_word"]),
       "badge": grade_badge(lang, grade), "reviewed_k": esc(s["reviewed"]), "reviewed": reviewed, "minutes": minutes,
       "minread": esc(s["min_read"]), "print": esc(s["print"]), "hero": hero, "glance_h": esc(s["glance"]), "glance": glance,
       "body": body_html, "references": esc(s["references"]), "refs_intro": esc(s["refs_intro"]), "refs": refs_html,
       "legend": legend_html(lang), "disc_t": esc(s["disc_title"]), "disc": esc(s["disc"]), "related": related,
       "cta_h": esc(s["cta_h"]), "cta_p": esc(s["cta_p"]), "cta_url": s["cta_url"], "cta_b": esc(s["cta_b"]),
       "toc": esc(s["toc"]), "toc_items": toc, "ld": json.dumps(ld, ensure_ascii=False, indent=2)}
    page += chrome_bottom(lang)
    return page, doc.errors


# --------------------------------------------------------------------------- hub page
def render_hub(lang, metas):
    s = T[lang]
    page_path = guide_path(lang)
    en_path, ru_path = guide_path("en"), guide_path("ru")
    sections = []
    for cat in CATEGORIES:
        items = sorted([m for m in metas if m["category"] == cat], key=lambda m: (m.get("order", 99), m["slug"]))
        if not items:
            continue
        cards = "".join(
            '<a class="gcard" href="%s"><span class="gcard-top">%s</span><h3>%s</h3><p>%s</p></a>' % (
                guide_path(lang, m["slug"]), grade_badge(lang, m["grade"]),
                esc(m["titles"][lang]), esc(m["ledes"][lang])) for m in items)
        sections.append('<section class="g-cat" id="%s"><h2>%s</h2><p class="muted">%s</p><div class="grid-3">%s</div></section>' % (
            cat, esc(s["cat"][cat]), esc(s["cat_blurb"][cat]), cards))
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "url": SITE + page_path, "name": s["hub_h"],
          "description": s["hub_desc"], "inLanguage": lang,
          "hasPart": [{"@type": "WebPage", "url": SITE + guide_path(lang, m["slug"]), "name": m["titles"][lang]} for m in metas]}
    page = head_html(lang, s["hub_title"], s["hub_desc"], en_path, ru_path, page_path)
    page += chrome_top(lang, en_path, ru_path)
    page += """
<main id="main">
<div class="container guide">
  <nav class="crumbs" aria-label="%(bc)s"><a href="%(home)s">%(home_label)s</a><span aria-hidden="true">›</span><span>%(guides)s</span></nav>
  <div class="page-head">
    <span class="eyebrow">%(eyebrow)s</span>
    <h1>%(h)s</h1>
    <p class="lede">%(lede)s</p>
  </div>
  %(legend)s
  <div class="g-hub">%(sections)s</div>
  <div class="card g-cta">
    <div><h3>%(cta_h)s</h3><p class="muted">%(cta_p)s</p></div>
    <a class="btn btn-primary" href="%(cta_url)s">%(cta_b)s</a>
  </div>
</div>
</main>
<script type="application/ld+json">
%(ld)s
</script>
""" % {"bc": s["breadcrumb"], "home": s["home"], "home_label": s["home_label"], "guides": s["guides"], "eyebrow": esc(s["hub_eyebrow"]), "h": esc(s["hub_h"]), "lede": esc(s["hub_lede"]), "legend": legend_html(lang),
       "sections": "".join(sections), "cta_h": esc(s["cta_h"]), "cta_p": esc(s["cta_p"]), "cta_url": s["cta_url"],
       "cta_b": esc(s["cta_b"]), "ld": json.dumps(ld, ensure_ascii=False, indent=2)}
    page += chrome_bottom(lang)
    return page


# --------------------------------------------------------------------------- orchestration
def load_all():
    metas, errors = [], []
    for d in sorted(p for p in SRC.iterdir() if p.is_dir()):
        mp = d / "meta.json"
        if not mp.exists():
            errors.append("%s: no meta.json" % d.name)
            continue
        m = json.loads(mp.read_text(encoding="utf-8"))
        if m.get("slug") != d.name:
            errors.append("%s: slug mismatch (%s)" % (d.name, m.get("slug")))
        if m.get("grade") not in GRADES:
            errors.append("%s: grade must be one of %s" % (d.name, GRADES))
        if m.get("category") not in CATEGORIES:
            errors.append("%s: category must be one of %s" % (d.name, CATEGORIES))
        ids = [x.get("id") for x in m.get("sources", [])]
        if len(ids) != len(set(ids)):
            errors.append("%s: duplicate source ids" % d.name)
        for x in m.get("sources", []):
            if x.get("type") not in SOURCE_TYPES:
                errors.append("%s/%s: bad source type" % (d.name, x.get("id")))
            if not (x.get("pmid") or x.get("doi") or x.get("url")):
                errors.append("%s/%s: needs pmid, doi or url" % (d.name, x.get("id")))
        for lang in LANGS:
            if not (d / ("%s.md" % lang)).exists():
                errors.append("%s: missing %s.md" % (d.name, lang))
                continue
            fm, _ = parse_frontmatter((d / ("%s.md" % lang)).read_text(encoding="utf-8"))
            m.setdefault("titles", {})[lang] = fm.get("title", d.name)
            m.setdefault("ledes", {})[lang] = fm.get("blurb") or fm.get("lede", "")
        m["_dir"] = d
        metas.append(m)
    return metas, errors


def build():
    """Return ({relative_path: content}, errors)."""
    metas, errors = load_all()
    files = {}
    title_index = {m["slug"]: m for m in metas}
    for m in metas:
        for lang in LANGS:
            if not (m["_dir"] / ("%s.md" % lang)).exists():
                continue
            html_out, errs = render_guide(m, lang, m["_dir"], metas, title_index)
            errors += ["%s/%s: %s" % (m["slug"], lang, e) for e in errs]
            files["%s/index.html" % guide_path(lang, m["slug"]).strip("/")] = html_out
    for lang in LANGS:
        files["%s/index.html" % guide_path(lang).strip("/")] = render_hub(lang, metas)
    files["sitemap.xml"] = update_sitemap(metas)
    return files, errors, metas


def update_sitemap(metas):
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    entries = []
    for loc, last in [(guide_path(l), max(m["updated"] for m in metas)) for l in LANGS] + \
                     [(guide_path(l, m["slug"]), m["updated"]) for m in metas for l in LANGS]:
        entries.append("  <url>\n    <loc>%s%s</loc>\n    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n    <lastmod>%s</lastmod>\n  </url>" % (
            SITE, loc, "0.8" if loc.count("/") <= 3 else "0.7", last))
    block = "  <!-- guides:start (generated by tools/build_guides.py) -->\n%s\n  <!-- guides:end -->" % "\n".join(entries)
    if "<!-- guides:start" in sm:
        return re.sub(r"  <!-- guides:start.*?<!-- guides:end -->", lambda _: block, sm, flags=re.S)
    return sm.replace("</urlset>", block + "\n</urlset>")


def verify_pmids(metas):
    bad = 0
    for m in metas:
        for x in m["sources"]:
            if not x.get("pmid"):
                continue
            url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=%s" % x["pmid"]
            try:
                for attempt in range(4):  # NCBI allows ~3 requests/second without an API key
                    time.sleep(0.5 * (attempt + 1))
                    try:
                        data = json.loads(urllib.request.urlopen(url, timeout=20).read().decode())
                        break
                    except urllib.error.HTTPError as err:
                        if err.code != 429 or attempt == 3:
                            raise
                rec = data["result"][x["pmid"]]
                title = rec.get("title", "")
                first = x["cite"].split(",")[0].split(" ")[0].lower()
                authors = " ".join(a["name"] for a in rec.get("authors", [])).lower()
                year = rec.get("pubdate", "")[:4]
                doi = next((i["value"] for i in rec.get("articleids", []) if i["idtype"] == "doi"), "")
                ok = (x.get("no_author") or first in authors) and (not x.get("doi") or doi.lower() == x["doi"].lower())
                print("%s %s/%s PMID %s (%s) %s" % ("ok " if ok else "BAD", m["slug"], x["id"], x["pmid"], year, title[:90]))
                bad += 0 if ok else 1
            except Exception as e:  # network or parse problem is a failure, not a pass
                print("ERR %s/%s PMID %s: %s" % (m["slug"], x["id"], x["pmid"], e))
                bad += 1
    return bad


def check_brain(metas, brain):
    stale = 0
    for m in metas:
        note = m.get("source_note")
        if not note:
            continue
        p = Path(brain).expanduser() / note
        if not p.exists():
            print("MISSING note for %s: %s" % (m["slug"], p))
            stale += 1
            continue
        mm = re.search(r"^last_reviewed:\s*(\S+)", p.read_text(encoding="utf-8"), re.M)
        if mm and mm.group(1) != m.get("source_reviewed"):
            print("STALE %s: note last_reviewed %s, guide built from %s" % (m["slug"], mm.group(1), m.get("source_reviewed")))
            stale += 1
    return stale


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--brain")
    a = ap.parse_args()

    if a.verify and not (a.check or a.brain):
        return 1 if verify_pmids(load_all()[0]) else 0
    files, errors, metas = build()
    rc = 0
    if errors:
        print("Content errors:")
        for e in errors:
            print("  -", e)
        rc = 1
    if a.verify:
        rc |= 1 if verify_pmids(metas) else 0
    if a.brain:
        rc |= 1 if check_brain(metas, a.brain) else 0
    if a.check:
        for rel, content in files.items():
            p = ROOT / rel
            if not p.exists() or p.read_text(encoding="utf-8") != content:
                print("STALE build output: %s (run tools/build_guides.py)" % rel)
                rc = 1
        print("check: %s" % ("FAILED" if rc else "ok (%d guides, %d files)" % (len(metas), len(files))))
        return rc
    if errors:
        return rc
    for rel, content in files.items():
        p = ROOT / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    print("built %d guides x 2 languages (%d files)" % (len(metas), len(files)))
    return rc


if __name__ == "__main__":
    sys.exit(main())
