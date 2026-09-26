/* ============================================================================
   الجاسوس — THE SPY WORDS
   ----------------------------------------------------------------------------
   One list per category (they used to be read from the "كلمات الجاسوس" sheet on
   every page load). Shared by the site, which writes them into the page
   (tools/build-site.mjs), and the rooms server, which deals them
   (RoomGames.js). Checked by tools/validate-content.js.

   A category whose name contains 🔒 is locked: its first entry is the password.
   Anything here ships inside the public site, so a lock only keeps words out
   of the game menu - it does not keep them secret.
   ========================================================================= */
const SPY_WORDS = {
  "حيوانات": [
    "أسد", "فيل", "زرافة", "قطة", "كلب", "صقر", "حوت", "دلفين",
    "حصان", "نمر", "قرد", "تمساح", "بطريق", "ثعبان", "خفاش", "طاووس",
    "سلحفاة", "كنغر", "نسر", "غزال", "دب", "أرنب", "ذئب", "بقرة",
    "نعامة", "وحيد القرن", "فرس النهر", "باندا", "سنجاب", "ثعلب", "ذبابة", "صرصور",
    "فراشة", "عقرب", "جمل", "خروف", "ماعز", "غوريلا", "نملة", "بومة",
    "فهد", "كوالا", "جرو", "حمامة", "هدهد", "دودة", "بطة", "وزة",
    "كتكوت", "عصفور", "غراب", "ناموسة", "برص", "ديك", "زرزور", "ديك رومي",
    "عجل", "يمامة", "سحلية", "نحلة", "قرموط",

    // mammals
    "ضبع", "دب قطبي", "حمار وحشي", "أيل", "رنة", "وعل",
    "جاموسة", "ثور", "ناقة", "مهر", "حمار", "بغل",
    "نعجة", "جدي", "فأر", "جرذ", "هامستر", "قنفذ",
    "نمر أبيض", "شمبانزي", "إنسان الغاب", "بابون", "نمس", "عرسة",
    "راكون", "قندس", "حصان عربي", "آكل النمل", "حيوان الكسل", "لاما",
    "ألبكة", "كلب بوليسي", "خنزير بري", "فقمة", "أسد البحر", "سمكة زينة",
    "حوت قاتل", "أبو فصادة", "سنجاب طائر", "فأر الحقل", "جربوع",

    // birds
    "عقاب", "كناري", "ببغاء", "بجعة", "فرخة", "سمان",
    "نورس", "قطة شيرازي", "أبو قردان", "لقلق", "فلامنجو", "طوقان",
    "طائر الطنان", "نقار الخشب", "كروان", "بلبل", "سنونو", "حدأة",
    "نسر أصلع", "كوكاتو", "عندليب", "طائر الرفراف", "بجع أبيض", "ديك بري",

    // sea
    "سمكة", "قرش", "أخطبوط", "حبار", "سبيط", "قنديل البحر",
    "نجم البحر", "قنفذ البحر", "حصان البحر", "كابوريا", "جمبري", "استاكوزا",
    "محار", "سلحفاة بحرية", "سمكة المهرج", "سمكة أبو سيف", "لخمة", "ثعبان البحر",
    "سردين", "تونة", "سلمون", "بلطي", "بوري", "دنيس",
    "سمكة ذهبية", "حوت أزرق", "سمكة القرش الحوتي", "شبل", "بلح البحر", "سمكة منفوخة",

    // reptiles
    "كوبرا", "حمار حصاوي", "حرباء", "ورل", "إغوانا", "ضفدع",
    "نسناس", "تنين كومودو", "أناكوندا", "كلب سلوقي", "سلحفاة الماء", "ضفدع الشجر",
    "تمساح أمريكي", "الثعبان الجرسي", "سحلية الصحراء",

    // bugs
    "دبور", "عثة", "خنفساء", "دعسوقة", "سمك موسى", "جرادة",
    "يعسوب", "يراعة", "عنكبوت", "دودة القز", "حلزون", "برغوث",
    "فرس النبي", "أم أربعة وأربعين", "يرقة", "نمل أبيض", "رتيلاء", "قملة",
    "بق الفراش", "جندب", "نحلة ملكة", "زنبور", "سوسة",

    // extinct
    "ديناصور", "ماموث", "تي ريكس", "كلب لولو", "قطة بلدي", "حصان سباق",
    "النمر ذو الأنياب", "طائر الدودو"
  ],
  "أكلات": [
    "بيتزا", "برجر", "كشري", "شاورما", "حرنكش", "محشي", "كبسة", "ملوخية",
    "مسقعة", "سوشي", "آيس كريم", "مكرونة بشاميل", "كباب", "كفتة", "حواوشي", "ورق عنب",
    "سمك مشوي", "فشار", "شوربة عدس", "فول سوداني", "بان كيك", "بسبوسة", "كنافة", "تورتة",
    "شوربة فراخ", "كبدة", "إندومي", "طرشي", "جبنة قديمة", "فطير مشلتت", "بطاطس مقلية", "حمص الشام",
    "كب كيك", "كوسة بالبشاميل", "كفتة داود باشا", "شوربة خضار", "شيش طاووق", "عصير قصب", "ساندوتش", "ميلك شيك",
    "عيش", "جبنة بيضاء", "رز بلبن", "أم علي", "بفتيك", "سمبوسة", "طحينة", "بابا غنوج",
    "فاصوليا", "بلح الشام", "مكرونة محمرة", "كفتة رز", "باذنجان", "بطيخ", "مانجو", "طعمية",
    "جلاش", "أرز معمر", "كبدة وسجق", "ممبار", "شوربة لسان عصفور", "فتة لحمة", "حلاوة طحينية", "بليلة",
    "زلابية", "لقمة القاضي", "مهلبية", "جيلي", "فول نابت", "قلقاس",

    // fruit
    "تفاح", "موز", "برتقال", "يوسفي", "ليمون", "جريب فروت",
    "عنب", "فراولة", "توت", "كريز", "خوخ", "مشمش",
    "برقوق", "كمثرى", "جوافة", "أناناس", "كيوي", "شمام",
    "سلطة زبادي", "رمان", "تين", "تين شوكي", "بلح", "جوز هند",
    "أفوكادو", "بابايا", "قشطة", "نبق", "كاكا", "ليتشي",
    "توت أزرق", "فاكهة التنين", "زبيب", "سمك مقلي", "مشبك", "بوملي",
    "كومكوات", "باشن فروت",

    // vegetables
    "طماطم", "خيار", "بطاطس", "بطاطا", "جزر", "بصل",
    "ثوم", "فلفل رومي", "كوسة", "قرع", "بامية", "سبانخ",
    "خس", "كرنب", "قرنبيط", "بروكلي", "بسلة", "فاصوليا خضرا",
    "لوبيا", "فول أخضر", "ذرة", "فجل", "لفت", "بنجر",
    "كرفس", "بقدونس", "شبت", "كزبرة", "جرجير", "نعناع",
    "ريحان", "زعتر", "مشروم", "خرشوف", "فلفل حار", "كرات",
    "زنجبيل",

    // dishes
    "فتة", "فول مدمس", "شكشوكة", "كبدة إسكندراني", "سجق", "رقاق",
    "عيش بلدي", "عيش شامي", "حمام محشي", "بط مشوي", "فراخ مشوية", "صيادية",
    "كاليماري", "طاجن", "لب", "فسيخ", "رنجة", "بصارة",
    "هوت دوج", "لازانيا", "تاكو", "نودلز", "كاري", "برياني",
    "مندي", "منسف", "مقلوبة", "حمص", "متبل", "تبولة",
    "فتوش", "كبة", "كرواسون", "وافل", "توست", "ناجتس",
    "ستيك", "أومليت", "بيض مسلوق", "بيض مقلي", "جبنة رومي", "جبنة شيدر",
    "موتزاريلا", "لانشون", "بسطرمة", "لبنة", "سلطة خضرا", "مكرونة بالصلصة",
    "مكرونة إسباجتي", "رز بالشعرية", "ملوخية بالفراخ", "بامية باللحمة", "كوارع", "لحمة راس",
    "فشة", "صينية بطاطس", "فريسكا",

    // sweets
    "قطايف", "كريم كراميل", "كحك", "غريبة", "بيتي فور", "بسكويت",
    "شوكولاتة", "جاتوه", "دونات", "براونيز", "تشيز كيك", "مصاصة",
    "غزل البنات", "ملبن", "عسل أسود", "فطيرة تفاح", "سينابون", "بقلاوة",
    "هريسة", "مارشميلو", "لبان", "عسلية", "حمصية", "سمسمية",
    "فولية", "كرواسون بالشوكولاتة", "بودنج", "موس شوكولاتة",

    // drinks
    "شاي", "قهوة", "نسكافيه", "كابتشينو", "لاتيه", "إسبريسو",
    "شوكولاتة ساخنة", "سحلب", "ينسون", "كركديه", "تمر هندي", "عرقسوس",
    "سوبيا", "خروب", "عصير برتقال", "عصير مانجو", "عصير جوافة", "ليمون بالنعناع",
    "سموذي", "مياه غازية", "مياه معدنية", "لبن", "عصير فراولة", "كوكتيل",
    "قمر الدين", "آيس تي", "شاي أخضر", "قرفة باللبن",

    // pantry
    "ملح", "سكر", "فلفل أسود", "كمون", "قرفة", "حبهان",
    "زعفران", "كركم", "شطة", "خل", "زيت", "زيت زيتون",
    "سمنة", "زبدة", "دقيق", "نشا", "خميرة", "بيكنج باودر",
    "فانيليا", "عسل نحل", "مربى", "صلصة", "كاتشب", "مايونيز",
    "مستردة", "زيتون", "رز", "مكرونة", "عدس", "كريب",
    "برغل", "شوفان", "كورن فليكس", "بيض", "جبنة", "لبن رايب"
  ],
  "مهن": [
    "مهندس", "عامل بنزينة", "نجار", "مدرس", "طيار", "سباك", "محامي", "طباخ",
    "ميكانيكي", "كهربائي", "رائد فضاء", "ضابط شرطة", "صحفي", "ممثل", "مبرمج", "رسام",
    "صيدلي", "مصور", "مصلح موبايلات", "محاسب", "قاضي", "حلاق", "ممرض", "كاتب",
    "لاعب كرة", "جراح", "مذيع", "بياع فول", "مقاول", "ساعي البريد", "حارس أمن", "خباز",
    "كيميائي", "بحار", "بياع عرقسوس", "مدرب", "عربجي", "نحات", "راعي بقر", "سكرتير",
    "حطاب", "سمسار", "محقق", "غواص", "منقذ", "بائع", "حداد", "مرشد سياحي",
    "عامل بناء", "سواق", "كوافير", "بواب", "دليفري", "موظف بنك", "سايس", "بائع خضار",
    "جزار", "بائع لب", "عامل نظافة", "مأذون", "مدرس خصوصي", "مؤلف", "صياد", "مصلح أحذية",
    "طباخ أفراح", "مغني", "كاوتشجي", "مندوب مبيعات", "موظف حكومة",

    // jobs
    "دكتور", "دكتور أسنان", "مهندس معماري", "أستاذ جامعة", "ناظر مدرسة", "مكوجي",
    "عسكري", "مضيفة طيران", "قبطان", "فلاح", "راعي غنم", "نقاش",
    "بناء", "سواق تاكسي", "سواق أتوبيس", "شيف", "جرسون", "بياع جرايد",
    "بقال", "مسحراتي", "ترزي", "جنايني", "كمساري", "مخرج",
    "ملحن", "موسيقار", "شاعر", "مترجم", "كاشير", "بياع",
    "تاجر", "عالم", "مخترع", "عالم آثار", "رجل مطافي", "بياع فريسكا",
    "بيطري", "مطرب", "حكم", "معلق رياضي", "بهلوان", "ساحر",
    "مهرج", "عارض أزياء", "مصمم أزياء", "مصمم جرافيك", "يوتيوبر", "طيار حربي",
    "ظابط جيش", "دبلوماسي", "سفير", "وزير", "عمدة", "إمام مسجد",
    "مؤذن", "قسيس", "شيخ", "أخصائي علاج طبيعي", "طبيب نفسي", "دكتور عيون",
    "دكتور أطفال", "صانع حلويات", "ساعاتي", "صائغ", "سمكري", "منجد"
  ],
  "أماكن": [
    "مدرسة", "مستشفى", "نادي", "سينما", "سوق", "مطار", "حديقة", "مطعم",
    "فندق", "بنك", "متحف", "ملاهي", "محطة قطار", "شاطئ البحر", "جيم", "مكتبة",
    "غواصة", "محطة فضاء", "سيرك", "جزيرة", "قصر", "مزرعة", "صيدلية", "سوبر ماركت",
    "كافيه", "جامعة", "مسجد", "ميناء", "محكمة", "مستودع", "نفق", "عيادة",
    "برج", "كهف", "بلكونة", "سجن", "حديقة حيوان", "قهوة بلدي", "مسرح", "غابة",
    "كشك", "قرية", "بئر", "منارة", "قلعة", "شلال", "مصنع", "مخبز",
    "الشهر العقاري", "مكتب محاماة", "كوبري", "ورشة", "كنيسة", "بنزينة", "فيلا", "قسم شرطة",
    "معمل تحاليل", "مدرسة لغات", "محل موبايلات", "جراج", "استوديو", "حمام سباحة", "قاعة أفراح", "دار أوبرا",
    "محطة مترو", "مطعم سمك", "استاد", "معرض عربيات", "مطبخ", "محل عطارة",

    // places
    "بيت", "عمارة", "شقة", "كوخ", "خيمة", "مخيم",
    "مدينة", "عاصمة", "شارع", "حارة", "ميدان", "رصيف",
    "إشارة مرور", "موقف أتوبيس", "محل حلويات", "مكتب سفريات", "موقف عربيات", "حضانة",
    "معمل", "مكتب بريد", "سفارة", "وزارة", "مجلس الشعب", "بلدية",
    "مطافي", "معبد", "مقابر", "بقالة", "مول", "محل هدوم",
    "محل جزم", "مكتبة أدوات", "فرن بلدي", "جزارة", "فكهاني", "خضري",
    "محل عصير", "مطعم فول وطعمية", "محل كشري", "شاليه", "منتجع", "محل ورد",
    "ملعب", "صالة بولينج", "فطاطري", "معرض", "أكوا بارك", "سنترال",
    "غيط", "حظيرة", "إسطبل", "مخزن", "شركة", "ناطحة سحاب",
    "مركز شباب", "سد", "طاحونة", "نافورة", "هرم",
    "مسلة", "معبد فرعوني", "صحراء", "واحة", "جبل", "نهر",
    "بحيرة", "وادي", "صالون حلاقة", "مغسلة", "كوافير حريمي", "محل إلكترونيات",
    "محل ألعاب", "سايبر", "مغسلة عربيات", "صالة", "أوضة نوم", "حمام",
    "سطح", "بدروم", "جنينة البيت", "أوضة أطفال", "أوضة مكتب"
  ],
  "أشياء": [
    "قلم", "تليفون", "مفتاح", "نظارة", "ساعة", "مجلة", "كتاب", "لابتوب",
    "شاحن", "محفظة", "كاميرا", "ثلاجة", "غسالة", "ميكروفون", "شمسية", "تلسكوب",
    "جواز سفر", "فرشاة أسنان", "تليفزيون", "مكواة", "طاولة زهر", "كوتشينة", "زجاجة ماء", "ريموت",
    "مروحة", "جورنال", "إبريق شاي", "سماعة", "طائرة ورقية", "دمية", "مرآة", "كشكول",
    "صابون", "مكنسة", "شمعة", "خريطة", "كرة أرضية", "ألوان", "إبرة", "ميدالية",
    "كرة قدم", "شطرنج", "بالون", "سبورة", "ميزان", "مقص", "جرس", "ستارة",
    "غلاية", "خوذة", "مفك", "بنطلون", "مخدة", "سجادة", "فوطة", "كبريت",
    "ولاعة", "شوكة", "معلقة", "طبق", "حلة", "بوتاجاز", "كليم", "شماعة",
    "اباجورة", "راديو", "براية", "استيكة", "مقلمة", "منبه",

    // household
    "باب", "شباك", "قفل", "جرس الباب", "سلم", "أسانسير",
    "كنبة", "كرسي", "فوتيه", "ترابيزة", "ترابيزة سفرة", "سرير",
    "مرتبة", "بطانية", "ملاية", "دولاب", "كومودينو", "تسريحة",
    "بطاقة شخصية", "رف", "نجفة", "لمبة", "مكيف", "دفاية",
    "سخان", "فانوس رمضان", "فريزر", "فرن", "ميكروويف", "غسالة أطباق",
    "مكنسة كهربا", "جاروف", "ممسحة", "جردل", "منشر غسيل", "مشبك غسيل",
    "سلة غسيل", "طاسة", "كسرولة", "صينية", "صحن", "كوباية",
    "فنجان", "مج", "ترمومتر", "براد شاي", "كنكة", "ترمس",
    "سكينة", "مغرفة", "مصفاة", "مبشرة", "فتاحة", "خلاط",
    "عصارة", "توستر", "هون", "لوح تقطيع", "نشابة", "منخل",
    "ميزان مطبخ", "كارت شحن", "شامبو", "معجون سنان", "ترنج", "مشط",
    "فرشة شعر", "مجفف شعر", "مقص أظافر", "ماكينة حلاقة", "بانيو", "دش",
    "حوض", "حنفية", "سيفون", "شطاف", "منشفة", "برنس",
    "مناديل", "ليفة", "ساعة حائط", "برواز", "لوحة", "فازة",
    "أصيص زرع", "شمعدان", "رسيفر", "دش ستالايت", "فيشة", "مشترك كهربا",
    "سلك", "بطارية", "كشاف", "شنطة", "سلسلة مفاتيح", "صندوق",
    "كرتونة", "كيس بلاستيك", "برطمان", "قزازة", "علبة", "مخدة كنبة",
    "سجادة صلاة", "مصحف", "سبحة", "مبخرة", "زرع صناعي", "حصالة",
    "ألبوم صور", "لعبة أطفال", "عربية أطفال",

    // tools
    "شاكوش", "مسمار", "مسمار قلاووظ", "منشار", "كماشة", "زرادية",
    "مفتاح إنجليزي", "شنيور", "متر", "ميزان مية", "مبرد", "إزميل",
    "فأس", "كوريك", "مقص شجر", "خرطوم", "مرشة", "عربية يد",
    "سلم خشب", "فرشة دهان", "رول دهان", "جردل بوية", "شريط لاصق", "غرا",
    "صنفرة", "كاوية لحام", "مسدس شمع", "منشار كهربا", "كورة شراب", "صامولة",
    "مفرش سفرة", "عدة", "شنطة عدة", "جوانتي شغل", "نظارة لحام", "مقص صاج",
    "منجل",

    // clothes
    "قميص", "تيشيرت", "جينز", "شورت", "جلابية", "عباية",
    "فستان", "جيبة", "بلوزة", "بلوفر", "جاكيت", "بالطو",
    "جاكت جلد", "بدلة", "صديري", "كرافتة", "بابيون", "بيجامة",
    "روب", "مايوه", "شراب", "كولون", "جزمة", "كوتشي",
    "شبشب", "صندل", "بوت", "كعب عالي", "طاقية", "كاب",
    "برنيطة", "طرحة", "إيشارب", "كوفية", "جوانتي", "حزام",
    "نظارة شمس", "خاتم", "دبلة", "سلسلة", "حلق", "أسورة",
    "خلخال", "تاج", "بروش", "زرار", "سوستة", "شنطة يد",
    "شنطة ضهر", "منديل", "مريلة", "يونيفورم", "زي مدرسة", "عمة",
    "طربوش", "حصيرة",

    // school
    "قلم رصاص", "قلم جاف", "قلم ألوان", "مسطرة", "كراسة", "شنطة مدرسة",
    "طباشير", "ماركر", "دباسة", "خرامة", "مشبك ورق", "ورق",
    "ظرف", "طابع", "آلة حاسبة", "برجل", "منقلة", "مثلث هندسة",
    "قاموس", "أطلس", "دفتر", "مكتب", "كرسي مكتب", "درج",
    "ملف", "حافظة ورق", "ختم", "لوحة إعلانات", "جرس المدرسة", "زمزمية",
    "ساندوتش المدرسة",

    // tech
    "موبايل", "تابلت", "كمبيوتر", "شاشة", "كيبورد", "ماوس",
    "طابعة", "دومينو", "سماعة بلوتوث", "باور بانك", "كابل", "فلاشة",
    "هارد", "راوتر", "كاميرا مراقبة", "ساعة ذكية", "نظارة واقع افتراضي", "بلايستيشن",
    "ذراع تحكم", "سماعة مكالمات", "بروجكتور", "سبيكر", "درون", "روبوت مكنسة",
    "شريط كاسيت", "ماكينة صراف"
  ],
  "ماركات ( براندات )": [
    "Apple", "Samsung", "McDonald's", "Nike", "Mercedes", "Google", "Pepsi", "Coca-Cola",
    "Zara", "Adidas", "BMW", "Toyota", "Sony", "Amazon", "Netflix", "Starbucks",
    "IKEA", "Facebook", "Disney", "Porsche", "Vodafone", "اتصالات", "وي (WE)", "Orange",
    "Toshiba", "فريش", "Nissan", "شيبسي", "تايجر", "Galaxy", "شاي العروسة", "قطونيل",
    "Dettol", "Tesla", "Chanel", "Rolex", "Molto", "Nivea", "LG", "تورنيدو",
    "Panasonic", "Oppo", "Huawei", "Lipton", "Carrefour", "Kia", "Nikon", "Dell",
    "Visa", "Dunkin'", "أولكس", "فوري", "جوميا", "عبور لاند", "جهينة", "كريازي",
    "يونيفرسال", "Uber", "Pringles", "Vanish", "Persil", "Ariel", "Lux", "Pantene",
    "Nokia", "Realme", "Nescafe"
  ],
  "شخصيات مشهورة": [
    "محمد صلاح", "عادل إمام", "عمرو دياب", "أم كلثوم", "نجيب محفوظ", "أحمد زويل", "مجدي يعقوب", "تامر حسني",
    "محمد رمضان", "سمير غانم", "محمد منير", "إسماعيل ياسين", "سعاد حسني", "شريهان", "إسعاد يونس", "رامز جلال",
    "هنيدي", "أشرف عبد الباقي", "حمو بيكا", "ويجز", "توت عنخ آمون", "كليوباترا", "السادات", "جمال عبد الناصر",
    "بوجي وطمطم", "بكار", "فطوطة", "ميكي ماوس", "سبونج بوب", "سوبر مان", "باتمان", "فاندام",
    "ليونيل ميسي", "كريستيانو رونالدو", "أبو تريكة", "شيكابالا", "أفشة", "الخطيب", "محمد صبحي", "مدحت شلبي"
  ],

  "مواصلات": [
    // vehicles
    "عربية", "تاكسي", "أتوبيس", "ميكروباص", "توك توك", "موتوسيكل",
    "عجلة", "سكوتر", "قطر", "مترو", "ترام", "طيارة",
    "هليكوبتر", "صاروخ", "فلوكة", "سفينة", "يخت", "لانش",
    "منطاد", "عربية إسعاف", "عربية مطافي", "عربية شرطة", "جرار", "ونش",
    "لودر", "تريلا", "نقل", "ربع نقل", "حنطور", "عربية كارو",
    "سكيت بورد", "زلاجة", "جيت سكي", "عبارة", "تلفريك", "قطر سريع",
    "عربية سباق", "جيب"
  ],
  "رياضات": [
    // sports
    "كورة قدم", "كورة سلة", "كورة طايرة", "كورة يد", "تنس", "تنس طاولة",
    "إسكواش", "بادل", "جولف", "هوكي", "سباحة", "غطس",
    "كرة ماء", "تجديف", "تزلج على الماء", "ركوب الأمواج", "إبحار", "جري",
    "ماراثون", "قفز عالي", "قفز طويل", "قفز بالزانة", "رمي الرمح", "رمي الجلة",
    "رفع أثقال", "كمال أجسام", "جمباز", "ملاكمة", "مصارعة", "كاراتيه",
    "جودو", "تايكوندو", "كونغ فو", "مبارزة", "رماية", "رماية بالقوس",
    "فروسية", "سباق خيل", "ركوب دراجات", "سباق عربيات", "تزلج على الجليد", "تزلج على الثلج",
    "تسلق جبال", "يوجا", "أيروبكس", "زومبا", "بولينج", "بلياردو",
    "رقص باليه", "كريكيت", "بيسبول", "رجبي", "كرة قدم أمريكية", "سباق حواجز",
    "مشي سريع", "ترايثلون", "باركور", "نط الحبل"
  ],
  "دول ومدن": [
    // countries
    "مصر", "السعودية", "الإمارات", "الكويت", "البحرين", "عمان",
    "اليمن", "الأردن", "فلسطين", "لبنان", "سوريا", "العراق",
    "ليبيا", "تونس", "الجزائر", "المغرب", "السودان", "موريتانيا",
    "الصومال", "جيبوتي", "جزر القمر", "تركيا", "إيران", "باكستان",
    "الهند", "الصين", "اليابان", "كوريا الجنوبية", "إندونيسيا", "ماليزيا",
    "تايلاند", "الفلبين", "فيتنام", "روسيا", "ألمانيا", "فرنسا",
    "إيطاليا", "إسبانيا", "البرتغال", "إنجلترا", "اليونان", "هولندا",
    "بلجيكا", "سويسرا", "السويد", "النرويج", "الدنمارك", "فنلندا",
    "بولندا", "أوكرانيا", "أمريكا", "كندا", "المكسيك", "البرازيل",
    "الأرجنتين", "تشيلي", "كولومبيا", "بيرو", "كوبا", "أستراليا",
    "نيوزيلندا", "جنوب أفريقيا", "نيجيريا", "كينيا", "إثيوبيا", "غانا",
    "السنغال", "الكاميرون", "كوت ديفوار", "أيرلندا", "اسكتلندا", "النمسا",
    "المجر", "التشيك", "كرواتيا", "صربيا", "رومانيا", "بلغاريا",
    "أيسلندا",

    // cities
    "القاهرة", "الإسكندرية", "الجيزة", "أسوان", "الأقصر", "بورسعيد",
    "السويس", "الإسماعيلية", "المنصورة", "طنطا", "الزقازيق", "دمياط",
    "الفيوم", "المنيا", "أسيوط", "سوهاج", "قنا", "الغردقة",
    "شرم الشيخ", "دهب", "مرسى مطروح", "سيوة", "الرياض", "جدة",
    "مكة", "المدينة المنورة", "دبي", "أبوظبي", "الدوحة", "مسقط",
    "بيروت", "بغداد", "دمشق", "القدس", "تونس العاصمة", "الرباط",
    "الدار البيضاء", "مراكش", "الخرطوم", "لندن", "باريس", "روما",
    "مدريد", "برشلونة", "ميلانو", "برلين", "ميونخ", "أمستردام",
    "إسطنبول", "موسكو", "أثينا", "فيينا", "جنيف", "نيويورك",
    "لوس أنجلوس", "واشنطن", "شيكاغو", "تورونتو", "ريو دي جانيرو", "بوينس آيرس",
    "طوكيو", "بكين", "شنغهاي", "سيول", "بانكوك", "سنغافورة",
    "مومباي", "سيدني", "كيب تاون"
  ],
  "آلات موسيقية": [
    // instruments
    "عود", "قانون", "ناي", "كمان", "تشيلو", "كونترباص",
    "جيتار", "جيتار كهربا", "بيانو", "أورج", "طبلة", "دف",
    "رق", "درامز", "سمسمية", "صفارة", "ساكسفون", "كلارينيت",
    "فلوت", "ترومبون", "مندولين", "أكورديون", "هارمونيكا", "مزمار",
    "ربابة", "بزق", "صاجات", "مثلث موسيقى", "بوق"
  ]
};

/* ============================================================================
   المختلف — the close pairs.
   The odd one out gets the second word. A pair has to be close enough that a
   clue for one could pass for the other ("سخن", "بشربه الصبح"), and far enough
   that the table can hear the difference once people start talking. Egyptian
   first: the pairs are things a family names every day.
   ========================================================================= */
const SPY_PAIRS = [
  ['قهوة', 'نسكافيه'], ['شاي', 'ينسون'], ['كشري', 'مكرونة'], ['فول', 'طعمية'],
  ['ملوخية', 'بامية'], ['كنافة', 'بسبوسة'], ['محشي', 'ورق عنب'], ['فطير', 'بيتزا'],
  ['عصير مانجو', 'عصير جوافة'], ['آيس كريم', 'مهلبية'], ['شاورما', 'برجر'],
  ['سينما', 'مسرح'], ['تلفزيون', 'راديو'], ['كمبيوتر', 'لابتوب'], ['تابلت', 'موبايل'],
  ['فيسبوك', 'إنستجرام'], ['واتساب', 'ماسنجر'], ['يوتيوب', 'تيك توك'],
  ['بحر', 'نهر'], ['إسكندرية', 'الغردقة'], ['القاهرة', 'الجيزة'], ['الأقصر', 'أسوان'],
  ['أتوبيس', 'ميكروباص'], ['مترو', 'قطر'], ['تاكسي', 'أوبر'], ['عجلة', 'موتوسيكل'],
  ['طيارة', 'هليكوبتر'], ['مركب', 'لانش'],
  ['دكتور', 'صيدلي'], ['مدرس', 'ناظر'], ['شرطي', 'عسكري'], ['محامي', 'قاضي'],
  ['صحفي', 'مذيع'], ['ممثل', 'مخرج'], ['مطرب', 'ملحن'], ['رسام', 'نحات'],
  ['سباك', 'كهربائي'], ['نجار', 'حداد'], ['حلاق', 'كوافير'], ['ترزي', 'مكوجي'],
  ['بواب', 'حارس أمن'], ['سواق', 'كمساري'],
  ['كورة قدم', 'كورة سلة'], ['الأهلي', 'الزمالك'], ['ملعب', 'جيم'], ['حكم', 'مدرب'],
  ['مدرسة', 'جامعة'], ['امتحان', 'واجب'], ['كتاب', 'مجلة'], ['قلم رصاص', 'قلم جاف'],
  ['تكييف', 'مروحة'], ['ثلاجة', 'فريزر'], ['غسالة', 'نشافة'], ['كنبة', 'كرسي'],
  ['سرير', 'مرتبة'], ['شباك', 'بلكونة'], ['عمارة', 'فيلا'], ['مطبخ', 'حمام'],
  ['عيد الفطر', 'عيد الأضحى'], ['فرح', 'خطوبة'], ['سبوع', 'عيد ميلاد'], ['عزومة', 'بوفيه'],
  ['شنطة', 'محفظة'], ['ساعة', 'أسورة'], ['نضارة شمس', 'نضارة طبية'], ['جزمة', 'شبشب'],
  ['تيشيرت', 'قميص'], ['بنطلون', 'شورت'],
  ['صيدلية', 'مستشفى'], ['بنك', 'مكتب بريد'], ['سوبر ماركت', 'بقالة'], ['مول', 'سوق'],
  ['كافيه', 'مطعم'], ['فرن', 'محل حلويات']
];


/* ============================================================================
   The same game in English (the owner, 26 Sep 2026): a table playing with
   «لغة الألعاب» in English used to be dealt the Arabic words. The same
   categories and the same idea, in words an English-speaking family knows,
   Egypt's own places and people among them. The page deals from these when
   contentLang() is 'en' (spyCategories() in JS_Core.html), and the rooms
   server finds a category in either list (spyWords in RoomGames.js), so the
   Arabic game is exactly as it was. Checked by tools/validate-content.js.
   ========================================================================= */
const SPY_WORDS_EN = {
  "Animals": [
    "Lion", "Elephant", "Giraffe", "Cat", "Dog", "Falcon", "Whale", "Dolphin",
    "Horse", "Tiger", "Monkey", "Crocodile", "Penguin", "Snake", "Bat", "Peacock",
    "Tortoise", "Kangaroo", "Eagle", "Gazelle", "Bear", "Rabbit", "Wolf", "Cow",
    "Ostrich", "Rhino", "Hippo", "Panda", "Squirrel", "Fox", "Fly", "Cockroach",
    "Butterfly", "Scorpion", "Camel", "Sheep", "Goat", "Gorilla", "Ant", "Owl",
    "Cheetah", "Koala", "Puppy", "Pigeon", "Hoopoe", "Worm", "Duck", "Goose",
    "Chick", "Sparrow", "Crow", "Mosquito", "Gecko", "Rooster", "Turkey", "Calf",
    "Dove", "Lizard", "Bee", "Catfish",

    // mammals
    "Hyena", "Polar Bear", "Zebra", "Deer", "Reindeer", "Mountain Goat",
    "Buffalo", "Bull", "Donkey", "Mule", "Pony", "Lamb",
    "Mouse", "Rat", "Hamster", "Hedgehog", "Chimpanzee", "Orangutan",
    "Baboon", "Mongoose", "Weasel", "Raccoon", "Beaver", "Anteater",
    "Sloth", "Llama", "Alpaca", "Police Dog", "Wild Boar", "Seal",
    "Sea Lion", "Walrus", "Otter", "Mole", "Badger", "Skunk",
    "Armadillo", "Porcupine", "Bison", "Moose", "Jaguar", "Leopard",
    "Black Panther", "Lynx", "Meerkat", "Warthog", "Kitten", "Foal",
    "Piglet", "Pig", "Ferret", "Guinea Pig", "Chipmunk", "Hare",
    "Husky", "Poodle", "Bulldog", "Dalmatian", "Persian Cat", "Arabian Horse",
    "Racehorse", "Platypus", "Wombat", "Lemur", "Yak", "Snow Leopard",
    "Red Panda", "Blue Whale", "Humpback Whale", "Killer Whale", "Antelope", "Gerbil",

    // birds
    "Parrot", "Flamingo", "Swan", "Pelican", "Stork", "Heron",
    "Seagull", "Vulture", "Hawk", "Kingfisher", "Woodpecker", "Canary",
    "Hummingbird", "Toucan", "Kiwi", "Quail", "Hen", "Robin",
    "Emu", "Budgie", "Nightingale", "Magpie", "Ibis", "Swallow",

    // sea
    "Shark", "Octopus", "Squid", "Jellyfish", "Starfish", "Crab",
    "Lobster", "Shrimp", "Oyster", "Seahorse", "Clownfish", "Tuna",
    "Salmon", "Sardine", "Eel", "Stingray", "Sea Turtle", "Goldfish",
    "Swordfish", "Pufferfish", "Sea Urchin", "Mussel", "Tilapia", "Coral",

    // reptiles, amphibians and bugs
    "Frog", "Toad", "Chameleon", "Iguana", "Cobra", "Python",
    "Viper", "Alligator", "Komodo Dragon", "Tadpole", "Spider", "Tarantula",
    "Ladybird", "Beetle", "Grasshopper", "Cricket", "Dragonfly", "Moth",
    "Wasp", "Hornet", "Termite", "Firefly", "Snail", "Caterpillar",
    "Centipede", "Flea", "Praying Mantis", "Silkworm", "Scarab", "Earthworm"
  ],
  "Food": [
    "Koshari", "Ful Medames", "Falafel", "Molokhia", "Stuffed Vine Leaves", "Stuffed Peppers", "Fattah", "Mahshi",
    "Shawarma", "Kofta", "Kebab", "Grilled Chicken", "Roast Chicken", "Fried Chicken", "Chicken Nuggets", "Chicken Wings",
    "Fish and Chips", "Grilled Fish", "Fried Fish", "Shrimp", "Calamari", "Sushi", "Tuna Sandwich", "Sardines",
    "Pizza", "Burger", "Cheeseburger", "Hot Dog", "Sandwich", "Club Sandwich", "Toast", "Wrap",
    "Spaghetti", "Lasagne", "Macaroni and Cheese", "Bechamel Pasta", "Ravioli", "Noodles", "Fried Rice", "White Rice",
    "Rice Pudding", "Biryani", "Paella", "Risotto", "Couscous", "Tacos", "Burrito", "Nachos",
    "Omelette", "Fried Egg", "Boiled Egg", "Scrambled Eggs", "Pancakes", "Waffles", "Cereal", "Porridge",
    "Croissant", "Muffin", "Bagel", "Doughnut", "Cupcake", "Brownie", "Cookie", "Cheesecake",
    "Chocolate Cake", "Birthday Cake", "Carrot Cake", "Apple Pie", "Ice Cream", "Frozen Yoghurt", "Jelly", "Custard",
    "Basbousa", "Konafa", "Baklava", "Om Ali", "Qatayef", "Luqaimat", "Kahk", "Ghorayeba",
    "Halawa", "Feteer", "Hawawshi", "Liver Sandwich", "Sausages", "Meatballs", "Steak", "Roast Beef",
    "Lamb Chops", "Mixed Grill", "Stew", "Lentil Soup", "Tomato Soup", "Chicken Soup", "Mushroom Soup", "Vegetable Soup",
    "Greek Salad", "Caesar Salad", "Fruit Salad", "Tabbouleh", "Fattoush", "Coleslaw", "Hummus", "Baba Ghanoush",
    "Tahini", "Pickles", "Olives", "Cheese", "Cheddar", "Mozzarella", "Feta", "Cream Cheese",
    "Butter", "Yoghurt", "Milk", "Honey", "Jam", "Peanut Butter", "Nutella", "Molasses",
    "Bread", "Pitta Bread", "Baguette", "Crackers", "Breadsticks", "Rusks", "Popcorn", "Crisps",
    "Chips", "Mashed Potatoes", "Baked Potato", "Potato Wedges", "Onion Rings", "Corn on the Cob", "Roasted Sweet Potato", "Peanuts",
    "Apple", "Banana", "Orange", "Mango", "Strawberry", "Grapes", "Watermelon", "Melon",
    "Pineapple", "Peach", "Apricot", "Plum", "Cherry", "Pear", "Kiwi Fruit", "Pomegranate",
    "Guava", "Fig", "Dates", "Lemon", "Lime", "Coconut", "Blueberries", "Raspberries",
    "Tomato", "Cucumber", "Carrot", "Potato", "Onion", "Garlic", "Pepper", "Lettuce",
    "Cabbage", "Cauliflower", "Broccoli", "Spinach", "Aubergine", "Courgette", "Peas", "Green Beans",
    "Okra", "Mushroom", "Sweetcorn", "Pumpkin", "Beetroot", "Celery", "Radish", "Avocado",
    "Almonds", "Cashews", "Pistachios", "Walnuts", "Hazelnuts", "Raisins", "Sunflower Seeds", "Chestnuts",
    "Chocolate Bar", "Lollipop", "Candy Floss", "Marshmallow", "Chewing Gum", "Toffee", "Gummy Bears", "Jelly Beans",
    "Tea", "Coffee", "Hot Chocolate", "Milkshake", "Smoothie", "Lemonade", "Orange Juice", "Mango Juice",
    "Sugarcane Juice", "Hibiscus Drink", "Tamarind Drink", "Sahlab", "Mint Tea", "Iced Coffee", "Cappuccino", "Sparkling Water",
    "Ketchup", "Mayonnaise", "Mustard", "Barbecue Sauce", "Hot Sauce", "Garlic Sauce", "Salt", "Black Pepper",
    "Cumin", "Cinnamon", "Paprika", "Vinegar", "Olive Oil", "Sugar", "Flour", "Rice",
    "Lentils", "Chickpeas", "Beans", "Oats", "Corn Flakes", "Granola", "Protein Bar", "Iced Tea",
    "Spring Rolls", "Dumplings", "Samosa", "Sambousek", "Kibbeh", "Manakish", "Cheese Pie", "Meat Pie",
    "Quiche", "Fish Fingers", "Chicken Burger", "Veggie Burger", "Chicken Shawarma", "Beef Burger", "Pepperoni Pizza", "Margherita Pizza"
  ],
  "Jobs": [
    "Engineer", "Petrol Station Attendant", "Carpenter", "Teacher", "Pilot", "Plumber", "Lawyer", "Cook",
    "Mechanic", "Electrician", "Astronaut", "Police Officer", "Journalist", "Actor", "Programmer", "Painter",
    "Pharmacist", "Photographer", "Phone Repairer", "Accountant", "Judge", "Barber", "Nurse", "Writer",
    "Footballer", "Surgeon", "TV Presenter", "Builder", "Postman", "Security Guard", "Baker", "Chemist",
    "Sailor", "Coach", "Sculptor", "Cowboy", "Secretary", "Lumberjack", "Estate Agent", "Detective",
    "Diver", "Lifeguard", "Shop Assistant", "Blacksmith", "Tour Guide", "Driver", "Hairdresser", "Doorman",
    "Delivery Driver", "Bank Clerk", "Parking Attendant", "Greengrocer", "Butcher", "Cleaner", "Private Tutor", "Author",
    "Fisherman", "Shoemaker", "Singer", "Tyre Fitter", "Salesperson", "Civil Servant", "Doctor", "Dentist",
    "Architect", "Professor", "Headteacher", "Soldier", "Flight Attendant", "Ship Captain", "Farmer", "Shepherd",
    "Decorator", "Taxi Driver", "Bus Driver", "Chef", "Waiter", "Newsagent", "Grocer", "Tailor",
    "Gardener", "Ticket Inspector", "Film Director", "Composer", "Musician", "Poet", "Translator", "Cashier",
    "Merchant", "Scientist", "Inventor", "Archaeologist", "Firefighter", "Vet", "Referee", "Sports Commentator",
    "Acrobat", "Magician", "Clown", "Model", "Fashion Designer", "Graphic Designer", "YouTuber", "Fighter Pilot",
    "Army Officer", "Diplomat", "Ambassador", "Minister", "Mayor", "Imam", "Priest", "Physiotherapist",
    "Psychologist", "Eye Doctor", "Children's Doctor", "Pastry Chef", "Watchmaker", "Jeweller", "Upholsterer", "Librarian",
    "Receptionist", "Paramedic", "Zookeeper", "Florist", "Window Cleaner", "Bin Collector", "Train Driver", "Air Traffic Controller",
    "Weather Forecaster", "News Reader", "Radio Presenter", "Cameraman", "Makeup Artist", "Dance Teacher", "Swimming Coach", "Personal Trainer",
    "Optician", "Midwife", "Social Worker", "Banker", "Economist", "Politician", "Interior Designer"
  ],
  "Places": [
    "School", "Hospital", "Sports Club", "Cinema", "Market", "Airport", "Park", "Restaurant",
    "Hotel", "Bank", "Museum", "Theme Park", "Train Station", "Beach", "Gym", "Library",
    "Submarine", "Space Station", "Circus", "Island", "Palace", "Farm", "Pharmacy", "Supermarket",
    "Café", "University", "Mosque", "Port", "Courtroom", "Warehouse", "Tunnel", "Clinic",
    "Tower", "Cave", "Balcony", "Prison", "Zoo", "Coffee Shop", "Theatre", "Forest",
    "Kiosk", "Village", "Well", "Lighthouse", "Castle", "Waterfall", "Factory", "Bakery",
    "Post Office", "Law Office", "Bridge", "Workshop", "Church", "Petrol Station", "Villa", "Police Station",
    "Laboratory", "Language School", "Phone Shop", "Garage", "Studio", "Swimming Pool", "Wedding Hall", "Opera House",
    "Metro Station", "Fish Restaurant", "Stadium", "Car Showroom", "Kitchen", "Spice Shop", "House", "Block of Flats",
    "Flat", "Hut", "Tent", "Campsite", "City", "Capital City", "Street", "Alley",
    "Square", "Pavement", "Traffic Lights", "Bus Stop", "Sweet Shop", "Travel Agency", "Car Park", "Nursery",
    "Embassy", "Ministry", "Parliament", "Town Hall", "Fire Station", "Temple", "Cemetery", "Corner Shop",
    "Shopping Mall", "Clothes Shop", "Shoe Shop", "Bookshop", "Butcher's", "Fruit Shop", "Juice Bar", "Koshari Shop",
    "Chalet", "Resort", "Flower Shop", "Football Pitch", "Bowling Alley", "Exhibition", "Water Park", "Barn",
    "Stable", "Storeroom", "Office", "Skyscraper", "Youth Centre", "Dam", "Windmill", "Fountain",
    "Pyramid", "Obelisk", "Desert", "Oasis", "Mountain", "River", "Lake", "Valley",
    "Barber's Shop", "Laundrette", "Beauty Salon", "Electronics Shop", "Toy Shop", "Car Wash", "Living Room", "Bedroom",
    "Bathroom", "Roof", "Basement", "Garden", "Children's Room", "Study", "Playground", "Aquarium",
    "Planetarium", "Ice Rink", "Car Factory", "Harbour", "Vet's Surgery", "Dentist's Surgery", "Hairdresser's", "Cable Car"
  ],
  "Things": [
    "Phone", "Laptop", "Tablet", "Headphones", "Television", "Camera", "Remote Control", "Charger",
    "Watch", "Glasses", "Sunglasses", "Wallet", "Handbag", "Backpack", "Suitcase", "Umbrella",
    "Key", "Padlock", "Door", "Window", "Curtain", "Carpet", "Pillow", "Blanket",
    "Bed", "Sofa", "Chair", "Table", "Desk", "Wardrobe", "Mirror", "Lamp",
    "Light Bulb", "Candle", "Torch", "Clock", "Alarm Clock", "Calendar", "Picture Frame", "Vase",
    "Fridge", "Freezer", "Cooker", "Oven", "Microwave", "Kettle", "Toaster", "Blender",
    "Washing Machine", "Dishwasher", "Iron", "Vacuum Cleaner", "Air Conditioner", "Fan", "Heater", "Hair Dryer",
    "Plate", "Bowl", "Cup", "Mug", "Glass", "Spoon", "Fork", "Knife",
    "Frying Pan", "Saucepan", "Tray", "Chopping Board", "Tin Opener", "Grater", "Sieve", "Rolling Pin",
    "Teapot", "Coffee Pot", "Water Bottle", "Lunchbox", "Thermos", "Jug", "Straw", "Napkin",
    "Soap", "Shampoo", "Toothbrush", "Toothpaste", "Towel", "Comb", "Hairbrush", "Razor",
    "Sponge", "Bucket", "Mop", "Broom", "Dustpan", "Bin", "Plastic Bag", "Tissue Box",
    "Pen", "Pencil", "Rubber", "Ruler", "Sharpener", "Notebook", "Book", "Magazine",
    "Newspaper", "Envelope", "Stamp", "Scissors", "Glue", "Sticky Tape", "Stapler", "Paper Clip",
    "Calculator", "Compass", "Crayons", "Paintbrush", "Paint", "Chalk", "Whiteboard", "Globe",
    "Map", "Dictionary", "Diary", "Pencil Case", "School Bag", "Folder", "Highlighter", "Marker",
    "Hammer", "Screwdriver", "Saw", "Pliers", "Nail", "Screw", "Drill", "Spanner",
    "Tape Measure", "Ladder", "Rope", "Chain", "Hose", "Shovel", "Rake", "Wheelbarrow",
    "Ball", "Football", "Kite", "Doll", "Teddy Bear", "Toy Car", "Puzzle", "Rubik's Cube",
    "Balloon", "Skipping Rope", "Yo-yo", "Marbles", "Dice", "Playing Cards", "Chess Set", "Backgammon Board",
    "Shirt", "T-shirt", "Trousers", "Jeans", "Shorts", "Dress", "Skirt", "Jacket",
    "Coat", "Jumper", "Scarf", "Gloves", "Hat", "Cap", "Socks", "Shoes",
    "Trainers", "Sandals", "Slippers", "Boots", "Belt", "Tie", "Pyjamas", "Swimsuit",
    "Ring", "Necklace", "Bracelet", "Earrings", "Perfume", "Lipstick", "Nail Polish", "Hair Clip",
    "Guitar", "Drum", "Piano", "Microphone", "Speaker", "Radio", "Keyboard", "Mouse",
    "Printer", "Router", "Memory Stick", "Power Bank", "Games Console", "Joystick", "Smartwatch", "Projector",
    "Car", "Bicycle", "Tyre", "Steering Wheel", "Seat Belt", "Helmet", "Skateboard", "Scooter",
    "Tree", "Flower", "Plant Pot", "Watering Can", "Bench", "Swing", "Slide", "Sandpit",
    "Money", "Coin", "Credit Card", "Receipt", "Ticket", "Passport", "Gift", "Wrapping Paper",
    "Trophy", "Medal", "Whistle", "Stopwatch", "Binoculars", "Telescope", "Microscope", "Magnifying Glass",
    "Birthday Candle", "Party Hat", "Ramadan Lantern", "Prayer Mat", "Rosary Beads", "Flag", "Mailbox", "Doorbell",
    "Fire Extinguisher", "First Aid Kit", "Thermometer", "Plaster", "Syringe", "Stethoscope", "Wheelchair", "Crutches",
    "Tent Peg", "Sleeping Bag", "Fishing Rod", "Net", "Anchor", "Life Jacket", "Surfboard", "Sandcastle",
    "Snow Globe", "Hourglass", "Magnet", "Battery", "Plug", "Socket", "Extension Lead", "Light Switch",
    "Coat Hanger", "Clothes Peg", "Laundry Basket", "Ironing Board", "Sewing Machine", "Needle", "Thread", "Button",
    "Zip", "Safety Pin", "Shoelace", "Shoe Polish", "Doormat", "Coaster", "Tablecloth", "Placemat",
    "Salt Shaker", "Sugar Bowl", "Egg Cup", "Ice Cube Tray", "Cake Tin", "Baking Tray", "Oven Glove", "Apron",
    "Cushion", "Bookshelf", "Drawer", "Cupboard", "Staircase", "Lift", "Roof Tile", "Brick"
  ],
  "Brands": [
    "Apple", "Samsung", "McDonald's", "Nike", "Mercedes", "Google", "Pepsi", "Coca-Cola",
    "Zara", "Adidas", "BMW", "Toyota", "Sony", "Amazon", "Netflix", "Starbucks",
    "IKEA", "Facebook", "Disney", "Porsche", "Vodafone", "Orange", "Toshiba", "Nissan",
    "LEGO", "Tesla", "Rolex", "Nivea", "LG", "Panasonic", "Huawei", "Lipton",
    "Carrefour", "Kia", "Nikon", "Dell", "Visa", "Uber", "Pringles", "Persil",
    "Ariel", "Pantene", "Nokia", "Nescafé", "KFC", "Pizza Hut", "Burger King", "Domino's",
    "Kellogg's", "Heinz", "Colgate", "Gillette", "Puma", "H&M", "Canon", "HP",
    "Microsoft", "PlayStation", "Nintendo", "YouTube", "WhatsApp", "Instagram", "TikTok", "Ferrari",
    "Hyundai", "Cadbury", "KitKat", "Oreo"
  ],
  "Famous people": [
    "Mohamed Salah", "Lionel Messi", "Cristiano Ronaldo", "Pelé", "Diego Maradona", "Usain Bolt", "Muhammad Ali", "Roger Federer",
    "Albert Einstein", "Isaac Newton", "Marie Curie", "Thomas Edison", "Leonardo da Vinci", "William Shakespeare", "Mozart", "Beethoven",
    "Cleopatra", "Tutankhamun", "Ramses II", "Napoleon", "Julius Caesar", "Neil Armstrong", "Charlie Chaplin", "Mr Bean",
    "Walt Disney", "Michael Jackson", "Umm Kulthum", "Omar Sharif", "Naguib Mahfouz", "Ahmed Zewail", "Magdi Yacoub", "Adel Emam",
    "Amr Diab", "Mickey Mouse", "SpongeBob", "Superman", "Batman", "Sherlock Holmes", "Santa Claus", "Harry Potter"
  ],
  "Transport": [
    "Car", "Taxi", "Bus", "Minibus", "Tuk-tuk", "Motorbike", "Bicycle", "Scooter",
    "Train", "Metro", "Tram", "Aeroplane", "Helicopter", "Rocket", "Felucca", "Ship",
    "Yacht", "Speedboat", "Hot-air Balloon", "Ambulance", "Fire Engine", "Police Car", "Tractor", "Tow Truck",
    "Digger", "Lorry", "Van", "Pick-up Truck", "Horse and Carriage", "Donkey Cart", "Skateboard", "Sledge",
    "Jet Ski", "Ferry", "Cable Car", "Bullet Train", "Racing Car", "Jeep"
  ],
  "Sports": [
    "Football", "Basketball", "Volleyball", "Handball", "Tennis", "Table Tennis", "Squash", "Padel",
    "Golf", "Hockey", "Swimming", "Diving", "Water Polo", "Rowing", "Water Skiing", "Surfing",
    "Sailing", "Running", "Marathon", "High Jump", "Long Jump", "Pole Vault", "Javelin", "Shot Put",
    "Weightlifting", "Bodybuilding", "Gymnastics", "Boxing", "Wrestling", "Karate", "Judo", "Taekwondo",
    "Kung Fu", "Fencing", "Shooting", "Archery", "Show Jumping", "Horse Racing", "Cycling", "Motor Racing",
    "Ice Skating", "Skiing", "Mountain Climbing", "Yoga", "Aerobics", "Zumba", "Bowling", "Snooker",
    "Ballet", "Cricket", "Baseball", "Rugby", "American Football", "Hurdles", "Race Walking", "Triathlon",
    "Parkour", "Skipping"
  ],
  "Countries & cities": [
    "Egypt", "Saudi Arabia", "UAE", "Kuwait", "Bahrain", "Oman", "Yemen", "Jordan",
    "Palestine", "Lebanon", "Syria", "Iraq", "Libya", "Tunisia", "Algeria", "Morocco",
    "Sudan", "Mauritania", "Somalia", "Djibouti", "Comoros", "Turkey", "Iran", "Pakistan",
    "India", "China", "Japan", "South Korea", "Indonesia", "Malaysia", "Thailand", "Philippines",
    "Vietnam", "Russia", "Germany", "France", "Italy", "Spain", "Portugal", "England",
    "Greece", "Netherlands", "Belgium", "Switzerland", "Sweden", "Norway", "Denmark", "Finland",
    "Poland", "Ukraine", "USA", "Canada", "Mexico", "Brazil", "Argentina", "Chile",
    "Colombia", "Peru", "Cuba", "Australia", "New Zealand", "South Africa", "Nigeria", "Kenya",
    "Ethiopia", "Ghana", "Senegal", "Cameroon", "Ivory Coast", "Ireland", "Scotland", "Austria",
    "Hungary", "Czech Republic", "Croatia", "Serbia", "Romania", "Bulgaria", "Iceland", "Cairo",
    "Alexandria", "Giza", "Aswan", "Luxor", "Port Said", "Suez", "Ismailia", "Mansoura",
    "Tanta", "Zagazig", "Damietta", "Fayoum", "Minya", "Assiut", "Sohag", "Qena",
    "Hurghada", "Sharm El Sheikh", "Dahab", "Marsa Matrouh", "Siwa", "Riyadh", "Jeddah", "Mecca",
    "Medina", "Dubai", "Abu Dhabi", "Doha", "Muscat", "Beirut", "Baghdad", "Damascus",
    "Jerusalem", "Tunis", "Rabat", "Casablanca", "Marrakesh", "Khartoum", "London", "Paris",
    "Rome", "Madrid", "Barcelona", "Milan", "Berlin", "Munich", "Amsterdam", "Istanbul",
    "Moscow", "Athens", "Vienna", "Geneva", "New York", "Los Angeles", "Washington", "Chicago",
    "Toronto", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Shanghai", "Seoul", "Bangkok",
    "Singapore", "Mumbai", "Sydney", "Cape Town"
  ],
  "Musical instruments": [
    "Oud", "Qanun", "Ney Flute", "Violin", "Cello", "Double Bass", "Guitar", "Electric Guitar",
    "Piano", "Electric Organ", "Tabla", "Tambourine", "Riq", "Drum Kit", "Simsimiyya", "Whistle",
    "Saxophone", "Clarinet", "Flute", "Trombone", "Mandolin", "Accordion", "Harmonica", "Mizmar",
    "Rebab", "Banjo", "Finger Cymbals", "Triangle", "Trumpet"
  ]
};

/* المختلف in English: the same idea as SPY_PAIRS - close enough that a clue
   for one could pass for the other, far enough to be told apart once people
   start talking. */
const SPY_PAIRS_EN = [
  ['Coffee', 'Hot Chocolate'], ['Tea', 'Herbal Tea'], ['Koshari', 'Pasta'], ['Ful Medames', 'Falafel'],
  ['Molokhia', 'Okra'], ['Konafa', 'Basbousa'], ['Stuffed Peppers', 'Stuffed Vine Leaves'], ['Feteer', 'Pizza'],
  ['Mango Juice', 'Guava Juice'], ['Ice Cream', 'Rice Pudding'], ['Shawarma', 'Burger'],
  ['Cinema', 'Theatre'], ['Television', 'Radio'], ['Computer', 'Laptop'], ['Tablet', 'Phone'],
  ['Facebook', 'Instagram'], ['WhatsApp', 'Messenger'], ['YouTube', 'TikTok'],
  ['Sea', 'River'], ['Alexandria', 'Hurghada'], ['Cairo', 'Giza'], ['Luxor', 'Aswan'],
  ['Bus', 'Minibus'], ['Metro', 'Train'], ['Taxi', 'Uber'], ['Bicycle', 'Motorbike'],
  ['Aeroplane', 'Helicopter'], ['Boat', 'Speedboat'],
  ['Doctor', 'Pharmacist'], ['Teacher', 'Headteacher'], ['Police Officer', 'Soldier'], ['Lawyer', 'Judge'],
  ['Journalist', 'TV Presenter'], ['Actor', 'Film Director'], ['Singer', 'Composer'], ['Painter', 'Sculptor'],
  ['Plumber', 'Electrician'], ['Carpenter', 'Blacksmith'], ['Barber', 'Hairdresser'], ['Tailor', 'Dry Cleaner'],
  ['Doorman', 'Security Guard'], ['Driver', 'Ticket Inspector'],
  ['Football', 'Basketball'], ['Al Ahly', 'Zamalek'], ['Stadium', 'Gym'], ['Referee', 'Coach'],
  ['School', 'University'], ['Exam', 'Homework'], ['Book', 'Magazine'], ['Pencil', 'Pen'],
  ['Air Conditioner', 'Fan'], ['Fridge', 'Freezer'], ['Washing Machine', 'Tumble Dryer'], ['Sofa', 'Armchair'],
  ['Bed', 'Mattress'], ['Window', 'Balcony'], ['Block of Flats', 'Villa'], ['Kitchen', 'Bathroom'],
  ['Eid al-Fitr', 'Eid al-Adha'], ['Wedding', 'Engagement Party'], ['Sebou', 'Birthday Party'], ['Dinner Party', 'Buffet'],
  ['Handbag', 'Wallet'], ['Watch', 'Bracelet'], ['Sunglasses', 'Reading Glasses'], ['Shoes', 'Slippers'],
  ['T-shirt', 'Shirt'], ['Trousers', 'Shorts'],
  ['Pharmacy', 'Hospital'], ['Bank', 'Post Office'], ['Supermarket', 'Corner Shop'], ['Shopping Mall', 'Market'],
  ['Café', 'Restaurant'], ['Bakery', 'Sweet Shop']
];
