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
TAB_KEYS = ("home", "cart", "blog", "account")  # mobile tab bar
# "chrome" picks the page frame: full (header + footer + tab bar), checkout
# (logo-only header, small footer) or bare (no header/footer, e.g. login)
CHROME = {
    "full": ("header.html", "footer.html"),
    "checkout": ("header-checkout.html", "footer-min.html"),
    "bare": (None, "footer-min.html"),
}

HEAD = """<!doctype html>
<html lang="fa" dir="rtl" data-root="{root}"{htmlattr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#020411">{robots}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="فیبسو">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="{root}assets/images/logo-mark.svg" type="image/svg+xml">
  <link rel="preload" href="{root}assets/fonts/vazirmatn/vazirmatn-arabic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{root}assets/css/tokens.css">
  <link rel="stylesheet" href="{root}assets/css/base.css">
  <link rel="stylesheet" href="{root}assets/css/layout.css">
  <link rel="stylesheet" href="{root}assets/css/components.css">
{css}
  <script>document.documentElement.classList.add('js');</script>
  <script src="{root}assets/js/data/icons.js" defer></script>
  <script src="{root}assets/js/data/products.js" defer></script>
  <script src="{root}assets/js/data/photos.js" defer></script>
  <script src="{root}assets/js/components.js" defer></script>
  <script src="{root}assets/js/navigation.js" defer></script>
  <script src="{root}assets/js/store.js" defer></script>
  <script src="{root}assets/js/shop.js" defer></script>
{js}
  <script src="{root}assets/js/main.js" defer></script>
</head>
<body class="page-{slug} chrome-{chrome}">
  <a class="skip-link" href="#main">پرش به محتوای اصلی</a>

"""


ICON_DIR = ROOT / "assets" / "icons"


def icon_svg(match):
    """{{icon:name}} or {{icon:name extra-class}} -> inline decorative SVG (Phosphor)."""
    parts = match.group(1).split()
    src = (ICON_DIR / f"{parts[0]}.svg").read_text(encoding="utf-8")
    inner = re.search(r"<svg[^>]*>(.*)</svg>", src, re.S).group(1)
    cls = " ".join(["icon"] + parts[1:])
    return (f'<svg class="{cls}" viewBox="0 0 256 256" fill="currentColor" '
            f'aria-hidden="true" focusable="false">{inner}</svg>')


SKELETON = ('<li class="skeleton-card" aria-hidden="true"><span class="skeleton skeleton--media"></span>'
            '<span class="skeleton skeleton--line"></span><span class="skeleton skeleton--line skeleton--short"></span>'
            '<span class="skeleton skeleton--price"></span></li>')


def render(text, root, nav, tab=""):
    text = re.sub(r"\{\{icon:([a-z0-9 _-]+)\}\}", icon_svg, text)
    # {{skeleton:N}} -> N placeholder cards, replaced when scripts render real products
    text = re.sub(r"\{\{skeleton:(\d+)\}\}", lambda m: SKELETON * int(m.group(1)), text)
    text = text.replace("{{root}}", root)
    for key in NAV_KEYS:
        text = text.replace("{{cur:%s}}" % key, ' aria-current="page"' if key == nav else "")
    for key in TAB_KEYS:
        text = text.replace("{{tab:%s}}" % key, ' aria-current="page"' if key == tab else "")
    return text


def build():
    partial = lambda name: (TPL / "partials" / name).read_text(encoding="utf-8") if name else ""
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
        tab = meta.get("tab", "")
        header_name, footer_name = CHROME[meta.get("chrome", "full")]
        header, footer = partial(header_name), partial(footer_name)
        css = "\n".join(f'  <link rel="stylesheet" href="{root}assets/css/{c}">' for c in meta.get("css", []))
        js = "\n".join(f'  <script src="{root}assets/js/{j}" defer></script>' for j in meta.get("js", []))
        robots = '\n  <meta name="robots" content="noindex">' if meta.get("noindex") else ""
        page = HEAD.format(root=root, title=meta["title"], description=meta["description"],
                           css=css, js=js, robots=robots, slug=tpl.stem,
                           chrome=meta.get("chrome", "full"), htmlattr="")
        page += render(header, root, nav, tab) + "\n" + render(body, root, nav, tab) + "\n" + render(footer, root, nav, tab)
        page += "</body>\n</html>\n"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        count += 1
        print(f"built {meta['out']}")
        if tpl.stem == "account":
            count += build_userpanel(meta, body, header, footer)
    print(f"{count} pages")


# userpanel/: one static page per user-panel section, viewable without signing in
# (sample data, separate storage; see store.js). Built from the account template.
PANEL_SECTIONS = [
    ("index", "dashboard", "پیشخوان"), ("orders", "orders", "سفارش‌های من"),
    ("wishlist", "wishlist", "کالاهای مورد علاقه"), ("comments", "comments", "نظرات"),
    ("addresses", "addresses", "نشانی‌ها"), ("messages", "messages", "پیام‌ها"),
    ("recent", "recent", "آخرین کالاهای دیده شده"), ("profile", "profile", "مشخصات فردی"),
    ("wallet", "wallet", "کیف پول"),
]


def build_userpanel(meta, body, header, footer):
    root = "../"
    def to_file(m):
        name = m.group(1)
        return 'href="%s"' % ("index.html" if name in ("dashboard", "menu") else name + ".html")
    names = "|".join(["menu"] + [s for _, s, _ in PANEL_SECTIONS])
    panel_body = re.sub(r'href="#(%s)"' % names, to_file, body)
    css = "\n".join(f'  <link rel="stylesheet" href="{root}assets/css/{c}">' for c in meta.get("css", []))
    js = "\n".join(f'  <script src="{root}assets/js/{j}" defer></script>' for j in meta.get("js", []))
    for file, section, title in PANEL_SECTIONS:
        page = HEAD.format(root=root, title=f"{title} | نمونه پنل کاربری فیبسو",
                           description="پیش‌نمایش طراحی پنل کاربری فیبسو با داده نمونه.",
                           css=css, js=js, robots='\n  <meta name="robots" content="noindex">',
                           slug="account", chrome="full", htmlattr=f' data-panel-preview="{section}"')
        page += render(header, root, "", "account") + "\n" + render(panel_body, root, "", "account") + "\n" + render(footer, root, "", "account")
        page += "</body>\n</html>\n"
        out = ROOT / "userpanel" / f"{file}.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        print(f"built userpanel/{file}.html")
    return len(PANEL_SECTIONS)


if __name__ == "__main__":
    build()
