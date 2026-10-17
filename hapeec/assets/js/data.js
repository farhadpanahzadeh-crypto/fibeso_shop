/* Demo catalogue for the HAPEEC home page. Prices are in toman and are sample data. */
(function () {
  const img = (name) => `assets/img/p/${name}.jpg`;

  const products = [
    { id: 101, title: "موتورسیکلت هوندا CG 125 مدل ۱۴۰۴ استارتی", img: img("honda-1"), price: 112500000, off: 0, rate: 4.6, cat: "bike", flag: "ضمانت اصالت" },
    { id: 102, title: "اسکوتر شهری ۱۵۰ سی‌سی انژکتوری با ترمز ABS", img: img("scooter-1"), price: 189000000, off: 6, rate: 4.4, cat: "bike" },
    { id: 103, title: "موتورسیکلت اسپرت ۲۵۰ سی‌سی دو سیلندر", img: img("sport-1"), price: 468000000, off: 4, rate: 4.8, cat: "bike", flag: "ارسال رایگان" },
    { id: 104, title: "موتور تریل ۲۰۰ سی‌سی مناسب جاده خاکی", img: img("dirt-1"), price: 236000000, off: 0, rate: 4.3, cat: "bike" },
    { id: 105, title: "موتورسیکلت کروزر ۴۰۰ سی‌سی رنگ مشکی مات", img: img("cruiser-1"), price: 615000000, off: 3, rate: 4.7, cat: "bike" },
    { id: 106, title: "موتورسیکلت نیکد ۳۰۰ سی‌سی با چراغ LED", img: img("naked-1"), price: 398000000, off: 5, rate: 4.5, cat: "bike" },
    { id: 107, title: "اسکوتر کلاسیک ۱۲۵ سی‌سی رنگ کرم", img: img("scooter-2"), price: 154000000, off: 0, rate: 4.2, cat: "bike" },
    { id: 108, title: "موتورسیکلت اسپرت ۱۵۰ سی‌سی رینگ اسپرت", img: img("sport-2"), price: 214000000, off: 7, rate: 4.4, cat: "bike" },

    { id: 201, title: "کلاه کاسکت فک‌ثابت با استاندارد ECE 22.06 و طلق دودی", img: img("helmet-1"), price: 4890000, off: 18, rate: 4.7, cat: "gear", stock: 3 },
    { id: 202, title: "کلاه کاسکت فک‌متحرک با عینک آفتابی داخلی", img: img("helmet-2"), price: 6350000, off: 12, rate: 4.6, cat: "gear" },
    { id: 203, title: "دستکش موتورسواری تابستانی با محافظ کربنی", img: img("gloves-1"), price: 1290000, off: 22, rate: 4.5, cat: "gear" },
    { id: 204, title: "کاپشن موتورسواری چرمی با محافظ شانه و آرنج", img: img("jacket-1"), price: 9800000, off: 15, rate: 4.8, cat: "gear" },
    { id: 205, title: "بوت موتورسواری ضدآب ساق بلند", img: img("boots-1"), price: 5750000, off: 10, rate: 4.3, cat: "gear" },
    { id: 206, title: "کلاه کاسکت تریل با لبه آفتابگیر", img: img("helmet-3"), price: 3980000, off: 0, rate: 4.4, cat: "gear" },

    { id: 301, title: "لاستیک تیوبلس موتورسیکلت سایز 130/70-17 جلو و عقب", img: img("tire-1"), price: 2650000, off: 9, rate: 4.6, cat: "part", stock: 5 },
    { id: 302, title: "کیت زنجیر و دنده موتور ۱۲۵ سی‌سی اورینگ‌دار", img: img("chain-1"), price: 1480000, off: 14, rate: 4.5, cat: "part" },
    { id: 303, title: "روغن موتور ۴ زمانه 10W-40 تمام سنتتیک یک لیتری", img: img("oil-1"), price: 690000, off: 20, rate: 4.8, cat: "part", stock: 8 },
    { id: 304, title: "باتری موتورسیکلت ۱۲ ولت ۷ آمپر خشک", img: img("battery-1"), price: 1850000, off: 11, rate: 4.4, cat: "part" },
    { id: 305, title: "دیسک ترمز جلو موتورسیکلت فولاد ضدزنگ", img: img("brake-1"), price: 2240000, off: 0, rate: 4.3, cat: "part" },
    { id: 306, title: "شمع موتورسیکلت ایریدیوم با عمر بالا", img: img("spark-1"), price: 420000, off: 16, rate: 4.7, cat: "part" },
    { id: 307, title: "آینه بغل موتورسیکلت آلومینیومی جفت", img: img("mirror-1"), price: 980000, off: 25, rate: 4.2, cat: "part" },
    { id: 308, title: "چراغ جلو LED موتورسیکلت با نور سفید و زرد", img: img("light-1"), price: 1650000, off: 17, rate: 4.5, cat: "part" },
    { id: 309, title: "اگزوز اسپرت استیل موتورسیکلت با صدای بم", img: img("exhaust-1"), price: 7400000, off: 8, rate: 4.6, cat: "part" },
    { id: 310, title: "کیلومترشمار دیجیتال موتورسیکلت با دورسنج", img: img("dashboard-1"), price: 2950000, off: 13, rate: 4.4, cat: "part" },
    { id: 311, title: "لاستیک تریل آفرود سایز 110/90-18", img: img("tire-2"), price: 2380000, off: 0, rate: 4.3, cat: "part" },
    { id: 312, title: "روغن موتور ۴ زمانه 20W-50 نیمه سنتتیک", img: img("oil-2"), price: 480000, off: 10, rate: 4.5, cat: "part" }
  ];

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const pick = (...ids) => ids.map((id) => byId[id]);

  window.HAPEEC = {
    products,
    byId,

    heroSlides: [
      { img: img("night-1"), title: "از مشاوره تا تحویل، <em>همیشه همراهیم</em>", text: "موتور و قطعه‌ی مناسب را با کمک مشاوران هپییک انتخاب کنید و درب منزل تحویل بگیرید.", cta: "مشاوره رایگان" },
      { img: img("helmet-4"), title: "کلاه کاسکت استاندارد، <em>تا ۲۵٪ تخفیف</em>", text: "کلاه‌های فک‌ثابت و فک‌متحرک با گواهی ECE و ضمانت اصالت کالا.", cta: "خرید کلاه" },
      { img: img("workshop-1"), title: "قطعه‌ی اصل، <em>نصب مطمئن</em>", text: "لوازم یدکی با کد اصالت و آموزش نصب و نگهداری بعد از خرید.", cta: "قطعات یدکی" },
      { img: img("rider-1"), title: "خرید اقساطی موتورسیکلت <em>بدون ضامن</em>", text: "پرداخت آسان و متنوع، از نقدی تا اقساط چندماهه.", cta: "شرایط اقساط" }
    ],

    stories: [
      { label: "موتورهای نو رسید", cover: img("sport-3"), items: [
        { img: img("sport-3"), caption: "مدل‌های جدید اسپرت این هفته رسیدند. موجودی محدود است.", cta: "مشاهده موتورها" },
        { img: img("naked-2"), caption: "نیکد ۳۰۰ سی‌سی با چراغ تمام LED و کلاچ نرم.", cta: "مشخصات کامل" } ] },
      { label: "راهنمای انتخاب کلاه", cover: img("helmet-2"), items: [
        { img: img("helmet-2"), caption: "سایز کلاه را با متر دور سر، یک سانتی‌متر بالای ابرو، اندازه بگیرید.", cta: "جدول سایز" },
        { img: img("helmet-1"), caption: "برچسب ECE 22.06 پشت کلاه را حتما چک کنید.", cta: "کلاه‌های استاندارد" } ] },
      { label: "تعویض روغن", cover: img("oil-1"), items: [
        { img: img("oil-1"), caption: "هر ۱۵۰۰ تا ۲۰۰۰ کیلومتر روغن موتور را عوض کنید.", cta: "روغن مناسب موتور من" } ] },
      { label: "تست ترمز ABS", cover: img("brake-2"), items: [
        { img: img("brake-2"), caption: "لنت ترمز را وقتی ضخامتش به ۲ میلی‌متر رسید عوض کنید.", cta: "لنت و دیسک" } ] },
      { label: "سفر جاده‌ای", cover: img("rider-2"), items: [
        { img: img("rider-2"), caption: "چک‌لیست قبل از سفر: باد لاستیک، زنجیر، چراغ‌ها، روغن.", cta: "لوازم سفر" },
        { img: img("night-2"), caption: "در شب، جلیقه‌ی شب‌رنگ و چراغ کمکی دیده شدن را چند برابر می‌کند.", cta: "چراغ کمکی" } ] },
      { label: "اسکوتر شهری", cover: img("scooter-3"), items: [
        { img: img("scooter-3"), caption: "اسکوترهای ۱۲۵ تا ۱۵۰ سی‌سی، مناسب رفت‌وآمد روزانه.", cta: "مقایسه اسکوترها" } ] },
      { label: "تریل و آفرود", cover: img("dirt-2"), items: [
        { img: img("dirt-2"), caption: "برای خاکی، لاستیک آج‌درشت و فشار باد کمتر انتخاب کنید.", cta: "لاستیک تریل" } ] },
      { label: "کارگاه هپییک", cover: img("workshop-2"), items: [
        { img: img("workshop-2"), caption: "سرویس دوره‌ای در کارگاه‌های همکار هپییک با قطعه‌ی اصل.", cta: "رزرو نوبت" } ] },
      { label: "کروزرها", cover: img("cruiser-2"), items: [
        { img: img("cruiser-2"), caption: "کروزر یعنی ارتفاع زین کم و دست‌فرمان راحت برای مسیر طولانی.", cta: "مشاهده کروزرها" } ] },
      { label: "چراغ LED", cover: img("light-2"), items: [
        { img: img("light-2"), caption: "چراغ LED مصرف کمتر و نور بیشتری دارد. سوکت را قبل از خرید چک کنید.", cta: "چراغ‌ها" } ] }
    ],

    services: [
      { icon: "ph-headset", label: "مشاور خرید" },
      { icon: "ph-truck", label: "تحویل در محل" },
      { icon: "ph-credit-card", label: "تسهیل پرداخت" },
      { icon: "ph-shield-check", label: "ضمانت" },
      { icon: "ph-seal-check", label: "اصالت کالا" },
      { icon: "ph-wrench", label: "آموزش نصب و نگهداری" },
      { icon: "ph-squares-four", label: "همه‌ی خدمات" }
    ],

    amazing: pick(201, 303, 203, 307, 204, 308, 302, 306, 202, 301),

    banners4: [
      { img: img("gloves-2"), title: "دستکش و پوشاک", text: "تا ۳۰٪ تخفیف فصل" },
      { img: img("tire-3"), title: "لاستیک تیوبلس", text: "تعویض رایگان در کارگاه همکار" },
      { img: img("battery-2"), title: "باتری و برق موتور", text: "۱۲ ماه ضمانت" },
      { img: img("chain-2"), title: "زنجیر و دنده", text: "کیت کامل با اورینگ" }
    ],

    express: pick(303, 306, 203, 307, 312, 302, 304, 308, 201, 205),

    cats: [
      { label: "موتورسیکلت", img: img("naked-3") },
      { label: "اسکوتر", img: img("scooter-4") },
      { label: "کلاه کاسکت", img: img("helmet-4") },
      { label: "پوشاک موتورسواری", img: img("jacket-2") },
      { label: "لاستیک و رینگ", img: img("tire-1") },
      { label: "روغن و فیلتر", img: img("oil-2") },
      { label: "ترمز", img: img("brake-1") },
      { label: "زنجیر و دنده", img: img("chain-1") },
      { label: "باتری و برق", img: img("battery-1") },
      { label: "چراغ و آینه", img: img("light-3") },
      { label: "اگزوز", img: img("exhaust-2") },
      { label: "کیلومترشمار", img: img("dashboard-2") },
      { label: "بوت و دستکش", img: img("boots-2") },
      { label: "تریل و آفرود", img: img("dirt-3") },
      { label: "کروزر", img: img("cruiser-3") },
      { label: "ابزار و تعمیر", img: img("workshop-3") }
    ],

    banners2: [
      { img: img("dashboard-3"), title: "کیلومترشمار دیجیتال، نصب بدون تغییر سیم‌کشی", cta: "مشاهده" },
      { img: img("night-3"), title: "برای سفر شب، دیده شوید", cta: "چراغ و شب‌رنگ" }
    ],

    picks: [
      { title: "کلاه و تجهیزات ایمنی", text: "بر اساس سلیقه‌ی شما", items: pick(201, 202, 206, 203) },
      { title: "پرفروش‌های قطعات", text: "انتخاب مشتریان هفته", items: pick(301, 302, 306, 305) },
      { title: "سرویس دوره‌ای", text: "هر ۲۰۰۰ کیلومتر", items: pick(303, 312, 304, 306) },
      { title: "استایل موتور", text: "ظاهر موتورت را عوض کن", items: pick(309, 308, 307, 310) }
    ],

    rails: [
      { id: "bikes", icon: "ph-motorcycle", title: "خرید موتورسیکلت", text: "نو و صفر، با ضمانت اصالت و پلاک", items: pick(101, 102, 103, 104, 105, 106, 107, 108) },
      { id: "parts", icon: "ph-gear-six", title: "قطعات و لوازم یدکی", text: "با کد اصالت، مناسب موتور شما", items: pick(301, 302, 304, 305, 306, 309, 310, 311, 307) },
      { id: "gear", icon: "ph-hard-hat", title: "کلاه و تجهیزات ایمنی", text: "استاندارد ECE و DOT", items: pick(201, 202, 203, 204, 205, 206) }
    ],

    brands: ["honda", "yamahamotorcorporation", "suzuki", "ktm", "vespa", "ducati", "bmw", "piaggiogroup", "shell"],
    brandNames: { honda: "هوندا", yamahamotorcorporation: "یاماها", suzuki: "سوزوکی", ktm: "کی‌تی‌ام", vespa: "وسپا", ducati: "دوکاتی", bmw: "بی‌ام‌و موتوراد", piaggiogroup: "پیاجیو", shell: "روغن شل" },

    bestsellers: pick(303, 201, 301, 306, 203, 101, 302, 304, 308, 102, 202, 307),

    videos: [
      { img: img("rider-3"), title: "موتورسواری ایمن در ترافیک شهری", views: "۲۴٫۵ هزار", dur: "۰۲:۴۱" },
      { img: img("workshop-1"), title: "آموزش تعویض روغن موتور در خانه", views: "۱۸٫۲ هزار", dur: "۰۴:۱۰" },
      { img: img("helmet-3"), title: "مقایسه‌ی کلاه فک‌ثابت و فک‌متحرک", views: "۹٫۷ هزار", dur: "۰۳:۲۵" },
      { img: img("chain-2"), title: "تنظیم و روغن‌کاری زنجیر در ۵ دقیقه", views: "۳۱ هزار", dur: "۰۵:۰۲" },
      { img: img("dirt-1"), title: "اولین تجربه‌ی تریل روی جاده‌ی خاکی", views: "۱۲٫۴ هزار", dur: "۰۶:۳۰" },
      { img: img("sport-4"), title: "بررسی موتور اسپرت ۲۵۰ سی‌سی", views: "۴۰٫۱ هزار", dur: "۰۸:۱۵" },
      { img: img("rider-4"), title: "چک‌لیست سفر جاده‌ای با موتور", views: "۷٫۳ هزار", dur: "۰۳:۵۸" }
    ],

    posts: [
      { img: img("rider-2"), tag: "راهنمای خرید", title: "موتور اول چی بخرم؟ راهنمای انتخاب برای تازه‌کارها", date: "۲۲ مهر ۱۴۰۵" },
      { img: img("helmet-1"), tag: "ایمنی", title: "استاندارد ECE 22.06 چیست و چرا مهم است؟", date: "۱۸ مهر ۱۴۰۵" },
      { img: img("oil-2"), tag: "نگهداری", title: "روغن موتور مناسب را از روی کتابچه انتخاب کنید", date: "۱۱ مهر ۱۴۰۵" },
      { img: img("tire-2"), tag: "قطعات", title: "باد لاستیک موتور: جدول فشار برای شهر و جاده", date: "۴ مهر ۱۴۰۵" }
    ],

    mega: [
      { icon: "ph-motorcycle", label: "موتورسیکلت", groups: [
        { title: "بر اساس نوع", links: ["اسپرت", "اسکوتر", "کراس و تریل", "کروزر", "شهری ۱۲۵ سی‌سی", "نیکد"] },
        { title: "بر اساس برند", links: ["هوندا", "یاماها", "سوزوکی", "کی‌تی‌ام", "بنلی", "وسپا"] },
        { title: "موتور برقی", links: ["اسکوتر برقی", "موتور برقی شهری", "باتری لیتیومی"] },
        { title: "خرید اقساطی", links: ["اقساط بدون ضامن", "لیزینگ", "محاسبه‌گر اقساط"] } ] },
      { icon: "ph-gear-six", label: "قطعات یدکی", groups: [
        { title: "موتور و گیربکس", links: ["پیستون و رینگ", "سیلندر", "کلاچ", "واشر سرسیلندر", "سوپاپ"] },
        { title: "ترمز", links: ["لنت ترمز", "دیسک ترمز", "پمپ ترمز", "شیلنگ ترمز"] },
        { title: "انتقال قدرت", links: ["زنجیر", "دنده جلو و عقب", "تسمه", "کیت کامل"] },
        { title: "سیستم برق", links: ["باتری", "شمع", "دینام", "استارت", "سوئیچ"] } ] },
      { icon: "ph-drop", label: "روغن و مواد مصرفی", groups: [
        { title: "روغن", links: ["روغن موتور ۴ زمانه", "روغن موتور ۲ زمانه", "روغن ترمز", "روغن کمک"] },
        { title: "فیلتر", links: ["فیلتر روغن", "فیلتر هوا", "فیلتر بنزین"] },
        { title: "نگهداری", links: ["اسپری زنجیر", "مکمل سوخت", "واکس و پولیش"] } ] },
      { icon: "ph-tire", label: "لاستیک و رینگ", groups: [
        { title: "لاستیک", links: ["تیوبلس", "تیوپی", "تریل و آفرود", "اسکوتر"] },
        { title: "رینگ", links: ["رینگ اسپرت", "رینگ پره‌ای", "تیوب"] } ] },
      { icon: "ph-hard-hat", label: "کلاه و تجهیزات ایمنی", groups: [
        { title: "کلاه کاسکت", links: ["فک‌ثابت", "فک‌متحرک", "نیم‌کاسکت", "تریل"] },
        { title: "پوشاک", links: ["کاپشن", "شلوار", "جلیقه شب‌رنگ", "بارانی"] },
        { title: "محافظ", links: ["دستکش", "بوت", "زانوبند", "محافظ ستون فقرات"] } ] },
      { icon: "ph-lightbulb", label: "لوازم جانبی", groups: [
        { title: "روشنایی", links: ["چراغ جلو LED", "چراغ کمکی", "راهنما"] },
        { title: "امنیت", links: ["قفل دیسکی", "دزدگیر", "ردیاب GPS", "کاور موتور"] },
        { title: "سفر", links: ["باکس پشت", "خورجین", "هولدر موبایل", "اینترکام"] } ] },
      { icon: "ph-wrench", label: "ابزار و تعمیرات", groups: [
        { title: "ابزار", links: ["جعبه ابزار", "جک موتور", "پمپ باد", "تستر باتری"] },
        { title: "خدمات", links: ["رزرو سرویس", "کارگاه‌های همکار", "آموزش نصب"] } ] }
    ]
  };
})();
