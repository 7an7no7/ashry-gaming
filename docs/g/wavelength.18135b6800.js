const WL_BANDS=[{within:15,points:2},{within:8,points:3},{within:3,points:4}],wave={dragging:!1,lastInput:0,sendTimer:null,pending:null};ROOM_GAMES.wavelength={lobbyOptions:state=>langLobbyOptions(state,"wl_hint")+autoNextLobbyHtml(state,"wavelength"),startPayload:()=>({lang:VOTE_LANG(),autoNext:autoNextChoice("wavelength")}),render(state){appState.currentView!=="room-wavelength"&&setView("room-wavelength");const el=document.getElementById("view-room-wavelength");if(!el)return;const t=TRANSLATIONS[appState.lang],s=state.shared,psychicAway=s.phase==="clue"&&s.psychicId!==Room.me&&!wlOnline(state,s.psychicId),sig=["wl",s.round,s.phase,state.youAreHost,psychicAway,appState.lang].join("|");renderRoomFrame(el,sig,()=>wavelengthFrame(state,t,psychicAway),"wl-clue|"+s.round)&&s.phase==="results"&&wlRevealRun(el,state),paintWavelengthDial(s.dial),refreshRoomPlayerStrip(el,state)}};function wlOnline(state,id){const p=state.players.find(x=>x.id===id);return!!(p&&p.online)}function wavelengthFrame(state,t,psychicAway){const s=state.shared,you=state.you||{},amPsychic=s.psychicId===Room.me,canTurn=s.phase==="dial"&&!amPsychic&&state.inGame!==!1,target=s.phase==="results"?s.target:amPsychic&&typeof you.target=="number"?you.target:null,band=b=>{const from=Math.max(0,target-b.within),to=Math.min(100,target+b.within);return`<div class="wl-zone wl-zone--${b.points}" style="left:${from}%; width:${to-from}%"></div>`},wr=s.phase==="results"?wlReveal(state,!1):null,header=`
    <div class="cn-score">
      <span class="cn-score__role">🧠 ${amPsychic?t.psychic_role||"":(t.wl_psychic||"")+": <bdi>"+escapeHTML(s.psychicName||"")+"</bdi>"}</span>
      <span class="badge badge--accent">${t.round||""} ${s.round} · ${t.wl_team_score||""} ${s.scores&&s.scores.team||0}</span>
    </div>`,spectrum=`
    <div class="card">
      ${s.clue?`
        <div class="eyebrow" style="text-align:center">${t.wl_clue||""}</div>
        <div class="prompt-text" style="text-align:center">«${escapeHTML(s.clue)}»</div>`:""}
      <div class="wl-spectrum" dir="ltr">
        <div class="wl-labels">
          <span class="wl-label">${escapeHTML(s.leftLabel||"")}</span>
          <span class="wl-label">${escapeHTML(s.rightLabel||"")}</span>
        </div>
        <div class="wl-bar">
          ${target!==null?WL_BANDS.map(band).join("")+`<div class="wl-target" style="left:${target}%"></div>`:""}
          ${wr?wr.shutter:""}
          <div class="wl-needle ${wr&&wr.st.on?"wl-needle--pulse":""}" id="wl-needle" style="left:${s.dial}%"></div>
        </div>
        ${canTurn?`
          <input type="range" id="wl-dial" class="wl-dial" min="0" max="100" step="1" value="${s.dial}"
                 aria-label="${escapeHTML(t.team_adjust_dial||"")}"
                 oninput="onWavelengthDial(this.value)"
                 onpointerdown="wave.dragging = true"
                 onpointerup="endWavelengthDrag()" onpointercancel="endWavelengthDrag()"
                 onchange="endWavelengthDrag()">`:""}
      </div>
      ${amPsychic&&s.phase!=="results"?`<p class="field__hint" style="text-align:center">${t.wl_zone_hint||""}</p>`:""}
    </div>`;let panel="";if(s.phase==="clue")amPsychic?panel=`
        <div class="card card--accent">
          <div class="card__title" style="text-align:center">${t.psychic_hint||""}</div>
          <div class="input-group">
            <input id="wl-clue" type="text" autocomplete="off" maxlength="60"
                   placeholder="${escapeHTML(t.enter_clue_ph||"")}"
                   onkeydown="if(event.key==='Enter') submitWavelengthClue()">
            <button onclick="submitWavelengthClue()" class="btn btn--primary" aria-label="${escapeHTML(t.send_clue_btn||"")}">↵</button>
          </div>
        </div>`:panel=`
        <div class="waiting-note"><span class="animate-pulse">🧠</span> ${t.wl_waiting_clue||""} <bdi>${escapeHTML(s.psychicName||"")}</bdi>…</div>
        ${psychicAway?roomMoveOnHtml(state,`
          <div class="btn-stack">
            <button class="btn btn--ghost btn--sm" onclick="roomAct('nextRound', ${roomNextArgs(state,{skip:!0})})">${t.wl_skip_psychic||""}</button>
          </div>`):""}`;else if(s.phase==="dial")panel=`
      ${amPsychic?`<div class="waiting-note">🤐 ${t.wl_psychic_quiet||""}</div>`:`<p class="field__hint" style="text-align:center">${t.team_adjust_dial||""}</p>`}
      ${roomMoveOnHtml(state,`<div class="btn-stack"><button onclick="lockWavelengthDial()" class="btn btn--primary btn--lg">${t.lock_dial_btn||""}</button></div>`,`<div class="waiting-note">${t.wl_host_locks||""}</div>`)}`;else if(s.phase==="results"){const verdict={4:t.bullseye,3:t.very_close,2:t.close_points}[s.pointsEarned]||t.miss_points;panel=`
      <div class="card ${s.pointsEarned?"plate-success":"plate-danger"}" style="text-align:center"${wr.st.at(wr.verdictAt,"pop")}>
        <div class="card__title" style="margin:0">${verdict||""}</div>
        ${wr.pointsHtml}
        <p style="margin: var(--sp-1) 0 0">${t.wl_dial||""} ${s.dial} · ${t.wl_target||""} ${s.target}</p>
      </div>
      ${renderRoundFooter(state,t.next_round||"")}`}return header+spectrum+panel+renderRoomPlayerStrip(state)}const WAVE_SEND_MS=150;function onWavelengthDial(value){const v=Math.max(0,Math.min(100,Math.round(Number(value))));wave.lastInput=Date.now(),wave.pending=v;const needle=document.getElementById("wl-needle");needle&&(needle.style.left=v+"%"),!wave.sendTimer&&(wave.sendTimer=setTimeout(()=>{wave.sendTimer=null;const next=wave.pending;wave.pending=null,next!==null&&roomAct("setDial",{dial:next})},WAVE_SEND_MS))}function endWavelengthDrag(){wave.dragging=!1,wave.lastInput=Date.now()}function paintWavelengthDial(dial){if(wave.dragging||Date.now()-wave.lastInput<1500)return;const v=Number(dial),needle=document.getElementById("wl-needle");needle&&(needle.style.left=v+"%");const slider=document.getElementById("wl-dial");slider&&Number(slider.value)!==v&&(slider.value=v)}async function submitWavelengthClue(){const input=document.getElementById("wl-clue"),clue=input?input.value.trim():"";if(clue){input&&(input.disabled=!0);try{await Room.act("giveClue",{clue})}catch(err){input&&(input.disabled=!1),showToast(err.message||"تعذر الإرسال","error")}}}async function lockWavelengthDial(){if(wave.sendTimer&&wave.pending!==null){clearTimeout(wave.sendTimer),wave.sendTimer=null;const v=wave.pending;wave.pending=null;try{await Room.act("setDial",{dial:v})}catch(e){}}roomAct("lockDial")}const WL_WIPE_AT=900;function wlReveal(state,tv){const s=state.shared,st=stageReveal(["wl-rev",tv?"tv":"ph",roomDealKey(state),s.round].join("|"),state),verdictAt=WL_WIPE_AT+900,pts=Number(s.pointsEarned)||0;return{st,verdictAt,shutter:st.on?`<div class="wl-shutter" style="--rv-at:${WL_WIPE_AT}ms" aria-hidden="true"></div>`:"",pointsHtml:`<div class="wl-points metric" dir="ltr">+${st.count(pts,verdictAt+250)}</div>`}}function wlRevealRun(root,state){const box=root&&root.querySelector(".wl-bar");stageRun(root,state),!(!box||!box.querySelector(".wl-shutter"))&&(stageSound(state,"tick",200),stageSound(state,"tick",550),(Number(state.shared.pointsEarned)||0)>0&&stageSound(state,"success",WL_WIPE_AT+800),setTimeout(()=>{const sh=box.querySelector(".wl-shutter");sh&&sh.remove()},WL_WIPE_AT+1200))}