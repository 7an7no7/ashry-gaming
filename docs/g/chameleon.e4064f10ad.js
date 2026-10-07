const __lzOnce_chameleon=1;lzStyle("chameleon","button.cham-cell{cursor:pointer}button.cham-cell:active{transform:scale(.95)}.spc--tv.spc--tv-short{--spc-h: 20vmin}"),lzMarkup([["view-room-chameleon",'<div id="view-room-chameleon" class="hidden" data-accent="amber"></div>'],["view-setup-chameleon",`<div id="view-setup-chameleon" class="hidden" data-accent="amber">
<div class="card">
<div class="segmented mode-switch" style="margin-bottom: var(--sp-4)">
<button class="segmented__item is-active" data-mode="device"
onclick="setPlayMode('chameleon', 'device')" data-i18n="mode_device">موبايل واحد</button>
<button class="segmented__item" data-mode="online"
onclick="setPlayMode('chameleon', 'online')" data-i18n="mode_online">كل واحد بموبايله</button>
</div>
<div class="mode-online-panel hidden">
<p class="card__subtitle" data-i18n="cham_online_desc">الكلمات الـ16 على كل موبايل وعلى التلفزيون، وكل واحد يشوف كلمته السرية على موبايله من غير تمرير. التصويت من الموبايلات.</p>
<div class="btn-stack">
<button onclick="roomCreateFor('chameleon')" class="btn btn--primary btn--lg" data-i18n="room_create">افتح غرفة</button>
<button onclick="roomOpenJoin('')" class="btn btn--ghost" data-i18n="join_room_menu">ادخل غرفة</button>
</div>
</div>
<div class="mode-device-panel">
<label class="field__label" data-i18n="category">المجموعة</label>
<select id="chameleon-cat-select" class="mb-4" data-remember></select>
<div class="group-picker">
<select onchange="loadGroup(this.value)" class="saved-groups-select" aria-label="اختار مجموعة محفوظة" data-i18n-title="a11y_pick_group">
<option value="">-- اختار مجموعة --</option>
</select>
<button onclick="saveCurrentGroup()" class="iconbtn" title="إدارة المجموعات" aria-label="إدارة المجموعات" data-i18n-title="group_manage_title">📂</button>
</div>
<label class="field__label" data-i18n="players">اللاعبين</label>
<div class="input-group" style="margin-bottom: var(--sp-4)">
<input type="text" data-i18n-ph="placeholder_name" placeholder="الاسم" autocomplete="off">
<button onclick="addPlayerFromSetup(this)" class="btn btn--primary" aria-label="إضافة لاعب" data-i18n-title="add_player_title">+</button>
</div>
<div id="chameleon-player-list" class="mb-6"></div>
<button onclick="startChameleonGame()" class="btn btn--primary btn--lg" data-i18n="start">ابدأ اللعبة</button>
</div>
</div>
</div>`],["view-reveal-chameleon",`<div id="view-reveal-chameleon" class="hidden" data-accent="amber">
<div class="card text-center py-8 space-y-6">
<div>
<div class="eyebrow" data-i18n="pass_phone_to">ادّي الموبايل لـ</div>
<h2 id="chameleon-reveal-name" class="text-4xl font-black tx-warning">---</h2>
</div>
<div id="chameleon-hold" class="hold-card hold-card--poster" role="button" tabindex="0" data-next="chameleon-hold-next">
<div class="hold-card__front">
<span class="hold-card__icon" aria-hidden="true" data-art-icon="chameleon"></span>
<span class="hold-card__label" data-i18n="hold_to_reveal">دوس مطوّل عشان تشوف دورك</span>
<span class="hold-card__hint" data-i18n="hold_hint">أول ما تشيل صباعك يستخبى</span>
</div>
<div class="hold-card__back" aria-hidden="true">
<div id="chameleon-card-role" class="text-2xl font-black">---</div>
<div id="chameleon-card-detail" class="hold-card__detail"></div>
</div>
</div>
<button id="chameleon-hold-next" onclick="doneChameleonRevealStep()" class="btn btn--primary btn--lg hold-next is-waiting" data-i18n="hide_and_pass">خبّي وادّي الموبايل 🔒</button>
</div>
</div>`],["view-play-chameleon",`<div id="view-play-chameleon" class="hidden" data-accent="amber">
<div class="card card--tight text-center mb-4">
<div class="eyebrow" data-i18n="category">الموضوع</div>
<h2 id="chameleon-play-category" class="text-2xl font-black tx-warning">---</h2>
</div>
<div class="card mb-4">
<div id="chameleon-4x4-grid"></div>
</div>
<div class="card card--accent talk">
<h3 class="eyebrow talk__head" data-i18n="speaking_order">ترتيب الأدوار لإعطاء الكلمة</h3>
<div id="chameleon-turn-order" class="talk-people"></div>
</div>
<div id="chameleon-guess-box" class="hidden card card--accent text-center mb-4">
<p id="chameleon-guess-instruction" class="font-bold text-sm mb-3 tx-warning"></p>
</div>
<div id="chameleon-play-actions" class="view-actions talk__actions">
<button onclick="openChameleonAccuseModal()" class="btn btn--danger btn--lg" ><span class="btn__art" aria-hidden="true" data-art-icon="chameleon"></span><span data-i18n="accuse_chameleon_btn">اتهام الحرباء</span></button>
<div class="talk__pair">
<button onclick="setupChameleon()" class="btn btn--ghost btn--sm" data-i18n="finish">إنهاء</button>
</div>
</div>
</div>`],["chameleon-accuse-modal",`<div id="chameleon-accuse-modal" class="modal-overlay hidden" onclick="if(event.target===this) closeModal('chameleon-accuse-modal')">
<div class="modal-content modal-content--simple">
<div class="sheet__title" data-i18n="accuse_chameleon">من هي الحرباء؟</div>
<p class="sheet__subtitle" data-i18n="accuse_hint">صوتوا على اللاعب الذي تشكون في أنه الحرباء:</p>
<div id="chameleon-accuse-list" class="modal-list space-y-2"></div>
<div class="modal-actions">
<button onclick="closeModal('chameleon-accuse-modal')" class="btn btn--ghost" data-i18n="cancel">إلغاء</button>
</div>
</div>
</div>`],["chameleon-result-modal",`<div id="chameleon-result-modal" class="modal-overlay hidden">
<div class="modal-content modal-content--simple">
<div id="chameleon-result-title" class="sheet__title">---</div>
<div id="chameleon-result-detail"></div>
<div class="modal-actions">
<button onclick="resetChameleonPlay()" class="btn btn--primary btn--lg" data-i18n="play_again">العب مرة أخرى</button>
</div>
</div>
</div>`]]);const chameleonState={players:[],category:"",words:[],rowIdx:0,colIdx:0,secretCoord:"",secretWord:"",chameleonPlayer:"",revealIndex:0,accusedPlayer:"",guessing:!1,blamed:null,scores:{},scoreId:0,done:!1},ROW_LETTERS=["A","B","C","D"];function renderChameleonCategories(){const catSelect=document.getElementById("chameleon-cat-select");if(!catSelect)return;const previous=catSelect.value,lang=contentLang(),db=CHAMELEON_DB[lang]||CHAMELEON_DB.ar,t=TRANSLATIONS[appState.lang]||{};catSelect.innerHTML="";const optRandom=document.createElement("option");optRandom.value="random",optRandom.innerText="🎲 "+(t.cham_random_cat||(appState.lang==="en"?"Random category":"فئة عشوائية")),catSelect.appendChild(optRandom),packWordPacks(16).forEach(p=>{const opt=document.createElement("option");opt.value=p.id,opt.innerText=p.name,catSelect.appendChild(opt)}),db.forEach((item,idx)=>{const opt=document.createElement("option");opt.value=idx,opt.innerText=item.category,catSelect.appendChild(opt)}),previous&&[...catSelect.options].some(o=>o.value===previous)?catSelect.value=previous:recallField(catSelect)}function setupChameleon(){setView("setup-chameleon")}function startChameleonGame(again){const replay=again===!0&&chameleonState.players.length>=3,selected=replay?chameleonState.players.slice():appState.activePlayers?[...appState.activePlayers]:[];if(replay||saveActivePlayers(selected),selected.length<3){askPlayers(3,()=>startChameleonGame());return}replay||(chameleonState.scores={},chameleonState.scoreId=Date.now()),selected.forEach(p=>{typeof chameleonState.scores[p]!="number"&&(chameleonState.scores[p]=0)});const lang=contentLang(),db=CHAMELEON_DB[lang]||CHAMELEON_DB.ar,catSelect=document.getElementById("chameleon-cat-select");let chosen=null;if(!catSelect||catSelect.value==="random"||!catSelect.value)chosen=freshPick("chameleon:"+lang,db,1,{key:c=>c.category})[0];else if(String(catSelect.value).indexOf("pack")===0&&packWordPackById(catSelect.value,16)){const wp=packWordPackById(catSelect.value,16);chosen={category:wp.name.replace(/^✍️ /,""),words:shuffleArray(wp.words.slice()).slice(0,16)},wp.code&&packPlayed(wp.code)}else{const idx=parseInt(catSelect.value,10);chosen=db[idx]||db[0]}chameleonState.category=chosen.category,chameleonState.words=shuffleArray([...chosen.words]),chameleonState.rowIdx=Math.floor(Math.random()*4),chameleonState.colIdx=Math.floor(Math.random()*4),chameleonState.secretCoord=ROW_LETTERS[chameleonState.rowIdx]+(chameleonState.colIdx+1),chameleonState.secretWord=chameleonState.words[chameleonState.rowIdx*4+chameleonState.colIdx];const shuffledPlayers=shuffleArray(selected);chameleonState.players=shuffledPlayers,chameleonState.chameleonPlayer=shuffledPlayers[Math.floor(Math.random()*shuffledPlayers.length)],chameleonState.revealIndex=0,chameleonState.accusedPlayer="",chameleonState.guessing=!1,chameleonState.done=!1,chameleonState.blamed=null,resetChameleonTable(),playSound("click"),chameleonSave(),showChameleonRevealStep(),setView("reveal-chameleon")}const CHAMELEON_SAVE_KEY="ashryChameleonDeal_v1";function chameleonSave(){try{localStorage.setItem(CHAMELEON_SAVE_KEY,JSON.stringify(chameleonState))}catch(e){}}function restoreChameleon(view){let saved=null;try{saved=JSON.parse(localStorage.getItem(CHAMELEON_SAVE_KEY)||"null")}catch(e){}return!saved||!Array.isArray(saved.players)||saved.players.length<3||!Array.isArray(saved.words)||saved.words.length!==16?!1:(Object.assign(chameleonState,saved),view==="reveal-chameleon"&&chameleonState.revealIndex<chameleonState.players.length?(showChameleonRevealStep(),setView("reveal-chameleon")):startChameleonTablePlay(),!0)}function resetChameleonTable(){const guess=document.getElementById("chameleon-guess-box");guess&&guess.classList.add("hidden");const actions=document.getElementById("chameleon-play-actions");actions&&actions.classList.remove("hidden"),closeModal("chameleon-result-modal")}function showChameleonRevealStep(){if(chameleonState.revealIndex>=chameleonState.players.length){startChameleonTablePlay();return}const playerName=chameleonState.players[chameleonState.revealIndex];document.getElementById("chameleon-reveal-name").innerText=playerName,paintPassFaces("reveal-chameleon",chameleonState.players,chameleonState.revealIndex),revealChameleonSecret(),holdCardReset(document.getElementById("chameleon-hold"))}function revealChameleonSecret(){const isChameleon=chameleonState.players[chameleonState.revealIndex]===chameleonState.chameleonPlayer,cardTitle=document.getElementById("chameleon-card-role"),cardDetail=document.getElementById("chameleon-card-detail"),t=TRANSLATIONS[appState.lang]||{};isChameleon?(cardTitle.innerHTML='<span class="hold-card__art">'+iconHtml("art:chameleon")+"</span> "+escapeHTML(t.cham_you_are||""),cardDetail.innerHTML=`<p class="text-sm font-semibold opacity-90">${escapeHTML(t.cham_you_hint||"")}</p>`):(cardTitle.textContent=t.cham_civilian||"مواطن عادي",cardDetail.innerHTML=`
      <div class="space-y-2">
        <div class="eyebrow">${escapeHTML(t.cham_coord_word||"الإحداثيات والكلمة السرية")}</div>
        <div class="text-2xl font-black tx-warning" dir="ltr">${chameleonState.secretCoord}</div>
        <div class="text-3xl font-black">${escapeHTML(chameleonState.secretWord)}</div>
      </div>
    `)}function doneChameleonRevealStep(){chameleonState.revealIndex++,chameleonSave(),showChameleonRevealStep()}function startChameleonTablePlay(){var _a;resetChameleonTable(),chameleonState.done&&((_a=document.getElementById("chameleon-play-actions"))==null||_a.classList.add("hidden")),setView("play-chameleon"),renderChameleonGrid(),chameleonState.guessing&&!chameleonState.done&&openChameleonGuessPhase(),document.getElementById("chameleon-play-category").innerText=chameleonState.category;const turnsList=document.getElementById("chameleon-turn-order");turnsList&&(turnsList.innerHTML=chameleonState.players.map((p,idx)=>`
      <span class="talk-person ${idx===0?"is-first":""}">
        <span class="talk-person__av metric">${idx+1}</span>
        <span class="talk-person__name">${escapeHTML(p)}</span>
      </span>
    `).join(""))}function renderChameleonGrid(interactive){const gridEl=document.getElementById("chameleon-4x4-grid");if(!gridEl)return;let html=`
    <div class="grid grid-cols-5 gap-1.5 text-center font-bold text-sm">
      <div class="p-2"></div>
      <div class="p-2 tx-warning">1</div>
      <div class="p-2 tx-warning">2</div>
      <div class="p-2 tx-warning">3</div>
      <div class="p-2 tx-warning">4</div>
  `;for(let r=0;r<4;r++){const rowLetter=ROW_LETTERS[r];html+=`<div class="p-2 flex items-center justify-center tx-warning">${rowLetter}</div>`;for(let c=0;c<4;c++){const idx=r*4+c,word=chameleonState.words[idx];interactive?html+=`
          <button type="button" onclick="chameleonGuessWord('${jsStringAttr(word)}')"
                  class="p-2 rounded-lg bg-black/10 dark:bg-white/10 active:bg-amber-500 active:text-black font-semibold text-xs transition-colors flex items-center justify-center min-h-[52px]">
            ${escapeHTML(word)}
          </button>
        `:html+=`
          <div class="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-semibold text-xs flex items-center justify-center min-h-[52px]">
            ${escapeHTML(word)}
          </div>
        `}}html+="</div>",gridEl.innerHTML=html}function openChameleonAccuseModal(){if(chameleonState.done)return;const t=TRANSLATIONS[appState.lang]||{},list=document.getElementById("chameleon-accuse-list");list&&(list.innerHTML=chameleonState.players.map(p=>`
      <button class="ballot-option" onclick="voteChameleonAccused('${jsStringAttr(p)}')">
        <span class="ballot-option__label">${escapeHTML(p)}</span>
        <span class="badge badge--danger">${escapeHTML(t.accuse_badge||"اتهام")}</span>
      </button>
    `).join("")),document.getElementById("chameleon-accuse-modal").classList.remove("hidden")}function voteChameleonAccused(player){if(closeModal("chameleon-accuse-modal"),chameleonState.done)return;chameleonState.accusedPlayer=player,player===chameleonState.chameleonPlayer?(chameleonState.guessing=!0,chameleonSave(),playSound("alarm"),openChameleonGuessPhase()):(playSound("alarm"),finishChameleonGame(!1,!1))}function openChameleonGuessPhase(){const t=TRANSLATIONS[appState.lang]||{};document.getElementById("chameleon-guess-instruction").innerText="🦎 "+chameleonState.chameleonPlayer+" · "+(t.cham_guess_hint||""),renderChameleonGrid(!0),document.getElementById("chameleon-play-actions").classList.add("hidden"),document.getElementById("chameleon-guess-box").classList.remove("hidden")}function chameleonGuessWord(word){if(chameleonState.done)return;const isCorrectWord=word===chameleonState.secretWord;finishChameleonGame(!0,isCorrectWord)}function finishChameleonGame(wasCaught,chameleonGuessedWord){var _a,_b;if(chameleonState.done)return;chameleonState.done=!0,chameleonSave(),(_a=document.getElementById("chameleon-play-actions"))==null||_a.classList.add("hidden"),(_b=document.getElementById("chameleon-guess-box"))==null||_b.classList.add("hidden"),renderChameleonGrid();const t=TRANSLATIONS[appState.lang]||{},resultModal=document.getElementById("chameleon-result-modal"),titleEl=document.getElementById("chameleon-result-title"),detailEl=document.getElementById("chameleon-result-detail"),cham=chameleonState.chameleonPlayer;let chameleonWon=!1,summary="";wasCaught?chameleonGuessedWord?(chameleonWon=!0,summary=(t.cham_stole||"").replace("{name}",cham)):(chameleonWon=!1,summary=(t.cham_caught||"").replace("{name}",cham)):(chameleonWon=!0,summary=(t.cham_escaped||"").replace("{name}",cham)),chameleonWon?chameleonState.scores[cham]=(chameleonState.scores[cham]||0)+2:chameleonState.players.forEach(p=>{p!==cham&&(chameleonState.scores[p]=(chameleonState.scores[p]||0)+1)}),chameleonWon?(playSound("alarm"),titleEl.innerHTML='<span class="title-art">'+iconHtml("art:chameleon")+"</span> "+escapeHTML(t.cham_wins||"الحرباء كسبت!"),titleEl.className="sheet__title tx-warning"):(playSound("success"),afterReveal(detailEl,()=>confetti({particleCount:150})),titleEl.innerText="🎉 "+(t.table_wins||"الطاولة كسبت!"),titleEl.className="sheet__title tx-success");const revealKey=["cham1",chameleonState.scoreId,cham,chameleonState.accusedPlayer,chameleonState.secretWord].join("|"),cover=spyRevealParts(revealKey,t.reveal_chameleon_was),cast=typeof spyCastHtml=="function"?spyCastHtml(revealKey,chameleonWon?"escaped":"caught",{kind:"chameleon"}):"";detailEl.innerHTML=`${cast}
    <div class="result-reveal ${cover.cls}" ${cover.attrs}>${cover.cover}
    <p class="text-base mb-4">${escapeHTML(summary)}</p>
    <div class="plate-well space-y-1 text-sm">
      ${wasCaught?"":`<div><b>${escapeHTML(t.cham_accused||"")}:</b> ${escapeHTML(chameleonState.accusedPlayer)}</div>`}
      <div><b>${escapeHTML(t.secret_word||"")}:</b> ${escapeHTML(chameleonState.secretWord)} (<span dir="ltr">${chameleonState.secretCoord}</span>)</div>
      <div><b>${escapeHTML(t.setup_chameleon||"")}:</b> ${escapeHTML(cham)}</div>
    </div>
    </div>
    ${wasCaught&&chameleonGuessedWord?'<div class="modal-section" id="chameleon-blame"></div>':""}
    <div class="modal-section" id="chameleon-board">${chameleonOneBoardHtml()}</div>
  `,wasCaught&&chameleonGuessedWord&&paintChameleonBlame(),partyModalButton("chameleon-result-modal","chameleon-result-exit","exitChameleonPlay()",t.exit_settings||""),resultModal.classList.remove("hidden"),typeof animateScoreboards=="function"&&animateScoreboards({code:"chameleon",game:String(chameleonState.scoreId)})}function chameleonOneBoardHtml(){const t=TRANSLATIONS[appState.lang]||{},board=chameleonState.players.map(p=>({id:p,name:p+(p===chameleonState.blamed?" · 🫢 "+(t.cham_blamed_badge||""):""),score:chameleonState.scores[p]||0})).sort((a,b)=>b.score-a.score);return renderScoreboard(board)}function paintChameleonBlame(){const el=document.getElementById("chameleon-blame");if(!el)return;const t=TRANSLATIONS[appState.lang]||{},cham=chameleonState.chameleonPlayer,chip=(label,value,on)=>`<button type="button" class="pick-chip ${on?"is-on":""}" aria-pressed="${on}" onclick="chameleonBlame('${jsStringAttr(value)}')">${on?'<span class="pick-chip__tick" aria-hidden="true">✓</span>':""}<span class="pick-chip__name">${escapeHTML(label)}</span></button>`;el.innerHTML=`
    <div class="eyebrow">🫢 ${escapeHTML(t.cham_blame_title||"")}</div>
    <p class="field__hint">${escapeHTML(t.cham_blame_hint||"")}</p>
    <div class="chip-set" style="justify-content:center">
      ${chameleonState.players.filter(p=>p!==cham).map(p=>chip(p,p,chameleonState.blamed===p)).join("")}
      ${chip(t.cham_blame_nobody||"","",chameleonState.blamed==="")}
    </div>`}function chameleonBlame(name){const prev=chameleonState.blamed;prev&&(chameleonState.scores[prev]=(chameleonState.scores[prev]||0)+1),chameleonState.blamed=prev===name?null:name,chameleonState.blamed&&(chameleonState.scores[chameleonState.blamed]=(chameleonState.scores[chameleonState.blamed]||0)-1),chameleonSave(),haptic("light"),paintChameleonBlame();const board=document.getElementById("chameleon-board");board&&(board.innerHTML=chameleonOneBoardHtml())}function resetChameleonPlay(){closeModal("chameleon-result-modal"),startChameleonGame(!0)}function exitChameleonPlay(){closeModal("chameleon-result-modal"),resetChameleonTable(),setupChameleon()}function partyModalButton(modalId,btnId,onclick,label){let btn=document.getElementById(btnId);if(!btn){const actions=document.querySelector("#"+modalId+" .modal-actions");if(!actions)return;btn=document.createElement("button"),btn.id=btnId,btn.type="button",btn.className="btn btn--ghost",btn.setAttribute("onclick",onclick),actions.appendChild(btn)}btn.hasAttribute("data-i18n")||(btn.textContent=label)}ROOM_GAMES.chameleon={lobbyOptions(state){const t=TRANSLATIONS[appState.lang];return(state.youAreHost?packWordsLobbyHtml("chameleonRoom",16):"")+`<p class="field__hint" style="text-align:center">${escapeHTML(t.cham_room_hint||"")}</p>`},startPayload:()=>Object.assign({lang:VOTE_LANG()},packWordsLobbyPick("chameleonRoom",16)?{pack:packWordsLobbyPick("chameleonRoom",16)}:{}),render(state){appState.currentView!=="room-chameleon"&&setView("room-chameleon");const el=document.getElementById("view-room-chameleon");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,v=s.vote||{},sig=["cham",s.phase,s.round,(v.voted||[]).length,v.phase,s.outcome,s.guessIndex,state.youAreHost,appState.lang,JSON.stringify(s.scores||{}),(s.tied||[]).join(","),!!s.revote,!!s.blamePending,s.blamedId||""].join("|");renderRoomFrame(el,sig,()=>chameleonFrame(state,t))&&s.phase==="results"&&s.outcome==="caught"&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:120,spread:70})),refreshRoomPlayerStrip(el,state)}};function chameleonTiedNames(state){return(state.shared.tied||[]).map(id=>(state.players.find(p=>p.id===id)||{}).name).filter(Boolean)}function chameleonBoardHtml(s,t){return renderScoreboard((s.board||[]).map(p=>p.id&&p.id===s.blamedId?Object.assign({},p,{name:p.name+" · 🫢 "+(t.cham_blamed_badge||"")}):p))}function chameleonBlameHtml(state,t,tv){const s=state.shared;if(s.outcome!=="stole")return"";if(!s.blamePending){const line=s.blamedId?(t.cham_blamed||"").replace("{name}",s.blamedName||""):t.cham_blamed_none||"";return tv?`<div class="tv-note tv-center-text">🫢 ${escapeHTML(line)}</div>`:`<p class="field__hint" style="text-align:center">🫢 ${escapeHTML(line)}</p>`}const iAmCham=!tv&&state.you&&state.you.role==="chameleon",skip=b=>roomMoveOnHtml(state,b,"");if(tv)return`<div class="tv-note tv-center-text">${escapeHTML(t.cham_blame_waiting||"")}</div>${skip(`<div class="tv-actions">${tvBtn(t.cham_blame_nobody,"roomAct('blame', { id: '' })","ghost")}</div>`)}`;if(!iAmCham)return`<div class="waiting-note">${escapeHTML(t.cham_blame_waiting||"")}</div>${skip(`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="roomAct('blame', { id: '' })">${escapeHTML(t.cham_blame_nobody||"")}</button></div>`)}`;const others=(s.roster||[]).filter(id=>id!==Room.me&&state.players.some(p=>p.id===id));return`
    <div class="card card--tight">
      <div class="eyebrow">🫢 ${escapeHTML(t.cham_blame_title||"")}</div>
      <p class="field__hint">${escapeHTML(t.cham_blame_hint||"")}</p>
      <div class="chip-set" style="justify-content:center">
        ${others.map(id=>`<button type="button" class="pick-chip" onclick="roomAct('blame', { id: '${jsStringAttr(id)}' })"><span class="pick-chip__name">${escapeHTML((state.players.find(p=>p.id===id)||{}).name||"")}</span></button>`).join("")}
        <button type="button" class="pick-chip" onclick="roomAct('blame', { id: '' })"><span class="pick-chip__name">${escapeHTML(t.cham_blame_nobody||"")}</span></button>
      </div>
    </div>`}function chameleonGridHtml(s,opts){const o=opts||{};return`
    <div class="cham-grid">
      ${s.words.map((w,i)=>{const cls=[o.mine===i?"is-mine":"",s.phase==="results"&&s.secretIndex===i?"is-secret":"",s.phase==="results"&&s.guessIndex===i&&s.guessIndex!==s.secretIndex?"is-wrong":""].join(" ");return o.pick?`<button type="button" class="cham-cell ${cls}" onclick="${o.pick}(${i})">${escapeHTML(w)}</button>`:`<div class="cham-cell ${cls}">${escapeHTML(w)}</div>`}).join("")}
    </div>`}function chameleonFrame(state,t){const s=state.shared,you=state.you||{},iAmCham=you.role==="chameleon",inRound=(s.roster||[]).indexOf(Room.me)!==-1,nameOf=id=>(state.players.find(p=>p.id===id)||{}).name||"…",head=`
    <div class="play-head">
      <span class="badge">${escapeHTML(t.round||"")} <span class="metric">${s.round}</span></span>
      <span class="badge badge--accent">${escapeHTML(s.category||"")}</span>
    </div>`,secretWord=!iAmCham&&typeof you.secret=="number"?(s.words||[])[you.secret]:"",role=inRound?`<div class="role-card">
      <div class="role-card__label">${iAmCham?"🦎 "+escapeHTML(t.cham_you_are||""):"🔑 "+escapeHTML(secretWord||"")}</div>
      <div class="role-card__hint">${escapeHTML((iAmCham?t.cham_you_hint:t.cham_your_word_hint)||"")}</div>
    </div>`:"";if(s.phase==="clues")return head+role+chameleonGridHtml(s,{})+`
      <div class="card card--tight">
        <div class="eyebrow">${escapeHTML(t.speaking_order||"")}</div>
        <div class="chip-set">${(s.order||[]).map((id,i)=>`<span class="chip chip--plain"><b class="metric">${i+1}</b>&nbsp;${escapeHTML(nameOf(id))}</span>`).join("")}</div>
      </div>
      ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--primary btn--lg" onclick="roomAct('startVote')">${escapeHTML(t.cham_start_vote||"")}</button></div>`,`<div class="waiting-note">${escapeHTML(t.cham_wait_vote||"")}</div>`)}
      ${renderRoomPlayerStrip(state)}`;if(s.phase==="tiebreak"){const bars2=roomSpyVoteBars(state,[],"phone-tie");return head+bars2.html+`
      <div class="card card--accent" style="text-align:center">
        <div class="metric metric--md">⚖️ ${escapeHTML(t.cham_tie_title||"")}</div>
        <p class="sheet__subtitle">${escapeHTML(t.cham_tie_hint||"")}</p>
        <div class="chip-set" style="justify-content:center">${chameleonTiedNames(state).map((n,i)=>`<span class="chip chip--plain"><b class="metric">${i+1}</b>&nbsp;${escapeHTML(n)}</span>`).join("")}</div>
      </div>
      ${chameleonGridHtml(s,{})}
      ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--primary btn--lg" onclick="roomAct('revote')">${escapeHTML(t.cham_revote||"")}</button></div>`,`<div class="waiting-note">${escapeHTML(t.cham_wait_vote||"")}</div>`)}
      ${renderRoomPlayerStrip(state)}`}if(s.phase==="voting")return head+chameleonGridHtml(s,{})+`
      <div class="card card--tight">
        <div class="eyebrow">${escapeHTML(s.revote?t.cham_revote_title||"":t.accuse_chameleon||"")}</div>
        ${renderBallot(state,{ownLabel:t.vote_you})}
      </div>`+renderRoomPlayerStrip(state);if(s.phase==="guess"){const bars2=roomSpyVoteBars(state,[s.chameleonId],"phone"),cover2=spyRevealParts(["cham-guess",roomDealKey(state,s.round),s.chameleonId].join("|"),t.reveal_chameleon_was,bars2.ms);return head+`${bars2.html}
      <div class="card card--accent ${cover2.cls}" ${cover2.attrs} style="text-align:center; --cover-at:${cover2.at}ms">${cover2.cover}
        <div class="metric metric--md">🦎 ${escapeHTML(s.chameleonName||"")}</div>
        <p class="sheet__subtitle">${escapeHTML(iAmCham?t.cham_guess_hint||"":t.cham_guessing||"")}</p>
      </div>
      ${chameleonGridHtml(s,iAmCham?{pick:"chameleonGuess"}:{mine:you.secret})}
      ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="roomAct('skipGuess')">${escapeHTML(t.fa_skip_guess||"")}</button></div>`)}
      ${renderRoomPlayerStrip(state)}`}const won=s.outcome==="caught",line=s.impostorLeft?(t.room_impostor_left||"").replace("{name}",s.impostorLeftName||"{name}"):s.outcome==="escaped"?t.cham_escaped||"":s.outcome==="stole"?t.cham_stole||"":t.cham_caught||"",revealKey=["cham",roomDealKey(state,s.round),s.outcome,s.chameleonName].join("|"),bars=roomSpyVoteBars(state,[s.chameleonId],"phone"),cover=spyRevealParts(revealKey,t.reveal_chameleon_was,bars.ms),cast=typeof spyCastHtml=="function"?spyCastHtml(revealKey,spyCastVerdict(s.outcome),{kind:"chameleon",loud:spyCastLoud(state),after:cover.at}):"";return head+`${bars.html}${cast}
    <div class="card ${won?"card--accent":""} ${cover.cls}" ${cover.attrs} style="text-align:center; --cover-at:${cover.at}ms">${cover.cover}
      <div class="metric metric--md ${won?"tx-success":"tx-warning"}">${won?"🎉":"🦎"} ${escapeHTML(line.replace("{name}",s.chameleonName||""))}</div>
      <p class="sheet__subtitle">${escapeHTML(t.secret_word||"")}: <b>${escapeHTML(s.secretWord||"")}</b>${s.accusedName?` · ${escapeHTML(t.cham_accused||"")}: ${escapeHTML(s.accusedName)}`:""}</p>
    </div>
    ${chameleonBlameHtml(state,t)}
    ${chameleonGridHtml(s,{})}
    ${chameleonBoardHtml(s,t)}
    ${roomMoveOnHtml(state,`<div class="btn-stack">
           <button class="btn btn--primary btn--lg" onclick="roomAct('nextRound', { lang: '${VOTE_LANG()}' })">${escapeHTML(t.next_round||"")}</button>
           ${state.youAreHost?`<button class="btn btn--ghost" onclick="tvBackToHub()">${escapeHTML(t.room_another_game||"")}</button>`:""}
         </div>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
    ${renderRoomPlayerStrip(state)}`}function chameleonGuess(index){const s=Room.state&&Room.state.shared;if(!s||s.phase!=="guess")return;const word=s.words[index];showConfirmModal((TRANSLATIONS[appState.lang].cham_confirm_guess||"{word}").replace("{word}",word),()=>roomAct("guess",{index}))}TV_GAMES.chameleon={sig(state){const s=state.shared||{},v=s.vote||{};return[s.phase,s.round,(v.voted||[]).length,v.phase,s.outcome,s.guessIndex,JSON.stringify(s.scores||{}),(s.tied||[]).join(","),!!s.revote,!!s.blamePending,s.blamedId||""].join("|")},frame(state,t){const s=state.shared||{},nameOf=id=>(state.players.find(p=>p.id===id)||{}).name||"…",head=`<div class="tv-eyebrow tv-center-text">${t.round||""} ${s.round} · ${escapeHTML(s.category||"")}</div>`,grid=`<div class="tv-cham">${chameleonGridHtml(s,{})}</div>`;if(s.phase==="clues")return`<div class="tv-vote">${head}${grid}
        <div class="tv-strip-inline">${(s.order||[]).map((id,i)=>`<span class="tv-chip"><b>${i+1}</b> ${escapeHTML(nameOf(id))}</span>`).join("")}</div>
        ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.cham_start_vote,"roomAct('startVote')")}</div>`,`<div class="tv-note">${t.cham_wait_vote||""}</div>`)}</div>`;if(s.phase==="tiebreak"){const bars2=roomSpyVoteBars(state,[],"tv-tie");return`<div class="tv-vote">${head}${bars2.html?`<div class="tv-scale">${bars2.html}</div>`:""}
        <div class="tv-question">⚖️ ${escapeHTML(t.cham_tie_title||"")}</div>
        <div class="tv-note">${escapeHTML(t.cham_tie_hint||"")}</div>
        <div class="tv-strip-inline">${chameleonTiedNames(state).map((n,i)=>`<span class="tv-chip"><b>${i+1}</b> ${escapeHTML(n)}</span>`).join("")}</div>
        ${grid}
        ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.cham_revote,"roomAct('revote')")}</div>`,`<div class="tv-note">${t.cham_wait_vote||""}</div>`)}</div>`}if(s.phase==="voting")return`<div class="tv-vote">${head}${s.revote?`<div class="tv-question">${escapeHTML(t.cham_revote_title||"")}</div>`:""}${grid}${tvVoteProgress(state,t)}</div>`;if(s.phase==="guess"){const bars2=roomSpyVoteBars(state,[s.chameleonId],"tv"),cover2=spyRevealParts(["cham-guess-tv",roomDealKey(state,s.round),s.chameleonId].join("|"),t.reveal_chameleon_was,bars2.ms);return`<div class="tv-vote">${head}${bars2.html?`<div class="tv-scale">${bars2.html}</div>`:""}
        <div class="tv-spy-reveal ${cover2.cls}" ${cover2.attrs} style="--cover-at:${cover2.at}ms">${cover2.cover}<div class="tv-question">🦎 ${escapeHTML(s.chameleonName||"")} · ${t.cham_guessing||""}</div></div>${grid}
        ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.fa_skip_guess,"roomAct('skipGuess')","ghost")}</div>`)}</div>`}const line=s.impostorLeft?(t.room_impostor_left||"").replace("{name}",s.impostorLeftName||"{name}"):s.outcome==="escaped"?t.cham_escaped||"":s.outcome==="stole"?t.cham_stole||"":t.cham_caught||"",revealKey=["cham",roomDealKey(state,s.round),s.outcome,s.chameleonName].join("|"),bars=roomSpyVoteBars(state,[s.chameleonId],"tv"),cover=spyRevealParts(revealKey+"|tv",t.reveal_chameleon_was,bars.ms),cast=typeof spyCastHtml=="function"?spyCastHtml(revealKey,spyCastVerdict(s.outcome),{kind:"chameleon",tv:!0,cls:"spc--tv-short",after:cover.at}):"";return`<div class="tv-vote">${head}${bars.html?`<div class="tv-scale">${bars.html}</div>`:""}${cast}
      <div class="tv-spy-reveal ${cover.cls}" ${cover.attrs} style="--cover-at:${cover.at}ms">${cover.cover}<div class="tv-question">${s.outcome==="caught"?"🎉":"🦎"} ${escapeHTML(line.replace("{name}",s.chameleonName||""))} · ${escapeHTML(s.secretWord||"")}</div></div>
      ${chameleonBlameHtml(state,t,!0)}
      ${grid}<div class="tv-scale">${chameleonBoardHtml(s,t)}</div>
      ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.next_round,`roomAct('nextRound', { lang: '${VOTE_LANG()}' })`)}${state.youAreHost?tvBtn(t.room_another_game,"tvBackToHub()","ghost"):""}</div>`)}</div>`}};