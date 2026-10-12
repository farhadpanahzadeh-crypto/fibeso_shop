#!/usr/bin/env python3
"""Assembles the static HTML pages from shared partials.

    python3 scripts/build-pages.py

Each file in templates/pages/ starts with a JSON front-matter comment:
    <!-- {"out": "pages/shop.html", "title": "...", "description": "...",
          "nav": "shop", "css": ["pages/shop.css"], "js": ["pages/shop.js"]} -->
The generated .html files are committed, so the site needs no build step to run;
re-run this script only after editing a template or partial.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "templates"
NAV_KEYS = ("home", "offers", "new", "used", "network", "parts", "b2b")

HEAD = """<!doctype html>
<html lang="fa" dir="rtl" data-root="{root}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#020411">{robots}
  <link rel="icon" href="{root}assets/images/logo-mark.svg" type="image/svg+xml">
  <link rel="preload" href="{root}assets/fonts/vazirmatn/vazirmatn-arabic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{root}assets/css/tokens.css">
  <link rel="stylesheet" href="{root}assets/css/base.css">
  <link rel="stylesheet" href="{root}assets/css/layout.css">
  <link rel="stylesheet" href="{root}assets/css/components.css">
{css}
  <script>document.documentElement.classList.add('js');</script>
  <script src="{root}assets/js/data/products.js" defer></script>
  <script src="{root}assets/js/components.js" defer></script>
  <script src="{root}assets/js/navigation.js" defer></script>
  <script src="{root}assets/js/store.js" defer></script>
  <script src="{root}assets/js/shop.js" defer></script>
{js}
  <script src="{root}assets/js/main.js" defer></script>
</head>
<body class="page-{slug}">
  <a class="skip-link" href="#main">پرش به محتوای اصلی</a>

"""


def render(text, root, nav):
    text = text.replace("{{root}}", root)
    for key in NAV_KEYS:
        text = text.replace("{{cur:%s}}" % key, ' aria-current="page"' if key == nav else "")
    return text


def build():
    header = (TPL / "partials" / "header.html").read_text(encoding="utf-8")
    footer = (TPL / "partials" / "footer.html").read_text(encoding="utf-8")
    count = 0
    for tpl in sorted((TPL / "pages").glob("*.html")):
        raw = tpl.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--\s*(\{.*?\})\s*-->\s*\n", raw, re.S)
        if not m:
            raise SystemExit(f"{tpl.name}: missing JSON front matter")
        meta = json.loads(m.group(1))
        body = raw[m.end():]
        out = ROOT / meta["out"]
        root = "../" * (len(Path(meta["out"]).parts) - 1)
        nav = meta.get("nav", "")
        css = "\n".join(f'  <link rel="stylesheet" href="{root}assets/css/{c}">' for c in meta.get("css", []))
        js = "\n".join(f'  <script src="{root}assets/js/{j}" defer></script>' for j in meta.get("js", []))
        robots = '\n  <meta name="robots" content="noindex">' if meta.get("noindex") else ""
        page = HEAD.format(root=root, title=meta["title"], description=meta["description"],
                           css=css, js=js, robots=robots, slug=tpl.stem)
        page += render(header, root, nav) + "\n" + render(body, root, nav) + "\n" + render(footer, root, nav)
        page += "</body>\n</html>\n"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        count += 1
        print(f"built {meta['out']}")
    print(f"{count} pages")


if __name__ == "__main__":
    build()
