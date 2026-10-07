const __lzOnce_quiz=1;lzStyle("quiz",".emoji-slot.is-rolling{opacity:.85}#view-play-emoji:not(.hidden),#view-play-proverbs:not(.hidden){display:flex;flex-direction:column}"),lzMarkup([["view-setup-emoji",`<div id="view-setup-emoji" class="hidden" data-accent="amber">
<div class="card">
<div class="segmented mode-switch" style="margin-bottom: var(--sp-4)">
<button class="segmented__item is-active" data-mode="device" onclick="setPlayMode('emoji', 'device')" data-i18n="mode_device">موبايل واحد</button>
<button class="segmented__item" data-mode="online" onclick="setPlayMode('emoji', 'online')" data-i18n="mode_online">كل واحد بموبايله</button>
</div>
<div class="mode-online-panel hidden">
<p class="card__subtitle" data-i18n="emoji_online_desc">الفزورة على كل موبايل وعلى التلفزيون، كل واحد يكتب إجابته، والأسرع ياخد أكتر نقاط.</p>
<div class="btn-stack">
<button onclick="roomCreateFor('emoji')" class="btn btn--primary btn--lg" data-i18n="room_create">افتح غرفة</button>
<button onclick="roomOpenJoin('')" class="btn btn--ghost" data-i18n="join_room_menu">ادخل غرفة</button>
</div>
</div>
<div class="mode-device-panel">
<p class="card__subtitle" data-i18n="emoji_device_desc">فزورة على الشاشة للكل، ومين يعرفها الأول يكسبها. اضغط كشف لما تتفقوا.</p>
<div class="field">
<label class="field__label" for="emoji-cat" data-i18n="emoji_cat_label">النوع</label>
<select id="emoji-cat" onchange="setEmojiCat(this.value)"></select>
</div>
<div class="field">
<label class="field__label" data-i18n="players">اللاعبين</label>
<p class="field__hint" data-i18n="quiz_players_hint">اختاروا اللاعبين عشان تحسبوا النقط (اختياري).</p>
<div class="input-group" style="margin-bottom: var(--sp-3)">
<input type="text" data-i18n-ph="placeholder_name" placeholder="الاسم" autocomplete="off">
<button onclick="addPlayerFromSetup(this)" class="btn btn--primary" aria-label="إضافة لاعب" data-i18n-title="add_player_title">+</button>
</div>
<div id="emoji-player-list"></div>
</div>
<button onclick="startEmojiGame()" class="btn btn--primary btn--lg" data-i18n="start">ابدأ اللعبة</button>
</div>
</div>
</div>`],["view-play-emoji",'<div id="view-play-emoji" class="hidden" data-accent="amber"><div id="emoji-stage"></div></div>'],["view-setup-proverbs",`<div id="view-setup-proverbs" class="hidden" data-accent="teal">
<div class="card">
<div class="segmented mode-switch" style="margin-bottom: var(--sp-4)">
<button class="segmented__item is-active" data-mode="device" onclick="setPlayMode('proverbs', 'device')" data-i18n="mode_device">موبايل واحد</button>
<button class="segmented__item" data-mode="online" onclick="setPlayMode('proverbs', 'online')" data-i18n="mode_online">كل واحد بموبايله</button>
</div>
<div class="mode-online-panel hidden">
<p class="card__subtitle" data-i18n="prov_online_desc">المثل على كل موبايل وعلى التلفزيون، كل واحد يكتب الكلمة الناقصة، والأسرع ياخد أكتر نقاط.</p>
<div class="btn-stack">
<button onclick="roomCreateFor('proverbs')" class="btn btn--primary btn--lg" data-i18n="room_create">افتح غرفة</button>
<button onclick="roomOpenJoin('')" class="btn btn--ghost" data-i18n="join_room_menu">ادخل غرفة</button>
</div>
</div>
<div class="mode-device-panel">
<p class="card__subtitle" data-i18n="prov_device_desc">مثل ناقصه كلمة على الشاشة، والطاولة تكمّله بصوت عالي. اضغط كشف لما تتفقوا.</p>
<div class="field">
<label class="field__label" data-i18n="players">اللاعبين</label>
<p class="field__hint" data-i18n="quiz_players_hint">اختاروا اللاعبين عشان تحسبوا النقط (اختياري).</p>
<div class="input-group" style="margin-bottom: var(--sp-3)">
<input type="text" data-i18n-ph="placeholder_name" placeholder="الاسم" autocomplete="off">
<button onclick="addPlayerFromSetup(this)" class="btn btn--primary" aria-label="إضافة لاعب" data-i18n-title="add_player_title">+</button>
</div>
<div id="proverbs-player-list"></div>
</div>
<button onclick="startProverbsGame()" class="btn btn--primary btn--lg" data-i18n="start">ابدأ اللعبة</button>
</div>
</div>
</div>`],["view-play-proverbs",'<div id="view-play-proverbs" class="hidden" data-accent="teal"><div id="proverbs-stage"></div></div>'],["view-room-emoji",'<div id="view-room-emoji" class="hidden" data-accent="amber"></div>'],["view-room-proverbs",'<div id="view-room-proverbs" class="hidden" data-accent="teal"></div>']]);function emojiState(){return appState.emoji||(appState.emoji={phase:"idle",cat:"all",riddle:null,revealed:!1,n:0}),appState.emoji}function setupEmoji(){emojiState().phase="idle",setView("setup-emoji"),paintEmojiSetup()}function emojiBank(){return EMOJI_RIDDLES[contentLang()]||EMOJI_RIDDLES.ar}function paintEmojiSetup(){const e=emojiState(),sel=document.getElementById("emoji-cat");if(!sel)return;const t=TRANSLATIONS[appState.lang],cats=[];emojiBank().forEach(r=>{cats.indexOf(r.c)===-1&&cats.push(r.c)}),sel.innerHTML=`<option value="all">${escapeHTML(t.emoji_all_cats||"")}</option>`+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join(""),sel.value=cats.indexOf(e.cat)!==-1?e.cat:"all"}function setEmojiCat(value){emojiState().cat=value||"all",saveToLocal()}function emojiPool(){const e=emojiState(),list=emojiBank();return e.cat==="all"?list:list.filter(r=>r.c===e.cat)}function quizPointsReset(store,listId,keep){const picked=keep||(document.getElementById(listId)?(appState.activePlayers||[]).slice():[]);store.players=picked.length>=2?picked:[],store.scores={},store.players.forEach(p=>{store.scores[p]=0}),store.got=-1,store.startedAt=Date.now()}const quizScoring=store=>!!store&&Array.isArray(store.players)&&store.players.length>=2;function quizPointsToggle(store,index){const name=(store.players||[])[index];if(name===void 0||!store.revealed)return!1;if(typeof store.got!="number"&&(store.got=-1),store.got>=0){const prev=store.players[store.got];store.scores[prev]=Math.max(0,(store.scores[prev]||0)-1)}return store.got=store.got===index?-1:index,store.got>=0&&(store.scores[name]=(store.scores[name]||0)+1),saveToLocal(),haptic("light"),!0}function quizPointsBoard(store){return(store.players||[]).map(p=>({id:p,name:p,score:store.scores[p]||0})).sort((a,b)=>b.score-a.score)}function quizWhoGotHtml(store,t,fnName){return!quizScoring(store)||!store.revealed?"":`
    <div class="card card--tight">
      <div class="eyebrow">🙋 ${escapeHTML(t.quiz_who_got||"مين عرفها؟")}</div>
      <div class="chip-set">
        ${store.players.map((p,i)=>{const on=store.got===i;return`<button type="button" class="pick-chip ${on?"is-on":""}" aria-pressed="${on}" onclick="${fnName}(${i})">${on?'<span class="pick-chip__tick" aria-hidden="true">✓</span>':""}<span class="pick-chip__name">${escapeHTML(p)}</span></button>`}).join("")}
      </div>
    </div>`}function quizOverHtml(store,t,code,againFn,exitFn){const board=quizPointsBoard(store),podium=renderPodium({code,game:String(store.startedAt||"")+":"+(store.n||0)},board),champ=board[0]&&board[0].score>0?`<div class="metric metric--md">🏆 ${escapeHTML(board[0].name)}</div>`:"";return`
    <div class="card card--accent" style="text-align:center">
      <div class="eyebrow">${escapeHTML(t.hu_final||"")}</div>
      ${podium||champ}
    </div>
    ${renderScoreboard(board)}
    <div class="btn-stack">
      <button class="btn btn--primary btn--go btn--lg" onclick="${againFn}">${escapeHTML(t.play_again||"")}</button>
      <button class="btn btn--ghost" onclick="${exitFn}">${escapeHTML(t.exit||"")}</button>
    </div>`}function quizSettleBoard(store,code){typeof animateScoreboards=="function"&&animateScoreboards({code,game:String(store.startedAt||"")})}function startEmojiGame(){const e=emojiState();quizPointsReset(e,"emoji-player-list"),e.n=0,e.phase="play",nextEmojiRiddle()}function emojiPlayAgain(){const e=emojiState();quizPointsReset(e,"",(e.players||[]).slice()),e.n=0,e.phase="play",nextEmojiRiddle()}function nextEmojiRiddle(){const e=emojiState();emojiPool().length||(e.cat="all"),e.riddle=freshPick("emoji:"+contentLang()+":"+e.cat,emojiPool(),1)[0],e.revealed=!1,e.got=-1,e.n+=1,saveToLocal(),appState.currentView!=="play-emoji"&&setView("play-emoji"),paintEmoji(),typeof scrollToAction=="function"&&scrollToAction()}function revealEmoji(){const e=emojiState();e.revealed=!0,saveToLocal(),emojiJustRevealed=!0,paintEmoji(),playSound("success")}function emojiGot(index){quizPointsToggle(emojiState(),index)&&paintEmoji()}function finishEmojiGame(){const e=emojiState();if(!quizScoring(e)){setupEmoji();return}e.phase="over",saveToLocal(),paintEmoji(),playSound("success"),typeof confetti=="function"&&quizPointsBoard(e).some(p=>p.score>0)&&afterReveal(document.getElementById("emoji-stage"),()=>confetti({particleCount:140,spread:90}))}function quizRoundDots(n){const at=Math.max(0,(n||1)-1)%10;let dots="";for(let i=0;i<10;i++)dots+=`<i class="${i<at?"is-done":i===at?"is-now":""}"></i>`;return`<div class="wa-write__prog quiz1-dots" aria-hidden="true">${dots}</div>`}function quizCardChips(cat,label,n){return`<div class="quiz1-chips">
      ${cat?`<span class="chip chip--plain">${escapeHTML(cat)}</span>`:""}
      <span class="chip chip--plain">${escapeHTML(label||"")} <b class="metric">${n}</b></span>
    </div>`}function quizPlayBar(t,main,skipFn,scoring,finishFn,exitFn){return`<div class="view-actions talk__actions quiz1-bar">
      <button class="btn btn--primary btn--lg" onclick="${main[1]}">${escapeHTML(main[0]||"")}</button>
      <div class="talk__pair">
        ${skipFn?`<button class="btn btn--ghost btn--sm" onclick="${skipFn}">${escapeHTML(t.emoji_skip||"")}</button>`:""}
        ${scoring?`<button class="btn btn--ghost btn--sm" onclick="${finishFn}">🏁 ${escapeHTML(t.tb_finish||"")}</button>`:`<button class="btn btn--ghost btn--sm" onclick="playExit(() => ${exitFn})">${escapeHTML(t.exit||"")}</button>`}
      </div>
    </div>`}let emojiJustRevealed=!1;function paintEmoji(){const e=emojiState(),stage=document.getElementById("emoji-stage");if(!stage)return;const t=TRANSLATIONS[appState.lang];if(e.phase==="over"){stage.classList.remove("quiz1-stage"),stage.innerHTML=quizOverHtml(e,t,"emoji","emojiPlayAgain()","setupEmoji()"),quizSettleBoard(e,"emoji"),typeof scrollToAction=="function"&&scrollToAction();return}if(!e.riddle)return;const r=e.riddle,scoring=quizScoring(e),pop=e.revealed&&emojiJustRevealed&&!motionOff();emojiJustRevealed=!1,stage.classList.add("quiz1-stage"),stage.innerHTML=`
    <div class="card quiz1-card">
      ${quizCardChips(r.c,t.emoji_riddle_n,e.n)}
      <div class="emoji-card quiz1-card__body"><div class="emoji-card__e">${escapeHTML(r.e)}</div></div>
      ${e.revealed?`<div class="quiz1-answer ${pop?"animate-pop":""}">
             <div class="eyebrow">${escapeHTML(t.quiz_answer||"")}</div>
             <div class="metric metric--md metric--accent">${escapeHTML(r.a)}</div>
             ${typeof reportBtnHtml=="function"?reportBtnHtml("emoji",r.a+" "+r.e):""}
           </div>`:`<p class="quiz1-hint">${escapeHTML(t.emoji_device_hint||"")}</p>`}
    </div>
    ${quizRoundDots(e.n)}
    ${quizWhoGotHtml(e,t,"emojiGot")}
    ${scoring?renderScoreboard(quizPointsBoard(e)):""}
    ${quizPlayBar(t,e.revealed?[t.emoji_next,"nextEmojiRiddle()"]:["👀 "+(t.emoji_reveal||""),"revealEmoji()"],e.revealed?"":"nextEmojiRiddle()",scoring,"finishEmojiGame()","setupEmoji()")}`,scoring&&quizSettleBoard(e,"emoji"),!e.revealed&&motionFirst(["emoji1",e.n,r.e].join("|"))&&emojiSpinIn(stage.querySelector(".emoji-card__e"),r.e)}let emojiSpinPoolCache=null;function emojiGraphemes(text){const s=String(text||"");try{if(typeof Intl!="undefined"&&Intl.Segmenter)return Array.from(new Intl.Segmenter(void 0,{granularity:"grapheme"}).segment(s),x=>x.segment)}catch(err){}return[s]}function emojiSpinPool(){if(emojiSpinPoolCache)return emojiSpinPoolCache;const seen={},out=[],bank=typeof EMOJI_RIDDLES!="undefined"?(EMOJI_RIDDLES.ar||[]).concat(EMOJI_RIDDLES.en||[]):[];for(let i=0;i<bank.length&&out.length<160;i++)emojiGraphemes(bank[i]&&bank[i].e).forEach(g=>{g&&!/^\s+$/.test(g)&&!seen[g]&&(seen[g]=!0,out.push(g))});return emojiSpinPoolCache=out,out}function emojiSpinIn(host,text){if(!host||motionOff())return;const parts=emojiGraphemes(text),pool=emojiSpinPool();if(parts.length<1||pool.length<4)return;host.innerHTML=parts.map(p=>/^\s+$/.test(p)?escapeHTML(p):`<span class="emoji-slot">${escapeHTML(p)}</span>`).join(""),host.querySelectorAll(".emoji-slot").forEach((el,i)=>emojiSlotRoll(el,el.textContent,pool,600+i*300))}function emojiSlotRoll(el,real,pool,stopAfter){const token={};el._roll=token;const others=pool.filter(x=>x!==real),pick=not=>{let x=others[Math.floor(Math.random()*others.length)];return x===not&&(x=others[(others.indexOf(x)+1)%others.length]),x};let shown=pick("");el.textContent=shown,el.classList.add("is-rolling");let start=0;const land=()=>{el._roll===token&&(el._roll=null,el.textContent=real,el.classList.remove("is-rolling","motion-landed"),el.offsetWidth,el.classList.add("motion-landed"),setTimeout(()=>el.classList.remove("motion-landed"),520),playSound("tick"))},flick=()=>{if(el._roll!==token)return;if(!el.isConnected){el._roll=null;return}const at=Date.now()-start;if(at>=stopAfter){land();return}shown=pick(shown),el.textContent=shown,el.animate&&el.animate([{transform:"translateY(-35%)",opacity:.35},{transform:"none",opacity:.9}],{duration:70,easing:"ease-out"});const f=at/stopAfter;setTimeout(flick,55+Math.round(150*f*f))};requestAnimationFrame(()=>{start=Date.now(),flick()}),setTimeout(land,stopAfter+1500)}function restoreEmoji(){const e=emojiState();return e.phase==="over"&&quizScoring(e)?(paintEmoji(),!0):e.phase!=="play"||!e.riddle?!1:(paintEmoji(),!0)}onLanguageChange(view=>{view==="play-emoji"&&paintEmoji()});function provState(){return appState.proverbs||(appState.proverbs={phase:"idle",item:null,revealed:!1,n:0}),appState.proverbs}function setupProverbs(){provState().phase="idle",setView("setup-proverbs")}function provBank(){return PROVERBS[contentLang()]||PROVERBS.ar}function startProverbsGame(){const p=provState();quizPointsReset(p,"proverbs-player-list"),p.n=0,p.phase="play",nextProverb()}function proverbsPlayAgain(){const p=provState();quizPointsReset(p,"",(p.players||[]).slice()),p.n=0,p.phase="play",nextProverb()}function nextProverb(){const p=provState();p.item=freshPick("proverbs:"+contentLang(),provBank(),1)[0],p.revealed=!1,p.got=-1,p.n+=1,saveToLocal(),appState.currentView!=="play-proverbs"&&setView("play-proverbs"),paintProverb(),typeof scrollToAction=="function"&&scrollToAction()}function revealProverb(){const p=provState();p.revealed=!0,saveToLocal(),provJustRevealed=!0,paintProverb(),playSound("success")}function proverbGot(index){quizPointsToggle(provState(),index)&&paintProverb()}function finishProverbsGame(){const p=provState();if(!quizScoring(p)){setupProverbs();return}p.phase="over",saveToLocal(),paintProverb(),playSound("success"),typeof confetti=="function"&&quizPointsBoard(p).some(x=>x.score>0)&&afterReveal(document.getElementById("proverbs-stage"),()=>confetti({particleCount:140,spread:90}))}function paintProverb(){const p=provState(),stage=document.getElementById("proverbs-stage");if(!stage)return;const t=TRANSLATIONS[appState.lang];if(p.phase==="over"){stage.classList.remove("quiz1-stage"),stage.innerHTML=quizOverHtml(p,t,"proverbs","proverbsPlayAgain()","setupProverbs()"),quizSettleBoard(p,"proverbs"),typeof scrollToAction=="function"&&scrollToAction();return}if(!p.item)return;const scoring=quizScoring(p),parts=String(p.item.p).split("___"),pop=p.revealed&&provJustRevealed&&!motionOff();provJustRevealed=!1;const blank=p.revealed?`<span class="prov-blank is-shown ${pop?"animate-pop":""}">${escapeHTML(p.item.a)}</span>`:'<span class="prov-blank">......</span>';if(stage.classList.add("quiz1-stage"),stage.innerHTML=`
    <div class="card quiz1-card">
      ${quizCardChips("",t.prov_n,p.n)}
      ${p.revealed?`<div class="quiz1-card__body pvs-host">${provSignHtml(p.item.p,p.item.a,scoring&&p.got>=0?[{m:"✅",name:p.players[p.got],pts:1}]:[],"one")}</div>`:`<div class="prov-card quiz1-card__body">${escapeHTML(parts[0]||"")}${blank}${escapeHTML(parts[1]||"")}</div>`}
      ${p.revealed?typeof reportBtnHtml=="function"?reportBtnHtml("proverbs",p.item.p):"":`<p class="quiz1-hint">${escapeHTML(t.prov_device_hint||"")}</p>`}
    </div>
    ${quizRoundDots(p.n)}
    ${quizWhoGotHtml(p,t,"proverbGot")}
    ${scoring?renderScoreboard(quizPointsBoard(p)):""}
    ${quizPlayBar(t,p.revealed?[t.prov_next,"nextProverb()"]:["👀 "+(t.prov_reveal||""),"revealProverb()"],p.revealed?"":"nextProverb()",scoring,"finishProverbsGame()","setupProverbs()")}`,scoring&&quizSettleBoard(p,"proverbs"),p.revealed){provSignFit(stage);const tagKey=p.n+"|"+p.got;pop?provSignPlay(stage):p.got>=0&&provSignTagShown&&provSignTagShown!==tagKey&&provSignTagShown.split("|")[0]===String(p.n)&&provSignPlay(stage,{tagsOnly:!0}),provSignTagShown=tagKey}}let provSignTagShown="",provJustRevealed=!1;function restoreProverbs(){const p=provState();return p.phase==="over"&&quizScoring(p)?(paintProverb(),!0):p.phase!=="play"||!p.item?!1:(paintProverb(),!0)}onLanguageChange(view=>{view==="play-proverbs"&&paintProverb()});const PROV_SIGN_CSS=`
.pvs { --pvs-fs: 1.5rem; --pvs-sky: #2a3550; --pvs-sky2: #3b2f4a; --pvs-ground: #6b4f3a; --pvs-ground2: #5a412f;
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: calc(var(--pvs-fs) * .55);
  padding: calc(var(--pvs-fs) * 1.5) var(--sp-3) calc(var(--pvs-fs) * .9); border-radius: inherit; overflow: hidden;
  background: linear-gradient(var(--pvs-sky), var(--pvs-sky2) 58%, var(--pvs-ground) 58.4%, var(--pvs-ground2)); font-family: var(--font-display); }
body:not(.dark) .pvs { --pvs-sky: #bcd3ea; --pvs-sky2: #e2d6c6; --pvs-ground: #b8946c; --pvs-ground2: #a07c55; }
.pvs > * { position: relative; }
.pvs__board { font-size: var(--pvs-fs); font-weight: 900; line-height: 1.55; max-width: 100%;
  padding: .45em .9em .6em; border-radius: .16em; background: linear-gradient(#f6e7c4, #ecd6a6); border: .16em solid #7a4b25;
  box-shadow: inset 0 0 0 .07em #c9a465, 0 .22em .5em rgba(0,0,0,.45); transform: rotate(-1deg); }
.pvs__nail { position: absolute; top: .14em; width: .2em; height: .2em; border-radius: 50%; background: #8b8b8b; box-shadow: inset -.03em -.03em 0 #444; }
.pvs__nail--a { inset-inline-start: .16em; } .pvs__nail--b { inset-inline-end: .16em; }
.pvs__lines { display: flex; flex-direction: column; align-items: center; }
.pvs__line { position: relative; white-space: nowrap; }
.pvs__ghost, .pvs__ink-in { display: block; padding: 0 .08em; }
.pvs__ghost { color: rgba(20, 83, 45, .1); }
.pvs__clip { position: absolute; inset: 0; overflow: hidden; }
.pvs__ink, .pvs__ink-in, .pvs__track { position: absolute; inset: 0; }
.pvs__ink-in { color: #14532d; text-shadow: .03em .03em 0 rgba(255,255,255,.35); }
.pvs__track { pointer-events: none; }
.pvs__brush { position: absolute; inset-inline-end: 0; top: 50%; font-style: normal; font-size: .9em; line-height: 1; opacity: 0;
  transform: translate(40%, -70%) rotate(-28deg); }
.pvs__board[dir="rtl"] .pvs__brush { transform: translate(-40%, -70%) scaleX(-1) rotate(-28deg); }
.pvs__slot { position: relative; display: inline-block; min-width: 2.6em; margin: 0 .12em; text-align: center; border-bottom: .07em dotted transparent; }
.pvs__ghost .pvs__slot { border-bottom: .07em dotted rgba(20, 83, 45, .38); }
.pvs__blank { visibility: hidden; }
.pvs__drop { position: absolute; z-index: 2; left: -.22em; right: -.22em; bottom: -.3em; transform-origin: 50% -1.4em; }
.pvs__word { position: relative; display: block; padding: .02em .22em; border-radius: .14em; background: #b91c1c; color: #fff6dd;
  border: .07em solid #7a4b25; box-shadow: 0 .18em .32em rgba(0,0,0,.4); transform: rotate(3deg); white-space: nowrap; }
.pvs__word::before, .pvs__word::after { content: ''; position: absolute; bottom: 100%; width: .05em; height: .42em; background: #c9b28a;
  border-top: .09em solid #8b8b8b; border-radius: .05em .05em 0 0; }
.pvs__word::before { left: 18%; } .pvs__word::after { right: 18%; }
.pvs__tags { display: flex; flex-wrap: wrap; justify-content: center; gap: calc(var(--pvs-fs) * .3) calc(var(--pvs-fs) * .4); font-size: calc(var(--pvs-fs) * .5); }
.pvs__tagdrop { display: inline-block; padding-top: .55em; }
.pvs__tag { position: relative; display: inline-flex; align-items: center; gap: .35em; padding: .25em .7em; border-radius: .3em;
  background: #f6e7c4; color: #3a2414; font-weight: 800; border: .13em solid #7a4b25; transform: rotate(calc((var(--i, 1) - 1) * 3deg)); }
.pvs__tag::before { content: ''; position: absolute; bottom: 100%; left: 50%; width: .08em; height: .6em; background: #c9b28a; }
.pvs__tag b { color: #b91c1c; unicode-bidi: isolate; direction: ltr; }
.pvs__tag bdi { unicode-bidi: isolate; }
.card.pvs-card { padding: 0; overflow: hidden; }
.pvs--tv { --pvs-fs: 6.6vmin; width: 100%; flex: 1 1 auto; min-height: 0; border-radius: 2vmin; }
.tv-trivia--sign { height: 100%; }
.pvs-host { width: 100%; align-self: stretch; }
.pvs--one { width: 100%; border-radius: var(--r-md, 14px); }
@media (prefers-reduced-motion: reduce) { .pvs__brush { opacity: 0 !important; } }
`;function provSignStyleOn(){if(document.getElementById("prov-sign-style"))return;const st=document.createElement("style");st.id="prov-sign-style",st.textContent=PROV_SIGN_CSS,document.body.appendChild(st),typeof applyMotionPref=="function"&&applyMotionPref()}provSignStyleOn();function provSignHtml(p,word,tags,kind){const parts=String(p||"").split("___"),rtl=/[؀-ۿ]/.test(String(p||"")+String(word||"")),toks=[];String(parts[0]||"").split(/\s+/).filter(Boolean).forEach(w=>toks.push({w})),toks.push({slot:!0,w:String(word||"")}),String(parts.slice(1).join(" ")||"").split(/\s+/).filter(Boolean).forEach(w=>toks.push({w}));const len=x=>Math.max(x.slot?4:0,Array.from(x.w).length)+1,total=toks.reduce((a,x)=>a+len(x),0),n=Math.min(3,Math.max(1,Math.ceil(total/(kind==="tv"?26:15)))),lines=[[]];let acc=0;toks.forEach(x=>{lines[lines.length-1].length&&lines.length<n&&acc+len(x)/2>total/n*lines.length&&lines.push([]),lines[lines.length-1].push(x),acc+=len(x)});const run=(line,ghost)=>line.map(x=>x.slot?`<span class="pvs__slot"><span class="pvs__blank">${escapeHTML(x.w)}</span>${ghost?`<span class="pvs__drop"><span class="pvs__word">${escapeHTML(x.w)}</span></span>`:""}</span>`:escapeHTML(x.w)).join(" "),lineHtml=line=>`<div class="pvs__line" data-len="${line.reduce((a,x)=>a+len(x),0)}">
      <span class="pvs__ghost">${run(line,!0)}</span>
      <span class="pvs__clip" aria-hidden="true"><span class="pvs__ink"><span class="pvs__ink-in">${run(line,!1)}</span></span></span>
      <span class="pvs__track" aria-hidden="true"><i class="pvs__brush">🖌️</i></span>
    </div>`,whole=String(p||"").replace("___",String(word||""));return`<div class="pvs pvs--${kind}" role="img" aria-label="${escapeHTML(whole)}">
      <div class="pvs__board" dir="${rtl?"rtl":"ltr"}" aria-hidden="true"><i class="pvs__nail pvs__nail--a"></i><i class="pvs__nail pvs__nail--b"></i>
        <div class="pvs__lines">${lines.map(lineHtml).join("")}</div>
      </div>
      ${(tags||[]).length?`<div class="pvs__tags" aria-hidden="true">${tags.map((g,i)=>`<span class="pvs__tagdrop"><span class="pvs__tag" style="--i:${i%3}">${escapeHTML(g.m||"")} <bdi>${escapeHTML(g.name||"")}</bdi>${g.pts?` <b>+${Number(g.pts)||0}</b>`:""}</span></span>`).join("")}</div>`:""}
    </div>`}function provSignFit(root){const sign=root&&root.querySelector(".pvs"),board=sign&&sign.querySelector(".pvs__board");if(!board)return;const room=sign.clientWidth-24,w=board.getBoundingClientRect().width;if(room>0&&w>room){const fs=parseFloat(getComputedStyle(board).fontSize)||16;sign.style.setProperty("--pvs-fs",Math.max(9,fs*room/w*.98).toFixed(1)+"px")}}function provSignPlay(root,opts){const sign=root&&root.querySelector(".pvs");if(!sign||motionOff()||typeof sign.animate!="function")return 0;const o=opts||{},tagsAt=t0=>sign.querySelectorAll(".pvs__tagdrop").forEach((el,i)=>el.animate([{opacity:0,transform:"translateY(-.7em) rotate(-8deg)"},{opacity:1,transform:"none"}],{duration:450,delay:t0+i*160,easing:"cubic-bezier(.2,.8,.2,1)",fill:"backwards"}));if(o.tagsOnly)return tagsAt(0),0;const board=sign.querySelector(".pvs__board"),s=board&&board.getAttribute("dir")==="rtl"?-1:1,lines=[...sign.querySelectorAll(".pvs__line")],chars=lines.reduce((a,l)=>a+(Number(l.dataset.len)||1),0),total=Math.max(1300,Math.min(2800,700+chars*45));let t=250;lines.forEach(l=>{const d=total*(Number(l.dataset.len)||1)/chars,opt={duration:d,delay:t,easing:"linear",fill:"backwards"},from=`translateX(${-s*100}%)`;l.querySelector(".pvs__ink").animate([{transform:from},{transform:"none"}],opt),l.querySelector(".pvs__ink-in").animate([{transform:`translateX(${s*100}%)`},{transform:"none"}],opt),l.querySelector(".pvs__track").animate([{transform:from},{transform:"none"}],opt),l.querySelector(".pvs__brush").animate([{opacity:0},{opacity:1,offset:.06},{opacity:1,offset:.9},{opacity:0}],{duration:d,delay:t,fill:"none"}),t+=d});const drop=sign.querySelector(".pvs__drop"),at=t+200;return drop&&drop.animate([{opacity:0,transform:"translateY(-2.4em) rotate(-14deg)"},{opacity:1,offset:.3},{transform:"translateY(.12em) rotate(7deg)",offset:.55},{transform:"rotate(-3.5deg)",offset:.74},{transform:"rotate(1.5deg)",offset:.9},{opacity:1,transform:"none"}],{duration:1e3,delay:at,easing:"ease-out",fill:"backwards"}),tagsAt(at+900),at+550}const QUIZ_UI={emoji:{view:"room-emoji",ph:"emoji_guess_ph",hint:"emoji_lobby_hint",key:"ashryQuizCount_emoji"},proverbs:{view:"room-proverbs",ph:"prov_guess_ph",hint:"prov_lobby_hint",key:"ashryQuizCount_proverbs"}},QUIZ_COUNT_CHOICES=[5,10,15,20],quiz={clock:null,clockKey:null};function quizCount(game){try{const n=Number(localStorage.getItem(QUIZ_UI[game].key));return QUIZ_COUNT_CHOICES.indexOf(n)!==-1?n:10}catch(e){return 10}}function setQuizCount(game,n){try{localStorage.setItem(QUIZ_UI[game].key,String(n))}catch(e){}const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state),haptic("light")}function quizCardHtml(game,card,big){if(game==="emoji")return`<div class="emoji-card ${big?"emoji-card--big":""}">
      <div class="emoji-card__e">${escapeHTML(card.e||"")}</div>
      ${card.c?`<span class="badge badge--accent">${escapeHTML(card.c)}</span>`:""}
    </div>`;const parts=String(card.p||"").split("___");return`<div class="prov-card ${big?"prov-card--big":""}">${escapeHTML(parts[0]||"")}<span class="prov-blank">......</span>${escapeHTML(parts[1]||"")}</div>`}function quizSignTags(state){const s=state.shared||{};return(s.order||[]).map((id,i)=>({m:["🥇","🥈","🥉"][i]||"✅",name:(state.players.find(p=>p.id===id)||{}).name||"",pts:(s.gained||{})[id]||0}))}function quizMine(state){const q=state&&state.you&&state.you.quiz;return q&&q.q===(state.shared||{}).qIndex?q:null}function quizFeedHtml(s,t,mine){const rows=(s.feed||[]).slice(-8).reverse();if(!rows.length)return"";const own=mine&&mine.close||{};return rows.map(f=>{if(f.close&&!f.text&&!own[f.n])return`<div class="quiz-feed__row">🔥 <span class="tx-warning">${escapeHTML(t.quiz_close_other||"{name}").replace("{name}",`<b>${escapeHTML(f.name)}</b>`)}</span></div>`;const text=f.text||own[f.n]||"";return`<div class="quiz-feed__row ${f.right?"is-right":""}">${f.right?"✅ ":f.close?"🔥 ":"❌ "}<b>${escapeHTML(f.name)}</b>${f.right?"":": "+escapeHTML(text)}${!f.right&&f.close?` <span class="tx-warning">${escapeHTML(t.draw_close||"")}</span>`:""}</div>`}).join("")}function quizExtrasHtml(state,t,canType){const s=state.shared;if(!canType)return"";const mine=quizMine(state),near=mine&&mine.near?`<div class="waiting-note"><span class="tx-warning">🔥 ${escapeHTML(t.quiz_near||"")}</span></div>`:"",choices=Array.isArray(s.choices)&&s.choices.length?`
    <div class="card card--tight">
      <p class="field__hint" style="text-align:center">${escapeHTML(t.quiz_choices_hint||"")}</p>
      <div class="btn-stack">${s.choices.map((c,i)=>`<button type="button" class="btn btn--secondary" onclick="roomAct('pick', { i: ${i}, qIndex: ${Number(s.qIndex)||0} })">${escapeHTML(c)}</button>`).join("")}</div>
    </div>`:"";return near+choices}function armQuizClock(endsAt){const paint=()=>{const el=document.getElementById("quiz-clock");el&&(el.textContent=String(Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3))))};paint(),!(quiz.clockKey===endsAt&&quiz.clock&&quiz.clock.isRunning())&&(stopQuizClock(),quiz.clockKey=endsAt,quiz.clock=createClock({seconds:Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3)),onTick:paint,onEnd:()=>{quiz.clock=null;const close=()=>{const st=Room.state;!st||st.game!=="emoji"&&st.game!=="proverbs"||st.shared.phase!=="answering"||st.shared.endsAt!==endsAt||Room.act("closeQuestion").catch(()=>{})};Room.isHost?setTimeout(close,2e3):setTimeout(close,3e3)}}))}function stopQuizClock(){quiz.clock&&quiz.clock.stop(),quiz.clock=null,quiz.clockKey=null}onRoomClocksReset(stopQuizClock);async function quizSend(){const input=document.getElementById("quiz-input"),text=(input&&input.value||"").trim();if(!text)return;input.value="";const st=Room.state&&Room.state.shared;await roomAct("guess",st&&typeof st.qIndex=="number"?{text,qIndex:st.qIndex}:{text})}function quizGame(game){const ui=QUIZ_UI[game];return{lobbyOptions(state){const t=TRANSLATIONS[appState.lang];if(!state.youAreHost)return`<p class="field__hint" style="text-align:center">${escapeHTML(t[ui.hint]||"")}</p>`;const cur=quizCount(game);return`
        <div class="card card--tight">
          <div class="field">
            <label class="field__label">${escapeHTML(t.quiz_count_label||"")}</label>
            <div class="segmented" role="group">
              ${QUIZ_COUNT_CHOICES.map(n=>`<button type="button" class="segmented__item ${n===cur?"is-active":""}" onclick="setQuizCount('${game}', ${n})">${n}</button>`).join("")}
            </div>
          </div>
          <p class="field__hint" style="text-align:center">${escapeHTML(t[ui.hint]||"")}</p>
        </div>`},startPayload(){return{lang:contentLang(),count:quizCount(game)}},render(state){appState.currentView!==ui.view&&setView(ui.view);const el=document.getElementById("view-"+ui.view);if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,inRound=(s.roster||[]).indexOf(Room.me)!==-1,head=`<div class="cn-score">
          <span class="cn-score__role">${ltrFrac(s.qIndex+1,s.total)}</span>
          <span id="quiz-clock" class="badge badge--accent">${s.seconds||""}</span>
        </div>`;if(s.phase==="answering"){const done=(s.solved||[]).indexOf(Room.me)!==-1,used=(s.tried||[]).indexOf(Room.me)!==-1,canType=inRound&&!done&&!used;renderRoomFrame(el,["quiz",s.qIndex,canType,done,used,state.youAreHost,appState.lang].join("|"),()=>`
          ${head}
          <div class="card" style="text-align:center">${quizCardHtml(game,s.card)}</div>
          ${canType?`
            <div class="input-group">
              <input type="text" id="quiz-input" autocomplete="off" maxlength="60" placeholder="${escapeHTML(t[ui.ph]||"")}" onkeydown="if(event.key==='Enter') quizSend()">
              <button class="btn btn--primary" onclick="quizSend()">${escapeHTML(t.send||"")}</button>
            </div>`:`<div class="waiting-note">${escapeHTML(done?t.quiz_you_got_it||"":used?t.quiz_one_try_used||"":t.vote_spectating||"")}</div>`}
          <div id="quiz-extras"></div>
          <div id="quiz-feed" class="quiz-feed"></div>
          ${state.youAreHost?`<button class="btn btn--ghost btn--sm" style="margin-top: var(--sp-3)" onclick="roomAct('closeQuestion')">${escapeHTML(t.quiz_close||"")}</button>`:""}
          ${renderRoomPlayerStrip(state)}`,"quiz|"+s.qIndex);const feed=document.getElementById("quiz-feed");feed&&(feed.innerHTML=quizFeedHtml(s,t,quizMine(state)));const extras=document.getElementById("quiz-extras");if(extras){const html=quizExtrasHtml(state,t,canType);if(extras.dataset.html!==html){const fresh2=html.indexOf("btn-stack")!==-1&&(extras.dataset.html||"").indexOf("btn-stack")===-1;extras.innerHTML=html,extras.dataset.html=html,fresh2&&!motionOff()&&extras.classList.add("animate-pop")}}armQuizClock(s.endsAt),refreshRoomPlayerStrip(el,state);return}if(stopQuizClock(),s.phase==="results"){const gotIt=(s.order||[]).indexOf(Room.me)!==-1,fresh2=renderRoomFrame(el,["quiz-res",s.qIndex,state.youAreHost,appState.lang].join("|"),()=>`
          ${head.replace('id="quiz-clock"',"hidden")}
          ${game==="proverbs"?`<div class="card pvs-card ${gotIt?"card--accent":""}">${provSignHtml((s.card||{}).p,s.answer,quizSignTags(state),"room")}</div>`:`<div class="card ${gotIt?"card--accent":""}" style="text-align:center">
                 ${quizCardHtml(game,s.card)}
                 <div class="eyebrow" style="margin-top: var(--sp-3)">${escapeHTML(t.quiz_answer||"")}</div>
                 <div class="metric metric--md metric--accent">${escapeHTML(s.answer||"")}</div>
               </div>`}
          ${(s.order||[]).length?`<div class="card card--tight">${(s.order||[]).map((pid,i)=>`<div class="status-row"><div class="status-row__body"><div class="status-row__name">${["🥇","🥈","🥉"][i]||"✅"} ${escapeHTML((state.players.find(p=>p.id===pid)||{}).name||"")}</div><div class="tx-success"><b>+${(s.gained||{})[pid]||0}</b></div></div></div>`).join("")}</div>`:`<div class="waiting-note">${escapeHTML(t.quiz_nobody||"")}</div>`}
          ${!s.retry&&(s.answers||[]).some(a=>!a.right)?`<div class="quiz-feed">${(s.answers||[]).filter(a=>!a.right).map(a=>`<div class="quiz-feed__row">❌ <b>${escapeHTML(a.name)}</b>: ${escapeHTML(a.text||"")}</div>`).join("")}</div>`:""}
          ${renderScoreboard(s.board)}
          ${roomMoveOnHtml(state,`<button class="btn btn--primary btn--lg" onclick="roomAct('nextQuestion')">${escapeHTML(s.qIndex+1>=s.total?t.quiz_last||"":t.quiz_next||"")}</button>`,`<div class="waiting-note">${t.room_wait_host}</div>`)}
          ${renderRoomPlayerStrip(state)}`);if(fresh2&&gotIt&&playSound("success"),fresh2&&game==="proverbs"&&(provSignFit(el),motionFirst(["prov-sign",roomDealKey(state,s.qIndex)].join("|"))&&provSignPlay(el)),fresh2){const gain=Number((s.gained||{})[Room.me])||0;if(gotIt&&gain>0&&typeof flyPoints=="function"&&motionFirst(["quiz-gain",state.code,s.dealId||"",s.qIndex].join("|"))){const card=el.querySelector(".card--accent"),row=el.querySelector(`[data-pid="${CSS.escape(Room.me)}"]`);card&&row&&flyPoints("+"+gain,card.getBoundingClientRect(),row)}}refreshRoomPlayerStrip(el,state);return}renderRoomFrame(el,["quiz-over",state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card card--accent" style="text-align:center">
          ${renderPodium(state,s.board)||`<div class="metric metric--md">🏆 ${escapeHTML(((s.board||[])[0]||{}).name||"")}</div>`}
        </div>
        ${renderScoreboard(s.board)}
        ${roomShareBtnHtml(state,s.board)}
        ${state.youAreHost?`<div class="btn-stack">
               <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', ${JSON.stringify({lang:contentLang()}).replace(/"/g,"&quot;")})">${t.play_again||""}</button>
               <button class="btn btn--ghost" onclick="roomAct('backToHub')">${t.room_another_game||""}</button>
             </div>`:`<div class="waiting-note">${t.room_wait_host}</div>`}
        ${renderRoomPlayerStrip(state)}`)&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:140,spread:90})),refreshRoomPlayerStrip(el,state)}}}window.EMOJI_QUIZ_ROOM=quizGame("emoji"),ROOM_GAMES.emoji&&ROOM_GAMES.emoji.svRouter||(ROOM_GAMES.emoji=window.EMOJI_QUIZ_ROOM),ROOM_GAMES.proverbs=quizGame("proverbs");function quizTv(game){return{sig:state=>[state.shared.phase,state.shared.qIndex,(state.shared.feed||[]).length,(state.shared.solved||[]).length,(state.shared.tried||[]).length,!!state.shared.choices,JSON.stringify(state.shared.scores||{})].join("|"),frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"",top=`<div class="tv-top"><span class="tv-pill">${ltrFrac(s.qIndex+1,s.total)}</span>${s.phase==="answering"?`<span id="quiz-clock" class="tv-pill tv-pill--clock">${s.seconds}</span>`:""}</div>`;if(s.phase==="answering"){const names=id=>(state.players.find(p=>p.id===id)||{}).name||"";return`
          <div class="tv-trivia">${top}
            <div class="tv-center">${quizCardHtml(game,s.card,!0)}</div>
            <div class="tv-note">${escapeHTML(t.quiz_tv_type||"")}</div>
            <div class="tv-strip-inline">${(s.solved||[]).map((id,i)=>`<span class="tv-chip is-done">${["🥇","🥈","🥉"][i]||"✅"} ${escapeHTML(names(id))}</span>`).join("")}</div>
            <div class="tv-clues">${(s.feed||[]).filter(f=>!f.right).slice(-6).map(f=>f.close&&!f.text?`<span class="tv-clue">🔥 ${escapeHTML(t.quiz_close_other||"{name}").replace("{name}",escapeHTML(f.name))}</span>`:`<span class="tv-clue">${escapeHTML(f.name)}: ${escapeHTML(f.text||"")}</span>`).join("")}</div>
            ${Array.isArray(s.choices)?`<div class="tv-strip-inline">${s.choices.map(c=>`<span class="tv-chip">${escapeHTML(c)}</span>`).join("")}</div>`:""}
            ${host(tvBtn(t.quiz_close,"roomAct('closeQuestion')","ghost"))}
          </div>`}return s.phase==="results"&&game==="proverbs"?`
          <div class="tv-trivia tv-trivia--sign">${top}
            ${provSignHtml((s.card||{}).p,s.answer,quizSignTags(state),"tv")}
            ${(s.order||[]).length?"":`<div class="tv-note">${escapeHTML(t.quiz_nobody||"")}</div>`}
            ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(s.qIndex+1>=s.total?t.quiz_last:t.quiz_next,"roomAct('nextQuestion')")}</div>`)}
          </div>`:s.phase==="results"?`
          <div class="tv-trivia">${top}
            <div class="tv-center">
              ${quizCardHtml(game,s.card,!0)}
              <div class="tv-eyebrow">${escapeHTML(t.quiz_answer||"")}</div>
              <div class="tv-title">${escapeHTML(s.answer||"")}</div>
              <div class="tv-strip-inline">${(s.order||[]).map((id,i)=>`<span class="tv-chip is-done">${["🥇","🥈","🥉"][i]||"✅"} ${escapeHTML((state.players.find(p=>p.id===id)||{}).name||"")} +${(s.gained||{})[id]||0}</span>`).join("")||`<span class="tv-note">${escapeHTML(t.quiz_nobody||"")}</span>`}</div>
            </div>
            <div class="tv-scale">${renderScoreboard(s.board)}</div>
            ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(s.qIndex+1>=s.total?t.quiz_last:t.quiz_next,"roomAct('nextQuestion')")}</div>`)}
          </div>`:`
        <div class="tv-vote">
          <div class="tv-title tv-center-text">🏆 ${escapeHTML(((s.board||[])[0]||{}).name||"")}</div>
          <div class="tv-scale">${renderScoreboard(s.board)}</div>
          ${host(tvBtn(t.play_again,"roomAct('playAgain', { lang: '"+contentLang()+"' })")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}
        </div>`},after(state,rebuilt){const s=state.shared;if(s.phase==="answering"?armQuizClock(s.endsAt):stopQuizClock(),game==="proverbs"&&rebuilt&&s.phase==="results"){const tv=document.getElementById("view-room-tv");if(provSignFit(tv),motionFirst(["prov-sign-tv",roomDealKey(state,s.qIndex)].join("|"))){const at=provSignPlay(tv);at&&setTimeout(()=>{const st=Room.state&&Room.state.shared;st&&st.phase==="results"&&st.qIndex===s.qIndex&&playSound("pop")},at)}}if(game==="emoji"&&rebuilt&&s.phase==="answering"&&s.card&&typeof emojiSpinIn=="function"&&motionFirst(["emoji-tv",roomDealKey(state,s.qIndex)].join("|"))){const tv=document.getElementById("view-room-tv");emojiSpinIn(tv&&tv.querySelector(".emoji-card__e"),s.card.e||"")}rebuilt&&s.phase==="gameover"&&typeof confetti=="function"&&confetti({particleCount:180,spread:100,origin:{y:.6}})}}}window.EMOJI_QUIZ_TV=quizTv("emoji"),TV_GAMES.emoji&&TV_GAMES.emoji.svRouter||(TV_GAMES.emoji=window.EMOJI_QUIZ_TV),TV_GAMES.proverbs=quizTv("proverbs");