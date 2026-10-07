const __lzOnce_spy=1;lzStyle("spy","#winners-list .imp1-line{font-size:var(--fs-h3);font-weight:var(--fw-black);margin-block-end:var(--sp-2);text-wrap:balance}#winners-list .imp1-sub{font-size:var(--fs-sm);font-weight:var(--fw-semi);color:var(--text-2);margin-block-end:var(--sp-3)}#winners-list .imp1-board{font-size:var(--fs-body);font-weight:var(--fw-body);text-align:start}#winners-list .imp1-board:empty{display:none}.talk #imposter-director{margin-block-end:var(--sp-4)}"),lzMarkup([["view-setup-imposter",`<div id="view-setup-imposter" class="hidden">
<div class="card">
<div class="segmented mode-switch" style="margin-bottom: var(--sp-4)">
<button class="segmented__item is-active" data-mode="device"
onclick="setPlayMode('imposter', 'device')" data-i18n="mode_device">موبايل واحد</button>
<button class="segmented__item" data-mode="online"
onclick="setPlayMode('imposter', 'online')" data-i18n="mode_online">كل واحد بموبايله</button>
</div>
<div class="mode-online-panel hidden">
<p class="card__subtitle" data-i18n="mode_hint_online">كل لاعب على هاتفه</p>
<button onclick="roomCreateFor('imposter')" class="btn btn--primary btn--lg" data-i18n="room_create">افتح غرفة</button>
<button onclick="roomOpenJoin('')" class="btn btn--ghost" data-i18n="join_room_menu">ادخل غرفة</button>
</div>
<div class="mode-device-panel">
<div class="space-y-4 mb-6">
<div>
<label class="field__label" data-i18n="category">المجموعة</label>
<select id="imposter-category-select" class="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800" onchange="toggleManualWordInput()" data-remember>
</select>
</div>
<div id="manual-word-container" class="hidden">
<label class="field__label" data-i18n="secret_word">الكلمة السرية</label>
<input type="text" id="imposter-manual-word" data-i18n-ph="secret_word" placeholder="اكتب الكلمة هنا..." class="border-purple-200">
</div>
<div class="stepper-row">
<label class="field__label" data-i18n="imposter_count">عدد الجواسيس</label>
<div class="stepper stepper--field">
<button type="button" class="stepper__btn" onclick="stepField('imposter-count', -1)" aria-label="أقل" data-i18n-title="a11y_less">−</button>
<input type="number" id="imposter-count" value="1" data-min="1" data-max="9" data-step="1" class="stepper__value" tabindex="-1" readonly inputmode="none" data-remember>
<button type="button" class="stepper__btn" onclick="stepField('imposter-count', 1)" aria-label="أكثر" data-i18n-title="a11y_more">+</button>
</div>
</div>
</div>
<div class="field">
<label class="switch-row" for="imposter-undercover-on">
<span class="field__label" data-i18n="imp_undercover">🎭 المختلف</span>
<span class="switch">
<input type="checkbox" id="imposter-undercover-on" role="switch" data-remember>
<span class="switch__track" aria-hidden="true"></span>
</span>
</label>
<p class="field__hint" data-i18n="imp_undercover_hint">كل واحد بياخد كلمة، والمختلف كلمته قريبة</p>
</div>
<div class="field">
<label class="switch-row" for="imposter-director-on">
<span class="field__label" data-i18n="director_label">مين يسأل مين؟</span>
<span class="switch">
<input type="checkbox" id="imposter-director-on" role="switch" onchange="syncDirectorField('imposter')">
<span class="switch__track" aria-hidden="true"></span>
</span>
</label>
<p class="field__hint" data-i18n="director_hint">الموبايل يقول مين يسأل مين كل مرة، عشان محدش يسأل أكتر من غيره ومحدش يستخبى. مقفول = كلام حر.</p>
<div id="imposter-director-choices" class="hidden">
<div class="segmented" id="imposter-director-mode" role="group">
<button type="button" class="segmented__item is-active" data-value="order" onclick="setDirectorMode('imposter', 'order')" data-i18n="director_order">بالترتيب</button>
<button type="button" class="segmented__item" data-value="random" onclick="setDirectorMode('imposter', 'random')" data-i18n="director_random">عشوائي</button>
</div>
</div>
</div>
<div class="group-picker">
<select onchange="loadGroup(this.value)" class="saved-groups-select" aria-label="اختار مجموعة محفوظة" data-i18n-title="a11y_pick_group">
<option value="">-- اختار مجموعة --</option>
</select>
<button onclick="saveCurrentGroup()" class="iconbtn" title="إدارة المجموعات" aria-label="إدارة المجموعات" data-i18n-title="group_manage_title">📂</button>
</div>
<label class="field__label" data-i18n="players">المشاركين</label>
<div class="input-group" style="margin-bottom: var(--sp-4)">
<input type="text" data-i18n-ph="placeholder_name" placeholder="الاسم" autocomplete="off">
<button onclick="addPlayerFromSetup(this)" class="btn btn--primary" aria-label="إضافة لاعب" data-i18n-title="add_player_title">+</button>
</div>
<div id="imposter-player-list" class="mb-6"></div>
<button onclick="startImposterGame()" class="btn btn--primary" data-i18n="start">ابدأ اللعبة</button>
</div>
</div>
</div>`],["view-imposter-reveal",`<div id="view-imposter-reveal" class="hidden">
<div class="card text-center py-8 space-y-6">
<div>
<h3 class="eyebrow" data-i18n="give_phone_to">ادّي الموبايل لـ</h3>
<h2 id="reveal-player-name" class="metric metric--lg metric--accent">---</h2>
</div>
<div id="imposter-hold" class="hold-card hold-card--poster" role="button" tabindex="0" data-next="imposter-hold-next">
<div class="hold-card__front">
<span class="hold-card__icon" aria-hidden="true" data-art-icon="imposter"></span>
<span class="hold-card__label" data-i18n="hold_to_reveal">دوس مطوّل عشان تشوف دورك</span>
<span class="hold-card__hint" data-i18n="hold_hint">أول ما تشيل صباعك يستخبى</span>
</div>
<div class="hold-card__back" aria-hidden="true">
<h3 class="eyebrow" data-i18n="you_are">أنت هو:</h3>
<div id="role-card-content" class="reveal-plate">
<div id="role-word" class="text-4xl font-black">---</div>
</div>
</div>
</div>
<button id="imposter-hold-next" onclick="hideRole()" class="btn btn--primary btn--lg hold-next is-waiting" data-i18n="got_it_next">فهمت، التالي</button>
</div>
</div>`],["view-play-imposter",`<div id="view-play-imposter" class="hidden">
<div class="card card--accent talk">
<div class="talk__clock">
<div class="gtm-dial talk-dial">
<svg class="gtm-ring" viewBox="0 0 120 120" aria-hidden="true">
<circle class="gtm-ring__track" cx="60" cy="60" r="54" pathLength="1"></circle>
<circle class="gtm-ring__fill" id="imp-ring-fill" cx="60" cy="60" r="54" pathLength="1"></circle>
</svg>
<div id="imposter-timer-display" class="metric metric--xl">00:00</div>
</div>
<button onclick="toggleImposterTimer()" id="imp-pause-btn" class="btn btn--ghost btn--sm btn--auto" data-i18n="pause_btn">إيقاف مؤقت</button>
</div>
<div id="imposter-director" class="hidden"></div>
<h3 class="eyebrow talk__head"><span data-i18n="imp_playing">بيلعبوا</span> <span id="imp-players-n" class="metric"></span></h3>
<div id="imposter-game-players" class="talk-people"></div>
</div>
<div class="view-actions talk__actions">
<div id="imp1-live" class="imp1-live">
<button onclick="imp1OpenAccuse()" class="btn btn--danger btn--lg"><span class="btn__art" aria-hidden="true" data-art-icon="imposter"></span><span data-i18n="imp1_accuse_btn">اتهموا حد</span></button>
</div>
<div class="talk__pair">
<button onclick="revealImposterResult()" id="imp-reveal-direct" class="btn btn--ghost btn--sm" data-i18n="imp_reveal_now">اكشف على طول</button>
<button onclick="playExit(() => setView('setup-imposter'))" class="btn btn--ghost btn--sm" data-i18n="exit">خروج</button>
</div>
</div>
</div>`],["imp1-accuse-modal",`<div id="imp1-accuse-modal" class="modal-overlay hidden" onclick="if(event.target===this) closeModal('imp1-accuse-modal')">
<div class="modal-content modal-content--simple">
<div class="sheet__title" id="imp1-accuse-title">مين الجاسوس؟</div>
<p class="sheet__subtitle" data-i18n="imp1_accuse_hint">اتفقوا على واحد: دوسة تختاره، ودوسة كمان تأكّد</p>
<div id="imp1-accuse-list" class="modal-list space-y-2"></div>
<div class="modal-actions">
<button onclick="closeModal('imp1-accuse-modal')" class="btn btn--ghost" data-i18n="cancel">إلغاء</button>
</div>
</div>
</div>`],["imp1-guess-modal",`<div id="imp1-guess-modal" class="modal-overlay hidden">
<div class="modal-content modal-content--simple">
<div class="sheet__title tx-danger" id="imp1-guess-title">🕵️</div>
<p class="sheet__subtitle"><b id="imp1-guess-pass"></b><br><span data-i18n="imp_guess_hint">اتمسكت! فرصة أخيرة: اختار الكلمة السرية.</span></p>
<div id="imp1-guess-list" class="modal-list imp1-guess-list"></div>
<div class="modal-actions">
<button onclick="imp1Guess(-1)" class="btn btn--ghost btn--sm" data-i18n="fa_skip_guess">إنهاء من غير تخمين</button>
</div>
</div>
</div>`],["password-modal",`<div id="password-modal" class="modal-overlay hidden">
<div class="modal-content modal-content--simple">
<div class="modal-icon" aria-hidden="true">🔒</div>
<div class="sheet__title" data-i18n="locked_group">المجموعة مغلقة</div>
<p class="sheet__subtitle" data-i18n="enter_password">أدخل كلمة المرور للاستمرار</p>
<input type="password" id="category-password-input" data-i18n-ph="password_placeholder" placeholder="كلمة المرور" class="text-center">
<p id="password-error" class="field-error"></p>
<div class="modal-actions">
<button onclick="verifyCategoryPassword()" class="btn btn--primary btn--lg" data-i18n="start">دخول</button>
<button onclick="closeModal('password-modal')" class="btn btn--ghost" data-i18n="cancel">إلغاء</button>
</div>
</div>
</div>`]]);function renderSpyCategories(){const select=document.getElementById("imposter-category-select");if(!select)return;const countriesLabel=appState.lang==="ar"?"🌍 دول العالم (تلقائي)":"🌍 World Countries (Auto)",manualLabel=appState.lang==="ar"?"✍️ إدخال يدوي":"✍️ Manual Entry";let html=`<option value="countries">${countriesLabel}</option><option value="manual">${manualLabel}</option>`;for(const cat in spyCategoriesPlus())html+=`<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;const previous=select.value;select.innerHTML=html,!recallField(select)&&previous&&[...select.options].some(o=>o.value===previous)&&(select.value=previous);const container=document.getElementById("manual-word-container");container&&container.classList.toggle("hidden",select.value!=="manual")}typeof onLanguageChange=="function"&&onLanguageChange(view=>{view==="setup-imposter"&&renderSpyCategories()});function toggleManualWordInput(){const select=document.getElementById("imposter-category-select"),container=document.getElementById("manual-word-container");select.value==="manual"?(container.classList.remove("hidden"),document.getElementById("imposter-manual-word").focus()):container.classList.add("hidden")}function startImposterGame(playersToUse){Array.isArray(playersToUse)&&!playersToUse.length&&(appState.imposter.players||[]).length>=3&&(playersToUse=appState.imposter.players.map(p=>p.name)),imp1Replay=Array.isArray(playersToUse)&&playersToUse.length>=3;const undercoverSwitch=document.getElementById("imposter-undercover-on");if(!!!(undercoverSwitch&&undercoverSwitch.checked)){const category=document.getElementById("imposter-category-select").value;if(category.includes("🔒")&&spyCategories()[category]){const expectedPw=spyCategories()[category][0];if(appState.imposter.unlockedCategories&&!Array.isArray(appState.imposter.unlockedCategories)&&appState.imposter.unlockedCategories[category]===expectedPw){continuePrepImposter(playersToUse);return}if(expectedPw){document.getElementById("password-error").innerText="",document.getElementById("category-password-input").value="",document.getElementById("password-modal").classList.remove("hidden"),document.getElementById("category-password-input").focus(),window._pendingImposterPlayers=playersToUse;return}}}continuePrepImposter(playersToUse)}function verifyCategoryPassword(){const input=document.getElementById("category-password-input").value,category=document.getElementById("imposter-category-select").value,expectedPw=(spyCategories()[category]||[])[0];if(input===expectedPw)playSound("success"),(!appState.imposter.unlockedCategories||Array.isArray(appState.imposter.unlockedCategories))&&(appState.imposter.unlockedCategories={}),appState.imposter.unlockedCategories[category]=input,saveToLocal(),closeModal("password-modal"),continuePrepImposter(window._pendingImposterPlayers),delete window._pendingImposterPlayers;else{playSound("alarm");const errorMsg=appState.lang==="ar"?"كلمة مرور خاطئة!":"Incorrect password!";document.getElementById("password-error").innerText=errorMsg}}function continuePrepImposter(playersToUse){let selected=playersToUse||(appState.activePlayers?[...appState.activePlayers]:[]);saveActivePlayers(selected);const countInput=document.getElementById("imposter-count");let count=parseInt(countInput.value,10);if((!isFinite(count)||count<1)&&(count=1),countInput.value=count,selected.length<3)return askPlayers(3,()=>continuePrepImposter());if(count>=selected.length){const msg=appState.lang==="ar"?"عدد الجواسيس كبير جداً":"Too many imposters";return blockStartAt(countInput.closest(".stepper")||countInput,msg)}appState.imposter.config||(appState.imposter.config={}),appState.imposter.config.impostersCount=count;const undercoverSwitch=document.getElementById("imposter-undercover-on"),undercover=!!(undercoverSwitch&&undercoverSwitch.checked);if(appState.imposter.config.undercover=undercover,undercover){const pairs=spyPairs(),picked=freshPick(contentLang()==="en"?"imppair:en":"imppair",pairs,1,{key:p=>p[0]+"|"+p[1]})[0],pair=picked&&Math.random()<.5?[picked[1],picked[0]]:picked;appState.imposter.secretWord=pair?pair[0]:"",appState.imposter.pairOther=pair?pair[1]:""}else appState.imposter.pairOther=null;lastSelectedPlayers=selected,playSound("click"),finalizeImposterGame(selected)}function imp1PickSpies(names,count,last){const pool=names.slice(),out=[],before=Array.isArray(last)?last:[];for(;out.length<count&&pool.length;){const w=pool.map(n=>before.indexOf(n)!==-1?.5:1);let r=Math.random()*w.reduce((a,b)=>a+b,0),i=0;for(;i<pool.length-1&&r>=w[i];)r-=w[i],i++;out.push(pool.splice(i,1)[0])}return out}function finalizeImposterGame(orderedNames){lastSelectedPlayers=orderedNames;const undercover=!!(appState.imposter.config&&appState.imposter.config.undercover);let secretWord="";if(undercover)secretWord=appState.imposter.secretWord;else{const catSelect=document.getElementById("imposter-category-select");catSelect&&!catSelect.options.length&&renderSpyCategories();const category=catSelect.value;if(category==="manual"){if(secretWord=document.getElementById("imposter-manual-word").value.trim(),!secretWord){const msg=appState.lang==="ar"?"يرجى إدخال الكلمة السرية":"Please enter the secret word";appState.currentView!=="setup-imposter"&&setView("setup-imposter"),blockStartAt(document.getElementById("imposter-manual-word"),msg);return}}else if(category==="countries"){const known=typeof COUNTRIES!="undefined"?COUNTRIES.filter(c=>c.tier===1).map(c=>contentLang()==="en"?c.en:c.ar):[],countries=known.length?known:(MONKEY_LISTS[contentLang()]||MONKEY_LISTS.ar).countries;secretWord=freshPick("imposter:countries:"+contentLang(),countries,1)[0]}else if(spyCategoriesPlus()[category]){let list=spyCategoriesPlus()[category];packWordsCodeOfCat(category)&&packPlayed(packWordsCodeOfCat(category)),category.includes("🔒")&&spyCategories()[category]&&(list=list.slice(1)),secretWord=freshPick("imposter:"+category,list,1)[0]}}const count=appState.imposter.config.impostersCount,lastSpies=(appState.imposter.players||[]).filter(p=>p&&p.role==="Imposter").map(p=>p.name),spies=imp1PickSpies(orderedNames,count,lastSpies);appState.imposter.players=orderedNames.map(name=>({name,role:spies.indexOf(name)!==-1?"Imposter":"Civilian"}));const im=appState.imposter;(!imp1Replay||!im.scores)&&(im.scores={},im.scoreId=Date.now()),imp1Replay=!1,orderedNames.forEach(n=>{typeof im.scores[n]!="number"&&(im.scores[n]=0)});const catSel=document.getElementById("imposter-category-select");im.category=undercover?"":catSel?catSel.value:"",im.lang=contentLang(),im.phase="reveal",im.accused="",im.picked="",im.outcome=null,im.guess=null,im.options=null,im.dealId=Date.now(),typeof directorStart=="function"&&directorStart(appState.imposter,orderedNames,directorModeOf("imposter")),appState.imposter.secretWord=secretWord,appState.imposter.revealIndex=0,appState.imposter.timer=0,showRevealStep(),setView("imposter-reveal")}function showRevealStep(){const player=appState.imposter.players[appState.imposter.revealIndex];document.getElementById("reveal-player-name").innerText=player.name,paintPassFaces("imposter-reveal",appState.imposter.players.map(p=>p.name),appState.imposter.revealIndex),fillRole(player),holdCardReset(document.getElementById("imposter-hold"))}function fillRole(player){const wordDiv=document.getElementById("role-word"),card=document.getElementById("role-card-content"),undercover=!!appState.imposter.config.undercover,spy=!undercover&&player.role==="Imposter";wordDiv.innerText=undercover?player.role==="Imposter"?appState.imposter.pairOther:appState.imposter.secretWord:spy?appState.lang==="ar"?"أنت الجاسوس!":"You are the Imposter!":appState.imposter.secretWord,spy&&wordDiv.insertAdjacentHTML("afterbegin",'<span class="hold-card__art">'+iconHtml("art:imposter")+"</span> "),wordDiv.className="hold-card__word "+(spy?"tx-danger":"tx-success"),card&&card.classList.toggle("is-spy",spy)}function hideRole(){appState.imposter.revealIndex++,appState.imposter.revealIndex>=appState.imposter.players.length?(appState.imposter.phase="play",playSound("success"),renderImposterBoard(),setView("play-imposter"),startImposterTimer()):(playSound("click"),showRevealStep())}function renderImposterBoard(){var _a,_b;const container=document.getElementById("imposter-game-players"),initial=name=>escapeHTML(Array.from(String(name).trim())[0]||"?");container.innerHTML=appState.imposter.players.map(p=>`<span class="talk-person"><span class="talk-person__av" aria-hidden="true">${initial(p.name)}</span><span class="talk-person__name">${escapeHTML(p.name)}</span></span>`).join("");const n=document.getElementById("imp-players-n");n&&(n.textContent=`(${appState.imposter.players.length})`),typeof paintDirector=="function"&&paintDirector("imposter-director",appState.imposter,"imposterDirectorNext()");const live=appState.imposter.phase!=="done";(_a=document.getElementById("imp1-live"))==null||_a.classList.toggle("hidden",!live),(_b=document.getElementById("imp-reveal-direct"))==null||_b.classList.toggle("hidden",!live)}function imposterDirectorNext(){directorNext(appState.imposter),paintDirector("imposter-director",appState.imposter,"imposterDirectorNext()"),haptic("light")}function startImposterTimer(){isPaused=!1,appState.imposter.timer=0,updateImposterTimerUI(),runImposterClock(0)}function runImposterClock(from){stopImposterTimer();const base=Math.max(0,Math.floor(Number(from)||0));imposterInterval=createClock({countUp:!0,onTick:elapsed=>{appState.imposter.timer=base+elapsed,updateImposterTimerUI()}})}function stopImposterTimer(){imposterInterval&&imposterInterval.stop(),imposterInterval=null}function toggleImposterTimer(){playSound("click"),imposterInterval?isPaused=imposterInterval.toggle():isPaused?(isPaused=!1,runImposterClock(appState.imposter.timer),saveToLocal()):isPaused=!0,updateImposterTimerUI()}function updateImposterTimerUI(){const display=document.getElementById("imposter-timer-display"),btn=document.getElementById("imp-pause-btn"),t=TRANSLATIONS[appState.lang]||{},mins=Math.floor(appState.imposter.timer/60).toString().padStart(2,"0"),secs=(appState.imposter.timer%60).toString().padStart(2,"0");display&&(display.innerText=`${mins}:${secs}`);const ring=document.getElementById("imp-ring-fill");if(ring){const s=appState.imposter.timer%60;ring.style.transition=s===0?"none":"",ring.style.strokeDashoffset=String(1-s/60)}btn&&(btn.setAttribute("data-i18n",isPaused?"resume_btn":"pause_btn"),btn.innerText=isPaused?t.resume_btn||"":t.pause_btn||"")}function revealImposterResult(){imp1Finish("revealed",null)}let imp1Replay=!1;const IMP1_GUESS_OPTIONS=6;function imp1Live(){const im=appState.imposter;return appState.currentView==="play-imposter"&&im.phase!=="done"&&(im.players||[]).length}function imp1OpenAccuse(){if(!imp1Live())return;if(appState.imposter.phase==="guess"){imp1OpenGuess();return}appState.imposter.picked="",imp1PaintAccuse();const t=TRANSLATIONS[appState.lang]||{},title=document.getElementById("imp1-accuse-title");title&&(title.textContent=appState.imposter.config.undercover?t.imp_und_accuse||"":t.imp1_accuse_title||""),document.getElementById("imp1-accuse-modal").classList.remove("hidden")}function imp1PaintAccuse(){const list=document.getElementById("imp1-accuse-list");if(!list)return;const t=TRANSLATIONS[appState.lang]||{},picked=appState.imposter.picked;list.innerHTML=appState.imposter.players.map((p,i)=>{const on=p.name===picked;return`<button type="button" class="ballot-option imp1-pick ${on?"is-picked":""}" aria-pressed="${on}" onclick="imp1Pick(${i})">
              <span class="ballot-option__label">${escapeHTML(p.name)}</span>
              <span class="badge ${on?"badge--danger imp1-pick__confirm":"badge--plain"}">${escapeHTML(on?t.imp1_confirm||"":t.accuse_badge||"")}</span>
            </button>`}).join("")}function imp1Pick(i){const im=appState.imposter,p=im.players[i];if(!(!p||!imp1Live())){if(im.picked!==p.name){im.picked=p.name,imp1PaintAccuse(),haptic("light");return}closeModal("imp1-accuse-modal"),imp1Accuse(p.name)}}function imp1Accuse(name){const im=appState.imposter;if(!imp1Live())return;if(stopImposterTimer(),im.accused=name,!im.players.some(p=>p.name===name&&p.role==="Imposter")){imp1Finish("escaped",null);return}const options=im.config.undercover?null:imp1GuessOptions();if(!options){imp1Finish("caught",null);return}im.options=options,im.phase="guess",saveToLocal(),playSound("alarm"),haptic("double"),imp1OpenGuess()}function imp1GuessOptions(){const im=appState.imposter,cat=im.category||"",lang=im.lang||contentLang();let pool=[];if(cat==="countries")pool=typeof COUNTRIES!="undefined"?COUNTRIES.filter(c=>c.tier===1).map(c=>lang==="en"?c.en:c.ar):[],pool.indexOf(im.secretWord)===-1&&(pool=((MONKEY_LISTS[lang]||MONKEY_LISTS.ar).countries||[]).slice());else if(cat&&cat!=="manual"){const app=(lang==="en"&&window.SPY_WORDS_EN?window.SPY_WORDS_EN:SPY_CATEGORIES)||{},pack=(typeof packWordPacks=="function"?packWordPacks():[]).find(p=>p.name===cat);pack?pool=pack.words.slice():app[cat]&&(pool=app[cat].slice(cat.includes("🔒")?1:0))}const others=shuffleArray(pool.filter(w=>w!==im.secretWord)).slice(0,IMP1_GUESS_OPTIONS-1);return others.length<2?null:shuffleArray(others.concat([im.secretWord]))}function imp1OpenGuess(){const im=appState.imposter,t=TRANSLATIONS[appState.lang]||{},title=document.getElementById("imp1-guess-title");title&&(title.textContent="🕵️ "+im.accused);const pass=document.getElementById("imp1-guess-pass");pass&&(pass.textContent=(t.imp1_pass_to||"").replace("{name}",im.accused));const list=document.getElementById("imp1-guess-list");list&&(list.innerHTML=(im.options||[]).map((w,i)=>`<button type="button" class="ballot-option" onclick="imp1Guess(${i})"><span class="ballot-option__label">${escapeHTML(w)}</span></button>`).join("")),document.getElementById("imp1-guess-modal").classList.remove("hidden")}function imp1Guess(i){const im=appState.imposter;if(im.phase!=="guess")return;const word=i===-1?null:(im.options||[])[i];closeModal("imp1-guess-modal"),imp1Finish(word&&word===im.secretWord?"stole":"caught",word||null)}function imp1Finish(outcome,guess){const im=appState.imposter;im.phase==="done"||!(im.players||[]).length||(stopImposterTimer(),im.phase="done",im.outcome=outcome,im.guess=guess,im.scores=im.scores||{},outcome==="caught"?im.players.forEach(p=>{p.role!=="Imposter"&&(im.scores[p.name]=(im.scores[p.name]||0)+1)}):(outcome==="escaped"||outcome==="stole")&&im.players.forEach(p=>{p.role==="Imposter"&&(im.scores[p.name]=(im.scores[p.name]||0)+2)}),saveToLocal(),imp1ShowResult())}function imp1ShowResult(quiet){const im=appState.imposter,outcome=im.outcome||"revealed";quiet||playSound(outcome==="escaped"||outcome==="stole"?"alarm":"success");const undercover=!!(appState.imposter.config&&appState.imposter.config.undercover),wordTitle=undercover?appState.lang==="ar"?"الكلمة":"Word":appState.lang==="ar"?"الكلمة السرية":"Secret Word",impTitle=undercover?appState.lang==="ar"?"المختلف":"Undercover":appState.lang==="ar"?"الجواسيس":"Imposters",andText=appState.lang==="ar"?" و ":" & ",imposters=appState.imposter.players.filter(p=>p.role==="Imposter").map(p=>escapeHTML(p.name)).join(andText),pairOtherHtml=undercover&&appState.imposter.pairOther?`
        <div class="mb-4">
            <div class="eyebrow">${appState.lang==="ar"?"كلمة المختلف":"Undercover Word"}</div>
            <div class="result-word tx-danger">${escapeHTML(appState.imposter.pairOther)}</div>
        </div>
      `:"",t=TRANSLATIONS[appState.lang]||{},spyCount=appState.imposter.players.filter(p=>p.role==="Imposter").length,revealKey=["imp1",im.dealId||"",appState.imposter.secretWord,imposters,outcome].join("|"),cover=spyRevealParts(revealKey,spyCount>1?t.reveal_spies_were:t.reveal_spy_was),verdict=typeof spyCastVerdict=="function"?spyCastVerdict(outcome):"",cast=typeof spyCastHtml=="function"?spyCastHtml(revealKey,verdict,{kind:"spy"}):"",lineState={outcome,undercover,spies:im.players.filter(p=>p.role==="Imposter").map(p=>p.name)},line=outcome!=="revealed"&&typeof imposterOutcomeLine=="function"?imposterOutcomeLine(lineState,t):"",won=outcome==="caught",board=im.players.map(p=>({id:p.name,name:p.name,score:(im.scores||{})[p.name]||0})).sort((a,b)=>b.score-a.score);document.getElementById("winners-list").innerHTML=`${cast}
        <div class="result-reveal ${cover.cls}" ${cover.attrs}>${cover.cover}
        ${line?`<div class="imp1-line ${won?"tx-success":outcome==="revealed"?"":"tx-danger"}">${won?"🎉 ":""}${escapeHTML(line)}</div>`:""}
        ${im.accused?`<p class="imp1-sub">${escapeHTML(t.cham_accused||"")}: ${escapeHTML(im.accused)}${im.guess?` · ${escapeHTML(t.spy_guess_was||"")}: ${escapeHTML(im.guess)}`:""}</p>`:""}
        <div class="mb-4">
            <div class="eyebrow">${wordTitle}</div>
            <div class="result-word tx-success">${escapeHTML(appState.imposter.secretWord)}</div>
        </div>
        ${pairOtherHtml}
        <div>
            <div class="eyebrow">${impTitle}</div>
            <div class="result-word tx-danger">${imposters}</div>
        </div>
        </div>
        <div class="modal-section imp1-board">${outcome==="revealed"&&!board.some(r=>r.score)?"":renderScoreboard(board)}</div>
      `;const screwChart=document.getElementById("screw-chart-container");screwChart&&screwChart.classList.add("hidden");const winnerScores=document.getElementById("winner-scores-container");winnerScores&&winnerScores.classList.add("hidden");const fullBtn=document.getElementById("toggle-results-btn");fullBtn&&fullBtn.classList.add("hidden"),document.getElementById("winner-modal").classList.remove("hidden"),typeof animateScoreboards=="function"&&animateScoreboards({code:"imposter1",game:String(im.scoreId||"")}),won&&afterReveal(document.getElementById("winners-list"),()=>confetti({particleCount:120,spread:70,origin:{y:.6}}))}function imp1Restore(){const im=appState.imposter;im.phase==="guess"&&(im.options||[]).length?setTimeout(()=>{appState.currentView==="play-imposter"&&imp1OpenGuess()},0):im.phase==="done"&&setTimeout(()=>{appState.currentView==="play-imposter"&&imp1ShowResult(!0)},0)}