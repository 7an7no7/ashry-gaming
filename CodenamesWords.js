/* ============================================================================
   CODENAMES WORD LISTS
   ----------------------------------------------------------------------------
   Lives on the server next to the key-card generator, so a board can be dealt
   without the client ever holding the deck.

   Chosen the way Codenames words have to be: concrete, everyday, and ideally
   carrying more than one sense so a clue can bridge two of them. The Arabic set
   leans on words an Egyptian/Levantine table would use daily rather than formal
   MSA, to match the rest of the app.
   ========================================================================= */

const CODENAMES_WORDS = {
  ar: [
    // بيت وأدوات
    'باب', 'شباك', 'مفتاح', 'كرسي', 'ترابيزة', 'سرير', 'مرآة', 'ساعة',
    'شمعة', 'مفتاح نور', 'ثلاجة', 'فرن', 'مكنسة', 'سلم', 'سطح', 'بلكونة',
    'حبل', 'مقص', 'إبرة', 'خيط', 'صابون', 'أسفلت', 'فرشاة', 'مشط',
    'محفظة', 'شنطة', 'مظلة', 'نظارة', 'خاتم', 'ساعة يد',

    // أكل وشرب
    'عيش', 'جبنة', 'عسل', 'ملح', 'سكر', 'فلفل', 'ليمون', 'بصل',
    'ثوم', 'زيت', 'شاي', 'قهوة', 'لبن', 'بيض', 'تفاح', 'موز',
    'بطيخ', 'عنب', 'كانون', 'مكسرات', 'كشري', 'فول', 'طعمية', 'شاورما',
    'بيتزا', 'طشت', 'شوكولاتة', 'آيس كريم',

    // حيوانات
    'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'ثعلب', 'ذئب', 'دب',
    'قطة', 'كلب', 'حصان', 'حمار', 'جمل', 'خروف', 'بقرة', 'فرو',
    'نسر', 'صقر', 'بومة', 'غراب', 'حمامة', 'سمكة', 'قرش', 'حوت',
    'دلفين', 'أخطبوط', 'سلحفاة', 'تمساح', 'ثعبان', 'عقرب', 'نحلة', 'نملة',
    'عنكبوت', 'فراشة', 'بطريق', 'كنغر',

    // أماكن
    'مدرسة', 'جامعة', 'مستشفى', 'مطار', 'محطة', 'ميناء', 'سوق', 'مول',
    'مطعم', 'فندق', 'بنك', 'متحف', 'مكتبة', 'سينما', 'مسرح', 'ملعب',
    'ريشة', 'شاطئ', 'صحراء', 'جبل', 'غابة', 'كهف', 'جزيرة', 'نهر',
    'بحر', 'شلال', 'قلعة', 'قصر', 'برج', 'عش', 'نفق', 'سجن',

    // مواصلات
    'زير', 'أتوبيس', 'قطار', 'مترو', 'طيارة', 'صاروخ', 'مركب', 'غواصة',
    'دراجة', 'موتوسيكل', 'تاكسي', 'إسعاف', 'شاحنة', 'عربية كارو',

    // مهن وناس
    'قلة', 'مهندس', 'مدرس', 'طباخ', 'حلاق', 'نجار', 'سباك', 'كهربائي',
    'طيار', 'شرطي', 'محامي', 'قاضي', 'ممثل', 'مغني', 'رسام', 'كاتب',
    'لاعب', 'حكم', 'جاسوس', 'حرامي', 'ملك', 'ملكة', 'فارس', 'عروسة',

    // طبيعة وكون
    'شمس', 'قمر', 'نجمة', 'سحابة', 'مطر', 'ثلج', 'برق', 'رعد',
    'ريح', 'نار', 'حدوة', 'تراب', 'رمل', 'صخرة', 'شجرة', 'وردة',
    'ورقة', 'جذر', 'بذرة', 'ظل', 'قوس قزح', 'زلزال', 'بركان', 'فضاء',

    // جسم
    'عين', 'أذن', 'أنف', 'فم', 'يد', 'رجل', 'قلب', 'فيونكة',
    'سن', 'شعر', 'ظهر', 'دم',

    // أشياء ومفاهيم
    'كتاب', 'قلم', 'ورق', 'خريطة', 'بوصلة', 'تلسكوب', 'ميكروسكوب', 'كاميرا',
    'تليفون', 'كمبيوتر', 'شاشة', 'بطارية', 'مروحة', 'مصباح', 'جرس', 'طبل',
    'جيتار', 'بيانو', 'كمان', 'ناي', 'صنارة', 'شبكة', 'سهم', 'قوس',
    'سيف', 'درع', 'مسدس', 'قنبلة', 'صندوق', 'قفل', 'سلسلة', 'مسمار',
    'سماعة دكتور', 'منشار', 'ميزان', 'سلة', 'كوب', 'طبق', 'ملعقة', 'شوكة',
    'سكين', 'قدر', 'إبريق', 'زجاجة',

    // ألعاب ورياضة
    'لجام', 'شطرنج', 'دومينو', 'كمسري', 'نرد', 'لغز', 'سباق', 'بطولة',
    'كأس', 'ميدالية', 'هدف', 'خطة', 'فخ', 'سر', 'كنز', 'وقت', 'حلم', 'ذكرى', 'صوت', 'لون', 'رقم', 'حرف', 'اسم',
    'عيد', 'هدية', 'رسالة', 'طرد', 'تذكرة', 'بطاقة', 'ختم',

    // إضافات جديدة (ملابس، مواد، طبيعة، أماكن، كائنات، نباتات، أدوات، ومفاهيم)
    'منقار', 'بدلة', 'فستان', 'قميص', 'ديل', 'حزام', 'قرن', 'شراب',
    'طاقية', 'وابور', 'طرحة', 'عباية', 'جوانتي', 'حلق', 'إسورة',
    'تاج', 'دبوس', 'زرار', 'سوستة', 'كوتشي', 'نعل', 'جيب',
    'ذهب', 'فضة', 'نحاس', 'حديد', 'خشب', 'زجاج', 'بلاستيك', 'قطن',
    'حرير', 'جلد', 'صوف', 'رخام', 'طوب', 'إسمنت', 'طين', 'فحم',
    'بترول', 'غاز', 'ماس', 'ياقوت', 'لؤلؤ', 'صلصال', 'شمع', 'مطاط',
    'وادي', 'واحة', 'تل', 'هضبة', 'خليج', 'شبه جزيرة', 'باركيه', 'محيط',
    'بركة', 'نبع', 'مستنقع', 'شيال', 'جليد', 'ضباب', 'ندى', 'عاصفة',
    'إعصار', 'شهاب', 'نيزك', 'مذنب', 'كسوف', 'خسوف', 'أفق', 'فجر',
    'غروب', 'نسيم', 'موجة', 'فيضان', 'مد', 'جزر', 'جناح', 'كنيسة', 'معبد', 'هرم', 'مقبرة', 'مصنع', 'مزرعة', 'طاحونة',
    'سد', 'صيدلية', 'مخبز', 'صالون', 'ورشة', 'استوديو', 'سيرك', 'حديقة حيوان',
    'بلاج', 'موقف', 'جراج', 'كوخ', 'خيمة', 'فيلا', 'شقة',
    'سفارة', 'محكمة', 'مستودع', 'ممر', 'غزال', 'فهد',
    'ضبع', 'سنجاب', 'قنفذ', 'ثور', 'قشرة', 'طاووس', 'بجع',
    'لقلق', 'حداية', 'كناري', 'ببغاء', 'نعامة', 'سمان', 'حرباء', 'ضب',
    'سحلية', 'جمبري', 'كابوريا', 'قنديل', 'نجم بحر', 'صرصار', 'نواة',
    'جراد', 'دودة', 'حلزون', 'خنفساء', 'شيش', 'دبور', 'نخلة', 'صبار',
    'ياسمين', 'فل', 'ريحان', 'نعناع', 'زعتر', 'قرفة', 'زنجبيل', 'قرنفل',
    'قمح', 'شعير', 'ذرة', 'كاوتش', 'عدس', 'حمص', 'فاصوليا', 'زريبة',
    'بطاطس', 'طماطم', 'خيار', 'كوسة', 'باذنجان', 'تين', 'رمان', 'برتقال',
    'مانجو', 'فراولة', 'خوخ', 'مشمش', 'كريز', 'مفتاح إنجليزي', 'مفك', 'كماشة',
    'شاكوش', 'سندان', 'فأس', 'مجرفة', 'خرطوم', 'رشاش', 'ولاعة',
    'كبريت', 'فانوس', 'كشاف', 'عدسة', 'ناب', 'ترمومتر', 'سقالة',
    'سماعة', 'ميكروفون', 'راديو', 'تلفزيون', 'طابعة', 'شاحن', 'كابل',
    'كمامة', 'محرك', 'ترس', 'صامولة', 'طاسة', 'صينية', 'باسبور',
    'فنجان', 'مج', 'ترمس', 'مبشرة', 'مصفاة', 'عصارة',
    'خلاط', 'غلاية', 'شواية', 'فتاحة', 'رمح', 'خنجر', 'خوذة', 'مدفع', 'دبابة', 'رصاصة', 'لغم', 'طوربيد', 'صفارة', 'حاجز', 'ميكانو', 'يويو', 'دمية',
    'طيارة ورق', 'بلية', 'مسرح عرائس', 'مكوجي', 'زحليقة', 'لوحة', 'تمثال', 'نحت',
    'برواز', 'دف', 'أكورديون', 'صدى', 'بريق',
    'شعاع', 'شعلة', 'رماد', 'دخان', 'سراب', 'بصمة', 'أثر', 'علامة',
    'شعار', 'راية', 'وسام', 'شهادة', 'عملة', 'شيك', 'فاتورة', 'توقيع', 'عقد', 'طابع', 'عنوان',
    'فيلم', 'قناع', 'شبح', 'ساحرة', 'تنين', 'ديناصور',
    'قرصان', 'نينجا', 'روبوت', 'مومياء', 'فرعون', 'جني',
    'عفريت', 'أسطورة', 'بطل', 'شرير', 'محقق', 'سجين',
    'حارس', 'ملاك', 'قبقاب', 'مسطرة', 'سبورة', 'طباشير',
    'فصل', 'امتحان', 'درجة', 'قاموس', 'أطلس', 'حلبة',
    'مضرب', 'غواص', 'قبطان', 'بحار', 'مرساة', 'شراع',
    'دفة', 'مأذون', 'سور', 'خندق', 'بئر', 'نافورة',
    'ملاهي', 'بالون', 'كهرباء', 'مغناطيس', 'ليزر', 'رادار',
    'كوكب', 'مجرة', 'مكوك', 'شبشب', 'كعب', 'جرح',
    'دواء', 'حقنة', 'ممرضة', 'نبض', 'رئة', 'كبد',
    'معدة', 'عظم', 'جمجمة', 'هيكل', 'صورة', 'ألوان',
    'حبر', 'رواية', 'قصة', 'أغنية', 'موسيقى', 'إيقاع',
    'رقصة', 'ستارة', 'جمهور', 'تصفيق', 'مخرج', 'بكرة',
    'بريد', 'إنترنت', 'موقع', 'فيروس', 'كود', 'شفرة',
    'عميل', 'كمين', 'سلاح', 'هليكوبتر', 'سفينة', 'كثبان',
    'قمة', 'سفح', 'قطب', 'عنقود', 'درابزين', 'زيتون',
    'عجلاتي', 'بستان', 'حقل', 'فزاعة', 'جرار', 'ساقية',
    'فرن بلدي', 'كنافة', 'قطايف', 'مسحراتي',

    // بيت وحاجات
    'مطبخ', 'صالة', 'جنينة', 'حيطة', 'سقف', 'أرضية',
    'عمود', 'ركن', 'رف', 'مخزن', 'بدروم', 'سلك',
    'شريط', 'علبة', 'كيس', 'برطمان', 'مفرش', 'شال',
    'شنطة سفر', 'حلة', 'خزنة', 'مغرفة', 'هون', 'موقد',
    'لمبة', 'نجفة', 'أباجورة', 'مكيف', 'دفاية', 'سخان',
    'غسالة', 'مكواة', 'ممسحة', 'جردل', 'سجادة', 'مخدة',
    'بطانية', 'ملاية', 'مرتبة', 'دولاب', 'شماعة', 'منبه',
    'ريموت', 'ألبوم', 'فازة', 'أصيص', 'زرع',

    // أكل وشرب
    'كمون', 'شطة', 'خل', 'سمنة', 'زبدة', 'زبادي',
    'بسلة', 'رز', 'مكرونة', 'خس', 'كرنب', 'قرنبيط',
    'سبانخ', 'ملوخية', 'بامية', 'يوسفي', 'جوافة', 'بلح',
    'شمام', 'برقوق', 'أناناس', 'جوز هند', 'لوز', 'بندق',
    'فستق', 'كاجو', 'سوداني', 'كيك', 'بسكويت', 'جاتوه',
    'بسبوسة', 'زلابية', 'مهلبية', 'أم علي', 'كحك', 'فطير',
    'كفتة', 'كباب', 'حواوشي', 'سجق', 'بسطرمة', 'تونة',
    'سردين', 'مخلب', 'فراخ', 'بط', 'حمام', 'لحمة',
    'كبدة', 'شوربة', 'سلطة', 'مخلل', 'طحينة', 'سحلب',
    'ينسون', 'كركديه', 'تمر هندي', 'عرقسوس', 'قصب', 'سوبيا',
    'كاكاو', 'عصير', 'صودا', 'فشار', 'لبان',

    // طبيعة وفضاء
    'نجم', 'سما', 'قفص', 'حجر', 'زهرة', 'عشب',
    'شوك', 'فرع', 'ثمرة', 'بحيرة', 'طبلية', 'مرجان',
    'صدف', 'ليل', 'هلال', 'مريخ', 'زحل',
    'عطارد', 'أوزون', 'خط الاستواء',

    // حيوانات
    'غوريلا', 'جاموسة', 'معزة', 'أرنب', 'فار', 'خفاش',
    'ضفدع', 'عصفور', 'وزة', 'ديك', 'فرخة', 'كتكوت',
    'ذبابة', 'ناموسة', 'استاكوزا', 'فقمة', 'باندا', 'كوالا',
    'عنقاء', 'يونيكورن', 'غصن', 'سنبلة',

    // أماكن
    'بوسطة', 'قسم', 'شارع', 'ميدان', 'كوبري', 'سوبرماركت',
    'بقالة', 'جزارة', 'كافيه', 'نادي', 'جيم', 'حمام سباحة',
    'محطة بنزين', 'مسجد', 'فنار', 'مخيم', 'قرية', 'مدينة',
    'عاصمة', 'حدود', 'جمارك', 'برلمان', 'وزارة', 'معمل',
    'سايس', 'سرداب', 'أسانسير', 'بوابة',

    // ناس ومهن
    'دكتور', 'جذع', 'طالب', 'ظابط', 'عسكري', 'صياد',
    'مزارع', 'حداد', 'ميكانيكي', 'سواق', 'جرسون', 'بوستر',
    'جزار', 'بقال', 'يافطة', 'بواب', 'مخبر', 'صحفي',
    'مذيع', 'مصور', 'ملحن', 'نحات', 'شاعر', 'مدرب',
    'رئيس', 'وزير', 'سفير', 'أمير', 'ساحر', 'مهرج',
    'بهلوان', 'رائد فضاء', 'عالم', 'مخترع', 'مبرمج', 'محاسب',
    'سكرتير', 'عريس', 'جد', 'جدة', 'عم', 'خالة',
    'حماة', 'حفيد', 'توأم', 'أميرة', 'زومبي', 'غول',
    'عملاق', 'قزم', 'حورية', 'كائن فضائي', 'كليوباترا', 'بياع',

    // جسم
    'راس', 'نيش', 'سفرة', 'عشة', 'سنة', 'لسان',
    'شفايف', 'رقبة', 'كتف', 'دراع', 'كوع', 'أنتريه',
    'صباع', 'ضافر', 'صدر', 'كلاكس', 'بطن', 'وسط',
    'ركبة', 'موتور', 'عرق', 'نفس', 'عقل', 'ضحكة',
    'دمعة', 'شنب', 'دقن',

    // رياضة ولعب
    'كورة', 'جون', 'كارت', 'مدرج', 'دوري', 'ماتش',
    'ركنية', 'ضربة جزاء', 'تسلل', 'سباحة', 'جري', 'قفز',
    'ملاكمة', 'مصارعة', 'كاراتيه', 'جودو', 'تنس', 'طايرة',
    'هوكي', 'جولف', 'طاولة', 'كوتشينة', 'مطبعة', 'استغماية',
    'نط الحبل', 'بولينج', 'بلياردو', 'زلاجة', 'ترامبولين', 'مرجيحة',
    'عطار', 'بازل',

    // تكنولوجيا وعلوم
    'موبايل', 'لابتوب', 'تابلت', 'ماوس', 'كيبورد', 'راوتر',
    'واي فاي', 'بلوتوث', 'إيميل', 'مكالمة', 'فيديو', 'سيلفي',
    'هاشتاج', 'لايك', 'تطبيق', 'برنامج', 'هاكر', 'باسورد',
    'ذكاء صناعي', 'قمر صناعي', 'سرج', 'كرباج', 'خلية', 'جين',
    'مصل', 'بكتيريا', 'أكسجين', 'هيدروجين', 'كربون', 'زئبق',
    'منشور', 'معادلة', 'صفر', 'مليون', 'كسر', 'زاوية',
    'دايرة', 'مربع', 'مثلث', 'مكعب', 'تجربة', 'اختراع',

    // مواصلات ولبس
    'عربية', 'ميكروباص', 'توكتوك', 'عجلة', 'حافر', 'ترام',
    'فلوكة', 'يخت', 'منطاد', 'باراشوت', 'ونش', 'تريلا',
    'حنطور', 'سكوتر', 'مطافي', 'بنطلون', 'جلابية', 'كوفية',
    'برنيطة', 'كاب', 'جاكيت', 'بالطو', 'كرافتة', 'جيبة',
    'شورت', 'بيجامة', 'مايوه', 'جزمة', 'صندل', 'عكاز',
    'باروكة',

    // معاني وحاجات مختلفة
    'نور', 'ضلمة', 'مية', 'هوا', 'فكرة', 'حظ',
    'فرصة', 'أمل', 'خوف', 'حب', 'سلام', 'حرب',
    'ثورة', 'فرح', 'مفاجأة', 'كذبة', 'حقيقة', 'وعد',
    'قانون', 'ضريبة', 'فلوس', 'جنيه', 'دولار', 'فرامل',
    'قماش', 'عرش', 'تاريخ', 'مستقبل', 'ماضي', 'صدفة',
    'موضة', 'ضجة', 'سكوت', 'كابوس',

    // مدرسة
    'كراسة', 'أستيكة', 'براية', 'واجب', 'حصة', 'فسحة',
    'ناظر', 'تلميذ', 'ملخص', 'شعر عربي', 'نحو', 'حساب',
    'رسم', 'ألعاب',

    // مصر ورمضان
    'نيل', 'أبو الهول', 'مسلة', 'بردية', 'جعران', 'الأقصر',
    'أسوان', 'بورسعيد', 'سيناء', 'الغردقة', 'الفيوم',
    'طنطا', 'المنصورة', 'الزمالك', 'الأهلي', 'الإسماعيلي', 'عيدية',
    'زينة', 'رمضان', 'سحور', 'فطار', 'أذان', 'قهوة بلدي',
    'كوشة', 'زفة', 'مهر', 'حنة', 'عربية فول', 'ربابة',
    'مزمار', 'تنورة', 'خيامية', 'فخار', 'نحاس أحمر', 'سبحة',
    'مسبحة', 'فانوس رمضان',

    // mammals
    'دب قطبي', 'وحيد القرن', 'فرس النهر', 'حمار وحشي', 'أيل', 'شادوف',
    'صومعة', 'عجل', 'ناقة', 'بغل', 'نعجة', 'جدي',
    'جرذ', 'هامستر', 'قمع', 'شمبانزي', 'إنسان الغاب', 'بابون',
    'نمس', 'ابن عرس', 'راكون', 'قندس', 'كوز', 'آكل النمل',
    'حيوان الكسل', 'لاما', 'ساعة رملية', 'نسناس', 'خنزير بري', 'أسد البحر',
    'منظار', 'حوت قاتل', 'مرصد', 'حوض سمك', 'بيت كلب', 'جربوع',

    // birds
    'عقاب', 'يمامة', 'بجعة', 'بطة', 'ديك رومي', 'هدهد',
    'نورس', 'برج حمام', 'أبو قردان', 'فلامنجو', 'حصان خشب', 'طائر الطنان',
    'نقار الخشب', 'كروان', 'بلبل', 'سنونو', 'عصاية', 'نسر أصلع',
    'كوكاتو', 'عندليب', 'عروسة ماريونيت', 'خزان', 'عربية آيس كريم',

    // sea
    'حبار', 'سبيط', 'نبلة', 'بلطة', 'قنفذ البحر', 'حصان البحر',
    'محار', 'سلحفاة بحرية', 'سمكة المهرج', 'لخمة', 'ثعبان البحر', 'سلمون',
    'بلطي', 'بوري', 'دنيس', 'سمكة ذهبية', 'حوت أزرق', 'شومة',
    'بلح البحر', 'سمكة منفوخة',

    // reptiles
    'كوبرا', 'أفعى', 'برص', 'ورل', 'إغوانا', 'طرطور',
    'تنين كومودو', 'أناكوندا', 'زمارة', 'طلمبة', 'كرسي متحرك', 'بلاعة',
    'بمب', 'كتالوج',

    // bugs
    'عثة', 'دعسوقة', 'عجينة', 'دودة القز', 'برغوث', 'فرس النبي',
    'يرقة', 'نمل أبيض', 'رغيف', 'قملة', 'بق الفراش', 'مجداف',
    'نحلة ملكة', 'ماسورة', 'سوسة',

    // extinct
    'ماموث', 'تي ريكس', 'طوق نجاة', 'عوامة', 'زعانف', 'دبدوب',

    // fruit
    'جريب فروت', 'توت', 'كمثرى', 'كيوي', 'برفان', 'تين شوكي',
    'أفوكادو', 'بابايا', 'قشطة', 'نبق', 'كاكا', 'ليتشي',
    'توت أزرق', 'فاكهة التنين', 'زبيب', 'قراصيا', 'بخور', 'لحاف',
    'كليم', 'حصيرة',

    // vegetables
    'بطاطا', 'فلفل رومي', 'قرع', 'بروكلي', 'فاصوليا خضرا', 'لوبيا',
    'فول أخضر', 'فجل', 'لفت', 'بنجر', 'كرفس', 'بقدونس',
    'شبت', 'كزبرة', 'جرجير', 'مشروم', 'خرشوف', 'قلقاس',
    'فلفل حار', 'كرات',

    // dishes
    'فتة', 'محشي', 'ورق عنب', 'مسقعة', 'مكرونة بشاميل', 'ضفيرة',
    'شكشوكة', 'كبدة إسكندراني', 'ممبار', 'رقاق', 'فطير مشلتت', 'عيش بلدي',
    'عيش شامي', 'حمام محشي', 'بط مشوي', 'فراخ مشوية', 'سمك مشوي', 'صيادية',
    'كاليماري', 'شوربة عدس', 'طاجن', 'رز معمر', 'فسيخ', 'رنجة',
    'بصارة', 'برجر', 'هوت دوج', 'سوشي', 'لازانيا', 'تاكو',
    'نودلز', 'كاري', 'برياني', 'كبسة', 'مندي', 'منسف',
    'مقلوبة', 'متبل', 'تبولة', 'فتوش', 'كبة', 'سمبوسة',
    'شيش طاووق', 'كرواسون', 'بان كيك', 'وافل', 'ساندوتش', 'توست',
    'ناجتس', 'ستيك', 'أومليت', 'بيض مسلوق', 'بيض مقلي', 'جبنة رومي',
    'جبنة بيضاء', 'جبنة شيدر', 'موتزاريلا', 'لانشون', 'لبنة', 'بطاطس محمرة',
    'مكرونة بالصلصة', 'مكرونة إسباجتي', 'رز بالشعرية', 'روج', 'بامية باللحمة', 'كوارع',
    'لحمة راس', 'فشة', 'كحل', 'عجة',

    // sweets
    'لقمة القاضي', 'رز بلبن', 'جيلي', 'كريم كراميل', 'بلح الشام', 'غريبة',
    'بيتي فور', 'تورتة', 'كب كيك', 'دونات', 'براونيز', 'تشيز كيك',
    'مصاصة', 'غزل البنات', 'ملبن', 'حلاوة طحينية', 'عسل أسود', 'فطيرة تفاح',
    'سينابون', 'بقلاوة', 'هريسة', 'مارشميلو', 'عسلية', 'حمصية',
    'سمسمية', 'فولية', 'بودنج', 'موس شوكولاتة',

    // drinks
    'نسكافيه', 'كابتشينو', 'لاتيه', 'إسبريسو', 'شوكولاتة ساخنة', 'عصير قصب',
    'خروب', 'عصير برتقال', 'عصير مانجو', 'عصير جوافة', 'ليمون بالنعناع', 'ميلك شيك',
    'سموذي', 'مياه غازية', 'مياه معدنية', 'عصير فراولة', 'كوكتيل', 'قمر الدين',
    'آيس تي', 'شاي أخضر', 'قرفة باللبن',

    // pantry
    'فلفل أسود', 'حبهان', 'زعفران', 'كركم', 'زيت زيتون', 'دقيق',
    'نشا', 'خميرة', 'بيكنج باودر', 'فانيليا', 'حصى', 'مربى',
    'صلصة', 'كاتشب', 'مايونيز', 'مستردة', 'برغل', 'شوفان',
    'كورن فليكس', 'لبن رايب',

    // household
    'جرس الباب', 'كنبة', 'فوتيه', 'ترابيزة سفرة', 'كومودينو', 'تسريحة',
    'وطواط', 'عرسة', 'فريزر', 'بوتاجاز', 'ميكروويف', 'غسالة أطباق',
    'مكنسة كهربا', 'جاروف', 'منشر غسيل', 'مشبك غسيل', 'سلة غسيل', 'كسرولة',
    'براد شاي', 'كنكة', 'قضيب', 'توستر', 'لوح تقطيع', 'نشابة',
    'منخل', 'ميزان مطبخ', 'فوطة', 'سكة حديد', 'شامبو', 'معجون سنان',
    'فرشة سنان', 'فرشة شعر', 'مجفف شعر', 'مقص أظافر', 'ماكينة حلاقة', 'بانيو',
    'دش', 'حوض', 'حنفية', 'سيفون', 'شطاف', 'برنس',
    'سيراميك', 'ليفة', 'ساعة حائط', 'بلاستر', 'شمعدان', 'قبة',
    'رسيفر', 'دش ستالايت', 'فيشة', 'مشترك كهربا', 'شمسية', 'سلسلة مفاتيح',
    'كرتونة', 'كيس بلاستيك', 'مخدة كنبة', 'سجادة صلاة', 'مصحف', 'مبخرة',
    'زرع صناعي', 'حصالة', 'جبيرة', 'لعبة أطفال', 'عربية أطفال',

    // tools
    'مسمار قلاووظ', 'زرادية', 'شنيور', 'متر', 'ميزان مية', 'مبرد',
    'إزميل', 'كوريك', 'مقص شجر', 'مرشة', 'عربية يد', 'سلم خشب',
    'فرشة دهان', 'رول دهان', 'جردل بوية', 'شريط لاصق', 'غرا', 'صنفرة',
    'كاوية لحام', 'مسدس شمع', 'منشار كهربا', 'فانلة', 'عدة', 'شنطة عدة',
    'جوانتي شغل', 'نظارة لحام', 'مقص صاج', 'منجل',

    // clothes
    'تيشيرت', 'جينز', 'بلوزة', 'بلوفر', 'جاكت جلد', 'صديري',
    'بابيون', 'روب', 'كولون', 'بوت', 'كعب عالي', 'إيشارب',
    'نظارة شمس', 'دبلة', 'خلخال', 'بروش', 'شنطة يد', 'شنطة ضهر',
    'منديل', 'مريلة', 'يونيفورم', 'زي مدرسة', 'عمة', 'طربوش',
    'بلاط',

    // school
    'قلم رصاص', 'قلم جاف', 'قلم ألوان', 'كشكول', 'شنطة مدرسة', 'مقلمة',
    'ماركر', 'دباسة', 'خرامة', 'مشبك ورق', 'ظرف', 'كرة أرضية',
    'آلة حاسبة', 'برجل', 'منقلة', 'مثلث هندسة', 'دفتر', 'مكتب',
    'كرسي مكتب', 'درج', 'ملف', 'حافظة ورق', 'لوحة إعلانات', 'جرس المدرسة',
    'زمزمية',

    // tech
    'فينو', 'سماعة بلوتوث', 'باور بانك', 'فلاشة', 'هارد', 'كاميرا مراقبة',
    'ساعة ذكية', 'بلايستيشن', 'ذراع تحكم', 'بتاو', 'بروجكتور', 'سبيكر',
    'درون', 'روبوت مكنسة', 'قراقيش', 'ماكينة صراف',

    // vehicles
    'لانش', 'مجلة', 'عربية مطافي', 'عربية شرطة', 'لودر', 'نقل',
    'ربع نقل', 'سكيت بورد', 'جيت سكي', 'عبارة', 'تلفريك', 'قطر سريع',
    'عربية سباق',

    // places
    'بيت', 'عمارة', 'حارة', 'رصيف', 'إشارة مرور', 'موقف أتوبيس',
    'محطة قطر', 'محطة مترو', 'بقسماط', 'حضانة', 'عيادة', 'معمل تحاليل',
    'حمص الشام', 'بليلة', 'لب', 'بلدية', 'شيبسي', 'كشك',
    'محل هدوم', 'محل جزم', 'محل موبايلات', 'مكتبة أدوات', 'فكهاني', 'خضري',
    'محل عصير', 'محل كشري', 'شاليه', 'منتجع', 'استاد', 'صالة بولينج',
    'أوبرا', 'معرض', 'أكوا بارك', 'غيط', 'حظيرة', 'إسطبل',
    'شركة', 'ناطحة سحاب', 'مصيف', 'صالون حلاقة', 'كوافير',
    'مغسلة', 'ستوديو تصوير', 'قاعة أفراح', 'دار مناسبات', 'محل ألعاب', 'سايبر',
    'بطارخ', 'مغسلة عربيات', 'أوضة نوم', 'كابينة', 'أوضة أطفال', 'أوضة مكتب',

    // jobs
    'دكتور أسنان', 'جراح', 'صيدلي', 'مهندس معماري', 'أستاذ جامعة', 'كورنيش',
    'ظابط شرطة', 'مضيفة طيران', 'فلاح', 'راعي غنم', 'نقاش', 'بناء',
    'سواق تاكسي', 'سواق أتوبيس', 'شيف', 'فران', 'كوافيرة', 'ترزي',
    'حارس أمن', 'جنايني', 'عامل نظافة', 'ساعي بريد', 'موسيقار', 'مترجم',
    'موظف بنك', 'كاشير', 'تاجر', 'سمسار', 'عالم آثار', 'مرشد سياحي',
    'رجل مطافي', 'منقذ', 'سبيل', 'بيطري', 'لاعب كورة', 'معلق رياضي',
    'عارض أزياء', 'مصمم أزياء', 'مصمم جرافيك', 'يوتيوبر', 'طيار حربي', 'ظابط جيش',
    'دبلوماسي', 'عمدة', 'إمام مسجد', 'مؤذن', 'قسيس', 'شيخ',
    'طبيب نفسي', 'دكتور عيون', 'دكتور أطفال', 'صانع حلويات', 'ساعاتي', 'خان',
    'جواهرجي', 'منجد',

    // sports
    'كورة قدم', 'كورة سلة', 'جرنال', 'كورة يد', 'تنس طاولة', 'إسكواش',
    'بادل', 'غطس', 'كرة ماء', 'تجديف', 'ركوب الأمواج', 'إبحار',
    'ماراثون', 'قفز عالي', 'قفز طويل', 'قفز بالزانة', 'رمي الرمح', 'رمي الجلة',
    'رفع أثقال', 'كمال أجسام', 'جمباز', 'تايكوندو', 'كونغ فو', 'مبارزة',
    'رماية', 'رماية بالقوس', 'فروسية', 'سباق خيل', 'ركوب دراجات', 'سباق عربيات',
    'تسلق جبال', 'يوجا', 'فسبا', 'زومبا', 'رقص باليه', 'كريكيت',
    'بيسبول', 'رجبي', 'سباق حواجز', 'مشي سريع', 'لهاية', 'تروسيكل',

    // instruments
    'عود', 'كاسيت', 'زحمة', 'جيتار كهربا', 'أورج', 'طبلة',
    'رق', 'درامز', 'عمود نور', 'مطب', 'رخصة', 'أتاري',
    'فلوت', 'بيبرونة', 'فيزا', 'هارمونيكا', 'حفاضة', 'صاجات',
    'مثلث موسيقى', 'مخالفة',

    // nature
    'برد', 'إيصال', 'عاصفة ترابية', 'ورقة شجر', 'شوال', 'بدر',
    'شروق', 'نهار', 'جبل جليد', 'قطب شمالي', 'قطب جنوبي',

    // body
    'وش', 'جبهة', 'حواجب', 'رموش', 'خد', 'كارنيه',
    'كف', 'صباع كبير', 'سرة', 'كاحل', 'قدم', 'صباع رجل',
    'مخ', 'كلية', 'عمود فقري', 'عضلة', 'شريان', 'زايدة',

    // countries
    'مصر', 'السعودية', 'الإمارات', 'الكويت', 'البحرين', 'عمان',
    'اليمن', 'الأردن', 'فلسطين', 'لبنان', 'سوريا', 'العراق',
    'ليبيا', 'تونس', 'الجزائر', 'المغرب', 'السودان', 'موريتانيا',
    'الصومال', 'جيبوتي', 'جزر القمر', 'تركيا', 'إيران', 'باكستان',
    'الهند', 'الصين', 'اليابان', 'كوريا الجنوبية', 'إندونيسيا', 'ماليزيا',
    'تايلاند', 'الفلبين', 'فيتنام', 'روسيا', 'ألمانيا', 'فرنسا',
    'إيطاليا', 'إسبانيا', 'البرتغال', 'إنجلترا', 'اليونان', 'هولندا',
    'بلجيكا', 'سويسرا', 'السويد', 'النرويج', 'الدنمارك', 'فنلندا',
    'بولندا', 'أوكرانيا', 'أمريكا', 'كندا', 'المكسيك', 'البرازيل',
    'الأرجنتين', 'تشيلي', 'كولومبيا', 'بيرو', 'كوبا', 'أستراليا',
    'نيوزيلندا', 'جنوب أفريقيا', 'نيجيريا', 'كينيا', 'إثيوبيا', 'غانا',
    'السنغال', 'الكاميرون', 'كوت ديفوار', 'أيرلندا', 'اسكتلندا', 'النمسا',
    'المجر', 'التشيك', 'كرواتيا', 'صربيا', 'رومانيا', 'بلغاريا',
    'أيسلندا',

    // cities
    'القاهرة', 'الإسكندرية', 'الجيزة', 'السويس', 'الإسماعيلية', 'الزقازيق',
    'دمياط', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'شرم الشيخ',
    'مرسى مطروح', 'سيوة', 'الرياض', 'مكة', 'دبي', 'أبوظبي',
    'الدوحة', 'مسقط', 'بيروت', 'بغداد', 'دمشق', 'القدس',
    'تونس العاصمة', 'الرباط', 'الدار البيضاء', 'مراكش', 'لندن',
    'باريس', 'روما', 'مدريد', 'برشلونة', 'ميلانو', 'برلين',
    'ميونخ', 'أمستردام', 'إسطنبول', 'موسكو', 'أثينا', 'فيينا',
    'جنيف', 'نيويورك', 'لوس أنجلوس', 'واشنطن', 'شيكاغو', 'تورونتو',
    'بوينس آيرس', 'طوكيو', 'بكين', 'شنغهاي', 'سيول', 'بانكوك',
    'سنغافورة', 'مومباي', 'سيدني', 'كيب تاون'
  ],

  en: [
    // Home & objects
    'Door', 'Window', 'Key', 'Chair', 'Table', 'Bed', 'Mirror', 'Clock',
    'Candle', 'Switch', 'Fridge', 'Oven', 'Broom', 'Ladder', 'Roof', 'Balcony',
    'Rope', 'Scissors', 'Needle', 'Thread', 'Soap', 'Towel', 'Brush', 'Comb',
    'Wallet', 'Bag', 'Umbrella', 'Glasses', 'Ring', 'Watch',

    // Food & drink
    'Bread', 'Cheese', 'Honey', 'Salt', 'Sugar', 'Pepper', 'Lemon', 'Onion',
    'Garlic', 'Oil', 'Tea', 'Coffee', 'Milk', 'Egg', 'Apple', 'Banana',
    'Melon', 'Grape', 'Date', 'Nut', 'Pizza', 'Cake', 'Chocolate', 'Ice',

    // Animals
    'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Monkey', 'Fox', 'Wolf', 'Bear',
    'Cat', 'Dog', 'Horse', 'Donkey', 'Camel', 'Sheep', 'Cow', 'Chicken',
    'Eagle', 'Hawk', 'Owl', 'Crow', 'Dove', 'Fish', 'Shark', 'Whale',
    'Dolphin', 'Octopus', 'Turtle', 'Crocodile', 'Snake', 'Scorpion', 'Bee', 'Ant',
    'Spider', 'Butterfly', 'Penguin', 'Kangaroo',

    // Places
    'School', 'Hospital', 'Airport', 'Station', 'Port', 'Market', 'Mall', 'Bank',
    'Museum', 'Library', 'Cinema', 'Theatre', 'Stadium', 'Park', 'Beach', 'Desert',
    'Mountain', 'Forest', 'Cave', 'Island', 'River', 'Sea', 'Waterfall', 'Castle',
    'Palace', 'Tower', 'Bridge', 'Tunnel', 'Prison', 'Hotel', 'Restaurant', 'Church',

    // Transport
    'Car', 'Bus', 'Train', 'Metro', 'Plane', 'Rocket', 'Boat', 'Submarine',
    'Bicycle', 'Motorcycle', 'Taxi', 'Ambulance', 'Truck', 'Sled',

    // People & jobs
    'Doctor', 'Engineer', 'Teacher', 'Chef', 'Barber', 'Carpenter', 'Plumber', 'Pilot',
    'Police', 'Lawyer', 'Judge', 'Actor', 'Singer', 'Painter', 'Writer', 'Player',
    'Referee', 'Spy', 'Thief', 'King', 'Queen', 'Knight', 'Bride', 'Giant',

    // Nature
    'Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Snow', 'Thunder', 'Wind',
    'Fire', 'Water', 'Sand', 'Rock', 'Tree', 'Rose', 'Leaf', 'Root',
    'Seed', 'Shadow', 'Rainbow', 'Earthquake', 'Volcano', 'Space', 'Comet', 'Wave',

    // Body
    'Eye', 'Ear', 'Nose', 'Mouth', 'Hand', 'Foot', 'Heart', 'Brain',
    'Tooth', 'Hair', 'Back', 'Blood',

    // Things & tools
    'Book', 'Pen', 'Paper', 'Map', 'Compass', 'Telescope', 'Camera', 'Phone',
    'Computer', 'Screen', 'Battery', 'Fan', 'Lamp', 'Bell', 'Drum', 'Guitar',
    'Piano', 'Violin', 'Flute', 'Hook', 'Net', 'Arrow', 'Bow', 'Sword',
    'Shield', 'Pistol', 'Bomb', 'Box', 'Lock', 'Chain', 'Nail', 'Hammer',
    'Saw', 'Scale', 'Basket', 'Cup', 'Plate', 'Spoon', 'Fork', 'Knife',
    'Pot', 'Bottle',

    // Games & abstract
    'Ball', 'Chess', 'Domino', 'Card', 'Dice', 'Puzzle', 'Race', 'Time',
    'Trophy', 'Medal', 'Goal', 'Plan', 'Trap', 'Secret', 'Treasure', 'Dream',
    'Memory', 'Sound', 'Colour', 'Number', 'Letter', 'Name', 'Gift', 'Ticket',
    'Stamp', 'Message', 'Parcel', 'Code',

    // New additions (Clothing, materials, nature, places, animals, produce, tools, arts & concepts)
    'Hat', 'Cap', 'Suit', 'Dress', 'Shirt', 'Belt', 'Coat', 'Sock',
    'Scarf', 'Tie', 'Glove', 'Boot', 'Shoe', 'Sandal', 'Vest', 'Crown',
    'Necklace', 'Bracelet', 'Earring', 'Pin', 'Button', 'Zipper', 'Pocket', 'Gold',
    'Silver', 'Copper', 'Iron', 'Wood', 'Glass', 'Plastic', 'Cotton', 'Silk',
    'Leather', 'Wool', 'Marble', 'Brick', 'Clay', 'Coal', 'Gas', 'Diamond',
    'Ruby', 'Pearl', 'Wax', 'Rubber', 'Steel', 'Chalk', 'Valley', 'Oasis',
    'Hill', 'Cliff', 'Bay', 'Pond', 'Spring', 'Ocean', 'Swamp', 'Jungle',
    'Frost', 'Fog', 'Dew', 'Storm', 'Tornado', 'Meteor', 'Eclipse', 'Horizon',
    'Dawn', 'Dusk', 'Breeze', 'Tide', 'Mosque', 'Temple', 'Pyramid', 'Tomb',
    'Factory', 'Farm', 'Windmill', 'Dam', 'Pharmacy', 'Bakery', 'Studio', 'Circus',
    'Zoo', 'Pool', 'Garage', 'Cabin', 'Tent', 'Villa', 'Embassy', 'Court',
    'Warehouse', 'Harbor', 'Alley', 'Ramp', 'Deer', 'Leopard', 'Hyena', 'Squirrel',
    'Hedgehog', 'Boar', 'Bull', 'Goat', 'Peacock', 'Pelican', 'Stork', 'Parrot',
    'Ostrich', 'Swan', 'Duck', 'Goose', 'Chameleon', 'Lizard', 'Shrimp', 'Crab',
    'Jellyfish', 'Starfish', 'Seagull', 'Flamingo', 'Beetle', 'Worm', 'Snail', 'Dragonfly',
    'Wasp', 'Cricket', 'Moth', 'Flea', 'Palm', 'Cactus', 'Jasmine', 'Mint',
    'Basil', 'Cinnamon', 'Ginger', 'Wheat', 'Corn', 'Rice', 'Bean', 'Pea',
    'Tomato', 'Cucumber', 'Fig', 'Pomegranate', 'Mango', 'Strawberry', 'Peach', 'Cherry',
    'Berry', 'Wrench', 'Screwdriver', 'Pliers', 'Anvil', 'Axe', 'Shovel', 'Hose',
    'Lighter', 'Match', 'Lantern', 'Torch', 'Magnifier', 'Thermometer', 'Barometer', 'Headphones',
    'Microphone', 'Speaker', 'Radio', 'Television', 'Printer', 'Charger', 'Cable', 'Plug',
    'Engine', 'Gear', 'Bolt', 'Lever', 'Pulley', 'Drill', 'Pan', 'Tray',
    'Kettle', 'Teapot', 'Mug', 'Pitcher', 'Thermos', 'Grater', 'Strainer', 'Blender',
    'Grill', 'Lunchbox', 'Opener', 'Saucer', 'Bowl', 'Napkin', 'Spear', 'Dagger',
    'Crossbow', 'Cannon', 'Bullet', 'Mine', 'Torpedo', 'Grenade', 'Siren', 'Barrier',
    'Bunker', 'Fort', 'Helmet', 'Armor', 'Yo-yo', 'Doll', 'Kite', 'Swing',
    'Slide', 'Painting', 'Sculpture', 'Frame', 'Trumpet', 'Harp', 'Accordion', 'Organ',
    'Tambourine', 'Clarinet', 'Echo', 'Glow', 'Beam', 'Flame', 'Ash', 'Smoke',
    'Mirage', 'Footprint', 'Sign', 'Badge', 'Banner', 'Certificate', 'Coin', 'Cheque',
    'Invoice', 'Signature', 'Contract', 'Address', 'Passport', 'Token',
    'Agent', 'Alien', 'Angel', 'Arm', 'Band', 'Bar',
    'Bark', 'Bat', 'Beat', 'Block', 'Board', 'Bond',
    'Bug', 'Buck', 'Calf', 'Capital', 'Carrot', 'Cast',
    'Cell', 'Center', 'Change', 'Charge', 'Check', 'Chest',
    'Chick', 'Chip', 'Circle', 'Club', 'Cold', 'Comic',
    'Concert', 'Cook', 'Cover', 'Crash', 'Crane', 'Cross',
    'Cycle', 'Day', 'Degree', 'Dinosaur', 'Draft', 'Dragon',
    'Drop', 'Dwarf', 'Face', 'Fair', 'Fall', 'Field',
    'Figure', 'File', 'Film', 'Flat', 'Fly', 'Force',
    'Game', 'Ghost', 'Grace', 'Green', 'Ground', 'Head',
    'Hole', 'Hood', 'Horn', 'Ink', 'Jam', 'Jet',
    'Kid', 'Kiwi', 'Lab', 'Lap', 'Laser', 'Lead',
    'Life', 'Light', 'Line', 'Link', 'Log', 'Mail',
    'Mammoth', 'March', 'Mass', 'Mercury', 'Mole', 'Mount',
    'Mouse', 'Night', 'Ninja', 'Note', 'Novel', 'Nurse',
    'Olive', 'Opera', 'Orange', 'Pass', 'Paste', 'Phoenix',
    'Pie', 'Pipe', 'Pit', 'Pitch', 'Platypus', 'Plot',
    'Point', 'Poison', 'Pole', 'Post', 'Press', 'Princess',
    'Pumpkin', 'Pupil', 'Racket', 'Ray', 'Robin', 'Robot',
    'Roll', 'Round', 'Row', 'Ruler', 'Satellite', 'Scientist',
    'Ship', 'Shop', 'Shot', 'Sink', 'Skyscraper', 'Slip',
    'Snowman', 'Soldier', 'Soul', 'Spell', 'Spike', 'Spot',
    'Square', 'Staff', 'State', 'Stick', 'Stream', 'Strike',
    'String', 'Superhero', 'Tag', 'Tail', 'Tap', 'Tick',
    'Track', 'Triangle', 'Trip', 'Trunk', 'Tube', 'Turkey',
    'Unicorn', 'Vacuum', 'Van', 'Vet', 'Wake', 'Wall',
    'War', 'Web', 'Whip', 'Witch', 'Yard',

    // around the house
    'Attic', 'Apron', 'Bench', 'Blanket', 'Bucket', 'Cabinet',
    'Carpet', 'Ceiling', 'Chimney', 'Closet', 'Cushion', 'Curtain',
    'Desk', 'Doorbell', 'Drawer', 'Fence', 'Floor', 'Gate',
    'Hammock', 'Hanger', 'Jar', 'Mat', 'Pillow', 'Porch',
    'Rug', 'Shelf', 'Shower', 'Sofa', 'Sponge', 'Stairs',
    'Stool', 'Stove', 'Tile', 'Vase', 'Wardrobe', 'Whistle',

    // food and drink
    'Avocado', 'Bacon', 'Bagel', 'Biscuit', 'Butter', 'Candy',
    'Chili', 'Cocoa', 'Coconut', 'Cookie', 'Cream', 'Curry',
    'Dough', 'Flour', 'Gravy', 'Ham', 'Ice Cream', 'Jelly',
    'Juice', 'Ketchup', 'Lime', 'Lollipop', 'Maple', 'Muffin',
    'Mushroom', 'Mustard', 'Noodle', 'Oat', 'Pancake', 'Pasta',
    'Peanut', 'Pear', 'Pickle', 'Pineapple', 'Plum', 'Popcorn',
    'Potato', 'Pretzel', 'Pudding', 'Salad', 'Sandwich', 'Sauce',
    'Sausage', 'Soup', 'Spice', 'Steak', 'Sushi', 'Syrup',
    'Taco', 'Toast', 'Tuna', 'Vanilla', 'Vinegar', 'Waffle',
    'Walnut', 'Watermelon', 'Yogurt', 'Zucchini',

    // nature and space
    'Air', 'Asteroid', 'Avalanche', 'Bamboo', 'Blossom', 'Branch',
    'Canyon', 'Coast', 'Coral', 'Crater', 'Dust', 'Earth',
    'Flood', 'Flower', 'Fossil', 'Galaxy', 'Glacier', 'Grass',
    'Lake', 'Lava', 'Lightning', 'Meadow', 'Mist', 'Mud',
    'Throne', 'Oak', 'Orbit', 'Pebble', 'Pine', 'Planet',
    'Reef', 'Shell', 'Sky', 'Soil', 'Stone', 'Summer',
    'Sunset', 'Weed', 'Winter',

    // animals
    'Alligator', 'Ape', 'Beaver', 'Bison', 'Buffalo', 'Cobra',
    'Eel', 'Falcon', 'Ferret', 'Frog', 'Gecko', 'Gorilla',
    'Hamster', 'Hen', 'Hippo', 'Jaguar', 'Koala', 'Ladybug',
    'Lamb', 'Llama', 'Lobster', 'Moose', 'Mule', 'Otter',
    'Ox', 'Panda', 'Panther', 'Pig', 'Pigeon', 'Pony',
    'Poodle', 'Puppy', 'Rabbit', 'Raccoon', 'Rat', 'Raven',
    'Rhino', 'Rooster', 'Salmon', 'Seal', 'Skunk', 'Sloth',
    'Slug', 'Sparrow', 'Squid', 'Toad', 'Tortoise', 'Viper',
    'Vulture', 'Walrus', 'Zebra',

    // places
    'Academy', 'Arena', 'Barn', 'Border', 'Café', 'Camp',
    'Canal', 'Cathedral', 'Cellar', 'City', 'Clinic',
    'College', 'Cottage', 'Dock', 'Ferry', 'Garden', 'Gym',
    'Highway', 'Hut', 'Igloo', 'Frisbee', 'Kingdom', 'Kitchen',
    'Lighthouse', 'Mill', 'Motel', 'Office', 'Pier', 'Playground',
    'Ranch', 'Road', 'Ruins', 'Subway', 'Supermarket', 'Fishbowl',
    'Town', 'University', 'Village', 'Workshop', 'Stethoscope', 'Treehouse',
    'Leash',

    // people and characters
    'Admiral', 'Archer', 'Artist', 'Astronaut', 'Athlete', 'Author',
    'Baby', 'Baker', 'Bandit', 'Boss', 'Butcher', 'Captain',
    'Champion', 'Clown', 'Coach', 'Cowboy', 'Detective', 'Diver',
    'Driver', 'Duke', 'Emperor', 'Farmer', 'Firefighter', 'Fisherman',
    'Genie', 'Guard', 'Guide', 'Hero', 'Hunter', 'Inventor',
    'Jester', 'Joker', 'Juggler', 'Magician', 'Maid', 'Mayor',
    'Mechanic', 'Mermaid', 'Miner', 'Monk', 'Mummy', 'Neighbour',
    'Ogre', 'Pharaoh', 'Pirate', 'Poet', 'President', 'Prince',
    'Professor', 'Sailor', 'Sheriff', 'Student', 'Surgeon', 'Tailor',
    'Troll', 'Twin', 'Vampire', 'Villain', 'Waiter', 'Wizard',
    'Zombie', 'Spotlight', 'Spatula', 'Grandma', 'Grandpa', 'Uncle',
    'Cousin',

    // body
    'Ankle', 'Beard', 'Bone', 'Cheek', 'Chin', 'Elbow',
    'Finger', 'Fist', 'Forehead', 'Heel', 'Hip', 'Jaw',
    'Knee', 'Leg', 'Lip', 'Lung', 'Muscle', 'Neck',
    'Rib', 'Shoulder', 'Skin', 'Skull', 'Spine', 'Stomach',
    'Thumb', 'Toe', 'Tongue', 'Waist', 'Wrist', 'Smile',
    'Tear', 'Sneeze',

    // sport and games
    'Dart', 'Dive', 'Golf', 'Hockey', 'Hoop', 'Jump',
    'Kick', 'League', 'Marathon', 'Olympics', 'Paddle', 'Penalty',
    'Puck', 'Rugby', 'Score', 'Serve', 'Skate', 'Ski',
    'Pitchfork', 'Sprint', 'Surf', 'Team', 'Tennis', 'Throw',
    'Umpire', 'Volley', 'Wrestling',

    // tech and science
    'Alarm', 'Antenna', 'App', 'Atom', 'Blog', 'Bluetooth',
    'Calculator', 'Circuit', 'Crystal', 'Data', 'Drone', 'Electric',
    'Email', 'Formula', 'Gadget', 'Germ', 'Hacker', 'Keyboard',
    'Laptop', 'Lens', 'Machine', 'Magnet', 'Meter', 'Microchip',
    'Microscope', 'Modem', 'Monitor', 'Motor', 'Password', 'Pixel',
    'Radar', 'Router', 'Scanner', 'Signal', 'Sensor', 'Server',
    'Tablet', 'Test Tube', 'Virus', 'Website', 'Wire', 'Wifi',

    // getting around and clothes
    'Anchor', 'Canoe', 'Cart', 'Helicopter', 'Kayak', 'Limousine',
    'Goggles', 'Parachute', 'Raft', 'Lasso', 'Sailboat', 'Scooter',
    'Tractor', 'Tram', 'Wagon', 'Wheel', 'Yacht', 'Backpack',
    'Cape', 'Collar', 'Jacket', 'Jeans', 'Mask', 'Doorknob',
    'Robe', 'Skirt', 'Sweater', 'Uniform', 'Wig', 'Slipper',
    'Purse',

    // ideas and other things
    'Age', 'Art', 'Bubble', 'Chance', 'Charm', 'Choice',
    'Crowd', 'Energy', 'Fame', 'Fashion', 'Fear', 'Flag',
    'Fortune', 'Future', 'Hope', 'Idea', 'Joke', 'Journey',
    'Justice', 'Law', 'Legend', 'Luck', 'Magic', 'Mystery',
    'Myth', 'Nightmare', 'Noise', 'Past', 'Peace', 'Power',
    'Prize', 'Promise', 'Riddle', 'Rumor', 'Silence', 'Song',
    'Story', 'Surprise', 'Truth', 'Wish', 'Balloon', 'Barrel',
    'Straw', 'Bubble Wrap', 'Cage', 'Crystal Ball', 'Envelope', 'Feather',
    'Pinwheel', 'Glue', 'Knot', 'Newspaper', 'Paint', 'Pencil',
    'Statue', 'Tape', 'Wand',

    // mammals
    'Cheetah', 'Lynx', 'Polar Bear', 'Toothpick', 'Reindeer', 'Antelope',
    'Gazelle', 'Hare', 'Chipmunk', 'Guinea Pig', 'Porcupine', 'Chimpanzee',
    'Orangutan', 'Baboon', 'Lemur', 'Anteater', 'Armadillo', 'Badger',
    'Weasel', 'Meerkat', 'Mongoose', 'Alpaca', 'Yak', 'Kitten',
    'Warthog', 'Wild Boar', 'Sea Lion', 'Orca', 'Manatee', 'Jerboa',
    'Snowflake', 'Mountain Goat',

    // birds
    'Canary', 'Emu', 'Quail', 'Hoopoe', 'Heron', 'Toucan',
    'Hummingbird', 'Woodpecker', 'Nightingale', 'Swallow', 'Kingfisher', 'Magpie',
    'Cockatoo', 'Mailbox',

    // sea
    'Cuttlefish', 'Sea Urchin', 'Seahorse', 'Oyster', 'Clam', 'Sea Turtle',
    'Clownfish', 'Swordfish', 'Stingray', 'Sardine', 'Cod', 'Narwhal',
    'Goldfish', 'Blue Whale', 'Whale Shark', 'Mussel', 'Pufferfish',

    // reptiles
    'Python', 'Iguana', 'Komodo Dragon', 'Salamander', 'Newt', 'Anaconda',
    'Rattlesnake', 'Tree Frog',

    // bugs
    'Mosquito', 'Keyhole', 'Cockroach', 'Grasshopper', 'Locust', 'Firefly',
    'Silkworm', 'Praying Mantis', 'Centipede', 'Caterpillar', 'Termite', 'Tarantula',
    'Hornet', 'Queen Bee', 'Earthworm',

    // extinct
    'T-Rex', 'Triceratops', 'Stegosaurus', 'Pterodactyl', 'Dodo',

    // fruit
    'Tangerine', 'Grapefruit', 'Cauldron', 'Raspberry', 'Blueberry', 'Blackberry',
    'Apricot', 'Guava', 'Cantaloupe', 'Prickly Pear', 'Chopsticks', 'Papaya',
    'Lychee', 'Dragon Fruit', 'Raisins', 'Prunes', 'Passion Fruit', 'Cranberry',
    'Nectarine', 'Persimmon',

    // vegetables
    'Sweet Potato', 'Bell Pepper', 'Aubergine', 'Puddle', 'Okra', 'Spinach',
    'Lettuce', 'Cabbage', 'Cauliflower', 'Broccoli', 'Acorn', 'Green Beans',
    'Quiver', 'Radish', 'Turnip', 'Beetroot', 'Celery', 'Parsley',
    'Dill', 'Coriander', 'Thyme', 'Artichoke', 'Puppet', 'Leek',
    'Asparagus', 'Kale', 'Spring Onion',

    // dishes
    'Burger', 'Hot Dog', 'Spaghetti', 'Lasagne', 'Burrito', 'Clover',
    'Biryani', 'Kabsa', 'Falafel', 'Hummus', 'Tabbouleh', 'Fattoush',
    'Kibbeh', 'Samosa', 'Shawarma', 'Kebab', 'Meatballs', 'Roast Chicken',
    'Grilled Fish', 'Fried Rice', 'Omelette', 'Scrambled Eggs', 'Boiled Egg', 'Fried Egg',
    'Cobweb', 'Cradle', 'Croissant', 'French Fries', 'Stew', 'Paella',
    'Ramen', 'Dumplings', 'Spring Rolls', 'Kofta', 'Moussaka', 'Koshari',
    'Ful Medames', 'Shakshuka', 'Porridge', 'Cereal', 'Quiche', 'Risotto',
    'Nachos', 'Quesadilla', 'Sausage Roll', 'Club Sandwich', 'Grilled Cheese', 'Cheeseburger',
    'Chicken Wings', 'Pasta Salad', 'Tomato Soup', 'Lentil Soup', 'Roast Beef', 'Lamb Chops',
    'Fajitas',

    // sweets
    'Cupcake', 'Donut', 'Brownie', 'Cheesecake', 'Candyfloss', 'Marshmallow',
    'Apple Pie', 'Cinnamon Roll', 'Baklava', 'Kunafa', 'Basbousa', 'Rice Pudding',
    'Custard', 'Crème Caramel', 'Chewing Gum', 'Toffee', 'Caramel', 'Fudge',
    'Honey Cake', 'Macaron', 'Tiramisu', 'Trifle', 'Candy Cane', 'Gingerbread',
    'Waffle Cone', 'Jam Tart', 'Eclair', 'Profiterole', 'Sundae',

    // drinks
    'Cappuccino', 'Latte', 'Espresso', 'Hot Chocolate', 'Milkshake', 'Smoothie',
    'Lemonade', 'Orange Juice', 'Apple Juice', 'Mango Juice', 'Iced Tea', 'Green Tea',
    'Mint Tea', 'Fizzy Drink', 'Mineral Water', 'Cola', 'Hibiscus Tea', 'Tamarind Juice',
    'Coconut Water', 'Chocolate Milk', 'Iced Coffee', 'Mocha', 'Herbal Tea',

    // pantry
    'Black Pepper', 'Cumin', 'Cardamom', 'Saffron', 'Turmeric', 'Paprika',
    'Olive Oil', 'Ghee', 'Cornflour', 'Yeast', 'Baking Powder', 'Tahini',
    'Tomato Paste', 'Mayonnaise', 'Cloak', 'Clipboard', 'Lentils', 'Aquarium',
    'Chickpeas', 'Bulgur', 'Bandage', 'Cornflakes', 'Beach Ball', 'Easel',

    // household
    'Padlock', 'Lift', 'Armchair', 'Dining Table', 'Mattress', 'Bedsheet',
    'Bedside Table', 'Dressing Table', 'Coat Hanger', 'Bookcase', 'Chandelier', 'Light Bulb',
    'Heater', 'Water Heater', 'Freezer', 'Postcard', 'Microwave', 'Dishwasher',
    'Oar', 'Dustpan', 'Mop', 'Clothes Horse', 'Clothes Peg', 'Laundry Basket',
    'Saucepan', 'Frying Pan', 'Casserole Dish', 'Baking Tray', 'Jug', 'Coffee Pot',
    'Pinecone', 'Ladle', 'Colander', 'Bottle Opener', 'Food Processor', 'Juicer',
    'Toaster', 'Chopping Board', 'Rolling Pin', 'Sieve', 'Kitchen Scales', 'Shampoo',
    'Toothpaste', 'Toothbrush', 'Hairbrush', 'Hairdryer', 'Nail Clippers', 'Razor',
    'Bathtub', 'Toilet', 'Bathrobe', 'Tissues', 'Loofah', 'Toilet Roll',
    'Bath Mat', 'Wall Clock', 'Alarm Clock', 'Picture Frame', 'Flower Pot', 'Candlestick',
    'Binoculars', 'Remote Control', 'Satellite Dish', 'Extension Lead', 'Smoke Alarm', 'Keyring',
    'Cardboard Box', 'Plastic Bag', 'Tin', 'Prayer Mat', 'Doormat', 'Piggy Bank',
    'Photo Album', 'Pram', 'Cot', 'Rocking Chair', 'Bin',

    // tools
    'Screw', 'Megaphone', 'Tape Measure', 'Spirit Level', 'Chisel', 'Nest',
    'Rake', 'Hedge Trimmer', 'Watering Can', 'Paintbrush', 'Paint Roller', 'Paint Tin',
    'Sticky Tape', 'Sandpaper', 'Soldering Iron', 'Glue Gun', 'Chainsaw', 'Toolbox',
    'Hard Hat', 'Work Gloves', 'Welding Mask', 'Tin Snips', 'Sickle', 'Pickaxe',
    'Crowbar', 'Wheelbarrow',

    // clothes
    'T-shirt', 'Trousers', 'Shorts', 'Blouse', 'Plunger', 'Hoodie',
    'Leather Jacket', 'Waistcoat', 'Bow Tie', 'Pyjamas', 'Dressing Gown', 'Swimsuit',
    'Blizzard', 'Tights', 'Crayon', 'Trainers', 'Bookmark', 'Boomerang',
    'Broomstick', 'High Heels', 'Flip-flops', 'Beanie', 'Headscarf', 'Cupboard',
    'Mittens', 'Sunglasses', 'Wedding Ring', 'Buckle', 'Anklet', 'Brooch',
    'Horseshoe', 'Handbag', 'Handkerchief', 'School Uniform', 'Turban', 'Fez',
    'Raincoat',

    // school
    'Ballpoint Pen', 'Sharpener', 'Notebook', 'Exercise Book', 'Textbook', 'School Bag',
    'Pencil Case', 'Whiteboard', 'Marker', 'Stapler', 'Hole Punch', 'Paper Clip',
    'Globe', 'Protractor', 'Set Square', 'Dictionary', 'Atlas', 'Diary',
    'Office Chair', 'Folder', 'Rubber Stamp', 'Noticeboard', 'School Bell', 'Water Bottle',

    // tech
    'Mobile Phone', 'Power Bank', 'USB Cable', 'USB Stick', 'Hard Drive', 'CCTV Camera',
    'Smartwatch', 'VR Headset', 'Games Console', 'Controller', 'Snowball', 'Projector',
    'Robot Vacuum', 'Photocopier', 'Cash Machine',

    // vehicles
    'Minibus', 'Tuk-tuk', 'Gondola', 'Felucca', 'Speedboat', 'Fire Engine',
    'Police Car', 'Digger', 'Hourglass', 'Pickup Truck', 'Horse Carriage', 'Donkey Cart',
    'Skateboard', 'Haystack', 'Jet Ski', 'Cable Car', 'Bullet Train', 'Racing Car',
    'Jeep',

    // places
    'House', 'Campsite', 'Street', 'Pavement', 'Traffic Lights', 'Bus Stop',
    'Petrol Station', 'Car Park', 'Nursery', 'Post Office', 'Police Station', 'Town Hall',
    'Fire Station', 'Cemetery', 'Corner Shop', 'Kiosk', 'Clothes Shop', 'Shoe Shop',
    'Phone Shop', 'Rattle', 'Greengrocer', 'Juice Bar', 'Chalet', 'Resort',
    'Icicle', 'Sports Club', 'Football Pitch', 'Bowling Alley', 'Opera House', 'Art Gallery',
    'Funfair', 'Water Park', 'Stable', 'Well', 'Fountain', 'Obelisk',
    'Ancient Temple', 'Ribbon', 'Saddle', 'Launderette', 'Photo Studio', 'Wedding Hall',
    'Toy Shop', 'Internet Café', 'Car Wash', 'Living Room', 'Bedroom', 'Bathroom',
    'Basement', 'Back Garden', 'Playroom', 'Study',

    // jobs
    'Dentist', 'Pharmacist', 'Architect', 'Programmer', 'Head Teacher', 'Police Officer',
    'Shepherd', 'Blacksmith', 'Electrician', 'Builder', 'Taxi Driver', 'Bus Driver',
    'Shopkeeper', 'Hairdresser', 'Doorman', 'Security Guard', 'Gardener', 'Cleaner',
    'Postman', 'Journalist', 'News Reader', 'Photographer', 'Film Director', 'Composer',
    'Musician', 'Sculptor', 'Translator', 'Accountant', 'Secretary', 'Bank Clerk',
    'Cashier', 'Salesperson', 'Trader', 'Estate Agent', 'Archaeologist', 'Tour Guide',
    'Lifeguard', 'Footballer', 'Commentator', 'Acrobat', 'Model', 'YouTuber',
    'Fighter Pilot', 'Army Officer', 'Diplomat', 'Ambassador', 'Minister', 'Imam',
    'Priest', 'Psychologist', 'Optician', 'Paediatrician', 'Pastry Chef', 'Watchmaker',
    'Jeweller', 'Syringe', 'Librarian', 'Zookeeper', 'Beekeeper', 'Park Ranger',
    'Sundial',

    // sports
    'Football', 'Basketball', 'Volleyball', 'Handball', 'Table Tennis', 'Squash',
    'Padel', 'Swimming', 'Scarecrow', 'Water Polo', 'Rowing', 'Water Skiing',
    'Sceptre', 'Sailing', 'Running', 'High Jump', 'Long Jump', 'Pole Vault',
    'Javelin', 'Shot Put', 'Weightlifting', 'Bodybuilding', 'Gymnastics', 'Boxing',
    'Karate', 'Judo', 'Taekwondo', 'Kung Fu', 'Fencing', 'Shooting',
    'Archery', 'Horse Riding', 'Horse Racing', 'Cycling', 'Motor Racing', 'Ice Skating',
    'Snorkel', 'Yoga', 'Aerobics', 'Zumba', 'Bowling', 'Snooker',
    'Ballet', 'Baseball', 'Hurdles', 'Race Walking', 'Triathlon', 'Parkour',
    'Skateboarding', 'Skipping',

    // instruments
    'Oud', 'Thimble', 'Tiara', 'Cello', 'Double Bass', 'Drum Kit',
    'Xylophone', 'Saxophone', 'Trombone', 'Harmonica', 'Bagpipes', 'Banjo',
    'Ukulele', 'Maracas', 'Tuba', 'French Horn', 'Recorder',

    // nature
    'Hail', 'Sandstorm', 'Hurricane', 'Palm Tree', 'Coral Reef', 'Crescent',
    'Full Moon', 'Quilt', 'Lunar Eclipse', 'Sunrise', 'Iceberg', 'North Pole',
    'South Pole',

    // body
    'Eyebrows', 'Eyelashes', 'Calendar', 'Doghouse', 'Fingernail', 'Tummy',
    'Belly Button', 'Carousel', 'Liver', 'Kidney', 'Artery', 'Tonsils',
    'Appendix',

    // countries
    'Egypt', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
    'Yemen', 'Jordan', 'Palestine', 'Lebanon', 'Syria', 'Iraq',
    'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan', 'Mauritania',
    'Somalia', 'Djibouti', 'Comoros', 'Iran', 'Pakistan', 'India',
    'China', 'Japan', 'South Korea', 'Indonesia', 'Malaysia', 'Thailand',
    'Philippines', 'Vietnam', 'Russia', 'Germany', 'France', 'Italy',
    'Spain', 'Portugal', 'England', 'Greece', 'Netherlands', 'Belgium',
    'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
    'Ukraine', 'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina',
    'Chile', 'Colombia', 'Peru', 'Cuba', 'Australia', 'New Zealand',
    'South Africa', 'Nigeria', 'Kenya', 'Ethiopia', 'Ghana', 'Senegal',
    'Cameroon', 'Ivory Coast', 'Ireland', 'Scotland', 'Austria', 'Hungary',
    'Czech Republic', 'Croatia', 'Serbia', 'Romania', 'Bulgaria', 'Iceland',

    // cities
    'Cairo', 'Alexandria', 'Giza', 'Aswan', 'Luxor', 'Port Said',
    'Suez', 'Ismailia', 'Mansoura', 'Tanta', 'Hurghada', 'Dahab',
    'Siwa', 'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dubai',
    'Abu Dhabi', 'Doha', 'Muscat', 'Beirut', 'Amman', 'Baghdad',
    'Damascus', 'Jerusalem', 'Tunis', 'Rabat', 'Casablanca', 'Marrakesh',
    'Khartoum', 'London', 'Paris', 'Rome', 'Madrid', 'Barcelona',
    'Milan', 'Berlin', 'Munich', 'Amsterdam', 'Istanbul', 'Moscow',
    'Athens', 'Vienna', 'Geneva', 'New York', 'Los Angeles', 'Washington',
    'Chicago', 'Toronto', 'Buenos Aires', 'Tokyo', 'Beijing', 'Shanghai',
    'Seoul', 'Bangkok', 'Singapore', 'Mumbai', 'Sydney', 'Cape Town',
    'Manchester', 'Liverpool', 'Venice', 'Florence', 'Lisbon', 'Dublin',
    'Edinburgh', 'San Francisco'
  ]
};
