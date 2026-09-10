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
    'حبل', 'مقص', 'إبرة', 'خيط', 'صابون', 'منشفة', 'فرشاة', 'مشط',
    'محفظة', 'شنطة', 'مظلة', 'نظارة', 'خاتم', 'ساعة يد',

    // أكل وشرب
    'عيش', 'جبنة', 'عسل', 'ملح', 'سكر', 'فلفل', 'ليمون', 'بصل',
    'ثوم', 'زيت', 'شاي', 'قهوة', 'لبن', 'بيض', 'تفاح', 'موز',
    'بطيخ', 'عنب', 'تمر', 'مكسرات', 'كشري', 'فول', 'طعمية', 'شاورما',
    'بيتزا', 'كعك', 'شوكولاتة', 'آيس كريم',

    // حيوانات
    'أسد', 'نمر', 'فيل', 'زرافة', 'قرد', 'ثعلب', 'ذئب', 'دب',
    'قطة', 'كلب', 'حصان', 'حمار', 'جمل', 'خروف', 'بقرة', 'دجاجة',
    'نسر', 'صقر', 'بومة', 'غراب', 'حمامة', 'سمكة', 'قرش', 'حوت',
    'دلفين', 'أخطبوط', 'سلحفاة', 'تمساح', 'ثعبان', 'عقرب', 'نحلة', 'نملة',
    'عنكبوت', 'فراشة', 'بطريق', 'كنغر',

    // أماكن
    'مدرسة', 'جامعة', 'مستشفى', 'مطار', 'محطة', 'ميناء', 'سوق', 'مول',
    'مطعم', 'فندق', 'بنك', 'متحف', 'مكتبة', 'سينما', 'مسرح', 'ملعب',
    'حديقة', 'شاطئ', 'صحراء', 'جبل', 'غابة', 'كهف', 'جزيرة', 'نهر',
    'بحر', 'شلال', 'قلعة', 'قصر', 'برج', 'جسر', 'نفق', 'سجن',

    // مواصلات
    'سيارة', 'أتوبيس', 'قطار', 'مترو', 'طيارة', 'صاروخ', 'مركب', 'غواصة',
    'دراجة', 'موتوسيكل', 'تاكسي', 'إسعاف', 'شاحنة', 'عربية كارو',

    // مهن وناس
    'طبيب', 'مهندس', 'مدرس', 'طباخ', 'حلاق', 'نجار', 'سباك', 'كهربائي',
    'طيار', 'شرطي', 'محامي', 'قاضي', 'ممثل', 'مغني', 'رسام', 'كاتب',
    'لاعب', 'حكم', 'جاسوس', 'حرامي', 'ملك', 'ملكة', 'فارس', 'عروسة',

    // طبيعة وكون
    'شمس', 'قمر', 'نجمة', 'سحابة', 'مطر', 'ثلج', 'برق', 'رعد',
    'ريح', 'نار', 'ماء', 'تراب', 'رمل', 'صخرة', 'شجرة', 'وردة',
    'ورقة', 'جذر', 'بذرة', 'ظل', 'قوس قزح', 'زلزال', 'بركان', 'فضاء',

    // جسم
    'عين', 'أذن', 'أنف', 'فم', 'يد', 'رجل', 'قلب', 'دماغ',
    'سن', 'شعر', 'ظهر', 'دم',

    // أشياء ومفاهيم
    'كتاب', 'قلم', 'ورق', 'خريطة', 'بوصلة', 'تلسكوب', 'ميكروسكوب', 'كاميرا',
    'تليفون', 'كمبيوتر', 'شاشة', 'بطارية', 'مروحة', 'مصباح', 'جرس', 'طبل',
    'جيتار', 'بيانو', 'كمان', 'ناي', 'صنارة', 'شبكة', 'سهم', 'قوس',
    'سيف', 'درع', 'مسدس', 'قنبلة', 'صندوق', 'قفل', 'سلسلة', 'مسمار',
    'مطرقة', 'منشار', 'ميزان', 'سلة', 'كوب', 'طبق', 'ملعقة', 'شوكة',
    'سكين', 'قدر', 'إبريق', 'زجاجة',

    // ألعاب ورياضة
    'كرة', 'شطرنج', 'دومينو', 'ورق لعب', 'نرد', 'لغز', 'سباق', 'بطولة',
    'كأس', 'ميدالية', 'هدف', 'خطة', 'فخ', 'سر', 'كنز', 'خريطة كنز',

    // متنوع
    'وقت', 'حلم', 'ذكرى', 'صوت', 'لون', 'رقم', 'حرف', 'اسم',
    'باب سري', 'عيد', 'هدية', 'رسالة', 'طرد', 'تذكرة', 'بطاقة', 'ختم'
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
    'Stamp', 'Message', 'Parcel', 'Code'
  ]
};
