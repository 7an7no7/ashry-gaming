function emojiState(){return appState.emoji||(appState.emoji={phase:"idle",cat:"all",riddle:null,revealed:!1,n:0}),appState.emoji}function setupEmoji(){emojiState().phase="idle",setView("setup-emoji"),paintEmojiSetup()}function emojiBank(){return EMOJI_RIDDLES[contentLang()]||EMOJI_RIDDLES.ar}function paintEmojiSetup(){const e=emojiState(),sel=document.getElementById("emoji-cat");if(!sel)return;const t=TRANSLATIONS[appState.lang],cats=[];emojiBank().forEach(r=>{cats.indexOf(r.c)===-1&&cats.push(r.c)}),sel.innerHTML=`<option value="all">${escapeHTML(t.emoji_all_cats||"")}</option>`+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join(""),sel.value=cats.indexOf(e.cat)!==-1?e.cat:"all"}function setEmojiCat(value){emojiState().cat=value||"all",saveToLocal()}function emojiPool(){const e=emojiState(),list=emojiBank();return e.cat==="all"?list:list.filter(r=>r.c===e.cat)}function quizPointsReset(store,listId,keep){const picked=keep||(document.getElementById(listId)?(appState.activePlayers||[]).slice():[]);store.players=picked.length>=2?picked:[],store.scores={},store.players.forEach(p=>{store.scores[p]=0}),store.got=-1,store.startedAt=Date.now()}const quizScoring=store=>!!store&&Array.isArray(store.players)&&store.players.length>=2;function quizPointsToggle(store,index){const name=(store.players||[])[index];if(name===void 0||!store.revealed)return!1;if(typeof store.got!="number"&&(store.got=-1),store.got>=0){const prev=store.players[store.got];store.scores[prev]=Math.max(0,(store.scores[prev]||0)-1)}return store.got=store.got===index?-1:index,store.got>=0&&(store.scores[name]=(store.scores[name]||0)+1),saveToLocal(),haptic("light"),!0}function quizPointsBoard(store){return(store.players||[]).map(p=>({id:p,name:p,score:store.scores[p]||0})).sort((a,b)=>b.score-a.score)}function quizWhoGotHtml(store,t,fnName){return!quizScoring(store)||!store.revealed?"":`
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
    ${quizPlayBar(t,e.revealed?[t.emoji_next,"nextEmojiRiddle()"]:["👀 "+(t.emoji_reveal||""),"revealEmoji()"],e.revealed?"":"nextEmojiRiddle()",scoring,"finishEmojiGame()","setupEmoji()")}`,scoring&&quizSettleBoard(e,"emoji")}function restoreEmoji(){const e=emojiState();return e.phase==="over"&&quizScoring(e)?(paintEmoji(),!0):e.phase!=="play"||!e.riddle?!1:(paintEmoji(),!0)}onLanguageChange(view=>{view==="play-emoji"&&paintEmoji()});function provState(){return appState.proverbs||(appState.proverbs={phase:"idle",item:null,revealed:!1,n:0}),appState.proverbs}function setupProverbs(){provState().phase="idle",setView("setup-proverbs")}function provBank(){return PROVERBS[contentLang()]||PROVERBS.ar}function startProverbsGame(){const p=provState();quizPointsReset(p,"proverbs-player-list"),p.n=0,p.phase="play",nextProverb()}function proverbsPlayAgain(){const p=provState();quizPointsReset(p,"",(p.players||[]).slice()),p.n=0,p.phase="play",nextProverb()}function nextProverb(){const p=provState();p.item=freshPick("proverbs:"+contentLang(),provBank(),1)[0],p.revealed=!1,p.got=-1,p.n+=1,saveToLocal(),appState.currentView!=="play-proverbs"&&setView("play-proverbs"),paintProverb(),typeof scrollToAction=="function"&&scrollToAction()}function revealProverb(){const p=provState();p.revealed=!0,saveToLocal(),provJustRevealed=!0,paintProverb(),playSound("success")}function proverbGot(index){quizPointsToggle(provState(),index)&&paintProverb()}function finishProverbsGame(){const p=provState();if(!quizScoring(p)){setupProverbs();return}p.phase="over",saveToLocal(),paintProverb(),playSound("success"),typeof confetti=="function"&&quizPointsBoard(p).some(x=>x.score>0)&&afterReveal(document.getElementById("proverbs-stage"),()=>confetti({particleCount:140,spread:90}))}function paintProverb(){const p=provState(),stage=document.getElementById("proverbs-stage");if(!stage)return;const t=TRANSLATIONS[appState.lang];if(p.phase==="over"){stage.classList.remove("quiz1-stage"),stage.innerHTML=quizOverHtml(p,t,"proverbs","proverbsPlayAgain()","setupProverbs()"),quizSettleBoard(p,"proverbs"),typeof scrollToAction=="function"&&scrollToAction();return}if(!p.item)return;const scoring=quizScoring(p),parts=String(p.item.p).split("___"),pop=p.revealed&&provJustRevealed&&!motionOff();provJustRevealed=!1;const blank=p.revealed?`<span class="prov-blank is-shown ${pop?"animate-pop":""}">${escapeHTML(p.item.a)}</span>`:'<span class="prov-blank">......</span>';stage.classList.add("quiz1-stage"),stage.innerHTML=`
    <div class="card quiz1-card">
      ${quizCardChips("",t.prov_n,p.n)}
      <div class="prov-card quiz1-card__body">${escapeHTML(parts[0]||"")}${blank}${escapeHTML(parts[1]||"")}</div>
      ${p.revealed?typeof reportBtnHtml=="function"?reportBtnHtml("proverbs",p.item.p):"":`<p class="quiz1-hint">${escapeHTML(t.prov_device_hint||"")}</p>`}
    </div>
    ${quizRoundDots(p.n)}
    ${quizWhoGotHtml(p,t,"proverbGot")}
    ${scoring?renderScoreboard(quizPointsBoard(p)):""}
    ${quizPlayBar(t,p.revealed?[t.prov_next,"nextProverb()"]:["👀 "+(t.prov_reveal||""),"revealProverb()"],p.revealed?"":"nextProverb()",scoring,"finishProverbsGame()","setupProverbs()")}`,scoring&&quizSettleBoard(p,"proverbs")}let provJustRevealed=!1;function restoreProverbs(){const p=provState();return p.phase==="over"&&quizScoring(p)?(paintProverb(),!0):p.phase!=="play"||!p.item?!1:(paintProverb(),!0)}onLanguageChange(view=>{view==="play-proverbs"&&paintProverb()});const QUIZ_UI={emoji:{view:"room-emoji",ph:"emoji_guess_ph",hint:"emoji_lobby_hint",key:"ashryQuizCount_emoji"},proverbs:{view:"room-proverbs",ph:"prov_guess_ph",hint:"prov_lobby_hint",key:"ashryQuizCount_proverbs"}},QUIZ_COUNT_CHOICES=[5,10,15,20],quiz={clock:null,clockKey:null};function quizCount(game){try{const n=Number(localStorage.getItem(QUIZ_UI[game].key));return QUIZ_COUNT_CHOICES.indexOf(n)!==-1?n:10}catch(e){return 10}}function setQuizCount(game,n){try{localStorage.setItem(QUIZ_UI[game].key,String(n))}catch(e){}const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state),haptic("light")}function quizCardHtml(game,card,big){if(game==="emoji")return`<div class="emoji-card ${big?"emoji-card--big":""}">
      <div class="emoji-card__e">${escapeHTML(card.e||"")}</div>
      ${card.c?`<span class="badge badge--accent">${escapeHTML(card.c)}</span>`:""}
    </div>`;const parts=String(card.p||"").split("___");return`<div class="prov-card ${big?"prov-card--big":""}">${escapeHTML(parts[0]||"")}<span class="prov-blank">......</span>${escapeHTML(parts[1]||"")}</div>`}function quizFeedHtml(s,t){const rows=(s.feed||[]).slice(-8).reverse();return rows.length?rows.map(f=>`<div class="quiz-feed__row ${f.right?"is-right":""}">${f.right?"✅ ":f.close?"🔥 ":"❌ "}<b>${escapeHTML(f.name)}</b>${f.right?"":": "+escapeHTML(f.text||"")}${!f.right&&f.close?` <span class="tx-warning">${escapeHTML(t.draw_close||"")}</span>`:""}</div>`).join(""):""}function armQuizClock(endsAt){const paint=()=>{const el=document.getElementById("quiz-clock");el&&(el.textContent=String(Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3))))};paint(),!(quiz.clockKey===endsAt&&quiz.clock&&quiz.clock.isRunning())&&(stopQuizClock(),quiz.clockKey=endsAt,quiz.clock=createClock({seconds:Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3)),onTick:paint,onEnd:()=>{quiz.clock=null;const close=()=>{const st=Room.state;!st||st.game!=="emoji"&&st.game!=="proverbs"||st.shared.phase!=="answering"||st.shared.endsAt!==endsAt||Room.act("closeQuestion").catch(()=>{})};Room.isHost?setTimeout(close,2e3):setTimeout(close,3e3)}}))}function stopQuizClock(){quiz.clock&&quiz.clock.stop(),quiz.clock=null,quiz.clockKey=null}onRoomClocksReset(stopQuizClock);async function quizSend(){const input=document.getElementById("quiz-input"),text=(input&&input.value||"").trim();if(!text)return;input.value="";const st=Room.state&&Room.state.shared;await roomAct("guess",st&&typeof st.qIndex=="number"?{text,qIndex:st.qIndex}:{text})}function quizGame(game){const ui=QUIZ_UI[game];return{lobbyOptions(state){const t=TRANSLATIONS[appState.lang];if(!state.youAreHost)return`<p class="field__hint" style="text-align:center">${escapeHTML(t[ui.hint]||"")}</p>`;const cur=quizCount(game);return`
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
          <div id="quiz-feed" class="quiz-feed"></div>
          ${state.youAreHost?`<button class="btn btn--ghost btn--sm" style="margin-top: var(--sp-3)" onclick="roomAct('closeQuestion')">${escapeHTML(t.quiz_close||"")}</button>`:""}
          ${renderRoomPlayerStrip(state)}`,"quiz|"+s.qIndex);const feed=document.getElementById("quiz-feed");feed&&(feed.innerHTML=quizFeedHtml(s,t)),armQuizClock(s.endsAt),refreshRoomPlayerStrip(el,state);return}if(stopQuizClock(),s.phase==="results"){const gotIt=(s.order||[]).indexOf(Room.me)!==-1,fresh2=renderRoomFrame(el,["quiz-res",s.qIndex,state.youAreHost,appState.lang].join("|"),()=>`
          ${head.replace('id="quiz-clock"',"hidden")}
          <div class="card ${gotIt?"card--accent":""}" style="text-align:center">
            ${quizCardHtml(game,s.card)}
            <div class="eyebrow" style="margin-top: var(--sp-3)">${escapeHTML(t.quiz_answer||"")}</div>
            <div class="metric metric--md metric--accent">${escapeHTML(s.answer||"")}</div>
          </div>
          ${(s.order||[]).length?`<div class="card card--tight">${(s.order||[]).map((pid,i)=>`<div class="status-row"><div class="status-row__body"><div class="status-row__name">${["🥇","🥈","🥉"][i]||"✅"} ${escapeHTML((state.players.find(p=>p.id===pid)||{}).name||"")}</div><div class="tx-success"><b>+${(s.gained||{})[pid]||0}</b></div></div></div>`).join("")}</div>`:`<div class="waiting-note">${escapeHTML(t.quiz_nobody||"")}</div>`}
          ${!s.retry&&(s.answers||[]).some(a=>!a.right)?`<div class="quiz-feed">${(s.answers||[]).filter(a=>!a.right).map(a=>`<div class="quiz-feed__row">❌ <b>${escapeHTML(a.name)}</b>: ${escapeHTML(a.text||"")}</div>`).join("")}</div>`:""}
          ${renderScoreboard(s.board)}
          ${roomMoveOnHtml(state,`<button class="btn btn--primary btn--lg" onclick="roomAct('nextQuestion')">${escapeHTML(s.qIndex+1>=s.total?t.quiz_last||"":t.quiz_next||"")}</button>`,`<div class="waiting-note">${t.room_wait_host}</div>`)}
          ${renderRoomPlayerStrip(state)}`);if(fresh2&&gotIt&&playSound("success"),fresh2){const gain=Number((s.gained||{})[Room.me])||0;if(gotIt&&gain>0&&typeof flyPoints=="function"&&motionFirst(["quiz-gain",state.code,s.dealId||"",s.qIndex].join("|"))){const card=el.querySelector(".card--accent"),row=el.querySelector(`[data-pid="${CSS.escape(Room.me)}"]`);card&&row&&flyPoints("+"+gain,card.getBoundingClientRect(),row)}}refreshRoomPlayerStrip(el,state);return}renderRoomFrame(el,["quiz-over",state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card card--accent" style="text-align:center">
          ${renderPodium(state,s.board)||`<div class="metric metric--md">🏆 ${escapeHTML(((s.board||[])[0]||{}).name||"")}</div>`}
        </div>
        ${renderScoreboard(s.board)}
        ${roomShareBtnHtml(state,s.board)}
        ${state.youAreHost?`<div class="btn-stack">
               <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', ${JSON.stringify({lang:contentLang()}).replace(/"/g,"&quot;")})">${t.play_again||""}</button>
               <button class="btn btn--ghost" onclick="roomAct('backToHub')">${t.room_another_game||""}</button>
             </div>`:`<div class="waiting-note">${t.room_wait_host}</div>`}
        ${renderRoomPlayerStrip(state)}`)&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:140,spread:90})),refreshRoomPlayerStrip(el,state)}}}window.EMOJI_QUIZ_ROOM=quizGame("emoji"),ROOM_GAMES.emoji&&ROOM_GAMES.emoji.svRouter||(ROOM_GAMES.emoji=window.EMOJI_QUIZ_ROOM),ROOM_GAMES.proverbs=quizGame("proverbs");function quizTv(game){return{sig:state=>[state.shared.phase,state.shared.qIndex,(state.shared.feed||[]).length,(state.shared.solved||[]).length,(state.shared.tried||[]).length,JSON.stringify(state.shared.scores||{})].join("|"),frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"",top=`<div class="tv-top"><span class="tv-pill">${ltrFrac(s.qIndex+1,s.total)}</span>${s.phase==="answering"?`<span id="quiz-clock" class="tv-pill tv-pill--clock">${s.seconds}</span>`:""}</div>`;if(s.phase==="answering"){const names=id=>(state.players.find(p=>p.id===id)||{}).name||"";return`
          <div class="tv-trivia">${top}
            <div class="tv-center">${quizCardHtml(game,s.card,!0)}</div>
            <div class="tv-note">${escapeHTML(t.quiz_tv_type||"")}</div>
            <div class="tv-strip-inline">${(s.solved||[]).map((id,i)=>`<span class="tv-chip is-done">${["🥇","🥈","🥉"][i]||"✅"} ${escapeHTML(names(id))}</span>`).join("")}</div>
            <div class="tv-clues">${(s.feed||[]).filter(f=>!f.right).slice(-6).map(f=>`<span class="tv-clue">${escapeHTML(f.name)}: ${escapeHTML(f.text||"")}</span>`).join("")}</div>
            ${host(tvBtn(t.quiz_close,"roomAct('closeQuestion')","ghost"))}
          </div>`}return s.phase==="results"?`
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
        </div>`},after(state,rebuilt){const s=state.shared;s.phase==="answering"?armQuizClock(s.endsAt):stopQuizClock(),rebuilt&&s.phase==="gameover"&&typeof confetti=="function"&&confetti({particleCount:180,spread:100,origin:{y:.6}})}}}window.EMOJI_QUIZ_TV=quizTv("emoji"),TV_GAMES.emoji&&TV_GAMES.emoji.svRouter||(TV_GAMES.emoji=window.EMOJI_QUIZ_TV),TV_GAMES.proverbs=quizTv("proverbs");