/* Demo catalogue for the HAPEEC home page. Prices are in toman and are sample data. */
(function () {
  const img = (name) => `assets/img/p/${name}.jpg`;

  const products = [
    { id: 101, title: "موتورسیکلت هوندا CG 125 مدل ۱۴۰۴ استارتی", img: img("honda-1"), price: 112500000, off: 0, rate: 4.6, cat: "bike", flag: "ضمانت اصالت" },
    { id: 102, title: "اسکوتر شهری ۱۵۰ سی‌سی انژکتوری با ترمز ABS", img: img("scooter-1"), price: 189000000, off: 6, rate: 4.4, cat: "bike" },
    { id: 103, title: "موتورسیکلت اسپرت ۲۵۰ سی‌سی دو سیلندر", img: img("sport-1"), price: 468000000, off: 4, rate: 4.8, cat: "bike", flag: "ارسال رایگان" },
    { id: 104, title: "موتور تریل ۲۰۰ سی‌سی مناسب جاده خاکی", img: img("dirt-1"), price: 236000000, off: 0, rate: 4.3, cat: "bike" },
    { id: 105, title: "موتورسیکلت کروزر ۴۰۰ سی‌سی رنگ مشکی مات", img: img("cruiser-2"), price: 615000000, off: 3, rate: 4.7, cat: "bike" },
    { id: 106, title: "موتورسیکلت نیکد ۳۰۰ سی‌سی با چراغ LED", img: img("naked-2"), price: 398000000, off: 5, rate: 4.5, cat: "bike" },
    { id: 107, title: "اسکوتر کلاسیک ۱۲۵ سی‌سی رنگ کرم", img: img("scooter-2"), price: 154000000, off: 0, rate: 4.2, cat: "bike" },
    { id: 108, title: "موتورسیکلت اسپرت ۱۵۰ سی‌سی رینگ اسپرت", img: img("naked-1"), price: 214000000, off: 7, rate: 4.4, cat: "bike" },

    { id: 201, title: "کلاه کاسکت فک‌ثابت با استاندارد ECE 22.06 و طلق دودی", img: img("helmet-1"), price: 4890000, off: 18, rate: 4.7, cat: "gear", stock: 3 },
    { id: 202, title: "کلاه کاسکت فک‌متحرک با عینک آفتابی داخلی", img: null, icon: "ph-hard-hat", price: 6350000, off: 12, rate: 4.6, cat: "gear" },
    { id: 203, title: "دستکش موتورسواری تابستانی با محافظ کربنی", img: null, icon: "ph-hand", price: 1290000, off: 22, rate: 4.5, cat: "gear" },
    { id: 204, title: "کاپشن موتورسواری چرمی با محافظ شانه و آرنج", img: null, icon: "ph-coat-hanger", price: 9800000, off: 15, rate: 4.8, cat: "gear" },
    { id: 205, title: "بوت موتورسواری ضدآب ساق بلند", img: null, icon: "ph-boot", price: 5750000, off: 10, rate: 4.3, cat: "gear" },
    { id: 206, title: "کلاه کاسکت تریل با لبه آفتابگیر", img: null, icon: "ph-hard-hat", price: 3980000, off: 0, rate: 4.4, cat: "gear" },

    { id: 301, title: "لاستیک تیوبلس موتورسیکلت سایز 130/70-17 جلو و عقب", img: null, icon: "ph-tire", price: 2650000, off: 9, rate: 4.6, cat: "part", stock: 5 },
    { id: 302, title: "کیت زنجیر و دنده موتور ۱۲۵ سی‌سی اورینگ‌دار", img: null, icon: "ph-link", price: 1480000, off: 14, rate: 4.5, cat: "part" },
    { id: 303, title: "روغن موتور ۴ زمانه 10W-40 تمام سنتتیک یک لیتری", img: null, icon: "ph-drop", price: 690000, off: 20, rate: 4.8, cat: "part", stock: 8 },
    { id: 304, title: "باتری موتورسیکلت ۱۲ ولت ۷ آمپر خشک", img: null, icon: "ph-car-battery", price: 1850000, off: 11, rate: 4.4, cat: "part" },
    { id: 305, title: "دیسک ترمز جلو موتورسیکلت فولاد ضدزنگ", img: null, icon: "ph-disc", price: 2240000, off: 0, rate: 4.3, cat: "part" },
    { id: 306, title: "شمع موتورسیکلت ایریدیوم با عمر بالا", img: null, icon: "ph-lightning", price: 420000, off: 16, rate: 4.7, cat: "part" },
    { id: 307, title: "آینه بغل موتورسیکلت آلومینیومی جفت", img: null, icon: "ph-eye", price: 980000, off: 25, rate: 4.2, cat: "part" },
    { id: 308, title: "چراغ جلو LED موتورسیکلت با نور سفید و زرد", img: null, icon: "ph-headlights", price: 1650000, off: 17, rate: 4.5, cat: "part" },
    { id: 309, title: "اگزوز اسپرت استیل موتورسیکلت با صدای بم", img: null, icon: "ph-wind", price: 7400000, off: 8, rate: 4.6, cat: "part" },
    { id: 310, title: "کیلومترشمار دیجیتال موتورسیکلت با دورسنج", img: null, icon: "ph-gauge", price: 2950000, off: 13, rate: 4.4, cat: "part" },
    { id: 311, title: "لاستیک تریل آفرود سایز 110/90-18", img: null, icon: "ph-tire", price: 2380000, off: 0, rate: 4.3, cat: "part" },
    { id: 313, title: "شیر بنزین موتورسیکلت CG 125 آلومینیومی", img: img("honda-2"), price: 560000, off: 12, rate: 4.4, cat: "part", flag: "ضمانت اصالت" },
    { id: 312, title: "روغن موتور ۴ زمانه 20W-50 نیمه سنتتیک", img: null, icon: "ph-drop", price: 480000, off: 10, rate: 4.5, cat: "part" }
  ];

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const pick = (...ids) => ids.map((id) => byId[id]);

  window.HAPEEC = {
    products,
    byId,

    heroSlides: [
      { img: img("naked-3"), title: "از مشاوره تا تحویل، <em>همیشه همراهیم</em>", text: "موتور و قطعه‌ی مناسب را با کمک مشاوران هپییک انتخاب کنید و درب منزل تحویل بگیرید.", cta: "مشاوره رایگان" },
      { img: img("helmet-1"), title: "کلاه کاسکت استاندارد، <em>تا ۲۵٪ تخفیف</em>", text: "کلاه‌های فک‌ثابت و فک‌متحرک با گواهی ECE و ضمانت اصالت کالا.", cta: "خرید کلاه" },
      { img: img("dirt-1"), title: "تریل و آفرود، <em>تجهیزات کامل</em>", text: "موتور تریل، لاستیک آج‌درشت و پوشاک محافظ برای مسیرهای خاکی.", cta: "دنیای تریل" },
      { img: img("cruiser-3"), title: "خرید اقساطی موتورسیکلت <em>بدون ضامن</em>", text: "پرداخت آسان و متنوع، از نقدی تا اقساط چندماهه.", cta: "شرایط اقساط" }
    ],

    stories: [
      { label: "موتورهای نو رسید", cover: img("naked-3"), items: [
        { img: img("naked-3"), caption: "مدل‌های جدید نیکد این هفته رسیدند. موجودی محدود است.", cta: "مشاهده موتورها" },
        { img: img("naked-2"), caption: "نیکد ۳۰۰ سی‌سی با چراغ تمام LED و کلاچ نرم.", cta: "مشخصات کامل" } ] },
      { label: "راهنمای انتخاب کلاه", cover: img("helmet-1"), items: [
        { img: img("helmet-1"), caption: "سایز کلاه را با متر دور سر، یک سانتی‌متر بالای ابرو، اندازه بگیرید. برچسب ECE 22.06 پشت کلاه را هم چک کنید.", cta: "کلاه‌های استاندارد" } ] },
      { label: "سرویس CG 125", cover: img("honda-1"), items: [
        { img: img("honda-1"), caption: "هر ۱۵۰۰ تا ۲۰۰۰ کیلومتر روغن موتور را عوض کنید.", cta: "روغن مناسب موتور من" },
        { img: img("honda-2"), caption: "شیر بنزین نشتی دارد؟ قطعه‌ی اصل با ضمانت اصالت موجود است.", cta: "قطعات CG 125" } ] },
      { label: "اسپرت‌ها", cover: img("sport-1"), items: [
        { img: img("sport-1"), caption: "موتورهای اسپرت با ترمز ABS و فرمان دقیق.", cta: "مشاهده اسپرت‌ها" },
        { img: img("sport-2"), caption: "نیکد یا اسپرت؟ مشاوران هپییک کمک‌تان می‌کنند.", cta: "مشاوره رایگان" } ] },
      { label: "سفر جاده‌ای", cover: img("cruiser-3"), items: [
        { img: img("cruiser-3"), caption: "چک‌لیست قبل از سفر: باد لاستیک، زنجیر، چراغ‌ها، روغن.", cta: "لوازم سفر" },
        { img: img("cruiser-1"), caption: "در شب، جلیقه‌ی شب‌رنگ و چراغ کمکی دیده شدن را چند برابر می‌کند.", cta: "چراغ کمکی" } ] },
      { label: "اسکوتر شهری", cover: img("scooter-3"), items: [
        { img: img("scooter-3"), caption: "اسکوترهای ۱۲۵ تا ۱۵۰ سی‌سی، مناسب رفت‌وآمد روزانه.", cta: "مقایسه اسکوترها" },
        { img: img("scooter-1"), caption: "صندوق زیر زین جای کلاه و خرید روزانه را دارد.", cta: "اسکوترها" } ] },
      { label: "تریل و آفرود", cover: img("dirt-3"), items: [
        { img: img("dirt-3"), caption: "برای خاکی، لاستیک آج‌درشت و فشار باد کمتر انتخاب کنید.", cta: "لاستیک تریل" },
        { img: img("dirt-2"), caption: "حمل موتور تریل با وانت: تسمه‌ی مهار را فراموش نکنید.", cta: "تسمه و لوازم حمل" } ] },
      { label: "کلاسیک‌ها", cover: img("sport-3"), items: [
        { img: img("sport-3"), caption: "قطعات موتورهای کلاسیک را از هپییک سفارش دهید.", cta: "قطعات کلاسیک" } ] },
      { label: "کروزرها", cover: img("cruiser-2"), items: [
        { img: img("cruiser-2"), caption: "کروزر یعنی ارتفاع زین کم و دست‌فرمان راحت برای مسیر طولانی.", cta: "مشاهده کروزرها" } ] }
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
      { img: img("helmet-1"), title: "کلاه و تجهیزات ایمنی", text: "تا ۲۵٪ تخفیف فصل" },
      { img: img("scooter-4"), title: "اسکوتر شهری", text: "۱۲۵ تا ۱۵۰ سی‌سی، اقساطی" },
      { img: img("dirt-3"), title: "تریل و آفرود", text: "موتور، لاستیک و پوشاک" },
      { img: img("honda-1"), title: "قطعات CG 125", text: "با کد اصالت و ضمانت" }
    ],

    express: pick(303, 306, 313, 203, 307, 312, 302, 304, 308, 201, 205),

    cats: [
      { label: "موتورسیکلت", img: img("naked-2") },
      { label: "اسکوتر", img: img("scooter-3") },
      { label: "اسپرت", img: img("sport-1") },
      { label: "کروزر", img: img("cruiser-2") },
      { label: "تریل و آفرود", img: img("dirt-3") },
      { label: "کلاسیک", img: img("sport-3") },
      { label: "کلاه کاسکت", img: img("helmet-1") },
      { label: "پوشاک موتورسواری", icon: "ph-coat-hanger" },
      { label: "لاستیک و رینگ", icon: "ph-tire" },
      { label: "روغن و فیلتر", icon: "ph-drop" },
      { label: "ترمز", icon: "ph-disc" },
      { label: "زنجیر و دنده", icon: "ph-link" },
      { label: "باتری و برق", icon: "ph-car-battery" },
      { label: "چراغ و آینه", icon: "ph-headlights" },
      { label: "کیلومترشمار", icon: "ph-gauge" },
      { label: "ابزار و تعمیر", icon: "ph-wrench" }
    ],

    banners2: [
      { img: img("scooter-2"), title: "اسکوتر برای شهر، سبک و کم‌مصرف", cta: "مقایسه اسکوترها" },
      { img: img("naked-1"), title: "موتورهای جدید نمایشگاه هپییک", cta: "مشاهده" }
    ],

    picks: [
      { title: "کلاه و تجهیزات ایمنی", text: "بر اساس سلیقه‌ی شما", items: pick(201, 202, 206, 203) },
      { title: "پرفروش‌های قطعات", text: "انتخاب مشتریان هفته", items: pick(313, 301, 302, 306) },
      { title: "سرویس دوره‌ای", text: "هر ۲۰۰۰ کیلومتر", items: pick(303, 312, 304, 306) },
      { title: "موتورهای شهری", text: "اقتصادی و کم‌مصرف", items: pick(101, 102, 107, 108) }
    ],

    rails: [
      { id: "bikes", icon: "ph-motorcycle", title: "خرید موتورسیکلت", text: "نو و صفر، با ضمانت اصالت و پلاک", items: pick(101, 102, 103, 104, 105, 106, 107, 108) },
      { id: "parts", icon: "ph-gear-six", title: "قطعات و لوازم یدکی", text: "با کد اصالت، مناسب موتور شما", items: pick(313, 301, 302, 304, 305, 306, 309, 310, 311, 307) },
      { id: "gear", icon: "ph-hard-hat", title: "کلاه و تجهیزات ایمنی", text: "استاندارد ECE و DOT", items: pick(201, 202, 203, 204, 205, 206) }
    ],

    brands: ["honda", "yamahamotorcorporation", "suzuki", "ktm", "vespa", "ducati", "bmw", "piaggiogroup", "shell"],
    brandNames: { honda: "هوندا", yamahamotorcorporation: "یاماها", suzuki: "سوزوکی", ktm: "کی‌تی‌ام", vespa: "وسپا", ducati: "دوکاتی", bmw: "بی‌ام‌و موتوراد", piaggiogroup: "پیاجیو", shell: "روغن شل" },

    bestsellers: pick(303, 201, 301, 306, 203, 101, 302, 304, 308, 102, 202, 307),

    videos: [
      { img: img("cruiser-3"), title: "موتورسواری ایمن در ترافیک شهری", views: "۲۴٫۵ هزار", dur: "۰۲:۴۱" },
      { img: img("honda-1"), title: "آموزش تعویض روغن CG 125 در خانه", views: "۱۸٫۲ هزار", dur: "۰۴:۱۰" },
      { img: img("helmet-1"), title: "مقایسه‌ی کلاه فک‌ثابت و فک‌متحرک", views: "۹٫۷ هزار", dur: "۰۳:۲۵" },
      { img: img("dirt-1"), title: "اولین مسابقه‌ی موتورکراس، از نزدیک", views: "۳۱ هزار", dur: "۰۵:۰۲" },
      { img: img("dirt-3"), title: "پرش با موتور تریل: نکات ایمنی", views: "۱۲٫۴ هزار", dur: "۰۶:۳۰" },
      { img: img("sport-1"), title: "بررسی موتور اسپرت هزار سی‌سی", views: "۴۰٫۱ هزار", dur: "۰۸:۱۵" },
      { img: img("cruiser-1"), title: "چک‌لیست موتورسواری در شب", views: "۷٫۳ هزار", dur: "۰۳:۵۸" }
    ],

    posts: [
      { img: img("cruiser-3"), tag: "راهنمای خرید", title: "موتور اول چی بخرم؟ راهنمای انتخاب برای تازه‌کارها", date: "۲۲ مهر ۱۴۰۵" },
      { img: img("helmet-1"), tag: "ایمنی", title: "استاندارد ECE 22.06 چیست و چرا مهم است؟", date: "۱۸ مهر ۱۴۰۵" },
      { img: img("honda-1"), tag: "نگهداری", title: "سرویس دوره‌ای CG 125: چه چیزی، هر چند کیلومتر", date: "۱۱ مهر ۱۴۰۵" },
      { img: img("scooter-3"), tag: "مقایسه", title: "اسکوتر یا موتور دنده‌ای؟ کدام برای شهر بهتر است", date: "۴ مهر ۱۴۰۵" }
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
