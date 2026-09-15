/* ============================================================================
   القنبلة — the categories the bomb is passed around on, and the letters.
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs) and the rooms server
   (bundled by rooms-worker/build.mjs). Kinds of things anyone can list out
   loud, never a riddle: the whole table has to hear the category and start
   naming things at once.
   ========================================================================= */
const BOMB_PROMPTS = {
  ar: [
    'ماركات عربيات', 'أكلات مصرية', 'دول عربية', 'دول أوروبية', 'دول أفريقية', 'دول آسيوية', 'عواصم دول',
    'مدن مصرية', 'محافظات مصرية', 'مناطق في القاهرة', 'معالم سياحية', 'لغات', 'عملات',
    'حاجات موجودة في المطبخ', 'أكل موجود في التلاجة', 'حاجات موجودة في الحمام', 'حاجات موجودة في أوضة النوم',
    'حاجات موجودة في العربية', 'حاجات موجودة في المدرسة', 'حاجات موجودة في المستشفى', 'حاجات موجودة في المكتب',
    'حاجات بتتباع في السوبر ماركت', 'حاجات بتتباع في الصيدلية', 'حاجات بتتباع في الكشك', 'حاجات في المطار',
    'حاجات على الشاطئ', 'حاجات في الجنينة', 'حاجات في المطعم', 'حاجات في الكافيه', 'حاجات في الجيم',
    'حاجات في شنطة السفر', 'حاجات في الفضاء', 'حاجات في الصحرا', 'حاجات في البحر', 'حاجات في السما',
    'فواكه', 'خضراوات', 'مكسرات', 'حلويات', 'أنواع كيك وتورت', 'أنواع آيس كريم', 'مشروبات ساخنة', 'مشروبات باردة',
    'أنواع عصير', 'أنواع جبنة', 'أنواع مكرونة', 'توابل وبهارات', 'أكلات الفطار', 'أنواع خبز ومخبوزات', 'أنواع سمك',
    'أكلات إيطالية', 'أكلات على الشارع', 'حاجات بتتحط على البيتزا', 'حاجات بتتحط في الساندويتش', 'مطاعم وسلاسل أكل',
    'حيوانات الغابة', 'حيوانات المزرعة', 'حيوانات بحرية', 'طيور', 'حشرات', 'زواحف', 'حيوانات ليها أربع رجلين',
    'ألوان', 'مهن', 'أسماء ولاد', 'أسماء بنات', 'أعضاء الجسم', 'أنواع رقص', 'رياضات', 'أدوات رياضية',
    'ماركات موبايلات', 'ماركات ملابس ورياضة', 'ماركات شيكولاتة', 'أجهزة كهربائية', 'أجهزة في البيت',
    'أندية كورة مصرية', 'أندية كورة أوروبية', 'لاعيبة كورة', 'منتخبات كورة',
    'أفلام مصرية', 'أفلام أجنبية', 'أفلام كرتون', 'أفلام ديزني', 'مسلسلات', 'برامج أطفال', 'شخصيات كرتون', 'أبطال خارقين',
    'مطربين ومطربات', 'ممثلين وممثلات', 'آلات موسيقية', 'ألعاب أطفال', 'ألعاب فيديو', 'ألعاب طاولة وورق',
    'أدوات مدرسية', 'مواد دراسية', 'أدوات شغل', 'وسائل مواصلات', 'حاجات ليها عجل', 'حاجات ليها زراير',
    'قطع ملابس', 'إكسسوارات', 'حاجات بتتلبس في الرجل', 'أعياد ومناسبات', 'حاجات بتتعمل في الأجازة',
    'حاجات بتطير', 'حاجات بتعوم', 'حاجات بتنور', 'حاجات مدورة', 'حاجات باردة', 'حاجات سخنة',
    'حاجات لونها أحمر', 'حاجات لونها أصفر', 'حاجات لونها أخضر', 'حاجات معمولة من ورق', 'حاجات معمولة من خشب',
    'أنواع ورد وزهور', 'أشجار ونباتات', 'كلمات إنجليزي بنقولها في العربي'
  ],
  en: [
    'Car brands', 'Middle Eastern dishes', 'Arab countries', 'European countries', 'African countries', 'Asian countries', 'Capital cities',
    'Cities in Egypt', 'Famous landmarks', 'Languages', 'Currencies', 'Islands',
    'Things in a kitchen', 'Food in the fridge', 'Things in a bathroom', 'Things in a bedroom',
    'Things in a car', 'Things in a school', 'Things in a hospital', 'Things in an office',
    'Things sold at a supermarket', 'Things sold at a pharmacy', 'Things at an airport',
    'Things at the beach', 'Things in a garden', 'Things in a restaurant', 'Things in a café', 'Things in a gym',
    'Things in a suitcase', 'Things in space', 'Things in the desert', 'Things in the sea', 'Things in the sky',
    'Fruits', 'Vegetables', 'Nuts', 'Desserts', 'Cakes and pastries', 'Ice cream flavours', 'Hot drinks', 'Cold drinks',
    'Juices', 'Cheeses', 'Pasta shapes', 'Spices', 'Breakfast foods', 'Breads and baked goods', 'Fish',
    'Italian dishes', 'Street food', 'Pizza toppings', 'Sandwich fillings', 'Fast-food chains',
    'Jungle animals', 'Farm animals', 'Sea creatures', 'Birds', 'Insects', 'Reptiles', 'Animals with four legs',
    'Colours', 'Jobs', "Boys' names", "Girls' names", 'Body parts', 'Dance styles', 'Sports', 'Sports equipment',
    'Phone brands', 'Clothing and sports brands', 'Chocolate brands', 'Electrical appliances', 'Things around the house',
    'Football clubs', 'National football teams', 'Footballers', 'Olympic sports',
    'Movies', 'Cartoon movies', 'Disney movies', 'TV series', "Kids' shows", 'Cartoon characters', 'Superheroes',
    'Singers', 'Actors', 'Musical instruments', "Kids' games", 'Video games', 'Board and card games',
    'School supplies', 'School subjects', 'Tools', 'Means of transport', 'Things with wheels', 'Things with buttons',
    'Clothes', 'Accessories', 'Things you wear on your feet', 'Holidays and celebrations', 'Holiday activities',
    'Things that fly', 'Things that float', 'Things that glow', 'Round things', 'Cold things', 'Hot things',
    'Red things', 'Yellow things', 'Green things', 'Things made of paper', 'Things made of wood',
    'Flowers', 'Trees and plants', 'Words borrowed from other languages'
  ]
};

const BOMB_LETTERS = {
  ar: 'ا ب ت ث ج ح خ د ر ز س ش ص ض ط ع غ ف ق ك ل م ن ه و ي'.split(' '),
  en: 'A B C D E F G H I J K L M N O P R S T W'.split(' ')
};
