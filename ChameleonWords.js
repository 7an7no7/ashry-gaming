/* ============================================================================
   الحرباء — the 16-word boards, by category.
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs) and the rooms server
   (bundled by rooms-worker/build.mjs), so the pass-the-phone game and the room
   game deal from the same list. Every board is one category and 16 words.
   ========================================================================= */
const CHAMELEON_DB = {
  ar: [
    {"category": "وسائل مواصلات 🚗", "words": ["سيارة", "قطار", "طائرة", "دراجة", "سفينة", "مترو", "حافلة", "تاكسي", "شاحنة", "صاروخ", "غواصة", "ترام", "منطاد", "سكوتر", "موتوسيكل", "هليكوبتر"]},
    {"category": "كواكب وفضاء 🪐", "words": ["شمس", "قمر", "أرض", "مريخ", "مشتري", "زحل", "عطارد", "زهرة", "نبتون", "أورانوس", "نيزك", "مجرة", "نجم", "ثقب أسود", "مذنب", "محطة فضاء"]},
    {"category": "شخصيات كرتونية 🦸", "words": ["ميكي ماوس", "سبونج بوب", "توم", "جيري", "باتمان", "سبايدرمان", "سندريلا", "سيمبا", "علاء الدين", "طرزان", "شريك", "المحقق كونان", "ماوكلي", "بسيط", "بينوكيو", "باباي"]},
    {"category": "أدوات ومعدات 🔨", "words": ["شاكوش", "مفك", "منشار", "كماشة", "مسمار", "متر قياس", "مبرد", "ميزان ماء", "شنيور", "مقص", "فرشاة دهان", "سلم", "صامولة", "مفتاح إنجليزي", "فأس", "مسدس شمع"]},
    {"category": "أجهزة إلكترونية 📱", "words": ["موبايل", "لابتوب", "تابلت", "سماعات", "تلفزيون", "كاميرا", "بلايستيشن", "راوتر", "ساعة ذكية", "طابعة", "ماوس", "كيبورد", "فلاش ميموري", "باور بانك", "بروجكتور", "ميكروفون"]},
    {"category": "عجائب ومعالم 🗽", "words": ["الأهرامات", "برج إيفل", "تمثال الحرية", "برج خليفة", "سور الصين", "تاج محل", "برج بيزا", "الكولوسيوم", "ساعة بيج بن", "أبو الهول", "قلعة قايتباي", "البتراء", "أكروبوليس", "شلالات نياجرا", "جبل إفرست", "قصر الحمراء"]},
    {"category": "ألعاب وتسالي 🎲", "words": ["شطرنج", "طاولة زهر", "دومينو", "كوتشينة", "مونوبولي", "أونو", "بنك الحظ", "غميضة", "سلم وثعبان", "إكس أو", "مكعب روبيك", "بازل", "بلياردو", "بولينج", "بينج بونج", "كرة سرعة"]},
    {"category": "أماكن ترفيهية 🎡", "words": ["ملاهي", "حديقة حيوان", "شاطئ", "سينما", "سيرك", "مول", "متحف", "مسرح", "مطعم", "كافيه", "حديقة عامة", "مسبح", "نادي رياضي", "مكتبة", "أكوا بارك", "صالة بولينج"]},
    {"category": "مشروبات منعشة 🍹", "words": ["عصير مانجو", "ليمون بالنعناع", "شاي بلبن", "قهوة تركي", "موكا", "ميلك شيك", "سحلب", "كركديه", "قصب", "سوبيا", "تمر هندي", "شوكولاتة ساخنة", "كابتشينو", "عرقسوس", "برتقال فريش", "آيس كوفي"]},
    {"category": "مستلزمات الحمام 🛁", "words": ["صابون", "شامبو", "معجون أسنان", "فرشاة", "فوطة", "دش", "بانيو", "مرآة", "مشط", "مجفف شعر", "غسالة", "برنس", "مناديل", "لوفة", "مقص أظافر", "عطر"]},
    {"category": "طيور وحشرات 🦅", "words": ["صقر", "نسر", "حمامة", "بومة", "طاووس", "بطة", "ببغاء", "عصفور", "نحلة", "فراشة", "نملة", "يعسوب", "خنفساء", "غراب", "هدهد", "نعامة"]},
    {"category": "مطبخ وأدواته 🍳", "words": ["سكين", "شوكة", "ملعقة", "طاسة", "حلة", "طبق", "كوباية", "خلاط", "بوتاجاز", "ميكروويف", "ثلاجة", "صينية", "فتاحة", "مبشرة", "غلاية", "مصفاة"]},
    {"category": "في الحديقة 🌳", "words": ["شجرة", "وردة", "عشب", "مقعد", "نافورة", "سياج", "أرجوحة", "خرطوم ماء", "أوراق شجر", "فراشة", "نحلة", "طائر", "أصيص زرع", "مقص شجر", "دراجة", "ممر مشاة"]},
    {"category": "أجزاء الجسم 🖐️", "words": ["عين", "أنف", "فم", "أذن", "يد", "قدم", "رأس", "قلب", "لسان", "أسنان", "ركبة", "ذراع", "بطن", "ظهر", "أصبع", "كتف"]},
    {"category": "ألوان وأشكال 🎨", "words": ["أحمر", "أزرق", "أخضر", "أصفر", "أسود", "أبيض", "برتقالي", "بنفسجي", "دائرة", "مربع", "مثلث", "مستطيل", "نجمة", "قلب", "ماسي", "بيضاوي"]},
    {"category": "عواطف ومشاعر 🎭", "words": ["سعادة", "حزن", "غضب", "خوف", "مفاجأة", "حب", "ملل", "حماس", "خجل", "غيرة", "هدوء", "توتر", "ندم", "فخر", "راحة", "أمل"]},
    {
      category: "حيوانات 🦁",
      words: ["قطة", "كلب", "أسد", "نمر", "فيل", "زرافة", "قرد", "دب", "ذئب", "ثعلب", "أرنب", "غزال", "تمساح", "جمل", "صقر", "بطريق"]
    },
    {
      category: "أكلات وأطعمة 🍕",
      words: ["بيتزا", "برجر", "كشري", "ملوخية", "شاورما", "فلافل", "محشي", "مكرونة", "كباب", "سوشي", "سلطة", "بطاطس", "حواوشي", "شوربة", "ستيك", "طاجن"]
    },
    {
      category: "سينما وأفلام 🎬",
      words: ["أكشن", "رعب", "كوميدي", "دراما", "مخرج", "ممثل", "كاميرا", "شاشة", "فشار", "تذكرة", "أوسكار", "سيناريو", "دوبلاج", "كواليس", "موسيقى", "إضاءة"]
    },
    {
      category: "مهن ووظائف 👮",
      words: ["طبيب", "مهندس", "معلم", "طيار", "ضابط", "محامي", "محاسب", "قاضي", "مبرمج", "صيدلي", "نجار", "سباك", "طباخ", "مزارع", "فنان", "صحفي"]
    },
    {
      category: "اختراعات وتكنولوجيا 💡",
      words: ["طيارة", "سيارة", "تلفزيون", "إنترنت", "موبايل", "كهرباء", "قطار", "غواصة", "صاروخ", "بوصلة", "ميكروسكوب", "روبوت", "طباعة", "رادار", "كاميرا", "بطارية"]
    },
    {
      category: "دول 🌍",
      words: ["مصر", "السعودية", "المغرب", "فرنسا", "إيطاليا", "البرازيل", "اليابان", "ألمانيا", "إسبانيا", "كندا", "تركيا", "الأرجنتين", "إنجلترا", "الصين", "اليونان", "أستراليا"]
    },
    {
      category: "مدرسة وتعليم 📚",
      words: ["كتاب", "قلم", "سبورة", "مسطرة", "حقيبة", "امتحان", "جرس", "فسحة", "معلم", "مكتبة", "خريطة", "واجب", "درجات", "دفتر", "براية", "حاسبة"]
    },
    {
      category: "رياضات ⚽",
      words: ["كرة قدم", "سلة", "تنس", "سباحة", "ملاكمة", "ركض", "إسكواش", "جمباز", "دراجات", "جودو", "رماية", "تزلج", "كاراتيه", "كرة يد", "كرة طائرة", "فروسية"]
    },
    {
      category: "آلات موسيقية 🎸",
      words: ["جيتار", "بيانو", "طبلة", "كمان", "عود", "قانون", "ناي", "مزمار", "دف", "تشيلو", "ترومبيت", "ساكسفون", "هارمونيكا", "درامز", "كيبورد", "سمسمية"]
    },
    {
      category: "في المنزل 🏠",
      words: ["سرير", "كنبة", "ثلاجة", "تلفزيون", "طاولة", "مرآة", "دولاب", "شباك", "سجادة", "ستارة", "مروحة", "غسالة", "بوتاجاز", "مصباح", "لوحة", "وسادة"]
    },
    {
      category: "طبيعة وطقس 🌦️",
      words: ["شمس", "مطر", "ثلج", "سحاب", "رعد", "برق", "قوس قزح", "ريح", "إعصار", "ضباب", "شاطئ", "جبل", "غابة", "صحراء", "جزيرة", "نهر"]
    },
    {
      category: "ملابس وإكسسوارات 👔",
      words: ["قميص", "بنطلون", "حذاء", "قبعة", "نظارة", "جاكيت", "كرافتة", "ساعة", "حزام", "فستان", "شراب", "وشاح", "خاتم", "سلسلة", "كاب", "معطف"]
    },
    {
      category: "حلويات وتسالي 🧁",
      words: ["كنافة", "بسبوسة", "بقلاوة", "كيك", "دونات", "آيس كريم", "شوكولاتة", "غزل بنات", "كب كيك", "أم علي", "مهلبية", "قطايف", "بونبون", "فشار", "وافل", "تشيز كيك"]
    },
    {
      category: "فواكه وخضروات 🍎",
      words: ["تفاح", "موز", "فراولة", "مانجو", "برتقال", "عنب", "بطيخ", "ليمون", "طماطم", "خيار", "جزر", "بطاطس", "بصل", "فلفل", "خس", "ذرة"]
    },
    {
      category: "حيوانات البحر 🐠",
      words: ["سمكة", "قرش", "حوت", "دلفين", "أخطبوط", "كابوريا", "جمبري", "قنديل البحر", "نجم البحر", "حصان البحر", "فقمة", "سلحفاة بحرية", "محار", "سبيط", "لخمة", "استاكوزا"]
    },
    {
      category: "في المدينة 🏙️",
      words: ["مستشفى", "حديقة", "بنك", "مطعم", "فندق", "سينما", "محطة", "مطار", "صيدلية", "سوبرماركت", "مسجد", "مدرسة", "برج", "كوبري", "نفق", "مول"]
    },
    {"category": "رمضان والعيد 🌙", "words": ["فانوس", "سحور", "إفطار", "تمر", "قطايف", "كنافة", "مسحراتي", "مدفع الإفطار", "كعك", "عيدية", "خروف", "صلاة العيد", "هلال", "زينة رمضان", "ياميش", "تراويح"]},
    {"category": "في المستشفى 🏥", "words": ["دكتور", "ممرضة", "إسعاف", "سرير", "حقنة", "أشعة", "عملية", "ترمومتر", "سماعة", "جبس", "كرسي متحرك", "صيدلية", "روشتة", "محلول", "كمامة", "غرفة العمليات"]},
    {"category": "على الشاطئ 🏖️", "words": ["رمل", "موج", "شمسية", "مايوه", "منشفة", "كريم شمس", "قلعة رمل", "صدف", "منقذ", "عوامة", "كورة شاطئ", "آيس كريم", "نضارة شمس", "سمك", "مركب", "شاليه"]},
    {"category": "في المطار ✈️", "words": ["طيارة", "تذكرة", "جواز سفر", "شنطة", "بوابة", "طيار", "مضيفة", "تفتيش", "حزام الأمان", "برج المراقبة", "مدرج", "سوق حرة", "تأخير", "ترانزيت", "بطاقة صعود", "ختم"]},
    {"category": "ألعاب زمان 🪁", "words": ["استغماية", "نط الحبل", "مسّاكة", "بلي", "طيارة ورق", "شد الحبل", "الكراسي الموسيقية", "سبع طوبات", "الحجلة", "عسكر وحرامية", "بنك الحظ", "كوتشينة", "دومينو", "شطرنج", "تماثيل", "كرة شراب"]},
    {"category": "في السوبرماركت 🛒", "words": ["عربية تسوق", "كاشير", "باركود", "خصم", "لبن", "عيش", "بيض", "جبنة", "شيبسي", "مياه", "منظفات", "خضار", "فاكهة", "فريزر", "شنطة", "فاتورة"]},
    {"category": "مصر القديمة 🏺", "words": ["هرم", "أبو الهول", "فرعون", "مومياء", "هيروغليفي", "بردي", "معبد", "تابوت", "نفرتيتي", "توت عنخ آمون", "رمسيس", "مسلة", "الجعران", "النيل", "كليوباترا", "حورس"]},
    {"category": "السوشيال ميديا 📲", "words": ["لايك", "شير", "كومنت", "بوست", "ستوري", "ريلز", "هاشتاج", "فولو", "بلوك", "سيلفي", "فلتر", "لايف", "ترند", "إيموجي", "إشعار", "بروفايل"]},
    {"category": "في الملاهي 🎢", "words": ["قطار الموت", "العجلة الدوارة", "سيارات التصادم", "بيت الرعب", "المراجيح", "الفناجين", "غزل البنات", "فشار", "تذكرة دخول", "طابور", "الخيول الدوارة", "بالونة", "مهرج", "زحليقة مياه", "السفينة", "كابينة التصوير"]},
    {"category": "في المزرعة 🐄", "words": ["بقرة", "جاموسة", "خروف", "ماعز", "حصان", "حمار", "ديك", "فرخة", "بطة", "وزة", "أرنب", "كلب حراسة", "جرار", "حظيرة", "فزاعة", "قش"]},
    {"category": "في الفرح 💍", "words": ["عروسة", "عريس", "فستان", "بدلة", "دبلة", "تورتة", "زفة", "دي جي", "معازيم", "صور", "كوشة", "ورد", "رقصة", "بوفيه", "شبكة", "شهر العسل"]},
    {"category": "في الشتا ☔", "words": ["مطر", "شمسية", "جاكيت", "كوفية", "جوانتي", "شوربة", "سحلب", "دفاية", "بطانية", "برد", "زكام", "بوت", "شبورة", "رعد", "كاكاو", "مناديل"]},

    {"category": "أكلات مصرية 🍲", "words": ["كشري", "ملوخية", "فتة", "محشي", "ورق عنب", "مسقعة", "طعمية", "فول مدمس", "حواوشي", "كبدة", "ممبار", "رقاق", "فطير مشلتت", "بصارة", "صيادية", "مكرونة بشاميل"]},
    {"category": "أكلات عالمية 🌮", "words": ["بيتزا", "سوشي", "تاكو", "باستا", "برجر", "نودلز", "كاري", "بايلا", "رامن", "لازانيا", "هوت دوج", "كرواسون", "دونر كباب", "فاهيتا", "بوريتو", "دمبلنج"]},
    {"category": "توابل وبهارات 🌶️", "words": ["ملح", "فلفل أسود", "كمون", "كزبرة", "قرفة", "حبهان", "كركم", "زنجبيل", "زعفران", "شطة", "بابريكا", "ينسون", "قرنفل", "جوزة الطيب", "سماق", "زعتر"]},
    {"category": "مكسرات وفواكه مجففة 🥜", "words": ["لوز", "بندق", "كاجو", "فستق", "سوداني", "عين جمل", "لب أبيض", "لب سوري", "حمص محمص", "زبيب", "تين مجفف", "مشمش مجفف", "قراصيا", "جوز هند", "عجوة", "قمر الدين"]},
    {"category": "أثاث 🛋️", "words": ["كنبة", "كرسي", "ترابيزة", "سرير", "دولاب", "كومودينو", "تسريحة", "مكتب", "مكتبة", "رف", "فوتيه", "بوف", "سفرة", "نيش", "جزامة", "شماعة"]},
    {"category": "أدوات مكتبية 📎", "words": ["قلم", "أستيكة", "مسطرة", "براية", "دباسة", "مشبك ورق", "شريط لاصق", "مقص", "غرا", "ملف", "ختم", "خرامة", "ماركر", "كشكول", "ظرف", "ورق ملاحظات"]},
    {"category": "مجوهرات وأحجار كريمة 💎", "words": ["خاتم", "سلسلة", "حلق", "أسورة", "خلخال", "بروش", "تاج", "دبلة", "ساعة دهب", "ياقوت", "زمرد", "ألماظ", "لؤلؤ", "فيروز", "مرجان", "كهرمان"]},
    {"category": "خامات ومعادن ⛏️", "words": ["دهب", "فضة", "نحاس", "حديد", "ألومنيوم", "رصاص", "زنك", "بلاتين", "صلب", "خشب", "زجاج", "بلاستيك", "مطاط", "جلد", "قطن", "صوف"]},
    {"category": "زهور 🌸", "words": ["وردة", "ياسمين", "توليب", "عباد الشمس", "زنبق", "أوركيد", "لوتس", "بنفسج", "أقحوان", "قرنفل", "نرجس", "لافندر", "سنبل", "جاردينيا", "جهنمية", "شقائق النعمان"]},
    {"category": "أشجار 🌳", "words": ["نخلة", "زيتون", "تين", "برتقال", "مانجو", "كافور", "جميز", "سنط", "صنوبر", "أرز", "بلوط", "صفصاف", "سرو", "ليمون", "جوافة", "موز"]},
    {"category": "زواحف وبرمائيات 🦎", "words": ["تمساح", "سلحفاة", "ثعبان", "كوبرا", "أفعى", "سحلية", "حرباء", "برص", "ديناصور", "إغوانا", "ضفدع", "سمندل", "أناكوندا", "أصلة", "تمساح أمريكي", "تنين كومودو"]},
    {"category": "حيوانات أليفة 🐶", "words": ["قطة", "كلب", "أرنب", "هامستر", "سلحفاة", "ببغاء", "كناري", "سمكة زينة", "حصان", "خنزير غينيا", "فأر أبيض", "قنفذ", "حمامة", "بطة", "كتكوت", "إغوانا"]},
    {"category": "مخلوقات أسطورية 🐉", "words": ["تنين", "عنقاء", "يونيكورن", "حورية البحر", "غول", "عملاق", "قزم", "جني", "مصاص دماء", "مستذئب", "أبو رجل مسلوخة", "ميدوسا", "بيجاسوس", "كراكن", "النداهة", "عفريت"]},
    {"category": "أبطال خارقين 🦸‍♂️", "words": ["سوبرمان", "باتمان", "سبايدرمان", "آيرون مان", "هالك", "ثور", "كابتن أمريكا", "واندر وومان", "فلاش", "أكوامان", "بلاك بانثر", "دكتور سترينج", "أنت مان", "ولفيرين", "كابتن مارفل", "بلاك ويدو"]},
    {"category": "شخصيات ديزني 👑", "words": ["سندريلا", "سنو وايت", "أورورا", "آريل", "بيل", "ياسمين", "مولان", "بوكاهونتاس", "رابونزل", "إلسا", "آنا", "موانا", "تيانا", "ميريدا", "علاء الدين", "أولاف"]},
    {"category": "كرتون زمان 📺", "words": ["كابتن ماجد", "جريندايزر", "عدنان ولينا", "سالي", "ساندي بل", "هايدي", "ريمي", "فلونة", "النمر المقنع", "السنافر", "بكار", "بوجي وطمطم", "توم سوير", "سندباد", "زينة ونحول", "مازنجر"]},
    {"category": "في المدرسة 🏫", "words": ["فصل", "سبورة", "طباشير", "ديسك", "شنطة", "كراسة", "جرس", "طابور", "فسحة", "ناظر", "مدرس", "امتحان", "واجب", "حوش", "مريلة", "ساندوتشات"]},
    {"category": "لاعبين كورة ⚽", "words": ["ميسي", "رونالدو", "محمد صلاح", "نيمار", "مبابي", "هالاند", "مودريتش", "بنزيما", "زيدان", "رونالدينيو", "بيليه", "مارادونا", "بيكهام", "كاكا", "إبراهيموفيتش", "ليفاندوفسكي"]},
    {"category": "أندية كورة 🏟️", "words": ["الأهلي", "الزمالك", "الإسماعيلي", "المصري", "بيراميدز", "ريال مدريد", "برشلونة", "ليفربول", "مانشستر يونايتد", "مانشستر سيتي", "تشيلسي", "أرسنال", "بايرن ميونخ", "يوفنتوس", "باريس سان جيرمان", "الهلال"]},
    {"category": "مطربين عرب 🎤", "words": ["أم كلثوم", "عبد الحليم حافظ", "محمد عبد الوهاب", "فيروز", "عمرو دياب", "محمد منير", "تامر حسني", "شيرين", "أنغام", "إليسا", "نانسي عجرم", "كاظم الساهر", "راغب علامة", "هاني شاكر", "وردة", "ماجدة الرومي"]},
    {"category": "ممثلين مصريين 🎭", "words": ["عادل إمام", "أحمد زكي", "محمود عبد العزيز", "عمر الشريف", "فاتن حمامة", "سعاد حسني", "يحيى الفخراني", "محمد هنيدي", "أحمد حلمي", "كريم عبد العزيز", "يسرا", "ليلى علوي", "منى زكي", "أحمد السقا", "إسماعيل ياسين", "فؤاد المهندس"]},
    {"category": "علماء ومخترعين 🔬", "words": ["أينشتاين", "نيوتن", "إديسون", "جراهام بل", "تسلا", "ماري كوري", "جاليليو", "داروين", "أحمد زويل", "مجدي يعقوب", "ابن سينا", "ابن الهيثم", "الخوارزمي", "الأخوان رايت", "أرشميدس", "باستير"]},
    {"category": "شخصيات تاريخية 📜", "words": ["كليوباترا", "رمسيس التاني", "توت عنخ آمون", "نفرتيتي", "الإسكندر الأكبر", "يوليوس قيصر", "نابليون", "صلاح الدين", "محمد علي باشا", "جمال عبد الناصر", "أنور السادات", "غاندي", "نيلسون مانديلا", "مارتن لوثر كينج", "جنكيز خان", "هارون الرشيد"]},
    {"category": "كتّاب وشعراء ✍️", "words": ["نجيب محفوظ", "طه حسين", "توفيق الحكيم", "عباس العقاد", "أحمد شوقي", "حافظ إبراهيم", "المتنبي", "نزار قباني", "محمود درويش", "جبران خليل جبران", "شكسبير", "أجاثا كريستي", "تشارلز ديكنز", "جي كي رولينج", "مارك توين", "تولستوي"]},
    {"category": "عملات 💵", "words": ["جنيه مصري", "دولار", "يورو", "ريال", "درهم", "دينار", "ليرة", "ين", "يوان", "روبية", "روبل", "فرنك", "بيزو", "جنيه إسترليني", "وون", "كرونة"]},
    {"category": "لغات 🗣️", "words": ["عربي", "إنجليزي", "فرنساوي", "ألماني", "إسباني", "إيطالي", "روسي", "صيني", "ياباني", "كوري", "تركي", "هندي", "فارسي", "برتغالي", "يوناني", "سواحيلي"]},
    {"category": "ماركات عربيات 🚘", "words": ["مرسيدس", "بي إم دبليو", "تويوتا", "نيسان", "هيونداي", "كيا", "شيفروليه", "فورد", "فيراري", "لامبورجيني", "بورشه", "أودي", "فولكس فاجن", "رينو", "بيجو", "تيسلا"]},
    {"category": "رياضات 🏅", "words": ["كورة قدم", "كورة سلة", "كورة طايرة", "كورة يد", "تنس", "سباحة", "اسكواش", "جري", "جمباز", "رفع أثقال", "بينج بونج", "ركوب خيل", "سباق عجل", "جولف", "غطس", "تجديف"]},
    {"category": "فنون قتالية 🥋", "words": ["كاراتيه", "جودو", "تايكوندو", "كونغ فو", "ملاكمة", "مصارعة", "كيك بوكسينج", "حزام أسود", "دفاع عن النفس", "نينجا", "ساموراي", "سومو", "مبارزة", "مصارعة حرة", "بروس لي", "تحطيب"]},
    {"category": "العيلة والقرايب 👨‍👩‍👧", "words": ["أب", "أم", "أخ", "أخت", "جد", "جدة", "عم", "خالة", "ابن عم", "ابن أخ", "بنت أخت", "حفيد", "حفيدة", "حماة", "نسيب", "مرات الأخ"]},
    {"category": "أجزاء العربية 🚗", "words": ["موتور", "فتيس", "دريكسيون", "فرامل", "كاوتش", "شكمان", "رفرف", "كبوت", "شنطة العربية", "مساحات", "فانوس", "كلاكس", "مراية جانبية", "حزام أمان", "تابلوه", "دبرياج"]},
    {"category": "أجزاء الكمبيوتر 💻", "words": ["شاشة", "كيبورد", "ماوس", "رامات", "هارد", "بروسيسور", "كارت شاشة", "مازربورد", "باور سبلاي", "مروحة", "كاميرا ويب", "سماعات", "ميكروفون", "فتحة يو إس بي", "راوتر", "طابعة"]},
    {"category": "أدوات تجميل 💄", "words": ["روج", "ماسكرا", "آيلاينر", "بودرة", "كريم أساس", "كحل", "ظل عيون", "أحمر خدود", "مناكير", "مزيل مكياج", "فرشة مكياج", "مرطب", "عطر", "كريم شمس", "سيروم", "بنس شعر"]},
    {"category": "في الجيم 🏋️", "words": ["دمبل", "بار حديد", "مشاية", "عجلة ثابتة", "حبل نط", "مرتبة يوجا", "كرة جيم", "مدرب", "بروتين", "زمزمية", "فوطة", "بنش", "أثقال", "حزام رفع", "ساونا", "لوكر"]},
    {"category": "في المطعم 🍽️", "words": ["منيو", "جرسون", "شيف", "ترابيزة", "حجز", "فاتورة", "بقشيش", "شوكة", "سكينة", "مناديل", "طبق اليوم", "سلطة", "حلو", "عصير", "كاشير", "تيك أواي"]},
    {"category": "في الفندق 🏨", "words": ["استقبال", "مفتاح الأوضة", "شنط", "بواب", "أوضة", "جناح", "روم سيرفس", "فطار بوفيه", "حمام سباحة", "جيم", "أسانسير", "كارت الأوضة", "لوبي", "تنظيف الغرف", "ميني بار", "تشيك أوت"]},
    {"category": "في محطة القطر 🚆", "words": ["قطر", "رصيف", "تذكرة", "شباك التذاكر", "كمسري", "قضبان", "عربية نوم", "صفارة", "ساعة المحطة", "شنطة سفر", "ركاب", "جرس", "جدول المواعيد", "كافيتريا", "دكك", "كشك جرايد"]},
    {"category": "عند الحلاق 💈", "words": ["كرسي", "مقص", "ماكينة حلاقة", "مشط", "مراية", "موس", "رغوة", "فوطة", "سشوار", "جل", "كولونيا", "فرشة", "شنب", "دقن", "قصة شعر", "مريلة"]},
    {"category": "في ماتش كورة ⚽", "words": ["حكم", "صفارة", "كارت أصفر", "كارت أحمر", "جون", "شبكة", "حارس مرمى", "مدرب", "جمهور", "أعلام", "ركنية", "ضربة جزاء", "تسلل", "شوط", "معلق", "كأس"]},
    {"category": "في المعمل 🧪", "words": ["ميكروسكوب", "أنبوبة اختبار", "بالطو أبيض", "نضارة واقية", "جوانتي", "ميزان", "مخبار", "دورق", "ماصة", "ترمومتر", "عينة", "موقد بنزن", "تجربة", "عالم", "كيماويات", "ماسك"]},
    {"category": "عيد ميلاد 🎂", "words": ["تورتة", "شموع", "بالونات", "هدايا", "طرطور", "زينة", "كيس مفاجآت", "ألعاب", "أغنية عيد الميلاد", "كارت دعوة", "عصير", "شيبسي", "ساحر", "مهرج", "صور", "رقص"]},
    {"category": "في الصحرا 🏜️", "words": ["رمل", "جمل", "واحة", "نخلة", "خيمة", "صبار", "عقرب", "ثعبان", "كثبان", "شمس", "سراب", "بدو", "قافلة", "بير", "عاصفة ترابية", "نجوم"]},
    {"category": "في الغابة 🌲", "words": ["دب", "ذئب", "غزال", "بومة", "سنجاب", "فطر", "جذع شجرة", "ورق شجر", "نهر", "كوخ", "حطاب", "ممر", "طحالب", "نمل", "عنكبوت", "نار مخيم"]},
    {"category": "في البنك 🏦", "words": ["فلوس", "ماكينة صراف", "كارت بنك", "شيك", "حساب", "قرض", "فايدة", "موظف", "طابور", "خزنة", "إيداع", "سحب", "دفتر توفير", "رقم سري", "عملة", "حارس أمن"]},
    {"category": "أدوات الرسم 🎨", "words": ["فرشاة", "ألوان مية", "ألوان زيت", "ألوان خشب", "باستيل", "قلم رصاص", "أستيكة", "كانفاس", "حامل لوحة", "باليتة", "فحم", "كراسة رسم", "مسطرة", "ماركر", "ألوان شمع", "سبراي"]},
    {"category": "أنواع جبنة 🧀", "words": ["رومي", "إسطنبولي", "قريش", "دمياطي", "ميش", "شيدر", "موتزاريلا", "بارميزان", "فيتا", "جودا", "إيدام", "ريكوتا", "جبنة كريمي", "حلومي", "جبنة مثلثات", "جبنة قديمة"]},
    {"category": "أنواع عيش 🍞", "words": ["عيش بلدي", "عيش شامي", "عيش فينو", "توست", "باجيت", "كرواسون", "بريوش", "بيجل", "رقاق", "فطير", "تورتيلا", "خبز نان", "عيش سن", "عيش شمسي", "فوكاتشا", "بقسماط"]},
    {"category": "حلويات شرقية 🍯", "words": ["كنافة", "بسبوسة", "قطايف", "بقلاوة", "لقمة القاضي", "أم علي", "رز بلبن", "مهلبية", "بلح الشام", "كحك", "غريبة", "معمول", "هريسة", "ملبن", "حلاوة طحينية", "عسلية"]}
  ],
  en: [
    {"category": "Vehicles & Transport 🚗", "words": ["Car", "Train", "Airplane", "Bicycle", "Ship", "Subway", "Bus", "Taxi", "Truck", "Rocket", "Submarine", "Helicopter", "Scooter", "Motorcycle", "Hot Air Balloon", "Tram"]},
    {"category": "Space & Cosmos 🪐", "words": ["Sun", "Moon", "Earth", "Mars", "Jupiter", "Saturn", "Mercury", "Venus", "Neptune", "Uranus", "Meteor", "Galaxy", "Star", "Black Hole", "Comet", "Space Station"]},
    {"category": "Cartoon Characters 🦸", "words": ["Mickey Mouse", "SpongeBob", "Tom", "Jerry", "Batman", "Spider-Man", "Cinderella", "Simba", "Aladdin", "Tarzan", "Shrek", "Scooby-Doo", "Pikachu", "Donald Duck", "Pinocchio", "Popeye"]},
    {"category": "Tools & Hardware 🔨", "words": ["Hammer", "Screwdriver", "Handsaw", "Pliers", "Nail", "Tape Measure", "Wrench", "Level", "Power Drill", "Scissors", "Paintbrush", "Ladder", "Nut & Bolt", "Axe", "Glue Gun", "Crowbar"]},
    {"category": "Tech Gadgets 📱", "words": ["Smartphone", "Laptop", "Tablet", "Headphones", "Television", "Camera", "Game Console", "Wi-Fi Router", "Smartwatch", "Printer", "Mouse", "Keyboard", "USB Drive", "Power Bank", "Projector", "Microphone"]},
    {"category": "World Landmarks 🗽", "words": ["Great Pyramids", "Eiffel Tower", "Statue of Liberty", "Burj Khalifa", "Great Wall", "Taj Mahal", "Leaning Tower", "Colosseum", "Big Ben", "Great Sphinx", "Petra", "Acropolis", "Niagara Falls", "Mount Everest", "Alhambra", "Sydney Opera"]},
    {"category": "Games & Pastimes 🎲", "words": ["Chess", "Checkers", "Dominoes", "Playing Cards", "Monopoly", "Uno", "Scrabble", "Hide & Seek", "Trivia", "Rubik's Cube", "Jigsaw Puzzle", "Billiards", "Bowling", "Table Tennis", "Darts", "Video Games"]},
    {"category": "Fun Places 🎡", "words": ["Amusement Park", "Zoo", "Beach", "Cinema", "Circus", "Shopping Mall", "Museum", "Theater", "Restaurant", "Cafe", "Public Park", "Swimming Pool", "Sports Stadium", "Library", "Water Park", "Arcade"]},
    {"category": "Refreshing Drinks 🍹", "words": ["Mango Juice", "Lemonade", "Iced Tea", "Espresso", "Milkshake", "Hot Chocolate", "Orange Juice", "Cappuccino", "Smoothie", "Apple Cider", "Green Tea", "Iced Coffee", "Ginger Ale", "Coconut Water", "Sparkling Water", "Latte"]},
    {"category": "Bathroom Items 🛁", "words": ["Soap", "Shampoo", "Toothpaste", "Toothbrush", "Towel", "Shower", "Bathtub", "Mirror", "Comb", "Hair Dryer", "Washing Machine", "Bathrobe", "Tissues", "Loofah", "Nail Clipper", "Perfume"]},
    {"category": "Birds & Insects 🦅", "words": ["Falcon", "Eagle", "Pigeon", "Owl", "Peacock", "Duck", "Parrot", "Sparrow", "Honeybee", "Butterfly", "Ant", "Dragonfly", "Beetle", "Crow", "Flamingo", "Ostrich"]},
    {"category": "Kitchen Utensils 🍳", "words": ["Kitchen Knife", "Fork", "Spoon", "Frying Pan", "Cooking Pot", "Dinner Plate", "Drinking Glass", "Blender", "Stove", "Microwave", "Refrigerator", "Baking Tray", "Can Opener", "Cheese Grater", "Kettle", "Colander"]},
    {"category": "In the Garden 🌳", "words": ["Tree", "Rose", "Grass", "Bench", "Fountain", "Fence", "Swing", "Hose", "Leaves", "Butterfly", "Bee", "Bird", "Flower Pot", "Shears", "Lawn Mower", "Path"]},
    {"category": "Human Body 🖐️", "words": ["Eye", "Nose", "Mouth", "Ear", "Hand", "Foot", "Head", "Heart", "Tongue", "Teeth", "Knee", "Arm", "Stomach", "Back", "Finger", "Shoulder"]},
    {"category": "Colors & Shapes 🎨", "words": ["Red", "Blue", "Green", "Yellow", "Black", "White", "Orange", "Purple", "Circle", "Square", "Triangle", "Rectangle", "Star", "Heart", "Diamond", "Oval"]},
    {"category": "Emotions & Moods 🎭", "words": ["Joy", "Sadness", "Anger", "Fear", "Surprise", "True Love", "Boredom", "Excitement", "Shyness", "Jealousy", "Peaceful", "Anxiety", "Regret", "Pride", "Relief", "Hope"]},
    {
      category: "Animals 🦁",
      words: ["Cat", "Dog", "Lion", "Tiger", "Elephant", "Giraffe", "Monkey", "Bear", "Wolf", "Fox", "Rabbit", "Deer", "Crocodile", "Camel", "Falcon", "Penguin"]
    },
    {
      category: "Foods & Dishes 🍕",
      words: ["Pizza", "Burger", "Pasta", "Sushi", "Shawarma", "Steak", "Salad", "Fries", "Soup", "Tacos", "Sandwich", "Curry", "Rice", "Pie", "Noodles", "Kebab"]
    },
    {
      category: "Cinema & Movies 🎬",
      words: ["Action", "Horror", "Comedy", "Drama", "Director", "Actor", "Camera", "Screen", "Popcorn", "Ticket", "Oscar", "Script", "Stunt", "Premiere", "Soundtrack", "Lighting"]
    },
    {
      category: "Professions 👮",
      words: ["Doctor", "Engineer", "Teacher", "Pilot", "Police", "Lawyer", "Accountant", "Judge", "Programmer", "Pharmacist", "Carpenter", "Plumber", "Chef", "Farmer", "Artist", "Journalist"]
    },
    {
      category: "Inventions & Tech 💡",
      words: ["Airplane", "Car", "Television", "Internet", "Smartphone", "Electricity", "Train", "Submarine", "Rocket", "Compass", "Microscope", "Robot", "Printer", "Radar", "Camera", "Battery"]
    },
    {
      category: "Countries 🌍",
      words: ["Egypt", "Saudi Arabia", "Morocco", "France", "Italy", "Brazil", "Japan", "Germany", "Spain", "Canada", "Turkey", "Argentina", "England", "China", "Greece", "Australia"]
    },
    {
      category: "School & Education 📚",
      words: ["Book", "Pen", "Blackboard", "Ruler", "Backpack", "Exam", "Bell", "Recess", "Teacher", "Library", "Map", "Homework", "Grades", "Notebook", "Sharpener", "Calculator"]
    },
    {
      category: "Sports ⚽",
      words: ["Football", "Basketball", "Tennis", "Swimming", "Boxing", "Running", "Squash", "Gymnastics", "Cycling", "Judo", "Archery", "Skiing", "Karate", "Handball", "Volleyball", "Equestrian"]
    },
    {
      category: "Musical Instruments 🎸",
      words: ["Guitar", "Piano", "Drums", "Violin", "Oud", "Flute", "Trumpet", "Saxophone", "Harmonica", "Cello", "Harp", "Clarinet", "Tambourine", "Keyboard", "Bagpipes", "Accordion"]
    },
    {
      category: "At Home 🏠",
      words: ["Bed", "Sofa", "Fridge", "TV", "Table", "Mirror", "Closet", "Window", "Carpet", "Curtain", "Fan", "Washer", "Stove", "Lamp", "Painting", "Pillow"]
    },
    {
      category: "Nature & Weather 🌦️",
      words: ["Sun", "Rain", "Snow", "Cloud", "Thunder", "Lightning", "Rainbow", "Wind", "Storm", "Fog", "Beach", "Mountain", "Forest", "Desert", "Island", "River"]
    },
    {
      category: "Clothing & Fashion 👔",
      words: ["Shirt", "Pants", "Shoes", "Hat", "Glasses", "Jacket", "Tie", "Watch", "Belt", "Dress", "Socks", "Scarf", "Ring", "Necklace", "Cap", "Coat"]
    },
    {
      category: "Sweets & Desserts 🧁",
      words: ["Cake", "Donut", "Ice Cream", "Chocolate", "Cotton Candy", "Cupcake", "Candy", "Popcorn", "Waffle", "Cheesecake", "Pancake", "Brownie", "Cookie", "Pudding", "Croissant", "Muffin"]
    },
    {
      category: "Fruits & Veggies 🍎",
      words: ["Apple", "Banana", "Strawberry", "Mango", "Orange", "Grapes", "Watermelon", "Lemon", "Tomato", "Cucumber", "Carrot", "Potato", "Onion", "Pepper", "Lettuce", "Corn"]
    },
    {
      category: "Sea Creatures 🐠",
      words: ["Fish", "Shark", "Whale", "Dolphin", "Octopus", "Crab", "Shrimp", "Jellyfish", "Starfish", "Seahorse", "Seal", "Sea Turtle", "Oyster", "Squid", "Stingray", "Lobster"]
    },
    {
      category: "In the City 🏙️",
      words: ["Hospital", "Park", "Bank", "Restaurant", "Hotel", "Cinema", "Station", "Airport", "Pharmacy", "Supermarket", "Mosque", "School", "Tower", "Bridge", "Tunnel", "Mall"]
    },
    {"category": "Ramadan & Eid 🌙", "words": ["Lantern", "Suhoor", "Iftar", "Dates", "Qatayef", "Kunafa", "Dawn Drummer", "Iftar Cannon", "Eid Cookies", "Eid Money", "Sheep", "Eid Prayer", "Crescent Moon", "Decorations", "Dried Fruit", "Taraweeh"]},
    {"category": "At the Hospital 🏥", "words": ["Doctor", "Nurse", "Ambulance", "Bed", "Injection", "X-ray", "Surgery", "Thermometer", "Stethoscope", "Cast", "Wheelchair", "Pharmacy", "Prescription", "IV Drip", "Face Mask", "Operating Room"]},
    {"category": "At the Beach 🏖️", "words": ["Sand", "Waves", "Umbrella", "Swimsuit", "Towel", "Sunscreen", "Sandcastle", "Seashells", "Lifeguard", "Float", "Beach Ball", "Ice Cream", "Sunglasses", "Fish", "Boat", "Beach Hut"]},
    {"category": "At the Airport ✈️", "words": ["Plane", "Ticket", "Passport", "Suitcase", "Gate", "Pilot", "Flight Attendant", "Security Check", "Seatbelt", "Control Tower", "Runway", "Duty Free", "Delay", "Transit", "Boarding Pass", "Stamp"]},
    {"category": "Old-School Kids' Games 🪁", "words": ["Hide and Seek", "Jump Rope", "Tag", "Marbles", "Kite Flying", "Tug of War", "Musical Chairs", "Seven Stones", "Hopscotch", "Cops and Robbers", "Monopoly", "Card Games", "Dominoes", "Chess", "Statues", "Street Football"]},
    {"category": "At the Supermarket 🛒", "words": ["Shopping Cart", "Cashier", "Barcode", "Discount", "Milk", "Bread", "Eggs", "Cheese", "Crisps", "Water", "Detergent", "Vegetables", "Fruit", "Freezer", "Bag", "Receipt"]},
    {"category": "Ancient Egypt 🏺", "words": ["Pyramid", "Sphinx", "Pharaoh", "Mummy", "Hieroglyphs", "Papyrus", "Temple", "Sarcophagus", "Nefertiti", "Tutankhamun", "Ramses", "Obelisk", "Scarab", "Nile", "Cleopatra", "Horus"]},
    {"category": "Social Media 📲", "words": ["Like", "Share", "Comment", "Post", "Story", "Reels", "Hashtag", "Follow", "Block", "Selfie", "Filter", "Live", "Trend", "Emoji", "Notification", "Profile"]},
    {"category": "Theme Park 🎢", "words": ["Roller Coaster", "Ferris Wheel", "Bumper Cars", "Haunted House", "Swing Ride", "Teacups", "Cotton Candy", "Popcorn", "Entry Ticket", "Queue", "Carousel", "Balloon", "Clown", "Water Slide", "Pirate Ship Ride", "Photo Booth"]},
    {"category": "On the Farm 🐄", "words": ["Cow", "Buffalo", "Sheep", "Goat", "Horse", "Donkey", "Rooster", "Hen", "Duck", "Goose", "Rabbit", "Guard Dog", "Tractor", "Barn", "Scarecrow", "Hay"]},
    {"category": "At a Wedding 💍", "words": ["Bride", "Groom", "Dress", "Suit", "Ring", "Cake", "Procession", "DJ", "Guests", "Photos", "Stage", "Flowers", "First Dance", "Buffet", "Jewellery", "Honeymoon"]},
    {"category": "Winter ☔", "words": ["Rain", "Umbrella", "Coat", "Scarf", "Gloves", "Soup", "Hot Drink", "Heater", "Blanket", "Cold", "Flu", "Boots", "Fog", "Thunder", "Cocoa", "Tissues"]},

    {"category": "Egyptian Dishes 🍲", "words": ["Koshari", "Molokhia", "Fattah", "Mahshi", "Stuffed Vine Leaves", "Moussaka", "Falafel", "Ful Medames", "Hawawshi", "Liver Sandwich", "Mombar", "Roqaq", "Feteer", "Bessara", "Sayadeya", "Macaroni Béchamel"]},
    {"category": "World Food 🌮", "words": ["Pizza", "Sushi", "Taco", "Pasta", "Burger", "Noodles", "Curry", "Paella", "Ramen", "Lasagne", "Hot Dog", "Croissant", "Doner Kebab", "Fajitas", "Burrito", "Dumplings"]},
    {"category": "Spices & Herbs 🌶️", "words": ["Salt", "Black Pepper", "Cumin", "Coriander", "Cinnamon", "Cardamom", "Turmeric", "Ginger", "Saffron", "Chilli", "Paprika", "Aniseed", "Cloves", "Nutmeg", "Sumac", "Thyme"]},
    {"category": "Nuts & Dried Fruit 🥜", "words": ["Almonds", "Hazelnuts", "Cashews", "Pistachios", "Peanuts", "Walnuts", "Sunflower Seeds", "Pumpkin Seeds", "Roasted Chickpeas", "Raisins", "Dried Figs", "Dried Apricots", "Prunes", "Coconut", "Pecans", "Macadamias"]},
    {"category": "Furniture 🛋️", "words": ["Sofa", "Chair", "Table", "Bed", "Wardrobe", "Bedside Table", "Dressing Table", "Desk", "Bookcase", "Shelf", "Armchair", "Pouffe", "Dining Table", "Display Cabinet", "Shoe Rack", "Coat Stand"]},
    {"category": "Stationery 📎", "words": ["Pen", "Rubber", "Ruler", "Sharpener", "Stapler", "Paper Clip", "Sticky Tape", "Scissors", "Glue", "Folder", "Stamp", "Hole Punch", "Marker", "Notebook", "Envelope", "Sticky Notes"]},
    {"category": "Jewellery & Gems 💎", "words": ["Ring", "Necklace", "Earrings", "Bracelet", "Anklet", "Brooch", "Tiara", "Wedding Band", "Gold Watch", "Ruby", "Emerald", "Diamond", "Pearl", "Turquoise", "Coral", "Amber"]},
    {"category": "Materials & Metals ⛏️", "words": ["Gold", "Silver", "Copper", "Iron", "Aluminium", "Lead", "Zinc", "Platinum", "Steel", "Wood", "Glass", "Plastic", "Rubber", "Leather", "Cotton", "Wool"]},
    {"category": "Flowers 🌸", "words": ["Rose", "Jasmine", "Tulip", "Sunflower", "Lily", "Orchid", "Lotus", "Violet", "Daisy", "Carnation", "Daffodil", "Lavender", "Hyacinth", "Gardenia", "Bougainvillea", "Poppy"]},
    {"category": "Trees 🌳", "words": ["Palm", "Olive", "Fig", "Orange", "Mango", "Eucalyptus", "Sycamore Fig", "Acacia", "Pine", "Cedar", "Oak", "Willow", "Cypress", "Lemon", "Guava", "Banana"]},
    {"category": "Reptiles & Amphibians 🦎", "words": ["Crocodile", "Tortoise", "Snake", "Cobra", "Viper", "Lizard", "Chameleon", "Gecko", "Monitor Lizard", "Iguana", "Frog", "Salamander", "Anaconda", "Python", "Alligator", "Komodo Dragon"]},
    {"category": "Pets 🐶", "words": ["Cat", "Dog", "Rabbit", "Hamster", "Tortoise", "Parrot", "Canary", "Goldfish", "Pony", "Guinea Pig", "White Mouse", "Hedgehog", "Pigeon", "Duck", "Chick", "Iguana"]},
    {"category": "Mythical Creatures 🐉", "words": ["Dragon", "Phoenix", "Unicorn", "Mermaid", "Ogre", "Giant", "Dwarf", "Genie", "Vampire", "Werewolf", "Cyclops", "Medusa", "Pegasus", "Kraken", "Griffin", "Troll"]},
    {"category": "Superheroes 🦸‍♂️", "words": ["Superman", "Batman", "Spider-Man", "Iron Man", "Hulk", "Thor", "Captain America", "Wonder Woman", "The Flash", "Aquaman", "Black Panther", "Doctor Strange", "Ant-Man", "Wolverine", "Captain Marvel", "Black Widow"]},
    {"category": "Disney Characters 👑", "words": ["Cinderella", "Snow White", "Aurora", "Ariel", "Belle", "Jasmine", "Mulan", "Pocahontas", "Rapunzel", "Elsa", "Anna", "Moana", "Tiana", "Merida", "Aladdin", "Olaf"]},
    {"category": "Classic Cartoons 📺", "words": ["Captain Tsubasa", "Grendizer", "Future Boy Conan", "Princess Sarah", "Sandybell", "Heidi", "Remi", "Flone", "Tiger Mask", "The Smurfs", "Bakkar", "Bougy and Tamtam", "Tom Sawyer", "Sinbad", "Maya the Bee", "Mazinger Z"]},
    {"category": "At School 🏫", "words": ["Classroom", "Whiteboard", "Chalk", "Desk", "Schoolbag", "Exercise Book", "Bell", "Assembly", "Break Time", "Headteacher", "Teacher", "Exam", "Homework", "Playground", "Uniform", "Lunchbox"]},
    {"category": "Footballers ⚽", "words": ["Messi", "Ronaldo", "Mohamed Salah", "Neymar", "Mbappé", "Haaland", "Modrić", "Benzema", "Zidane", "Ronaldinho", "Pelé", "Maradona", "Beckham", "Kaká", "Ibrahimović", "Lewandowski"]},
    {"category": "Football Clubs 🏟️", "words": ["Al Ahly", "Zamalek", "Ismaily", "Al Masry", "Pyramids FC", "Real Madrid", "Barcelona", "Liverpool", "Manchester United", "Manchester City", "Chelsea", "Arsenal", "Bayern Munich", "Juventus", "Paris Saint-Germain", "Al Hilal"]},
    {"category": "Arab Singers 🎤", "words": ["Umm Kulthum", "Abdel Halim Hafez", "Mohamed Abdel Wahab", "Fairuz", "Amr Diab", "Mohamed Mounir", "Tamer Hosny", "Sherine", "Angham", "Elissa", "Nancy Ajram", "Kadim Al Sahir", "Ragheb Alama", "Hany Shaker", "Warda", "Majida El Roumi"]},
    {"category": "Egyptian Actors 🎭", "words": ["Adel Emam", "Ahmed Zaki", "Mahmoud Abdel Aziz", "Omar Sharif", "Faten Hamama", "Soad Hosny", "Yehia El Fakharany", "Mohamed Henedy", "Ahmed Helmy", "Karim Abdel Aziz", "Yousra", "Laila Elwi", "Mona Zaki", "Ahmed El Sakka", "Ismail Yassine", "Fouad El Mohandes"]},
    {"category": "Scientists & Inventors 🔬", "words": ["Einstein", "Newton", "Edison", "Graham Bell", "Tesla", "Marie Curie", "Galileo", "Darwin", "Ahmed Zewail", "Magdi Yacoub", "Avicenna", "Ibn al-Haytham", "Al-Khwarizmi", "The Wright Brothers", "Archimedes", "Pasteur"]},
    {"category": "Historical Figures 📜", "words": ["Cleopatra", "Ramesses II", "Tutankhamun", "Nefertiti", "Alexander the Great", "Julius Caesar", "Napoleon", "Saladin", "Muhammad Ali Pasha", "Gamal Abdel Nasser", "Anwar Sadat", "Gandhi", "Nelson Mandela", "Martin Luther King", "Genghis Khan", "Harun al-Rashid"]},
    {"category": "Writers & Poets ✍️", "words": ["Naguib Mahfouz", "Taha Hussein", "Tawfiq al-Hakim", "Abbas al-Aqqad", "Ahmed Shawqi", "Hafez Ibrahim", "Al-Mutanabbi", "Nizar Qabbani", "Mahmoud Darwish", "Kahlil Gibran", "Shakespeare", "Agatha Christie", "Charles Dickens", "J. K. Rowling", "Mark Twain", "Tolstoy"]},
    {"category": "Currencies 💵", "words": ["Egyptian Pound", "Dollar", "Euro", "Riyal", "Dirham", "Dinar", "Lira", "Yen", "Yuan", "Rupee", "Rouble", "Franc", "Peso", "Pound Sterling", "Won", "Krona"]},
    {"category": "Languages 🗣️", "words": ["Arabic", "English", "French", "German", "Spanish", "Italian", "Russian", "Chinese", "Japanese", "Korean", "Turkish", "Hindi", "Persian", "Portuguese", "Greek", "Swahili"]},
    {"category": "Car Brands 🚘", "words": ["Mercedes", "BMW", "Toyota", "Nissan", "Hyundai", "Kia", "Chevrolet", "Ford", "Ferrari", "Lamborghini", "Porsche", "Audi", "Volkswagen", "Renault", "Peugeot", "Tesla"]},
    {"category": "Sports 🏅", "words": ["Football", "Basketball", "Volleyball", "Handball", "Tennis", "Swimming", "Squash", "Running", "Gymnastics", "Weightlifting", "Table Tennis", "Horse Riding", "Cycling", "Golf", "Diving", "Rowing"]},
    {"category": "Martial Arts 🥋", "words": ["Karate", "Judo", "Taekwondo", "Kung Fu", "Boxing", "Wrestling", "Kickboxing", "Black belt", "Self-defence", "Ninja", "Samurai", "Sumo", "Fencing", "Freestyle wrestling", "Bruce Lee", "Stick fighting"]},
    {"category": "Family 👨‍👩‍👧", "words": ["Father", "Mother", "Brother", "Sister", "Grandfather", "Grandmother", "Uncle", "Aunt", "Cousin", "Nephew", "Niece", "Grandson", "Granddaughter", "Mother-in-law", "Brother-in-law", "Sister-in-law"]},
    {"category": "Car Parts 🚗", "words": ["Engine", "Gearbox", "Steering Wheel", "Brakes", "Tyre", "Exhaust", "Wing", "Bonnet", "Boot", "Wipers", "Headlight", "Horn", "Wing Mirror", "Seatbelt", "Dashboard", "Clutch"]},
    {"category": "Computer Parts 💻", "words": ["Monitor", "Keyboard", "Mouse", "RAM", "Hard Drive", "Processor", "Graphics Card", "Motherboard", "Power Supply", "Cooling Fan", "Webcam", "Speakers", "Microphone", "USB Port", "Router", "Printer"]},
    {"category": "Beauty Products 💄", "words": ["Lipstick", "Mascara", "Eyeliner", "Powder", "Foundation", "Kohl", "Eyeshadow", "Blusher", "Nail Varnish", "Make-up Remover", "Make-up Brush", "Moisturiser", "Perfume", "Sun Cream", "Serum", "Hair Clip"]},
    {"category": "At the Gym 🏋️", "words": ["Dumbbell", "Barbell", "Treadmill", "Exercise Bike", "Skipping Rope", "Yoga Mat", "Gym Ball", "Personal Trainer", "Protein Shake", "Water Bottle", "Towel", "Bench Press", "Weights", "Lifting Belt", "Sauna", "Locker"]},
    {"category": "At a Restaurant 🍽️", "words": ["Menu", "Waiter", "Chef", "Table", "Booking", "Bill", "Tip", "Fork", "Knife", "Napkin", "Dish of the Day", "Salad", "Dessert", "Juice", "Cashier", "Takeaway"]},
    {"category": "At a Hotel 🏨", "words": ["Reception", "Room Key", "Luggage", "Porter", "Room", "Suite", "Room Service", "Breakfast Buffet", "Swimming Pool", "Gym", "Lift", "Key Card", "Lobby", "Housekeeping", "Minibar", "Check-out"]},
    {"category": "At the Train Station 🚆", "words": ["Train", "Platform", "Ticket", "Ticket Office", "Conductor", "Tracks", "Sleeper Carriage", "Whistle", "Station Clock", "Suitcase", "Passengers", "Bell", "Timetable", "Café", "Benches", "Newspaper Stand"]},
    {"category": "At the Barber's 💈", "words": ["Chair", "Scissors", "Clippers", "Comb", "Mirror", "Razor", "Shaving Foam", "Towel", "Hairdryer", "Hair Gel", "Cologne", "Brush", "Moustache", "Beard", "Haircut", "Cape"]},
    {"category": "At a Football Match ⚽", "words": ["Referee", "Whistle", "Yellow Card", "Red Card", "Goal", "Net", "Goalkeeper", "Manager", "Crowd", "Flags", "Corner", "Penalty", "Offside", "Half", "Commentator", "Trophy"]},
    {"category": "In the Lab 🧪", "words": ["Microscope", "Test Tube", "Lab Coat", "Safety Goggles", "Gloves", "Scales", "Measuring Cylinder", "Beaker", "Pipette", "Thermometer", "Sample", "Bunsen Burner", "Experiment", "Scientist", "Chemicals", "Face Mask"]},
    {"category": "Birthday Party 🎂", "words": ["Cake", "Candles", "Balloons", "Presents", "Party Hat", "Decorations", "Party Bag", "Games", "Birthday Song", "Invitation", "Juice", "Crisps", "Magician", "Clown", "Photos", "Dancing"]},
    {"category": "In the Desert 🏜️", "words": ["Sand", "Camel", "Oasis", "Palm Tree", "Tent", "Cactus", "Scorpion", "Snake", "Dunes", "Sun", "Mirage", "Bedouin", "Caravan", "Well", "Sandstorm", "Stars"]},
    {"category": "In the Forest 🌲", "words": ["Bear", "Wolf", "Deer", "Owl", "Squirrel", "Mushroom", "Log", "Leaves", "Stream", "Cabin", "Woodcutter", "Path", "Moss", "Ants", "Spider", "Campfire"]},
    {"category": "At the Bank 🏦", "words": ["Money", "Cash Machine", "Bank Card", "Cheque", "Account", "Loan", "Interest", "Clerk", "Queue", "Safe", "Deposit", "Withdrawal", "Savings Book", "PIN", "Currency", "Security Guard"]},
    {"category": "Art Supplies 🎨", "words": ["Paintbrush", "Watercolours", "Oil Paints", "Coloured Pencils", "Pastels", "Pencil", "Rubber", "Canvas", "Easel", "Palette", "Charcoal", "Sketchbook", "Ruler", "Marker", "Crayons", "Spray Paint"]},
    {"category": "Cheeses 🧀", "words": ["Roumy", "Istanbuli", "Areesh", "Domiati", "Mish", "Cheddar", "Mozzarella", "Parmesan", "Feta", "Gouda", "Edam", "Ricotta", "Cream Cheese", "Halloumi", "Cheese Triangles", "Blue Cheese"]},
    {"category": "Breads 🍞", "words": ["Baladi Bread", "Pitta", "Fino Roll", "Sliced Bread", "Baguette", "Croissant", "Brioche", "Bagel", "Roqaq", "Feteer", "Tortilla", "Naan", "Rye Bread", "Ciabatta", "Focaccia", "Rusks"]},
    {"category": "Middle Eastern Sweets 🍯", "words": ["Kunafa", "Basbousa", "Qatayef", "Baklava", "Luqmat al-Qadi", "Om Ali", "Rice Pudding", "Muhallabia", "Balah el-Sham", "Kahk", "Ghorayeba", "Maamoul", "Harissa Cake", "Malban", "Halva", "Asaleya"]}
  ]
};
