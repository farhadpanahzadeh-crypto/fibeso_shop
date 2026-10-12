/* SAMPLE catalogue for the front-end prototype. Titles, prices (Toman), ratings and
   stock are placeholders — replace with the shop's real catalogue and product photos.
   condition: 'new' | 'used'  (used items carry a cosmetic grade). */
window.SHOP_PRODUCTS = [
  { id: 'l01', title: 'لپ‌تاپ ۱۴ اینچی لنوو ThinkPad E14 Core i5 رم ۱۶ گیگ SSD 512', cat: 'laptop', catLabel: 'لپ‌تاپ', img: 'laptop-business', condition: 'new', price: 48900000, old: 52500000, rating: 4.6, reviews: 12, tags: ['offer', 'new-laptop'] },
  { id: 'l02', title: 'لپ‌تاپ ۱۵.۶ اینچی ایسوس TUF Gaming Core i7 گرافیک RTX 4060', cat: 'laptop', catLabel: 'لپ‌تاپ گیمینگ', img: 'laptop-gaming', condition: 'new', price: 76500000, old: 81000000, rating: 4.8, reviews: 9, tags: ['offer', 'new-laptop'] },
  { id: 'l03', title: 'لپ‌تاپ ۱۳.۳ اینچی اچ‌پی EliteBook 830 G8 Core i5 رم ۱۶ گیگ', cat: 'laptop', catLabel: 'لپ‌تاپ', img: 'laptop-ultrabook', condition: 'new', price: 39800000, old: 0, rating: 4.4, reviews: 5, tags: ['new-laptop'] },
  { id: 'l04', title: 'لپ‌تاپ ۱۵.۶ اینچی دل Precision 3581 Core i7 رم ۳۲ گیگ', cat: 'laptop', catLabel: 'لپ‌تاپ مهندسی', img: 'laptop-workstation', condition: 'new', price: 98500000, old: 104000000, rating: 4.9, reviews: 3, tags: ['new-laptop'] },
  { id: 'l05', title: 'لپ‌تاپ ۱۴ اینچی ایسر Aspire 5 Ryzen 5 رم ۸ گیگ SSD 512', cat: 'laptop', catLabel: 'لپ‌تاپ', img: 'laptop-business', condition: 'new', price: 31200000, old: 33900000, rating: 4.2, reviews: 18, tags: ['offer', 'new-laptop'] },
  { id: 'l06', title: 'لپ‌تاپ ۱۶ اینچی لنوو Legion 5 Ryzen 7 گرافیک RTX 4070', cat: 'laptop', catLabel: 'لپ‌تاپ گیمینگ', img: 'laptop-gaming', condition: 'new', price: 92400000, old: 0, rating: 4.7, reviews: 7, tags: ['new-laptop'] },

  { id: 'u01', title: 'لپ‌تاپ استوک دل Latitude 7490 Core i7 نسل ۸ رم ۱۶ گیگ', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'A', price: 17900000, old: 19500000, rating: 4.5, reviews: 41, tags: ['offer', 'used-laptop'] },
  { id: 'u02', title: 'لپ‌تاپ استوک لنوو ThinkPad T480 Core i5 رم ۸ گیگ SSD 256', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 13400000, old: 0, rating: 4.4, reviews: 57, tags: ['used-laptop'] },
  { id: 'u03', title: 'لپ‌تاپ استوک اچ‌پی ZBook 15 G5 Core i7 گرافیک Quadro', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'B', price: 24600000, old: 27000000, rating: 4.3, reviews: 22, tags: ['offer', 'used-laptop'] },
  { id: 'u04', title: 'لپ‌تاپ استوک اچ‌پی EliteBook 840 G6 Core i5 رم ۱۶ گیگ', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 16200000, old: 0, rating: 4.6, reviews: 33, tags: ['used-laptop'] },
  { id: 'u05', title: 'لپ‌تاپ استوک دل Precision 5530 Core i7 رم ۳۲ گیگ', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'B', price: 28900000, old: 0, rating: 4.1, reviews: 8, tags: ['used-laptop'], stock: 0 },
  { id: 'u06', title: 'لپ‌تاپ استوک لنوو ThinkPad X1 Carbon نسل ۷ Core i7', cat: 'laptop', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 22800000, old: 24500000, rating: 4.7, reviews: 26, tags: ['used-laptop'] },

  { id: 'n01', title: 'روتر میکروتیک hAP ax2 وای‌فای ۶ دوبانده', cat: 'network', sub: 'router', catLabel: 'مودم و روتر', img: 'router', condition: 'new', price: 7450000, old: 7990000, rating: 4.7, reviews: 15, tags: ['offer', 'network'] },
  { id: 'n02', title: 'سوییچ ۲۴ پورت گیگابیت سیسکو CBS250-24T-4G مدیریتی', cat: 'network', sub: 'switch', catLabel: 'سوییچ شبکه', img: 'switch', condition: 'new', price: 21300000, old: 0, rating: 4.8, reviews: 6, tags: ['network'] },
  { id: 'n03', title: 'اکسس پوینت سقفی یوبیکیوتی UniFi U6 Lite', cat: 'network', sub: 'ap', catLabel: 'اکسس پوینت', img: 'access-point', condition: 'new', price: 8900000, old: 9600000, rating: 4.6, reviews: 11, tags: ['offer', 'network'] },
  { id: 'n04', title: 'سوییچ استوک ۴۸ پورت سیسکو Catalyst 2960X', cat: 'network', sub: 'switch', catLabel: 'سوییچ شبکه', img: 'switch', condition: 'used', grade: 'A', price: 18500000, old: 0, rating: 4.5, reviews: 9, tags: ['network'] },
  { id: 'n05', title: 'مودم روتر تی‌پی‌لینک Archer VR400 VDSL/ADSL', cat: 'network', sub: 'router', catLabel: 'مودم و روتر', img: 'router', condition: 'new', price: 3290000, old: 3650000, rating: 4.3, reviews: 48, tags: ['offer', 'network'] },
  { id: 'n06', title: 'رک ۹ یونیت دیواری عمق ۶۰ با درب شیشه‌ای', cat: 'network', sub: 'rack', catLabel: 'رک و تجهیزات', img: 'rack', condition: 'new', price: 6100000, old: 0, rating: 4.4, reviews: 4, tags: ['network'] },
  { id: 'n07', title: 'پچ‌کورد Cat6 شیلددار ۳ متری (بسته ۱۰ عددی)', cat: 'network', sub: 'cable', catLabel: 'کابل و پچ‌کورد', img: 'cable', condition: 'new', price: 1450000, old: 1690000, rating: 4.5, reviews: 63, tags: ['offer', 'network'] },
  { id: 'n08', title: 'کارت شبکه PCIe اینتل X520 دو پورت ۱۰ گیگابیت SFP+', cat: 'network', sub: 'nic', catLabel: 'کارت شبکه', img: 'nic', condition: 'used', grade: 'A', price: 4200000, old: 0, rating: 4.2, reviews: 7, tags: ['network'] },

  { id: 'c01', title: 'رم لپ‌تاپ ۱۶ گیگابایت DDR4 باس ۳۲۰۰ سامسونگ', cat: 'parts', catLabel: 'قطعات لپ‌تاپ', img: 'ram', condition: 'new', price: 2650000, old: 2900000, rating: 4.6, reviews: 72, tags: ['offer', 'parts'] },
  { id: 'c02', title: 'حافظه SSD M.2 NVMe ظرفیت ۱ ترابایت وسترن دیجیتال', cat: 'parts', catLabel: 'قطعات لپ‌تاپ', img: 'ssd', condition: 'new', price: 4350000, old: 0, rating: 4.8, reviews: 54, tags: ['parts'] },
  { id: 'c03', title: 'رم استوک لپ‌تاپ ۸ گیگابایت DDR4 باس ۲۶۶۶', cat: 'parts', catLabel: 'قطعات لپ‌تاپ', img: 'ram', condition: 'used', grade: 'A', price: 890000, old: 0, rating: 4.1, reviews: 39, tags: ['parts'] },
  { id: 'c04', title: 'شارژر لپ‌تاپ ۶۵ وات Type-C اورجینال', cat: 'parts', catLabel: 'لوازم جانبی', img: 'adapter', condition: 'new', price: 1290000, old: 1450000, rating: 4.4, reviews: 28, tags: ['offer', 'parts'] },
  { id: 'c05', title: 'ماوس بی‌سیم لاجیتک M330 سایلنت', cat: 'parts', catLabel: 'لوازم جانبی', img: 'mouse', condition: 'new', price: 960000, old: 0, rating: 4.5, reviews: 91, tags: ['parts'] }
];
