const __lzOnce_codenames=1;lzStyle("codenames",".cn-score__side.is-turn{opacity:1}.cn-side>.cn-banner{order:-1}.cn-card:not(:disabled):active{transform:scale(.94)}.cn-card:disabled{cursor:default}.cn-card--ended{opacity:.6}.cn-log__summary::-webkit-details-marker{display:none}.cn-log__item--blue{--cn-team: #2563eb}"),lzMarkup([["view-setup-codenames",`<div id="view-setup-codenames" class="hidden" data-accent="indigo">
<div class="card">
<p class="card__subtitle" data-i18n="codenames_desc">
فريقين، لوحة فيها 25 كلمة، وقائد لكل فريق شايف الحل. كل واحد محتاج موبايله.
</p>
<label class="field__label" data-i18n="codenames_lang">لغة الكلمات</label>
<div class="segmented" id="codenames-lang" style="margin-bottom: var(--sp-5)">
<button class="segmented__item is-active" onclick="setCodenamesLang('ar')" data-cn-lang="ar">عربي</button>
<button class="segmented__item" onclick="setCodenamesLang('en')" data-cn-lang="en">English</button>
</div>
<button onclick="roomCreateFor('codenames')" class="btn btn--primary btn--lg" data-i18n="room_create">افتح غرفة</button>
<button onclick="roomOpenJoin('')" class="btn btn--ghost" data-i18n="join_room_menu">ادخل غرفة</button>
</div>
</div>`],["view-room-codenames",'<div id="view-room-codenames" class="hidden" data-accent="indigo"></div>']]);let codenamesLang=null;function setCodenamesLang(lang){codenamesLang=lang==="en"?"en":"ar",rememberOptions("codenames",{lang:codenamesLang}),paintCodenamesLang()}function paintCodenamesLang(){document.querySelectorAll("#codenames-lang .segmented__item").forEach(b=>{b.classList.toggle("is-active",b.dataset.cnLang===(codenamesLang||contentLang()))})}function paintCodenamesSetup(){const saved=recallOptions("codenames",{}).lang;(saved==="ar"||saved==="en")&&(codenamesLang=saved),paintCodenamesLang()}function cnSetOption(patch){const keep={};return patch.timer!==void 0&&(keep.timer=Number(patch.timer)),patch.rotate!==void 0&&(keep.rotate=!!patch.rotate),rememberOptions("codenames",keep),roomAct("setOptions",patch)}function cnApplyRemembered(state){const s=state.shared||{};if(!state.youAreHost||state.phase!=="lobby"||s.settings||cnLocal.appliedFor===state.code)return;cnLocal.appliedFor=state.code;const saved=recallOptions("codenames",{}),patch={};CODENAMES_TIMERS.indexOf(saved.timer)!==-1&&saved.timer!==0&&(patch.timer=saved.timer),saved.rotate===!1&&(patch.rotate=!1),Object.keys(patch).length&&setTimeout(()=>{const now=Room.state;!now||now.game!=="codenames"||now.phase!=="lobby"||!now.youAreHost||(now.shared||{}).settings||Room.act("setOptions",patch).catch(()=>{})},0)}const CN_TEAM_LABEL={ar:{red:"الأحمر",blue:"الأزرق"},en:{red:"Red",blue:"Blue"}},CN_UNLIMITED=-1,CN_COVER={red:"🕵️",blue:"🕵️",neutral:"🚶",assassin:"☠️"},CN_CONFETTI={red:["#e11d48","#fda4af","#facc15"],blue:["#2563eb","#93c5fd","#facc15"]},cnLocal={deal:null,pending:null,seen:null,hideKey:!1,swapMode:!1,logOpen:!1,cheered:null,customDraft:null,smPick:null,clock:null,clockKey:null,appliedFor:null,turnKey:null};function cnSettings(s){const raw=s&&s.settings||{};return{timer:CODENAMES_TIMERS.indexOf(raw.timer)!==-1?raw.timer:0,rotate:raw.rotate!==!1,custom:Array.isArray(raw.custom)?raw.custom:[]}}function cnClockText(seconds){return seconds>=60?Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0"):String(seconds)}function cnWinsBadge(s,team){const wins=s.wins||{};return wins.red||wins.blue?`<span class="cn-score__wins">🏆 ${wins[team]||0}</span>`:""}ROOM_GAMES.codenames={lobbyOptions(state){stopCodenamesClock();const s=state.shared,teams=s.teams||{},mine=teams[Room.me]||{},L=CN_TEAM_LABEL[appState.lang]||CN_TEAM_LABEL.ar,t=TRANSLATIONS[appState.lang]||{},roster=team=>state.players.filter(p=>teams[p.id]&&teams[p.id].team===team).map(p=>`<span class="chip chip--plain"><span class="chip__label">${teams[p.id].role==="spymaster"?"🕵️ ":""}${escapeHTML(p.name)}</span></span>`).join(""),btn=(team,role,label)=>`
      <button class="btn ${mine.team===team&&mine.role===role?"btn--primary":"btn--ghost"} btn--sm"
              onclick="roomAct('setTeam', { team: '${team}', role: '${role}' })">${label}</button>`,side=(team,extra)=>`
      <div class="cn-team cn-team--${team}"${extra}>
        <div class="cn-team__head"><span class="cn-dot cn-dot--${team}"></span>${L[team]}${cnWinsBadge(s,team)}</div>
        <div class="chip-set">${roster(team)||`<span class="tool-desc">${t.cn_empty||"لا أحد بعد"}</span>`}</div>
        ${state.youAreScreen?"":`<div class="btn-row" style="margin-top: var(--sp-2)">
          ${btn(team,"spymaster",t.cn_spymaster||"قائد")}
          ${btn(team,"operative",t.cn_operative||"لاعب")}
        </div>`}
      </div>`;return cnApplyRemembered(state),`
      <div class="card card--tight">
        ${side("red","")}
        ${side("blue",' style="margin-top: var(--sp-3)"')}
        <p class="field__hint">${t.cn_lobby_hint||"كل فريق يحتاج قائداً واحداً ولاعباً واحداً على الأقل."}</p>
      </div>
      ${state.youAreHost?cnHostOptions(t,cnSettings(s)):cnOptionsSummary(t,cnSettings(s))}`},startPayload(){return{lang:codenamesLang||contentLang()}},render(state){appState.currentView!=="room-codenames"&&setView("room-codenames");const el=document.getElementById("view-room-codenames");if(!el)return;const s=state.shared,t=TRANSLATIONS[appState.lang]||{};cnLocal.deal!==s.dealtAt&&(cnLocal.deal=s.dealtAt,cnLocal.pending=null,cnLocal.seen=null,cnLocal.swapMode=!1,cnLocal.smPick=null);const turnKey=s.turn+"|"+(s.clue?s.clue.word+":"+s.clue.count:"");cnLocal.turnKey!==turnKey&&(cnLocal.turnKey=turnKey,cnLocal.pending=null);const v=cnView(state),faceUp=(s.board||[]).map(c=>!!c.revealed),fresh=faceUp.map((up,i)=>!!(up&&cnLocal.seen&&!cnLocal.seen[i])),sig=[s.dealtAt,s.turn,s.winner||"",s.guessesLeft,s.endsAt||"",s.clue?s.clue.word+":"+s.clue.count:"",(s.board||[]).map(c=>(c.revealed?c.colour[0]:".")+c.word).join(","),JSON.stringify(s.marks||{}),(s.log||[]).length,v.mine.team+v.mine.role,v.key?1:0,cnLocal.hideKey,cnLocal.swapMode,v.pending,state.youAreHost,s.wins?s.wins.red+"-"+s.wins.blue:"",appState.lang].join("|"),clueIn=el.querySelector("#cn-clue-word"),countIn=el.querySelector("#cn-clue-count"),sameBoard=el.dataset.cnDeal===String(s.dealtAt);el.dataset.cnDeal=String(s.dealtAt);const kept=clueIn&&sameBoard?{word:clueIn.value,count:countIn?countIn.value:"",focus:document.activeElement===clueIn,caret:clueIn.selectionStart}:null,rebuilt=renderRoomFrame(el,sig,()=>cnFrame(state,v,t,fresh));if(rebuilt&&kept){const i=el.querySelector("#cn-clue-word"),c=el.querySelector("#cn-clue-count");if(i&&!i.value&&kept.word&&(i.value=kept.word,kept.focus)){i.focus({preventScroll:!0});try{i.setSelectionRange(kept.caret,kept.caret)}catch(e){}}c&&kept.count&&[...c.options].some(o=>o.value===kept.count)&&(c.value=kept.count)}refreshRoomPlayerStrip(el,state),refreshCodenamesHostTools(el,state,t),rebuilt&&cnFeedback(state,v,fresh),cnLocal.seen=faceUp,s.endsAt&&!s.winner?startCodenamesClock(s.endsAt):stopCodenamesClock()}};function cnView(state){const s=state.shared,mine=(s.teams||{})[Room.me]||{},key=state.you&&state.you.key||null,isSpymaster=mine.role==="spymaster",myTurn=!!mine.team&&mine.team===s.turn&&!s.winner,canGuess=myTurn&&mine.role==="operative"&&!!s.clue,board=s.board||[],pending=canGuess&&cnLocal.pending!==null&&board[cnLocal.pending]&&!board[cnLocal.pending].revealed?cnLocal.pending:null;return{s,mine,key,isSpymaster,myTurn,canGuess,pending,showKey:isSpymaster&&!!key&&!cnLocal.hideKey,canSwap:!s.winner&&!(s.log||[]).length&&(state.youAreHost||isSpymaster)}}function cnFrame(state,v,t,fresh){const s=v.s,L=CN_TEAM_LABEL[appState.lang]||CN_TEAM_LABEL.ar;return`
    ${cnScoreBar(v,t)}
    <div class="cn-layout">
      <div class="cn-board">${(s.board||[]).map((cell,i)=>cnCard(cell,i,v,fresh[i])).join("")}</div>
      <div class="cn-side">
        ${cnBanner(s,t,L)}
        ${cnControls(state,v,t,L)}
        <div data-cn-host></div>
        ${cnTools(v,t)}
        ${cnLog(s,t)}
      </div>
    </div>
    ${renderRoomPlayerStrip(state)}`}function cnScoreBar(v,t){const s=v.s,side=team=>`
    <span class="cn-score__side cn-score__side--${team} ${s.turn===team&&!s.winner?"is-turn":""}">
      <span class="cn-dot cn-dot--${team}"></span>${s.remaining?s.remaining[team]:0}${cnWinsBadge(s,team)}
    </span>`,role=v.isSpymaster?"🕵️ "+(t.cn_spymaster||"قائد"):v.mine.team?t.cn_operative||"لاعب":t.vote_spectating||"";return`<div class="cn-score">${side("red")}<span class="cn-score__role">${role}</span>${side("blue")}</div>`}function cnCard(cell,i,v,fresh){const s=v.s,classes=["cn-card"];cell.revealed?(classes.push("cn-card--revealed","cn-card--"+cell.colour),fresh&&classes.push("is-flipping")):s.winner&&cell.colour?classes.push("cn-card--ended","cn-peek--"+cell.colour):v.showKey&&classes.push("cn-card--peek","cn-peek--"+v.key[i]);const marks=cell.revealed?[]:(s.marks||{})[i]||[];marks.indexOf(Room.me)!==-1&&classes.push("is-marked"),v.pending===i&&classes.push("is-pending");const swapping=v.canSwap&&cnLocal.swapMode&&!cell.revealed;swapping&&classes.push("is-swappable");const tappable=!cell.revealed&&(v.canGuess||swapping);return`
    <button class="${classes.join(" ")}" ${tappable?"":"disabled"} onclick="tapCodenamesCard(${i})">
      ${cell.revealed?`<span class="cn-card__cover" aria-hidden="true">${CN_COVER[cell.colour]||""}</span>`:""}
      <span class="cn-card__word">${escapeHTML(cell.word)}</span>
      ${marks.length?`<span class="cn-card__marks" aria-hidden="true">${marks.length}</span>`:""}
    </button>`}function cnBanner(s,t,L){const timer=s.endsAt&&!s.winner?`<span id="cn-timer" class="badge badge--accent cn-timer">${cnClockText(Math.max(0,Math.ceil((s.endsAt-roomServerNow())/1e3)))}</span>`:"";if(s.winner){const reason=s.endReason==="assassin"?t.cn_assassin_hit||"انكشف القاتل!":t.cn_cleared||"كل الكلمات ظهرت";return`<div class="cn-banner cn-banner--${s.winner}">
              <div class="cn-banner__title">${s.endReason==="assassin"?"☠️":"🏆"} ${t.cn_wins||"فاز الفريق"} ${L[s.winner]}</div>
              <div class="cn-banner__sub">${reason}</div>
            </div>`}if(s.clue){const count=s.clue.count==="inf"?"∞":s.clue.count,left=s.guessesLeft===CN_UNLIMITED?"∞":s.guessesLeft;return`<div class="cn-banner cn-banner--${s.turn}">
              <div class="cn-banner__title">${escapeHTML(s.clue.word)} · ${count}</div>
              <div class="cn-banner__sub"><span>${L[s.turn]} · ${t.cn_guesses_left||"محاولات متبقية"}: ${left}</span>${timer}</div>
            </div>`}return`<div class="cn-banner cn-banner--${s.turn}">
            <div class="cn-banner__title">${t.cn_turn||"دور الفريق"} ${L[s.turn]}</div>
            <div class="cn-banner__sub"><span>${t.cn_await_clue||"في انتظار تلميح القائد"}</span>${timer}</div>
          </div>`}function cnControls(state,v,t,L){const s=v.s;return s.winner?cnStats(s,t)+(state.youAreHost?`<div class="btn-stack">
           <button onclick="roomAct('restart')" class="btn btn--primary btn--lg">${t.play_again||"لعبة جديدة"}</button>
           <button onclick="roomAct('backToHub')" class="btn btn--ghost">${t.room_another_game||"لعبة أخرى"}</button>
         </div>`:`<div class="waiting-note">${t.room_wait_host||""}</div>`):v.isSpymaster&&v.myTurn&&!s.clue?`
      <div class="card card--tight">
        <label class="field__label" for="cn-clue-word">${t.cn_your_clue||"تلميحك"}</label>
        <div class="input-group">
          <input type="text" id="cn-clue-word" autocomplete="off" maxlength="24" enterkeyhint="send"
                 placeholder="${escapeHTML(t.cn_clue_ph||"كلمة واحدة")}"
                 onkeydown="if (event.key === 'Enter') { event.preventDefault(); submitCodenamesClue(); }">
          <select id="cn-clue-count" aria-label="${escapeHTML(t.cn_clue_count||"")}" style="width:84px; flex:none">
            ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}" ${n===1?"selected":""}>${n}</option>`).join("")}
            <option value="inf">∞</option>
          </select>
        </div>
        <p class="field__hint">${t.cn_clue_hint||""}</p>
        <button onclick="submitCodenamesClue()" class="btn btn--primary">${t.cn_give_clue||"أعط التلميح"}</button>
      </div>`:v.isSpymaster&&v.myTurn?`<div class="waiting-note">${t.cn_team_guessing||"فريقك يخمّن الآن…"}</div>`:v.canGuess?v.pending!==null?`
        <div class="cn-confirm">
          <div class="cn-confirm__word">${escapeHTML(s.board[v.pending].word)}</div>
          <div class="btn-stack">
            <button class="btn btn--primary btn--lg" onclick="revealCodenamesPending()">${t.cn_reveal||"اكشف الكلمة"}</button>
            <button class="btn btn--ghost" onclick="cancelCodenamesPending()">${t.cancel||"إلغاء"}</button>
          </div>
        </div>`:`
      <p class="field__hint cn-hint">${t.cn_mark_hint||""}</p>
      <button onclick="roomAct('endTurn')" class="btn btn--ghost">${t.cn_end_turn||"إنهاء الدور"}</button>`:v.myTurn?`<div class="waiting-note">${t.cn_await_clue||""}</div>`:v.mine.team?`<div class="waiting-note">${t.cn_other_turn||"دور الفريق الآخر"}</div>`:""}const cnPassTurnLabel=t=>t.cn_pass_turn||(appState.lang==="en"?"Pass the turn ⏭️":"انقل الدور ⏭️");function cnSpymasterOf(state,team){const teams=state.shared&&state.shared.teams||{},id=Object.keys(teams).find(k=>teams[k].team===team&&teams[k].role==="spymaster"),p=id?state.players.find(x=>x.id===id):null;return{id:id||null,here:!!(p&&p.online)}}function refreshCodenamesHostTools(root,state,t){const box=root&&root.querySelector("[data-cn-host]");if(!box)return;const html=cnHostTools(state,t,CN_TEAM_LABEL[appState.lang]||CN_TEAM_LABEL.ar);box.dataset.sig!==html&&(box.innerHTML=html,box.dataset.sig=html)}function cnHostTools(state,t,L){const s=state.shared||{};if(!roomCanMoveOn(state)||s.winner||!s.board||!s.board.length)return"";const buttons=[[cnPassTurnLabel(t),`roomAct('passTurn', { turn: '${jsStringAttr(s.turn||"")}' })`]];if(!state.youAreHost)return roomHostRow(buttons);["red","blue"].forEach(team=>{if(cnSpymasterOf(state,team).here&&cnLocal.smPick!==team)return;const label=(t.cn_set_spymaster||(appState.lang==="en"?"New spymaster: {team}":"قائد جديد للفريق {team}")).replace("{team}",L[team]);buttons.push(["🕵️ "+label,`cnPickSpymaster('${team}')`,cnLocal.smPick===team?"secondary":"ghost"])});let picker="";if(cnLocal.smPick){const team=cnLocal.smPick,teams=s.teams||{},members=state.players.filter(p=>teams[p.id]&&teams[p.id].team===team&&teams[p.id].role!=="spymaster");picker=`<div class="chip-set" style="justify-content:center; margin-top: var(--sp-2)">${members.length?members.map(p=>`<button type="button" class="chip ${p.online?"":"is-away"}" onclick="cnSetSpymaster('${team}', '${jsStringAttr(p.id)}')"><span class="chip__label">🕵️ ${escapeHTML(p.name)}</span></button>`).join(""):`<span class="tool-desc">${escapeHTML(t.cn_empty||"")}</span>`}</div>`}return roomHostRow(buttons)+picker}function cnPickSpymaster(team){cnLocal.smPick=cnLocal.smPick===team?null:team,haptic("light"),cnRedraw()}async function cnSetSpymaster(team,playerId){cnLocal.smPick=null,cnRedraw(),await roomAct("setSpymaster",{team,playerId})}function cnStats(s,t){const clues=team=>(s.log||[]).filter(e=>e.type==="clue"&&e.team===team).length,wins=s.wins||{},row=(label,red,blue)=>`
    <span class="cn-stats__label">${label}</span>
    <span class="cn-stats__num cn-stats__num--red">${red}</span>
    <span class="cn-stats__num cn-stats__num--blue">${blue}</span>`;return`
    <div class="cn-stats">
      <span></span>
      <span class="cn-stats__num"><span class="cn-dot cn-dot--red"></span></span>
      <span class="cn-stats__num"><span class="cn-dot cn-dot--blue"></span></span>
      ${row(t.cn_left||"",s.remaining?s.remaining.red:0,s.remaining?s.remaining.blue:0)}
      ${row(t.cn_clues_given||"",clues("red"),clues("blue"))}
      ${row("🏆 "+(t.cn_series||""),wins.red||0,wins.blue||0)}
    </div>`}function cnTools(v,t){const s=v.s,tools=[];return v.isSpymaster&&v.key&&!s.winner&&tools.push(`<button class="btn btn--ghost btn--sm btn--auto" onclick="toggleCodenamesKey()">${cnLocal.hideKey?"👁️ "+(t.cn_show_key||""):"🙈 "+(t.cn_hide_key||"")}</button>`),v.canSwap&&tools.push(`<button class="btn ${cnLocal.swapMode?"btn--primary":"btn--ghost"} btn--sm btn--auto"
                        onclick="toggleCodenamesSwap()">🔁 ${t.cn_swap_word||""}</button>`),tools.length?`<div class="btn-row cn-tools">${tools.join("")}</div>`+(cnLocal.swapMode&&v.canSwap?`<p class="field__hint cn-hint">${t.cn_swap_hint||""}</p>`:""):""}function cnLog(s,t){const groups=[];if((s.log||[]).forEach(e=>{const last=groups[groups.length-1];(e.type==="clue"||!last||last.team!==e.team)&&groups.push({team:e.team,clue:e.type==="clue"?e:null,guesses:[]}),e.type==="guess"&&groups[groups.length-1].guesses.push(e)}),!groups.length)return"";const items=groups.slice().reverse().map(g=>`
    <li class="cn-log__item cn-log__item--${g.team}">
      <div class="cn-log__clue">${g.clue?escapeHTML(g.clue.word)+" · "+(g.clue.count==="inf"?"∞":g.clue.count):"—"}</div>
      <div class="cn-log__guesses">${g.guesses.length?g.guesses.map(x=>`<span class="cn-log__guess"><span class="cn-dot cn-dot--${x.colour}"></span>${escapeHTML(x.word)}</span>`).join(""):`<span class="tx-muted">${t.cn_no_guesses||""}</span>`}</div>
    </li>`).join("");return`
    <details class="cn-log" ${cnLocal.logOpen?"open":""} ontoggle="cnLocal.logOpen = this.open">
      <summary class="cn-log__summary">📜 ${t.cn_log||""} <span class="badge">${groups.filter(g=>g.clue).length}</span></summary>
      <ol class="cn-log__list">${items}</ol>
    </details>`}function cnFeedback(state,v,fresh){const s=state.shared,flipped=fresh.map((f,i)=>f?i:-1).filter(i=>i!==-1);if(flipped.length&&!s.winner){const colour=s.board[flipped[flipped.length-1]].colour,good=v.mine.team?colour===v.mine.team:colour!=="neutral";playRoomFx(good?"success":"alarm"),haptic(good?"medium":"heavy")}if(s.winner&&cnLocal.cheered!==s.dealtAt){cnLocal.cheered=s.dealtAt;const assassin=s.endReason==="assassin";assassin?(playRoomFx("alarm"),haptic("heavy")):playRoomFx("success"),typeof confetti=="function"&&setTimeout(()=>confetti({particleCount:150,spread:85,origin:{y:.6},colors:CN_CONFETTI[s.winner]}),assassin?500:0)}}function cnRedraw(){Room.state&&routeRoomState(Room.state)}function tapCodenamesCard(i){const state=Room.state;if(!state)return;const v=cnView(state),cell=(v.s.board||[])[i];if(!cell||cell.revealed)return;if(cnLocal.swapMode&&v.canSwap){cnLocal.swapMode=!1,roomAct("swapWord",{index:i}),cnRedraw();return}if(!v.canGuess)return;const marked=((v.s.marks||{})[i]||[]).indexOf(Room.me)!==-1;v.pending===i?(cnLocal.pending=null,marked&&roomAct("mark",{index:i,on:!1})):(cnLocal.pending=i,marked||roomAct("mark",{index:i,on:!0})),haptic("light"),cnRedraw()}function cancelCodenamesPending(){const s=Room.state&&Room.state.shared,i=cnLocal.pending;cnLocal.pending=null,s&&i!==null&&((s.marks||{})[i]||[]).indexOf(Room.me)!==-1&&roomAct("mark",{index:i,on:!1}),cnRedraw()}async function revealCodenamesPending(){const i=cnLocal.pending;i!==null&&(cnLocal.pending=null,cnRedraw(),await roomAct("guess",{index:i,turn:Room.state&&Room.state.shared?Room.state.shared.turn:void 0}))}function toggleCodenamesKey(){cnLocal.hideKey=!cnLocal.hideKey,cnRedraw()}function toggleCodenamesSwap(){cnLocal.swapMode=!cnLocal.swapMode,cnRedraw()}async function submitCodenamesClue(){const t=TRANSLATIONS[appState.lang]||{},word=(document.getElementById("cn-clue-word").value||"").trim(),count=document.getElementById("cn-clue-count").value;if(!word)return showToast(t.cn_clue_needed||"اكتب التلميح","error");const s=Room.state&&Room.state.shared;if(s&&(s.board||[]).some(c=>!c.revealed&&codenamesClueClash(word,c.word)))return showToast(t.cn_clue_on_board||"","error");await roomAct("giveClue",{word,count:count==="inf"?"inf":Number(count)})}async function saveCodenamesWords(){const box=document.getElementById("cn-custom"),text=box?box.value:cnLocal.customDraft||"";try{await Room.act("setOptions",{custom:text}),cnLocal.customDraft=null,showToast((TRANSLATIONS[appState.lang]||{}).cn_custom_saved||"","success"),cnRedraw()}catch(err){showToast(err.message||"تعذر الحفظ","error")}}function cnHostOptions(t,settings){const draft=cnLocal.customDraft!==null?cnLocal.customDraft:settings.custom.join(`
`);return`
    <div class="card card--tight cn-options">
      <div class="card__title">${t.cn_options||""}</div>
      <button class="btn btn--secondary" onclick="roomAct('shuffleTeams')">🎲 ${t.cn_shuffle||""}</button>

      <div class="field">
        <span class="field__label">${t.cn_timer||""}</span>
        <div class="segmented" role="group">
          ${CODENAMES_TIMERS.map(n=>`
            <button type="button" class="segmented__item ${settings.timer===n?"is-active":""}"
                    onclick="cnSetOption({ timer: ${n} })">${n||t.cn_timer_off||"—"}</button>`).join("")}
        </div>
        ${settings.timer?`<p class="field__hint">${t.cn_timer_hint||""}</p>`:""}
      </div>

      <div class="field">
        <label class="switch-row" for="cn-rotate">
          <span class="field__label">${t.cn_rotate||""}</span>
          <span class="switch">
            <input type="checkbox" id="cn-rotate" role="switch" ${settings.rotate?"checked":""}
                   onchange="cnSetOption({ rotate: this.checked })">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </label>
        <p class="field__hint">${t.cn_rotate_hint||""}</p>
      </div>

      <div class="field">
        <label class="field__label" for="cn-custom">${t.cn_custom||""}</label>
        <textarea id="cn-custom" rows="3" placeholder="${escapeHTML(t.cn_custom_ph||"")}"
                  oninput="cnLocal.customDraft = this.value">${escapeHTML(draft)}</textarea>
        <p class="field__hint">${(t.cn_custom_count||"{n}").replace("{n}",settings.custom.length)}</p>
        <button class="btn btn--ghost btn--sm" onclick="saveCodenamesWords()">${t.cn_custom_save||""}</button>
      </div>
    </div>`}function cnOptionsSummary(t,settings){const bits=[];return settings.timer&&bits.push("⏱️ "+(t.cn_timer_summary||"{n}").replace("{n}",settings.timer)),settings.rotate&&bits.push("🔄 "+(t.cn_rotate_summary||"")),settings.custom.length&&bits.push("✍️ "+(t.cn_custom_count||"{n}").replace("{n}",settings.custom.length)),bits.length?`<p class="field__hint cn-hint">${bits.join(" · ")}</p>`:""}function paintCodenamesTimer(endsAt){const el=document.getElementById("cn-timer");if(!el)return 0;const left=Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3));return el.textContent=cnClockText(left),el.classList.toggle("badge--danger",left<=10),el.classList.toggle("badge--accent",left>10),left}function startCodenamesClock(endsAt){paintCodenamesTimer(endsAt),!(cnLocal.clockKey===endsAt&&cnLocal.clock&&cnLocal.clock.isRunning())&&(stopCodenamesClock(),cnLocal.clockKey=endsAt,cnLocal.clock=createClock({seconds:Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3)),onTick:()=>{const left=paintCodenamesTimer(endsAt),st=Room.state;left>0&&left<=5&&appState.currentView==="room-codenames"&&st&&st.game==="codenames"&&st.shared.endsAt===endsAt&&playSound("tick")},onEnd:()=>{cnLocal.clock=null}}))}function stopCodenamesClock(){cnLocal.clock&&cnLocal.clock.stop(),cnLocal.clock=null,cnLocal.clockKey=null}onRoomClocksReset(stopCodenamesClock);