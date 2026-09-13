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
    'كأس', 'ميدالية', 'هدف', 'خطة', 'فخ', 'سر', 'كنز', 'وقت', 'حلم', 'ذكرى', 'صوت', 'لون', 'رقم', 'حرف', 'اسم',
    'عيد', 'هدية', 'رسالة', 'طرد', 'تذكرة', 'بطاقة', 'ختم',

    // إضافات جديدة (ملابس، مواد، طبيعة، أماكن، كائنات، نباتات، أدوات، ومفاهيم)
    'قبعة', 'بدلة', 'فستان', 'قميص', 'حذاء', 'حزام', 'معطف', 'شراب',
    'طاقية', 'كرافات', 'طرحة', 'عباية', 'جوانتي', 'حلق', 'إسورة',
    'تاج', 'دبوس', 'زرار', 'سوستة', 'كوتشي', 'نعل', 'جيب',
    'ذهب', 'فضة', 'نحاس', 'حديد', 'خشب', 'زجاج', 'بلاستيك', 'قطن',
    'حرير', 'جلد', 'صوف', 'رخام', 'طوب', 'إسمنت', 'طين', 'فحم',
    'بترول', 'غاز', 'ماس', 'ياقوت', 'لؤلؤ', 'صلصال', 'شمع', 'مطاط',
    'وادي', 'واحة', 'تل', 'هضبة', 'خليج', 'شبه جزيرة', 'غدير', 'محيط',
    'بركة', 'نبع', 'مستنقع', 'أدغال', 'جليد', 'ضباب', 'ندى', 'عاصفة',
    'إعصار', 'شهاب', 'نيزك', 'مذنب', 'كسوف', 'خسوف', 'أفق', 'فجر',
    'غروب', 'نسيم', 'موجة', 'فيضان', 'مد', 'جزر', 'جامع', 'كنيسة', 'معبد', 'هرم', 'مقبرة', 'مصنع', 'مزرعة', 'طاحونة',
    'سد', 'صيدلية', 'مخبز', 'صالون', 'ورشة', 'استوديو', 'سيرك', 'حديقة حيوان',
    'مسبح', 'موقف', 'جراج', 'كوخ', 'خيمة', 'فيلا', 'شقة',
    'سفارة', 'محكمة', 'مستودع', 'ممر', 'غزال', 'فهد',
    'ضبع', 'سنجاب', 'قنفذ', 'ثور', 'ماعز', 'طاووس', 'بجع',
    'لقلق', 'حداية', 'كناري', 'ببغاء', 'نعامة', 'سمان', 'حرباء', 'ضب',
    'سحلية', 'جمبري', 'كابوريا', 'قنديل', 'نجم بحر', 'صرصار', 'ذباب',
    'جراد', 'دودة', 'حلزون', 'خنفساء', 'يعسوب', 'دبور', 'نخلة', 'صبار',
    'ياسمين', 'فل', 'ريحان', 'نعناع', 'زعتر', 'قرفة', 'زنجبيل', 'قرنفل',
    'قمح', 'شعير', 'ذرة', 'أرز', 'عدس', 'حمص', 'فاصوليا', 'بازلاء',
    'بطاطس', 'طماطم', 'خيار', 'كوسة', 'باذنجان', 'تين', 'رمان', 'برتقال',
    'مانجو', 'فراولة', 'خوخ', 'مشمش', 'كريز', 'مفتاح إنجليزي', 'مفك', 'كماشة',
    'شاكوش', 'سندان', 'فأس', 'مجرفة', 'خرطوم', 'رشاش', 'ولاعة',
    'كبريت', 'فانوس', 'كشاف', 'عدسة', 'مجهر', 'ترمومتر', 'بارومتر',
    'سماعة', 'ميكروفون', 'راديو', 'تلفزيون', 'طابعة', 'شاحن', 'كابل',
    'فيش', 'محرك', 'ترس', 'صامولة', 'طاسة', 'صينية', 'طنجرة',
    'فنجان', 'مج', 'ترمس', 'مبشرة', 'مصفاة', 'عصارة',
    'خلاط', 'غلاية', 'شواية', 'فتاحة', 'رمح', 'خنجر', 'خوذة', 'مدفع', 'دبابة', 'رصاصة', 'لغم', 'طوربيد', 'صفارة', 'حاجز', 'ميكانو', 'يويو', 'دمية',
    'طيارة ورق', 'بلية', 'مسرح عرائس', 'أرجوحة', 'زحليقة', 'لوحة', 'تمثال', 'نحت',
    'برواز', 'دف', 'أكورديون', 'صدى', 'بريق',
    'شعاع', 'شعلة', 'رماد', 'دخان', 'سراب', 'بصمة', 'أثر', 'علامة',
    'شعار', 'راية', 'وسام', 'شهادة', 'عملة', 'شيك', 'فاتورة', 'توقيع', 'عقد', 'طابع', 'عنوان',
    'فيلم', 'قناع', 'شبح', 'ساحرة', 'تنين', 'ديناصور',
    'قرصان', 'نينجا', 'روبوت', 'مومياء', 'فرعون', 'جني',
    'عفريت', 'أسطورة', 'بطل', 'شرير', 'محقق', 'سجين',
    'حارس', 'ملاك', 'ممحاة', 'مسطرة', 'سبورة', 'طباشير',
    'فصل', 'امتحان', 'درجة', 'قاموس', 'أطلس', 'حلبة',
    'مضرب', 'غواص', 'قبطان', 'بحار', 'مرساة', 'شراع',
    'دفة', 'منارة', 'سور', 'خندق', 'بئر', 'نافورة',
    'ملاهي', 'بالون', 'كهرباء', 'مغناطيس', 'ليزر', 'رادار',
    'كوكب', 'مجرة', 'مكوك', 'شبشب', 'كعب', 'جرح',
    'دواء', 'حقنة', 'ممرضة', 'نبض', 'رئة', 'كبد',
    'معدة', 'عظم', 'جمجمة', 'هيكل', 'صورة', 'ألوان',
    'حبر', 'رواية', 'قصة', 'أغنية', 'موسيقى', 'إيقاع',
    'رقصة', 'ستارة', 'جمهور', 'تصفيق', 'مخرج', 'مظروف',
    'بريد', 'إنترنت', 'موقع', 'فيروس', 'كود', 'شفرة',
    'عميل', 'كمين', 'سلاح', 'هليكوبتر', 'سفينة', 'كثبان',
    'قمة', 'سفح', 'قطب', 'عنقود', 'كرمة', 'زيتون',
    'نخيل', 'بستان', 'حقل', 'فزاعة', 'جرار', 'ساقية',
    'فرن بلدي', 'كنافة', 'قطايف', 'مسحراتي'
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
    'War', 'Web', 'Whip', 'Witch', 'Yard'
  ]
};
