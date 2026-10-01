const BUZZER_PENALTY_KEY="ashryBuzzerPenalty";function buzzerPenalty(){try{return localStorage.getItem(BUZZER_PENALTY_KEY)==="1"}catch(e){return!1}}function setBuzzerPenalty(on){try{localStorage.setItem(BUZZER_PENALTY_KEY,on?"1":"0")}catch(e){}const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state)}const BZ_SETTLE_MS=150,bzLocal={clockFor:"",settleTimer:null};function bzServerNow(){const mid=Room.clockMid;return mid==null?roomServerNow():Date.now()-mid}function bzTimeClock(state){state.youAreScreen||Room.clockMid!==null||bzLocal.clockFor===state.code||(bzLocal.clockFor=state.code,Room.act("bzClock",{}).catch(()=>{}))}function bzSettled(first){if(!first||!first.arr)return!0;const left=Number(first.arr)+BZ_SETTLE_MS-roomServerNow();return left<=0?!0:(clearTimeout(bzLocal.settleTimer),bzLocal.settleTimer=setTimeout(()=>{Room.state&&Room.state.game==="buzzer"&&appState.currentView==="room-buzzer"&&routeRoomState(Room.state)},Math.min(1e3,left+30)),!1)}ROOM_GAMES.buzzer={lobbyOptions(state){if(!state.youAreHost)return"";const t=TRANSLATIONS[appState.lang];return`
      <div class="card card--tight">
        <label class="switch-row" for="bz-penalty">
          <span class="field__label">${escapeHTML(t.bz_penalty||"")}</span>
          <span class="switch">
            <input type="checkbox" id="bz-penalty" role="switch" ${buzzerPenalty()?"checked":""} onchange="setBuzzerPenalty(this.checked)">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </label>
        <p class="field__hint" style="text-align:center">${escapeHTML(t.bz_lobby_hint||"")}</p>
        ${typeof packSourceFieldHtml=="function"?packSourceFieldHtml("buzzerRoom",t.qm_src_none_bz||"",""):""}
      </div>`},startPayload(){const quiz=typeof packRoomPick=="function"?packRoomPick("buzzerRoom"):"";return quiz?{pack:quiz}:{}},render(state){appState.currentView!=="room-buzzer"&&setView("room-buzzer");const el=document.getElementById("view-room-buzzer");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared||{},buzzes=s.buzzes||[],armed=s.phase==="armed",rank=buzzes.findIndex(b=>b.id===Room.me),first=buzzes[0],out=(s.out||[]).indexOf(Room.me)!==-1;bzTimeClock(state);const settled=rank===-1||bzSettled(first),sig=["bz",s.phase,s.round,buzzes.map(b=>b.id).join(","),out,settled,JSON.stringify(s.scores||{}),state.youAreHost,JSON.stringify(s.last||null),appState.lang,JSON.stringify(s.quiz||null),JSON.stringify((state.you||{}).answer===void 0?null:state.you.answer)].join("|");renderRoomFrame(el,sig,()=>{const head=`
        <div class="play-head">
          <span class="badge">${escapeHTML(t.bz_question||"")} ${s.quiz?ltrFrac(Math.min(s.quiz.n+1,s.quiz.total),s.quiz.total):`<span class="metric">${s.round||1}</span>`}</span>
          <span class="badge ${armed?"badge--success":""}">${armed?"🔔 "+escapeHTML(t.bz_open||""):"🔒 "+escapeHTML(t.bz_locked||"")}</span>
        </div>`;let stage;if(!armed)stage=`<div class="bz-stage"><div class="bz-locked"><span aria-hidden="true">🔒</span><p>${escapeHTML(t.bz_locked_hint||"")}</p></div></div>`;else if(rank===-1&&out)stage=`<div class="bz-stage"><div class="bz-locked"><span aria-hidden="true">❌</span><p>${escapeHTML(t.bz_out_question||"")}</p></div></div>`;else if(rank===-1)stage=`<div class="bz-stage">
          <button type="button" class="bz-button" id="bz-button" onclick="pressBuzzer(this, ${Number(s.round)||1})" aria-label="${escapeHTML(t.bz_press||"")}">
            <span class="bz-button__icon" aria-hidden="true">🔔</span>
            <span class="bz-button__label">${escapeHTML(t.bz_press||"")}</span>
          </button></div>`;else if(!settled)stage=`<div class="bz-stage">
          <div class="bz-rank">
            <span class="bz-rank__medal" aria-hidden="true">🔔</span>
            <span class="bz-rank__n">${escapeHTML(t.bz_pressed||"")}</span>
            <p>${escapeHTML(t.bz_settling||"")}</p>
          </div></div>`;else{const medal=["🥇","🥈","🥉"][rank]||"🔔";stage=`<div class="bz-stage">
          <div class="bz-rank ${rank===0?"is-first":""}">
            <span class="bz-rank__medal" aria-hidden="true">${medal}</span>
            <span class="bz-rank__n">${escapeHTML(t.bz_you_are||"")} <b class="metric">${rank+1}</b></span>
            <p>${escapeHTML(rank===0?t.bz_answer_now||"":t.bz_wait_turn||"")}</p>
          </div></div>`}const last=s.last?`<div class="bz-last ${s.last.ok?"tx-success":"tx-danger"}">${s.last.ok?"✅":"❌"} ${escapeHTML(s.last.name)}</div>${bzUndoHtml(state,t)}`:"",order=`
        <div class="bz-order">
          <div class="eyebrow">${escapeHTML(t.bz_order||"")}</div>
          ${buzzes.length?`<div class="talk-people">${buzzes.slice(0,6).map((b,i)=>roomPersonChip(b.name,i===0?`<span class="bz-order__tag">${escapeHTML(t.bz_answering||"")}</span>`:bzGapHtml(buzzes,i),i===0?"is-first":"")).join("")}</div>`:`<div class="waiting-note">${escapeHTML(armed?t.bz_nobody||"":t.bz_locked_hint||"")}</div>`}
        </div>`,host=state.youAreHost?`
        <div class="view-actions talk__actions bz-bar" role="group" aria-label="${escapeHTML(t.bz_host_controls||"")}">
          <div class="room-bar__pair">
            <button class="btn btn--success btn--lg" onclick="roomAct('correct', { id: '${jsStringAttr(first?first.id:"")}' })" ${first?"":"disabled"}>✓ ${escapeHTML(t.bz_correct||"")}</button>
            <button class="btn btn--danger btn--lg" onclick="roomAct('wrong', { id: '${jsStringAttr(first?first.id:"")}', penalty: buzzerPenalty() })" ${first?"":"disabled"}>✗ ${escapeHTML(t.bz_wrong||"")}${buzzerPenalty()?" (−1)":""}</button>
          </div>
          <div class="talk__pair">
            <button class="btn btn--ghost btn--sm" onclick="roomAct('reset')">🔄 ${escapeHTML(t.bz_reset||"")}</button>
            <button class="btn btn--ghost btn--sm" onclick="roomAct('${armed?"lock":"arm"}')">${armed?"🔒 "+escapeHTML(t.bz_lock_short||""):"🔔 "+escapeHTML(t.bz_arm_short||"")}</button>
            <button class="btn btn--ghost btn--sm" onclick="tvBackToHub()">${escapeHTML(t.room_another_game||"")}</button>
          </div>
        </div>`:"",resetScores=state.youAreHost?`<div class="bz-reset"><button class="btn btn--ghost btn--xs btn--auto" onclick="bzResetScores()">${escapeHTML(t.bz_reset_scores||"")}</button></div>`:"";return head+bzQuizHtml(state,t)+bzQuizHostHtml(state,t)+stage+last+order+renderScoreboard(s.board)+resetScores+renderRoomPlayerStrip(state)+host}),refreshRoomPlayerStrip(el,state)}};function bzResetScores(){const t=TRANSLATIONS[appState.lang]||{};showConfirmModal(t.bz_reset_confirm||"",()=>roomAct("playAgain"))}function bzUndoHtml(state,t,tv){const last=(state.shared||{}).last;if(!state.youAreHost||!last||!last.seq)return"";const call=`roomAct('undoVerdict', { seq: ${Number(last.seq)||0} })`;return tv?tvBtn("↶ "+(t.bz_undo||""),call,"ghost"):`<div class="bz-reset"><button class="btn btn--ghost btn--xs btn--auto" onclick="${call}">↶ ${escapeHTML(t.bz_undo||"")}</button></div>`}function bzGapMs(buzzes,i){const a=buzzes[0]&&Number(buzzes[0].at),b=buzzes[i]&&Number(buzzes[i].at);return a&&b?Math.max(0,b-a):null}function bzGapText(ms){const unit=(TRANSLATIONS[appState.lang]||{}).bz_secs_short||"s";return`<bdi dir="ltr">+${(ms/1e3).toFixed(2)}</bdi>${appState.lang==="ar"?"&nbsp;":""}${escapeHTML(unit)}`}function bzGapHtml(buzzes,i){const ms=bzGapMs(buzzes,i);return ms===null?"":`<span class="badge bz-gap">${bzGapText(ms)}</span>`}function bzFinishHtml(buzzes){if(!buzzes.length||!buzzes[0].at)return"";const shown=buzzes.slice(0,6),span=Math.max(400,...shown.map((b,i)=>bzGapMs(buzzes,i)||0));return`<div class="bz-finish" dir="ltr" aria-hidden="true"><div class="bz-finish__line"></div><div class="bz-finish__track"></div>${shown.map((b,i)=>{const ms=bzGapMs(buzzes,i)||0,x=4+ms/span*88;return`<div class="bz-finish__mark ${i===0?"is-first":""} bz-finish__mark--${i%2?"low":"high"}" style="left:${x.toFixed(1)}%">
        <span class="bz-finish__dot"></span>
        <span class="bz-finish__tag" dir="${appState.lang==="ar"?"rtl":"ltr"}"><bdi>${escapeHTML(b.name)}</bdi>${i?` <small>${bzGapText(ms)}</small>`:""}</span>
      </div>`}).join("")}</div>`}function pressBuzzer(btn,round){const at=Math.round(bzServerNow());if(btn){btn.classList.add("is-pressed"),btn.disabled=!0;const label=btn.querySelector(".bz-button__label"),t=TRANSLATIONS[appState.lang]||{};label&&t.bz_pressed&&(label.textContent=t.bz_pressed)}if(haptic("heavy"),btn&&typeof motionOff=="function"&&!motionOff()){const ring=document.createElement("span");ring.className="bz-ring",btn.appendChild(ring),setTimeout(()=>{ring.isConnected&&ring.remove()},700)}roomAct("buzz",round?{round,at}:{at})}function bzQuizHtml(state,t){const q=(state.shared||{}).quiz;if(!q)return"";if(q.done)return`<div class="card card--tight bz-quiz"><div class="bz-quiz__q">${escapeHTML((t.bz_quiz_done||"").replace("{t}",q.title||""))}</div></div>`;const letters=String(t.qm_letters||"ABCD").split(""),shown=typeof q.answer=="number"?q.answer:null,mine=state.you&&typeof state.you.answer=="number"?state.you.answer:null,right=shown!==null?shown:mine,key=["bzq",roomDealKey(state),q.n,shown].join("|"),fresh=shown!==null&&typeof motionFirst=="function"&&!motionOff()&&motionFirst(key);return`
    <div class="card card--tight bz-quiz">
      <div class="eyebrow">${escapeHTML((q.emoji||"✍️")+" "+(q.title||""))}</div>
      <div class="bz-quiz__q">${escapeHTML(q.q||"")}</div>
      <div class="bz-quiz__grid">
        ${(q.choices||[]).map((c,i)=>`<div class="bz-quiz__ch ${i===right?"is-right":shown!==null?"is-dim":""}${i===shown&&fresh?" is-revealed":""}"><b>${escapeHTML(letters[i]||"")}</b><span>${escapeHTML(c)}</span></div>`).join("")}
      </div>
      ${mine!==null&&shown===null?`<p class="bz-quiz__note">🔒 ${escapeHTML(t.bz_quiz_host_only||"")}</p>`:""}
    </div>`}function bzQuizHostHtml(state,t){const q=(state.shared||{}).quiz;if(!q||!state.youAreHost)return"";if(q.done)return`<div class="btn-row" style="margin-bottom: var(--sp-2)"><button class="btn btn--primary" onclick="roomAct('playAgain')">↺ ${escapeHTML(t.bz_quiz_again||"")}</button></div>`;const shown=typeof q.answer=="number";return`<div class="btn-row" style="margin-bottom: var(--sp-2)">
      ${shown?"":`<button class="btn btn--secondary" onclick="roomAct('quizReveal', { n: ${q.n} })">${escapeHTML(t.bz_quiz_reveal||"")}</button>`}
      <button class="btn ${shown?"btn--primary":"btn--ghost"}" onclick="roomAct('quizNext', { n: ${q.n} })">${escapeHTML(t.bz_quiz_next||"")}</button>
    </div>`}const MCH_OPTS_KEY="chairs",MCH_OPTS_DEFAULT={fake:!1},MCH_COLORS=["#6d28d9","#0ea5a4","#e5383b","#f59e0b","#2563eb","#db2777","#16a34a","#7c3aed","#ea580c","#0891b2","#9333ea","#65a30d"],MCH_BPM_START=104,MCH_BPM_END=150,MCH_BPM_RAMP_MS=16e3,MCH_SIT_MS=3e3,mch={gap:1/0,orbit:null,eq:[],music:null,timer:null,seen:new Set,pressed:""};function mchNoteTime(state){state&&typeof state.serverNow=="number"&&typeof state.receivedAt=="number"&&(mch.gap=Math.min(mch.gap,state.receivedAt-state.serverNow))}const mchServerNow=()=>isFinite(mch.gap)?Date.now()-mch.gap:Date.now(),mchTapAt=()=>isFinite(mch.gap)?Date.now()-mch.gap:null;function mchOpts(){return recallOptions(MCH_OPTS_KEY,MCH_OPTS_DEFAULT)}function mchSetOpt(patch){rememberOptions(MCH_OPTS_KEY,patch);const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state)}const mchOnce=key=>!key||mch.seen.has(key)?!1:(mch.seen.size>300&&mch.seen.clear(),mch.seen.add(key),!0),mchT=()=>TRANSLATIONS[appState.lang],mchFill=(str,vars)=>String(str||"").replace(/\{(\w+)\}/g,(m,k)=>vars[k]!==void 0?vars[k]:m),mchIso=s=>"⁨"+s+"⁩";function mchChairsWord(n){const t=mchT();return n===1?t.mch_chair1:n===2?t.mch_chairs2:n>=3&&n<=10?mchFill(t.mch_chairs_n,{n}):mchFill(t.mch_chairs_11,{n})}function mchIsVoice(state){const screens=(state.screens||[]).filter(x=>x.online).map(x=>x.id).sort();return state.youAreScreen?screens[0]===Room.me:!!state.youAreHost&&!screens.length}const mchColorOf=(s,id)=>MCH_COLORS[Math.max(0,(s.roster||[]).indexOf(id))%MCH_COLORS.length];function mchChipStyle(hex){const lum=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);return((/^#[0-9a-f]{6}$/i.test(hex||"")?lum(hex):.2)+.05)/(lum("#1b1b1f")+.05)>=4.5?`background:${hex};color:#1b1b1f`:`background:color-mix(in srgb, ${hex} 78%, #000);color:#ffffff`}const mchNameOf=(state,id)=>((state.players||[]).find(p=>p.id===id)||{}).name||"",mchInitial=name=>String(name||"").trim().replace(/^ال/,"")[0]||"?";function mchChairSvg(){return'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="7" y="11" width="26" height="24" rx="6" fill="#d89a4a"/><rect x="7" y="11" width="26" height="24" rx="6" fill="none" stroke="#8a4f17" stroke-width="1.5"/><rect x="4" y="4" width="32" height="10" rx="4" fill="#a35f22"/><rect x="11" y="16" width="18" height="14" rx="4" fill="#efc07a" opacity=".7"/></svg>'}function mchRingHtml(state,s,o){const t=mchT(),me=Room.me,chairs=Math.max(0,s.chairs||0),order=(s.order||[]).filter(id=>(state.players||[]).some(p=>p.id===id)),alive=s.alive||[],sits=s.sits||[],music=s.phase==="music",at=(r,deg,w)=>{const a=(deg-90)*Math.PI/180;return`left:${(50+r*Math.cos(a)-w/2).toFixed(2)}%;top:${(50+r*Math.sin(a)-w/2).toFixed(2)}%;width:${w}%;height:${w}%`},CH=14,AV=12;let out='<div class="mch-rug"></div>';for(let k=0;k<chairs;k++){const deg=k*360/chairs;out+=`<div class="mch-chair" style="${at(31,deg,CH)};--rot:${deg.toFixed(0)}deg">${mchChairSvg()}</div>`}const avHtml=(id,extra,style)=>{const name=mchNameOf(state,id);return`<div class="mch-av ${id===me?"is-me":""} ${extra||""}" data-mch-av="${escapeHTML(id)}" style="${style};--c:${mchColorOf(s,id)}" title="${escapeHTML(name)}">
      <span class="mch-av__face">${escapeHTML(mchInitial(name))}</span><span class="mch-av__name">${escapeHTML(name)}</span></div>`};music?(out+='<div class="mch-orbit" data-mch-orbit>',order.forEach((id,i)=>{if(alive.indexOf(id)===-1)return;const deg=i*360/Math.max(1,order.length);out+=`<div class="mch-orbit__seat" style="${at(43,deg,AV)}">${avHtml(id,"","")}</div>`}),out+="</div>"):order.forEach((id,i)=>{const deg=i*360/Math.max(1,order.length),rank=sits.findIndex(x=>x.id===id),sat=rank!==-1&&rank<chairs,isLoser=s.loserId===id;if(alive.indexOf(id)===-1&&!isLoser)return;let style;sat?style=at(31,rank*360/Math.max(1,chairs),AV):style=at(44,deg+180/Math.max(1,order.length),AV);const outNow=isLoser&&s.phase!=="music",walk=outNow&&motionFirst(["mch-out",roomDealKey(state),s.round].join("|"))?" is-walking":"";out+=avHtml(id,(sat?"is-sat":"")+(outNow?" is-out"+walk:""),style)});let mid;if(music)mid=`<div class="mch-eq" data-mch-eq>${"<i></i>".repeat(9)}</div><div class="mch-mid__line">${escapeHTML(t.mch_music_on)}</div>`;else if(s.phase==="sit")mid=`<div class="mch-mid__big">${escapeHTML(t.mch_stopped)}</div><div class="mch-window"><i data-mch-window></i></div>`;else if(s.phase==="result"){const key=s.why==="early"?"mch_out_early":s.why==="late"?"mch_out_late":s.why==="left"?"mch_out_left":"mch_out_last";mid=`<div class="mch-mid__big mch-mid__big--out">${escapeHTML(mchFill(t[key],{name:mchIso(s.loserName||"")}))}</div>
           <div class="mch-mid__line" data-mch-next></div>`}else mid=`<div class="mch-mid__big mch-mid__big--win">🏆 ${escapeHTML(mchFill(t.mch_winner,{name:mchIso(s.winnerName||"")}))}</div>`;return out+=`<div class="mch-mid ${s.phase!=="music"&&motionFirst(["mch-mid",roomDealKey(state),s.round,s.phase].join("|"))?"mch-mid--in":""}">${mid}</div>`,`<div class="mch-ring ${o&&o.tv?"mch-ring--tv":""}" data-mch-ring>${out}</div>`}function mchOrderHtml(state,s){const t=mchT(),sits=s.sits||[];if(!sits.length&&s.phase!=="result")return"";const chairs=s.chairs||0,rows=sits.map((x,i)=>{const out=i>=chairs||x.id===s.loserId;return`<div class="status-row ${out?"is-out":""}">
      <span class="mch-order__n ${i<3&&!out?"is-top":""}">${out?"✕":i+1}</span>
      <div class="status-row__body"><div class="status-row__name">${escapeHTML(x.name||mchNameOf(state,x.id))}</div></div>
      <span class="mch-order__ms metric">${x.ms===null||x.ms===void 0?"—":x.ms+" ms"}</span></div>`}).join(""),early=s.phase==="result"&&s.why==="early"?`<div class="status-row is-out"><span class="mch-order__n">✕</span><div class="status-row__body"><div class="status-row__name">${escapeHTML(s.loserName||"")}</div></div><span class="mch-order__ms">${escapeHTML(t.mch_early_short)}</span></div>`:"";return`<div class="card card--tight mch-order"><div class="eyebrow">${escapeHTML(t.mch_order)}</div>${rows}${early}</div>`}function mchRingListHtml(state,s){const t=mchT(),alive=s.alive||[],rows=(state.players||[]).filter(p=>(s.roster||[]).indexOf(p.id)!==-1).map(p=>{const out=alive.indexOf(p.id)===-1;return`<div class="status-row ${out?"is-out":""}"><span class="mch-order__n" style="${out?"background:var(--surface-3);color:var(--text-2)":mchChipStyle(mchColorOf(s,p.id))}">${escapeHTML(mchInitial(p.name))}</span><div class="status-row__body"><div class="status-row__name">${escapeHTML(p.name)}</div></div>${out?'<span class="mch-order__ms">✕</span>':""}</div>`}).join("");return`<div class="card card--tight mch-order"><div class="eyebrow">${escapeHTML(t.mch_in_ring)}</div>${rows}</div>`}function mchOverHtml(state,s){const t=mchT(),places=s.places||[],medals=["🥇","🥈","🥉"],rise=motionFirst(["mch-over",roomDealKey(state)].join("|")),list=places.map((p,i)=>`<div class="mch-place ${rise?"mch-place--rise":""}" style="--at:${i*140}ms"><span class="mch-place__medal">${medals[i]||i+1}</span><span class="mch-place__name">${escapeHTML(p.name)}</span></div>`).join("");return`<div class="card mch-over ${rise?"mch-over--rise":""}" data-reveal-ms="${rise?700+places.length*140:0}">
      <div class="eyebrow">${escapeHTML(t.mch_places)}</div>${list}</div>
    ${renderScoreboard(s.board,t.mch_wins)}`}ROOM_GAMES.chairs={lateJoin:!0,lobbyOptions(state){if(!state.youAreHost)return"";const t=mchT(),o=mchOpts();return`
      <div class="card card--tight">
        <label class="switch-row" for="mch-fake">
          <span class="field__label">${escapeHTML(t.mch_fake)}</span>
          <span class="switch">
            <input type="checkbox" id="mch-fake" role="switch" ${o.fake?"checked":""} onchange="mchSetOpt({ fake: this.checked })">
            <span class="switch__track" aria-hidden="true"></span>
          </span>
        </label>
        <p class="field__hint" style="text-align:center">${escapeHTML(o.fake?t.mch_fake_hint:t.mch_lobby_hint)}</p>
      </div>`},startPayload(){return{fake:!!mchOpts().fake}},render(state){appState.currentView!=="room-chairs"&&setView("room-chairs");const el=document.getElementById("view-room-chairs");if(!el)return;mchNoteTime(state);const t=mchT(),s=state.shared||{},me=Room.me,alive=s.alive||[],inRing=alive.indexOf(me)!==-1,sits=s.sits||[],myRank=sits.findIndex(x=>x.id===me),voice=mchIsVoice(state),screenOn=(state.screens||[]).some(x=>x.online),sig=["mch",roomDealKey(state),s.phase,s.round,s.chairs,(s.order||[]).join(","),alive.join(","),sits.map(x=>x.id+":"+x.ms).join(","),s.loserId,s.why,s.winnerId,JSON.stringify(s.wins||{}),state.youAreHost,voice,screenOn,inRing,appState.lang].join("|"),before=mchRects(el);renderRoomFrame(el,sig,()=>{const head=`
        <div class="play-head mch-head">
          <span class="badge">${escapeHTML(t.round)} <span class="metric">${s.round||1}</span></span>
          <span class="badge badge--accent">🪑 ${escapeHTML(mchChairsWord(s.chairs||0))}</span>
          <span class="badge">${escapeHTML(mchFill(t.mch_alive,{n:alive.length}))}</span>
        </div>`;let bar;if(s.phase==="gameover")bar="";else if(!inRing)bar=`<div class="waiting-note">${escapeHTML((s.outOrder||[]).indexOf(me)!==-1?t.mch_you_out:t.mch_watching)}</div>`;else if(s.phase==="music")bar=`<button type="button" class="mch-btn is-wait" onclick="mchSit(this)">
                 <span class="mch-btn__label">${escapeHTML(t.mch_wait_btn)}</span><span class="mch-btn__sub">${escapeHTML(t.mch_music_on)}</span></button>
               <p class="mch-hint">${escapeHTML(t.mch_tap_hint)}</p>
               <p class="mch-hint mch-hint--voice">${escapeHTML(voice?t.mch_voice_you:screenOn?t.mch_voice_tv:t.mch_voice_host)}</p>`;else if(s.phase==="sit"){const pressed=mch.pressed===roomDealKey(state)+"|"+s.round;bar=myRank!==-1||pressed?`<div class="mch-sat ${myRank===0?"is-first":""}"><span class="mch-sat__n">${myRank===-1?"…":escapeHTML(mchFill(t.mch_sat,{n:myRank+1}))}</span><span class="mch-sat__ms metric">${myRank===-1?"":sits[myRank].ms+" ms"}</span></div>`:`<button type="button" class="mch-btn is-go mch-btn--pop" onpointerdown="mchSit(this)" onclick="mchSit(this)"><span class="mch-btn__label">${escapeHTML(t.mch_sit)}</span></button>`}else bar=s.loserId===me?`<div class="mch-sat is-out"><span class="mch-sat__n">${escapeHTML(t.mch_you_out)}</span></div>`:`<div class="mch-sat"><span class="mch-sat__n">${escapeHTML(myRank===-1?t.mch_safe:mchFill(t.mch_sat,{n:myRank+1}))}</span></div>`;const host=s.phase==="result"?roomMoveOnHtml(state,roomHostRow([[t.mch_next_now,"roomAct('nextRound', {})","secondary"]])):state.youAreHost?s.phase==="result"?"":s.phase==="gameover"?`<div class="btn-row" style="margin-top:var(--sp-3)"><button class="btn btn--go" onclick="roomAct('playAgain', {})">▶ ${escapeHTML(t.mch_play_again)}</button><button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(t.room_another_game)}</button></div>`:"":"",share=s.phase==="gameover"&&typeof roomShareBtnHtml=="function"?roomShareBtnHtml(state,s.board):"",over=s.phase==="gameover"?mchOverHtml(state,s):"";return`<div class="mch">${head}${mchRingHtml(state,s)}<div class="mch-bar">${bar}</div>${over}${host}${share}${mchOrderHtml(state,s)}${renderRoomPlayerStrip(state)}</div>`}),refreshRoomPlayerStrip(el,state),mchAfter(state,el,before)}};function mchSit(btn){const state=Room.state,s=state&&state.shared||{},once=roomDealKey(state)+"|"+s.round+"|"+s.phase;mch.sent!==once&&(mch.sent=once,btn&&(btn.classList.add("is-pressed"),btn.disabled=!0),haptic("heavy"),s.phase==="sit"&&(mch.pressed=roomDealKey(state)+"|"+s.round),roomAct("sit",{round:s.round,at:mchTapAt()}))}function mchRects(el){const map={};return!el||motionOff()||el.querySelectorAll("[data-mch-av]").forEach(a=>{const r=a.getBoundingClientRect();r.width&&(map[a.dataset.mchAv]=r)}),map}function mchAfter(state,el,before){const s=state.shared||{},key=roomDealKey(state)+"|"+s.round;mchNoteTime(state);const orbitEl=el.querySelector("[data-mch-orbit]");if(orbitEl&&!orbitEl.dataset.spun&&(orbitEl.dataset.spun="1",mchStopOrbit(),!motionOff()&&orbitEl.animate)){const lap=60/MCH_BPM_START*8*1e3;mch.orbit=orbitEl.animate([{transform:"rotate(0deg)"},{transform:"rotate(360deg)"}],{duration:lap,iterations:1/0}),orbitEl.querySelectorAll(".mch-av").forEach(a=>{mch.eq.push(a.animate([{transform:"rotate(0deg)"},{transform:"rotate(-360deg)"}],{duration:lap,iterations:1/0}))}),el.querySelectorAll("[data-mch-eq] > i").forEach((bar,i)=>{const beat=60/MCH_BPM_START*1e3,hi=.45+i*7%5*.12;mch.eq.push(bar.animate([{transform:"scaleY(0.25)"},{transform:`scaleY(${hi})`},{transform:"scaleY(0.3)"},{transform:"scaleY(1)"},{transform:"scaleY(0.25)"}],{duration:beat*(i%2?2:1),iterations:1/0,delay:-i*90,easing:"ease-in-out"}))})}if(orbitEl||mchStopOrbit(),before&&Object.keys(before).length&&mchFlip(el,before,s),s.phase==="sit"&&mchOnce("stop|"+key)){haptic("heavy");const ring=el.querySelector("[data-mch-ring]");ring&&!motionOff()&&(ring.classList.add("is-flash"),setTimeout(()=>ring.classList.remove("is-flash"),700)),mchIsVoice(state)&&mchSound("stop")}if((s.sits||[]).forEach((x,i)=>{mchOnce("sat|"+key+"|"+x.id)&&mchIsVoice(state)&&s.phase==="sit"&&mchSound("sat",i)}),s.phase==="result"&&mchOnce("out|"+key)&&(mchIsVoice(state)&&mchSound(s.why==="early"?"early":"out"),s.loserId===Room.me&&haptic("medium")),s.phase==="gameover"&&mchOnce("over|"+roomDealKey(state))&&(mchIsVoice(state)&&mchSound("win"),s.winnerId&&(s.winnerId===Room.me||state.youAreScreen))){const card=el.querySelector(".mch-over")||el;afterReveal(card,()=>{typeof confetti=="function"&&confetti({particleCount:140,spread:80,origin:{y:.6}})})}s.phase==="music"&&mchIsVoice(state)?mchMusicSync(state,s):mchMusicStop(),mch.timer&&clearInterval(mch.timer),mch.timer=null;const paint=()=>{const st=Room.state;if(!st||st.game!=="chairs"){mchStopAll();return}const sh=st.shared||{};if(mch.lastRects=mchRects(el),sh.phase==="music"){const paused=!!sh.pause&&mchServerNow()<sh.pause.until,rate=paused?0:mchTempo(sh)/MCH_BPM_START;mch.orbit&&(mch.orbit.playbackRate=rate),mch.eq.forEach(a=>{a.playbackRate=rate}),mch.music&&(mch.music.paused=paused)}else if(sh.phase==="sit"){const bar=el.querySelector("[data-mch-window]");bar&&(bar.style.transform="scaleX("+Math.max(0,1-(mchServerNow()-(sh.stopAt||0))/MCH_SIT_MS).toFixed(3)+")")}else if(sh.phase==="result"){const n=el.querySelector("[data-mch-next]");if(n&&sh.nextAt){const left=Math.max(0,Math.ceil((sh.nextAt-mchServerNow())/1e3)),txt=mchFill(mchT().mch_next_in,{n:left});n.textContent!==txt&&(n.textContent=txt,typeof motionBump=="function"&&motionBump(n))}}};paint(),mch.lastRects=mchRects(el),(s.phase==="music"||s.phase==="sit"||s.phase==="result")&&(mch.timer=setInterval(paint,s.phase==="sit"?60:250))}function mchTempo(s){const elapsed=Math.max(0,mchServerNow()-(s.startAt||mchServerNow()));return MCH_BPM_START+(MCH_BPM_END-MCH_BPM_START)*Math.min(1,elapsed/MCH_BPM_RAMP_MS)}function mchFlip(el,before,s){if(motionOff())return;let k=0;el.querySelectorAll("[data-mch-av]").forEach(a=>{const old=before[a.dataset.mchAv];if(!old||!a.animate)return;const now=a.getBoundingClientRect(),dx=old.left-now.left,dy=old.top-now.top;if(Math.abs(dx)<2&&Math.abs(dy)<2)return;const hop=a.classList.contains("is-sat")?-Math.max(18,now.height*.6):-8;a.animate([{transform:`translate(${dx}px, ${dy}px) scale(1)`},{transform:`translate(${dx/2}px, ${dy/2+hop}px) scale(1.18)`,offset:.55},{transform:"translate(0, 0) scale(1)"}],{duration:520,delay:k*70,easing:"cubic-bezier(.2,.8,.2,1)",fill:"backwards"}),k++})}function mchStopOrbit(){if(mch.orbit)try{mch.orbit.cancel()}catch(e){}mch.orbit=null,mch.eq.forEach(a=>{try{a.cancel()}catch(e){}}),mch.eq=[]}function mchStopAll(){mchStopOrbit(),mchMusicStop(),mch.timer&&clearInterval(mch.timer),mch.timer=null}onLeaveScreen(from=>{(from==="room-chairs"||from==="room-tv")&&mchStopAll()}),onRoomClocksReset(()=>mchStopAll());const MCH_MAQSUM=["D","T","","T","D","","T",""],MCH_RIFF=[293.66,0,369.99,392,440,0,392,369.99,311.13,0,293.66,0,440,392,369.99,0,293.66,0,369.99,392,523.25,0,466.16,440,392,0,369.99,0,311.13,293.66,0,0];function mchMusicSync(state,s){const key=roomDealKey(state)+"|"+s.round;if(mch.music&&mch.music.key===key)return;mchMusicStop();const ctx0=fxCtx();if(!ctx0)return;const m={key,step:0,ctx:ctx0,nextT:ctx0.currentTime+.08,paused:!1,timer:null,s};mch.music=m;const tick=()=>{if(mch.music!==m)return;const ctx=fxCtx();if(!ctx||(ctx!==m.ctx&&(m.ctx=ctx,m.nextT=ctx.currentTime+.05),ctx.state!=="running"))return;if(m.paused){m.nextT=ctx.currentTime+.06;return}const sh=Room.state&&Room.state.shared||s;for(;m.nextT<ctx.currentTime+.28;){const stepDur=60/mchTempo(sh)/2;mchPlayStep(m.step,m.nextT,stepDur),m.step++,m.nextT+=stepDur}};m.timer=setInterval(tick,80),tick()}function mchMusicStop(){mch.music&&mch.music.timer&&clearInterval(mch.music.timer),mch.music=null}function mchPlayStep(step,at,dur){const hit=MCH_MAQSUM[step%8];hit==="D"?(fxTone("sine",[[0,150],[.09,55]],[[0,.5],[.02,.42],[.22,.001]],at),fxNoise("lowpass",500,.8,[[0,.35],[.06,.001]],at)):hit==="T"&&(fxNoise("highpass",2600,1.2,[[0,.22],[.045,.001]],at),fxTone("triangle",[[0,900],[.03,700]],[[0,.08],[.05,.001]],at)),step%2===0&&fxNoise("highpass",6e3,.8,[[0,.06],[.03,.001]],at+dur);const note=MCH_RIFF[step%MCH_RIFF.length];if(note){const len=Math.min(.3,dur*1.7);fxTone("square",[[0,note]],[[0,1e-4],[.012,.075],[len*.7,.045],[len,1e-4]],at,4),fxTone("triangle",[[0,note/2]],[[0,1e-4],[.01,.06],[len,1e-4]],at)}hit==="D"&&fxTone("sine",[[0,73.42]],[[0,1e-4],[.01,.18],[dur*1.6,1e-4]],at)}function mchSound(kind,i){try{const at=fxCtx().currentTime+.01;if(kind==="stop")fxNoise("bandpass",1800,2.5,[[0,.4],[.16,.001]],at),fxTone("sawtooth",[[0,320],[.3,70]],[[0,.18],[.3,.001]],at);else if(kind==="sat"){const hz=660-Math.min(6,i||0)*60;fxTone("sine",[[0,hz],[.07,hz*1.5]],[[0,.2],[.14,.001]],at)}else kind==="out"?playFx("sad"):kind==="early"?playFx("fail"):kind==="win"&&playFx("tada")}catch(e){}}TV_GAMES.chairs={sig(state){const s=state.shared||{};return["chairs",roomDealKey(state),s.phase,s.round,s.chairs,(s.order||[]).join(","),(s.alive||[]).join(","),(s.sits||[]).map(x=>x.id+":"+x.ms).join(","),s.loserId,s.why,s.winnerId,JSON.stringify(s.wins||{}),state.youAreHost,appState.lang].join("|")},frame(state,t){const s=state.shared||{},alive=s.alive||[],head=`<div class="tv-eyebrow tv-center-text">${escapeHTML(t.round)} ${s.round||1} · ${escapeHTML(mchChairsWord(s.chairs||0))} · ${escapeHTML(mchFill(t.mch_alive,{n:alive.length}))}</div>`,host=s.phase==="result"?roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.mch_next_now,"roomAct('nextRound', {})","secondary")}</div>`):state.youAreHost?s.phase==="result"?"":s.phase==="gameover"?`<div class="tv-actions">${tvBtn("▶ "+t.mch_play_again,"roomAct('playAgain', {})")}${tvBtn(t.room_another_game,"roomAct('backToHub')","ghost")}</div>`:"":"",side=s.phase==="gameover"?mchOverHtml(state,s):mchOrderHtml(state,s)||mchRingListHtml(state,s),hint=s.phase==="music"?`<div class="tv-note">${escapeHTML(t.mch_tap_hint)}</div>`:"";return`<div class="mch-tv">
      <div class="mch-tv__stage">${head}${mchRingHtml(state,s,{tv:!0})}${hint}</div>
      <div class="mch-tv__side tv-scale">${side}${host}</div>
    </div>`},after(state,rebuilt){const el=document.getElementById("view-room-tv");el&&mchAfter(state,el,mch.lastRects||null)}},ROOM_GAMES.twotruths={lobbyOptions(state){const t=TRANSLATIONS[appState.lang];return`<p class="field__hint" style="text-align:center">${escapeHTML(t.tt_lobby_hint||"")}</p>`+autoNextLobbyHtml(state,"twotruths")},startPayload(){return{autoNext:autoNextChoice("twotruths")}},render(state){appState.currentView!=="room-twotruths"&&setView("room-twotruths");const el=document.getElementById("view-room-twotruths");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,mine=s.submitted&&s.submitted.indexOf(Room.me)!==-1,inRound=(s.roster||[]).indexOf(Room.me)!==-1;if(s.phase==="writing"){const sig=["tt-write",mine,inRound,state.youAreHost,appState.lang].join("|");renderRoomFrame(el,sig,()=>mine||!inRound?`
        <div class="card" style="text-align:center">
          <div class="metric metric--md">✍️</div>
          <p class="sheet__subtitle">${escapeHTML(inRound?t.tt_wait_others||"":t.tt_spectating||t.vote_spectating||"")}</p>
          <div id="tt-progress" class="vote-progress"></div>
        </div>
        ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="roomAct('closeWriting')">${escapeHTML(t.tt_start_anyway||"")}</button></div>`)}
        ${renderRoomPlayerStrip(state)}`:`
        <div class="card">
          <div class="card__title">${escapeHTML(t.tt_write_title||"")}</div>
          <p class="card__subtitle">${escapeHTML(t.tt_write_hint||"")}</p>
          ${[0,1,2].map(i=>`
            <div class="field">
              <label class="field__label" for="tt-s${i}">${escapeHTML(t.tt_statement||"")} ${i+1}</label>
              <div class="tt-row">
                <input type="text" id="tt-s${i}" maxlength="80" autocomplete="off" placeholder="${escapeHTML(t.tt_placeholder||"")}">
                <button type="button" class="tt-lie ${i===ttLie?"is-on":""}" data-i="${i}" onclick="ttPickLie(${i})" aria-pressed="${i===ttLie}">${escapeHTML(t.tt_this_is_lie||"")}</button>
              </div>
            </div>`).join("")}
          <button class="btn btn--primary btn--lg" onclick="ttSubmit()">${escapeHTML(t.send||"")}</button>
        </div>
        ${renderRoomPlayerStrip(state)}`,"tt-write");const prog=document.getElementById("tt-progress");prog&&(prog.innerHTML=`<span>${escapeHTML(t.tt_written||"")}: ${ltrFrac((s.submitted||[]).length,(s.roster||[]).length)}</span>`),refreshRoomPlayerStrip(el,state);return}if(s.phase==="voting"){const subject=s.subjectId===Room.me,v=s.vote||{};renderRoomFrame(el,["tt-vote",s.turn,subject,(v.voted||[]).length,state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card card--accent" style="text-align:center">
          <div class="eyebrow">${escapeHTML(t.tt_turn_of||"")} · ${ltrFrac(s.turn+1,(s.order||[]).length)}</div>
          <div class="metric metric--md">${escapeHTML(s.subjectName||"")}</div>
          <p class="sheet__subtitle">${escapeHTML(subject?t.tt_they_vote_you||"":t.tt_pick_lie||"")}</p>
        </div>
        ${subject?`<div class="card card--tight">${(s.items||[]).map((x,i)=>`<div class="tt-item"><span class="tt-item__n">${i+1}</span><span>${escapeHTML(x)}</span></div>`).join("")}</div>${renderVoteProgress(state)}`:`<div class="card card--tight">${renderBallot(state)}</div>`}
        ${renderRoomPlayerStrip(state)}`),refreshRoomPlayerStrip(el,state);return}if(s.phase==="result"){renderRoomFrame(el,["tt-result",s.turn,state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card" style="text-align:center">
          <div class="eyebrow">${escapeHTML(s.subjectName||"")}</div>
          ${(s.items||[]).map((x,i)=>`<div class="tt-item ${i===s.lieIndex?"is-lie":"is-true"}"><span class="tt-item__n">${i===s.lieIndex?"🤥":"✅"}</span><span>${escapeHTML(x)}</span></div>`).join("")}
          <p class="sheet__subtitle" style="margin-top: var(--sp-3)">
            ${(s.caught||[]).length?`🎯 ${escapeHTML(t.tt_caught_by||"")}: ${(s.caught||[]).map(escapeHTML).join("، ")}<br>`:""}
            ${(s.fooled||[]).length?`🤡 ${escapeHTML(t.tt_fooled||"")}: ${(s.fooled||[]).map(escapeHTML).join("، ")}`:(s.caught||[]).length?"":escapeHTML(t.tt_nobody_voted||"")}
          </p>
        </div>
        ${renderScoreboard(s.board)}
        ${autoNextSlotHtml(state)}
        ${roomMoveOnHtml(state,`<button class="btn btn--primary btn--lg" onclick="roomAct('next', { turn: ${Number(s.turn)||0} })">${escapeHTML(s.turn+1>=(s.order||[]).length?t.tt_final||"":t.tt_next||"")}</button>`,`<div class="waiting-note">${t.room_wait_host}</div>`)}
        ${renderRoomPlayerStrip(state)}`)&&s.subjectId===Room.me&&(s.fooled||[]).length&&typeof confetti=="function"&&confetti({particleCount:80,spread:70,origin:{y:.6}}),refreshRoomPlayerStrip(el,state);return}renderRoomFrame(el,["tt-over",state.youAreHost,appState.lang].join("|"),()=>{const ttPodium=renderPodium(state,s.board);return`
      <div class="card card--accent" style="text-align:center">
        <p class="sheet__subtitle">${escapeHTML(t.tt_over||"")}</p>
        ${ttPodium||`<div class="metric metric--md">🏆 ${escapeHTML(((s.board||[])[0]||{}).name||"")}</div>`}
        ${renderAward("🎭",t.title_liar,s.bestLiar,ttPodium?AWARD_AFTER_PODIUM_MS:200)}
      </div>
      ${renderScoreboard(s.board)}
      ${roomShareBtnHtml(state,s.board)}
      ${state.youAreHost?`<div class="btn-stack">
             <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain')">${t.play_again||""}</button>
             <button class="btn btn--ghost" onclick="roomAct('backToHub')">${t.room_another_game||""}</button>
           </div>`:`<div class="waiting-note">${t.room_wait_host}</div>`}
      ${renderRoomPlayerStrip(state)}`})&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:140,spread:90})),refreshRoomPlayerStrip(el,state)}};let ttLie=null;function ttPickLie(i){ttLie=i,document.querySelectorAll(".tt-lie").forEach(b=>{const on=Number(b.dataset.i)===i;b.classList.toggle("is-on",on),b.setAttribute("aria-pressed",String(on))}),haptic("light")}async function ttSubmit(){const t=TRANSLATIONS[appState.lang],statements=[0,1,2].map(i=>((document.getElementById("tt-s"+i)||{}).value||"").trim());if(statements.some(x=>!x)){showToast(t.tt_need_three||"","error");return}if(ttLie===null){showToast(t.tt_need_lie||"","error");return}try{await Room.act("submit",{statements,lie:ttLie}),ttLie=null}catch(err){err.quiet||showToast(err.message||"تعذر تنفيذ الإجراء","error")}}TV_GAMES.twotruths={sig:state=>[state.shared.phase,state.shared.turn,(state.shared.submitted||[]).length,(state.shared.vote&&state.shared.vote.voted||[]).length,JSON.stringify(state.shared.scores||{})].join("|"),frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"";return s.phase==="writing"?`
        <div class="tv-center">
          <div class="tv-big-icon" aria-hidden="true">✍️</div>
          <div class="tv-title">${escapeHTML(t.tt_tv_writing||"")}</div>
          ${tvWaitChips(state,s.roster||[],s.submitted||[])}
          ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.tt_start_anyway,"roomAct('closeWriting')","ghost")}</div>`)}
        </div>`:s.phase==="voting"?`
        <div class="tv-vote">
          <div class="tv-eyebrow tv-center-text">${escapeHTML(t.tt_turn_of||"")} · ${ltrFrac(s.turn+1,(s.order||[]).length)}</div>
          <div class="tv-title tv-center-text">${escapeHTML(s.subjectName||"")}</div>
          <div class="tv-ids tv-tt-items">${(s.items||[]).map((x,i)=>`<div class="tv-panel"><div class="tv-eyebrow">${i+1}</div><div class="tv-title">${escapeHTML(x)}</div></div>`).join("")}</div>
          ${tvVoteProgress(state,t)}
        </div>`:s.phase==="result"?`
        <div class="tv-vote">
          <div class="tv-title tv-center-text">${escapeHTML(s.subjectName||"")}</div>
          <div class="tv-ids tv-tt-items">${(s.items||[]).map((x,i)=>`<div class="tv-panel ${i===s.lieIndex?"is-lie":""}"><div class="tv-eyebrow">${i===s.lieIndex?"🤥 "+escapeHTML(t.tt_the_lie||""):"✅"}</div><div class="tv-title">${escapeHTML(x)}</div></div>`).join("")}</div>
          <div class="tv-note">${(s.caught||[]).length?"🎯 "+escapeHTML(t.tt_caught_by||"")+": "+(s.caught||[]).map(escapeHTML).join("، "):""}
            ${(s.fooled||[]).length?" · 🤡 "+escapeHTML(t.tt_fooled||"")+": "+(s.fooled||[]).map(escapeHTML).join("، "):""}</div>
          <div class="tv-scale">${renderScoreboard(s.board)}</div>
          ${autoNextSlotHtml(state)}
          ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(s.turn+1>=(s.order||[]).length?t.tt_final:t.tt_next,`roomAct('next', { turn: ${Number(s.turn)||0} })`)}</div>`)}
        </div>`:`
      <div class="tv-vote">
        <div class="tv-title tv-center-text">🏆 ${escapeHTML(((s.board||[])[0]||{}).name||"")}</div>
        ${tvAwardHtml("🎭",t.title_liar,s.bestLiar,200)}
        <div class="tv-scale">${renderScoreboard(s.board)}</div>
        ${host(tvBtn(t.play_again,"roomAct('playAgain')")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}
      </div>`},after(state,rebuilt){rebuilt&&state.shared.phase==="gameover"&&typeof confetti=="function"&&confetti({particleCount:180,spread:100,origin:{y:.6}})}};const HERD_OPTS_KEY="ashryHerdOpts",herdLocal={mergeFrom:null};function herdOpts(){const base={target:8};try{const saved=JSON.parse(localStorage.getItem(HERD_OPTS_KEY)||"null");saved&&[5,8,10].indexOf(saved.target)!==-1&&(base.target=saved.target)}catch(e){}return base}function setHerdOpt(key,value){const o=herdOpts();o[key]=Number(value);try{localStorage.setItem(HERD_OPTS_KEY,JSON.stringify(o))}catch(e){}const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state),haptic("light")}function herdBoard(s){return(s.board||[]).map(p=>Object.assign({},p,{name:p.id===s.sheepId?`${p.name} 🐑`:p.name}))}function herdGroupsHtml(s,t,opts){const o=opts||{};return`<div class="herd-groups">${(s.groups||[]).map(g=>{const top=s.majorityKey&&g.key===s.majorityKey,alone=g.ids.length===1,picked=herdLocal.mergeFrom===g.key,inner=`
      <span class="herd-group__count metric">${g.ids.length}</span>
      <span class="herd-group__body">
        <b>${escapeHTML(g.label)}${(g.parts||[]).length>1?` <span class="herd-group__also">+ ${escapeHTML(g.texts.filter(x=>x!==g.label).filter((x,i,a)=>a.indexOf(x)===i).join("، "))}</span>`:""}</b>
        <span class="herd-group__names">${g.names.map(escapeHTML).join("، ")}</span>
      </span>
      ${top?'<span class="herd-group__mark">🐄 +1</span>':alone&&s.phase!=="reveal"&&g.ids[0]===s.sheepId?'<span class="herd-group__mark">🐑</span>':""}`,cls=`herd-group${top?" is-top":""}${picked?" is-picked":""}`;return o.merge?`<button type="button" class="${cls}" onclick="herdTapGroup('${jsStringAttr(g.key)}')">${inner}</button>`:`<div class="${cls}">${inner}</div>`}).join("")}</div>`}function herdTapGroup(key){if(!(!Room.state||!Room.state.youAreHost)){if(!herdLocal.mergeFrom)herdLocal.mergeFrom=key;else if(herdLocal.mergeFrom===key)herdLocal.mergeFrom=null;else{const from=herdLocal.mergeFrom;herdLocal.mergeFrom=null,roomAct("merge",{from,into:key})}haptic("light"),routeRoomState(Room.state)}}ROOM_GAMES.herd={lobbyOptions(state){const t=TRANSLATIONS[appState.lang];if(!state.youAreHost)return`<p class="field__hint" style="text-align:center">${escapeHTML(t.herd_lobby_hint||"")}</p>`;const o=herdOpts();return`
      <div class="card card--tight">
        <div class="field">
          <label class="field__label">${escapeHTML(t.herd_target||"")}</label>
          <div class="segmented" role="group">
            ${[5,8,10].map(v=>`<button type="button" class="segmented__item ${v===o.target?"is-active":""}" onclick="setHerdOpt('target', ${v})">${v}</button>`).join("")}
          </div>
        </div>
        <p class="field__hint" style="text-align:center">${escapeHTML(t.herd_lobby_hint||"")}</p>
      </div>`+autoNextLobbyHtml(state,"herd")},startPayload(){return{lang:VOTE_LANG(),target:herdOpts().target,autoNext:autoNextChoice("herd")}},render(state){appState.currentView!=="room-herd"&&setView("room-herd");const el=document.getElementById("view-room-herd");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,inRound=(s.roster||[]).indexOf(Room.me)!==-1,mine=(s.submitted||[]).indexOf(Room.me)!==-1,head=`
      <div class="play-head">
        <span class="badge">${escapeHTML(t.round||"")} <span class="metric">${s.round}</span></span>
        <span class="badge badge--accent">🎯 ${s.target}</span>
      </div>
      <div class="card card--accent herd-prompt">
        <span class="eyebrow">${escapeHTML(t.herd_write_one||"")}</span>
        <div class="herd-prompt__text">${escapeHTML(s.prompt||"")}</div>
      </div>`;if(s.phase==="writing"){herdLocal.mergeFrom=null;const sig=["herd-write",s.round,mine,inRound,state.youAreHost,appState.lang].join("|");renderRoomFrame(el,sig,()=>head+(mine||!inRound?`
        <div class="card" style="text-align:center">
          <div class="metric metric--md">🐄</div>
          <p class="sheet__subtitle">${escapeHTML(inRound?t.herd_wait_others||"":t.vote_spectating||"")}</p>
          <div id="herd-progress" class="vote-progress"></div>
        </div>`:`
        <div class="card">
          <p class="card__subtitle">${escapeHTML(t.herd_write_hint||"")}</p>
          <div class="input-group">
            <input type="text" id="herd-answer" maxlength="40" autocomplete="off" placeholder="${escapeHTML(t.herd_placeholder||"")}" onkeydown="if (event.key === 'Enter') herdSubmit()">
            <button class="btn btn--primary btn--send" onclick="herdSubmit()">${escapeHTML(t.send||"")}</button>
          </div>
          <div id="herd-progress" class="vote-progress"></div>
        </div>`)+`
        ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="roomAct('closeWriting')">${escapeHTML(t.herd_reveal_now||"")}</button></div>`)}
        ${renderRoomPlayerStrip(state)}`,"herd-write|"+s.round);const prog=document.getElementById("herd-progress");prog&&(prog.innerHTML=`<span>${escapeHTML(t.tt_written||"")}: ${ltrFrac((s.submitted||[]).length,(s.roster||[]).length)}</span>`),refreshRoomPlayerStrip(el,state);return}if(s.phase==="reveal"){const sig=["herd-reveal",s.round,JSON.stringify((s.groups||[]).map(g=>g.key+":"+g.ids.length)),herdLocal.mergeFrom,state.youAreHost,appState.lang].join("|");renderRoomFrame(el,sig,()=>head+`
        <p class="field__hint" style="text-align:center">${escapeHTML(state.youAreHost?herdLocal.mergeFrom?t.herd_merge_into||"":t.herd_merge_hint||"":t.herd_host_checks||"")}</p>
        ${herdGroupsHtml(s,t,{merge:state.youAreHost})}
        ${roomMoveOnHtml(state,`
          <div class="btn-stack">
            <button class="btn btn--primary btn--lg" onclick="roomAct('score')">${escapeHTML(t.herd_score||"")}</button>
            ${state.youAreHost&&(s.groups||[]).some(g=>(g.parts||[]).length>1)?`<button class="btn btn--ghost btn--sm" onclick="roomAct('unmerge')">${escapeHTML(t.herd_unmerge||"")}</button>`:""}
          </div>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
        ${renderRoomPlayerStrip(state)}`)&&!motionOff()&&herdStagger(el),refreshRoomPlayerStrip(el,state);return}if(s.phase==="result"){const sig=["herd-result",s.round,s.sheepId,state.youAreHost,appState.lang,JSON.stringify(s.scores||{})].join("|"),fresh2=renderRoomFrame(el,sig,()=>head+`
        <div class="card" style="text-align:center">
          <div class="metric metric--md">${s.majorityKey?"🐄":"🤷"}</div>
          <p class="sheet__subtitle">${escapeHTML(s.majorityKey?t.herd_majority||"":t.herd_no_majority||"")}</p>
          ${s.sheepId?`<p class="sheet__subtitle">🐑 ${escapeHTML((t.herd_sheep_has||"").replace("{name}",s.sheepName||""))}</p>`:""}
        </div>
        ${herdGroupsHtml(s,t)}
        ${renderScoreboard(herdBoard(s))}
        ${autoNextSlotHtml(state)}
        ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--primary btn--lg" onclick="roomAct('nextRound', { round: ${Number(s.round)||0} })">${escapeHTML(t.next_round||"")}</button></div>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
        ${renderRoomPlayerStrip(state)}`);fresh2&&(s.gained||[]).indexOf(Room.me)!==-1&&playSound("success"),fresh2&&s.sheepId===Room.me&&s.sheepFrom!==Room.me&&playSound("alarm"),refreshRoomPlayerStrip(el,state);return}renderRoomFrame(el,["herd-over",state.youAreHost,appState.lang,JSON.stringify(s.scores||{})].join("|"),()=>`
      <div class="card card--accent" style="text-align:center">
        <p class="sheet__subtitle">🏆 ${escapeHTML((s.winners||[]).join(" · "))}</p>
        ${renderPodium(state,herdBoard(s))||""}
        ${s.sheepId?`<p class="field__hint">🐑 ${escapeHTML((t.herd_sheep_has||"").replace("{name}",s.sheepName||""))}</p>`:""}
      </div>
      ${herdGroupsHtml(s,t)}
      ${renderScoreboard(herdBoard(s))}
      ${roomShareBtnHtml(state,herdBoard(s))}
      ${state.youAreHost?`<div class="btn-stack">
             <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', ROOM_GAMES.herd.startPayload())">${escapeHTML(t.play_again||"")}</button>
             <button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(t.room_another_game||"")}</button>
           </div>`:`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`}
      ${renderRoomPlayerStrip(state)}`)&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:140,spread:90})),refreshRoomPlayerStrip(el,state)}};function herdStagger(el){const rows=[...el.querySelectorAll(".herd-group")];!rows.length||!motionFirst("herd-groups:"+roomDealKey(Room.state)+":"+(Room.state&&Room.state.shared.round))||rows.slice().reverse().forEach((row,k)=>{row.animate&&row.animate([{transform:"translateY(14px)",opacity:0},{transform:"none",opacity:1}],{duration:320,delay:k*110,easing:"cubic-bezier(0.2, 0.8, 0.2, 1)",fill:"backwards"})})}async function herdSubmit(){const t=TRANSLATIONS[appState.lang],input=document.getElementById("herd-answer"),text=(input&&input.value||"").trim();if(!text){showToast(t.herd_need_answer||"","error");return}const s=Room.state&&Room.state.shared,payload={text};s&&typeof s.round=="number"&&(payload.round=s.round),await roomAct("submit",payload)}function herdTvGroupsHtml(s,merge){return`<div class="tv-legend herd-tv">${(s.groups||[]).map(g=>{const top=s.majorityKey&&g.key===s.majorityKey,picked=merge&&herdLocal.mergeFrom===g.key,inner=`<b class="metric">${g.ids.length}</b> ${escapeHTML(g.label)}${top?" 🐄":g.ids.length===1&&g.ids[0]===s.sheepId&&s.phase!=="reveal"?" 🐑":""}
      <span class="herd-tv__names">${g.names.map(escapeHTML).join("، ")}</span>`;return merge?`<button type="button" class="tv-chip${picked?" is-turn":""}" aria-pressed="${picked}" onclick="herdTapGroup('${jsStringAttr(g.key)}')">${inner}</button>`:`<span class="tv-chip${top?" is-done":""}">${inner}</span>`}).join("")}</div>`}TV_GAMES.herd={sig:state=>{const s=state.shared;return[s.phase,s.round,(s.submitted||[]).length,JSON.stringify((s.groups||[]).map(g=>g.key+":"+g.ids.length)),s.sheepId,JSON.stringify(s.scores||{}),s.phase==="reveal"&&herdLocal.mergeFrom||""].join("|")},frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"",moveOn=html=>roomMoveOnHtml(state,`<div class="tv-actions">${html}</div>`),prompt=`<div class="tv-eyebrow tv-center-text">${escapeHTML(t.round||"")} ${s.round} · 🎯 ${s.target}</div>
      <div class="tv-title tv-center-text">${escapeHTML(t.herd_write_one||"")}: ${escapeHTML(s.prompt||"")}</div>`;if(s.phase==="writing")return`<div class="tv-center">${prompt}
        <div class="tv-big-icon" aria-hidden="true">🐄</div>
        ${tvWaitChips(state,s.roster||[],s.submitted||[])}
        ${moveOn(tvBtn(t.herd_reveal_now,"roomAct('closeWriting')","ghost"))}</div>`;if(s.phase==="reveal"){const merged=(s.groups||[]).some(g=>(g.parts||[]).length>1);return`<div class="tv-vote">${prompt}
        ${state.youAreHost?`<div class="tv-note">${escapeHTML(herdLocal.mergeFrom?t.herd_merge_into||"":t.herd_merge_hint||"")}</div>`:""}
        ${herdTvGroupsHtml(s,state.youAreHost)}
        ${moveOn(tvBtn(t.herd_score,"roomAct('score')")+(merged&&state.youAreHost?tvBtn(t.herd_unmerge,"roomAct('unmerge')","ghost"):""))}</div>`}return s.phase==="result"?`<div class="tv-vote">${prompt}
        <div class="tv-question">${s.majorityKey?"🐄 "+escapeHTML(t.herd_majority||""):"🤷 "+escapeHTML(t.herd_no_majority||"")}${s.sheepId?" · 🐑 "+escapeHTML(s.sheepName||""):""}</div>
        ${herdTvGroupsHtml(s)}
        <div class="tv-strip-inline">${herdBoard(s).map(p=>`<span class="tv-chip"><b class="metric">${p.score}</b> ${escapeHTML(p.name)}</span>`).join("")}</div>
        ${autoNextSlotHtml(state)}
        ${moveOn(tvBtn(t.next_round,`roomAct('nextRound', { round: ${Number(s.round)||0} })`))}</div>`:`<div class="tv-vote">
      <div class="tv-title tv-center-text">🏆 ${escapeHTML((s.winners||[]).join(" · "))}</div>
      <div class="tv-scale">${renderPodium(state,herdBoard(s))}${renderScoreboard(herdBoard(s))}</div>
      ${host(tvBtn(t.play_again,"roomAct('playAgain', ROOM_GAMES.herd.startPayload())")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}</div>`},after(state,rebuilt){rebuilt&&state.shared.phase==="gameover"&&typeof confetti=="function"&&confetti({particleCount:180,spread:100,origin:{y:.6}})}};function mafiaActedCount(s){return s.actedN!=null?s.actedN:(s.acted||[]).length}const MAFIA_OPTS_KEY="ashryMafiaOpts",MAFIA_ICONS={mafia:"🕴️",citizen:"🧑",doctor:"🩺",detective:"🔍",lawyer:"💼"},mafiaLocal={clock:null,clockKey:null};function mafiaOpts(){const base={mode:"classic",revealRoles:!1,narrate:!1,discuss:3,night:45};try{const saved=JSON.parse(localStorage.getItem(MAFIA_OPTS_KEY)||"null")||{};(saved.mode==="roles"||saved.mode==="classic")&&(base.mode=saved.mode),typeof saved.revealRoles=="boolean"&&(base.revealRoles=saved.revealRoles),typeof saved.narrate=="boolean"&&(base.narrate=saved.narrate),[2,3,5].indexOf(saved.discuss)!==-1&&(base.discuss=saved.discuss),[30,45,60].indexOf(saved.night)!==-1&&(base.night=saved.night)}catch(e){}return base}function setMafiaOpt(key,value){const o=mafiaOpts();o[key]=key==="mode"?value:key==="revealRoles"||key==="narrate"?!!value:Number(value);try{localStorage.setItem(MAFIA_OPTS_KEY,JSON.stringify(o))}catch(e){}const setup=document.getElementById("room-host-setup");setup&&delete setup.dataset.sig,Room.state&&routeRoomState(Room.state),haptic("light")}const mafiaCountFor=n=>n<=6?1:n<=9?2:3;function mafiaRoleSummary(n,mode,t){const bits=[`${mafiaCountFor(n)} ${MAFIA_ICONS.mafia} ${t.mafia_role_mafia||""}`];return mode==="roles"&&(bits.push(`${MAFIA_ICONS.doctor} ${t.mafia_role_doctor||""}`,`${MAFIA_ICONS.detective} ${t.mafia_role_detective||""}`),n>=6&&bits.push(`${MAFIA_ICONS.lawyer} ${t.mafia_role_lawyer||""}`)),bits.join(" · ")}const mafiaRoleName=(role,t)=>`${MAFIA_ICONS[role]||""} ${t["mafia_role_"+role]||""}`;function mafiaClockText(endsAt){const left=Math.max(0,Math.ceil((endsAt-roomServerNow())/1e3));return`${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}`}function mafiaTickClock(s){const paint=()=>{const text=s.endsAt?mafiaClockText(s.endsAt):"";["mafia-clock","tv-mafia-clock"].forEach(id=>{const el=document.getElementById(id);el&&(el.textContent=text)})};if(paint(),!s.endsAt){mafiaStopClock();return}mafiaLocal.clockKey===s.endsAt&&mafiaLocal.clock&&mafiaLocal.clock.isRunning()||(mafiaStopClock(),mafiaLocal.clockKey=s.endsAt,mafiaLocal.clock=createClock({seconds:Math.max(1,Math.ceil((s.endsAt-roomServerNow())/1e3)),onTick:paint,onEnd:paint}))}function mafiaStopClock(){mafiaLocal.clock&&mafiaLocal.clock.stop(),mafiaLocal.clock=null,mafiaLocal.clockKey=null}onRoomClocksReset(mafiaStopClock);function mafiaVoteState(state){const t=TRANSLATIONS[appState.lang],v=state.shared.vote;if(!v)return state;const label=o=>o.id==="nobody"?`🤷 ${t.mafia_nobody||""}`:o.label,vote=Object.assign({},v,{options:(v.options||[]).map(o=>Object.assign({},o,{label:label(o)})),results:v.results?v.results.map(r=>Object.assign({},r,{label:label(r)})):v.results});return Object.assign({},state,{shared:Object.assign({},state.shared,{vote})})}function mafiaNewsHtml(state,t){const s=state.shared,n=s.news;if(!n)return"";if(n.kind==="saved")return`<div class="card mafia-news"><div class="metric metric--md">🩺</div><p class="sheet__subtitle">${escapeHTML(t.mafia_news_saved||"")}</p></div>`;if(n.kind==="quiet")return`<div class="card mafia-news"><div class="metric metric--md">😴</div><p class="sheet__subtitle">${escapeHTML(t.mafia_news_quiet||"")}</p></div>`;if(n.kind==="tie"||n.kind==="nobody")return`<div class="card mafia-news"><div class="metric metric--md">🤝</div><p class="sheet__subtitle">${escapeHTML(n.kind==="tie"?t.mafia_news_tie||"":t.mafia_news_nobody||"")}</p></div>`;const cover=spyRevealParts(["mafia",state.code,s.dealId||"",s.night,s.day,n.kind,n.id].join("|"),n.kind==="voted"?t.mafia_reveal_voted:t.mafia_reveal_night);return`<div class="card mafia-news ${n.role==="mafia"?"is-mafia":""} ${cover.cls}" ${cover.attrs}>${cover.cover}
      <div class="metric metric--md">${n.kind==="voted"?"🗳️":"🌅"}</div>
      <p class="sheet__subtitle">${escapeHTML((n.kind==="voted"?t.mafia_out_voted||"":t.mafia_out_night||"").replace("{name}",n.name||""))}</p>
      <p class="mafia-news__role">${escapeHTML(t.mafia_was||"")}: ${escapeHTML(mafiaRoleName(n.role,t))}</p>
    </div>`}function mafiaPeopleHtml(state,t){const s=state.shared,nameOf=id=>(state.players.find(p=>p.id===id)||{}).name||"…";return`
    <div class="card card--tight">
      <div class="eyebrow">${escapeHTML(t.mafia_still_in||"")} · <span class="metric">${(s.alive||[]).length}</span></div>
      <div class="chip-set">${(s.alive||[]).map(id=>`<span class="chip chip--plain">${escapeHTML(nameOf(id))}</span>`).join("")}</div>
      ${(s.out||[]).length?`
        <div class="eyebrow" style="margin-top: var(--sp-3)">${escapeHTML(t.mafia_out||"")}</div>
        <div class="chip-set">${s.out.map(o=>`<span class="chip chip--plain is-away">${MAFIA_ICONS[o.role]||""} ${escapeHTML(o.name)}</span>`).join("")}</div>`:""}
    </div>`}function mafiaRoleCardHtml(state,t){return(state.you||{}).role?`
    <div class="hold-card mafia-hold" role="button" tabindex="0">
      <div class="hold-card__front">
        <span class="hold-card__icon" aria-hidden="true">👆</span>
        <span class="hold-card__label">${escapeHTML(t.hold_to_reveal||"")}</span>
        <span class="hold-card__hint">${escapeHTML(t.hold_hint||"")}</span>
      </div>
      <div class="hold-card__back" aria-hidden="true" data-mafia-back>${mafiaSecretHtml(state,t)}</div>
    </div>`:""}const mafiaNameOf=(state,id)=>(state.players.find(p=>p.id===id)||{}).name||"…";function mafiaSecretHtml(state,t){const s=state.shared||{},you=state.you||{},role=you.role;if(!role)return"";const night=s.phase==="night"&&(s.alive||[]).indexOf(Room.me)!==-1,names=list=>list.map(escapeHTML).join("، "),team=(you.mafia||[]).filter(m=>m.id!==Room.me).map(m=>m.name),lines=[];if(role==="mafia"&&lines.push(team.length?`${escapeHTML(t.mafia_your_team||"")}: ${names(team)}`:escapeHTML(t.mafia_alone||"")),role==="lawyer"&&lines.push(`💼 ${escapeHTML(t.mafia_lawyer_knows||"")}: ${names((you.mafia||[]).map(m=>m.name))}`),night&&role==="mafia"){const picks=(you.picks||[]).filter(p=>p.byId!==Room.me);picks.length&&lines.push(picks.map(p=>`${escapeHTML(p.by)} ← ${escapeHTML(p.name)}`).join(" · "))}if(night&&role==="doctor"&&you.lastSave){const fallback=appState.lang==="en"?"Not {name} again tonight":"مش {name} تاني الليلة دي";lines.push(`🚫 ${escapeHTML((t.mafia_last_save||fallback).replace("{name}",mafiaNameOf(state,you.lastSave)))}`)}if(role==="detective"&&(you.checks||[]).length){const tonight=night&&you.pick?(you.checks||[]).filter(c=>c.id===you.pick).slice(-1)[0]:null;tonight&&lines.push(`${tonight.mafia?"🕴️":"✅"} ${escapeHTML((tonight.mafia?t.mafia_check_yes||"":t.mafia_check_no||"").replace("{name}",tonight.name))}`);const before=(you.checks||[]).filter(c=>c!==tonight);before.length&&lines.push(before.map(c=>`${c.mafia?"🕴️":"✅"} ${escapeHTML(c.name)}`).join(" · "))}const task={mafia:t.mafia_task_mafia,doctor:t.mafia_task_doctor,detective:t.mafia_task_detective}[role]||t.mafia_task_suspect,text=night?task||"":t["mafia_desc_"+role]||"";return`
    <span class="mafia-role__icon" aria-hidden="true">${MAFIA_ICONS[role]||""}</span>
    <b class="mafia-role__name">${escapeHTML(t["mafia_role_"+role]||"")}</b>
    <span class="mafia-role__desc">${escapeHTML(text)}</span>
    ${lines.map(l=>`<span class="mafia-role__extra">${l}</span>`).join("")}`}function refreshMafiaSecret(root,state,t){const back=root&&root.querySelector("[data-mafia-back]");if(!back)return;const html=mafiaSecretHtml(state,t);back._mafiaHtml!==html&&(back.innerHTML=html,back._mafiaHtml=html)}function mafiaNightHtml(state,t){const s=state.shared,you=state.you||{};if(!((s.alive||[]).indexOf(Room.me)!==-1)||!you.role)return`<div class="card mafia-night" style="text-align:center"><div class="metric metric--lg">🌙</div><p class="sheet__subtitle">${escapeHTML(t.mafia_city_sleeps||"")}</p></div>`;const targets=(s.alive||[]).filter(id=>id!==Room.me).concat([Room.me]),heading=t.mafia_night_pick||(appState.lang==="en"?"Tap a name. What it does is on your card.":"اختار اسم. اللي بيعمله اختيارك مكتوب في كارتك."),picked=t.mafia_night_picked||(appState.lang==="en"?"Your pick is in.":"اختيارك اتسجل.");return`
    <div class="card mafia-night">
      <div class="mafia-night__task">🌙 ${escapeHTML(heading)}</div>
      <div class="mafia-targets">
        ${targets.map(id=>`<button type="button" class="mafia-target${you.pick===id?" is-on":""}" onclick="mafiaNightTap('${jsStringAttr(id)}')">
            ${escapeHTML(mafiaNameOf(state,id))}${id===Room.me?` <span class="badge">${escapeHTML(t.vote_you||"")}</span>`:""}</button>`).join("")}
      </div>
      <p class="field__hint" style="text-align:center">${you.pick?"✓ "+escapeHTML(picked):"&nbsp;"}</p>
    </div>`}function mafiaNightTap(id){const st=Room.state,s=st&&st.game==="mafia"&&st.shared;if(!s||s.phase!=="night")return;const you=st.you||{},mafiaIds=(you.mafia||[]).map(m=>m.id);you.role==="mafia"&&(id===Room.me||mafiaIds.indexOf(id)!==-1)||you.role==="detective"&&(id===Room.me||you.pick)||you.role==="doctor"&&id===you.lastSave||you.pick!==id&&Room.act("nightPick",{target:id}).catch(()=>{const t=TRANSLATIONS[appState.lang]||{};showToast(t.room_action_failed||(appState.lang==="en"?"That didn't go through, try again":"ماوصلش، جرّب تاني"),"error")})}function mafiaSky(root,phase){if(!root)return;let sky=root.querySelector(".mafia-sky");sky||(sky=document.createElement("div"),sky.className="mafia-sky",root.insertBefore(sky,root.firstChild));const night=phase==="night"||phase==="roles",day=phase==="day"||phase==="dayResult"||phase==="voting";sky.classList.toggle("mafia-sky--day",day),sky.classList.toggle("is-on",night||day)}const mafiaSaid={key:""};function mafiaNarrator(state){if(!state||!state.shared||!state.shared.narrate)return!1;const screens=(state.screens||[]).filter(x=>x.online).map(x=>x.id).sort();return state.youAreScreen?screens[0]===Room.me:!screens.length&&!!state.youAreHost}function mafiaJoinSaid(a,b){const first=String(a||"").trim(),second=String(b||"").trim();return first?second?first+(/[.!?؟。]$/.test(first)?" ":". ")+second:first:second}function mafiaNarrationLine(s,t){switch(s.phase){case"roles":return t.mafia_say_roles||"";case"night":return t.mafia_say_night||"";case"day":return mafiaJoinSaid(mafiaNewsText(s,t),t.mafia_say_day||"");case"voting":return t.mafia_say_vote||"";case"dayResult":return s.news?mafiaNewsText(s,t):"";case"gameover":return t.mafia_say_over||""}return""}function mafiaNewsText(s,t){const n=s.news||{};if(n.kind==="saved"||n.kind==="quiet"||n.kind==="tie"||n.kind==="nobody")return t["mafia_news_"+n.kind]||"";if(n.kind==="out"||n.kind==="voted"){const line=n.kind==="voted"?t.mafia_out_voted||"":t.mafia_out_night||"";return n.name?line.replace("{name}",n.name):""}return""}function mafiaNarrate(state,t,el){const s=state.shared,key=[state.code,s.dealId||"",s.phase,s.night,s.day,(s.news||{}).kind,(s.news||{}).name].join("|");if(mafiaSaid.key===key||(mafiaSaid.key=key,!mafiaNarrator(state)))return!1;const line=mafiaNarrationLine(s,t);return line?el&&typeof afterReveal=="function"?(afterReveal(el,()=>speakLine(line,appState.lang)),!0):speakLine(line,appState.lang):!1}onRoomClocksReset(()=>{mafiaSaid.key="",speakStop()}),ROOM_GAMES.mafia={lobbyOptions(state){const t=TRANSLATIONS[appState.lang],n=(state.players||[]).length,few=n<5?`<p class="field__hint tx-warning" style="text-align:center">${escapeHTML(t.mafia_need_five||"")}</p>`:"";if(!state.youAreHost)return`${few}<p class="field__hint" style="text-align:center">${escapeHTML(t.mafia_lobby_hint||"")}</p>`;const o=mafiaOpts(),seg=(key,values,labelOf)=>`
      <div class="segmented" role="group">
        ${values.map(v=>`<button type="button" class="segmented__item ${v===o[key]?"is-active":""}" onclick="setMafiaOpt('${key}', ${typeof v=="string"?`'${v}'`:v})">${labelOf(v)}</button>`).join("")}
      </div>`;return`
      <div class="card card--tight">
        <div class="field">
          <label class="field__label">${escapeHTML(t.mafia_mode||"")}</label>
          ${seg("mode",["classic","roles"],v=>escapeHTML(t["mafia_mode_"+v]||v))}
          <p class="field__hint">${escapeHTML(o.mode==="roles"?t.mafia_mode_roles_hint||"":t.mafia_mode_classic_hint||"")}</p>
        </div>
        <div class="field">
          <label class="switch-row" for="mafia-reveal">
            <span class="field__label">${escapeHTML(t.mafia_reveal||"")}</span>
            <span class="switch"><input type="checkbox" id="mafia-reveal" role="switch" ${o.revealRoles?"checked":""} onchange="setMafiaOpt('revealRoles', this.checked)"><span class="switch__track" aria-hidden="true"></span></span>
          </label>
          <p class="field__hint">${escapeHTML(t.mafia_reveal_hint||"")}</p>
        </div>
        <div class="field">
          <label class="switch-row" for="mafia-narrate">
            <span class="field__label">${escapeHTML(t.mafia_narrate||"")}</span>
            <span class="switch"><input type="checkbox" id="mafia-narrate" role="switch" ${o.narrate?"checked":""} onchange="setMafiaOpt('narrate', this.checked)"><span class="switch__track" aria-hidden="true"></span></span>
          </label>
          <p class="field__hint">${escapeHTML(t.mafia_narrate_hint||"")}</p>
        </div>
        <div class="field">
          <label class="field__label">${escapeHTML(t.mafia_discuss||"")}</label>
          ${seg("discuss",[2,3,5],v=>`${v} ${escapeHTML(t.meta_min||"")}`)}
        </div>
        <div class="field">
          <label class="field__label">${escapeHTML(t.mafia_night_time||"")}</label>
          ${seg("night",[30,45,60],v=>`${v}″`)}
        </div>
        ${n>=5?`<p class="field__hint" style="text-align:center">👥 ${n}: ${escapeHTML(mafiaRoleSummary(n,o.mode,t))}</p>`:few}
      </div>`},startPayload(){const o=mafiaOpts();return{mode:o.mode,revealRoles:o.revealRoles,narrate:o.narrate,discuss:o.discuss,night:o.night}},render(state){appState.currentView!=="room-mafia"&&setView("room-mafia");const el=document.getElementById("view-room-mafia");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,you=state.you||{},inGame=(s.roster||[]).indexOf(Room.me)!==-1,alive=(s.alive||[]).indexOf(Room.me)!==-1,v=s.vote||{},sig=["mafia",s.dealId||"",s.phase,s.night,s.day,you.role||"",you.pick,(v.voted||[]).length,v.phase,(s.alive||[]).length,state.youAreHost,appState.lang].join("|"),rebuilt=renderRoomFrame(el,sig,()=>{const head=`
        <div class="play-head">
          ${s.phase==="roles"?'<span class="badge">🎭</span>':`<span class="badge">${s.phase==="night"?"🌙":"☀️"} <span class="metric">${s.phase==="night"?s.night:s.day}</span></span>`}
          ${(s.phase==="night"||s.phase==="day")&&s.endsAt?`<span id="mafia-clock" class="badge badge--accent metric">${mafiaClockText(s.endsAt)}</span>`:""}
          <span class="badge">${escapeHTML(t["mafia_mode_"+s.mode]||"")}</span>
        </div>`,outNote=inGame&&!alive&&s.phase!=="gameover"?`<div class="waiting-note">🤐 ${escapeHTML(t.mafia_you_out||"")}</div>`:"",role=inGame?mafiaRoleCardHtml(state,t):`<div class="waiting-note">${escapeHTML(t.vote_spectating||"")}</div>`;if(s.phase==="roles")return head+`
          <div class="card card--accent" style="text-align:center">
            <div class="metric metric--md">🎭</div>
            <p class="sheet__subtitle">${escapeHTML(t.mafia_roles_intro||"")}</p>
            <p class="field__hint">${escapeHTML(mafiaRoleSummary((s.roster||[]).length,s.mode,t))}</p>
          </div>
          ${role}
          ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--primary btn--lg" onclick="roomAct('startNight')">🌙 ${escapeHTML(t.mafia_start_night||"")}</button></div>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
          ${renderRoomPlayerStrip(state)}`;if(s.phase==="night")return head+`
          <div class="card mafia-nighthead" style="text-align:center"><div class="eyebrow">🌙 ${escapeHTML((t.mafia_night_n||"").replace("{n}",s.night))}</div>
            <p class="field__hint">${escapeHTML(t.mafia_night_everyone||"")} · <span class="metric" data-mafia-acted>${mafiaActedCount(s)}/${(s.alive||[]).length}</span></p></div>
          ${outNote}${mafiaNightHtml(state,t)}
          ${inGame&&alive?role:""}
          ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="roomAct('endNight')">${escapeHTML(t.mafia_end_night||"")}</button></div>`)}
          ${renderRoomPlayerStrip(state)}`;if(s.phase==="day")return head+mafiaNewsHtml(state,t)+outNote+`
          <div class="card" style="text-align:center">
            <div class="eyebrow">🗣️ ${escapeHTML(t.mafia_discuss_now||"")}</div>
            <p class="field__hint">${escapeHTML(t.mafia_discuss_hint||"")}</p>
          </div>
          ${mafiaPeopleHtml(state,t)}
          ${inGame&&alive?role:""}
          ${roomMoveOnHtml(state,`<div class="btn-stack">
              <button class="btn btn--primary btn--lg" onclick="roomAct('startVote')">🗳️ ${escapeHTML(t.mafia_vote_now||"")}</button>
              ${state.youAreHost?`<button class="btn btn--ghost btn--sm" onclick="roomAct('moreTime')">+1 ${escapeHTML(t.meta_min||"")}</button>`:""}
            </div>`,`<div class="waiting-note">${escapeHTML(t.mafia_vote_soon||"")}</div>`)}
          ${renderRoomPlayerStrip(state)}`;if(s.phase==="voting")return head+outNote+`
          <div class="card card--tight">
            <div class="eyebrow">🗳️ ${escapeHTML(t.mafia_who_leaves||"")}</div>
            ${renderBallot(mafiaVoteState(state),{ownLabel:t.vote_you})}
          </div>
          ${mafiaPeopleHtml(state,t)}
          ${renderRoomPlayerStrip(state)}`;if(s.phase==="dayResult")return head+mafiaNewsHtml(state,t)+`
          <div class="card card--tight">${s.vote&&s.vote.results?renderVoteResults(mafiaVoteState(state)):""}</div>
          ${mafiaPeopleHtml(state,t)}
          ${roomMoveOnHtml(state,`<div class="btn-stack"><button class="btn btn--primary btn--lg" onclick="roomAct('startNight')">🌙 ${escapeHTML(t.mafia_next_night||"")}</button></div>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
          ${renderRoomPlayerStrip(state)}`;const mine=(s.roles||[]).find(r=>r.id===Room.me),iWon=mine&&s.winner==="mafia"==(mine.role==="mafia"||mine.role==="lawyer"),endRev=mafiaEndReveal(state,t,!1);return`
        ${s.news?mafiaNewsHtml(state,t):""}
        <div class="card mafia-end-card ${s.winner==="town"?"card--accent":"mafia-won"}"${endRev.st.at(endRev.winAt,"pop")}>
          <div class="metric metric--lg">${s.winner==="town"?"🏙️":"🕴️"}</div>
          <div class="card__title">${escapeHTML(s.winner==="town"?t.mafia_town_wins||"":t.mafia_mafia_wins||"")}</div>
          ${mine?`<p class="sheet__subtitle">${escapeHTML(iWon?t.mafia_you_won||"":t.mafia_you_lost||"")}</p>`:""}
        </div>
        <div class="card card--tight"${endRev.st.end(400)}>
          <div class="eyebrow">${escapeHTML(t.mafia_everyone_was||"")}</div>
          ${endRev.rows}
        </div>
        ${endRev.st.board(renderScoreboard(s.board),endRev.winAt+500)}
        ${state.youAreHost?`<div class="btn-stack">
            <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', ROOM_GAMES.mafia.startPayload())">${escapeHTML(t.play_again||"")}</button>
            <button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(t.room_another_game||"")}</button>
          </div>`:`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`}
        ${renderRoomPlayerStrip(state)}`});mafiaSky(el,s.phase),rebuilt&&mafiaSounds(state),mafiaNarrate(state,t,el),refreshRoomPlayerStrip(el,state),refreshMafiaSecret(el,state,t),s.phase==="gameover"&&rebuilt&&mafiaEndRun(el,state);const acted=el.querySelector("[data-mafia-acted]");acted&&(acted.textContent=`${mafiaActedCount(s)}/${(s.alive||[]).length}`),(s.phase==="night"||s.phase==="day")&&s.endsAt?mafiaTickClock(s):mafiaStopClock(),s.phase==="gameover"&&rebuilt&&typeof confetti=="function"&&motionFirst("mafia-over:"+roomDealKey(state)+":"+JSON.stringify(s.scores||{}))&&afterReveal(el,()=>confetti({particleCount:120,spread:80}))}};const MAFIA_END_ORDER={citizen:0,doctor:1,detective:2,lawyer:3,mafia:4};function mafiaEndReveal(state,t,tv){const s=state.shared,st=stageReveal(["mafia-end",tv?"tv":"ph",roomDealKey(state),JSON.stringify(s.scores||{})].join("|"),state),roles=s.roles||[],when=new Map;let at=300,prev=null;roles.slice().sort((a,b)=>(MAFIA_END_ORDER[a.role]||0)-(MAFIA_END_ORDER[b.role]||0)).forEach(r=>{prev!==null&&r.role!==prev&&(at+=r.role==="mafia"?1e3:300),prev=r.role,when.set(r,at),at+=r.role==="citizen"?300:r.role==="mafia"?700:550});const rows=roles.map(r=>{const here=when.get(r);return`<div class="mafia-final ${r.alive?"":"is-out"} ${r.role==="mafia"?"is-mafia":""}"${st.at(here,"flip")}>
        ${st.on?stageCoverHtml(""):""}
        <span aria-hidden="true">${MAFIA_ICONS[r.role]}</span><b>${escapeHTML(r.name)}</b><span>${escapeHTML(t["mafia_role_"+r.role]||"")}</span></div>`}).join("");return{st,rows,winAt:st.on?at+300:0}}function mafiaEndRun(root,state){stageRun(root,state);const mafia=root?[...root.querySelectorAll(".mafia-final.is-mafia[data-rv]")]:[];if(!mafia.length)return;const at=Math.min(...mafia.map(el=>parseFloat(el.style.getPropertyValue("--rv-at"))||0));[1e3,760,540,340,170].forEach(ms=>stageSound(state,"tick",at-ms)),stageSound(state,"alarm",at+250)}function mafiaSounds(state){const s=state.shared,key=["mafia-sound",state.code,s.dealId||"",s.phase,s.night,s.day].join("|");motionFirst(key)&&(s.phase==="night"&&playRoomFx("tick"),(s.phase==="day"||s.phase==="dayResult")&&s.news&&playRoomFx(s.news.kind==="out"||s.news.kind==="voted"?"alarm":"success"))}TV_GAMES.mafia={sig:state=>{const s=state.shared,v=s.vote||{};return[s.phase,s.night,s.day,mafiaActedCount(s),(v.voted||[]).length,v.phase,(s.alive||[]).length,s.endsAt].join("|")},frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"",moveOn=html=>roomMoveOnHtml(state,`<div class="tv-actions">${html}</div>`),nameOf=id=>(state.players.find(p=>p.id===id)||{}).name||"…",clock=s.endsAt?`<div id="tv-mafia-clock" class="tv-clock">${mafiaClockText(s.endsAt)}</div>`:"",people=`<div class="tv-strip-inline">${(s.alive||[]).map(id=>`<span class="tv-chip">${escapeHTML(nameOf(id))}</span>`).join("")}${(s.out||[]).map(o=>`<span class="tv-chip is-away">${MAFIA_ICONS[o.role]||""} ${escapeHTML(o.name)}</span>`).join("")}</div>`;if(s.phase==="roles")return`<div class="tv-center"><div class="tv-big-icon" aria-hidden="true">🎭</div>
        <div class="tv-title">${escapeHTML(t.mafia_roles_intro||"")}</div>
        <div class="tv-note">${escapeHTML(mafiaRoleSummary((s.roster||[]).length,s.mode,t))}</div>
        ${moveOn(tvBtn("🌙 "+(t.mafia_start_night||""),"roomAct('startNight')"))}</div>`;if(s.phase==="night")return`<div class="tv-center mafia-tv-night"><div class="tv-big-icon" aria-hidden="true">🌙</div>
        <div class="tv-title">${escapeHTML(t.mafia_city_sleeps||"")}</div>${clock}
        <div class="tv-note">${escapeHTML(t.mafia_night_everyone||"")}</div>
        <div class="tv-legend tv-wait"><span class="tv-chip is-done">✓ <b class="metric">${ltrFrac(mafiaActedCount(s),(s.alive||[]).length)}</b></span></div>
        ${moveOn(tvBtn(t.mafia_end_night,"roomAct('endNight')","ghost"))}</div>`;if(s.phase==="day")return`<div class="tv-vote"><div class="tv-scale">${mafiaNewsHtml(state,t)}</div>
        <div class="tv-title tv-center-text">🗣️ ${escapeHTML(t.mafia_discuss_now||"")}</div>${clock}${people}
        ${moveOn(tvBtn("🗳️ "+(t.mafia_vote_now||""),"roomAct('startVote')")+(state.youAreHost?tvBtn("+1 "+(t.meta_min||""),"roomAct('moreTime')","ghost"):""))}</div>`;if(s.phase==="voting")return`<div class="tv-vote"><div class="tv-title tv-center-text">🗳️ ${escapeHTML(t.mafia_who_leaves||"")}</div>${people}${tvVoteProgress(state,t)}</div>`;if(s.phase==="dayResult"){const results=((mafiaVoteState(state).shared.vote||{}).results||[]).filter(r=>r.count>0).sort((a,b)=>b.count-a.count),news=mafiaNewsHtml(state,t),st=stageReveal(["mafia-tv-dr",roomDealKey(state),s.day].join("|"),state),after=news.indexOf("spy-reveal__cover")!==-1?SPY_REVEAL_MS+200:300;return`<div class="tv-vote"><div class="tv-scale">${news}</div>
        <div class="tv-legend">${results.map((r,k)=>`<span class="tv-chip${k===0?" is-done":""}"${st.at(after+k*220,"pop")}><b class="metric">${r.count}</b> ${escapeHTML(r.label)}</span>`).join("")}</div>${people}
        ${moveOn(tvBtn("🌙 "+(t.mafia_next_night||""),"roomAct('startNight')"))}</div>`}const endRev=mafiaEndReveal(state,t,!0);return`<div class="tv-vote"${endRev.st.end(400)}>
      <div class="tv-title tv-center-text"${endRev.st.at(endRev.winAt,"pop")}>${s.winner==="town"?"🏙️ "+escapeHTML(t.mafia_town_wins||""):"🕴️ "+escapeHTML(t.mafia_mafia_wins||"")}</div>
      <div class="mafia-final-grid">${endRev.rows}</div>
      <div class="tv-scale">${endRev.st.board(renderScoreboard(s.board),endRev.winAt+500)}</div>
      ${host(tvBtn(t.play_again,"roomAct('playAgain', ROOM_GAMES.mafia.startPayload())")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}</div>`},after(state,rebuilt){const s=state.shared,view=document.getElementById("view-room-tv");rebuilt&&s.phase==="gameover"&&mafiaEndRun(view,state),rebuilt&&s.phase==="dayResult"&&stageRun(view,state),(s.phase==="night"||s.phase==="day")&&s.endsAt?mafiaTickClock(s):mafiaStopClock(),mafiaNarrate(state,TRANSLATIONS[appState.lang],document.getElementById("view-room-tv"))}};const mindLocal={from:null};function mindLivesHtml(s){const lives=Math.max(0,Number(s.lives)||0),total=Math.max(lives,(s.roster||[]).length);let out="";for(let i=0;i<total;i++)out+=i<lives?"❤️":"🖤";return`<span class="mind-lives" aria-hidden="true">${out}</span>`}function mindLevelText(s,t){const n=Number(s.level)||0,max=Number(s.maxLevel)||0;return max?(t.mind_level_of||"").replace("{n}",n).replace("{max}",max):`${t.mind_level||""} ${n}`}function mindNextText(s,t){return((s.maxLevel&&s.level+1>=s.maxLevel?t.mind_last_level:t.mind_next_deals)||"").replace("{n}",s.level+1)}function mindOverHtml(s,t,tv){const n=Number(s.level)||0,max=Number(s.maxLevel)||0,count=`<span class="metric" data-mind-count="${n}">${n}</span>${max?`<span class="tx-muted"> / ${max}</span>`:""}`,sub=s.won&&max?(t.mind_won_all||"").replace("{max}",max):(t.mind_reached||"").replace("{n}",n);return tv?`<div class="tv-big-icon" aria-hidden="true">${s.won?"🧠":"💔"}</div>
       <div class="tv-title tv-center-text">${escapeHTML(s.won?t.mind_won||"":t.mind_lost||"")}</div>
       <div class="tv-clock" dir="ltr">${count}</div>
       <div class="tv-note">${escapeHTML(sub)}</div>`:`<div class="mind-big" aria-hidden="true">${s.won?"🧠":"💔"}</div>
       <p class="sheet__title">${escapeHTML(s.won?t.mind_won||"":t.mind_lost||"")}</p>
       <div class="mind-big" dir="ltr">${count}</div>
       <p class="sheet__subtitle">${escapeHTML(sub)}</p>`}function mindOverAfter(el,state){const s=state.shared,num=el&&el.querySelector("[data-mind-count]");if(!num||!motionFirst(["mind-over",roomDealKey(state),s.won,s.level].join("|"))){num&&s.won&&motionOff()&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:160,spread:90}));return}countUp(num,0,Number(num.dataset.mindCount)||0),s.won&&typeof confetti=="function"&&setTimeout(()=>afterReveal(el,()=>confetti({particleCount:160,spread:90})),760)}function mindPileHtml(s,t){const top=(s.pile||[])[(s.pile||[]).length-1];return`<div class="mind-pile">
      <div class="eyebrow">${escapeHTML(t.mind_pile||"")}</div>
      <div class="mind-card mind-card--pile" id="mind-pile-card">${top===void 0?"—":`<span class="metric">${top}</span>`}</div>
    </div>`}function mindDiscardHtml(s,t){const gone=s.discarded||[];return gone.length?`<div class="mind-discard">
      <span class="field__hint">${escapeHTML(t.mind_missed||"")}</span>
      ${gone.map(n=>`<span class="mind-chip">${n}</span>`).join("")}
    </div>`:""}function mindHandsHtml(state,s,t){const held=s.held||{},rows=(s.roster||[]).filter(id=>held[id]!==void 0).map(id=>{const p=(state.players||[]).find(x=>x.id===id),n=held[id]||0;return`<span class="mind-hand ${n?"":"is-empty"}">${escapeHTML(p&&p.name||"")}
        <b class="metric">${n}</b></span>`}).join("");return rows?`<div class="mind-hands">${rows}</div>`:""}function mindMyCardsHtml(state,s,t){const mine=((state.you||{}).cards||[]).slice();if(!mine.length)return`<div class="waiting-note">${escapeHTML(t.mind_none||"")}</div>`;const playable=s.phase==="play";return`<div class="mind-hand-mine">
      <div class="eyebrow">${escapeHTML(t.mind_your_cards||"")}</div>
      <div class="mind-cards">
        ${mine.map((n,i)=>i===0&&playable?`<button type="button" class="mind-card mind-card--mine is-next" onclick="mindPlay(this)"><span class="metric">${n}</span></button>`:`<span class="mind-card mind-card--mine"><span class="metric">${n}</span></span>`).join("")}
      </div>
      ${playable?`<p class="field__hint">${escapeHTML(t.mind_play_hint||"")}</p>`:""}
    </div>`}function mindPlay(btn){if(btn&&btn.getBoundingClientRect){const r=btn.getBoundingClientRect();mindLocal.from={rect:r,font:parseFloat(getComputedStyle(btn).fontSize)||24,text:btn.textContent.trim()}}haptic("light");const mine=(Room.state&&Room.state.you||{}).cards||[];roomAct("play",mine.length?{card:mine[0]}:{})}function mindFlyToPile(){const from=mindLocal.from;mindLocal.from=null;const target=document.getElementById("mind-pile-card");!from||!target||typeof flyEmoji!="function"||flyEmoji(from.text,from.rect,from.font,target)}function mindShakeOnLoss(el,state){const s=state.shared;!s.lost||typeof motionFirst!="function"||motionFirst(["mind-lost",roomDealKey(state),s.lost.seq].join("|"))&&(motionOff()||(el.classList.add("animate-shake"),setTimeout(()=>{el.classList.remove("animate-shake")},800)),playSound("wrong"),haptic("heavy"))}ROOM_GAMES.mind={lobbyOptions(state){const t=TRANSLATIONS[appState.lang];return`<p class="field__hint" style="text-align:center">${escapeHTML(t.mind_lobby_hint||"")}</p>`},startPayload(){return{}},render(state){appState.currentView!=="room-mind"&&setView("room-mind");const el=document.getElementById("view-room-mind");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,mine=(state.you||{}).cards||[];if(mindShakeOnLoss(el,state),s.phase==="gameover"){renderRoomFrame(el,["mind-over",s.won,s.level,s.maxLevel,state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card card--accent" style="text-align:center">
          ${mindOverHtml(s,t)}
        </div>
        ${state.youAreHost?`<div class="btn-stack">
               <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain')">${escapeHTML(t.play_again||"")}</button>
               <button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(t.room_another_game||"")}</button>
             </div>`:`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`}
        ${renderRoomPlayerStrip(state)}`)&&mindOverAfter(el,state),refreshRoomPlayerStrip(el,state);return}const head=`<div class="cn-score">
        <span class="cn-score__role">💯 ${escapeHTML(mindLevelText(s,t))}</span>
        ${mindLivesHtml(s)}
      </div>`;if(s.phase==="levelDone"){renderRoomFrame(el,["mind-level",s.level,state.youAreHost,appState.lang].join("|"),()=>`
        ${head}
        <div class="card card--accent" style="text-align:center">
          <div class="mind-big" aria-hidden="true">✅</div>
          <p class="sheet__title">${escapeHTML((t.mind_level_done||"").replace("{n}",s.level))}</p>
          <p class="sheet__subtitle">${escapeHTML(mindNextText(s,t))}</p>
          ${roomMoveOnHtml(state,`<button class="btn btn--primary btn--lg" style="margin-top: var(--sp-3)" onclick="roomAct('nextLevel')">${escapeHTML(t.mind_next_level||"")}</button>`,`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`)}
        </div>
        ${mindDiscardHtml(s,t)}
        ${renderRoomPlayerStrip(state)}`),refreshRoomPlayerStrip(el,state);return}const sig=["mind-play",s.level,s.lives,(s.pile||[]).join(","),(s.discarded||[]).join(","),mine.join(","),JSON.stringify(s.held||{}),appState.lang].join("|");renderRoomFrame(el,sig,()=>`
      ${head}
      <div class="card" style="text-align:center">
        ${mindPileHtml(s,t)}
        ${s.last?`<p class="field__hint">${escapeHTML((t.mind_played_by||"").replace("{name}",s.last.name||"").replace("{n}",s.last.card))}</p>`:""}
      </div>
      ${mindDiscardHtml(s,t)}
      <div class="card">${mindMyCardsHtml(state,s,t)}</div>
      ${mindHandsHtml(state,s,t)}
      ${renderRoomPlayerStrip(state)}`)&&mindFlyToPile(),refreshRoomPlayerStrip(el,state)}},TV_GAMES.mind={sig:state=>["mind",state.shared.phase,state.shared.level,state.shared.maxLevel,state.shared.won,state.shared.lives,(state.shared.pile||[]).join(","),(state.shared.discarded||[]).join(","),JSON.stringify(state.shared.held||{}),state.youAreHost].join("|"),frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"";if(s.phase==="gameover")return`
        <div class="tv-vote">
          ${mindOverHtml(s,t,!0)}
          ${host(tvBtn(t.play_again,"roomAct('playAgain')")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}
        </div>`;const top=`<div class="tv-top">
        <span class="tv-pill">💯 ${escapeHTML(mindLevelText(s,t))}</span>
        <span class="tv-pill">${mindLivesHtml(s)}</span>
      </div>`;if(s.phase==="levelDone")return`
        <div class="tv-trivia">${top}
          <div class="tv-center">
            <div class="tv-big-icon" aria-hidden="true">✅</div>
            <div class="tv-title">${escapeHTML((t.mind_level_done||"").replace("{n}",s.level))}</div>
            <div class="tv-note">${escapeHTML(mindNextText(s,t))}</div>
            ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.mind_next_level,"roomAct('nextLevel')")}</div>`)}
          </div>
        </div>`;const pileTop=(s.pile||[])[(s.pile||[]).length-1];return`
      <div class="tv-trivia">${top}
        <div class="tv-center${typeof tvArtHtml=="function"?" has-art":""}">
          ${typeof tvArtHtml=="function"?tvArtHtml("mind"):""}
          <div class="tv-eyebrow">${escapeHTML(t.mind_pile||"")}</div>
          <div class="tv-clock">${pileTop===void 0?"—":pileTop}</div>
          ${s.last?`<div class="tv-note">${escapeHTML((t.mind_played_by||"").replace("{name}",s.last.name||"").replace("{n}",s.last.card))}</div>`:""}
          ${(s.discarded||[]).length?`<div class="tv-note">${escapeHTML(t.mind_missed||"")} ${(s.discarded||[]).join(" · ")}</div>`:""}
        </div>
        <div class="tv-scale">${mindHandsHtml(state,s,t)}</div>
      </div>`},after(state,rebuilt){rebuilt&&state.shared.phase==="gameover"&&mindOverAfter(document.getElementById("view-room-tv"),state)}};const tlLocal={pick:null};function tlPick(id){if(tlLocal.pick=tlLocal.pick===id?null:id,haptic("light"),Room.state){const el=document.getElementById("view-room-timeline");el&&delete el.dataset.sig,routeRoomState(Room.state)}}function tlPlace(at){const card=tlLocal.pick;card&&(tlLocal.pick=null,haptic("medium"),roomAct("place",{card,at}))}const tlCardHtml=(card,cls)=>`<div class="tl-card ${cls||""}">
     <span class="tl-card__text">${escapeHTML(card.text||"")}</span>
     ${card.y===void 0?"":`<span class="tl-card__year metric">${card.y}</span>`}
   </div>`;function tlLineHtml(s,t,live){const line=s.timeline||[],gap=at=>live?`<button type="button" class="tl-gap is-live" onclick="tlPlace(${at})" aria-label="${escapeHTML(t.tl_put_here||"")}">+</button>`:'<span class="tl-gap" aria-hidden="true"></span>';let out=gap(0);return line.forEach((card,i)=>{out+=tlCardHtml(card)+gap(i+1)}),`<div class="tl-line" dir="ltr">${out}</div>`}function tlWinnersText(s){return(Array.isArray(s.winnerNames)&&s.winnerNames.length?s.winnerNames:s.winnerName?[s.winnerName]:[]).join(appState.lang==="ar"?"، ":", ")}function tlMyCardsHtml(state,s,t){const mine=(state.you||{}).cards||[];if(!mine.length)return`<div class="waiting-note">${escapeHTML(t.tl_none||"")}</div>`;const myTurn=s.turnId===Room.me&&s.phase==="play",unknownYear=appState.lang==="ar"?"؟":"?";return`<div class="tl-hand">
      <div class="eyebrow">${escapeHTML(t.tl_your_cards||"")}</div>
      <div class="tl-hand__cards">
        ${mine.map(c=>myTurn?`<button type="button" class="tl-card tl-card--mine ${tlLocal.pick===c.id?"is-picked":""}" onclick="tlPick('${jsStringAttr(c.id)}')">
               <span class="tl-card__text">${escapeHTML(c.text||"")}</span>
               <span class="tl-card__year">${unknownYear}</span>
             </button>`:`<span class="tl-card tl-card--mine is-waiting">
               <span class="tl-card__text">${escapeHTML(c.text||"")}</span>
               <span class="tl-card__year">${unknownYear}</span>
             </span>`).join("")}
      </div>
      ${myTurn?`<p class="field__hint">${escapeHTML(tlLocal.pick?t.tl_now_gap||"":t.tl_pick_card||"")}</p>`:`<p class="field__hint">${escapeHTML((t.tl_wait_turn||"").replace("{name}",s.turnName||""))}</p>`}
    </div>`}function tlHandsHtml(state,s){const hands=s.hands||{},rows=(s.order||[]).filter(id=>hands[id]!==void 0).map(id=>{const p=(state.players||[]).find(x=>x.id===id);return`<span class="mind-hand ${id===s.turnId?"is-up":""}">${escapeHTML(p&&p.name||"")}
        <b class="metric">${hands[id]||0}</b></span>`}).join("");return rows?`<div class="mind-hands">${rows}</div>`:""}function tlLastHtml(s,t){if(!s.last)return"";const l=s.last;return`<div class="card card--tight tl-last ${l.right?"is-right":"is-wrong"}" style="text-align:center">
      <div class="eyebrow">${l.right?"✅":"❌"} ${escapeHTML(l.name||"")}</div>
      <div class="tl-last__text">${escapeHTML(l.text||"")}</div>
      <div class="metric metric--md">${l.y}</div>
    </div>`}ROOM_GAMES.timeline={lobbyOptions(state){const t=TRANSLATIONS[appState.lang];return`<p class="field__hint" style="text-align:center">${escapeHTML(t.tl_lobby_hint||"")}</p>`},startPayload(){return{lang:contentLang()}},render(state){appState.currentView!=="room-timeline"&&setView("room-timeline");const el=document.getElementById("view-room-timeline");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,mine=(state.you||{}).cards||[];if(s.turnId!==Room.me&&tlLocal.pick&&(tlLocal.pick=null),s.phase==="play"&&s.turnId===Room.me&&mine.length===1&&(tlLocal.pick=mine[0].id),s.phase==="gameover"){renderRoomFrame(el,["tl-over",s.dealId,s.winnerId,s.ended,state.youAreHost,appState.lang].join("|"),()=>`
        <div class="card card--accent" style="text-align:center">
          <div class="eyebrow">${escapeHTML(t.tl_over||"")}</div>
          ${s.ended==="deck"?`<p class="field__hint">${escapeHTML(t.tl_deck_out||"")}</p>`:""}
          ${renderPodium(state,s.board)||(s.winnerName?`<div class="metric metric--md">🏆 ${escapeHTML(tlWinnersText(s))}</div>`:`<p class="field__hint">${escapeHTML(t.tl_nobody||"")}</p>`)}
        </div>
        ${tlLineHtml(s,t,!1)}
        ${renderScoreboard(s.board)}
        ${roomShareBtnHtml(state,s.board)}
        ${state.youAreHost?`<div class="btn-stack">
               <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain', ROOM_GAMES.timeline.startPayload())">${escapeHTML(t.play_again||"")}</button>
               <button class="btn btn--ghost" onclick="roomAct('backToHub')">${escapeHTML(t.room_another_game||"")}</button>
             </div>`:`<div class="waiting-note">${escapeHTML(t.room_wait_host||"")}</div>`}
        ${renderRoomPlayerStrip(state)}`)&&s.winnerId&&typeof confetti=="function"&&afterReveal(el,()=>confetti({particleCount:150,spread:90})),refreshRoomPlayerStrip(el,state);return}const live=s.phase==="play"&&s.turnId===Room.me&&!!tlLocal.pick,sig=["tl-play",s.turnId,(s.timeline||[]).map(c=>c.id).join(","),mine.map(c=>c.id).join(","),tlLocal.pick,(s.last||{}).seq,JSON.stringify(s.hands||{}),state.youAreHost,appState.lang].join("|");renderRoomFrame(el,sig,()=>`
      <div class="cn-score">
        <span class="cn-score__role">🕰️ ${escapeHTML(t.tl_turn_of||"")} ${escapeHTML(s.turnName||"")}</span>
      </div>
      ${tlLastHtml(s,t)}
      <div class="card">${tlLineHtml(s,t,live)}</div>
      <div class="card">${tlMyCardsHtml(state,s,t)}</div>
      ${tlHandsHtml(state,s)}
      ${s.turnId!==Room.me?roomMoveOnHtml(state,`<button class="btn btn--ghost btn--sm" onclick="roomAct('skipTurn', { turnId: '${jsStringAttr(s.turnId||"")}' })">${escapeHTML(t.tl_skip||"")}</button>`):""}
      ${renderRoomPlayerStrip(state)}`)&&s.last&&typeof motionFirst=="function"&&motionFirst(["tl-last",roomDealKey(state),s.last.seq].join("|"))&&(playSound(s.last.right?"success":"wrong"),s.last.right||haptic("heavy")),refreshRoomPlayerStrip(el,state)},actionKey:state=>state.shared.phase==="gameover"?"over":""},TV_GAMES.timeline={sig:state=>["tl",state.shared.phase,state.shared.turnId,(state.shared.timeline||[]).map(c=>c.id).join(","),(state.shared.last||{}).seq,JSON.stringify(state.shared.hands||{}),state.youAreHost].join("|"),frame(state,t){const s=state.shared,host=html=>state.youAreHost?`<div class="tv-actions">${html}</div>`:"";return s.phase==="gameover"?`
        <div class="tv-vote">
          ${s.ended==="deck"?`<div class="tv-note tv-center-text">${escapeHTML(t.tl_deck_out||"")}</div>`:""}
          <div class="tv-title tv-center-text">${s.winnerName?"🏆 "+escapeHTML(tlWinnersText(s)):escapeHTML(t.tl_nobody||"")}</div>
          <div class="tv-scale">${tlLineHtml(s,t,!1)}</div>
          <div class="tv-scale">${renderScoreboard(s.board)}</div>
          ${host(tvBtn(t.play_again,"roomAct('playAgain', ROOM_GAMES.timeline.startPayload())")+tvBtn(t.room_another_game,"roomAct('backToHub')","ghost"))}
        </div>`:`
      <div class="tv-trivia">
        <div class="tv-top"><span class="tv-pill">🕰️ ${escapeHTML(t.tl_turn_of||"")} ${escapeHTML(s.turnName||"")}</span></div>
        <div class="tv-scale">${tlLineHtml(s,t,!1)}</div>
        ${s.last?`<div class="tv-note">${s.last.right?"✅":"❌"} ${escapeHTML(s.last.name||"")} · ${escapeHTML(s.last.text||"")} · ${s.last.y}</div>`:""}
        <div class="tv-scale">${tlHandsHtml(state,s)}</div>
        ${roomMoveOnHtml(state,`<div class="tv-actions">${tvBtn(t.tl_skip,`roomAct('skipTurn', { turnId: '${jsStringAttr(s.turnId||"")}' })`,"ghost")}</div>`)}
      </div>`}};