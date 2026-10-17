# HAPEEC home page (هپییک)

Static RTL home page for HAPEEC, a motorcycle and motorcycle-parts store. The layout follows
the Digikala home page; the story/video sections and the footer keep the structure of the
previous HAPEEC design. Colours, logo and services come from the brand book in
`../docs/brand/HAPEEC.md`.

## Run

```bash
cd fibeso_shop
python3 -m http.server 8000   # open http://localhost:8000/hapeec/
```

No build step. Everything is self-hosted, so the page also works offline.

## Stack

| Part | Choice |
|---|---|
| Markup / styles / logic | HTML, one CSS file (`assets/css/hapeec.css`), vanilla JS |
| Font | Vazirmatn variable (self-hosted, Persian + Latin subsets) |
| Carousels | Swiper 11.1.14 (`assets/vendor/swiper`) |
| Icons | Phosphor Icons 2.1.1 web font, regular + fill (`assets/vendor/phosphor`) |
| Brand logos | Simple Icons SVGs (`assets/img/brands`) |

## Files

| File | What it holds |
|---|---|
| `index.html` | Page skeleton: header, mega menu, sections, footer, story viewer |
| `assets/js/data.js` | Demo catalogue: products, prices, stories, banners, menu. Edit this to change content |
| `assets/js/app.js` | Rendering and behaviour: carousels, mega menu, countdown, cart counter, story/video viewer, theme toggle |
| `assets/css/hapeec.css` | Design tokens (brand palette, light and dark) and all components |
| `assets/img/p/` | Product and banner photos (resized). Sources and licences: `assets/img/CREDITS.md` |

## Sections (top to bottom)

1. Promo strip, sticky header with search suggestions, mega menu (7 categories)
2. Hero slider
3. Stories (from the previous design): opens a full-screen viewer with progress bars, tap/hold, keyboard
4. HAPEEC services row (the 6 services of the brand's 360 circle)
5. Amazing offers band with a countdown to midnight
6. Four category banners, "ship today" strip, category circles, two wide banners
7. HAPEEC picks (2x2 thumbnail boxes)
8. Product rails: motorcycles, spare parts, helmets and safety gear
9. Popular brands, weekly bestsellers (ranked)
10. Top videos (from the previous design): open in the same viewer; set `video: "path.mp4"` on an item in `data.js` to play a real clip
11. Magazine
12. Footer (from the previous design): services strip, about + socials, link columns, contact, newsletter, trust badges

Mobile (< 768px) adds a bottom tab bar and turns grids into swipeable rows.

## Placeholders to replace before launch

- Photos are free-licensed Wikimedia Commons stand-ins (motorcycles, scooters, one helmet, one fuel tap).
  Products without a matching photo show an icon tile; set `img` on the product in `data.js` once real photos exist
- Prices, ratings, view counts and the phone number are sample data
- Links point to `#`; trust badges need the real e-Namad / Samandehi embed codes
