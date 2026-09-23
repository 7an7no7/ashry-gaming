/* ============================================================================
   خمّن الدولة — THE COUNTRIES: where each one is, and how far apart
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs: the solo game, على راسك's
   places and a room's search box) and the rooms server (bundled by
   rooms-worker/build.mjs: in a room the answer stays on the server, so the
   distance, the direction and the hints of every guess are worked out there).
   Moved out of JS_Flags.html on 23 Sep 2026 for the rooms.

   COUNTRIES: for each of the 196 countries, its code (which draws the flag
   emoji), its name in both languages as ربع قرد spells it, the middle of the
   country (latitude, longitude, to a tenth of a degree, enough for distances),
   its continent and a tier (1 = everyone knows it, 3 = small or far away).
   Israel is not in it; Palestine is. FLAG_ALIASES lets a guess be typed the
   way people say it (أمريكا, England). FLAG_MODES: the guesses each way gets.
   No DOM, nothing that runs at load but the table itself.
   ========================================================================= */
const COUNTRIES = `
DZ|الجزائر|Algeria|28|2.6|af|1;AO|أنغولا|Angola|-12.3|17.5|af|2;BJ|بنين|Benin|9.3|2.3|af|3;BW|بوتسوانا|Botswana|-22.3|24.7|af|3;
BF|بوركينا فاسو|Burkina Faso|12.2|-1.6|af|3;BI|بوروندي|Burundi|-3.4|29.9|af|3;CV|الرأس الأخضر|Cape Verde|16|-24|af|3;CM|الكاميرون|Cameroon|5.7|12.7|af|2;
CF|جمهورية أفريقيا الوسطى|Central African Republic|6.6|20.9|af|3;TD|تشاد|Chad|15.5|18.7|af|2;KM|جزر القمر|Comoros|-11.9|43.9|af|2;
CD|الكونغو الديمقراطية|DR Congo|-2.9|23.7|af|2;CG|جمهورية الكونغو|Republic of the Congo|-0.7|15.2|af|3;CI|ساحل العاج|Ivory Coast|7.5|-5.5|af|2;
DJ|جيبوتي|Djibouti|11.8|42.6|af|2;EG|مصر|Egypt|26.8|30.8|af|1;GQ|غينيا الاستوائية|Equatorial Guinea|1.6|10.3|af|3;ER|إريتريا|Eritrea|15.2|39.8|af|3;
SZ|إسواتيني|Eswatini|-26.5|31.5|af|3;ET|إثيوبيا|Ethiopia|9.1|40.5|af|2;GA|الغابون|Gabon|-0.8|11.6|af|3;GM|غامبيا|Gambia|13.4|-15.3|af|3;
GH|غانا|Ghana|7.9|-1|af|2;GN|غينيا|Guinea|10.4|-10.9|af|3;GW|غينيا بيساو|Guinea-Bissau|12|-15|af|3;KE|كينيا|Kenya|0.2|37.9|af|2;
LS|ليسوتو|Lesotho|-29.6|28.2|af|3;LR|ليبيريا|Liberia|6.4|-9.4|af|3;LY|ليبيا|Libya|26.3|17.2|af|1;MG|مدغشقر|Madagascar|-18.8|46.9|af|2;
MW|مالاوي|Malawi|-13.3|34.3|af|3;ML|مالي|Mali|17.6|-4|af|2;MR|موريتانيا|Mauritania|21|-10.9|af|2;MU|موريشيوس|Mauritius|-20.3|57.6|af|3;
MA|المغرب|Morocco|31.8|-7.1|af|1;MZ|موزمبيق|Mozambique|-18.7|35.5|af|3;NA|ناميبيا|Namibia|-22.6|17.1|af|3;NE|النيجر|Niger|17.6|8.1|af|2;
NG|نيجيريا|Nigeria|9.1|8.7|af|1;RW|رواندا|Rwanda|-1.9|29.9|af|3;ST|ساو تومي وبرينسيبي|São Tomé and Príncipe|0.2|6.6|af|3;
SN|السنغال|Senegal|14.5|-14.5|af|2;SC|سيشل|Seychelles|-4.7|55.5|af|3;SL|سيراليون|Sierra Leone|8.5|-11.8|af|3;SO|الصومال|Somalia|5.2|46.2|af|2;
ZA|جنوب أفريقيا|South Africa|-30.6|22.9|af|1;SS|جنوب السودان|South Sudan|6.9|31.3|af|2;SD|السودان|Sudan|12.9|30.2|af|1;TZ|تنزانيا|Tanzania|-6.4|34.9|af|2;
TG|توغو|Togo|8.6|0.8|af|3;TN|تونس|Tunisia|33.9|9.5|af|1;UG|أوغندا|Uganda|1.4|32.3|af|2;ZM|زامبيا|Zambia|-13.1|27.8|af|3;ZW|زيمبابوي|Zimbabwe|-19|29.2|af|2;
AF|أفغانستان|Afghanistan|33.9|67.7|as|2;AM|أرمينيا|Armenia|40.1|45|as|2;AZ|أذربيجان|Azerbaijan|40.1|47.6|as|2;BH|البحرين|Bahrain|26|50.6|as|1;
BD|بنغلاديش|Bangladesh|23.7|90.4|as|2;BT|بوتان|Bhutan|27.5|90.4|as|3;BN|بروناي|Brunei|4.5|114.7|as|3;KH|كمبوديا|Cambodia|12.6|105|as|3;
CN|الصين|China|35.9|104.2|as|1;GE|جورجيا|Georgia|42.3|43.4|as|2;IN|الهند|India|20.6|79|as|1;ID|إندونيسيا|Indonesia|-0.8|113.9|as|1;
IR|إيران|Iran|32.4|53.7|as|1;IQ|العراق|Iraq|33.2|43.7|as|1;JP|اليابان|Japan|36.2|138.3|as|1;JO|الأردن|Jordan|30.6|36.2|as|1;
KZ|كازاخستان|Kazakhstan|48|66.9|as|2;KW|الكويت|Kuwait|29.3|47.5|as|1;KG|قيرغيزستان|Kyrgyzstan|41.2|74.8|as|3;LA|لاوس|Laos|19.9|102.5|as|3;
LB|لبنان|Lebanon|33.9|35.9|as|1;MY|ماليزيا|Malaysia|4.2|102|as|1;MV|جزر المالديف|Maldives|3.2|73.2|as|2;MN|منغوليا|Mongolia|46.9|103.8|as|2;
MM|ميانمار|Myanmar|21.9|96|as|3;NP|نيبال|Nepal|28.4|84.1|as|2;KP|كوريا الشمالية|North Korea|40.3|127.5|as|2;OM|عمان|Oman|21.5|55.9|as|1;
PK|باكستان|Pakistan|30.4|69.3|as|1;PS|فلسطين|Palestine|31.9|35.2|as|1;PH|الفلبين|Philippines|12.9|121.8|as|1;QA|قطر|Qatar|25.4|51.2|as|1;
SA|السعودية|Saudi Arabia|23.9|45.1|as|1;SG|سنغافورة|Singapore|1.4|103.8|as|1;KR|كوريا الجنوبية|South Korea|35.9|127.8|as|1;LK|سريلانكا|Sri Lanka|7.9|80.8|as|2;
SY|سوريا|Syria|34.8|39|as|1;TW|تايوان|Taiwan|23.7|121|as|2;TJ|طاجيكستان|Tajikistan|38.9|71.3|as|3;TH|تايلاند|Thailand|15.9|101|as|1;
TL|تيمور الشرقية|East Timor|-8.9|125.7|as|3;TR|تركيا|Turkey|39|35.2|as|1;TM|تركمانستان|Turkmenistan|39|59.6|as|3;AE|الإمارات|United Arab Emirates|23.4|53.8|as|1;
UZ|أوزبكستان|Uzbekistan|41.4|64.6|as|2;VN|فيتنام|Vietnam|14.1|108.3|as|1;YE|اليمن|Yemen|15.6|48.5|as|1;
AL|ألبانيا|Albania|41.2|20.2|eu|2;AD|أندورا|Andorra|42.5|1.5|eu|3;AT|النمسا|Austria|47.5|14.6|eu|1;BY|بيلاروس|Belarus|53.7|28|eu|2;
BE|بلجيكا|Belgium|50.5|4.5|eu|1;BA|البوسنة والهرسك|Bosnia and Herzegovina|43.9|17.7|eu|2;BG|بلغاريا|Bulgaria|42.7|25.5|eu|2;HR|كرواتيا|Croatia|45.1|15.2|eu|1;
CY|قبرص|Cyprus|35.1|33.4|eu|2;CZ|التشيك|Czechia|49.8|15.5|eu|2;DK|الدنمارك|Denmark|56.3|9.5|eu|1;EE|إستونيا|Estonia|58.6|25|eu|3;
FI|فنلندا|Finland|61.9|25.7|eu|2;FR|فرنسا|France|46.2|2.2|eu|1;DE|ألمانيا|Germany|51.2|10.5|eu|1;GR|اليونان|Greece|39.1|21.8|eu|1;
HU|المجر|Hungary|47.2|19.5|eu|2;IS|آيسلندا|Iceland|65|-19|eu|2;IE|أيرلندا|Ireland|53.4|-8.2|eu|2;IT|إيطاليا|Italy|41.9|12.6|eu|1;
XK|كوسوفو|Kosovo|42.6|20.9|eu|3;LV|لاتفيا|Latvia|56.9|24.6|eu|3;LI|ليختنشتاين|Liechtenstein|47.2|9.6|eu|3;LT|ليتوانيا|Lithuania|55.2|23.9|eu|3;
LU|لوكسمبورغ|Luxembourg|49.8|6.1|eu|2;MT|مالطا|Malta|35.9|14.4|eu|2;MD|مولدوفا|Moldova|47.4|28.4|eu|3;MC|موناكو|Monaco|43.7|7.4|eu|2;
ME|الجبل الأسود|Montenegro|42.7|19.4|eu|3;NL|هولندا|Netherlands|52.1|5.3|eu|1;MK|مقدونيا الشمالية|North Macedonia|41.6|21.7|eu|3;NO|النرويج|Norway|60.5|8.5|eu|1;
PL|بولندا|Poland|51.9|19.1|eu|1;PT|البرتغال|Portugal|39.4|-8.2|eu|1;RO|رومانيا|Romania|45.9|25|eu|2;RU|روسيا|Russia|61.5|105.3|eu|1;
SM|سان مارينو|San Marino|43.9|12.5|eu|3;RS|صربيا|Serbia|44|21|eu|2;SK|سلوفاكيا|Slovakia|48.7|19.7|eu|3;SI|سلوفينيا|Slovenia|46.2|15|eu|3;
ES|إسبانيا|Spain|40.5|-3.7|eu|1;SE|السويد|Sweden|60.1|18.6|eu|1;CH|سويسرا|Switzerland|46.8|8.2|eu|1;UA|أوكرانيا|Ukraine|48.4|31.2|eu|1;
GB|المملكة المتحدة|United Kingdom|55.4|-3.4|eu|1;VA|الفاتيكان|Vatican City|41.9|12.5|eu|2;
AG|أنتيغوا وباربودا|Antigua and Barbuda|17.1|-61.8|na|3;BS|باهاماس|Bahamas|25|-77.4|na|3;BB|بربادوس|Barbados|13.2|-59.5|na|3;BZ|بليز|Belize|17.2|-88.5|na|3;
CA|كندا|Canada|56.1|-106.3|na|1;CR|كوستاريكا|Costa Rica|9.7|-83.8|na|2;CU|كوبا|Cuba|21.5|-77.8|na|2;DM|دومينيكا|Dominica|15.4|-61.4|na|3;
DO|جمهورية الدومينيكان|Dominican Republic|18.7|-70.2|na|3;SV|السلفادور|El Salvador|13.8|-88.9|na|3;GD|غرينادا|Grenada|12.1|-61.7|na|3;GT|غواتيمالا|Guatemala|15.8|-90.2|na|3;
HT|هايتي|Haiti|19|-72.3|na|3;HN|هندوراس|Honduras|15.2|-86.2|na|3;JM|جامايكا|Jamaica|18.1|-77.3|na|2;MX|المكسيك|Mexico|23.6|-102.6|na|1;
NI|نيكاراغوا|Nicaragua|12.9|-85.2|na|3;PA|بنما|Panama|8.5|-80.8|na|2;KN|سانت كيتس ونيفيس|Saint Kitts and Nevis|17.4|-62.8|na|3;LC|سانت لوسيا|Saint Lucia|13.9|-61|na|3;
VC|سانت فينسنت والغرينادين|Saint Vincent and the Grenadines|13|-61.3|na|3;TT|ترينيداد وتوباغو|Trinidad and Tobago|10.7|-61.2|na|3;US|الولايات المتحدة|United States|37.1|-95.7|na|1;
AR|الأرجنتين|Argentina|-38.4|-63.6|sa|1;BO|بوليفيا|Bolivia|-16.3|-63.6|sa|2;BR|البرازيل|Brazil|-14.2|-51.9|sa|1;CL|تشيلي|Chile|-35.7|-71.5|sa|1;
CO|كولومبيا|Colombia|4.6|-74.3|sa|1;EC|الإكوادور|Ecuador|-1.8|-78.2|sa|2;GY|غيانا|Guyana|4.9|-58.9|sa|3;PY|باراغواي|Paraguay|-23.4|-58.4|sa|2;
PE|بيرو|Peru|-9.2|-75|sa|2;SR|سورينام|Suriname|3.9|-56|sa|3;UY|أوروغواي|Uruguay|-32.5|-55.8|sa|2;VE|فنزويلا|Venezuela|6.4|-66.6|sa|2;
AU|أستراليا|Australia|-25.3|133.8|oc|1;FJ|فيجي|Fiji|-17.7|178.1|oc|3;KI|كيريباتي|Kiribati|1.4|173|oc|3;MH|جزر مارشال|Marshall Islands|7.1|171.2|oc|3;
FM|ميكرونيزيا|Micronesia|7.4|150.6|oc|3;NR|ناورو|Nauru|-0.5|166.9|oc|3;NZ|نيوزيلندا|New Zealand|-40.9|174.9|oc|1;PW|بالاو|Palau|7.5|134.6|oc|3;
PG|بابوا غينيا الجديدة|Papua New Guinea|-6.3|144|oc|3;WS|ساموا|Samoa|-13.8|-172.1|oc|3;SB|جزر سليمان|Solomon Islands|-9.6|160.2|oc|3;TO|تونغا|Tonga|-21.2|-175.2|oc|3;
TV|توفالو|Tuvalu|-7.1|177.6|oc|3;VU|فانواتو|Vanuatu|-15.4|167|oc|3
`.trim().split(';').map(row => {
  const [code, ar, en, lat, lon, cont, tier] = row.trim().split('|');
  return { code: code, ar: ar, en: en, lat: Number(lat), lon: Number(lon), cont: cont, tier: Number(tier) };
});

const FLAG_ALIASES = {
  US: 'أمريكا|الولايات المتحدة الأمريكية|America|USA|United States of America',
  GB: 'بريطانيا|إنجلترا|انكلترا|Britain|Great Britain|England|UK',
  AE: 'الإمارات العربية المتحدة|UAE|Emirates',
  SA: 'المملكة العربية السعودية|KSA',
  NL: 'هولاندا|Holland',
  CZ: 'تشيكيا|جمهورية التشيك|Czech Republic',
  CD: 'جمهورية الكونغو الديمقراطية|الكونغو|Congo',
  CG: 'الكونغو|Congo',
  CI: 'كوت ديفوار|Cote d Ivoire',
  SZ: 'سوازيلاند|Swaziland',
  MM: 'بورما|Burma',
  MK: 'مقدونيا|Macedonia',
  TL: 'تيمور|Timor-Leste',
  CV: 'كابو فيردي|Cabo Verde',
  BA: 'البوسنة|Bosnia',
  KR: 'كوريا|Korea',
  RU: 'روسيا الاتحادية',
  VA: 'الكرسي الرسولي|Vatican|Holy See',
  GA: 'الجابون',
  GM: 'جامبيا',
  OM: 'سلطنة عمان',
  TR: 'Turkiye',
  IR: 'فارس|Persia',
  MV: 'المالديف',
  KM: 'القمر',
  BB: 'باربادوس'
};

const FLAG_MODES = { flag: { guesses: 6 }, far: { guesses: 8 } };

const flagEmoji = (code) => String(code).toUpperCase().replace(/./g, ch => String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65));
const flagCountry = (code) => COUNTRIES.find(c => c.code === code);
const flagName = (c, lang) => c ? (lang === 'en' ? c.en : c.ar) : '';

function flagsDistance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** The compass bearing from a to b, 0 = north, clockwise. */
function flagsBearing(a, b) {
  const rad = Math.PI / 180;
  const y = Math.sin((b.lon - a.lon) * rad) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lon - a.lon) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

const flagsProximity = (km) => Math.max(0, Math.round(100 * (1 - km / 20015)));
