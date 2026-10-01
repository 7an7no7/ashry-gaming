/* ============================================================================
   🕵️ المهمة السرية — the missions, and where each one fits
   ----------------------------------------------------------------------------
   Shared by the page (the chunk 'mission': the setup sheet's examples, the
   file, the target's question, the TV's ticker and the reveal) and the rooms
   server (bundled by rooms-worker/build.mjs: RoomMission.js deals them through
   nextPrompts). A room deals a mission's id, never its words: each phone says
   it in its own language.

   A mission is [id, places, company, ar, en]:
   - places: '*' a talking mission that fits anywhere (the only ones «في أي
     حتة» deals), or the letters of the places it needs: h البيت, c كافيه أو
     مطعم, o بره (رحلة، عربية، بحر).
   - company: 'a' gentle enough for the family (and so for friends too), 'f'
     the friends' cheekier ones - still clean: nothing adult, nothing that
     embarrasses or hurts anyone, nothing that bothers strangers at a café.
   - ar always starts «خلّي {target} », en «Get {target} », spoken to the doer
     («يجيبلك», "bring you"): so the target's memo, the ticker and the story quote
     it as the doer's file said it (missionQuote), never retell it - «حسن خلّى منى
     يجيبلك…» would make the reader the one brought the water.
   tools/validate-content.js checks the tags, the openings, duplicates, and
   that every place × company has at least MISSION_MIN_POOL to deal from.
   No DOM, nothing that runs at load; every name starts with mission / MISSION_.
   ========================================================================= */
const MISSION_PLACES = ['home', 'cafe', 'out', 'any'];
const MISSION_COMPANIES = ['family', 'friends'];
const MISSION_PLACE_LETTER = { home: 'h', cafe: 'c', out: 'o' };
const MISSION_MIN_POOL = 40;

const MISSIONS = [
  // --- Talking, anywhere, the family's ---------------------------------------
  ['t01', '*', 'a', 'خلّي {target} يقول كلمة «بجد»', 'Get {target} to say "seriously"'],
  ['t02', '*', 'a', 'خلّي {target} يقول «أيام زمان»', 'Get {target} to say "back in the day"'],
  ['t03', '*', 'a', 'خلّي {target} يقولك اسم أكلة بيحبها', 'Get {target} to tell you a food they love'],
  ['t04', '*', 'a', 'خلّي {target} يحكيلك آخر حلم حلمه', 'Get {target} to tell you their last dream'],
  ['t05', '*', 'a', 'خلّي {target} يقول «يا سلام»', 'Get {target} to say "no way"'],
  ['t06', '*', 'a', 'خلّي {target} يسألك «إنت كويس؟»', 'Get {target} to ask you "are you OK?"'],
  ['t07', '*', 'a', 'خلّي {target} يقولك الساعة كام', 'Get {target} to tell you the time'],
  ['t08', '*', 'a', 'خلّي {target} يضحك على نكتة من نكتك', 'Get {target} to laugh at one of your jokes'],
  ['t09', '*', 'a', 'خلّي {target} يقول اسم فيلم قديم', 'Get {target} to name an old film'],
  ['t10', '*', 'a', 'خلّي {target} يقولك أغنية بيحبها', 'Get {target} to tell you a song they love'],
  ['t11', '*', 'a', 'خلّي {target} يعدّ بصوت عالي لحد خمسة', 'Get {target} to count to five out loud'],
  ['t12', '*', 'a', 'خلّي {target} يقولك اسم مدرّس كان بيحبه', 'Get {target} to name a teacher they liked'],
  ['t13', '*', 'a', 'خلّي {target} يقول كلمة بلغة تانية وسط كلامه', 'Get {target} to slip a foreign word into what they say'],
  ['t14', '*', 'a', 'خلّي {target} يحكيلك حاجة حصلتله وهو صغير', 'Get {target} to tell you something from when they were little'],
  ['t15', '*', 'a', 'خلّي {target} يقولك «عندك حق»', 'Get {target} to say "you\'re right"'],
  ['t16', '*', 'a', 'خلّي {target} يسألك عن رأيك في حاجة', 'Get {target} to ask your opinion on something'],
  ['t17', '*', 'a', 'خلّي {target} يقول اسم لاعب كورة', 'Get {target} to name a footballer'],
  ['t18', '*', 'a', 'خلّي {target} يقول «طب ماشي»', 'Get {target} to say "alright then"'],
  ['t19', '*', 'a', 'خلّي {target} يوصفلك أكلة من غير ما يقول اسمها', 'Get {target} to describe a dish without naming it'],
  ['t20', '*', 'a', 'خلّي {target} يقولك لونه المفضّل', 'Get {target} to tell you their favourite colour'],
  ['t21', '*', 'a', 'خلّي {target} يقول «يا خبر»', 'Get {target} to say "oh my goodness"'],
  ['t22', '*', 'a', 'خلّي {target} يسألك «بتهزر؟»', 'Get {target} to ask you "are you kidding?"'],
  ['t23', '*', 'a', 'خلّي {target} يقولك هو اتولد في شهر إيه', 'Get {target} to tell you the month they were born in'],
  ['t24', '*', 'a', 'خلّي {target} يقول اسم حيوان بيخاف منه', 'Get {target} to name an animal they\'re scared of'],
  ['t25', '*', 'a', 'خلّي {target} يحكيلك عن أحلى مصيف راحه', 'Get {target} to tell you about their best holiday'],
  ['t26', '*', 'a', 'خلّي {target} يقولك «شكرًا»', 'Get {target} to thank you'],
  ['t27', '*', 'a', 'خلّي {target} يقول «تمام التمام»', 'Get {target} to say "perfect"'],
  ['t28', '*', 'a', 'خلّي {target} يقولك اسم مسلسل بيتابعه', 'Get {target} to name a series they\'re watching'],
  ['t29', '*', 'a', 'خلّي {target} يقلّد صوت حد مشهور', 'Get {target} to do an impression of someone famous'],
  ['t30', '*', 'a', 'خلّي {target} يقول جملة من فيلم', 'Get {target} to quote a line from a film'],
  ['t31', '*', 'a', 'خلّي {target} يقولك نفسه يسافر فين', 'Get {target} to tell you where they\'d love to travel'],
  ['t32', '*', 'a', 'خلّي {target} يقول «أنا جعان»', 'Get {target} to say "I\'m hungry"'],
  ['t33', '*', 'a', 'خلّي {target} يسألك «إيه ده؟»', 'Get {target} to ask you "what\'s that?"'],
  ['t34', '*', 'a', 'خلّي {target} يقولك نكتة', 'Get {target} to tell you a joke'],
  ['t35', '*', 'a', 'خلّي {target} يقول اسمك مرتين ورا بعض', 'Get {target} to say your name twice in a row'],
  ['t36', '*', 'a', 'خلّي {target} يقولك على حاجة بيعرف يعملها كويس', 'Get {target} to tell you something they\'re good at'],
  ['t37', '*', 'a', 'خلّي {target} يسألك «فاكر؟»', 'Get {target} to ask you "remember?"'],
  ['t38', '*', 'a', 'خلّي {target} يدندن أغنية', 'Get {target} to hum a tune'],
  ['t39', '*', 'a', 'خلّي {target} يقولك بيحب الشتا ولا الصيف', 'Get {target} to tell you whether they like winter or summer better'],
  ['t40', '*', 'a', 'خلّي {target} يقول رقم أكبر من ألف', 'Get {target} to say a number bigger than a thousand'],
  ['t41', '*', 'a', 'خلّي {target} يقول «حلوة دي»', 'Get {target} to say "that\'s a good one"'],
  ['t42', '*', 'a', 'خلّي {target} يقولك اسم أكلة مابيحبهاش', 'Get {target} to name a food they can\'t stand'],
  ['t43', '*', 'a', 'خلّي {target} يتكلم عن الجو', 'Get {target} to talk about the weather'],
  ['t44', '*', 'a', 'خلّي {target} يقول «يا جماعة»', 'Get {target} to say "listen, everyone"'],
  ['t45', '*', 'a', 'خلّي {target} يقولك صحي الساعة كام النهارده', 'Get {target} to tell you what time they woke up today'],
  ['t46', '*', 'a', 'خلّي {target} يتكلم معاك عن الكورة', 'Get {target} to talk to you about football'],
  ['t47', '*', 'a', 'خلّي {target} يقولك اسم أول موبايل كان معاه', 'Get {target} to name the first phone they had'],
  ['t48', '*', 'a', 'خلّي {target} يقول «يا ريت»', 'Get {target} to say "if only"'],
  ['t49', '*', 'a', 'خلّي {target} يقولك بيشرب الشاي بكام معلقة سكر', 'Get {target} to tell you how many sugars they take in tea'],
  ['t50', '*', 'a', 'خلّي {target} يقول «خلاص بقى»', 'Get {target} to say "enough already"'],
  ['t51', '*', 'a', 'خلّي {target} يحكيلك حاجة حلوة حصلت النهارده', 'Get {target} to tell you something nice that happened today'],
  ['t52', '*', 'a', 'خلّي {target} يقولك «ربنا يخليك»', 'Get {target} to say "you\'re too kind"'],
  ['t53', '*', 'a', 'خلّي {target} يقول اسم بلد في أفريقيا', 'Get {target} to name a country in Africa'],
  ['t54', '*', 'a', 'خلّي {target} يقولك على أكتر حاجة بتضحّكه', 'Get {target} to tell you what makes them laugh the most'],
  ['t55', '*', 'a', 'خلّي {target} يسألك «عامل إيه؟»', 'Get {target} to ask you "how are you doing?"'],

  // --- Talking, anywhere, the friends' ---------------------------------------
  ['f01', '*', 'f', 'خلّي {target} يقولك «يا معلّم»', 'Get {target} to call you "boss"'],
  ['f02', '*', 'f', 'خلّي {target} يقول «يا عم» تلات مرات', 'Get {target} to say "mate" three times'],
  ['f03', '*', 'f', 'خلّي {target} يغنّي سطر من أغنية بصوت عالي', 'Get {target} to sing a line of a song out loud'],
  ['f04', '*', 'f', 'خلّي {target} يعترف بحاجة صغيرة بيخاف منها', 'Get {target} to admit to a silly little fear'],
  ['f05', '*', 'f', 'خلّي {target} يقولك «إنت أحسن واحد هنا»', 'Get {target} to tell you you\'re the best one here'],
  ['f06', '*', 'f', 'خلّي {target} يقول كلمة «أسطورة»', 'Get {target} to say "legend"'],
  ['f07', '*', 'f', 'خلّي {target} يضحك بصوت عالي', 'Get {target} to laugh out loud'],
  ['f08', '*', 'f', 'خلّي {target} يقلّد صوت شخصية كرتون', 'Get {target} to do a cartoon voice'],
  ['f09', '*', 'f', 'خلّي {target} يقولك «اتفضّل يا باشا»', 'Get {target} to say "after you, your highness"'],
  ['f10', '*', 'f', 'خلّي {target} يتحدّاك في حاجة', 'Get {target} to challenge you to something'],
  ['f11', '*', 'f', 'خلّي {target} يقولك «مستحيل»', 'Get {target} to say "impossible"'],
  ['f12', '*', 'f', 'خلّي {target} يقول «يا نهار أبيض»', 'Get {target} to say "oh my days"'],
  ['f13', '*', 'f', 'خلّي {target} يحكيلك أغرب حاجة كلها في حياته', 'Get {target} to tell you the strangest thing they\'ve ever eaten'],
  ['f14', '*', 'f', 'خلّي {target} يعمل صوت حيوان', 'Get {target} to make an animal noise'],
  ['f15', '*', 'f', 'خلّي {target} يقول جملة كاملة بالفصحى زي المذيع', 'Get {target} to say a whole sentence like a newsreader'],
  ['f16', '*', 'f', 'خلّي {target} يقولك «إنت عبقري»', 'Get {target} to call you a genius'],

  // --- At home -----------------------------------------------------------------
  ['h01', 'h', 'a', 'خلّي {target} يجيبلك كوباية مية', 'Get {target} to bring you a glass of water'],
  ['h02', 'h', 'a', 'خلّي {target} يقوم يفتح الشباك', 'Get {target} to open the window'],
  ['h03', 'h', 'a', 'خلّي {target} يناولك الريموت', 'Get {target} to hand you the remote'],
  ['h04', 'h', 'a', 'خلّي {target} يعدّلك المخدّة اللي وراك', 'Get {target} to fix the cushion behind you'],
  ['h05', 'h', 'a', 'خلّي {target} ييجي يقعد جنبك', 'Get {target} to come and sit next to you'],
  ['h06', 'h', 'a', 'خلّي {target} يولّع أو يطفي نور', 'Get {target} to switch a light on or off'],
  ['h07', 'h', 'a', 'خلّي {target} يجيبلك حاجة من التلاجة', 'Get {target} to fetch you something from the fridge'],
  ['h08', 'h', 'a', 'خلّي {target} يوريك صورة على موبايله', 'Get {target} to show you a photo on their phone'],
  ['h09', 'h', 'a', 'خلّي {target} يغيّر القناة', 'Get {target} to change the channel'],
  ['h10', 'h', 'a', 'خلّي {target} يعمل شاي', 'Get {target} to make tea'],
  ['h11', 'h', 'a', 'خلّي {target} يقوم يقف', 'Get {target} to stand up'],
  ['h12', 'h', 'a', 'خلّي {target} يدّيك حتة من اللي بياكله', 'Get {target} to give you a bite of what they\'re eating'],
  ['h13', 'h', 'a', 'خلّي {target} يفتحلك باب', 'Get {target} to open a door for you'],
  ['h14', 'h', 'a', 'خلّي {target} يسلّم عليك بإيده', 'Get {target} to shake your hand'],
  ['h15', 'h', 'a', 'خلّي {target} يشغّل أغنية', 'Get {target} to put a song on'],
  ['h16', 'h', 'a', 'خلّي {target} يشيل معاك الأطباق', 'Get {target} to help you clear the plates'],
  ['h17', 'h', 'a', 'خلّي {target} يجيبلك مخدّة', 'Get {target} to bring you a cushion'],
  ['h18', 'h', 'a', 'خلّي {target} يعلّي صوت التليفزيون', 'Get {target} to turn the TV up'],
  ['h19', 'h', 'a', 'خلّي {target} يقشّرلك فاكهة', 'Get {target} to peel you a piece of fruit'],
  ['h20', 'h', 'a', 'خلّي {target} يدوّر معاك على حاجة «ضايعة»', 'Get {target} to help you look for something you "lost"'],
  ['h21', 'h', 'f', 'خلّي {target} يتصوّر معاك سيلفي وهو مكشّر', 'Get {target} to take a selfie with you pulling a grumpy face'],
  ['h22', 'h', 'f', 'خلّي {target} يقوم يرقص تلات ثواني', 'Get {target} to dance for three seconds'],
  ['h23', 'h', 'f', 'خلّي {target} يلبس الشبشب بالمقلوب', 'Get {target} to put their slippers on the wrong feet'],
  ['h24', 'h', 'f', 'خلّي {target} يمشي زي البطريق', 'Get {target} to walk like a penguin'],
  ['h25', 'h', 'f', 'خلّي {target} يعمل تمرين ضغط واحد', 'Get {target} to do one push-up'],
  ['h26', 'h', 'f', 'خلّي {target} يلبس حاجة بتاعتك (كاب أو شال)', 'Get {target} to put on something of yours (a cap or a scarf)'],
  ['h27', 'h', 'f', 'خلّي {target} يمثّل إنه نام', 'Get {target} to pretend to fall asleep'],
  ['h28', 'h', 'f', 'خلّي {target} يقف على رجل واحدة', 'Get {target} to stand on one leg'],

  // --- At a café or a restaurant (the table only: never a stranger bothered) ---
  ['c01', 'c', 'a', 'خلّي {target} يطلب حاجة ساقعة', 'Get {target} to order a cold drink'],
  ['c02', 'c', 'a', 'خلّي {target} يبدّل معاك الكرسي', 'Get {target} to swap seats with you'],
  ['c03', 'c', 'a', 'خلّي {target} يقرالك حاجة من المنيو', 'Get {target} to read you something off the menu'],
  ['c04', 'c', 'a', 'خلّي {target} يدوق من طبقك', 'Get {target} to taste something from your plate'],
  ['c05', 'c', 'a', 'خلّي {target} يناولك منديل', 'Get {target} to pass you a napkin'],
  ['c06', 'c', 'a', 'خلّي {target} يرشّحلك أكلة من المنيو', 'Get {target} to recommend you something on the menu'],
  ['c07', 'c', 'a', 'خلّي {target} يقسم معاك الحلو', 'Get {target} to share a dessert with you'],
  ['c08', 'c', 'a', 'خلّي {target} يقولك هيطلب إيه قبل ما يطلب', 'Get {target} to tell you their order before they order'],
  ['c09', 'c', 'a', 'خلّي {target} يصوّر الأكل قبل ما حد ياكل', 'Get {target} to photograph the food before anyone eats'],
  ['c10', 'c', 'a', 'خلّي {target} يناولك الملح', 'Get {target} to pass you the salt'],
  ['c11', 'c', 'a', 'خلّي {target} يقولك الأكل هنا أحلى ولا أكل البيت', 'Get {target} to say whether the food here beats home cooking'],
  ['c12', 'c', 'a', 'خلّي {target} يحطلك سكر في الشاي', 'Get {target} to put sugar in your tea'],
  ['c13', 'c', 'a', 'خلّي {target} يخبّط كوبايته في كوبايتك «في صحتك»', 'Get {target} to clink glasses with you'],
  ['c14', 'c', 'a', 'خلّي {target} يخمّن الحساب هييجي كام', 'Get {target} to guess what the bill will come to'],
  ['c15', 'c', 'f', 'خلّي {target} يشكر الجرسون بالإنجليزي', 'Get {target} to thank the waiter in French'],
  ['c16', 'c', 'f', 'خلّي {target} يطلب بالإشارة من غير ولا كلمة', 'Get {target} to order by pointing, without a word'],
  ['c17', 'c', 'f', 'خلّي {target} ياكل بإيده التانية', 'Get {target} to eat with their other hand'],
  ['c18', 'c', 'f', 'خلّي {target} يعمل شنب من المنديل', 'Get {target} to make a moustache out of a napkin'],
  ['c19', 'c', 'f', 'خلّي {target} يبني برج من أكياس السكر', 'Get {target} to build a tower of sugar sachets'],
  ['c20', 'c', 'f', 'خلّي {target} يسمّي الأكلة اللي قدامه اسم جديد', 'Get {target} to give their dish a new name'],

  // --- Out: a trip, the car, the beach ---------------------------------------
  ['o01', 'o', 'a', 'خلّي {target} يعلّي الراديو', 'Get {target} to turn the radio up'],
  ['o02', 'o', 'a', 'خلّي {target} يغنّي معاك أغنية في الطريق', 'Get {target} to sing along with you on the way'],
  ['o03', 'o', 'a', 'خلّي {target} يشاورلك على عربية حمرا', 'Get {target} to point out a red car'],
  ['o04', 'o', 'a', 'خلّي {target} يكتب اسمك على الرملة', 'Get {target} to write your name in the sand'],
  ['o05', 'o', 'a', 'خلّي {target} يتصوّرلك صورة', 'Get {target} to take a photo of you'],
  ['o06', 'o', 'a', 'خلّي {target} يقولك فاضل قد إيه على ما نوصل', 'Get {target} to tell you how long until you get there'],
  ['o07', 'o', 'a', 'خلّي {target} يجيبلك حاجة من الشنطة', 'Get {target} to fetch you something from the bag'],
  ['o08', 'o', 'a', 'خلّي {target} يشاورلك على عصفورة أو طيارة', 'Get {target} to point out a bird or a plane'],
  ['o09', 'o', 'a', 'خلّي {target} يفتح الشباك', 'Get {target} to open a window'],
  ['o10', 'o', 'a', 'خلّي {target} يدّيك من الأكل اللي معاه', 'Get {target} to share their snack with you'],
  ['o11', 'o', 'a', 'خلّي {target} يتمشّى معاك شوية', 'Get {target} to go for a little walk with you'],
  ['o12', 'o', 'a', 'خلّي {target} يلقطلك صدفة أو حجر حلو', 'Get {target} to pick up a nice shell or stone for you'],
  ['o13', 'o', 'a', 'خلّي {target} يعدّ معاك العربيات البيضا', 'Get {target} to count white cars with you'],
  ['o14', 'o', 'a', 'خلّي {target} يقرالك يافطة بصوت عالي', 'Get {target} to read a sign out loud for you'],
  ['o15', 'o', 'a', 'خلّي {target} يقولك شايف إيه من الشباك', 'Get {target} to tell you what they can see out of the window'],
  ['o16', 'o', 'f', 'خلّي {target} يعمل بوز البطة في صورة', 'Get {target} to pull a duck face in a photo'],
  ['o17', 'o', 'f', 'خلّي {target} يلبس نضّارتك الشمس', 'Get {target} to wear your sunglasses'],
  ['o18', 'o', 'f', 'خلّي {target} ينطّ في صورة', 'Get {target} to jump in a photo'],
  ['o19', 'o', 'f', 'خلّي {target} يسابقك لحد حتة قريبة', 'Get {target} to race you somewhere close by'],
  ['o20', 'o', 'f', 'خلّي {target} يعمل صوت موتور العربية', 'Get {target} to make engine noises'],
  ['o21', 'o', 'f', 'خلّي {target} يقلّد مذيع النشرة الجوية', 'Get {target} to do a weather-forecast impression']
];

/** The mission with this id, or null. */
const missionById = (id) => {
  for (let i = 0; i < MISSIONS.length; i++) if (MISSIONS[i][0] === id) return MISSIONS[i];
  return null;
};

/** Does a mission fit the place and the company the host picked? */
const missionFits = (m, place, company) => {
  if (!m) return false;
  const placeOk = m[1] === '*' || (place !== 'any' && m[1].indexOf(MISSION_PLACE_LETTER[place] || '?') !== -1);
  const companyOk = m[2] === 'a' || company === 'friends';
  return placeOk && companyOk;
};

/** The ids a room deals from for this place and company. */
const missionPool = (place, company) => MISSIONS.filter((m) => missionFits(m, place, company)).map((m) => m[0]);

/** What the doer reads: the mission in `lang` with the target's name in it. */
const missionText = (id, lang, target) => {
  const m = missionById(id);
  if (!m) return '';
  return (lang === 'en' ? m[4] : m[3]).replace('{target}', target || '');
};

/** What the table reads once it is done: whose file it was, and the file as it said it. */
const missionQuote = (id, lang, doer, target) => {
  const text = missionText(id, lang, target);
  if (!text) return '';
  return lang === 'en' ? (doer || '') + ': “' + text + '”' : (doer || '') + ': «' + text + '»';
};
