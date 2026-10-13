# ابزارهای نسخه‌ی قدیمی (اندروید / Java)

این پوشه **بدون تغییر** از `goshyar_game` (کامیت `7fd09f8`، پوشه‌ی `tools/`) نگه داشته شده
تا هیچ ابزاری بدون بررسی از بین نرود. برنامه‌ی Flutter به هیچ‌کدام وابسته نیست.

| ابزار | کار | وضعیت در نسخه‌ی Flutter |
|---|---|---|
| `make_sounds.py`, `synth.py`, `sounds_animals.py`, `sounds_world.py` | ساخت صدای کارتونی حیوان‌ها و وسایل با سنتز (numpy + ffmpeg) | خروجی‌شان همان `assets/audio/sfx/*.mp3` فعلی است. **صدای ضبط‌شده‌ی واقعی نیستند** و باید جایگزین شوند. مسیرها هنوز به `app/src/main/...` اشاره دارند. |
| `narration.py`, `make_manifest.py`, `pronounce.py`, `vowels*.py` | متن گفتارهای قدیمی و اعراب‌گذاری برای موتور TTS | متن‌ها بازنویسی شده‌اند: `assets/content/voice_lines.json`. TTS دیگر راهکار اصلی نیست. |
| `make_art_cf.py`, `art_queue.json` | ساخت تصویر با Cloudflare Workers AI (توکن از متغیر محیطی `CF_API_TOKEN`) | در نسخه‌ی جدید Cloudflare فقط برای ذخیره و توزیع است (`cloudflare/`). |
| `extract_art.py`, `install_art.py`, `install_gen.sh`, `make_icons.py` | برش تصویر از اینفوگرافیک مرجع و نصب در `res/drawable` | جایگزین: `tools/prepare_assets.py` (WebP، شفاف‌سازی ماسکوت). |
| `voice-studio/` (JavaScript: Vite + Node) | استودیوی محلی ساخت صدا با سرویس TTS «آواشو» و آپلود FTP؛ توکن در صفحه وارد می‌شود | حذف نشده. برای ضبط انسانی لازم نیست؛ جریان جدید: `tools/voice/`. |

هیچ کلید یا رمزی در این فایل‌ها نیست.
