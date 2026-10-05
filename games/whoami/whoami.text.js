/* whoami: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      wa_write_start: "تمام، يلا نلعب",
      wa_write_label_secret: "اكتب شخصية في السر",
      wa_write_label_for: "اكتب شخصية لـ {name}",
      wa_write_hint_secret: "هتتوزّع بالقرعة على حد تاني. الاسم مستخبي لحد ما تدوس 👁️",
      wa_write_hint_for: "{name} ماتشوفش الشاشة. الاسم مستخبي لحد ما تدوس 👁️",
      wa_write_prog: "{n} من {m}",
      wa_cat_manual: "إدخال يدوي",
      wa_cat_mix: "كوكتيل",
      wa_shuffle_label: "خلط الشخصيات",
      wa_shuffle_on: "مفعّل: كل واحد يكتب شخصية في السر، والموبايل يوزّعها على غيره.",
      wa_shuffle_off: "مقفول: الباقيين يكتبوا شخصية كل واحد وهو مش شايف، والوقت يبدأ على طول.",
      wa_hide_from: "خبّي الموبايل عن",
      wa_hide_hint: "{name} يبص بعيد، والباقي يشوفوا شخصيته.",
      wa_show_others: "وريهم شخصيته",
      wa_is: "{name} هو:",
      wa_reveal_hint: "احفظوها ومتقولوهاش لـ {name}!",
      wa_write_secret: "اكتب شخصية في السر…",
      wa_write_for: "شخصية {name}…",
      wa1_got_title: "مين عرف نفسه؟",
      wa1_got_hint: "دوسوا على اللي عرف: الأول 3، التاني 2، والباقي 1. دوسة تانية ترجّعه.",
    },
    en: {
      wa_write_start: "Done, let's play",
      wa_write_label_secret: "Write a character in secret",
      wa_write_label_for: "Write a character for {name}",
      wa_write_hint_secret: "It goes to someone else by draw. The name stays hidden until you tap 👁️",
      wa_write_hint_for: "Keep it from {name}. The name stays hidden until you tap 👁️",
      wa_write_prog: "{n} of {m}",
      wa_cat_manual: "Type them in",
      wa_cat_mix: "Mix",
      wa_shuffle_label: "Shuffle the characters",
      wa_shuffle_on: "On: everyone writes one in secret; the phone deals them to someone else.",
      wa_shuffle_off: "Off: the others type each character while that player looks away; the clock starts at once.",
      wa_hide_from: "Hide the phone from",
      wa_hide_hint: "{name} looks away; everyone else looks.",
      wa_show_others: "Show the others",
      wa_is: "{name} is:",
      wa_reveal_hint: "Remember it, and don't tell {name}!",
      wa_write_secret: "Write a character in secret…",
      wa_write_for: "{name}'s character…",
      wa1_got_title: "Who got theirs?",
      wa1_got_hint: "Tap whoever got it: first 3, second 2, then 1. Tap again to take it back.",
    }
  },
  rules: {
    ar: {
      whoami: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اختار فئة (مشاهير، حيوانات…) أو اكتب الشخصيات بنفسك.</li>
                <li>مرر الموبايل: كل واحد يشوف <b>شخصية غيره</b> ويحفظها، من غير ما يعرف شخصيته هو.</li>
                <li>يبدأ الوقت (60 أو 120 أو 180 ثانية، أو من غير وقت): كل واحد يسأل أسئلة إجابتها أيوه أو لأ («أنا حيوان؟») عشان يعرف هو مين.</li>
                <li>في الآخر <b>كشف الكلمات</b> يوريكم كل واحد كان مين.</li>
                <li>✍️ إدخال يدوي: مع <b>خلط الشخصيات</b> كل واحد يكتب شخصية في السر والموبايل يوزّعها على غيره، ومن غيره الباقيين يكتبوا شخصية كل واحد وهو باصص بعيد.</li>
            </ol>
            <p class="help-sub">🎤 مين يسأل مين؟</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختياري: الموبايل يقول مين يسأل مين كل مرة، بالترتيب أو عشوائي، عشان الأسئلة تتوزع على الكل.</li>
            </ul>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يشوف على موبايله شخصيات الباقي كلهم، وشخصيته هو مخفية. لما تعرف، اضغط <b>عرفت مين أنا!</b>: الأول ياخد 3 نقاط، التاني 2، والباقي نقطة. لما الكل يعرف الجولة تخلص لوحدها.</li>
            </ul>`,
    },
    en: {
      whoami: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Pick a category (celebrities, animals…) or type the characters yourself.</li>
                <li>Pass the phone: each player sees <b>someone else's</b> character and remembers it, without knowing their own.</li>
                <li>The clock starts (60, 120 or 180 seconds, or none): everyone asks yes-or-no questions ("Am I an animal?") to work out who they are.</li>
                <li>At the end, <b>Reveal</b> shows who everyone was.</li>
                <li>✍️ Typing them in: with <b>Shuffle</b> on, everyone writes one in secret and the phone deals them to someone else; with it off, the others type each player's character while they look away.</li>
            </ol>
            <p class="help-sub">🎤 Who asks whom?</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Optional: the phone names who asks whom each turn, in order or random, so the questions are shared out.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Each phone shows everyone else's character and hides its owner's. Once you know, press <b>I know who I am!</b>: the first gets 3 points, the second 2, the rest 1. When everyone has it, the round ends by itself.</li>
            </ul>`,
    }
  }
});
