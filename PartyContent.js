/* ============================================================================
   PARTY GAME CONTENT
   ----------------------------------------------------------------------------
   Server-side because some of it has to be: a Fibbage question's real answer
   must not reach a client until the votes are in. The rest lives here too so
   every room game draws its content from one place.

   Written for the app's audience — Egyptian/Levantine Arabic as it's actually
   spoken, with an English set that stands on its own rather than being a
   translation.
   ========================================================================= */

/* --- لو خيروك -------------------------------------------------------------
   Two options, both defensible. A pair only works if the room can genuinely
   split on it; anything with an obvious answer is dead weight.
   -------------------------------------------------------------------------- */
const WOULD_YOU_RATHER = {
  ar: [
    ['تعرف ميعاد موتك', 'تعرف طريقة موتك'],
    ['تقدر تطير', 'تبقى خفي'],
    ['تعيش من غير موسيقى', 'تعيش من غير أفلام'],
    ['تاكل نفس الأكلة كل يوم', 'ما تاكلش أكلتك المفضلة تاني'],
    ['تنسى كل ذكرياتك', 'ما تقدرش تعمل ذكريات جديدة'],
    ['تبقى غني ووحيد', 'فقير ومحاط بأصحابك'],
    ['تقرأ أفكار الناس', 'الناس تقرأ أفكارك'],
    ['ترجع 10 سنين لورا', 'تروح 10 سنين قدام'],
    ['تعيش في الصحرا', 'تعيش في القطب'],
    ['تفقد الموبايل شهر', 'تفقد النت شهر'],
    ['تشتغل شغل بتحبه بمرتب قليل', 'شغل بتكرهه بمرتب عالي'],
    ['تبقى مشهور جداً', 'تبقى مجهول تماماً'],
    ['ما تنامش تاني', 'ما تاكلش تاني'],
    ['كل الناس تقول عليك الحقيقة دايماً', 'محدش يقولك الحقيقة أبداً'],
    ['تتكلم كل اللغات', 'تعزف كل الآلات'],
    ['تسافر الفضاء', 'تنزل قاع المحيط'],
    ['تعيش من غير تكييف في الصيف', 'من غير دفاية في الشتا'],
    ['تاكل حلو بس', 'تاكل مالح بس'],
    ['تشتغل 4 أيام 12 ساعة', 'تشتغل 6 أيام 6 ساعات'],
    ['تفقد حاسة الشم', 'تفقد حاسة التذوق'],
    ['يبقى عندك وقت كتير وفلوس قليلة', 'فلوس كتير ووقت قليل'],
    ['تعيش في مدينة زحمة', 'تعيش في قرية بعيدة'],
    ['تبقى دايماً متأخر 10 دقايق', 'دايماً بدري ساعة'],
    ['تنسى أسماء الناس', 'تنسى وشوشهم'],
    ['ما تسمعش موسيقى تاني', 'ما تشوفش البحر تاني'],
    ['تاخد إجازة سنة من غير مرتب', 'تشتغل السنة دي بضعف المرتب'],
    ['تعرف كل حاجة عن الماضي', 'تعرف حاجة واحدة عن المستقبل'],
    ['تبقى أذكى واحد في الأوضة', 'أظرف واحد في الأوضة'],
    ['تاكل من غير ما تشبع', 'تشرب من غير ما ترتوي'],
    ['كل حاجة تشتريها تبقى غالية الضعف', 'ما تشتريش حاجة جديدة أبداً'],
    ['تعيش من غير مرايات', 'تعيش من غير صور'],
    ['تقدر تتكلم مع الحيوانات', 'تتكلم كل لغات البشر'],
    ['تكون بطل في فيلم رعب', 'بطل في فيلم كوميدي'],
    ['يبقى عندك ذاكرة مثالية', 'تقدر تنسى أي حاجة تحب تنساها'],
    ['تمشي على رجلك ساعة كل يوم', 'تقعد في زحمة ساعة كل يوم'],
    ['ما تشوفش أصحابك سنة', 'تشوفهم كل يوم بالإجبار'],
    ['تبقى دايماً حران شوية', 'دايماً بردان شوية'],
    ['تنام 4 ساعات وتصحى نشيط', 'تنام 10 ساعات وتفضل تعبان'],
    ['كل الناس تعرف سرك الوحيد', 'ما تعرفش أسرار حد تاني أبداً'],
    ['تعيش حياتك بالترتيب العكسي', 'تعيش نفس اليوم 100 مرة'],
    ['تختار أكلك بس محدش يختار معاك', 'الناس تختارلك بس تاكلوا سوا'],
    ['تفقد كل صورك القديمة', 'تفقد كل رسايلك القديمة'],
    ['تبقى أطول واحد في العيلة', 'أقصر واحد'],
    ['تشتغل مع أعز أصحابك', 'تشتغل لوحدك من البيت'],
    ['تعرف تطبخ أي حاجة', 'تعرف تصلح أي حاجة'],
    ['الشتا يبقى 9 شهور', 'الصيف يبقى 9 شهور'],
    ['تقعد ساعتين تسمع حد يشتكي', 'تشتكي ساعتين ومحدش سامع'],
    ['ما تستخدمش سوشيال ميديا تاني', 'ما تشوفش تليفزيون تاني'],
    ['تبقى مسؤول عن كل حاجة', 'ما يبقاش ليك رأي في أي حاجة'],
    ['تعيش من غير قهوة', 'تعيش من غير شاي']
  ],
  en: [
    ['Know when you die', 'Know how you die'],
    ['Be able to fly', 'Be invisible'],
    ['Live without music', 'Live without films'],
    ['Eat the same meal daily', 'Never eat your favourite again'],
    ['Forget every memory', 'Never make a new one'],
    ['Be rich and alone', 'Broke and surrounded by friends'],
    ['Read minds', 'Have yours read'],
    ['Go back ten years', 'Skip forward ten years'],
    ['Live in a desert', 'Live in the arctic'],
    ['Lose your phone for a month', 'Lose the internet for a month'],
    ['A job you love, badly paid', 'A job you hate, paid well'],
    ['Be very famous', 'Be completely anonymous'],
    ['Never sleep again', 'Never eat again'],
    ['Everyone always tells you the truth', 'Nobody ever does'],
    ['Speak every language', 'Play every instrument'],
    ['Travel to space', 'Explore the deep ocean'],
    ['No air conditioning in summer', 'No heating in winter'],
    ['Only sweet food', 'Only savoury food'],
    ['Four 12-hour days', 'Six 6-hour days'],
    ['Lose your sense of smell', 'Lose your sense of taste'],
    ['Lots of time, little money', 'Lots of money, no time'],
    ['Live in a crowded city', 'Live in a remote village'],
    ['Always ten minutes late', 'Always an hour early'],
    ['Forget names', 'Forget faces'],
    ['Never hear music again', 'Never see the sea again'],
    ['A year off unpaid', 'This year at double pay'],
    ['Know everything about the past', 'One fact about the future'],
    ['Be the smartest in the room', 'Be the funniest in the room'],
    ['Eat without ever feeling full', 'Drink without ever feeling quenched'],
    ['Everything costs double', 'Never buy anything new again'],
    ['Live without mirrors', 'Live without photographs'],
    ['Talk to animals', 'Speak every human language'],
    ['Star in a horror film', 'Star in a comedy'],
    ['Have perfect memory', 'Be able to forget at will'],
    ['Walk an hour every day', 'Sit in traffic an hour every day'],
    ['Not see your friends for a year', 'Be forced to see them daily'],
    ['Always slightly too hot', 'Always slightly too cold'],
    ['Sleep 4 hours and feel great', 'Sleep 10 and feel awful'],
    ['Everyone knows your one secret', 'You never learn anyone else\'s'],
    ['Live your life in reverse', 'Repeat the same day 100 times'],
    ['Always pick the food, always eat alone', 'Never pick, always eat together'],
    ['Lose every old photo', 'Lose every old message'],
    ['Be the tallest in the family', 'Be the shortest'],
    ['Work with your best friend', 'Work alone from home'],
    ['Be able to cook anything', 'Be able to fix anything'],
    ['Nine months of winter', 'Nine months of summer'],
    ['Listen to someone complain for two hours', 'Complain for two hours to nobody'],
    ['Never use social media again', 'Never watch television again'],
    ['Be responsible for everything', 'Have a say in nothing'],
    ['Live without coffee', 'Live without tea']
  ]
};

/* --- مين أكثر واحد -------------------------------------------------------
   The options are the players themselves, so these only need to be prompts
   the room will argue about.
   -------------------------------------------------------------------------- */
const MOST_LIKELY_TO = {
  ar: [
    'مين أكثر واحد ممكن ينسى عيد ميلاد صاحبه؟',
    'مين أكثر واحد ممكن يتأخر على أي ميعاد؟',
    'مين أكثر واحد ممكن يضيع في مدينة يعرفها؟',
    'مين أكثر واحد ممكن يبقى مشهور على النت؟',
    'مين أكثر واحد ممكن يسيب الشغل ويسافر؟',
    'مين أكثر واحد ممكن يشتري حاجة مش محتاجها؟',
    'مين أكثر واحد ممكن ينام في السينما؟',
    'مين أكثر واحد ممكن يكسب مسابقة أكل؟',
    'مين أكثر واحد ممكن ينسى موبايله في مكان؟',
    'مين أكثر واحد ممكن يتخانق على حاجة تافهة؟',
    'مين أكثر واحد ممكن يبقى رئيس شركة؟',
    'مين أكثر واحد ممكن يعيط في فيلم؟',
    'مين أكثر واحد ممكن يقول نكتة بايخة؟',
    'مين أكثر واحد ممكن يرد على رسالة بعد أسبوع؟',
    'مين أكثر واحد ممكن يوصل الأول في أي رحلة؟',
    'مين أكثر واحد ممكن يعمل حادثة بالعربية؟',
    'مين أكثر واحد ممكن يتعلم لغة جديدة السنة دي؟',
    'مين أكثر واحد ممكن ينسى اسم حد قابله لسه؟',
    'مين أكثر واحد ممكن يطلب نفس الأكل كل مرة؟',
    'مين أكثر واحد ممكن يجيب أعلى فاتورة موبايل؟',
    'مين أكثر واحد ممكن يقعد على السرير اليوم كله؟',
    'مين أكثر واحد ممكن يساعد غريب في الشارع؟',
    'مين أكثر واحد ممكن يخسر في لعبة ويزعل؟',
    'مين أكثر واحد ممكن يعمل حفلة من غير سبب؟',
    'مين أكثر واحد ممكن يفتكر تفاصيل من سنين؟',
    'مين أكثر واحد ممكن يشتري نفس الهدوم بلونين؟',
    'مين أكثر واحد ممكن يتوه في مطار؟',
    'مين أكثر واحد ممكن يبقى آخر واحد يمشي من أي قعدة؟',
    'مين أكثر واحد ممكن ياخد سيلفي في مكان غريب؟',
    'مين أكثر واحد ممكن يصحى بدري في إجازته؟',
    'مين أكثر واحد ممكن يقنعك تعمل حاجة مجنونة؟',
    'مين أكثر واحد ممكن يقرأ الشروط والأحكام؟',
    'مين أكثر واحد ممكن يفضل يتكلم لو محدش سامع؟',
    'مين أكثر واحد ممكن يبقى عنده 5 خطط للإجازة؟',
    'مين أكثر واحد ممكن يخبي إنه اتفرج على المسلسل من غيرنا؟',
    'مين أكثر واحد ممكن يفتكر إنه على حق دايماً؟',
    'مين أكثر واحد ممكن يدفع الحساب من غير ما حد يشوف؟',
    'مين أكثر واحد ممكن يتعصب من صوت الأكل؟',
    'مين أكثر واحد ممكن يبقى عنده نبات مات من قلة المياه؟',
    'مين أكثر واحد ممكن يغني بصوت عالي في العربية؟'
  ],
  en: [
    'Who is most likely to forget a friend\'s birthday?',
    'Who is most likely to be late to everything?',
    'Who is most likely to get lost in their own city?',
    'Who is most likely to go viral?',
    'Who is most likely to quit their job and travel?',
    'Who is most likely to buy something they don\'t need?',
    'Who is most likely to fall asleep at the cinema?',
    'Who is most likely to win an eating contest?',
    'Who is most likely to leave their phone somewhere?',
    'Who is most likely to argue about something trivial?',
    'Who is most likely to run a company one day?',
    'Who is most likely to cry at a film?',
    'Who is most likely to tell a terrible joke?',
    'Who is most likely to reply a week later?',
    'Who is most likely to arrive first, every time?',
    'Who is most likely to reverse into a bollard?',
    'Who is most likely to learn a language this year?',
    'Who is most likely to forget a name instantly?',
    'Who is most likely to order the exact same thing every time?',
    'Who is most likely to have the highest phone bill?',
    'Who is most likely to stay in bed all day?',
    'Who is most likely to help a stranger in the street?',
    'Who is most likely to sulk after losing a game?',
    'Who is most likely to throw a party for no reason?',
    'Who is most likely to remember something from years ago?',
    'Who is most likely to buy the same shirt in two colours?',
    'Who is most likely to get lost in an airport?',
    'Who is most likely to be the last to leave?',
    'Who is most likely to take a selfie somewhere odd?',
    'Who is most likely to wake up early on holiday?',
    'Who is most likely to talk you into something reckless?',
    'Who is most likely to actually read the terms and conditions?',
    'Who is most likely to keep talking when nobody is listening?',
    'Who is most likely to have five plans for one holiday?',
    'Who is most likely to secretly watch ahead in a series?',
    'Who is most likely to be certain they\'re right?',
    'Who is most likely to pay the bill without telling anyone?',
    'Who is most likely to be annoyed by chewing?',
    'Who is most likely to kill a houseplant?',
    'Who is most likely to sing loudly in the car?'
  ]
};

/* --- فيبج -----------------------------------------------------------------
   A real, slightly surprising fact. The answer must be short enough that
   somebody could plausibly have invented it — that is the whole game.
   -------------------------------------------------------------------------- */
const FIBBAGE = {
  ar: [
    { q: 'أطول اسم لمدينة في العالم فيه ___ حرف.', a: '168' },
    { q: 'قلب الجمبري موجود في ___ بتاعه.', a: 'راسه' },
    { q: 'العسل ما بيبوظش أبداً لأن فيه نسبة ___ قليلة جداً.', a: 'مياه' },
    { q: 'الأخطبوط عنده ___ قلوب.', a: 'ثلاثة' },
    { q: 'أقصر حرب في التاريخ استمرت ___ دقيقة.', a: '38' },
    { q: 'الموزة من الناحية النباتية بتتصنف على إنها ___.', a: 'توت' },
    { q: 'الزرافة بتنام حوالي ___ ساعة في اليوم.', a: 'نص' },
    { q: 'أسنان القرش بتتغير طول عمره وممكن يغير ___ سنة.', a: '30 ألف' },
    { q: 'برج إيفل بيطول في الصيف حوالي ___ سنتيمتر.', a: '15' },
    { q: 'النملة تقدر تشيل ___ ضعف وزنها.', a: '50' },
    { q: 'في اليابان في فندق شغال من سنة ___.', a: '705' },
    { q: 'الفراولة مش توت، هي فعلياً من عيلة ___.', a: 'الورد' },
    { q: 'صوت البطة ما بيعملش ___ حسب الأسطورة المشهورة.', a: 'صدى' },
    { q: 'الإنسان بيفقد حوالي ___ شعرة في اليوم بشكل طبيعي.', a: '100' },
    { q: 'أثقل حيوان على الأرض هو ___ الأزرق.', a: 'الحوت' },
    { q: 'في مصر القديمة كانوا بيحلقوا ___ حداد على القطة.', a: 'حواجبهم' },
    { q: 'الكلب بيعرق من ___ بتاعه.', a: 'رجليه' },
    { q: 'البطاطس كانت أول خضار يتزرع في ___.', a: 'الفضاء' },
    { q: 'الفيل هو الحيوان الوحيد اللي ما يقدرش ___.', a: 'ينط' },
    { q: 'قوس قزح الكامل شكله ___ مش قوس.', a: 'دايرة' },
    { q: 'أسرع عضلة في جسم الإنسان موجودة في ___.', a: 'العين' },
    { q: 'الجمل عنده ___ صفوف من الرموش.', a: 'ثلاثة' },
    { q: 'أطول فترة صحيان مسجلة لإنسان حوالي ___ يوم.', a: '11' },
    { q: 'الببغاء ممكن يعيش لحد ___ سنة.', a: '80' },
    { q: 'كوكب ___ بيلف حوالين نفسه أسرع من أي كوكب تاني.', a: 'المشتري' },
    { q: 'الجبنة أكتر أكلة بتتسرق في ___ العالم.', a: 'محلات' },
    { q: 'الدماغ بتستهلك حوالي ___ في المية من طاقة الجسم.', a: '20' },
    { q: 'أول منتج اتقرا بالباركود كان ___.', a: 'علبة لبان' },
    { q: 'البحر الميت اسمه كده لأن ما فيهوش ___.', a: 'كائنات' },
    { q: 'القطط ما بتحسش بطعم ___.', a: 'الحلاوة' },
    { q: 'أطول نبات بينمو في اليوم هو ___.', a: 'الخيزران' },
    { q: 'الفقاعة في الشمبانيا ممكن توصل لـ ___ فقاعة.', a: 'مليون' },
    { q: 'أثقل سحابة ممكن توزن زي ___ فيل.', a: '100' },
    { q: 'العطسة بتطلع بسرعة حوالي ___ كيلومتر في الساعة.', a: '160' },
    { q: 'أطول جسر مشاة معلق في العالم في دولة ___.', a: 'التشيك' }
  ],
  en: [
    { q: 'The longest place name in the world has ___ letters.', a: '85' },
    { q: 'A shrimp\'s heart is located in its ___.', a: 'head' },
    { q: 'Honey never spoils because it contains almost no ___.', a: 'water' },
    { q: 'An octopus has ___ hearts.', a: 'three' },
    { q: 'The shortest war in history lasted ___ minutes.', a: '38' },
    { q: 'Botanically, a banana is classified as a ___.', a: 'berry' },
    { q: 'A giraffe sleeps roughly ___ hours a day.', a: 'two' },
    { q: 'A shark can get through around ___ teeth in a lifetime.', a: '30,000' },
    { q: 'The Eiffel Tower grows about ___ cm taller in summer.', a: '15' },
    { q: 'An ant can carry ___ times its own body weight.', a: '50' },
    { q: 'The oldest hotel still operating opened in the year ___.', a: '705' },
    { q: 'Strawberries are not berries — they belong to the ___ family.', a: 'rose' },
    { q: 'A group of flamingos is called a ___.', a: 'flamboyance' },
    { q: 'A person loses roughly ___ hairs a day, normally.', a: '100' },
    { q: 'The heaviest animal on earth is the ___ whale.', a: 'blue' },
    { q: 'In ancient Egypt, people shaved their ___ to mourn a cat.', a: 'eyebrows' },
    { q: 'Dogs sweat through their ___.', a: 'paws' },
    { q: 'The first vegetable grown in space was the ___.', a: 'potato' },
    { q: 'The elephant is the only mammal that cannot ___.', a: 'jump' },
    { q: 'A complete rainbow is actually a ___, not an arc.', a: 'circle' },
    { q: 'The fastest muscle in the human body is in the ___.', a: 'eye' },
    { q: 'A camel has ___ rows of eyelashes.', a: 'three' },
    { q: 'The longest recorded time without sleep is about ___ days.', a: '11' },
    { q: 'A parrot can live up to ___ years.', a: '80' },
    { q: 'The planet that spins fastest on its axis is ___.', a: 'Jupiter' },
    { q: 'The most shoplifted food in the world is ___.', a: 'cheese' },
    { q: 'The brain uses around ___ percent of the body\'s energy.', a: '20' },
    { q: 'The first product ever scanned by barcode was a packet of ___.', a: 'chewing gum' },
    { q: 'Cats cannot taste ___.', a: 'sweetness' },
    { q: 'The fastest-growing plant on earth is ___.', a: 'bamboo' },
    { q: 'A bottle of champagne can hold up to ___ bubbles.', a: 'a million' },
    { q: 'A single cloud can weigh about as much as ___ elephants.', a: '100' },
    { q: 'A sneeze leaves the body at around ___ km/h.', a: '160' },
    { q: 'Wombat droppings are famously ___ shaped.', a: 'cube' },
    { q: 'The world\'s longest pedestrian suspension bridge is in ___.', a: 'Czechia' }
  ]
};

/* --- ارسم وخمّن -----------------------------------------------------------
   Draw & Guess needs words you can actually put on a canvas. The Codenames
   list was reused at first, but it deliberately contains abstractions —
   وقت، حلم، ذكرى، صوت، سر — which are unguessable from a drawing. These are
   concrete and visually distinct from each other.
   -------------------------------------------------------------------------- */
const DRAW_WORDS = {
  ar: [
    // حيوانات
    'أسد', 'فيل', 'زرافة', 'قرد', 'قطة', 'كلب', 'حصان', 'جمل',
    'سمكة', 'أخطبوط', 'سلحفاة', 'ثعبان', 'نحلة', 'فراشة', 'بطريق', 'دجاجة',
    'بومة', 'حوت', 'دلفين', 'عقرب', 'أرنب', 'خروف', 'بقرة', 'تمساح',
    // أكل
    'بيتزا', 'برجر', 'موزة', 'تفاحة', 'بطيخة', 'عنب', 'آيس كريم', 'كعكة',
    'بيضة', 'سمكة مشوية', 'فنجان قهوة', 'كوب شاي', 'رغيف عيش', 'جبنة', 'عنقود موز', 'شاورما',
    // أشياء البيت
    'باب', 'شباك', 'كرسي', 'ترابيزة', 'سرير', 'مفتاح', 'ساعة', 'مرآة',
    'شمعة', 'لمبة', 'مقص', 'مكنسة', 'سلم', 'مظلة', 'نظارة', 'حقيبة',
    'مفتاح نور', 'ثلاجة', 'تليفون', 'كمبيوتر', 'كاميرا', 'مروحة', 'جرس', 'قفل',
    // مواصلات
    'سيارة', 'أتوبيس', 'قطار', 'طيارة', 'صاروخ', 'مركب', 'دراجة', 'موتوسيكل',
    'غواصة', 'بالون', 'طيارة ورق', 'تاكسي',
    // أماكن ومباني
    'بيت', 'مدرسة', 'مستشفى', 'برج', 'جسر', 'قلعة', 'خيمة', 'كنيسة',
    'مسجد', 'هرم', 'منارة', 'ملعب',
    // طبيعة
    'شمس', 'قمر', 'نجمة', 'سحابة', 'مطر', 'شجرة', 'وردة', 'جبل',
    'بحر', 'نار', 'قوس قزح', 'بركان', 'صبار', 'ورقة شجر', 'ثلج', 'موجة',
    // جسم ووش
    'عين', 'يد', 'قدم', 'قلب', 'أنف', 'ودن', 'سن', 'عضلات',
    // أدوات ورياضة
    'كرة', 'مضرب', 'قوس ونشاب', 'سيف', 'درع', 'مطرقة', 'منشار', 'مسمار',
    'صنارة', 'مفك', 'ميزان', 'سلة', 'كوب', 'طبق', 'ملعقة', 'شوكة',
    'سكينة', 'إبريق', 'زجاجة', 'مفتاح إنجليزي',
    // موسيقى وترفيه
    'جيتار', 'بيانو', 'طبلة', 'كمان', 'ناي', 'ميكروفون', 'تليفزيون', 'نرد',
    // ناس وملابس
    'قميص', 'بنطلون', 'حذاء', 'قبعة', 'خاتم', 'تاج', 'روبوت', 'شبح',
    'ملك', 'طيار', 'طبيب', 'حرامي', 'عروسة', 'ساحر', 'مهرج', 'رجل ثلج',
    // متنوع بصري
    'مفتاح كنز', 'خريطة', 'بوصلة', 'تلسكوب', 'مظروف', 'هدية', 'بالونة', 'تورتة عيد ميلاد',
    'سلسلة', 'شبكة', 'حبل', 'سهم', 'قنبلة', 'صندوق', 'مقعد', 'كوب آيس كريم'
  ],
  en: [
    'Lion', 'Elephant', 'Giraffe', 'Monkey', 'Cat', 'Dog', 'Horse', 'Camel',
    'Fish', 'Octopus', 'Turtle', 'Snake', 'Bee', 'Butterfly', 'Penguin', 'Chicken',
    'Owl', 'Whale', 'Dolphin', 'Scorpion', 'Rabbit', 'Sheep', 'Cow', 'Crocodile',
    'Pizza', 'Burger', 'Banana', 'Apple', 'Watermelon', 'Grapes', 'Ice cream', 'Cake',
    'Egg', 'Coffee cup', 'Teapot', 'Bread', 'Cheese', 'Doughnut', 'Lollipop', 'Popcorn',
    'Door', 'Window', 'Chair', 'Table', 'Bed', 'Key', 'Clock', 'Mirror',
    'Candle', 'Lamp', 'Scissors', 'Broom', 'Ladder', 'Umbrella', 'Glasses', 'Bag',
    'Switch', 'Fridge', 'Phone', 'Computer', 'Camera', 'Fan', 'Bell', 'Padlock',
    'Car', 'Bus', 'Train', 'Plane', 'Rocket', 'Boat', 'Bicycle', 'Motorcycle',
    'Submarine', 'Balloon', 'Kite', 'Taxi',
    'House', 'School', 'Hospital', 'Tower', 'Bridge', 'Castle', 'Tent', 'Church',
    'Pyramid', 'Lighthouse', 'Stadium', 'Windmill',
    'Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Tree', 'Rose', 'Mountain',
    'Sea', 'Fire', 'Rainbow', 'Volcano', 'Cactus', 'Leaf', 'Snowflake', 'Wave',
    'Eye', 'Hand', 'Foot', 'Heart', 'Nose', 'Ear', 'Tooth', 'Skull',
    'Ball', 'Racket', 'Bow and arrow', 'Sword', 'Shield', 'Hammer', 'Saw', 'Nail',
    'Fishing rod', 'Screwdriver', 'Scales', 'Basket', 'Cup', 'Plate', 'Spoon', 'Fork',
    'Knife', 'Kettle', 'Bottle', 'Wrench',
    'Guitar', 'Piano', 'Drum', 'Violin', 'Flute', 'Microphone', 'Television', 'Dice',
    'Shirt', 'Trousers', 'Shoe', 'Hat', 'Ring', 'Crown', 'Robot', 'Ghost',
    'King', 'Pilot', 'Doctor', 'Thief', 'Bride', 'Wizard', 'Clown', 'Snowman',
    'Treasure chest', 'Map', 'Compass', 'Telescope', 'Envelope', 'Gift', 'Birthday cake', 'Anchor',
    'Chain', 'Net', 'Rope', 'Arrow', 'Bomb', 'Box', 'Bench', 'Trophy'
  ]
};
