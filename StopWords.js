/* ============================================================================
   أتوبيس كومبليت — what counts as a filled box, and the dictionary
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs) and the rooms server
   (bundled by rooms-worker/build.mjs), so a phone and the server agree on
   what a box needs before وقف can be pressed.

   - foldStopAnswer / stopAnswerFits: an answer fills its box when, folded
     (case, diacritics, hamza forms, ة/ه, ى/ي, the article), it is at least two
     letters and starts with the round's letter.
   - stopWordKnown: whether the dictionary knows the answer for its category.
     The dictionary is these lists plus the ones other games already keep
     (MONKEY_LISTS for countries, cities, English animals and foods; SPY_WORDS
     for Arabic animals, foods, things, jobs and brands). It is compared on
     letters only, with or without the article, forgives one wrong letter in a
     word of five or more, and an English plural. A word it doesn't know is not
     wrong: the room shows it as ❓ for the host to decide.

   Lists here are the categories nobody else had, and additions to the ones
   they did; a word already in another list is harmless. `npm run check`
   folds every list and fails on a word listed twice in one.
   ========================================================================= */

const STOP_WORDS = {
  ar: {
    names: [
      "أحمد", "أمير", "أيمن", "أسامة", "أشرف", "أنس", "إبراهيم", "إسماعيل", "إسلام", "أكرم", "أنور", "أدهم", "أيوب", "إياد", "إيهاب", "أمجد", "أسعد", "أمين", "إدريس", "إلياس",
      "آدم", "أمل", "أسماء", "آية", "أميرة", "إيمان", "إسراء", "آمنة", "آلاء", "أروى", "أماني", "ابتسام", "إلهام", "إنجي", "أسيل", "أريج", "آسيا", "ألفت", "أمنية", "إيناس",
      "باسم", "بلال", "بدر", "بكر", "بهاء", "باهر", "برهان", "بسام", "بشير", "بشرى", "بسمة", "بثينة", "بتول", "بسنت", "بيسان", "بهية", "بسيوني",
      "تامر", "توفيق", "تميم", "تيسير", "تقي", "تحسين", "تسنيم", "تهاني", "تغريد", "تقوى", "تالا", "تيماء",
      "ثامر", "ثروت", "ثابت", "ثائر", "ثريا", "ثناء",
      "جمال", "جلال", "جمعة", "جاسر", "جابر", "جواد", "جود", "جميلة", "جنى", "جيهان", "جهاد", "جوري", "جنة", "جورج", "جرجس",
      "حسن", "حسين", "حمزة", "حازم", "حسام", "حمدي", "حاتم", "حامد", "حكيم", "حبيبة", "حنان", "حلا", "حياة", "حورية", "حسناء", "حنين", "حفصة", "حمادة", "حسني",
      "خالد", "خليل", "خيري", "خميس", "خلود", "خديجة", "خيرية",
      "داود", "دياب", "ديما", "دينا", "دعاء", "دلال", "دنيا", "داليا", "درة", "دالية",
      "رامي", "رضا", "رائد", "رشاد", "رامز", "رياض", "رفعت", "ربيع", "رشيد", "رانيا", "رحاب", "رشا", "رنا", "رهف", "رقية", "روان", "ريم", "ريهام", "رحمة", "رزان", "رضوى", "رباب", "رغدة", "رمضان", "رءوف",
      "زياد", "زكريا", "زكي", "زين", "زهير", "زيد", "زينب", "زهرة", "زينة", "زهراء",
      "سامي", "سعيد", "سمير", "سليم", "سيف", "سالم", "سلطان", "سعد", "سامح", "سراج", "سيد", "سارة", "سلمى", "سما", "سهى", "سناء", "سوسن", "سمية", "سهام", "سعاد", "سماح", "سجى", "سندس", "سلوى", "سمر",
      "شريف", "شادي", "شهاب", "شوقي", "شاكر", "شعبان", "شيماء", "شهد", "شروق", "شيرين", "شذى", "شادية",
      "صلاح", "صالح", "صابر", "صبري", "صفوت", "صهيب", "صفاء", "صفية", "صباح", "صابرين", "صبا",
      "ضياء", "ضحى", "ضرغام",
      "طارق", "طه", "طلال", "طلعت", "طاهر", "طيبة", "طيف",
      "علي", "عمر", "عمرو", "عادل", "عماد", "عصام", "عثمان", "عبدالله", "عبدالرحمن", "عبدالعزيز", "عاصم", "عزت", "عفاف", "عبير", "عائشة", "عزة", "علياء", "عواطف", "عهد",
      "غسان", "غانم", "غالب", "غادة", "غدير", "غزل", "غالية", "غريب",
      "فادي", "فارس", "فؤاد", "فتحي", "فهد", "فيصل", "فريد", "فاروق", "فاطمة", "فرح", "فريدة", "فايزة", "فجر", "فدوى", "فوزية", "فوزي",
      "قاسم", "قصي", "قيس", "قمر", "قدري",
      "كريم", "كمال", "كامل", "كرم", "كنان", "كوثر", "كريمة", "كاميليا", "كندة", "كيرلس",
      "لؤي", "ليث", "لطفي", "لبيب", "ليلى", "لينا", "لمياء", "لبنى", "لجين", "لين", "لميس", "ليان",
      "محمد", "محمود", "مصطفى", "مراد", "مازن", "معتز", "مجدي", "منير", "ماجد", "مالك", "مؤمن", "مهند", "ممدوح", "مروان", "مريم", "منى", "مي", "مها", "منة", "ملك", "ميار", "مروة", "منار", "ميرا", "منال", "مديحة", "ميرفت", "مينا", "مرقس", "مجدة",
      "نبيل", "نادر", "نزار", "نصر", "نور", "نوح", "ناصر", "نجيب", "نشأت", "ندى", "نادية", "نهى", "نورا", "نسرين", "نيرة", "نجلاء", "نوال", "نرمين", "نهال", "نغم", "نسمة", "نهلة", "نوران",
      "هشام", "هاني", "هيثم", "همام", "هادي", "هارون", "هند", "هدى", "هبة", "هالة", "هناء", "هيام", "هاجر", "هنا",
      "وليد", "وائل", "وسيم", "وحيد", "وجدي", "وفاء", "وعد", "ولاء", "وداد", "وئام", "وسام",
      "يوسف", "يحيى", "ياسر", "يزيد", "يونس", "ياسين", "يعقوب", "يامن", "ياسمين", "يارا", "يمنى", "يسرا", "يسري"
    ],
    // What grows and is eaten: counts as a plant and as food.
    produce: [
      "تفاح", "برتقال", "موز", "عنب", "مانجو", "فراولة", "بطيخ", "شمام", "كنتالوب", "خوخ", "مشمش", "كمثرى", "كيوي", "أناناس", "رمان", "تين", "بلح", "تمر", "جوافة", "ليمون",
      "يوسفي", "جريب فروت", "كريز", "توت", "نبق", "برقوق", "قشطة", "أفوكادو", "جوز الهند", "زيتون", "خيار", "طماطم", "بطاطس", "بطاطا", "بصل", "ثوم", "جزر", "فلفل", "باذنجان", "كوسة",
      "بامية", "بسلة", "فاصوليا", "لوبيا", "فول", "عدس", "حمص", "ترمس", "ذرة", "قمح", "شعير", "أرز", "شوفان", "سبانخ", "ملوخية", "خس", "كرنب", "قرنبيط", "بروكلي", "بنجر",
      "فجل", "لفت", "خرشوف", "كرفس", "بقدونس", "كزبرة", "شبت", "نعناع", "ريحان", "زعتر", "روزماري", "ميرمية", "حلبة", "كمون", "كركم", "زنجبيل", "قرفة", "سمسم", "فول سوداني", "لوز",
      "بندق", "جوز", "فستق", "كاجو", "عين جمل", "قصب", "قلقاس", "يقطين", "قرع", "جرجير", "شمندر", "كستناء", "تمر هندي", "كركديه", "ينسون", "بابونج", "خروب", "كاكا", "بشملة", "رامبوتان",
      "جوز الطيب", "هيل", "حبهان", "قرنفل", "شطة", "بطاطا حلوة", "فلفل حار", "كرات", "سلق", "رجلة"
    ],
    plants: [
      "نخلة", "شجرة", "صبار", "ورد", "وردة", "ياسمين", "فل", "تيوليب", "زنبق", "بنفسج", "أقحوان", "عباد الشمس", "نرجس", "أوركيد", "لوتس", "خزامى", "لافندر", "جوري", "فيكس", "صنوبر",
      "سرو", "بلوط", "كافور", "سنديان", "جميز", "سنط", "بامبو", "خيزران", "صفصاف", "حور", "دفلة", "عشب", "طحلب", "سرخس", "لبلاب", "ألوفيرا", "سنبلة", "شوك", "حلفا", "بردي",
      "نيلوفر", "جهنمية", "مورينجا", "كينا", "برسيم", "نجيل", "قطن", "كتان", "شاي", "بن", "كاكاو", "زيزفون", "توليب", "غاردينيا", "ريحانة", "شجرة الأرز", "زان", "دردار", "أكاسيا", "بونسيانا",
      "صبارة", "قيقب", "سوسن", "داليا", "أضاليا", "زهرة", "وردة جوري", "ياسمين هندي", "طرخون", "إكليل الجبل", "عليق", "هيبسكس", "ضرو"
    ],
    colors: [
      "أحمر", "أزرق", "أخضر", "أصفر", "أسود", "أبيض", "برتقالي", "بنفسجي", "بني", "رمادي", "وردي", "بمبي", "موف", "لبني", "سماوي", "كحلي", "زيتي", "فيروزي", "ذهبي", "فضي",
      "بيج", "كريمي", "عنابي", "نبيتي", "خمري", "ليموني", "فوشيا", "تركواز", "أرجواني", "زهري", "قرمزي", "نيلي", "بترولي", "كاكي", "مشمشي", "سكري", "عسلي", "جملي", "فستقي", "نحاسي",
      "برونزي", "أوف وايت", "رصاصي", "لؤلؤي", "كركمي", "بصلي", "تفاحي", "خوخي", "ترابي", "طوبي", "زيتوني", "زمردي", "شامبين", "قهوائي", "بندقي", "كراميل", "فحمي", "ثلجي", "حليبي", "رملي",
      "ياقوتي", "مرجاني", "لافندر فاتح", "سلموني", "دهبي", "تبني"
    ],
    things: [
      "إبريق", "أباجورة", "أريكة", "إسفنجة", "أسطوانة", "برطمان", "بطانية", "باب", "بالون", "بطارية", "ترابيزة", "تكييف", "تلاجة", "ثريا", "جردل", "جرس", "جاكيت", "جزمة", "حزام", "حبل",
      "حجر", "حصيرة", "حوض", "خاتم", "خزانة", "دولاب", "دفتر", "درج", "دبوس", "راديو", "رف", "رخامة", "زجاجة", "زهرية", "زرار", "ستارة", "سرير", "سجادة", "سكينة", "سلم",
      "شنطة", "شباك", "شوكة", "شماعة", "صحن", "صندوق", "صنبور", "طاولة", "طبق", "طاسة", "طوبة", "عربية", "علبة", "عود", "غطاء", "غلاية", "فانوس", "فرن", "فوطة", "فازة",
      "قميص", "قفل", "كرسي", "كوب", "كنبة", "كاس", "كيس", "لمبة", "لوح", "مخدة", "مسمار", "مقص", "ملعقة", "منشفة", "مصباح", "نجفة", "نتيجة", "هاتف", "ورقة", "وعاء",
      "يافطة", "إبرة", "أسورة", "انسيال", "بيانو", "بوتاجاز", "تابلوه", "تيشيرت", "ثوب", "جلابية", "جوانتي", "حلق", "خرطوم", "خيمة", "دراجة", "دفاية", "دلو", "رموت", "زير",
      "سبورة", "سماعة", "سبحة", "سلة", "شاكوش", "شمعدان", "شراب", "صينية", "صابونة", "طرحة", "طبلة", "طربوش", "ظرف", "عجلة", "عكاز", "غربال", "غسالة", "فرشاة", "فنجان",
      "قلادة", "قدر", "قماش", "كتاب", "كشاف", "كنكة", "كورة", "لحاف", "لعبة", "لاب توب", "مروحة", "مكواة", "مسطرة", "ممحاة", "مفرش", "مكنسة", "مرآة", "مخدة سرير", "نظارة", "نقالة",
      "هدية", "هون", "وسادة", "ولاعة", "إطار", "أنبوبة", "ضمادة", "بلطة", "برواز", "ترمس", "تاج", "ثلاجة", "جاروف", "حقيبة", "خزنة", "دبلة", "رداء", "زهر", "ساعة", "شريط"
    ],
    animals: [
      "نسر", "صقر", "بومة", "غراب", "حمامة", "عصفور", "ببغاء", "بطريق", "نعامة", "طاووس", "بجعة", "إوزة", "ديك", "دجاجة", "فرخة", "كتكوت", "هدهد", "بلبل", "كناري", "فلامنجو",
      "نحلة", "نملة", "فراشة", "ذبابة", "بعوضة", "صرصار", "خنفساء", "دودة", "عنكبوت", "عقرب", "جرادة", "يعسوب", "برغوث", "سمكة", "قرش", "حوت", "دولفين", "أخطبوط", "قنديل البحر", "سلطعون",
      "كابوريا", "جمبري", "استاكوزا", "محار", "سلحفاة", "تمساح", "ضفدع", "سحلية", "حرباء", "ثعبان", "أفعى", "كوبرا", "ورل", "فأر", "جرذ", "أرنب", "سنجاب", "قنفذ", "خفاش", "كنغر",
      "كوالا", "باندا", "دب", "ذئب", "ضبع", "ثعلب", "غزال", "وعل", "أيل", "زرافة", "حمار وحشي", "فرس النهر", "وحيد القرن", "فيل", "جاموسة", "بقرة", "ثور", "عجل", "خروف", "ماعز",
      "معزة", "جمل", "ناقة", "حصان", "حمار", "بغل", "قط", "قطة", "كلب", "أسد", "نمر", "فهد", "شيتا", "قرد", "غوريلا", "شمبانزي", "ضب", "ظبي", "غنم", "بطة",
      "إبل", "بابون", "لبؤة", "ثعبان البحر", "حبار", "سردين", "بلطي", "بوري", "تونة", "سلمون", "قاروص", "دنيس", "حلزون", "قواقع", "يمامة", "سمان", "زرزور", "نورس", "لقلق", "بلشون",
      "طائر", "غرير", "حيوان الكسل", "لاما", "ألبكة", "بطة بلدي", "ديناصور", "سمندل", "فقمة", "فظ", "دب قطبي", "ابن آوى", "نمس", "وشق", "جاموس", "ثور البيسون", "حصان البحر", "نجم البحر"
    ],
    jobs: [
      "دكتور", "ممرضة", "معلم", "مذيعة", "مغني", "موسيقار", "ملحن", "شاعر", "مترجم", "مصمم", "مدير", "موظف", "سكرتيرة", "بائع", "تاجر", "بقال", "جزار", "فكهاني", "حلواني", "شيف",
      "جرسون", "سائق", "مضيفة", "قبطان", "ضابط", "عسكري", "شرطي", "حارس", "بواب", "فلاح", "صياد", "راعي", "حداد", "نقاش", "دهان", "بناء", "عامل", "كوافير", "ترزي", "صائغ",
      "جواهرجي", "ساعاتي", "إسكافي", "بيطري", "طبيب أسنان", "عالم", "باحث", "أستاذ", "ناظر", "لاعب", "حكم", "مرشد سياحي", "محاضر", "وكيل نيابة", "دبلوماسي", "سفير", "وزير", "رئيس", "عمدة", "إمام",
      "مأذون", "مؤذن", "قسيس", "كاشير", "محصل", "مندوب", "سمسار", "مقاول", "منجد", "فران", "مكوجي", "غطاس", "رجل إطفاء", "إطفائي", "فني", "تقني", "يوتيوبر", "مونتير", "مخرج", "منتج",
      "عارض أزياء", "مضيف", "ممرض", "طبيب", "مهندس", "مدرس", "محامي", "صحفي", "مبرمج", "محاسب", "خباز", "طباخ", "نجار", "سباك", "كهربائي", "ميكانيكي", "حلاق", "خياط", "طيار", "بحار",
      "جندي", "مزارع", "صيدلي", "قاضي", "مصور", "ممثل", "رسام", "كاتب", "مدرب", "جراح", "عطار", "عامل نظافة", "فرّاش", "ساعي", "حكيم", "جنايني", "بستاني", "نحال", "ديلفري", "زمار", "زجاج", "هاكر", "ثلاج"
    ],
    brands: [
      "أبل", "سامسونج", "نايكي", "أديداس", "بوما", "مرسيدس", "بي إم دبليو", "تويوتا", "هيونداي", "كيا", "نيسان", "شيفروليه", "فورد", "فيراري", "لامبورجيني", "بورشه", "أودي", "فولكس فاجن", "بيجو", "رينو",
      "فيات", "سكودا", "أوبل", "هوندا", "مازدا", "ميتسوبيشي", "سوزوكي", "جيب", "تسلا", "سوني", "إل جي", "توشيبا", "شارب", "فيليبس", "باناسونيك", "هواوي", "شاومي", "أوبو", "ريلمي", "نوكيا",
      "موتورولا", "لينوفو", "ديل", "إتش بي", "أيسر", "أسوس", "مايكروسوفت", "جوجل", "أمازون", "فيسبوك", "إنستجرام", "واتساب", "تيك توك", "يوتيوب", "نتفليكس", "سناب شات", "تويتر", "أوبر", "كريم", "بيبسي",
      "كوكاكولا", "سفن أب", "شويبس", "فانتا", "ميراندا", "ريد بول", "نسكافيه", "ليبتون", "نستله", "كادبوري", "جالاكسي", "كيت كات", "تويكس", "سنيكرز", "مارس", "باونتي", "كيندر", "نوتيلا", "ماكدونالدز", "كنتاكي",
      "بيتزا هت", "دومينوز", "برجر كينج", "هارديز", "ستاربكس", "كوستا", "دانكن", "زارا", "ديفاكتو", "شانيل", "ديور", "جوتشي", "برادا", "رولكس", "كاسيو", "سواتش", "ايكيا", "كارفور", "سبينيس", "نون",
      "فودافون", "أورانج", "اتصالات", "وي", "جهينة", "المراعي", "بخيت", "دومتي", "إيديتا", "شيبسي", "بيتي", "لمار", "أريال", "بيرسيل", "تايد", "داوني", "فيري", "كلوركس", "ديتول", "لايف بوي",
      "دوف", "لوكس", "نيفيا", "جارنييه", "لوريال", "بانتين", "هيد آند شولدرز", "كولجيت", "سيجنال", "أورال بي", "جيليت", "بامبرز", "مولفيكس", "شل", "توتال", "موبيل", "كاسترول", "بريدجستون", "ميشلان", "كانون",
      "نيكون", "جو برو", "بلايستيشن", "إكس بوكس", "نينتندو", "فيزا", "ماستركارد", "باي بال", "فوري", "إنستاباي", "ليجو", "باربي", "ديزني", "مارفل", "لاكوست", "ريبوك", "فيلا", "كونفرس", "فانز", "تمبرلاند",
      "قطونيل", "توينز", "العروسة", "الضحى", "كريستال", "سيراميكا كليوباترا", "العربي", "توشيبا العربي", "يونيون إير", "فريش", "تورنيدو", "كريازي", "إل سي وايكيكي", "أمريكان إيجل", "إتش آند إم", "ماكس", "سنتربوينت", "طلبات", "مرسول", "جوميا"
    ],
    cities: [
      "العاشر من رمضان", "السادس من أكتوبر", "أكتوبر", "الشروق", "العبور", "القاهرة الجديدة", "التجمع الخامس", "الشيخ زايد", "حلوان", "المعادي", "شبرا الخيمة", "قليوب", "بلبيس", "فاقوس", "منيا القمح", "ميت غمر", "السنبلاوين", "أجا", "طلخا", "بلقاس",
      "دكرنس", "شربين", "كفر الدوار", "إدكو", "أبو قير", "برج العرب", "العلمين", "الضبعة", "السلوم", "إسنا", "إدفو", "كوم أمبو", "نجع حمادي", "قوص", "الواسطى", "ببا", "مغاغة", "ملوي", "ديروط", "منفلوط",
      "أبو تيج", "طهطا", "جرجا", "أخميم", "البلينا", "الخانكة", "شبين القناطر", "القناطر الخيرية", "الباجور", "منوف", "أشمون", "مدينة السادات", "زفتى", "السنطة", "كفر الزيات", "بسيون", "قطور", "فوه", "دسوق", "سيدي سالم",
      "بيلا", "مطوبس", "الحسينية", "أبو كبير", "ههيا", "الصالحية", "القنطرة", "فايد", "رأس سدر", "سانت كاترين", "مرسى علم", "سفاجا", "القصير", "الجونة", "الفرافرة", "أبو سمبل", "المطرية", "المرج", "حلوان الجديدة", "الواحات",
      "أوتاوا", "برازيليا", "بوغوتا", "ليما", "سانتياغو", "كاراكاس", "هافانا", "كيتو", "لاباز", "مونتيفيديو", "أسونسيون", "كانبرا", "ولينغتون", "أوكلاند", "بيرث", "نيودلهي", "كلكتا", "بنغالور", "تشيناي", "حيدر آباد",
      "دكا", "كولومبو", "كاتماندو", "هانوي", "هو تشي منه", "بنوم بنه", "يانغون", "تايبيه", "بيونغ يانغ", "أولان باتور", "أستانا", "ألماتي", "بيشكك", "دوشنبه", "يريفان", "نيقوسيا", "فاليتا", "صوفيا", "بوخارست", "بلغراد",
      "زغرب", "ليوبليانا", "سراييفو", "تيرانا", "سكوبيه", "براتيسلافا", "فيلنيوس", "ريغا", "تالين", "مينسك", "كيشيناو", "ريكيافيك", "إدنبرة", "غلاسكو", "برمنغهام", "ليدز", "كارديف", "بلفاست", "ليون", "نيس",
      "بوردو", "تولوز", "فرانكفورت", "هامبورغ", "كولونيا", "دورتموند", "فلورنسا", "البندقية", "تورينو", "إشبيلية", "بلنسية", "مالقة", "بورتو", "روتردام", "أنتويرب", "سالزبورغ", "كراكوف", "سانت بطرسبرغ", "إزمير", "أنطاليا",
      "بورصة", "القدس", "غزة", "رام الله", "نابلس", "الخليل", "يافا", "حيفا", "عكا", "الناصرة", "أريحا", "بيت لحم", "إربد", "الزرقاء", "صيدا", "صور", "زحلة", "جبيل", "اللاذقية", "طرطوس",
      "حماة", "دير الزور", "الرقة", "كربلاء", "النجف", "كركوك", "السليمانية", "الكوفة", "سامراء", "الفلوجة", "الكويت", "حولي", "الجهراء", "الأحمدي", "الوكرة", "الريان", "الخبر", "الجبيل", "ينبع", "بريدة",
      "حائل", "نجران", "جازان", "خميس مشيط", "الأحساء", "القطيف", "رأس الخيمة", "الفجيرة", "أم القيوين", "صحار", "نزوى", "المكلا", "تعز", "الحديدة", "مأرب", "بورتسودان", "كسلا", "ود مدني", "الأبيض", "مصراتة",
      "سبها", "الزاوية", "بنزرت", "القيروان", "قابس", "عنابة", "تلمسان", "سطيف", "البليدة", "باتنة", "مكناس", "وجدة", "تطوان", "الصويرة", "العيون", "نواذيبو", "هرجيسا", "أسمرة", "كمبالا", "كيغالي",
      "دار السلام", "لوساكا", "هراري", "مابوتو", "لواندا", "كينشاسا", "برازافيل", "ياوندي", "دوالا", "أبوجا", "كانو", "أبيدجان", "باماكو", "واغادوغو", "نيامي", "إنجامينا", "بانغي", "ليبرفيل", "كوتونو", "لومي",
      "كوناكري", "فريتاون", "مونروفيا", "بانجول", "أنتاناناريفو", "بورت لويس", "موروني", "بوسطن", "سان فرانسيسكو", "لاس فيغاس", "هيوستن", "دالاس", "سياتل", "فيلادلفيا", "أتلانتا", "دنفر", "كالغاري", "ميلانو", "نابولي", "هونج كونج"
    ],
    foods: [
      "كشري", "فول مدمس", "طعمية", "فلافل", "محشي", "ممبار", "كوارع", "فتة", "رقاق", "مسقعة", "كفتة", "كباب", "شاورما", "حواوشي", "كبدة", "سجق", "مكرونة بشاميل", "بطاطس محمرة", "أرز معمر", "أم علي",
      "بسبوسة", "كنافة", "قطايف", "بقلاوة", "غريبة", "كحك", "بسكويت", "ملبن", "مهلبية", "أرز بلبن", "بليلة", "عاشورا", "سحلب", "جلاش", "فطير", "فطير مشلتت", "عيش بلدي", "عيش شامي", "بيتزا", "برجر",
      "سوشي", "تاكو", "لازانيا", "سباجيتي", "شكشوكة", "منسف", "مقلوبة", "كبسة", "مندي", "برياني", "تبولة", "فتوش", "متبل", "بابا غنوج", "مسخن", "ورق عنب", "كبة", "صفيحة", "مناقيش", "معمول",
      "لقيمات", "هريسة", "ثريد", "جريش", "مرقوق", "سليق", "مطبق", "مجبوس", "كسكسي", "طاجن", "حريرة", "بسطيلة", "شوربة عدس", "شوربة", "سلطة", "زبادي", "جبنة", "بيض", "لبن", "عسل",
      "مربى", "حلاوة طحينية", "طحينة", "مكرونة", "رز", "عيش", "خبز", "فراخ", "لحمة", "سمك", "جمبري مشوي", "كرواسون", "دونات", "كيكة", "تورتة", "آيس كريم", "جيلاتي", "شيبسي", "فشار", "ترمس مملح",
      "حمام محشي", "بط", "ديك رومي", "بفتيك", "شيش طاووق", "ستيك", "هوت دوج", "ناجتس", "بان كيك", "وافل", "بودنج", "كريم كراميل", "جاتوه", "تشيز كيك", "سندوتش", "توست", "زلابية", "لقمة القاضي", "ضاني", "ثومية"
    ]
  },
  en: {
    names: [
      "Adam", "Aaron", "Alex", "Alexander", "Andrew", "Anthony", "Arthur", "Austin", "Adrian", "Alan", "Albert", "Amy", "Anna", "Alice", "Alicia", "Amanda", "Angela", "Ava", "Abigail", "Ashley",
      "Audrey", "Aria", "Ahmed", "Ali", "Amir", "Aisha", "Ben", "Benjamin", "Brian", "Bruce", "Bradley", "Brandon", "Bob", "Bill", "Blake", "Bella", "Beth", "Bianca", "Brooke", "Bonnie",
      "Charles", "Chris", "Christopher", "Carl", "Calvin", "Caleb", "Cameron", "Connor", "Colin", "Charlie", "Chloe", "Claire", "Clara", "Caroline", "Catherine", "Charlotte", "Cindy", "Crystal", "David", "Daniel",
      "Dylan", "Derek", "Dennis", "Dean", "Dominic", "Diana", "Donna", "Daisy", "Deborah", "Diane", "Dalia", "Dina", "Edward", "Eric", "Ethan", "Evan", "Elijah", "Eli", "Emma", "Emily",
      "Ella", "Eva", "Elena", "Elizabeth", "Eleanor", "Erica", "Eden", "Frank", "Fred", "Felix", "Finn", "Francis", "Faisal", "Fiona", "Freya", "Fatima", "Faith", "Felicity", "George", "Gary",
      "Gavin", "Gabriel", "Grant", "Gregory", "Grace", "Gemma", "Georgia", "Gina", "Gloria", "Harry", "Henry", "Hugo", "Howard", "Hassan", "Hana", "Hannah", "Helen", "Hazel", "Holly", "Heather",
      "Hailey", "Hamza", "Isaac", "Ian", "Ivan", "Ibrahim", "Isabella", "Isla", "Ivy", "Irene", "Iris", "Ingrid", "Iman", "James", "John", "Jack", "Jacob", "Jason", "Jeremy", "Joseph",
      "Joshua", "Justin", "Jordan", "Julian", "Jane", "Julia", "Jessica", "Jennifer", "Jasmine", "Joy", "Judy", "Kevin", "Kyle", "Keith", "Kenneth", "Karim", "Kate", "Katie", "Karen", "Kelly",
      "Kim", "Kylie", "Khaled", "Liam", "Leo", "Lucas", "Luke", "Louis", "Logan", "Lewis", "Laura", "Lily", "Lucy", "Linda", "Lisa", "Leah", "Layla", "Lauren", "Lina", "Michael",
      "Mark", "Matthew", "Max", "Martin", "Mason", "Mohamed", "Mustafa", "Mary", "Maria", "Mia", "Mila", "Megan", "Michelle", "Molly", "Maya", "Mona", "Mariam", "Nathan", "Nicholas", "Noah",
      "Neil", "Nick", "Nader", "Nour", "Natalie", "Nancy", "Nina", "Nora", "Nadia", "Naomi", "Nicole", "Oliver", "Oscar", "Owen", "Omar", "Otto", "Olivia", "Olga", "Peter", "Paul",
      "Patrick", "Philip", "Parker", "Penny", "Paula", "Phoebe", "Pamela", "Robert", "Richard", "Ryan", "Ray", "Roger", "Ross", "Rami", "Rachel", "Rebecca", "Rose", "Ruby", "Rita", "Rania",
      "Rana", "Reem", "Sam", "Samuel", "Scott", "Sean", "Simon", "Steven", "Stephen", "Sami", "Sarah", "Sara", "Sophia", "Sophie", "Stella", "Susan", "Sandra", "Sally", "Salma", "Thomas",
      "Tom", "Tim", "Tony", "Tyler", "Theo", "Tariq", "Tamer", "Taylor", "Tina", "Tracy", "Tessa", "Tara", "Victor", "Vincent", "Vivian", "Valerie", "Vanessa", "Victoria", "Vera", "Violet",
      "William", "Walter", "Wayne", "Wesley", "Will", "Waleed", "Wendy", "Willow", "Whitney", "Youssef", "Yasmin", "Zain", "Zeina", "Mostafa", "Mahmoud", "Hossam", "Heba", "Dana", "Karma", "Malak"
    ],
    produce: [
      "Apple", "Apricot", "Avocado", "Banana", "Blackberry", "Blueberry", "Cherry", "Coconut", "Cranberry", "Date", "Dragon fruit", "Fig", "Grape", "Grapefruit", "Guava", "Kiwi", "Lemon", "Lime", "Lychee", "Mango",
      "Melon", "Nectarine", "Orange", "Papaya", "Passion fruit", "Peach", "Pear", "Pineapple", "Plum", "Pomegranate", "Raspberry", "Strawberry", "Tangerine", "Watermelon", "Artichoke", "Asparagus", "Beetroot", "Broccoli", "Brussels sprouts", "Cabbage",
      "Carrot", "Cauliflower", "Celery", "Chard", "Chickpea", "Corn", "Cucumber", "Eggplant", "Garlic", "Ginger", "Kale", "Leek", "Lentil", "Lettuce", "Mushroom", "Okra", "Olive", "Onion", "Parsnip", "Pea",
      "Pepper", "Potato", "Pumpkin", "Radish", "Rice", "Rye", "Spinach", "Squash", "Sweet potato", "Tomato", "Turnip", "Wheat", "Barley", "Oat", "Bean", "Soybean", "Peanut", "Almond", "Walnut", "Hazelnut",
      "Pistachio", "Cashew", "Chestnut", "Basil", "Mint", "Parsley", "Coriander", "Dill", "Rosemary", "Thyme", "Sage", "Oregano", "Cinnamon", "Cumin", "Turmeric", "Vanilla", "Sesame", "Zucchini", "Cardamom", "Clove",
      "Chili", "Kumquat", "Mandarin", "Quince", "Rhubarb", "Tamarind", "Yam", "Grain", "Millet", "Macadamia"
    ],
    plants: [
      "Sunflower", "Rose", "Tulip", "Lily", "Daisy", "Orchid", "Jasmine", "Lotus", "Poppy", "Violet", "Iris", "Daffodil", "Carnation", "Marigold", "Magnolia", "Hibiscus", "Dandelion", "Lilac", "Peony", "Begonia",
      "Cactus", "Aloe", "Bamboo", "Fern", "Moss", "Ivy", "Clover", "Grass", "Oak", "Pine", "Palm", "Maple", "Birch", "Cedar", "Cypress", "Willow", "Elm", "Ash", "Baobab", "Eucalyptus",
      "Fir", "Spruce", "Sequoia", "Acacia", "Mulberry", "Cotton", "Flax", "Tea", "Coffee", "Cocoa", "Sugarcane", "Nettle", "Thistle", "Heather", "Holly", "Juniper", "Bougainvillea", "Geranium", "Gardenia", "Honeysuckle",
      "Wisteria", "Water lily", "Verbena", "Vine", "Lavender", "Chamomile", "Hyacinth", "Jacaranda", "Laurel", "Lupin", "Mimosa", "Oleander", "Primrose", "Reed", "Seaweed", "Shrub", "Snowdrop", "Tree"
    ],
    colors: [
      "Red", "Blue", "Green", "Yellow", "Black", "White", "Orange", "Purple", "Pink", "Brown", "Grey", "Gray", "Beige", "Cream", "Gold", "Silver", "Bronze", "Copper", "Maroon", "Navy",
      "Turquoise", "Teal", "Cyan", "Magenta", "Lavender", "Lilac", "Violet", "Indigo", "Crimson", "Scarlet", "Burgundy", "Olive", "Lime", "Mint", "Emerald", "Jade", "Khaki", "Tan", "Chocolate", "Coffee",
      "Caramel", "Honey", "Amber", "Coral", "Salmon", "Peach", "Apricot", "Rose", "Ruby", "Cherry", "Fuchsia", "Plum", "Mauve", "Sky blue", "Baby blue", "Royal blue", "Aqua", "Azure", "Charcoal", "Ivory",
      "Pearl", "Champagne", "Mustard", "Lemon", "Sand", "Rust", "Wine", "Denim", "Slate", "Sapphire", "Periwinkle", "Taupe", "Umber", "Vermilion", "Off white", "Ochre", "Wheat", "Walnut"
    ],
    things: [
      "Alarm clock", "Anchor", "Apron", "Armchair", "Axe", "Backpack", "Bag", "Ball", "Balloon", "Basket", "Bat", "Battery", "Bed", "Bell", "Belt", "Bench", "Bicycle", "Blanket", "Book", "Bottle",
      "Bowl", "Box", "Bracelet", "Broom", "Brush", "Bucket", "Button", "Cabinet", "Calculator", "Calendar", "Camera", "Candle", "Cap", "Car", "Card", "Carpet", "Chain", "Chair", "Charger", "Clock",
      "Coat", "Comb", "Computer", "Cup", "Curtain", "Cushion", "Desk", "Dice", "Dish", "Doll", "Door", "Drawer", "Drum", "Earring", "Envelope", "Eraser", "Easel", "Fan", "Fork", "Frame",
      "Fridge", "Glass", "Glasses", "Glove", "Guitar", "Hammer", "Hanger", "Hat", "Headphones", "Helmet", "Hook", "Iron", "Jacket", "Jar", "Jug", "Kettle", "Key", "Keyboard", "Kite", "Knife",
      "Ladder", "Lamp", "Laptop", "Lock", "Magnet", "Map", "Marker", "Mask", "Match", "Mattress", "Microphone", "Microwave", "Mirror", "Mop", "Mouse", "Mug", "Nail", "Napkin", "Necklace", "Needle",
      "Notebook", "Oar", "Ornament", "Oven", "Paintbrush", "Pan", "Paper", "Pen", "Pencil", "Phone", "Piano", "Picture", "Pillow", "Pin", "Plate", "Pliers", "Pot", "Purse", "Racket", "Radiator",
      "Radio", "Rake", "Remote", "Ring", "Rope", "Rug", "Ruler", "Saw", "Scarf", "Scissors", "Screw", "Shelf", "Shirt", "Shoe", "Shovel", "Sink", "Sock", "Sofa", "Spoon", "Stapler",
      "Stool", "Suitcase", "Sunglasses", "Table", "Tablet", "Tap", "Teapot", "Telescope", "Television", "Tent", "Tie", "Tissue", "Toaster", "Toothbrush", "Toothpaste", "Torch", "Towel", "Toy", "Tray", "Trophy",
      "Trumpet", "Umbrella", "Vacuum cleaner", "Vase", "Violin", "Wallet", "Wardrobe", "Watch", "Whistle", "Window", "Wire", "Wrench", "Zipper", "Anvil", "Bin", "Bulb", "Candlestick", "Crayon", "Crown", "Dress"
    ],
    jobs: [
      "Accountant", "Actor", "Actress", "Architect", "Artist", "Astronaut", "Athlete", "Author", "Baker", "Banker", "Barber", "Biologist", "Builder", "Butcher", "Captain", "Carpenter", "Cashier", "Chef", "Chemist", "Cleaner",
      "Coach", "Cook", "Dancer", "Dentist", "Designer", "Detective", "Developer", "Director", "Doctor", "Driver", "Economist", "Editor", "Electrician", "Engineer", "Farmer", "Firefighter", "Fisherman", "Florist", "Gardener", "Guard",
      "Guide", "Hairdresser", "Historian", "Host", "Inspector", "Instructor", "Interpreter", "Janitor", "Jeweller", "Journalist", "Judge", "Lawyer", "Lecturer", "Librarian", "Lifeguard", "Mechanic", "Manager", "Mathematician", "Model", "Musician",
      "Nurse", "Nanny", "Officer", "Optician", "Painter", "Paramedic", "Pharmacist", "Photographer", "Physicist", "Pilot", "Plumber", "Poet", "Police officer", "Politician", "Postman", "Presenter", "Producer", "Professor", "Programmer", "Psychologist",
      "Receptionist", "Reporter", "Researcher", "Sailor", "Salesman", "Scientist", "Secretary", "Singer", "Soldier", "Surgeon", "Tailor", "Taxi driver", "Teacher", "Technician", "Therapist", "Translator", "Tutor", "Vet", "Veterinarian", "Waiter",
      "Waitress", "Welder", "Writer", "Web designer", "Zookeeper", "Referee", "Ranger", "Surveyor", "Sculptor", "Shepherd", "Shopkeeper", "Diplomat", "Ambassador", "Minister", "Mayor", "Priest", "Imam", "Courier", "Cameraman", "Composer",
      "Conductor", "Curator", "Butler", "Barista", "Blacksmith", "Bodyguard", "Broker", "Vendor", "Violinist", "Web developer", "Window cleaner", "Air hostess", "Flight attendant", "Beekeeper", "Bus driver", "Dietitian", "Diver", "Fashion designer", "Goalkeeper", "Weatherman", "Kindergarten teacher", "Kitchen porter"
    ],
    brands: [
      "Adidas", "Apple", "Amazon", "Audi", "Asus", "Acer", "BMW", "Bentley", "Burberry", "Burger King", "Cadbury", "Canon", "Casio", "Chanel", "Chevrolet", "Coca-Cola", "Colgate", "Costa", "Dell", "Disney",
      "Dior", "Domino's", "Dove", "Ducati", "eBay", "Ferrari", "Facebook", "Fanta", "Fiat", "Ford", "Fila", "Gillette", "Google", "Gucci", "GoPro", "H&M", "Heinz", "Honda", "HP", "Huawei",
      "Hyundai", "IKEA", "Instagram", "Intel", "Jaguar", "Jeep", "KFC", "Kia", "KitKat", "Kellogg's", "Lamborghini", "Lego", "Lenovo", "Levi's", "LG", "Lipton", "L'Oreal", "Louis Vuitton", "Lacoste", "Mastercard",
      "Mazda", "McDonald's", "Mercedes", "Microsoft", "Mitsubishi", "Motorola", "Nescafe", "Nestle", "Netflix", "Nike", "Nikon", "Nintendo", "Nissan", "Nivea", "Nokia", "Nutella", "Oppo", "Oreo", "Orange", "Oral-B",
      "Omega", "Opel", "Pampers", "Panasonic", "PayPal", "Pepsi", "Peugeot", "Philips", "Pizza Hut", "PlayStation", "Porsche", "Prada", "Puma", "Pantene", "Persil", "Pringles", "Ray-Ban", "Red Bull", "Reebok", "Renault",
      "Rolex", "Samsung", "Seiko", "Sharp", "Shell", "Skoda", "Snapchat", "Sony", "Sprite", "Starbucks", "Subway", "Suzuki", "Swatch", "Tesla", "TikTok", "Toshiba", "Toyota", "Twix", "Tide", "Twitter",
      "Uber", "Under Armour", "Unilever", "Vans", "Versace", "Visa", "Vodafone", "Volkswagen", "Volvo", "WhatsApp", "Whirlpool", "Walmart", "Xiaomi", "YouTube", "Zara", "Converse", "Hermes", "Lexus", "Mini", "Rolls-Royce"
    ],
    animals: [
      "Aardvark", "Alligator", "Alpaca", "Ant", "Anteater", "Antelope", "Armadillo", "Baboon", "Badger", "Bat", "Bear", "Beaver", "Bee", "Beetle", "Bison", "Boar", "Buffalo", "Butterfly", "Camel", "Canary",
      "Caterpillar", "Cheetah", "Chicken", "Chimpanzee", "Cobra", "Cockroach", "Cod", "Crab", "Crane", "Cricket", "Crocodile", "Crow", "Deer", "Dingo", "Dolphin", "Donkey", "Dove", "Dragonfly", "Duck", "Eagle",
      "Eel", "Elephant", "Elk", "Emu", "Falcon", "Ferret", "Flamingo", "Fly", "Fox", "Frog", "Gazelle", "Gecko", "Giraffe", "Goat", "Goldfish", "Goose", "Gorilla", "Grasshopper", "Hamster", "Hare",
      "Hawk", "Hedgehog", "Heron", "Hippo", "Hippopotamus", "Horse", "Hummingbird", "Hyena", "Iguana", "Impala", "Jackal", "Jaguar", "Jellyfish", "Kangaroo", "Koala", "Kingfisher", "Ladybug", "Lamb", "Lemur", "Leopard",
      "Lion", "Lizard", "Llama", "Lobster", "Lynx", "Macaw", "Meerkat", "Mole", "Monkey", "Moose", "Mosquito", "Moth", "Mouse", "Mule", "Newt", "Nightingale", "Octopus", "Ostrich", "Otter", "Owl",
      "Ox", "Panda", "Panther", "Parrot", "Peacock", "Pelican", "Penguin", "Pig", "Pigeon", "Platypus", "Polar bear", "Porcupine", "Puma", "Rabbit", "Raccoon", "Rat", "Raven", "Reindeer", "Rhino", "Rhinoceros",
      "Robin", "Rooster", "Salmon", "Scorpion", "Seagull", "Seal", "Shark", "Sheep", "Shrimp", "Skunk", "Sloth", "Snail", "Snake", "Sparrow", "Spider", "Squid", "Squirrel", "Starfish", "Stork", "Swan",
      "Tiger", "Toad", "Tortoise", "Toucan", "Trout", "Tuna", "Turkey", "Turtle", "Vulture", "Viper", "Walrus", "Wasp", "Weasel", "Whale", "Wolf", "Woodpecker", "Worm", "Warthog", "Wombat", "Zebra"
    ],
    foods: [
      "Bagel", "Biryani", "Brownie", "Burrito", "Butter", "Cake", "Cereal", "Cheese", "Cheesecake", "Chips", "Chocolate", "Cookie", "Croissant", "Cupcake", "Curry", "Donut", "Dumpling", "Egg", "Falafel", "Fries",
      "Granola", "Hamburger", "Honey", "Hummus", "Jam", "Jelly", "Kebab", "Ketchup", "Lasagna", "Lentil soup", "Muffin", "Noodles", "Nuggets", "Oatmeal", "Omelette", "Pancake", "Pasta", "Pie", "Pizza", "Popcorn",
      "Porridge", "Pretzel", "Pudding", "Ramen", "Ravioli", "Salad", "Sandwich", "Sausage", "Shawarma", "Soup", "Spaghetti", "Steak", "Stew", "Sushi", "Taco", "Toast", "Tortilla", "Waffle", "Yogurt", "Koshari",
      "Molokhia", "Kofta", "Tabbouleh", "Fattoush", "Mansaf", "Kabsa", "Couscous", "Tajine", "Bread", "Milk", "Juice", "Lemonade", "Smoothie", "Milkshake", "Biscuit", "Custard", "Gingerbread", "Meatball", "Mashed potatoes", "Nachos",
      "Quiche", "Risotto", "Samosa", "Scone", "Tiramisu", "Vermicelli", "Wrap", "Wings", "Fish", "Chicken nuggets", "Beef", "Lamb chops", "Rice pudding", "Doughnut", "Crepe", "Churros", "Macaroni", "Noodle soup", "Pita", "Veal"
    ],
    countries: ["USA", "UK", "UAE", "America", "England", "Scotland", "Wales", "Holland", "Korea", "Congo"],
    cities: [
      "Abu Dhabi", "Accra", "Addis Ababa", "Alexandria", "Algiers", "Amman", "Amsterdam", "Ankara", "Athens", "Atlanta", "Auckland", "Baghdad", "Bangkok", "Barcelona", "Basra", "Beijing", "Beirut", "Belgrade", "Berlin", "Bogota",
      "Boston", "Brasilia", "Brussels", "Bucharest", "Budapest", "Buenos Aires", "Cairo", "Calgary", "Canberra", "Cape Town", "Caracas", "Casablanca", "Chicago", "Copenhagen", "Damascus", "Dallas", "Delhi", "Denver", "Doha", "Dubai",
      "Dublin", "Edinburgh", "Florence", "Frankfurt", "Geneva", "Giza", "Glasgow", "Hamburg", "Hanoi", "Havana", "Helsinki", "Hong Kong", "Houston", "Istanbul", "Jakarta", "Jeddah", "Jerusalem", "Johannesburg", "Kabul", "Karachi",
      "Khartoum", "Kyiv", "Kiev", "Kuala Lumpur", "Kuwait City", "Lagos", "Lahore", "Las Vegas", "Lima", "Lisbon", "Liverpool", "London", "Los Angeles", "Luxor", "Lyon", "Madrid", "Manchester", "Manila", "Marrakesh", "Marseille",
      "Mecca", "Medina", "Melbourne", "Mexico City", "Miami", "Milan", "Montreal", "Moscow", "Mumbai", "Munich", "Muscat", "Nairobi", "Naples", "New Delhi", "New York", "Nice", "Osaka", "Oslo", "Ottawa", "Paris",
      "Perth", "Philadelphia", "Prague", "Rabat", "Rio de Janeiro", "Riyadh", "Rome", "Rotterdam", "San Francisco", "Santiago", "Sao Paulo", "Seattle", "Seoul", "Shanghai", "Sharjah", "Singapore", "Stockholm", "Sydney", "Taipei", "Tangier",
      "Tehran", "Tokyo", "Toronto", "Tripoli", "Tunis", "Valencia", "Vancouver", "Venice", "Vienna", "Warsaw", "Washington", "Wellington", "Aswan", "Hurghada", "Sharm El Sheikh", "Mansoura", "Tanta", "Port Said", "Suez", "Ismailia",
      "Zagazig", "Asyut", "Minya", "Faiyum", "Damietta", "Marsa Matruh", "Dahab", "Siwa", "Birmingham", "Bristol", "Leeds", "Oxford", "Cambridge", "Porto", "Seville", "Turin", "Verona", "Zurich", "Krakow", "Salzburg",
      "Antwerp", "Bordeaux", "Toulouse", "Dortmund", "Cologne", "Valletta", "Nicosia", "Reykjavik", "Tbilisi", "Baku", "Yerevan", "Tashkent", "Almaty", "Astana", "Dhaka", "Colombo", "Kathmandu", "Yangon", "Phnom Penh", "Bangalore",
      "Chennai", "Kolkata", "Hyderabad", "Pune", "Islamabad", "Peshawar", "Isfahan", "Mashhad", "Tabriz", "Izmir", "Antalya", "Bursa", "Kigali", "Kampala", "Dar es Salaam", "Lusaka", "Harare", "Luanda", "Kinshasa", "Abuja",
      "Dakar", "Bamako", "Detroit", "Orlando", "Phoenix", "San Diego", "Austin", "Nashville", "Quebec", "Vladivostok"
    ]
  }
};

/* --- A filled box ---------------------------------------------------------- */

/** The letters people spell the same word with (the rooms' foldArabicLetters, repeated here for the page). */
const stopLetterFold = (text) => String(text || '').toLowerCase()
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك');

/** One spelling for comparing answers: case, diacritics, hamza forms, the article. */
const foldStopAnswer = (text, lang, letter) => {
  const raw = String(text || '').trim();
  let out = stopLetterFold(raw)
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  // The definite article is not the initial: "الأسد" is an أ word, "the sea" an S word.
  // In a round on ا itself a bare "ال…" stays: ألمانيا and إلهام are ا words, and typed
  // without the hamza they look exactly like an article. Only "ال" + a hamza letter
  // (الأسد, الإمارات) is an article for certain there.
  const article = lang === 'ar' && out.length > 3 && out.indexOf('ال') === 0
    && (letter !== 'ا' || /^ال[أإآ]/.test(raw));
  if (article) out = out.slice(2);
  if (lang === 'en' && out.indexOf('the ') === 0) out = out.slice(4);
  return out;
};

/** Whether an answer fills its box: two letters or more, starting with the round's letter. */
const stopAnswerFits = (text, lang, roundLetter) => {
  const letter = foldStopAnswer(roundLetter, lang);
  const f = foldStopAnswer(text, lang, letter);
  return f.length >= 2 && f.charAt(0) === letter;
};

/* --- The dictionary --------------------------------------------------------- */

/** Letters only, the way the dictionary compares. */
const stopDictFold = (text) => stopLetterFold(text).replace(/[^\p{L}\p{N}]/gu, '');

/** A word with and without its article, so الأسد finds أسد and the reverse. */
const stopDictForms = (text) => {
  const f = stopDictFold(text);
  const forms = [f];
  if (f.indexOf('ال') === 0 && f.length >= 4) forms.push(f.slice(2));
  if (f.indexOf('the') === 0 && f.length >= 5) forms.push(f.slice(3));
  return forms;
};

const STOP_DICT_CACHE = {};

/** Every word the dictionary knows for a category in a language, folded. */
const stopDictionary = (lang, cat) => {
  const L = lang === 'en' ? 'en' : 'ar';
  const key = L + ':' + cat;
  if (STOP_DICT_CACHE[key]) return STOP_DICT_CACHE[key];
  const own = STOP_WORDS[L] || {};
  const spy = typeof SPY_WORDS !== 'undefined' ? SPY_WORDS : {};
  const monkey = typeof MONKEY_LISTS !== 'undefined' ? (MONKEY_LISTS[L] || {}) : {};
  const ar = L === 'ar';
  const sources = {
    name: [own.names],
    animal: [own.animals, monkey.animals, ar ? spy['حيوانات'] : null],
    plant: [own.produce, own.plants],
    thing: [own.things, ar ? spy['أشياء'] : null, ar ? spy['آلات موسيقية'] : null, ar ? spy['مواصلات'] : null],
    country: [monkey.countries, own.countries],
    city: [monkey.cities, own.cities],
    food: [own.foods, own.produce, monkey.foods, ar ? spy['أكلات'] : null],
    brand: [own.brands, ar ? spy['ماركات ( براندات )'] : null],
    job: [own.jobs, ar ? spy['مهن'] : null],
    color: [own.colors]
  }[cat];
  if (!sources) return null;
  const set = new Set();
  sources.forEach((list) => (list || []).forEach((w) => stopDictForms(w).forEach((f) => { if (f.length >= 2) set.add(f); })));
  STOP_DICT_CACHE[key] = set;
  return set;
};

/** Whether two folded words are at most one letter apart (one added, dropped or changed). */
const stopOneApart = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

/**
 * Whether the dictionary knows this answer for its category: true, false, or
 * null for a category with no dictionary. Forgives the article, one wrong
 * letter in a word of five letters or more, and an English plural.
 */
const stopWordKnown = (lang, cat, text) => {
  const dict = stopDictionary(lang, cat);
  if (!dict) return null;
  const forms = stopDictForms(text).filter((f) => f.length >= 2);
  if (!forms.length) return false;
  if (forms.some((f) => dict.has(f))) return true;
  if (lang === 'en') {
    const f = forms[0];
    if (/ies$/.test(f) && dict.has(f.slice(0, -3) + 'y')) return true;
    if (/es$/.test(f) && dict.has(f.slice(0, -2))) return true;
    if (/s$/.test(f) && dict.has(f.slice(0, -1))) return true;
  }
  for (const f of forms) {
    if (f.length < 5) continue;
    for (const w of dict) if (w.charAt(0) === f.charAt(0) && stopOneApart(w, f)) return true;
  }
  return false;
};
