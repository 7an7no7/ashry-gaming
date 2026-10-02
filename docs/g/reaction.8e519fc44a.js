const RX_TEXT={ar:{reaction_wait:"استنى...",reaction_tap:"دوس!",reaction_too_soon:"بدري أوي! ❌",reaction_winner:"كسبت! 🏆",reaction_ms:"مللي ثانية",rx_fake_word:"استنى!",rx_fooled:"اتضحك عليك! 😜",rx_tie:"تعادل! 🤝",rx_again_tap:"دوس عشان تلعبوا تاني 🔄",rx_lobby_hint:"كل الموبايلات والتلفزيون يخضرّوا في نفس اللحظة. ٥ جولات: أسرع تلاتة كل جولة ياخدوا ٣ و٢ و١، واللي يدوس قبل الخضرا ✖.",rx_wait_sub:"لما تخضرّ دوس!",rx_early:"بدري! ✖",rx_no_tap:"ماداسش",rx_your_time:"وقتك",rx_round_of:"الجولة",rx_round_rows:"مين داس الأول؟",rx_tapped:"داسوا: {n} من {m}",rx_next_in:"الجولة الجاية بعد {n}…",rx_next_now:"الجولة الجاية دلوقتي",rx_watching:"بتتفرّج: هتلعب في اللعبة الجاية",rx_points:"النقط",rx_play_again:"العب تاني",rx_winner:"{name} أسرع إيد!",rx_tv_tap:"دوس على موبايلك!"},en:{reaction_wait:"Wait...",reaction_tap:"TAP!",reaction_too_soon:"Too Soon! ❌",reaction_winner:"Winner! 🏆",reaction_ms:"ms",rx_fake_word:"Wait!",rx_fooled:"Gotcha! 😜",rx_tie:"TIE! 🤝",rx_again_tap:"Tap to play again 🔄",rx_lobby_hint:"Every phone and the TV turn green at the same moment. 5 rounds: the fastest three each round get 3, 2 and 1, and a tap before the green is ✖.",rx_wait_sub:"Tap when it turns green!",rx_early:"Too soon! ✖",rx_no_tap:"No tap",rx_your_time:"Your time",rx_round_of:"Round",rx_round_rows:"Who tapped first?",rx_tapped:"Tapped: {n} of {m}",rx_next_in:"Next round in {n}…",rx_next_now:"Next round now",rx_watching:"You're watching: you'll play in the next game",rx_points:"Points",rx_play_again:"Play again",rx_winner:"{name} has the fastest hand!",rx_tv_tap:"Tap on your phone!"}},RX_CSS=`
:root { --night-ink: #ffffff; }
.rx-half {
flex: 1; position: relative; overflow: hidden;
display: flex; flex-direction: column; align-items: center; justify-content: center;
padding: var(--sp-4); cursor: pointer;
background: var(--night); color: var(--night-ink);
transition: background-color 80ms linear;
-webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
}
.rx-half--flip { transform: rotate(180deg); }
.rx-half.is-wait, .rx-half.is-bad { background: var(--danger-btn); color: var(--danger-on); }
.rx-half.is-go, .rx-half.is-win { background: var(--success-btn); color: var(--success-on); }
.rx-half.is-fake, .rx-half.is-tie { background: var(--pop); color: var(--pop-on); }
.rx-half.is-idle { background: var(--night); color: var(--night-ink); }
.reaction-divider { flex: none; height: 0.5rem; width: 100%; background: var(--night); }
#view-play-reaction { background: var(--night); }
.rx-msg { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--sp-3); text-align: center; width: 100%; }
.rx-big { font-family: var(--font-display); font-weight: 900; font-size: clamp(2.25rem, 11vmin, 4.5rem); line-height: 1.1; overflow-wrap: anywhere; }
.rx-sub { font-weight: 800; font-size: var(--fs-h2); opacity: 0.9; }
.rx-again { margin-top: var(--sp-5); font-weight: 700; font-size: var(--fs-h3); opacity: 0.85; }
.rx-again--pulse { animation: rxAgain 1.6s ease-in-out infinite; }
.rx-msg--dim .rx-big { opacity: 0.35; }
.rx-msg--icon .rx-big { font-size: clamp(4.5rem, 24vmin, 9rem); }
.rx-big .metric { color: inherit; }
.rx-msg--pop .rx-big { animation: rxSlam 0.32s cubic-bezier(.2, 1.6, .4, 1) both; }
@keyframes rxSlam { from { opacity: 0; transform: scale(2.2); } to { opacity: 1; transform: none; } }
@keyframes rxAgain { 50% { opacity: 0.45; } }
.rx-burst {
position: absolute; inset-inline-start: 50%; top: 50%; width: 120%; aspect-ratio: 1; margin-inline-start: -60%; translate: 0 -50%;
border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--success-on) 35%, transparent) 0 30%, transparent 62%);
opacity: 0; pointer-events: none;
}
.rx-burst-clip { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; }
.rx-pad--go .rx-burst { animation: rxBurst 0.55s ease-out both; }
@keyframes rxBurst { from { opacity: 1; transform: scale(0.15); } to { opacity: 0; transform: scale(1.4); } }
.rx-room { display: flex; flex-direction: column; gap: var(--sp-3); }
.rx-pad {
width: 100%; min-height: 16rem; border: 0; border-radius: var(--r-2xl); font: inherit;
box-shadow: var(--sh-3); touch-action: manipulation;
}
.rx-pad:disabled { cursor: default; }
.rx-pad .rx-big { font-size: clamp(2.25rem, 10vmin, 3.75rem); }
.rx-count { text-align: center; font-weight: 700; color: var(--text-2); font-size: var(--fs-sm); margin: 0; }
.rx-count:empty { display: none; }
.rx-rows .eyebrow { margin-bottom: var(--sp-2); }
.rx-row.is-out { opacity: 0.65; }
.rx-row.is-me .status-row__name { font-weight: 900; }
.rx-rank {
flex: none; min-width: 1.75rem; height: 1.75rem; border-radius: var(--r-full);
display: inline-flex; align-items: center; justify-content: center;
background: var(--accent-soft); color: var(--accent-ink); font-weight: 800; font-size: var(--fs-sm);
}
.rx-ms { color: var(--text-2); font-size: var(--fs-sm); font-weight: 700; white-space: nowrap; }
.rx-row--rise { animation: rxRise 0.45s var(--ease-out) both; animation-delay: var(--at, 0ms); }
@keyframes rxRise { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: none; } }
.rx-over { text-align: center; }
.rx-over__line { font-family: var(--font-display); font-weight: 900; font-size: var(--fs-h1); color: var(--accent-ink); }
@media (orientation: landscape) and (max-height: 500px) {
.rx-pad { min-height: 10rem; }
.rx-pad .rx-big { font-size: 2.25rem; }
}
@media (min-width: 900px) {
.rx-room { max-width: 40rem; margin-inline: auto; width: 100%; }
.rx-pad { min-height: 18rem; }
}
.rx-tv { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(24vmin, 1fr); gap: 3vmin; align-items: center; height: 100%; }
.rx-tv__stage { display: flex; flex-direction: column; gap: 1.5vmin; min-width: 0; }
.rx-tv__side { display: flex; flex-direction: column; gap: 1.5vmin; min-width: 0; }
.rx-pad--tv { cursor: default; }
body.is-tv-view .rx-pad--tv { min-height: 56vh; border-radius: var(--tv-r); }
body.is-tv-view .rx-pad--tv .rx-big { font-size: var(--tv-xl); }
body.is-tv-view .rx-pad--tv .rx-sub { font-size: var(--tv-md); }
`;function rxText(){return Object.assign({},TRANSLATIONS[appState.lang],RX_TEXT[appState.lang==="en"?"en":"ar"])}function rxStyleOn(){if(document.getElementById("rx-style"))return;const st=document.createElement("style");st.id="rx-style",st.textContent=RX_CSS,document.body.appendChild(st)}rxStyleOn();const RXR_GO_MS=2500,RXR_FLOOR_MS=100,RXR_MEDALS=["🥇","🥈","🥉"],rxr={gap:1/0,sent:"",mine:null,timer:null,seen:new Set};function rxrNoteTime(state){state&&typeof state.serverNow=="number"&&typeof state.receivedAt=="number"&&(rxr.gap=Math.min(rxr.gap,state.receivedAt-state.serverNow))}const rxrServerNow=()=>isFinite(rxr.gap)?Date.now()-rxr.gap:Date.now(),rxrTapAt=()=>isFinite(rxr.gap)?Date.now()-rxr.gap:null,rxrT=()=>rxText(),rxrFill=(str,vars)=>String(str||"").replace(/\{(\w+)\}/g,(m,k)=>vars[k]!==void 0?vars[k]:m),rxrOnce=key=>!key||rxr.seen.has(key)?!1:(rxr.seen.size>300&&rxr.seen.clear(),rxr.seen.add(key),!0),rxrRoundKey=state=>roomDealKey(state)+"|"+((state.shared||{}).round||0),rxrNameOf=(state,id)=>((state.players||[]).find(p=>p.id===id)||{}).name||"";function rxrOpts(){return recallOptions("reaction",{fakes:!0})}function rxrSetFakes(on){rememberOptions("reaction",{fakes:!!on});const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state)}function rxrMine(state){const srv=((state.shared||{}).taps||[]).find(x=>x.id===Room.me);return srv?srv.ms===null&&!srv.foul?null:{ms:srv.ms,foul:srv.foul||null,sure:!0}:rxr.mine&&rxr.mine.key===rxrRoundKey(state)?rxr.mine:null}function rxrPadHtml(state,s,o){const L=rxrT(),tv=!!(o&&o.tv),mine=tv?null:rxrMine(state),fake=s.phase==="wait"&&s.fake?s.fake.kind:"";let look,big,sub="",extra="";mine&&mine.foul?(look="bad",big=escapeHTML(mine.foul==="fake"?L.rx_fooled:L.rx_early)):mine?(look="win",big=`<span class="metric" dir="ltr"><span data-rx-ms="${mine.ms}">${mine.ms}</span> ms</span>`,sub=escapeHTML(L.rx_your_time)):s.phase==="go"?(look="go",big=escapeHTML(L.reaction_tap),sub=tv?escapeHTML(L.rx_tv_tap):"",extra="rx-msg--go"):s.phase==="result"?(look="idle",big="⏱",sub=escapeHTML(L.rx_no_tap),extra="rx-msg--icon"):fake==="yellow"?(look="fake",big="⚡",extra="rx-msg--icon"):fake?(look="wait",big=fake==="cat"?"🐱":escapeHTML(L.rx_fake_word),extra=(fake==="cat"?"rx-msg--icon ":"")+(motionOff()?"":"rx-msg--pop")):(look="wait",big=escapeHTML(L.reaction_wait),sub=escapeHTML(L.rx_wait_sub));const inner=`${s.phase==="go"&&look==="go"?'<i class="rx-burst-clip" aria-hidden="true"><i class="rx-burst"></i></i>':""}<div class="rx-msg ${extra}"><div class="rx-big">${big}</div>${sub?`<div class="rx-sub">${sub}</div>`:""}</div>`;if(tv)return`<div class="rx-pad rx-pad--tv rx-half is-${look}" data-rx-pad>${inner}</div>`;const live=(s.phase==="wait"||s.phase==="go")&&!mine;return`<button type="button" class="rx-pad rx-half is-${look}" data-rx-pad ${live?"":"disabled"}
            onpointerdown="rxrTap(event)" onclick="rxrTap(event)" aria-label="${escapeHTML(L.reaction_tap)}">${inner}</button>`}function rxrRowsHtml(state,s){const L=rxrT(),rows=s.rows||[];if(!rows.length)return"";const me=Room.me,rise=motionFirst(["rxr-rows",roomDealKey(state),s.round].join("|")),n=rows.length,html=rows.map((r,i)=>{const out=r.ms===null,rank=r.foul?"✖":out?"—":r.pts&&RXR_MEDALS[i]||String(i+1),what=r.foul==="fake"?L.rx_fooled:r.foul?L.rx_early:out?L.rx_no_tap:"";return`<div class="status-row rx-row ${out?"is-out":""} ${r.id===me?"is-me":""} ${rise?"rx-row--rise":""}" style="--at:${(n-1-i)*140}ms">
      <span class="rx-rank">${rank}</span>
      <div class="status-row__body"><div class="status-row__name">${escapeHTML(r.name||rxrNameOf(state,r.id))}</div></div>
      ${out?`<span class="rx-ms">${escapeHTML(what)}</span>`:`<span class="rx-ms metric" dir="ltr"><span data-rx-ms="${r.ms}">${r.ms}</span> ms</span>`}
      ${r.pts?`<span class="badge badge--accent" dir="ltr">+${r.pts}</span>`:""}
    </div>`}).join("");return`<div class="card card--tight rx-rows" ${rise?`data-reveal-ms="${n*140+300}"`:""}>
    <div class="eyebrow">${escapeHTML(L.rx_round_of)} <span class="metric">${s.round}/${s.rounds||5}</span> · ${escapeHTML(L.rx_round_rows)}</div>${html}</div>`}function rxrOverHtml(state,s){const L=rxrT(),board=s.board||[],top=board[0],line=top&&top.score>0?`<div class="rx-over__line">⚡ ${escapeHTML(rxrFill(L.rx_winner,{name:"⁨"+top.name+"⁩"}))}</div>`:"",podium=renderPodium(state,board);return`<div class="card rx-over">${line}${podium}</div>`}function rxrCountText(state){const s=state.shared||{},roster=(s.roster||[]).filter(id=>(state.players||[]).some(p=>p.id===id));return rxrFill(rxrT().rx_tapped,{n:(s.taps||[]).length,m:roster.length})}ROOM_GAMES.reaction={lateJoin:!0,lobbyOptions(state){if(!state.youAreHost)return"";const L=rxrT(),o=rxrOpts();return`
      <div class="card card--tight">
        <label class="switch-row" for="rxr-fakes">
          <span class="field__label">${escapeHTML(L.rx_fakes)}</span>
          <span class="switch">
            <input type="checkbox" id="rxr-fakes" role="switch" ${o.fakes?"checked":""} onchange="rxrSetFakes(this.checked)">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </label>
        <p class="field__hint" style="text-align:center">${escapeHTML(o.fakes?L.rx_fakes_hint:L.rx_lobby_hint)}</p>
      </div>`},startPayload(){return{fakes:!!rxrOpts().fakes}},render(state){appState.currentView!=="room-reaction"&&setView("room-reaction");const el=document.getElementById("view-room-reaction");if(!el)return;rxrNoteTime(state);const L=rxrT(),s=state.shared||{},me=Room.me,inGame=(s.roster||[]).indexOf(me)!==-1,mine=rxrMine(state),myPts=(s.points||{})[me]||0,sig=["rxr",roomDealKey(state),s.phase,s.round,s.fake?s.fake.kind:"",mine?mine.ms+":"+mine.foul+":"+!!mine.sure:"",(s.rows||[]).map(r=>r.id+":"+r.ms+":"+r.pts).join(","),JSON.stringify(s.board||[]),state.youAreHost,inGame,appState.lang].join("|");renderRoomFrame(el,sig,()=>{const head=`
        <div class="play-head rx-head">
          <span class="badge">${escapeHTML(L.round)} <span class="metric">${s.round||1}/${s.rounds||5}</span></span>
          ${inGame?`<span class="badge badge--accent">${escapeHTML(L.rx_points)} <span class="metric">${myPts}</span></span>`:""}
          ${s.settings&&s.settings.fakes?`<span class="badge">🐱 ${escapeHTML(L.rx_fakes)}</span>`:""}
        </div>`;let main="";s.phase==="gameover"?main=rxrOverHtml(state,s):inGame?main=rxrPadHtml(state,s):main=`${s.phase==="result"?"":rxrPadHtml(state,s,{tv:!0})}<div class="waiting-note">${escapeHTML(L.rx_watching)}</div>`;const count=s.phase==="wait"||s.phase==="go"?`<p class="rx-count" data-rx-count>${escapeHTML(rxrCountText(state))}</p>`:"",next=s.phase==="result"?'<p class="rx-count" data-rx-next></p>':"",host=s.phase==="result"?roomMoveOnHtml(state,roomHostRow([[L.rx_next_now,`roomAct('nextRound', { round: ${Number(s.round)||0} })`,"secondary"]])):s.phase==="gameover"&&state.youAreHost?`<div class="btn-row" style="margin-top:var(--sp-3)"><button class="btn btn--go" onclick="roomAct('playAgain', {})">▶ ${escapeHTML(L.rx_play_again)}</button><button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(L.room_another_game)}</button></div>`:"",share=s.phase==="gameover"&&typeof roomShareBtnHtml=="function"?roomShareBtnHtml(state,s.board):"",rows=s.phase==="result"||s.phase==="gameover"?rxrRowsHtml(state,s):"",board=s.phase==="result"||s.phase==="gameover"?renderScoreboard(s.board,L.rx_points):"";return`<div class="rx-room">${head}${main}${count}${next}${host}${share}${rows}${board}${renderRoomPlayerStrip(state)}</div>`}),refreshRoomPlayerStrip(el,state),rxrAfter(state,el,!1)}};function rxrTap(ev){ev&&ev.cancelable&&ev.preventDefault();const state=Room.state,s=state&&state.shared||{};if(!state||state.game!=="reaction"||s.phase!=="wait"&&s.phase!=="go"||(s.roster||[]).indexOf(Room.me)===-1)return;const key=rxrRoundKey(state);if(rxr.sent===key)return;rxr.sent=key;const at=rxrTapAt();if(haptic("heavy"),s.phase==="go"){const ms=Math.max(RXR_FLOOR_MS,Math.round((at===null?Date.now():at)-(s.greenAt||0)));rxr.mine={key,ms,foul:null}}else rxr.mine={key,ms:null,foul:s.fake||s.fakeSeen?"fake":"early"};roomAct("tap",{round:s.round,at}),ROOM_GAMES.reaction.render(state)}function rxrAfter(state,el,tv){const s=state.shared||{},key=rxrRoundKey(state);rxrNoteTime(state);const pad=el.querySelector("[data-rx-pad]");if(s.phase==="go"&&rxrOnce("go|"+(tv?"tv|":"")+key)){if(!motionOff()&&pad){pad.classList.add("rx-pad--go");const big=pad.querySelector(".rx-msg--go .rx-big");big&&motionBump(big,1.22)}tv||haptic("heavy"),playSound("success")}s.phase==="wait"&&s.fake&&rxrOnce("fake|"+(tv?"tv|":"")+key)&&(tv||!state.screens||!state.screens.some(x=>x.online))&&playSound("tick");const mine=!tv&&rxrMine(state);if(mine&&mine.sure&&!mine.foul&&rxrOnce("mine|"+key)&&!motionOff()){const n=pad&&pad.querySelector("[data-rx-ms]");n&&countUp(n,0,mine.ms)}if(mine&&mine.sure&&mine.foul&&rxrOnce("foul|"+key)&&(playSound("alarm"),pad&&!motionOff()&&pad.animate&&pad.animate([{transform:"translateX(0)"},{transform:"translateX(-8px)"},{transform:"translateX(8px)"},{transform:"translateX(0)"}],{duration:260})),(s.phase==="result"||s.phase==="gameover")&&rxrOnce("rows|"+(tv?"tv|":"")+key)&&!motionOff()&&el.querySelectorAll(".rx-rows [data-rx-ms]").forEach(n=>countUp(n,0,Number(n.dataset.rxMs)||0)),s.phase==="gameover"&&rxrOnce("over|"+(tv?"tv|":"")+roomDealKey(state))){const top=(s.board||[])[0];top&&top.score>0&&(top.id===Room.me||state.youAreScreen)&&(playFx("tada"),afterReveal(el.querySelector(".rx-over")||el,()=>{typeof confetti=="function"&&confetti({particleCount:140,spread:80,origin:{y:.6}})}))}rxr.timer&&clearInterval(rxr.timer),rxr.timer=null;const paint=()=>{const st=Room.state;if(!st||st.game!=="reaction"){rxrStop();return}const sh=st.shared||{},c=el.querySelector("[data-rx-count]");if(c){const txt=rxrCountText(st);c.textContent!==txt&&(c.textContent=txt)}const n=el.querySelector("[data-rx-next]");if(n&&sh.phase==="result"&&sh.nextAt){const left=Math.max(0,Math.ceil((sh.nextAt-rxrServerNow())/1e3)),txt=rxrFill(rxrT().rx_next_in,{n:left});n.textContent!==txt&&(n.textContent=txt,motionBump(n))}};paint(),s.phase==="result"&&(rxr.timer=setInterval(paint,250))}function rxrStop(){rxr.timer&&clearInterval(rxr.timer),rxr.timer=null}onLeaveScreen(from=>{(from==="room-reaction"||from==="room-tv")&&rxrStop()}),onRoomClocksReset(()=>{rxrStop(),rxr.mine=null});function rxrTvListHtml(state,s){const L=rxrT(),rows=(state.players||[]).filter(p=>(s.roster||[]).indexOf(p.id)!==-1).map(p=>{const tap=(s.taps||[]).find(x=>x.id===p.id),mark=tap?tap.foul?"✖":"✓":"";return`<div class="status-row ${tap&&tap.foul?"is-out":""}"><div class="status-row__body"><div class="status-row__name">${escapeHTML(p.name)}</div></div><span class="rx-ms">${mark}</span>
      <span class="badge">${(s.points||{})[p.id]||0}</span></div>`}).join("");return`<div class="card card--tight rx-rows"><div class="eyebrow">${escapeHTML(L.rx_points)}</div>${rows}</div>`}TV_GAMES.reaction={sig(state){const s=state.shared||{};return["reaction",roomDealKey(state),s.phase,s.round,s.fake?s.fake.kind:"",(s.taps||[]).map(x=>x.id+":"+(x.foul||"")).join(","),(s.rows||[]).map(r=>r.id+":"+r.ms).join(","),JSON.stringify(s.board||[]),state.youAreHost,appState.lang].join("|")},frame(state){const L=rxrT(),s=state.shared||{},head=`<div class="tv-eyebrow tv-center-text">${escapeHTML(L.round)} <span class="metric">${s.round||1}/${s.rounds||5}</span>${s.settings&&s.settings.fakes?" · 🐱 "+escapeHTML(L.rx_fakes):""}</div>`,host=s.phase==="result"?roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(L.rx_next_now,`roomAct('nextRound', { round: ${Number(s.round)||0} })`,"secondary")}</div>`):state.youAreHost&&s.phase==="gameover"?`<div class="tv-actions">${tvBtn("▶ "+L.rx_play_again,"roomAct('playAgain', {})")}${tvBtn(L.room_another_game,"roomAct('backToHub')","ghost")}</div>`:"";if(s.phase==="gameover")return`<div class="rx-tv">
        <div class="rx-tv__stage tv-scale">${head}${rxrOverHtml(state,s)}</div>
        <div class="rx-tv__side tv-scale">${renderScoreboard(s.board,L.rx_points)}${host}</div>
      </div>`;const stage=s.phase==="result"?`${rxrRowsHtml(state,s)}<p class="tv-note" data-rx-next></p>`:`${rxrPadHtml(state,s,{tv:!0})}<p class="tv-note" data-rx-count>${escapeHTML(rxrCountText(state))}</p>`,side=s.phase==="result"?renderScoreboard(s.board,L.rx_points):rxrTvListHtml(state,s);return`<div class="rx-tv">
      <div class="rx-tv__stage ${s.phase==="result"?"tv-scale":""}">${head}${stage}</div>
      <div class="rx-tv__side tv-scale">${side}${host}</div>
    </div>`},after(state){const el=document.getElementById("view-room-tv");el&&rxrAfter(state,el,!0)}};