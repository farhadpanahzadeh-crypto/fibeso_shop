#!/usr/bin/env python3
"""Generates the flat SVG product, category and banner illustrations in assets/images/.

Colors mirror the PROVISIONAL brand palette in assets/css/tokens.css. When the
final palette is supplied, update P below and re-run:
    python3 scripts/generate-images.py
These drawings stand in for real product photos until the shop supplies them.
"""
from pathlib import Path

P = {
    "navy": "#1b2d63",
    "navy_mid": "#2c4489",
    "sky": "#0b78b8",
    "sky_soft": "#d8eefa",
    "ink": "#111827",
    "graphite": "#374151",
    "steel": "#9ca3af",
    "silver": "#d1d5db",
    "line": "#e5e7eb",
    "muted": "#f3f4f6",
    "white": "#ffffff",
    "green": "#16a34a",
    "amber": "#f59e0b",
}
ROOT = Path(__file__).resolve().parent.parent / "assets" / "images"


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n'


def write(rel, content):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def g(body, x=0, y=0, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">{body}</g>'


def shadow(cx, cy, rx):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="8" fill="{P["line"]}"/>'


# ---------- Product drawings (400x400 canvas) ----------
def laptop(body=None, screen=None, deck=None):
    body = body or P["graphite"]
    screen = screen or P["sky"]
    deck = deck or P["silver"]
    return (f'<rect x="78" y="80" width="244" height="168" rx="12" fill="{body}"/>'
            f'<rect x="90" y="92" width="220" height="142" rx="4" fill="{screen}"/>'
            f'<path d="M90 234 190 120l120 114z" fill="{P["white"]}" opacity=".18"/>'
            f'<circle cx="250" cy="140" r="34" fill="{P["white"]}" opacity=".22"/>'
            f'<path d="M48 258h304l-16 26H64z" fill="{deck}"/>'
            f'<rect x="48" y="248" width="304" height="12" rx="4" fill="{body}"/>'
            f'<rect x="170" y="250" width="60" height="6" rx="3" fill="{P["steel"]}"/>'
            + shadow(200, 298, 150))


def router():
    ants = "".join(f'<rect x="{x}" y="70" width="12" height="130" rx="6" fill="{P["ink"]}"/>' for x in (96, 150, 238, 292))
    leds = "".join(f'<circle cx="{150 + i * 20}" cy="262" r="4" fill="{P["green"] if i < 4 else P["sky"]}"/>' for i in range(6))
    return (ants + f'<path d="M70 210h260l20 70H50z" fill="{P["ink"]}"/>'
            f'<rect x="50" y="276" width="300" height="16" rx="6" fill="{P["graphite"]}"/>' + leds + shadow(200, 306, 150))


def switch():
    ports = "".join(f'<rect x="{78 + (i % 12) * 20}" y="{176 + (i // 12) * 30}" width="14" height="20" rx="2" fill="{P["ink"]}"/>' for i in range(24))
    leds = "".join(f'<circle cx="{85 + i * 20}" cy="168" r="2.5" fill="{P["green"]}"/>' for i in range(12))
    return (f'<rect x="40" y="150" width="320" height="90" rx="8" fill="{P["steel"]}"/>'
            f'<rect x="48" y="158" width="304" height="74" rx="5" fill="{P["silver"]}"/>' + ports + leds
            + f'<rect x="324" y="176" width="20" height="50" rx="3" fill="{P["navy"]}"/>' + shadow(200, 256, 160))


def access_point():
    return (f'<ellipse cx="200" cy="210" rx="130" ry="60" fill="{P["white"]}" stroke="{P["line"]}" stroke-width="4"/>'
            f'<ellipse cx="200" cy="200" rx="130" ry="60" fill="{P["white"]}" stroke="{P["silver"]}" stroke-width="4"/>'
            f'<circle cx="200" cy="200" r="10" fill="{P["sky"]}"/>'
            + "".join(f'<path d="M{200 - r} {170 - r * .2}a{r} {r * .6} 0 0 1 {2 * r} 0" fill="none" stroke="{P["sky"]}" stroke-width="6" stroke-linecap="round" opacity="{1 - i * .25}"/>'
                      for i, r in enumerate((30, 52, 74)))
            + shadow(200, 286, 130))


def cable():
    return (f'<path d="M80 300c40-120 200-40 240-200" fill="none" stroke="{P["sky"]}" stroke-width="14" stroke-linecap="round"/>'
            f'<path d="M110 320c60-100 200-20 220-170" fill="none" stroke="{P["navy_mid"]}" stroke-width="14" stroke-linecap="round" opacity=".85"/>'
            + "".join(f'<g transform="translate({x} {y}) rotate({r})"><rect x="-18" y="-30" width="36" height="46" rx="6" fill="{P["white"]}" stroke="{P["silver"]}" stroke-width="4"/>'
                      f'<rect x="-12" y="-38" width="24" height="12" rx="2" fill="{P["silver"]}"/></g>'
                      for x, y, r in ((320, 96, 20), (80, 304, 200)))
            + shadow(200, 340, 140))


def ram():
    chips = "".join(f'<rect x="{70 + i * 46}" y="150" width="34" height="56" rx="3" fill="{P["ink"]}"/>' for i in range(6))
    pins = "".join(f'<rect x="{62 + i * 9}" y="232" width="5" height="16" fill="{P["amber"]}"/>' for i in range(31))
    return (f'<rect x="54" y="130" width="292" height="122" rx="6" fill="{P["green"]}"/>' + chips + pins
            + f'<rect x="190" y="236" width="14" height="16" fill="{P["white"]}"/>'
            f'<rect x="70" y="214" width="120" height="10" rx="3" fill="{P["white"]}" opacity=".7"/>' + shadow(200, 270, 150))


def ssd():
    return (f'<rect x="80" y="110" width="240" height="170" rx="14" fill="{P["ink"]}"/>'
            f'<rect x="96" y="126" width="208" height="138" rx="8" fill="{P["graphite"]}"/>'
            f'<rect x="120" y="170" width="160" height="16" rx="6" fill="{P["sky"]}"/>'
            f'<rect x="150" y="200" width="100" height="10" rx="5" fill="{P["steel"]}"/>' + shadow(200, 296, 130))


def nic():
    return (f'<rect x="70" y="140" width="240" height="110" rx="6" fill="{P["navy"]}"/>'
            f'<rect x="300" y="120" width="30" height="150" rx="4" fill="{P["silver"]}"/>'
            f'<rect x="306" y="150" width="18" height="24" rx="2" fill="{P["ink"]}"/><rect x="306" y="196" width="18" height="24" rx="2" fill="{P["ink"]}"/>'
            f'<rect x="130" y="166" width="60" height="60" rx="4" fill="{P["ink"]}"/>'
            + "".join(f'<rect x="{90 + i * 12}" y="250" width="7" height="16" fill="{P["amber"]}"/>' for i in range(14))
            + shadow(200, 286, 130))


def rack():
    units = "".join(f'<rect x="130" y="{86 + i * 46}" width="140" height="36" rx="3" fill="{P["graphite"]}"/>'
                    f'<circle cx="252" cy="{104 + i * 46}" r="4" fill="{P["green"]}"/>'
                    f'<rect x="144" y="{100 + i * 46}" width="70" height="8" rx="3" fill="{P["steel"]}"/>' for i in range(5))
    return (f'<rect x="114" y="66" width="172" height="270" rx="10" fill="{P["ink"]}"/>' + units
            + f'<rect x="124" y="336" width="20" height="10" fill="{P["ink"]}"/><rect x="256" y="336" width="20" height="10" fill="{P["ink"]}"/>'
            + shadow(200, 352, 110))


def mouse():
    return (f'<rect x="140" y="80" width="120" height="220" rx="60" fill="{P["ink"]}"/>'
            f'<line x1="200" y1="84" x2="200" y2="170" stroke="{P["graphite"]}" stroke-width="4"/>'
            f'<rect x="192" y="110" width="16" height="36" rx="8" fill="{P["sky"]}"/>' + shadow(200, 320, 80))


def adapter():
    return (f'<rect x="110" y="150" width="150" height="90" rx="14" fill="{P["ink"]}"/>'
            f'<path d="M260 195c60 0 40 90 90 90" fill="none" stroke="{P["ink"]}" stroke-width="10" stroke-linecap="round"/>'
            f'<path d="M110 195c-40 0-30-80-70-80" fill="none" stroke="{P["ink"]}" stroke-width="10" stroke-linecap="round"/>'
            f'<circle cx="185" cy="195" r="16" fill="{P["graphite"]}"/>' + shadow(200, 300, 130))


PRODUCTS = {
    "laptop-business": laptop(P["graphite"], P["sky"]),
    "laptop-gaming": laptop(P["ink"], P["navy_mid"], P["graphite"]),
    "laptop-ultrabook": laptop(P["steel"], P["sky_soft"], P["silver"]),
    "laptop-workstation": laptop(P["ink"], P["sky"], P["graphite"]),
    "laptop-used-a": laptop(P["graphite"], P["navy"]),
    "laptop-used-b": laptop(P["ink"], P["sky"], P["steel"]),
    "router": router(),
    "switch": switch(),
    "access-point": access_point(),
    "cable": cable(),
    "ram": ram(),
    "ssd": ssd(),
    "nic": nic(),
    "rack": rack(),
    "mouse": mouse(),
    "adapter": adapter(),
}
for name, body in PRODUCTS.items():
    write(f"products/{name}.svg", svg(400, 400, body))

# ---------- Brand / group tiles (transparent; tile color comes from CSS) ----------
write("groups/laptops-new.svg", svg(400, 400, g(PRODUCTS["laptop-ultrabook"], 40, 20, .85) + g(PRODUCTS["laptop-business"], 0, 120, .7)))
write("groups/laptops-used.svg", svg(400, 400, g(PRODUCTS["laptop-used-a"], 50, 30, .8) + g(PRODUCTS["laptop-used-b"], -10, 120, .7)))
write("groups/network.svg", svg(400, 400, g(router(), 40, -10, .8) + g(switch(), 0, 150, .9)))
write("groups/parts.svg", svg(400, 400, g(ram(), 40, 0, .8) + g(ssd(), 30, 140, .75)))

# ---------- Banners (navy panels with art; text is HTML) ----------
def banner(w, h, art):
    return svg(w, h, f'<rect width="{w}" height="{h}" fill="{P["navy"]}"/>'
                     f'<path d="M{w * .45} {h}L{w} 0V{h}z" fill="{P["navy_mid"]}" opacity=".55"/>'
                     f'<path d="M{w * .62} {h}L{w} {h * .35}V{h}z" fill="{P["sky"]}" opacity=".18"/>' + art)


write("banners/hero-1.svg", banner(1600, 520, g(PRODUCTS["laptop-gaming"], 120, 20, 1.15) + g(PRODUCTS["laptop-ultrabook"], 420, 90, .95)))
write("banners/hero-2.svg", banner(1600, 520, g(router(), 120, 40, 1.05) + g(switch(), 430, 180, .95) + g(access_point(), 360, -40, .7)))
write("banners/hero-3.svg", banner(1600, 520, g(PRODUCTS["laptop-used-a"], 140, 30, 1.1) + g(ram(), 480, 210, .6) + g(ssd(), 520, 40, .55)))
write("banners/promo-1.svg", banner(800, 360, g(router(), 30, 20, .8)))
write("banners/promo-2.svg", banner(800, 360, g(PRODUCTS["laptop-used-b"], 20, 30, .8)))
write("banners/promo-3.svg", banner(800, 360, g(ram(), 40, 10, .55) + g(ssd(), 120, 150, .5)))
write("banners/wide.svg", banner(1600, 300, g(rack(), 160, 0, .75) + g(switch(), 380, 90, .75) + g(nic(), 640, 60, .6)))

# ---------- Logo ----------
def logo(bg, fg):
    return svg(40, 40, f'<rect width="40" height="40" rx="11" fill="{bg}"/>'
                       f'<path d="M14 11h13v4.5h-8.5v4H25V24h-6.5v5H14z" fill="{fg}"/>'
                       f'<circle cx="27.5" cy="27" r="2.5" fill="{fg}"/>')


write("logo-mark.svg", logo(P["navy"], P["white"]))
write("logo-mark-inverse.svg", logo(P["white"], P["navy"]))
print("ok")
