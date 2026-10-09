/* العرّاف: content creators - YouTubers, TikTokers, gamers, streamers (kind 'p': real people). One line each, as in the other files (notes/games/oracle.md, "Writing entries");
   check with `cd tools && npm run check:oracle`. Added 10 Oct 2026. Only creators whose name, what they make and where they are
   from are certain; nobody famous for a scandal, for pranks that hurt, or for politics. `creator` is firm (marked on everyone here). */
const ORACLE_CREATORS = { kind: 'p', list: [
  /* ---------- Egyptian and Arab ---------- */
  { id: 'dahih',        icon: '🔬', ar: 'الدحيح (أحمد الغندور)', en: 'El Dahih (Ahmed El Ghandour)', yes: 'creator egypt arab explain_v', maybe: 'comedy' },
  { id: 'chefsherbini', icon: '👨‍🍳', ar: 'الشيف الشربيني', en: 'Chef Sherbini', yes: 'egypt arab cook_v tvhost', maybe: 'creator' },
  { id: 'manalalalem',  icon: '👩‍🍳', ar: 'منال العالم', en: 'Manal Al Alem', yes: 'female egypt arab cook_v tvhost' },
  { id: 'choumicha',    icon: '👩‍🍳', ar: 'شميشة', en: 'Choumicha', yes: 'female maghreb arab cook_v tvhost' },
  { id: 'aboflah',      icon: '🎮', ar: 'أبو فلة', en: 'Abo Flah', yes: 'creator gulf arab gaming_v live_v' },
  { id: 'banderitax',   icon: '🎮', ar: 'بندريتا', en: 'BanderitaX', yes: 'creator gulf arab gaming_v comedy' },
  { id: 'joehattab',    icon: '✈️', ar: 'جو حطاب', en: 'Joe Hattab', yes: 'creator levant arab travel_v vlog_v', maybe: 'explorer' },
  { id: 'anasbukhash',  icon: '🎙️', ar: 'أنس بوخش', en: 'Anas Bukhash', yes: 'creator gulf arab podcast', maybe: 'tvhost' },
  { id: 'khalidalameri', icon: '📹', ar: 'خالد العامري', en: 'Khalid Al Ameri', yes: 'creator gulf arab vlog_v', maybe: 'family_v comedy' },
  { id: 'anasasala',    icon: '👨‍👩‍👧', ar: 'أنس وأصالة', en: 'Anas and Asala', yes: 'creator arab family_v group_v vlog_v', maybe: 'female challenge_v' },
  { id: 'noorstars',    icon: '⭐', ar: 'نور ستارز', en: 'Noor Stars', yes: 'creator female gulf arab challenge_v vlog_v', maybe: 'europe' },
  { id: 'hudakattan',   icon: '💄', ar: 'هدى قطان', en: 'Huda Kattan', yes: 'creator female usa beauty_v', maybe: 'arab gulf' },
  /* ---------- gaming ---------- */
  { id: 'pewdiepie',    icon: '🎮', ar: 'بيوديباي', en: 'PewDiePie', yes: 'creator europe gaming_v comedy' },
  { id: 'markiplier',   icon: '🎮', ar: 'ماركيبلاير', en: 'Markiplier', yes: 'creator usa gaming_v', maybe: 'comedy' },
  { id: 'ninja',        icon: '🎮', ar: 'نينجا (تايلر بليفنز)', en: 'Ninja (Tyler Blevins)', yes: 'creator usa gaming_v live_v' },
  { id: 'dantdm',       icon: '🎮', ar: 'دان تي دي إم', en: 'DanTDM', yes: 'creator uk europe gaming_v', maybe: 'kids_v' },
  { id: 'pokimane',     icon: '🎮', ar: 'بوكيمين', en: 'Pokimane', yes: 'creator female gaming_v live_v', maybe: 'maghreb arab' },
  /* ---------- challenges, comedy, TikTok ---------- */
  { id: 'mrbeast',      icon: '💰', ar: 'مستر بيست', en: 'MrBeast', yes: 'creator usa challenge_v', maybe: 'group_v' },
  { id: 'dudeperfect',  icon: '🏀', ar: 'دود بيرفكت', en: 'Dude Perfect', yes: 'creator usa group_v sports_v challenge_v', maybe: 'athlete comedy' },
  { id: 'khabylame',    icon: '🤷', ar: 'خابي لام', en: 'Khaby Lame', yes: 'creator europe tiktok comedy', maybe: 'africa' },
  { id: 'charli',       icon: '💃', ar: 'تشارلي داميليو', en: "Charli D'Amelio", yes: 'creator female usa tiktok dance' },
  { id: 'zachking',     icon: '🪄', ar: 'زاك كينج', en: 'Zach King', yes: 'creator usa tiktok', maybe: 'comedy' },
  /* ---------- cooking and food ---------- */
  { id: 'gordonramsay', icon: '👨‍🍳', ar: 'جوردون رامزي', en: 'Gordon Ramsay', yes: 'uk europe cook_v tvhost born1970', maybe: 'creator tiktok' },
  { id: 'cznburak',     icon: '🍖', ar: 'الشيف بوراك', en: 'CZN Burak', yes: 'creator cook_v', maybe: 'tiktok europe' },
  { id: 'bayashi',      icon: '🍳', ar: 'باياشي', en: 'Bayashi', yes: 'creator asia cook_v tiktok' },
  { id: 'uncleroger',   icon: '🍚', ar: 'أنكل روجر', en: 'Uncle Roger', yes: 'creator comedy', maybe: 'asia cook_v' },
  { id: 'markwiens',    icon: '🍜', ar: 'مارك وينز', en: 'Mark Wiens', yes: 'creator usa travel_v vlog_v' },
  /* ---------- science, tech, vlogs, fitness, beauty ---------- */
  { id: 'markrober',    icon: '🚀', ar: 'مارك روبر', en: 'Mark Rober', yes: 'creator usa explain_v', maybe: 'science challenge_v' },
  { id: 'mkbhd',        icon: '📱', ar: 'ماركيز براونلي', en: 'Marques Brownlee (MKBHD)', yes: 'creator usa tech_v' },
  { id: 'mrwhosetheboss', icon: '📱', ar: 'مستر هوز ذا بوس', en: 'Mrwhosetheboss', yes: 'creator uk europe tech_v' },
  { id: 'caseyneistat', icon: '🎥', ar: 'كيسي نايستات', en: 'Casey Neistat', yes: 'creator usa vlog_v' },
  { id: 'chloeting',    icon: '🏋️', ar: 'كلوي تينج', en: 'Chloe Ting', yes: 'creator female sports_v' },
  { id: 'nikkietutorials', icon: '💄', ar: 'نيكي توتوريالز', en: 'NikkieTutorials', yes: 'creator female europe beauty_v' },
  /* ---------- children's channels ---------- */
  { id: 'ryansworld',   icon: '🧸', ar: 'ريان (ريانز وورلد)', en: "Ryan's World", yes: 'creator usa kids_v family_v' },
  { id: 'likenastya',   icon: '👧', ar: 'ناستيا (لايك ناستيا)', en: 'Like Nastya', yes: 'creator female kids_v family_v', maybe: 'europe usa' },
  { id: 'kidsdiana',    icon: '👧', ar: 'ديانا وروما', en: 'Kids Diana Show', yes: 'creator female kids_v family_v group_v', maybe: 'europe usa' },
  { id: 'vladniki',     icon: '👦', ar: 'فلاد ونيكي', en: 'Vlad and Niki', yes: 'creator kids_v family_v group_v', maybe: 'europe usa' },
  { id: 'blippi',       icon: '🧢', ar: 'بليبي', en: 'Blippi', yes: 'creator usa kids_v' },
  { id: 'msrachel',     icon: '🎵', ar: 'مس ريتشل', en: 'Ms Rachel', yes: 'creator female usa kids_v' },
] };
