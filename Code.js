/**
 * Main Web App Entry Point
 */
const doGet = (e) => {
  // Removed setupSheets() from here. It will run only if data is missing during a call.
  
  const iconUrl = "https://cdn-icons-png.flaticon.com/128/13/13973.png"; 

  const template = HtmlService.createTemplateFromFile('Controller');
  
  // PRE-FETCH DATA: This injects data directly into the page to avoid "Loading..." screens
  try {
    const initialData = getInitialData();
    template.initialPlayers = JSON.stringify(initialData.players);
    template.initialSpyData = JSON.stringify(initialData.spyData);
  } catch (e) {
    template.initialPlayers = "[]";
    template.initialSpyData = "{}";
    console.error("Data Injection failed", e);
  }

  return template.evaluate()
      .setTitle('عشرى جيمينج 🎮')
      .setFaviconUrl(iconUrl) 
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};

const include = (filename) => {
  // Always fetch the freshest code directly from the file!
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
};

/* --- SETUP --- */

const setupSheets = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Players Sheet
  let playerSheet = ss.getSheetByName('اللاعبين');
  if (!playerSheet) {
    playerSheet = ss.insertSheet('اللاعبين');
    playerSheet.setRightToLeft(true);
    playerSheet.getRange(1, 1).setValue("قائمة الأسماء").setFontWeight("bold");
  }

  // 2. Setup Spy Words Sheet (If missing)
  let spySheet = ss.getSheetByName('كلمات الجاسوس');
  if (!spySheet) {
    spySheet = ss.insertSheet('كلمات الجاسوس');
    spySheet.setRightToLeft(true);
    
    // Default Data
    const headers = ['حيوانات', 'أكلات', 'مهن', 'أماكن', 'أشياء'];
    const data = [
      ['أسد', 'بيتزا', 'مهندس', 'مدرسة', 'قلم'],
      ['فيل', 'برجر', 'طبيب', 'مستشفى', 'تليفون'],
      ['زرافة', 'كشري', 'نجار', 'نادي', 'مفتاح'],
      ['قطة', 'شاورما', 'مدرس', 'سينما', 'نظارة'],
      ['كلب', 'فلافل', 'طيار', 'سوق', 'ساعة'],
      ['صقر', 'محشي', 'سباك', 'مطار', 'حقيبة'],
      ['حوت', 'كبسة', 'محامي', 'حديقة', 'كتاب'],
      ['دلفين', 'مانسف', 'طباخ', 'مطعم', 'لابتوب'],
      ['حصان', 'ملوخية', 'ميكانيكي', 'فندق', 'شاحن'],
      ['نمر', 'مسقعة', 'كهربائي', 'بنك', 'محفظة']
    ];
    
    spySheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e0f2fe");
    spySheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    spySheet.autoResizeColumns(1, headers.length);
  }
};

/**
 * Combined Initial Data Fetch
 * Reduces multiple round-trips to one single call.
 */
const getInitialData = () => {
  return {
    players: getPlayerList(),
    spyData: getSpyData()
  };
};

const getPlayerList = () => {
  setupSheets(); // Ensure sheets exist
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('اللاعبين');
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  return sh.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String);
};

const addGlobalPlayer = (name) => {
  if (!name || name.trim() === "") {
    throw new Error("الاسم لا يمكن أن يكون فارغاً");
  }
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('اللاعبين');
  const data = sh.getDataRange().getValues().flat(); 
  if (!data.includes(name)) {
    sh.appendRow([name]);
  } else {
    // Optionally throw error for duplicates if needed
    // throw new Error("هذا اللاعب مسجل بالفعل");
  }
  return getPlayerList();
};

/**
 * Player Statistics & Leaderboard
 */
const recordWin = (name, gameType) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('الإحصائيات');
  if (!sheet) {
    sheet = ss.insertSheet('الإحصائيات');
    sheet.setRightToLeft(true);
    sheet.getRange(1, 1, 1, 3).setValues([['اللاعب', 'اللعبة', 'التاريخ']]).setFontWeight("bold");
  }
  sheet.appendRow([name, gameType, new Date()]);
  return true;
};

const getLeaderboard = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('الإحصائيات');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const wins = {};
  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    if (name) {
      wins[name] = (wins[name] || 0) + 1;
    }
  }
  
  return Object.keys(wins)
    .map(name => ({ name: name, wins: wins[name] }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);
};

/**
 * Fetches categories and words from the "كلمات الجاسوس" sheet.
 * Returns object: { "CategoryName": ["Word1", "Word2"], ... }
 */
const getSpyData = () => {
  setupSheets(); // Ensure sheets exist
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('كلمات الجاسوس');
  
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  
  if (lastCol < 1 || lastRow < 2) return {};
  
  // Read all data
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0]; // First row is categories
  const categories = {};
  
  for (let c = 0; c < headers.length; c++) {
    const categoryName = headers[c];
    if (categoryName) {
      const words = [];
      for (let r = 1; r < values.length; r++) {
        if (values[r][c]) {
          words.push(values[r][c]);
        }
      }
      if (words.length > 0) {
        categories[categoryName] = words;
      }
    }
  }
  
  return categories;
};
