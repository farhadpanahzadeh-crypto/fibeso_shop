/* SAMPLE catalogue for the front-end prototype. Titles, prices (Toman), ratings, specs
   and stock are placeholders — replace with the shop's real catalogue and photos.
   condition: 'new' | 'used'; used items carry a cosmetic grade (A/B). */
(function () {
  'use strict';

  var LAPTOP_WARRANTY_NEW = '۱۸ ماه گارانتی شرکتی';
  var LAPTOP_WARRANTY_USED = '۶ ماه ضمانت سلامت فیبسو';
  var NET_WARRANTY_NEW = '۲۴ ماه گارانتی';
  var NET_WARRANTY_USED = '۳ ماه ضمانت سلامت فیبسو';

  function laptop(o) {
    o.cat = 'laptop';
    o.warranty = o.warranty || (o.condition === 'used' ? LAPTOP_WARRANTY_USED : LAPTOP_WARRANTY_NEW);
    o.specs = [
      ['پردازنده', o.cpu],
      ['حافظه رم', o.ram],
      ['حافظه داخلی', o.storage],
      ['اندازه صفحه نمایش', o.screen],
      ['پردازنده گرافیکی', o.gpu],
      ['سیستم عامل', 'ویندوز ۱۱ (قابل نصب)']
    ];
    if (o.condition === 'used') o.specs.push(['وضعیت ظاهری', o.grade === 'A' ? 'درجه A — بدون خط و خش محسوس' : 'درجه B — آثار جزئی استفاده']);
    return o;
  }

  function item(o) {
    o.warranty = o.warranty || (o.condition === 'used' ? NET_WARRANTY_USED : NET_WARRANTY_NEW);
    if (o.condition === 'used' && o.grade) o.specs.push(['وضعیت ظاهری', 'درجه ' + o.grade]);
    return o;
  }

  window.SHOP_PRODUCTS = [
    laptop({ id: 'l01', title: 'لپ‌تاپ ۱۴ اینچی لنوو ThinkPad E14 Core i5 رم ۱۶ گیگ SSD 512', brand: 'لنوو', catLabel: 'لپ‌تاپ', img: 'laptop-business', condition: 'new', price: 48900000, old: 52500000, rating: 4.6, reviews: 12, tags: ['offer'], cpu: 'Intel Core i5-1335U', ram: '۱۶ گیگابایت DDR4', storage: 'SSD 512 گیگابایت', screen: '۱۴ اینچ Full HD IPS', gpu: 'Intel Iris Xe', use: ['office'], desc: 'لپ‌تاپ تجاری مقاوم با کیبورد مشهور ThinkPad، مناسب کارهای اداری، برنامه‌نویسی و استفاده روزمره.' }),
    laptop({ id: 'l02', title: 'لپ‌تاپ ۱۵.۶ اینچی ایسوس TUF Gaming Core i7 گرافیک RTX 4060', brand: 'ایسوس', catLabel: 'لپ‌تاپ گیمینگ', img: 'laptop-gaming', condition: 'new', price: 76500000, old: 81000000, rating: 4.8, reviews: 9, tags: ['offer'], cpu: 'Intel Core i7-13620H', ram: '۱۶ گیگابایت DDR5', storage: 'SSD 1 ترابایت', screen: '۱۵.۶ اینچ ۱۴۴ هرتز', gpu: 'NVIDIA RTX 4060 8GB', use: ['gaming'], desc: 'لپ‌تاپ گیمینگ با بدنه مقاوم و خنک‌کننده قدرتمند برای بازی و رندرینگ.' }),
    laptop({ id: 'l03', title: 'لپ‌تاپ ۱۳.۳ اینچی اچ‌پی EliteBook 830 G8 Core i5 رم ۱۶ گیگ', brand: 'اچ‌پی', catLabel: 'لپ‌تاپ', img: 'laptop-ultrabook', condition: 'new', price: 39800000, old: 0, rating: 4.4, reviews: 5, tags: [], cpu: 'Intel Core i5-1135G7', ram: '۱۶ گیگابایت', storage: 'SSD 512 گیگابایت', screen: '۱۳.۳ اینچ Full HD', gpu: 'Intel Iris Xe', use: ['office', 'light'], desc: 'الترابوک سبک و باکیفیت مناسب مدیران و افرادی که زیاد در سفر هستند.' }),
    laptop({ id: 'l04', title: 'لپ‌تاپ ۱۵.۶ اینچی دل Precision 3581 Core i7 رم ۳۲ گیگ', brand: 'دل', catLabel: 'لپ‌تاپ مهندسی', img: 'laptop-workstation', condition: 'new', price: 98500000, old: 104000000, rating: 4.9, reviews: 3, tags: [], cpu: 'Intel Core i7-13700H', ram: '۳۲ گیگابایت DDR5', storage: 'SSD 1 ترابایت', screen: '۱۵.۶ اینچ Full HD', gpu: 'NVIDIA RTX A1000', use: ['engineering'], desc: 'ورک‌استیشن همراه برای نرم‌افزارهای مهندسی، طراحی سه‌بعدی و تدوین.' }),
    laptop({ id: 'l05', title: 'لپ‌تاپ ۱۴ اینچی ایسر Aspire 5 Ryzen 5 رم ۸ گیگ SSD 512', brand: 'ایسر', catLabel: 'لپ‌تاپ', img: 'laptop-business', condition: 'new', price: 31200000, old: 33900000, rating: 4.2, reviews: 18, tags: ['offer'], cpu: 'AMD Ryzen 5 7530U', ram: '۸ گیگابایت', storage: 'SSD 512 گیگابایت', screen: '۱۴ اینچ Full HD', gpu: 'AMD Radeon', use: ['student'], desc: 'گزینه اقتصادی و خوش‌قیمت برای دانشجویان و کارهای روزمره.' }),
    laptop({ id: 'l06', title: 'لپ‌تاپ ۱۶ اینچی لنوو Legion 5 Ryzen 7 گرافیک RTX 4070', brand: 'لنوو', catLabel: 'لپ‌تاپ گیمینگ', img: 'laptop-gaming', condition: 'new', price: 92400000, old: 0, rating: 4.7, reviews: 7, tags: [], cpu: 'AMD Ryzen 7 7840HS', ram: '۱۶ گیگابایت DDR5', storage: 'SSD 1 ترابایت', screen: '۱۶ اینچ ۱۶۵ هرتز', gpu: 'NVIDIA RTX 4070 8GB', use: ['gaming'], desc: 'لپ‌تاپ گیمینگ پرقدرت با نمایشگر سریع و کیبورد نورپردازی‌شده.' }),

    laptop({ id: 'u01', title: 'لپ‌تاپ استوک دل Latitude 7490 Core i7 نسل ۸ رم ۱۶ گیگ', brand: 'دل', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'A', price: 17900000, old: 19500000, rating: 4.5, reviews: 41, tags: ['offer'], cpu: 'Intel Core i7-8650U', ram: '۱۶ گیگابایت', storage: 'SSD 256 گیگابایت', screen: '۱۴ اینچ Full HD', gpu: 'Intel UHD 620', use: ['office', 'student'], desc: 'لپ‌تاپ استوک اروپایی تست‌شده، باتری سالم و بدنه درجه A.' }),
    laptop({ id: 'u02', title: 'لپ‌تاپ استوک لنوو ThinkPad T480 Core i5 رم ۸ گیگ SSD 256', brand: 'لنوو', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 13400000, old: 0, rating: 4.4, reviews: 57, tags: [], cpu: 'Intel Core i5-8350U', ram: '۸ گیگابایت', storage: 'SSD 256 گیگابایت', screen: '۱۴ اینچ HD', gpu: 'Intel UHD 620', use: ['office', 'student'], desc: 'یکی از پرفروش‌ترین لپ‌تاپ‌های استوک با دوام بالا و قطعات در دسترس.' }),
    laptop({ id: 'u03', title: 'لپ‌تاپ استوک اچ‌پی ZBook 15 G5 Core i7 گرافیک Quadro', brand: 'اچ‌پی', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'B', price: 24600000, old: 27000000, rating: 4.3, reviews: 22, tags: ['offer'], cpu: 'Intel Core i7-8850H', ram: '۱۶ گیگابایت', storage: 'SSD 512 گیگابایت', screen: '۱۵.۶ اینچ Full HD', gpu: 'NVIDIA Quadro P1000', use: ['engineering'], desc: 'ورک‌استیشن استوک مقرون‌به‌صرفه برای نرم‌افزارهای مهندسی.' }),
    laptop({ id: 'u04', title: 'لپ‌تاپ استوک اچ‌پی EliteBook 840 G6 Core i5 رم ۱۶ گیگ', brand: 'اچ‌پی', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 16200000, old: 0, rating: 4.6, reviews: 33, tags: [], cpu: 'Intel Core i5-8365U', ram: '۱۶ گیگابایت', storage: 'SSD 256 گیگابایت', screen: '۱۴ اینچ Full HD', gpu: 'Intel UHD 620', use: ['office', 'light'], desc: 'بدنه آلومینیومی سبک و کیبورد باکیفیت؛ انتخابی مطمئن برای کار اداری.' }),
    laptop({ id: 'u05', title: 'لپ‌تاپ استوک دل Precision 5530 Core i7 رم ۳۲ گیگ', brand: 'دل', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-a', condition: 'used', grade: 'B', price: 28900000, old: 0, rating: 4.1, reviews: 8, tags: [], stock: 0, cpu: 'Intel Core i7-8850H', ram: '۳۲ گیگابایت', storage: 'SSD 512 گیگابایت', screen: '۱۵.۶ اینچ Full HD', gpu: 'NVIDIA Quadro P2000', use: ['engineering'], desc: 'ورک‌استیشن باریک با رم بالا برای کارهای سنگین.' }),
    laptop({ id: 'u06', title: 'لپ‌تاپ استوک لنوو ThinkPad X1 Carbon نسل ۷ Core i7', brand: 'لنوو', catLabel: 'لپ‌تاپ استوک', img: 'laptop-used-b', condition: 'used', grade: 'A', price: 22800000, old: 24500000, rating: 4.7, reviews: 26, tags: [], cpu: 'Intel Core i7-8665U', ram: '۱۶ گیگابایت', storage: 'SSD 512 گیگابایت', screen: '۱۴ اینچ Full HD', gpu: 'Intel UHD 620', use: ['light', 'office'], desc: 'سبک‌ترین ThinkPad سری X با بدنه فیبر کربن.' }),

    item({ id: 'n01', title: 'روتر میکروتیک hAP ax2 وای‌فای ۶ دوبانده', brand: 'میکروتیک', cat: 'network', sub: 'router', catLabel: 'مودم و روتر', img: 'router', condition: 'new', price: 7450000, old: 7990000, rating: 4.7, reviews: 15, tags: ['offer'], desc: 'روتر وای‌فای ۶ با ۵ پورت گیگابیت و RouterOS؛ مناسب دفاتر کوچک و خانه‌های هوشمند.', specs: [['استاندارد بی‌سیم', 'Wi-Fi 6 (802.11ax)'], ['تعداد پورت', '۵ پورت گیگابیت'], ['باند فرکانسی', '۲.۴ و ۵ گیگاهرتز'], ['سیستم عامل', 'RouterOS v7']] }),
    item({ id: 'n02', title: 'سوییچ ۲۴ پورت گیگابیت سیسکو CBS250-24T-4G مدیریتی', brand: 'سیسکو', cat: 'network', sub: 'switch', catLabel: 'سوییچ شبکه', img: 'switch', condition: 'new', price: 21300000, old: 0, rating: 4.8, reviews: 6, tags: [], desc: 'سوییچ هوشمند لایه ۲ با ۲۴ پورت گیگابیت و ۴ پورت SFP برای شبکه‌های سازمانی.', specs: [['تعداد پورت', '۲۴ پورت گیگابیت + ۴ SFP'], ['نوع مدیریت', 'مدیریتی (Smart)'], ['لایه', 'لایه ۲'], ['نصب', 'رکمونت ۱ یونیت']] }),
    item({ id: 'n03', title: 'اکسس پوینت سقفی یوبیکیوتی UniFi U6 Lite', brand: 'یوبیکیوتی', cat: 'network', sub: 'ap', catLabel: 'اکسس پوینت', img: 'access-point', condition: 'new', price: 8900000, old: 9600000, rating: 4.6, reviews: 11, tags: ['offer'], desc: 'اکسس پوینت سقفی وای‌فای ۶ با مدیریت متمرکز UniFi.', specs: [['استاندارد بی‌سیم', 'Wi-Fi 6'], ['تغذیه', 'PoE'], ['پوشش', 'حدود ۱۱۵ متر مربع'], ['نصب', 'سقفی / دیواری']] }),
    item({ id: 'n04', title: 'سوییچ استوک ۴۸ پورت سیسکو Catalyst 2960X', brand: 'سیسکو', cat: 'network', sub: 'switch', catLabel: 'سوییچ شبکه', img: 'switch', condition: 'used', grade: 'A', price: 18500000, old: 0, rating: 4.5, reviews: 9, tags: [], desc: 'سوییچ سازمانی استوک تست‌شده با IOS به‌روز.', specs: [['تعداد پورت', '۴۸ پورت گیگابیت + ۴ SFP'], ['نوع مدیریت', 'مدیریتی کامل'], ['لایه', 'لایه ۲ پیشرفته']] }),
    item({ id: 'n05', title: 'مودم روتر تی‌پی‌لینک Archer VR400 VDSL/ADSL', brand: 'تی‌پی‌لینک', cat: 'network', sub: 'router', catLabel: 'مودم و روتر', img: 'router', condition: 'new', price: 3290000, old: 3650000, rating: 4.3, reviews: 48, tags: ['offer'], desc: 'مودم دوبانده VDSL/ADSL مناسب اینترنت خانگی.', specs: [['نوع اتصال', 'VDSL2 / ADSL2+'], ['استاندارد بی‌سیم', 'Wi-Fi 5 (AC1200)'], ['تعداد پورت', '۴ پورت LAN']] }),
    item({ id: 'n06', title: 'رک ۹ یونیت دیواری عمق ۶۰ با درب شیشه‌ای', brand: 'فیبسو', cat: 'network', sub: 'rack', catLabel: 'رک و تجهیزات', img: 'rack', condition: 'new', price: 6100000, old: 0, rating: 4.4, reviews: 4, tags: [], warranty: '۱۲ ماه ضمانت', desc: 'رک دیواری با درب شیشه‌ای قفل‌دار و فن خنک‌کننده.', specs: [['ارتفاع', '۹ یونیت'], ['عمق', '۶۰ سانتی‌متر'], ['نصب', 'دیواری']] }),
    item({ id: 'n07', title: 'پچ‌کورد Cat6 شیلددار ۳ متری (بسته ۱۰ عددی)', brand: 'فیبسو', cat: 'network', sub: 'cable', catLabel: 'کابل و پچ‌کورد', img: 'cable', condition: 'new', price: 1450000, old: 1690000, rating: 4.5, reviews: 63, tags: ['offer'], warranty: 'ضمانت اصالت کالا', desc: 'پچ‌کورد شیلددار با کانکتور طلاکاری‌شده مناسب رک و اتاق سرور.', specs: [['رده', 'Cat6 SFTP'], ['طول', '۳ متر'], ['تعداد', '۱۰ عدد']] }),
    item({ id: 'n08', title: 'کارت شبکه PCIe اینتل X520 دو پورت ۱۰ گیگابیت SFP+', brand: 'اینتل', cat: 'network', sub: 'nic', catLabel: 'کارت شبکه', img: 'nic', condition: 'used', grade: 'A', price: 4200000, old: 0, rating: 4.2, reviews: 7, tags: [], desc: 'کارت شبکه سرور استوک تست‌شده برای اتصال ۱۰ گیگابیتی.', specs: [['رابط', 'PCIe 2.0 x8'], ['پورت', '۲ × SFP+ ده گیگابیت']] }),

    item({ id: 'c01', title: 'رم لپ‌تاپ ۱۶ گیگابایت DDR4 باس ۳۲۰۰ سامسونگ', brand: 'سامسونگ', cat: 'parts', sub: 'ram', catLabel: 'قطعات لپ‌تاپ', img: 'ram', condition: 'new', price: 2650000, old: 2900000, rating: 4.6, reviews: 72, tags: ['offer'], warranty: 'گارانتی مادام‌العمر', desc: 'رم SODIMM با سازگاری بالا برای ارتقای سرعت لپ‌تاپ.', specs: [['ظرفیت', '۱۶ گیگابایت'], ['نوع', 'DDR4 SODIMM'], ['فرکانس', '۳۲۰۰ مگاهرتز']] }),
    item({ id: 'c02', title: 'حافظه SSD M.2 NVMe ظرفیت ۱ ترابایت وسترن دیجیتال', brand: 'وسترن دیجیتال', cat: 'parts', sub: 'ssd', catLabel: 'قطعات لپ‌تاپ', img: 'ssd', condition: 'new', price: 4350000, old: 0, rating: 4.8, reviews: 54, tags: [], warranty: '۳۶ ماه گارانتی', desc: 'حافظه NVMe پرسرعت برای کاهش زمان بوت و اجرای برنامه‌ها.', specs: [['ظرفیت', '۱ ترابایت'], ['رابط', 'M.2 NVMe PCIe 4.0'], ['سرعت خواندن', 'تا ۵۰۰۰ مگابایت بر ثانیه']] }),
    item({ id: 'c03', title: 'رم استوک لپ‌تاپ ۸ گیگابایت DDR4 باس ۲۶۶۶', brand: 'متفرقه', cat: 'parts', sub: 'ram', catLabel: 'قطعات لپ‌تاپ', img: 'ram', condition: 'used', grade: 'A', price: 890000, old: 0, rating: 4.1, reviews: 39, tags: [], warranty: '۳ ماه ضمانت سلامت فیبسو', desc: 'رم استوک تست‌شده؛ گزینه اقتصادی برای ارتقا.', specs: [['ظرفیت', '۸ گیگابایت'], ['نوع', 'DDR4 SODIMM'], ['فرکانس', '۲۶۶۶ مگاهرتز']] }),
    item({ id: 'c04', title: 'شارژر لپ‌تاپ ۶۵ وات Type-C اورجینال', brand: 'متفرقه', cat: 'parts', sub: 'charger', catLabel: 'لوازم جانبی', img: 'adapter', condition: 'new', price: 1290000, old: 1450000, rating: 4.4, reviews: 28, tags: ['offer'], warranty: '۶ ماه گارانتی', desc: 'شارژر USB-C با پشتیبانی Power Delivery سازگار با اکثر لپ‌تاپ‌ها.', specs: [['توان', '۶۵ وات'], ['درگاه', 'USB-C PD']] }),
    item({ id: 'c05', title: 'ماوس بی‌سیم لاجیتک M330 سایلنت', brand: 'لاجیتک', cat: 'parts', sub: 'mouse', catLabel: 'لوازم جانبی', img: 'mouse', condition: 'new', price: 960000, old: 0, rating: 4.5, reviews: 91, tags: [], warranty: '۱۲ ماه گارانتی', desc: 'ماوس بی‌صدا با باتری طولانی و طراحی ارگونومیک.', specs: [['اتصال', 'بی‌سیم ۲.۴ گیگاهرتز'], ['کلیک', 'بی‌صدا']] })
  ];
})();
