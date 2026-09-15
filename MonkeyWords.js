/* ============================================================================
   ربع قرد — the dictionaries the phone referees with, and the letters.
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs) and the rooms server
   (bundled by rooms-worker/build.mjs). The classic game spells a name letter
   by letter, so the referee needs whole lists to check a prefix against;
   the chain and name modes need the same lists to accept a name.

   Countries and cities are here. Animals and foods reuse the spy words
   (SPY_WORDS in SpyWords.js) in Arabic and the lists below in English.
   Spoken forms count as names of their own (أمريكا, الإمارات, England).
   Everything is compared through monkeyFold: hamza forms, ة/ه, ى/ي,
   diacritics, spaces and punctuation are ignored - the article is not,
   because "الجزائر" is spelt with it.
   ========================================================================= */
const MONKEY_LISTS = {
  ar: {
    countries: [
    "أفغانستان", "ألبانيا", "الجزائر", "أندورا", "أنغولا", "أنتيغوا وباربودا", "الأرجنتين", "أرمينيا", "أستراليا", "النمسا",
    "أذربيجان", "باهاماس", "البحرين", "بنغلاديش", "بربادوس", "بيلاروس", "بلجيكا", "بليز", "بنين", "بوتان",
    "بوليفيا", "البوسنة والهرسك", "البوسنة", "بوتسوانا", "البرازيل", "بروناي", "بلغاريا", "بوركينا فاسو", "بوروندي", "الرأس الأخضر",
    "كابو فيردي", "كمبوديا", "الكاميرون", "كندا", "جمهورية أفريقيا الوسطى", "تشاد", "تشيلي", "الصين", "كولومبيا", "جزر القمر",
    "جمهورية الكونغو الديمقراطية", "جمهورية الكونغو", "كوستاريكا", "ساحل العاج", "كوت ديفوار", "كرواتيا", "كوبا", "قبرص", "جمهورية التشيك", "تشيكيا",
    "الدنمارك", "جيبوتي", "دومينيكا", "جمهورية الدومينيكان", "الإكوادور", "مصر", "السلفادور", "غينيا الاستوائية", "إريتريا", "إستونيا",
    "إسواتيني", "سوازيلاند", "إثيوبيا", "فيجي", "فنلندا", "فرنسا", "الغابون", "غامبيا", "جورجيا", "ألمانيا",
    "غانا", "اليونان", "غرينادا", "غواتيمالا", "غينيا", "غينيا بيساو", "غيانا", "هايتي", "هندوراس", "المجر",
    "آيسلندا", "الهند", "إندونيسيا", "إيران", "العراق", "أيرلندا", "إسرائيل", "إيطاليا", "جامايكا", "اليابان",
    "الأردن", "كازاخستان", "كينيا", "كيريباتي", "كوريا الشمالية", "كوريا الجنوبية", "الكويت", "قيرغيزستان", "لاوس", "لاتفيا",
    "لبنان", "ليسوتو", "ليبيريا", "ليبيا", "ليختنشتاين", "ليتوانيا", "لوتسمبورغ", "مدغشقر", "مالاوي", "ماليزيا",
    "جزر المالديف", "مالي", "مالطا", "جزر مارشال", "موريتانيا", "موريشيوس", "المكسيك", "ميكرونيزيا", "مولدوفا", "موناكو",
    "منغوليا", "الجبل الأسود", "المغرب", "موزمبيق", "ميانمار", "بورما", "ناميبيا", "ناورو", "نيبال", "هولندا",
    "نيوزيلندا", "نيكاراغوا", "النيجر", "نيجيريا", "مقدونيا الشمالية", "مقدونيا", "النرويج", "سلطنة عمان", "باكستان", "بالاو",
    "فلسطين", "بنما", "بابوا غينيا الجديدة", "باراغواي", "بيرو", "الفلبين", "بولندا", "البرتغال", "قطر", "رومانيا",
    "روسيا", "رواندا", "سانت كيتس ونيفيس", "سانت لوسيا", "سانت فينسنت والغرينادين", "ساموا", "سان مارينو", "ساو تومي وبرينسيبي", "السعودية", "السنغال",
    "صربيا", "سيشل", "سيراليون", "سنغافورة", "سلوفاكيا", "سلوفينيا", "جزر سليمان", "الصومال", "جنوب أفريقيا", "جنوب السودان",
    "إسبانيا", "سريلانكا", "السودان", "سورينام", "السويد", "سويسرا", "سوريا", "تايوان", "طاجيكستان", "تنزانيا",
    "تايلاند", "تيمور الشرقية", "تيمور", "توغو", "تونغا", "ترينيداد وتوباغو", "تونس", "تركيا", "تركمانستان", "توفالو",
    "أوغندا", "أوكرانيا", "الإمارات العربية المتحدة", "الامارات", "المملكة المتحدة", "الولايات المتحدة الأمريكية", "امريكا", "أوروغواي", "أوزبكستان", "فانواتو",
    "الفاتيكان", "الكرسي الرسولي", "فنزويلا", "فيتنام", "اليمن", "زامبيا", "زيمبابوي", "كوسوفو", "إنجلترا", "اسكتلندا",
    "ويلز", "أيرلندا الشمالية", "الولايات المتحدة", "بريطانيا", "روسيا الاتحادية", "عمان", "الكونغو", "التشيك", "كوريا", "هولاندا",
    "الكوريا الجنوبية"
    ],
    cities: [
    "القاهرة", "الجيزة", "الإسكندرية", "أسوان", "الأقصر", "أسيوط", "سوهاج", "قنا", "المنيا", "بني سويف",
    "الفيوم", "المنصورة", "طنطا", "الزقازيق", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شرم الشيخ", "الغردقة",
    "مرسى مطروح", "العريش", "دمنهور", "كفر الشيخ", "بنها", "شبين الكوم", "المحلة الكبرى", "رشيد", "رأس البر", "العين السخنة",
    "دهب", "نويبع", "طابا", "سيوة", "الخارجة", "الداخلة", "الرياض", "جدة", "مكة", "المدينة المنورة",
    "الدمام", "الطائف", "تبوك", "أبها", "دبي", "أبوظبي", "الشارقة", "عجمان", "العين", "الدوحة",
    "المنامة", "مسقط", "صلالة", "عمّان", "العقبة", "بيروت", "طرابلس", "دمشق", "حلب", "حمص",
    "بغداد", "البصرة", "الموصل", "أربيل", "صنعاء", "عدن", "الخرطوم", "أم درمان", "بنغازي", "تونس",
    "صفاقس", "سوسة", "الجزائر", "وهران", "قسنطينة", "الرباط", "الدار البيضاء", "مراكش", "فاس", "طنجة",
    "أغادير", "نواكشوط", "مقديشو", "جيبوتي", "لندن", "مانشستر", "ليفربول", "باريس", "مرسيليا", "روما",
    "ميلانو", "نابولي", "مدريد", "برشلونة", "برلين", "ميونخ", "إسطنبول", "أنقرة", "موسكو", "نيويورك",
    "لوس أنجلوس", "شيكاغو", "واشنطن", "ميامي", "طوكيو", "أوساكا", "بكين", "شنغهاي", "هونغ كونغ", "سيول",
    "دلهي", "مومباي", "بانكوك", "كوالالمبور", "سنغافورة", "جاكرتا", "مانيلا", "سيدني", "ملبورن", "تورونتو",
    "مونتريال", "فانكوفر", "ريو دي جانيرو", "ساو باولو", "بوينس آيرس", "مكسيكو سيتي", "أثينا", "فيينا", "أمستردام", "بروكسل",
    "زيورخ", "جنيف", "ستوكهولم", "أوسلو", "كوبنهاغن", "هلسنكي", "لشبونة", "دبلن", "براغ", "بودابست",
    "وارسو", "كييف", "تبليسي", "باكو", "طهران", "أصفهان", "كراتشي", "لاهور", "إسلام آباد", "كابول",
    "عشق آباد", "طشقند", "نيروبي", "أديس أبابا", "لاغوس", "أكرا", "داكار", "كيب تاون", "جوهانسبرغ"
    ]
  },
  en: {
    countries: [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
    "Bosnia", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad",
    "Chile", "China", "Colombia", "Comoros", "Congo", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark",
    "Djibouti", "Dominica", "Ecuador", "Egypt", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
    "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
    "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
    "Netherlands", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
    "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Samoa",
    "Senegal", "Serbia", "Seychelles", "Singapore", "Slovakia", "Slovenia", "Somalia", "Spain", "Sudan", "Suriname",
    "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Tunisia",
    "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
    "Yemen", "Zambia", "Zimbabwe", "England", "Scotland", "Wales", "America", "Britain", "Holland", "United States",
    "United Kingdom", "United Arab Emirates", "Saudi Arabia", "South Africa", "South Korea", "North Korea", "New Zealand", "Sri Lanka", "Costa Rica", "El Salvador",
    "Dominican Republic", "Papua New Guinea", "Sierra Leone", "Burkina Faso", "Cape Verde", "Ivory Coast", "Czech Republic", "South Sudan", "North Macedonia", "Trinidad and Tobago",
    "Solomon Islands", "Marshall Islands", "East Timor", "Equatorial Guinea", "Guinea-Bissau", "San Marino", "Vatican City", "Saint Lucia", "Antigua and Barbuda", "Bosnia and Herzegovina",
    "Central African Republic", "Northern Ireland", "Hong Kong", "Macedonia", "Burma", "Swaziland", "Persia"
    ],
    cities: [
    "Cairo", "Giza", "Alexandria", "Aswan", "Luxor", "Hurghada", "London", "Manchester", "Liverpool", "Paris",
    "Marseille", "Rome", "Milan", "Naples", "Venice", "Madrid", "Barcelona", "Berlin", "Munich", "Istanbul",
    "Ankara", "Moscow", "Chicago", "Miami", "Boston", "Seattle", "Houston", "Dallas", "Denver", "Atlanta",
    "Toronto", "Montreal", "Vancouver", "Tokyo", "Osaka", "Kyoto", "Beijing", "Shanghai", "Seoul", "Delhi",
    "Mumbai", "Bangkok", "Singapore", "Jakarta", "Manila", "Sydney", "Melbourne", "Athens", "Vienna", "Amsterdam",
    "Brussels", "Zurich", "Geneva", "Stockholm", "Oslo", "Copenhagen", "Helsinki", "Lisbon", "Dublin", "Prague",
    "Budapest", "Warsaw", "Kiev", "Dubai", "Doha", "Riyadh", "Jeddah", "Mecca", "Medina", "Muscat",
    "Beirut", "Damascus", "Baghdad", "Amman", "Tunis", "Algiers", "Casablanca", "Marrakech", "Rabat", "Tangier",
    "Nairobi", "Lagos", "Accra", "Dakar", "Johannesburg", "Havana", "Lima", "Bogota", "Santiago", "Caracas",
    "Baku", "Tehran", "Karachi", "Lahore", "Kabul", "New York", "Los Angeles", "San Francisco", "Las Vegas", "Washington",
    "Mexico City", "Rio de Janeiro", "Sao Paulo", "Buenos Aires", "Hong Kong", "Kuala Lumpur", "Abu Dhabi", "Tel Aviv", "Cape Town", "Sharm El Sheikh",
    "Port Said", "Saint Petersburg", "New Delhi", "Ho Chi Minh City"
    ],
    animals: [
    "Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Monkey", "Gorilla", "Chimpanzee", "Cat", "Dog",
    "Horse", "Donkey", "Camel", "Cow", "Bull", "Goat", "Sheep", "Pig", "Rabbit", "Mouse",
    "Rat", "Hamster", "Squirrel", "Fox", "Wolf", "Bear", "Panda", "Koala", "Kangaroo", "Deer",
    "Moose", "Buffalo", "Bison", "Hippo", "Rhino", "Cheetah", "Leopard", "Jaguar", "Panther", "Lynx",
    "Hyena", "Jackal", "Otter", "Beaver", "Badger", "Skunk", "Raccoon", "Hedgehog", "Porcupine", "Bat",
    "Whale", "Dolphin", "Shark", "Octopus", "Squid", "Jellyfish", "Starfish", "Crab", "Lobster", "Shrimp",
    "Fish", "Salmon", "Tuna", "Sardine", "Trout", "Eel", "Seal", "Walrus", "Penguin", "Eagle",
    "Hawk", "Falcon", "Owl", "Parrot", "Pigeon", "Dove", "Sparrow", "Crow", "Raven", "Swan",
    "Goose", "Duck", "Chicken", "Rooster", "Turkey", "Peacock", "Flamingo", "Ostrich", "Pelican", "Seagull",
    "Hummingbird", "Woodpecker", "Stork", "Vulture", "Snake", "Cobra", "Python", "Viper", "Lizard", "Gecko",
    "Chameleon", "Iguana", "Crocodile", "Alligator", "Turtle", "Tortoise", "Frog", "Toad", "Salamander", "Ant",
    "Bee", "Wasp", "Butterfly", "Moth", "Beetle", "Ladybug", "Spider", "Scorpion", "Mosquito", "Fly",
    "Grasshopper", "Cricket", "Dragonfly", "Snail", "Worm", "Slug", "Antelope", "Gazelle", "Llama", "Alpaca",
    "Yak", "Mole", "Lemur", "Sloth", "Armadillo", "Meerkat", "Mongoose", "Weasel", "Ferret", "Platypus",
    "Orca", "Manatee", "Seahorse", "Clownfish", "Swordfish", "Piranha", "Barracuda", "Anchovy", "Cod", "Herring",
    "Mackerel", "Polar bear", "Killer whale", "Sea lion", "Guinea pig", "Praying mantis"
    ],
    foods: [
    "Pizza", "Burger", "Sandwich", "Pasta", "Spaghetti", "Lasagna", "Risotto", "Sushi", "Ramen", "Noodles",
    "Dumplings", "Taco", "Burrito", "Nachos", "Quesadilla", "Falafel", "Shawarma", "Hummus", "Kebab", "Kofta",
    "Koshari", "Molokhia", "Fattah", "Couscous", "Tagine", "Biryani", "Curry", "Samosa", "Paella", "Omelette",
    "Pancakes", "Waffles", "Croissant", "Bagel", "Baguette", "Toast", "Cereal", "Porridge", "Yogurt", "Cheese",
    "Butter", "Salad", "Soup", "Stew", "Steak", "Chicken", "Fish", "Shrimp", "Lobster", "Sausage",
    "Bacon", "Ham", "Turkey", "Rice", "Bread", "Potato", "Fries", "Chips", "Popcorn", "Chocolate",
    "Cake", "Cookie", "Brownie", "Donut", "Muffin", "Pie", "Tart", "Cheesecake", "Pudding", "Custard",
    "Jelly", "Honey", "Jam", "Peanut", "Almond", "Walnut", "Pistachio", "Apple", "Banana", "Orange",
    "Mango", "Grapes", "Watermelon", "Melon", "Strawberry", "Cherry", "Peach", "Pear", "Plum", "Apricot",
    "Pineapple", "Kiwi", "Lemon", "Lime", "Coconut", "Avocado", "Tomato", "Cucumber", "Carrot", "Onion",
    "Garlic", "Pepper", "Corn", "Peas", "Beans", "Lentils", "Spinach", "Lettuce", "Cabbage", "Broccoli",
    "Cauliflower", "Mushroom", "Eggplant", "Zucchini", "Pumpkin", "Olive", "Dates", "Figs", "Ice cream", "Hot dog",
    "Fish and chips", "Fried chicken", "Mac and cheese", "Apple pie", "French toast", "Spring rolls", "Baba ghanoush", "Baklava", "Kunafa", "Basbousa",
    "Umm Ali", "Rice pudding", "Ful medames", "Peanut butter"
    ]
  }
};

/** The kinds a table can spell, with the label in each language. */
const MONKEY_CATEGORIES = [
  { id: 'countries', ar: 'دول', en: 'Countries', icon: '🌍' },
  { id: 'cities',    ar: 'مدن', en: 'Cities',    icon: '🏙️' },
  { id: 'animals',   ar: 'حيوانات', en: 'Animals', icon: '🐾' },
  { id: 'foods',     ar: 'أكلات', en: 'Food',     icon: '🍽️' }
];

/** Letters only: hamza forms, ة/ه, ى/ي, diacritics, spaces and punctuation are gone. */
const monkeyFold = (text) => String(text || '').toLowerCase()
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك')
  .replace(/[^\p{L}\p{N}]/gu, '');

/** The names of one kind in one language. */
const monkeyPool = (lang, category) => {
  const L = lang === 'en' ? 'en' : 'ar';
  const lists = MONKEY_LISTS[L] || {};
  if (lists[category]) return lists[category];
  if (L === 'ar' && typeof SPY_WORDS !== 'undefined') {
    if (category === 'animals') return SPY_WORDS['حيوانات'] || [];
    if (category === 'foods') return SPY_WORDS['أكلات'] || [];
  }
  return lists.countries || [];
};

/** Every name that starts with these letters. */
const monkeyPrefixWords = (lang, category, letters) =>
  letters ? monkeyPool(lang, category).filter(name => monkeyFold(name).indexOf(letters) === 0) : [];

/** The name these letters spell exactly, if any. */
const monkeyExact = (lang, category, letters) =>
  monkeyPool(lang, category).find(name => monkeyFold(name) === letters) || null;

/** The keypad rows for spelling. */
const MONKEY_KEYS = {
  ar: ['ضصثقفغعهخحجد', 'شسيبلاتنمكط', 'ءؤرذىةوزظ'],
  en: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
};
