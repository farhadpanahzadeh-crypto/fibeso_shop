#!/usr/bin/env python3
"""Generates the flat SVG illustrations in assets/images/.

Colors mirror the PROVISIONAL brand palette in assets/css/tokens.css. When the
final palette is supplied, update PALETTE below and re-run:
    python3 scripts/generate-images.py
"""
from pathlib import Path

PALETTE = {
    "primary": "#1e40af",
    "primary_strong": "#1e3a8a",
    "primary_soft": "#eef2ff",
    "primary_mid": "#c7d2fe",
    "accent": "#b45309",
    "accent_soft": "#fef3c7",
    "ink": "#0f172a",
    "line": "#e2e8f0",
    "muted": "#f1f5f9",
    "gray": "#cbd5e1",
    "white": "#ffffff",
    "success": "#15803d",
}
P = PALETTE
ROOT = Path(__file__).resolve().parent.parent / "assets" / "images"


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" role="img" aria-hidden="true">{body}</svg>\n')


def write(rel, content):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def bars(x, y, widths, h=8, gap=16, color=None):
    color = color or P["gray"]
    return "".join(f'<rect x="{x - w}" y="{y + i * gap}" width="{w}" height="{h}" rx="4" fill="{color}"/>'
                   for i, w in enumerate(widths))


def browser(w, h, inner):
    """A browser window frame (RTL: dots on the right)."""
    return (f'<rect width="{w}" height="{h}" fill="{P["muted"]}"/>'
            f'<rect x="24" y="24" width="{w - 48}" height="{h - 24}" rx="14" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
            f'<path d="M24 38a14 14 0 0 1 14-14h{w - 76}a14 14 0 0 1 14 14v18H24z" fill="{P["primary_soft"]}"/>'
            + "".join(f'<circle cx="{w - 48 - i * 16}" cy="40" r="5" fill="{c}"/>'
                      for i, c in enumerate((P["primary"], P["primary_mid"], P["gray"])))
            + f'<rect x="48" y="33" width="{w * 0.45:.0f}" height="14" rx="7" fill="{P["white"]}"/>'
            + inner)


# ---------- Logo ----------
def logo(bg, fg):
    return svg(40, 40,
               f'<rect width="40" height="40" rx="11" fill="{bg}"/>'
               f'<path d="M14 11h13v4.5h-8.5v4H25V24h-6.5v5H14z" fill="{fg}"/>'
               f'<circle cx="27.5" cy="27" r="2.5" fill="{fg}"/>')


write("logo-mark.svg", logo(P["primary"], P["white"]))
write("logo-mark-inverse.svg", logo(P["white"], P["primary_strong"]))

# ---------- Hero ----------
hero = (
    f'<rect x="20" y="40" width="440" height="330" rx="22" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
    f'<path d="M20 62a22 22 0 0 1 22-22h396a22 22 0 0 1 22 22v18H20z" fill="{P["primary_soft"]}"/>'
    + "".join(f'<circle cx="{436 - i * 18}" cy="60" r="6" fill="{c}"/>'
              for i, c in enumerate((P["primary"], P["primary_mid"], P["gray"])))
    # sidebar (right side for RTL)
    + f'<rect x="368" y="96" width="76" height="258" rx="12" fill="{P["muted"]}"/>'
    + "".join(f'<rect x="380" y="{116 + i * 34}" width="52" height="12" rx="6" fill="{P["primary"] if i == 0 else P["gray"]}"/>'
              for i in range(6))
    # KPI cards
    + "".join(
        f'<rect x="{40 + i * 108}" y="96" width="96" height="70" rx="12" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
        f'<rect x="{96 + i * 108}" y="112" width="28" height="8" rx="4" fill="{P["gray"]}"/>'
        f'<rect x="{72 + i * 108}" y="132" width="52" height="16" rx="6" fill="{c}"/>'
        for i, c in enumerate((P["primary"], P["accent"], P["primary_strong"])))
    # chart panel
    + f'<rect x="40" y="182" width="312" height="172" rx="14" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
    + "".join(f'<line x1="60" y1="{220 + i * 32}" x2="332" y2="{220 + i * 32}" stroke="{P["line"]}" stroke-width="2"/>' for i in range(4))
    + "".join(f'<rect x="{72 + i * 44}" y="{330 - hgt}" width="22" height="{hgt}" rx="5" fill="{P["primary_mid"]}"/>'
              for i, hgt in enumerate((40, 62, 52, 84, 76, 108)))
    + f'<polyline points="83,282 127,262 171,270 215,236 259,242 303,206" fill="none" stroke="{P["primary"]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    + "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{P["white"]}" stroke="{P["primary"]}" stroke-width="3"/>'
              for x, y in ((83, 282), (127, 262), (171, 270), (215, 236), (259, 242), (303, 206)))
    + f'<rect x="60" y="196" width="60" height="10" rx="5" fill="{P["gray"]}"/>'
    # floating code card
    + f'<rect x="300" y="300" width="230" height="130" rx="18" fill="{P["primary_strong"]}"/>'
    + "".join(f'<rect x="{510 - w}" y="{326 + i * 22}" width="{w}" height="9" rx="4.5" fill="{c}"/>'
              for i, (w, c) in enumerate(((120, P["primary_mid"]), (160, P["white"]), (96, P["accent_soft"]), (140, P["primary_mid"]))))
    # floating growth badge
    + f'<rect x="0" y="0" width="190" height="78" rx="16" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2" transform="translate(350 4)"/>'
    + f'<circle cx="502" cy="43" r="20" fill="{P["primary_soft"]}"/>'
    + f'<path d="M492 50l7-7 5 5 9-10M506 38h7v7" fill="none" stroke="{P["success"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + f'<rect x="380" y="28" width="90" height="10" rx="5" fill="{P["gray"]}"/>'
    + f'<rect x="410" y="46" width="60" height="14" rx="6" fill="{P["ink"]}"/>'
)
write("hero-illustration.svg", svg(560, 460, hero))

# ---------- Portfolio / blog thumbnails (640x400) ----------
W, H = 640, 400


def thumb_shop(color):
    cards = ""
    for i in range(4):
        x = 64 + i * 132
        cards += (f'<rect x="{x}" y="176" width="116" height="180" rx="12" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
                  f'<rect x="{x + 10}" y="186" width="96" height="92" rx="8" fill="{color if i % 2 == 0 else P["primary_soft"]}"/>'
                  + bars(x + 106, 292, (70, 44), gap=18)
                  + f'<rect x="{x + 10}" y="330" width="40" height="14" rx="7" fill="{P["primary"]}"/>')
    return browser(W, H, f'<rect x="48" y="72" width="544" height="88" rx="12" fill="{P["primary_strong"]}"/>'
                   + bars(568, 94, (220, 140), h=12, gap=24, color=P["white"]) + cards)


def thumb_site(color):
    return browser(W, H,
                   f'<rect x="48" y="72" width="544" height="150" rx="12" fill="{P["primary_soft"]}"/>'
                   + bars(568, 100, (260, 200, 140), h=14, gap=26, color=P["ink"])
                   + f'<rect x="440" y="182" width="128" height="26" rx="8" fill="{color}"/>'
                   + f'<circle cx="150" cy="147" r="56" fill="{P["white"]}"/><circle cx="150" cy="147" r="30" fill="{color}"/>'
                   + "".join(f'<rect x="{48 + i * 186}" y="240" width="172" height="120" rx="12" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
                             f'<circle cx="{196 + i * 186}" cy="272" r="14" fill="{P["primary_soft"]}"/>'
                             + bars(204 + i * 186, 300, (120, 90), gap=18) for i in range(3)))


def thumb_dash(color):
    return browser(W, H,
                   f'<rect x="512" y="72" width="80" height="288" rx="10" fill="{P["primary_strong"]}"/>'
                   + "".join(f'<rect x="526" y="{94 + i * 30}" width="52" height="10" rx="5" fill="{P["primary_mid"]}"/>' for i in range(6))
                   + "".join(f'<rect x="{48 + i * 152}" y="72" width="140" height="72" rx="10" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
                             f'<rect x="{80 + i * 152}" y="104" width="{60 + i * 10}" height="18" rx="6" fill="{color if i == 0 else P["primary_mid"]}"/>' for i in range(3))
                   + f'<rect x="48" y="160" width="448" height="200" rx="10" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
                   + f'<polyline points="72,320 132,290 192,300 252,250 312,262 372,212 472,190" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
                   + f'<polyline points="72,334 132,320 192,326 252,300 312,310 372,282 472,268" fill="none" stroke="{P["primary_mid"]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')


def thumb_booking(color):
    cells = ""
    for r in range(4):
        for c in range(7):
            x, y = 80 + c * 40, 140 + r * 44
            on = (r, c) in ((1, 3), (2, 5))
            cells += f'<rect x="{x}" y="{y}" width="32" height="32" rx="8" fill="{color if on else P["muted"]}"/>'
    return browser(W, H,
                   f'<rect x="56" y="80" width="328" height="280" rx="14" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
                   + bars(360, 102, (120,), h=14, color=P["ink"]) + cells
                   + "".join(f'<rect x="404" y="{80 + i * 70}" width="188" height="58" rx="12" fill="{P["primary_soft"] if i else color}"/>'
                             + bars(580, 100 + i * 70, (110, 70), gap=16, color=P["white"] if i == 0 else P["gray"]) for i in range(4)))


def thumb_checklist():
    rows = "".join(
        f'<rect x="120" y="{96 + i * 58}" width="400" height="44" rx="10" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
        f'<rect x="478" y="{106 + i * 58}" width="24" height="24" rx="6" fill="{P["primary"] if i < 3 else P["white"]}" stroke="{P["primary"]}" stroke-width="2"/>'
        + (f'<path d="M484 {118 + i * 58}l4 4 8-9" fill="none" stroke="{P["white"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' if i < 3 else "")
        + bars(462, 114 + i * 58, (220 - i * 30,))
        for i in range(5))
    return f'<rect width="{W}" height="{H}" fill="{P["primary_soft"]}"/>' + rows


def thumb_speed():
    import math
    cx, cy, r = 320, 260, 150
    def pt(a):
        return cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a))
    x1, y1 = pt(180); x2, y2 = pt(0); x3, y3 = pt(55)
    nx, ny = cx + 110 * math.cos(math.radians(55)), cy - 110 * math.sin(math.radians(55))
    return (f'<rect width="{W}" height="{H}" fill="{P["primary_soft"]}"/>'
            f'<path d="M{x1:.0f} {y1:.0f}A{r} {r} 0 0 1 {x2:.0f} {y2:.0f}" fill="none" stroke="{P["primary_mid"]}" stroke-width="28" stroke-linecap="round"/>'
            f'<path d="M{x1:.0f} {y1:.0f}A{r} {r} 0 0 1 {x3:.0f} {y3:.0f}" fill="none" stroke="{P["primary"]}" stroke-width="28" stroke-linecap="round"/>'
            f'<line x1="{cx}" y1="{cy}" x2="{nx:.0f}" y2="{ny:.0f}" stroke="{P["ink"]}" stroke-width="8" stroke-linecap="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="16" fill="{P["ink"]}"/>'
            f'<rect x="250" y="300" width="140" height="40" rx="12" fill="{P["white"]}"/>'
            f'<rect x="276" y="314" width="88" height="12" rx="6" fill="{P["success"]}"/>')


def thumb_cart():
    return (f'<rect width="{W}" height="{H}" fill="{P["primary_soft"]}"/>'
            f'<rect x="96" y="70" width="230" height="270" rx="18" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="2"/>'
            f'<rect x="116" y="90" width="190" height="130" rx="12" fill="{P["accent_soft"]}"/>'
            f'<rect x="166" y="120" width="90" height="70" rx="10" fill="{P["accent"]}"/>'
            + bars(306, 240, (150, 100), h=10, gap=22)
            + f'<rect x="116" y="294" width="190" height="30" rx="10" fill="{P["primary"]}"/>'
            f'<g fill="none" stroke="{P["primary"]}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">'
            f'<path d="M372 120h34l34 150h120l26-104H420"/></g>'
            f'<circle cx="452" cy="312" r="18" fill="{P["primary"]}"/><circle cx="550" cy="312" r="18" fill="{P["primary"]}"/>')


write("portfolio/shop-fashion.svg", svg(W, H, thumb_shop(P["accent"])))
write("portfolio/shop-digital.svg", svg(W, H, thumb_shop(P["primary"])))
write("portfolio/web-clinic.svg", svg(W, H, thumb_site(P["primary"])))
write("portfolio/web-corporate.svg", svg(W, H, thumb_site(P["accent"])))
write("portfolio/app-dashboard.svg", svg(W, H, thumb_dash(P["primary"])))
write("portfolio/app-booking.svg", svg(W, H, thumb_booking(P["primary"])))
write("blog/seo-checklist.svg", svg(W, H, thumb_checklist()))
write("blog/site-speed.svg", svg(W, H, thumb_speed()))
write("blog/online-shop.svg", svg(W, H, thumb_cart()))
print("ok")
