/* ============================================================================
   🕵️ المهمة السرية — the missions, and where each one fits
   ----------------------------------------------------------------------------
   Shared by the page (the chunk 'mission': the setup sheet's examples, the
   file, the target's question, the TV's ticker and the reveal) and the rooms
   server (bundled by rooms-worker/build.mjs: RoomMission.js deals them through
   nextPrompts). A room deals a mission's id, never its words: each phone says
   it in its own language.

   A mission is [id, places, company, ar, en, arF]:
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
   - arF: the same in Arabic to a girl or a woman («خلّي {target} تجيبلك…»; the
     review of 1 Oct 2026: every mission was written to a man). The server never
     knows anyone's gender: a phone picks the wording for each target name itself
     (the هو / هي on the doer's file, remembered on that phone). English is
     written with "they", so it needs none.
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
  ['t01', '*', 'a', 'خلّي {target} يقول كلمة «بجد»', 'Get {target} to say "seriously"', 'خلّي {target} تقول كلمة «بجد»'],
  ['t02', '*', 'a', 'خلّي {target} يقول «أيام زمان»', 'Get {target} to say "back in the day"', 'خلّي {target} تقول «أيام زمان»'],
  ['t03', '*', 'a', 'خلّي {target} يقولك اسم أكلة بيحبها', 'Get {target} to tell you a food they love', 'خلّي {target} تقولك اسم أكلة بتحبها'],
  ['t04', '*', 'a', 'خلّي {target} يحكيلك آخر حلم حلمه', 'Get {target} to tell you their last dream', 'خلّي {target} تحكيلك آخر حلم حلمته'],
  ['t05', '*', 'a', 'خلّي {target} يقول «يا سلام»', 'Get {target} to say "no way"', 'خلّي {target} تقول «يا سلام»'],
  ['t06', '*', 'a', 'خلّي {target} يسألك «إنت كويس؟»', 'Get {target} to ask you "are you OK?"', 'خلّي {target} تسألك «إنت كويس؟»'],
  ['t07', '*', 'a', 'خلّي {target} يقولك الساعة كام', 'Get {target} to tell you the time', 'خلّي {target} تقولك الساعة كام'],
  ['t08', '*', 'a', 'خلّي {target} يضحك على نكتة من نكتك', 'Get {target} to laugh at one of your jokes', 'خلّي {target} تضحك على نكتة من نكتك'],
  ['t09', '*', 'a', 'خلّي {target} يقول اسم فيلم قديم', 'Get {target} to name an old film', 'خلّي {target} تقول اسم فيلم قديم'],
  ['t10', '*', 'a', 'خلّي {target} يقولك أغنية بيحبها', 'Get {target} to tell you a song they love', 'خلّي {target} تقولك أغنية بتحبها'],
  ['t11', '*', 'a', 'خلّي {target} يعدّ بصوت عالي لحد خمسة', 'Get {target} to count to five out loud', 'خلّي {target} تعدّ بصوت عالي لحد خمسة'],
  ['t12', '*', 'a', 'خلّي {target} يقولك اسم مدرّس كان بيحبه', 'Get {target} to name a teacher they liked', 'خلّي {target} تقولك اسم مدرّس كانت بتحبه'],
  ['t13', '*', 'a', 'خلّي {target} يقول كلمة بلغة تانية وسط كلامه', 'Get {target} to slip a foreign word into what they say', 'خلّي {target} تقول كلمة بلغة تانية وسط كلامها'],
  ['t14', '*', 'a', 'خلّي {target} يحكيلك حاجة حصلتله وهو صغير', 'Get {target} to tell you something from when they were little', 'خلّي {target} تحكيلك حاجة حصلتلها وهي صغيرة'],
  ['t15', '*', 'a', 'خلّي {target} يقولك «عندك حق»', 'Get {target} to say "you\'re right"', 'خلّي {target} تقولك «عندك حق»'],
  ['t16', '*', 'a', 'خلّي {target} يسألك عن رأيك في حاجة', 'Get {target} to ask your opinion on something', 'خلّي {target} تسألك عن رأيك في حاجة'],
  ['t17', '*', 'a', 'خلّي {target} يقول اسم لاعب كورة', 'Get {target} to name a footballer', 'خلّي {target} تقول اسم لاعب كورة'],
  ['t18', '*', 'a', 'خلّي {target} يقول «طب ماشي»', 'Get {target} to say "alright then"', 'خلّي {target} تقول «طب ماشي»'],
  ['t19', '*', 'a', 'خلّي {target} يوصفلك أكلة من غير ما يقول اسمها', 'Get {target} to describe a dish without naming it', 'خلّي {target} توصفلك أكلة من غير ما تقول اسمها'],
  ['t20', '*', 'a', 'خلّي {target} يقولك لونه المفضّل', 'Get {target} to tell you their favourite colour', 'خلّي {target} تقولك لونها المفضّل'],
  ['t21', '*', 'a', 'خلّي {target} يقول «يا خبر»', 'Get {target} to say "oh my goodness"', 'خلّي {target} تقول «يا خبر»'],
  ['t22', '*', 'a', 'خلّي {target} يسألك «بتهزر؟»', 'Get {target} to ask you "are you kidding?"', 'خلّي {target} تسألك «بتهزر؟»'],
  ['t23', '*', 'a', 'خلّي {target} يقولك هو اتولد في شهر إيه', 'Get {target} to tell you the month they were born in', 'خلّي {target} تقولك هي اتولدت في شهر إيه'],
  ['t24', '*', 'a', 'خلّي {target} يقول اسم حيوان بيخاف منه', 'Get {target} to name an animal they\'re scared of', 'خلّي {target} تقول اسم حيوان بتخاف منه'],
  ['t25', '*', 'a', 'خلّي {target} يحكيلك عن أحلى مصيف راحه', 'Get {target} to tell you about their best holiday', 'خلّي {target} تحكيلك عن أحلى مصيف راحته'],
  ['t26', '*', 'a', 'خلّي {target} يقولك «شكرًا»', 'Get {target} to thank you', 'خلّي {target} تقولك «شكرًا»'],
  ['t27', '*', 'a', 'خلّي {target} يقول «تمام التمام»', 'Get {target} to say "perfect"', 'خلّي {target} تقول «تمام التمام»'],
  ['t28', '*', 'a', 'خلّي {target} يقولك اسم مسلسل بيتابعه', 'Get {target} to name a series they\'re watching', 'خلّي {target} تقولك اسم مسلسل بتتابعه'],
  ['t29', '*', 'a', 'خلّي {target} يقلّد صوت حد مشهور', 'Get {target} to do an impression of someone famous', 'خلّي {target} تقلّد صوت حد مشهور'],
  ['t30', '*', 'a', 'خلّي {target} يقول جملة من فيلم', 'Get {target} to quote a line from a film', 'خلّي {target} تقول جملة من فيلم'],
  ['t31', '*', 'a', 'خلّي {target} يقولك نفسه يسافر فين', 'Get {target} to tell you where they\'d love to travel', 'خلّي {target} تقولك نفسها تسافر فين'],
  ['t32', '*', 'a', 'خلّي {target} يقول «أنا جعان»', 'Get {target} to say "I\'m hungry"', 'خلّي {target} تقول «أنا جعانة»'],
  ['t33', '*', 'a', 'خلّي {target} يسألك «إيه ده؟»', 'Get {target} to ask you "what\'s that?"', 'خلّي {target} تسألك «إيه ده؟»'],
  ['t34', '*', 'a', 'خلّي {target} يقولك نكتة', 'Get {target} to tell you a joke', 'خلّي {target} تقولك نكتة'],
  ['t35', '*', 'a', 'خلّي {target} يقول اسمك مرتين ورا بعض', 'Get {target} to say your name twice in a row', 'خلّي {target} تقول اسمك مرتين ورا بعض'],
  ['t36', '*', 'a', 'خلّي {target} يقولك على حاجة بيعرف يعملها كويس', 'Get {target} to tell you something they\'re good at', 'خلّي {target} تقولك على حاجة بتعرف تعملها كويس'],
  ['t37', '*', 'a', 'خلّي {target} يسألك «فاكر؟»', 'Get {target} to ask you "remember?"', 'خلّي {target} تسألك «فاكر؟»'],
  ['t38', '*', 'a', 'خلّي {target} يدندن أغنية', 'Get {target} to hum a tune', 'خلّي {target} تدندن أغنية'],
  ['t39', '*', 'a', 'خلّي {target} يقولك بيحب الشتا ولا الصيف', 'Get {target} to tell you whether they like winter or summer better', 'خلّي {target} تقولك بتحب الشتا ولا الصيف'],
  ['t40', '*', 'a', 'خلّي {target} يقول رقم أكبر من ألف', 'Get {target} to say a number bigger than a thousand', 'خلّي {target} تقول رقم أكبر من ألف'],
  ['t41', '*', 'a', 'خلّي {target} يقول «حلوة دي»', 'Get {target} to say "that\'s a good one"', 'خلّي {target} تقول «حلوة دي»'],
  ['t42', '*', 'a', 'خلّي {target} يقولك اسم أكلة مابيحبهاش', 'Get {target} to name a food they can\'t stand', 'خلّي {target} تقولك اسم أكلة مابتحبهاش'],
  ['t43', '*', 'a', 'خلّي {target} يتكلم عن الجو', 'Get {target} to talk about the weather', 'خلّي {target} تتكلم عن الجو'],
  ['t44', '*', 'a', 'خلّي {target} يقول «يا جماعة»', 'Get {target} to say "listen, everyone"', 'خلّي {target} تقول «يا جماعة»'],
  ['t45', '*', 'a', 'خلّي {target} يقولك صحي الساعة كام النهارده', 'Get {target} to tell you what time they woke up today', 'خلّي {target} تقولك صحيت الساعة كام النهارده'],
  ['t46', '*', 'a', 'خلّي {target} يتكلم معاك عن الكورة', 'Get {target} to talk to you about football', 'خلّي {target} تتكلم معاك عن الكورة'],
  ['t47', '*', 'a', 'خلّي {target} يقولك اسم أول موبايل كان معاه', 'Get {target} to name the first phone they had', 'خلّي {target} تقولك اسم أول موبايل كان معاها'],
  ['t48', '*', 'a', 'خلّي {target} يقول «يا ريت»', 'Get {target} to say "if only"', 'خلّي {target} تقول «يا ريت»'],
  ['t49', '*', 'a', 'خلّي {target} يقولك بيشرب الشاي بكام معلقة سكر', 'Get {target} to tell you how many sugars they take in tea', 'خلّي {target} تقولك بتشرب الشاي بكام معلقة سكر'],
  ['t50', '*', 'a', 'خلّي {target} يقول «خلاص بقى»', 'Get {target} to say "enough already"', 'خلّي {target} تقول «خلاص بقى»'],
  ['t51', '*', 'a', 'خلّي {target} يحكيلك حاجة حلوة حصلت النهارده', 'Get {target} to tell you something nice that happened today', 'خلّي {target} تحكيلك حاجة حلوة حصلت النهارده'],
  ['t52', '*', 'a', 'خلّي {target} يقولك «ربنا يخليك»', 'Get {target} to say "you\'re too kind"', 'خلّي {target} تقولك «ربنا يخليك»'],
  ['t53', '*', 'a', 'خلّي {target} يقول اسم بلد في أفريقيا', 'Get {target} to name a country in Africa', 'خلّي {target} تقول اسم بلد في أفريقيا'],
  ['t54', '*', 'a', 'خلّي {target} يقولك على أكتر حاجة بتضحّكه', 'Get {target} to tell you what makes them laugh the most', 'خلّي {target} تقولك على أكتر حاجة بتضحّكها'],
  ['t55', '*', 'a', 'خلّي {target} يسألك «عامل إيه؟»', 'Get {target} to ask you "how are you doing?"', 'خلّي {target} تسألك «عامل إيه؟»'],

  // --- Talking, anywhere, the friends' ---------------------------------------
  ['f01', '*', 'f', 'خلّي {target} يقولك «يا معلّم»', 'Get {target} to call you "boss"', 'خلّي {target} تقولك «يا معلّم»'],
  ['f02', '*', 'f', 'خلّي {target} يقول «يا عم» تلات مرات', 'Get {target} to say "mate" three times', 'خلّي {target} تقول «يا عم» تلات مرات'],
  ['f03', '*', 'f', 'خلّي {target} يغنّي سطر من أغنية بصوت عالي', 'Get {target} to sing a line of a song out loud', 'خلّي {target} تغنّي سطر من أغنية بصوت عالي'],
  ['f04', '*', 'f', 'خلّي {target} يعترف بحاجة صغيرة بيخاف منها', 'Get {target} to admit to a silly little fear', 'خلّي {target} تعترف بحاجة صغيرة بتخاف منها'],
  ['f05', '*', 'f', 'خلّي {target} يقولك «إنت أحسن واحد هنا»', 'Get {target} to tell you you\'re the best one here', 'خلّي {target} تقولك «إنت أحسن واحد هنا»'],
  ['f06', '*', 'f', 'خلّي {target} يقول كلمة «أسطورة»', 'Get {target} to say "legend"', 'خلّي {target} تقول كلمة «أسطورة»'],
  ['f07', '*', 'f', 'خلّي {target} يضحك بصوت عالي', 'Get {target} to laugh out loud', 'خلّي {target} تضحك بصوت عالي'],
  ['f08', '*', 'f', 'خلّي {target} يقلّد صوت شخصية كرتون', 'Get {target} to do a cartoon voice', 'خلّي {target} تقلّد صوت شخصية كرتون'],
  ['f09', '*', 'f', 'خلّي {target} يقولك «اتفضّل يا باشا»', 'Get {target} to say "after you, your highness"', 'خلّي {target} تقولك «اتفضّل يا باشا»'],
  ['f10', '*', 'f', 'خلّي {target} يتحدّاك في حاجة', 'Get {target} to challenge you to something', 'خلّي {target} تتحدّاك في حاجة'],
  ['f11', '*', 'f', 'خلّي {target} يقولك «مستحيل»', 'Get {target} to say "impossible"', 'خلّي {target} تقولك «مستحيل»'],
  ['f12', '*', 'f', 'خلّي {target} يقول «يا نهار أبيض»', 'Get {target} to say "oh my days"', 'خلّي {target} تقول «يا نهار أبيض»'],
  ['f13', '*', 'f', 'خلّي {target} يحكيلك أغرب حاجة كلها في حياته', 'Get {target} to tell you the strangest thing they\'ve ever eaten', 'خلّي {target} تحكيلك أغرب حاجة كلتها في حياتها'],
  ['f14', '*', 'f', 'خلّي {target} يعمل صوت حيوان', 'Get {target} to make an animal noise', 'خلّي {target} تعمل صوت حيوان'],
  ['f15', '*', 'f', 'خلّي {target} يقول جملة كاملة بالفصحى زي المذيع', 'Get {target} to say a whole sentence like a newsreader', 'خلّي {target} تقول جملة كاملة بالفصحى زي المذيعة'],
  ['f16', '*', 'f', 'خلّي {target} يقولك «إنت عبقري»', 'Get {target} to call you a genius', 'خلّي {target} تقولك «إنت عبقري»'],

  // --- At home -----------------------------------------------------------------
  ['h01', 'h', 'a', 'خلّي {target} يجيبلك كوباية مية', 'Get {target} to bring you a glass of water', 'خلّي {target} تجيبلك كوباية مية'],
  ['h02', 'h', 'a', 'خلّي {target} يقوم يفتح الشباك', 'Get {target} to open the window', 'خلّي {target} تقوم تفتح الشباك'],
  ['h03', 'h', 'a', 'خلّي {target} يناولك الريموت', 'Get {target} to hand you the remote', 'خلّي {target} تناولك الريموت'],
  ['h04', 'h', 'a', 'خلّي {target} يعدّلك المخدّة اللي وراك', 'Get {target} to fix the cushion behind you', 'خلّي {target} تعدّلك المخدّة اللي وراك'],
  ['h05', 'h', 'a', 'خلّي {target} ييجي يقعد جنبك', 'Get {target} to come and sit next to you', 'خلّي {target} تيجي تقعد جنبك'],
  ['h06', 'h', 'a', 'خلّي {target} يولّع أو يطفي نور', 'Get {target} to switch a light on or off', 'خلّي {target} تولّع أو تطفي نور'],
  ['h07', 'h', 'a', 'خلّي {target} يجيبلك حاجة من التلاجة', 'Get {target} to fetch you something from the fridge', 'خلّي {target} تجيبلك حاجة من التلاجة'],
  ['h08', 'h', 'a', 'خلّي {target} يوريك صورة على موبايله', 'Get {target} to show you a photo on their phone', 'خلّي {target} توريك صورة على موبايلها'],
  ['h09', 'h', 'a', 'خلّي {target} يغيّر القناة', 'Get {target} to change the channel', 'خلّي {target} تغيّر القناة'],
  ['h10', 'h', 'a', 'خلّي {target} يعمل شاي', 'Get {target} to make tea', 'خلّي {target} تعمل شاي'],
  ['h11', 'h', 'a', 'خلّي {target} يقوم يقف', 'Get {target} to stand up', 'خلّي {target} تقوم تقف'],
  ['h12', 'h', 'a', 'خلّي {target} يدّيك حتة من اللي بياكله', 'Get {target} to give you a bite of what they\'re eating', 'خلّي {target} تدّيك حتة من اللي بتاكله'],
  ['h13', 'h', 'a', 'خلّي {target} يفتحلك باب', 'Get {target} to open a door for you', 'خلّي {target} تفتحلك باب'],
  ['h14', 'h', 'a', 'خلّي {target} يسلّم عليك بإيده', 'Get {target} to shake your hand', 'خلّي {target} تسلّم عليك بإيدها'],
  ['h15', 'h', 'a', 'خلّي {target} يشغّل أغنية', 'Get {target} to put a song on', 'خلّي {target} تشغّل أغنية'],
  ['h16', 'h', 'a', 'خلّي {target} يشيل معاك الأطباق', 'Get {target} to help you clear the plates', 'خلّي {target} تشيل معاك الأطباق'],
  ['h17', 'h', 'a', 'خلّي {target} يجيبلك مخدّة', 'Get {target} to bring you a cushion', 'خلّي {target} تجيبلك مخدّة'],
  ['h18', 'h', 'a', 'خلّي {target} يعلّي صوت التليفزيون', 'Get {target} to turn the TV up', 'خلّي {target} تعلّي صوت التليفزيون'],
  ['h19', 'h', 'a', 'خلّي {target} يقشّرلك فاكهة', 'Get {target} to peel you a piece of fruit', 'خلّي {target} تقشّرلك فاكهة'],
  ['h20', 'h', 'a', 'خلّي {target} يدوّر معاك على حاجة «ضايعة»', 'Get {target} to help you look for something you "lost"', 'خلّي {target} تدوّر معاك على حاجة «ضايعة»'],
  ['h21', 'h', 'f', 'خلّي {target} يتصوّر معاك سيلفي وهو مكشّر', 'Get {target} to take a selfie with you pulling a grumpy face', 'خلّي {target} تتصوّر معاك سيلفي وهي مكشّرة'],
  ['h22', 'h', 'f', 'خلّي {target} يقوم يرقص تلات ثواني', 'Get {target} to dance for three seconds', 'خلّي {target} تقوم ترقص تلات ثواني'],
  ['h23', 'h', 'f', 'خلّي {target} يلبس الشبشب بالمقلوب', 'Get {target} to put their slippers on the wrong feet', 'خلّي {target} تلبس الشبشب بالمقلوب'],
  ['h24', 'h', 'f', 'خلّي {target} يمشي زي البطريق', 'Get {target} to walk like a penguin', 'خلّي {target} تمشي زي البطريق'],
  ['h25', 'h', 'f', 'خلّي {target} يعمل تمرين ضغط واحد', 'Get {target} to do one push-up', 'خلّي {target} تعمل تمرين ضغط واحد'],
  ['h26', 'h', 'f', 'خلّي {target} يلبس حاجة بتاعتك (كاب أو شال)', 'Get {target} to put on something of yours (a cap or a scarf)', 'خلّي {target} تلبس حاجة بتاعتك (كاب أو شال)'],
  ['h27', 'h', 'f', 'خلّي {target} يمثّل إنه نام', 'Get {target} to pretend to fall asleep', 'خلّي {target} تمثّل إنها نامت'],
  ['h28', 'h', 'f', 'خلّي {target} يقف على رجل واحدة', 'Get {target} to stand on one leg', 'خلّي {target} تقف على رجل واحدة'],

  // --- At a café or a restaurant (the table only: never a stranger bothered) ---
  ['c01', 'c', 'a', 'خلّي {target} يطلب حاجة ساقعة', 'Get {target} to order a cold drink', 'خلّي {target} تطلب حاجة ساقعة'],
  ['c02', 'c', 'a', 'خلّي {target} يبدّل معاك الكرسي', 'Get {target} to swap seats with you', 'خلّي {target} تبدّل معاك الكرسي'],
  ['c03', 'c', 'a', 'خلّي {target} يقرالك حاجة من المنيو', 'Get {target} to read you something off the menu', 'خلّي {target} تقرالك حاجة من المنيو'],
  ['c04', 'c', 'a', 'خلّي {target} يدوق من طبقك', 'Get {target} to taste something from your plate', 'خلّي {target} تدوق من طبقك'],
  ['c05', 'c', 'a', 'خلّي {target} يناولك منديل', 'Get {target} to pass you a napkin', 'خلّي {target} تناولك منديل'],
  ['c06', 'c', 'a', 'خلّي {target} يرشّحلك أكلة من المنيو', 'Get {target} to recommend you something on the menu', 'خلّي {target} ترشّحلك أكلة من المنيو'],
  ['c07', 'c', 'a', 'خلّي {target} يقسم معاك الحلو', 'Get {target} to share a dessert with you', 'خلّي {target} تقسم معاك الحلو'],
  ['c08', 'c', 'a', 'خلّي {target} يقولك هيطلب إيه قبل ما يطلب', 'Get {target} to tell you their order before they order', 'خلّي {target} تقولك هتطلب إيه قبل ما تطلب'],
  ['c09', 'c', 'a', 'خلّي {target} يصوّر الأكل قبل ما حد ياكل', 'Get {target} to photograph the food before anyone eats', 'خلّي {target} تصوّر الأكل قبل ما حد ياكل'],
  ['c10', 'c', 'a', 'خلّي {target} يناولك الملح', 'Get {target} to pass you the salt', 'خلّي {target} تناولك الملح'],
  ['c11', 'c', 'a', 'خلّي {target} يقولك الأكل هنا أحلى ولا أكل البيت', 'Get {target} to say whether the food here beats home cooking', 'خلّي {target} تقولك الأكل هنا أحلى ولا أكل البيت'],
  ['c12', 'c', 'a', 'خلّي {target} يحطلك سكر في الشاي', 'Get {target} to put sugar in your tea', 'خلّي {target} تحطلك سكر في الشاي'],
  ['c13', 'c', 'a', 'خلّي {target} يخبّط كوبايته في كوبايتك «في صحتك»', 'Get {target} to clink glasses with you', 'خلّي {target} تخبّط كوبايتها في كوبايتك «في صحتك»'],
  ['c14', 'c', 'a', 'خلّي {target} يخمّن الحساب هييجي كام', 'Get {target} to guess what the bill will come to', 'خلّي {target} تخمّن الحساب هييجي كام'],
  ['c15', 'c', 'f', 'خلّي {target} يشكر الجرسون بالإنجليزي', 'Get {target} to thank the waiter in French', 'خلّي {target} تشكر الجرسون بالإنجليزي'],
  ['c16', 'c', 'f', 'خلّي {target} يطلب بالإشارة من غير ولا كلمة', 'Get {target} to order by pointing, without a word', 'خلّي {target} تطلب بالإشارة من غير ولا كلمة'],
  ['c17', 'c', 'f', 'خلّي {target} ياكل بإيده التانية', 'Get {target} to eat with their other hand', 'خلّي {target} تاكل بإيدها التانية'],
  ['c18', 'c', 'f', 'خلّي {target} يعمل شنب من المنديل', 'Get {target} to make a moustache out of a napkin', 'خلّي {target} تعمل شنب من المنديل'],
  ['c19', 'c', 'f', 'خلّي {target} يبني برج من أكياس السكر', 'Get {target} to build a tower of sugar sachets', 'خلّي {target} تبني برج من أكياس السكر'],
  ['c20', 'c', 'f', 'خلّي {target} يسمّي الأكلة اللي قدامه اسم جديد', 'Get {target} to give their dish a new name', 'خلّي {target} تسمّي الأكلة اللي قدامها اسم جديد'],

  // --- Out: a trip, the car, the beach ---------------------------------------
  ['o01', 'o', 'a', 'خلّي {target} يعلّي الراديو', 'Get {target} to turn the radio up', 'خلّي {target} تعلّي الراديو'],
  ['o02', 'o', 'a', 'خلّي {target} يغنّي معاك أغنية في الطريق', 'Get {target} to sing along with you on the way', 'خلّي {target} تغنّي معاك أغنية في الطريق'],
  ['o03', 'o', 'a', 'خلّي {target} يشاورلك على عربية حمرا', 'Get {target} to point out a red car', 'خلّي {target} تشاورلك على عربية حمرا'],
  ['o04', 'o', 'a', 'خلّي {target} يكتب اسمك على الرملة', 'Get {target} to write your name in the sand', 'خلّي {target} تكتب اسمك على الرملة'],
  ['o05', 'o', 'a', 'خلّي {target} يتصوّرلك صورة', 'Get {target} to take a photo of you', 'خلّي {target} تتصوّرلك صورة'],
  ['o06', 'o', 'a', 'خلّي {target} يقولك فاضل قد إيه على ما نوصل', 'Get {target} to tell you how long until you get there', 'خلّي {target} تقولك فاضل قد إيه على ما نوصل'],
  ['o07', 'o', 'a', 'خلّي {target} يجيبلك حاجة من الشنطة', 'Get {target} to fetch you something from the bag', 'خلّي {target} تجيبلك حاجة من الشنطة'],
  ['o08', 'o', 'a', 'خلّي {target} يشاورلك على عصفورة أو طيارة', 'Get {target} to point out a bird or a plane', 'خلّي {target} تشاورلك على عصفورة أو طيارة'],
  ['o09', 'o', 'a', 'خلّي {target} يفتح الشباك', 'Get {target} to open a window', 'خلّي {target} تفتح الشباك'],
  ['o10', 'o', 'a', 'خلّي {target} يدّيك من الأكل اللي معاه', 'Get {target} to share their snack with you', 'خلّي {target} تدّيك من الأكل اللي معاها'],
  ['o11', 'o', 'a', 'خلّي {target} يتمشّى معاك شوية', 'Get {target} to go for a little walk with you', 'خلّي {target} تتمشّى معاك شوية'],
  ['o12', 'o', 'a', 'خلّي {target} يلقطلك صدفة أو حجر حلو', 'Get {target} to pick up a nice shell or stone for you', 'خلّي {target} تلقطلك صدفة أو حجر حلو'],
  ['o13', 'o', 'a', 'خلّي {target} يعدّ معاك العربيات البيضا', 'Get {target} to count white cars with you', 'خلّي {target} تعدّ معاك العربيات البيضا'],
  ['o14', 'o', 'a', 'خلّي {target} يقرالك يافطة بصوت عالي', 'Get {target} to read a sign out loud for you', 'خلّي {target} تقرالك يافطة بصوت عالي'],
  ['o15', 'o', 'a', 'خلّي {target} يقولك شايف إيه من الشباك', 'Get {target} to tell you what they can see out of the window', 'خلّي {target} تقولك شايفة إيه من الشباك'],
  ['o16', 'o', 'f', 'خلّي {target} يعمل بوز البطة في صورة', 'Get {target} to pull a duck face in a photo', 'خلّي {target} تعمل بوز البطة في صورة'],
  ['o17', 'o', 'f', 'خلّي {target} يلبس نضّارتك الشمس', 'Get {target} to wear your sunglasses', 'خلّي {target} تلبس نضّارتك الشمس'],
  ['o18', 'o', 'f', 'خلّي {target} ينطّ في صورة', 'Get {target} to jump in a photo', 'خلّي {target} تنطّ في صورة'],
  ['o19', 'o', 'f', 'خلّي {target} يسابقك لحد حتة قريبة', 'Get {target} to race you somewhere close by', 'خلّي {target} تسابقك لحد حتة قريبة'],
  ['o20', 'o', 'f', 'خلّي {target} يعمل صوت موتور العربية', 'Get {target} to make engine noises', 'خلّي {target} تعمل صوت موتور العربية'],
  ['o21', 'o', 'f', 'خلّي {target} يقلّد مذيع النشرة الجوية', 'Get {target} to do a weather-forecast impression', 'خلّي {target} تقلّد مذيع النشرة الجوية']
];

/*
   «قول الكلمة» (idea 557, 7 Oct 2026): a kind of mission made at deal time, «خلّي {target} يقول
   كلمة «أسد»», the word dealt by the server from the drawing words (DRAW_WORDS, PartyContent.js)
   in the language the host plays in. Its id carries the word ('w:أسد'), so every phone says it
   without the list; it is a talking mission, so it fits every place and company.
*/
const MISSION_WORD_PREFIX = 'w:';
const MISSION_WORD_SHARE = 0.25;    // about one file in four is a word to get said

/** The mission with this id, or null. */
const missionById = (id) => {
  if (typeof id === 'string' && id.indexOf(MISSION_WORD_PREFIX) === 0) {
    const w = id.slice(MISSION_WORD_PREFIX.length);
    if (!w) return null;
    return [id, '*', 'a', 'خلّي {target} يقول كلمة «' + w + '»', 'Get {target} to say the word "' + w + '"', 'خلّي {target} تقول كلمة «' + w + '»'];
  }
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

/** What the doer reads: the mission in `lang` with the target's name in it (`she`: the Arabic to a girl). */
const missionText = (id, lang, target, she) => {
  const m = missionById(id);
  if (!m) return '';
  return (lang === 'en' ? m[4] : (she && m[5]) || m[3]).replace('{target}', () => target || '');
};

/** What the table reads once it is done: whose file it was, and the file as it said it. */
const missionQuote = (id, lang, doer, target, she) => {
  const text = missionText(id, lang, target, she);
  if (!text) return '';
  return lang === 'en' ? (doer || '') + ': “' + text + '”' : (doer || '') + ': «' + text + '»';
};
