const trivia={picked:null,clock:null,clockKey:null,fired:!1},TRIVIA_COUNT_KEY="ashryTriviaCount";function triviaCountChoice(){const select=document.getElementById("trivia-count");if(select)return Number(select.value);try{const saved=Number(localStorage.getItem(TRIVIA_COUNT_KEY));return TRIVIA_COUNTS.indexOf(saved)!==-1?saved:10}catch(e){return 10}}function rememberTriviaCount(value){try{localStorage.setItem(TRIVIA_COUNT_KEY,String(value))}catch(e){}}const TRIVIA_ROOM_CATS=["all","egypt","geography","science","sport","film","general"],TRIVIA_CAT_KEY="ashryTriviaCat";function triviaCatChoice(){const select=document.getElementById("trivia-cat");if(select&&TRIVIA_ROOM_CATS.indexOf(select.value)!==-1)return select.value;try{const saved=localStorage.getItem(TRIVIA_CAT_KEY);return TRIVIA_ROOM_CATS.indexOf(saved)!==-1?saved:"all"}catch(e){return"all"}}function rememberTriviaCat(value){try{localStorage.setItem(TRIVIA_CAT_KEY,String(value))}catch(e){}}ROOM_GAMES.trivia={lobbyOptions(state){if(!state.youAreHost)return"";const t=TRANSLATIONS[appState.lang],chosen=triviaCountChoice(),cat=triviaCatChoice(),quiz=typeof packRoomPick=="function"?packRoomPick("triviaRoom"):"";return`
      <div class="card card--tight">
        ${typeof packSourceFieldHtml=="function"?packSourceFieldHtml("triviaRoom",t.qm_src_app||"",t.qm_src_hint_room||""):""}
        ${quiz?"":`
        <label class="field__label" for="trivia-count">${t.trivia_count||""}</label>
        <select id="trivia-count" onchange="rememberTriviaCount(this.value)">
          ${TRIVIA_COUNTS.map(n=>`<option value="${n}" ${n===chosen?"selected":""}>${n}</option>`).join("")}
        </select>
        <label class="field__label" for="trivia-cat">${t.trivia_cat||""}</label>
        <select id="trivia-cat" onchange="rememberTriviaCat(this.value)">
          ${TRIVIA_ROOM_CATS.map(c=>`<option value="${c}" ${c===cat?"selected":""}>${escapeHTML(t["trivia_cat_"+c]||c)}</option>`).join("")}
        </select>`}
        <p class="field__hint" style="text-align:center">${t.trivia_hint||""}</p>
      </div>`+autoNextLobbyHtml(state,"trivia")},startPayload:()=>{const quiz=typeof packRoomPick=="function"?packRoomPick("triviaRoom"):"",out={lang:VOTE_LANG(),count:triviaCountChoice(),cat:triviaCatChoice(),autoNext:autoNextChoice("trivia")};return quiz&&(out.pack=quiz),out},render(state){appState.currentView!=="room-trivia"&&setView("room-trivia");const el=document.getElementById("view-room-trivia");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,iAnswered=(s.answered||[]).indexOf(Room.me)!==-1,sig=["trivia",s.phase,s.qIndex,iAnswered,(s.answered||[]).length,state.youAreHost,appState.lang].join("|"),rebuilt=renderRoomFrame(el,sig,()=>triviaFrame(state,t,iAnswered));rebuilt&&s.phase==="results"&&triviaRevealRun(el,state),rebuilt&&s.phase==="gameover"&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:160,spread:80})),refreshRoomPlayerStrip(el,state),s.phase==="answering"?startTriviaClock(s):stopTriviaClock()}};function triviaFrame(state,t,iAnswered){const s=state.shared,letters=["A","B","C","D"],inRound=(s.roster||[]).indexOf(Room.me)!==-1;if(s.phase==="gameover"){const board=s.board||[],best=board.length?board[0].score:0,champs=board.filter(p=>best>0&&p.score===best).map(p=>escapeHTML(p.name)),podium=renderPodium(state,board);return`
      <div class="card card--accent" style="text-align:center">
        <div class="eyebrow">${t.trivia_champion||""}</div>
        ${podium||`<div class="metric metric--md metric--accent">🏆 ${champs.join(" · ")||"—"}</div>`}
        ${renderAward("⚡",t.title_fastest,s.fastest,podium?AWARD_AFTER_PODIUM_MS:200,s.fastest&&awardFirstTimes(s.fastest.n))}
      </div>
      ${renderScoreboard(board)}
      ${roomShareBtnHtml(state,board)}
      ${state.youAreHost?`<div class="btn-stack">
             <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', { lang: '${VOTE_LANG()}' })">${t.play_again||""}</button>
             <button class="btn btn--ghost" onclick="roomAct('backToHub')">${t.room_another_game||""}</button>
           </div>`:`<div class="waiting-note">${t.room_wait_host||""}</div>`}
      ${renderRoomPlayerStrip(state)}`}const header=`
    <div class="cn-score">
      <span class="cn-score__role">${s.quiz?escapeHTML((s.quiz.emoji||"✍️")+" "+s.quiz.title)+" · ":"🧠 "}${t.trivia_q_of||""} ${ltrFrac(s.qIndex+1,s.totalQuestions)}</span>
      ${s.phase==="answering"?`<span id="trivia-timer" class="badge badge--accent">${s.seconds||""}</span>`:""}
    </div>
    <div class="card" style="text-align:center">
      <div class="prompt-text">${escapeHTML(s.question||"")}</div>
    </div>`;if(s.phase==="answering"){const mine=trivia.picked&&trivia.picked.q===s.qIndex?trivia.picked.choice:null,present=state.players.map(p=>p.id),expected=(s.roster||[]).filter(id=>present.indexOf(id)!==-1).length;return header+`
      <div class="btn-stack">
        ${s.choices.map((c,i)=>`
          <button class="ballot-option trivia-choice trivia-choice--${i} ${mine===i?"is-picked":""}"
                  ${iAnswered||!inRound?"disabled":""} onclick="chooseTriviaAnswer(${i})">
            <span class="trivia-letter">${letters[i]}</span>
            <span class="ballot-option__label">${escapeHTML(c)}</span>
          </button>`).join("")}
      </div>
      <div class="vote-progress">
        <span>${iAnswered?"🔒 "+(t.trivia_locked||""):inRound?"":t.vote_spectating||""}</span>
        <span>${(s.answered||[]).length}/${expected} ${t.trivia_answered||""}</span>
      </div>
      ${state.youAreHost?`
        <div class="btn-stack" style="margin-top: var(--sp-3)">
          <button class="btn btn--ghost btn--sm" onclick="roomAct('closeQuestion')">${t.trivia_close_early||""}</button>
        </div>`:""}
      ${renderRoomPlayerStrip(state)}`}const counts=s.choiceCounts||[],total=Math.max(1,counts.reduce((a,b)=>a+b,0)),myPick=(s.picks||{})[Room.me],gained=(s.gained||{})[Room.me],last=s.qIndex+1>=s.totalQuestions,plan=triviaRevealPlan(state,!1),st=plan.st;let verdict="";return inRound&&(verdict=typeof myPick!="number"?`<span class="tx-muted">${t.trivia_no_answer||""}</span>`:myPick===s.correctAnswer?`<span class="tx-success">🎉 <bdi dir="ltr">+${gained||0}</bdi>${(s.order||[]).indexOf(Room.me)!==-1?" · "+(t.trivia_rank||"#{n}").replace("{n}",(s.order||[]).indexOf(Room.me)+1):""}</span>`:`<span class="tx-danger">${t.trivia_wrong||""}</span>`),header+`
    <div class="result-list">
      ${s.choices.map((c,i)=>{const right=i===s.correctAnswer,wrongPick=myPick===i&&!right,pct=Math.round((counts[i]||0)/total*100);return`
          <div class="result-row trivia-result trivia-result--${i} ${right?"is-correct":""} ${wrongPick?"is-wrong":""}"${st.at(plan.at[i],right?"pop":"in")}>
            <div class="result-row__bar" style="width:${pct}%"></div>
            <div class="result-row__body">
              <span class="result-row__label">${right?"✅":wrongPick?"❌":letters[i]} ${escapeHTML(c)}</span>
              <span class="result-row__count">${st.count(counts[i]||0,plan.at[i]+200)}</span>
            </div>
          </div>`}).join("")}
    </div>
    ${verdict?`<div class="waiting-note"${st.at(plan.rightAt+450,"in")}>${verdict}</div>`:""}
    ${st.board(renderScoreboard(s.board),plan.rightAt+700)}
    <span hidden${st.end(0)}></span>
    ${autoNextSlotHtml(state)}
    ${roomMoveOnHtml(state,`<div class="btn-stack">
           <button class="btn btn--primary btn--lg" onclick="roomAct('nextQuestion', { qIndex: ${Number(s.qIndex)||0} })">${last?t.trivia_final||"":t.next_q_btn||""}</button>
         </div>`,`<div class="waiting-note">${t.room_wait_host||""}</div>`)}
    ${renderRoomPlayerStrip(state)}`}function triviaRevealPlan(state,tv){const s=state.shared,st=stageReveal(["trivia-rev",tv?"tv":"ph",roomDealKey(state),s.qIndex].join("|"),state),at=[];let k=0;(s.choices||[]).forEach((c,i)=>{i!==s.correctAnswer&&(at[i]=350+k++*800)});const rightAt=350+k*800+250;return typeof s.correctAnswer=="number"&&(at[s.correctAnswer]=rightAt),{st,at,rightAt}}function triviaRevealRun(root,state){stageRun(root,state);const plan=triviaRevealPlan(state,!!state.youAreScreen);!root||!root.querySelector("[data-rv]")||((state.shared.choices||[]).forEach((c,i)=>{i!==state.shared.correctAnswer&&stageSound(state,"tick",plan.at[i])}),stageSound(state,"success",plan.rightAt+150))}function chooseTriviaAnswer(choice){const s=Room.state&&Room.state.shared;!s||s.phase!=="answering"||(trivia.picked={q:s.qIndex,choice},document.querySelectorAll("#view-room-trivia .trivia-choice").forEach((b,i)=>{b.disabled=!0,b.classList.toggle("is-picked",i===choice)}),playSound("click"),haptic("light"),Room.act("answer",{choice,qIndex:s.qIndex}).catch(err=>{trivia.picked=null,showToast(err.message||"تعذر الإرسال","error");const el=document.getElementById("view-room-trivia");el&&delete el.dataset.sig,Room.state&&ROOM_GAMES.trivia.render(Room.state)}))}function paintRoomTriviaTimer(endsAt){const left=Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3)),el=document.getElementById("trivia-timer");el&&(el.textContent=left,el.classList.toggle("badge--danger",left<=5),el.classList.toggle("badge--accent",left>5));const big=document.getElementById("tv-trivia-timer");big&&(big.textContent=left,big.classList.toggle("is-low",left<=5)),countdownUrgency(el||big,left)}function startTriviaClock(s){if(paintRoomTriviaTimer(s.endsAt),trivia.clockKey===s.endsAt&&(trivia.clock?trivia.clock.isRunning():trivia.fired))return;stopTriviaClock(),trivia.clockKey=s.endsAt,trivia.fired=!1;const endsAt=s.endsAt;trivia.clock=createClock({seconds:Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3)),onTick:()=>paintRoomTriviaTimer(endsAt),onEnd:()=>{trivia.clock=null,trivia.fired=!0;const close=()=>{const st=Room.state;!st||st.game!=="trivia"||st.shared.phase!=="answering"||st.shared.endsAt!==endsAt||Room.act("closeQuestion").catch(()=>{})};Room.isHost?setTimeout(close,2e3):setTimeout(close,3e3)}})}function stopTriviaClock(){countdownClear(),trivia.clock&&trivia.clock.stop(),trivia.clock=null,trivia.clockKey=null,trivia.fired=!1}onRoomClocksReset(stopTriviaClock);