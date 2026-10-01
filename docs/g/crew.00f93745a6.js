const CREW_TABS=["month","champs","titles","nights"],CREW_TITLE_ICONS={fast:"⚡",liar:"🤥",detective:"🕵️",oracle:"🔮",cards:"🃏",brain:"🧠",words:"💬",sport:"🎳",luck:"🍀"},CREW_PROG_ICONS={buzz:"⚡",trivia:"🧠",liar:"🤥",catcher:"🕵️",detective:"🔎",sly:"🦊",strike:"🎳",chair:"🪑",prophet:"🔮",streak:"🔥",climb:"🚀"},CREW_RECORD_ICONS={best_bowling:"🎳",best_trivia:"🧠",night_points:"🌙",night_games:"🏅",streak:"🔥",month_nights:"📅"},crewPage={code:"",tab:"month",data:{},at:{},busy:{},drawn:""};function crewT(){return TRANSLATIONS[appState.lang]||{}}function crewFmt(s,vars){return String(s||"").replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]!==void 0?vars[k]:m)}function crewNum(n){return'<bdi dir="ltr" class="metric">'+(Number(n)||0)+"</bdi>"}function crewInitial(name){return escapeHTML(Array.from(String(name||"?").trim())[0]||"?")}function crewHue(name){let h=0;for(const ch of String(name||""))h=h*31+ch.codePointAt(0)>>>0;return h%6}function crewAvatar(name,cls){return`<span class="crew-av crew-av--c${crewHue(name)} ${cls||""}" aria-hidden="true">${crewInitial(name)}</span>`}function crewMonthName(month,withYear){const[y,m]=String(month||"").split("-").map(Number);if(!y||!m)return"";const d=new Date(y,m-1,1);let name="";try{name=d.toLocaleDateString(appState.lang==="ar"?"ar-EG-u-nu-latn":"en-GB",{month:"long"})}catch(e){name=String(m)}return withYear?name+" "+y:name}function crewDayName(date){const[y,m,dd]=String(date||"").split("-").map(Number);if(!y)return"";const d=new Date(y,m-1,dd);try{return d.toLocaleDateString(appState.lang==="ar"?"ar-EG-u-nu-latn":"en-GB",{weekday:"long",day:"numeric",month:"long"})}catch(e){return date}}function crewSeasonLine(t,month){const now=new Date,days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();return crewFmt(t.crew_season||"",{month:crewMonthName(month||now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")),day:now.getDate(),of:days})}function crewGameIcon(id){const hub=typeof ROOM_HUB_GAMES!="undefined"&&ROOM_HUB_GAMES.find(g=>g.id===id),cat=typeof CATALOG_BY_ID!="undefined"&&CATALOG_BY_ID[id],icon=hub&&hub.icon||cat&&cat.icon||"🎲";return iconHtml(icon)}function crewGameName(id,t){const hub=typeof ROOM_HUB_GAMES!="undefined"&&ROOM_HUB_GAMES.find(g=>g.id===id);return hub&&t[hub.key]||id}function renderCrew(){const view=document.getElementById("view-crew");if(!view)return;const t=crewT(),list=crewList();if(!list.length){crewPage.drawn="",view.innerHTML=`
      <div class="crew-empty">
        <div class="crew-card crew-card--ghost" aria-hidden="true">
          <div class="crew-card__top"><div><div class="crew-card__brand">${escapeHTML(t.crew_brand||"")}</div><div class="crew-card__name">${escapeHTML(t.crew_title||"")}</div></div><div class="crew-card__chip"></div></div>
          <div class="crew-card__mid"><div class="crew-card__faces">${["م","ك","ت","س"].map((x,i)=>`<span class="crew-av crew-av--c${i+1}">${x}</span>`).join("")}</div></div>
        </div>
        <h2 class="crew-empty__title">${escapeHTML(t.crew_empty_title||"")}</h2>
        <p class="crew-empty__text">${escapeHTML(t.crew_empty_text||"")}</p>
        <div class="btn-stack">
          <button type="button" class="btn btn--primary btn--lg" onclick="crewOpenCreate()">${escapeHTML(t.crew_create||"")}</button>
          <button type="button" class="btn btn--secondary" onclick="crewOpenJoin('')">${escapeHTML(t.crew_join||"")}</button>
        </div>
      </div>`;return}list.some(c=>c.code===crewPage.code)||(crewPage.code=list[0].code);const code=crewPage.code,data=crewPage.data[code]||crewCacheRead()[code]||null;crewDraw(view,list,code,data),!crewPage.busy[code]&&(!crewPage.at[code]||Date.now()-crewPage.at[code]>2e4)&&crewFetch(code)}async function crewFetch(code){crewPage.busy[code]=!0;const res=await crewAct(code,"get");crewPage.busy[code]=!1,crewPage.at[code]=Date.now();const t=crewT();res&&res.ok&&res.crew?(crewPage.data[code]=res.crew,crewCacheWrite(code,res.crew),crewWordsSync()):res&&(res.out||res.gone)?(crewCacheWrite(code,null),delete crewPage.data[code],showToast(res.gone?t.crew_err_gone||"":t.crew_err_out||"","info")):res&&res.net&&(crewPage.data[code]||showToast(t.crew_err_net||"","info")),appState.currentView==="crew"&&renderCrew()}function crewDraw(view,list,code,data){const t=crewT(),entry=list.find(c=>c.code===code)||{},name=data&&data.name||entry.name||"",members=data&&data.members||[],faces=members.slice(0,4).map(m=>crewAvatar(m.name)).join("")+(members.length>4?`<span class="crew-av crew-av--more">+${members.length-4}</span>`:""),switcher=list.length>1?`
    <div class="filter-row hscroll-fade crew-switch" role="group">
      ${list.map(c=>`<button type="button" class="filter-chip filter-chip--sm ${c.code===code?"is-active":""}" onclick="crewSwitch('${jsStringAttr(c.code)}')">${escapeHTML(c.name)}</button>`).join("")}
      <button type="button" class="filter-chip filter-chip--sm" onclick="crewOpenAdd()" aria-label="${escapeHTML(t.crew_add||"")}">＋</button>
    </div>`:"",first=crewPage.drawn!==code;crewPage.drawn=code,view.innerHTML=`
    <div class="crew-page">
      ${switcher}
      <div class="crew-side">
      <button type="button" class="crew-card ${first&&!motionOff()?"crew-card--in":""}" onclick="crewOpenMembers()" aria-label="${escapeHTML(t.crew_members||"")}">
        <div class="crew-card__top">
          <div>
            <div class="crew-card__brand">${escapeHTML(t.crew_brand||"")}</div>
            <div class="crew-card__name">${escapeHTML(name)}</div>
            <div class="crew-card__season">${escapeHTML(crewSeasonLine(t,data&&data.month))}</div>
          </div>
          <div class="crew-card__chip" aria-hidden="true"></div>
        </div>
        <div class="crew-card__mid">
          <div class="crew-card__code"><small>${escapeHTML(t.crew_code||"")}</small><span class="crew-card__codev" dir="ltr">${escapeHTML(code)}</span></div>
          <div class="crew-card__faces">${faces}</div>
        </div>
      </button>
      <div class="crew-actions">
        <button type="button" class="btn btn--secondary btn--sm" onclick="crewOpenInvite()"><span aria-hidden="true">📨</span> ${escapeHTML(t.crew_invite||"")}</button>
        <button type="button" class="btn btn--secondary btn--sm" onclick="crewOpenMembers()"><span aria-hidden="true">👥</span> ${escapeHTML(t.crew_members||"")}</button>
        <button type="button" class="btn btn--primary btn--sm" onclick="crewOpenRoom()"><span aria-hidden="true">🎮</span> ${escapeHTML(t.crew_open_room||"")}</button>
      </div>
      ${data?crewPacksHtml(data,t):""}
      </div>
      <div class="crew-main">
      <div class="segmented crew-tabs" role="tablist">
        ${CREW_TABS.map(k=>`<button type="button" role="tab" class="segmented__item ${crewPage.tab===k?"is-active":""}" aria-selected="${crewPage.tab===k}" onclick="crewTab('${k}')">${escapeHTML(t["crew_tab_"+k]||k)}</button>`).join("")}
      </div>
      <div id="crew-pane" class="crew-pane">${data?crewPaneHtml(crewPage.tab,data,t):'<div class="skel skel--hub"></div>'}</div>
      </div>
    </div>`,typeof watchScrollFade=="function"&&view.querySelectorAll(".hscroll-fade").forEach(watchScrollFade),data&&crewAfterPane(crewPage.tab,data),data&&crewAfterPacks(data)}const crewIsMgr=d=>!!d&&(typeof d.mgr=="boolean"?d.mgr:d.managerId===d.you);function crewPacksHtml(d,t){const packs=d.packs||[],mgr=crewIsMgr(d),chips=packs.map(p=>{const canOff=mgr||p.byId&&p.byId===d.you,kindLabel=p.kind==="words"?t.crew_pack_words||"":t.crew_pack_quiz||"";return`<span class="crew-pack" data-pack="${escapeHTML(p.code)}">
        <button type="button" class="crew-pack__open" onclick="crewOpenPack('${jsStringAttr(p.code)}', '${jsStringAttr(p.kind)}')">
          <span class="crew-pack__e" aria-hidden="true">${p.kind==="words"?"✍️":"🧠"}</span>
          <span class="crew-pack__t"><b dir="auto">${escapeHTML(p.title||p.code)}</b><small>${escapeHTML(kindLabel)}${p.by?" · "+escapeHTML(crewFmt(t.crew_pack_by,{name:p.by})):""}</small></span>
        </button>
        ${canOff?`<button type="button" class="iconbtn crew-pack__x" onclick="crewPackRemove('${jsStringAttr(p.code)}')" aria-label="${escapeHTML(crewFmt(t.crew_pack_remove,{t:p.title||p.code}))}" title="${escapeHTML(crewFmt(t.crew_pack_remove,{t:p.title||p.code}))}">✕</button>`:""}
      </span>`}).join("");return`
    <section class="crew-packs" aria-labelledby="crew-packs-h">
      <div class="crew-packs__head">
        <h3 class="crew-packs__title" id="crew-packs-h">${escapeHTML(t.crew_packs_title||"")}${packs.length?` <span class="crew-packs__n metric">${packs.length}</span>`:""}</h3>
        <button type="button" class="btn btn--ghost btn--xs btn--auto crew-packs__add" onclick="crewOpenPacksAdd()"><span aria-hidden="true">＋</span> ${escapeHTML(t.crew_packs_add||"")}</button>
      </div>
      ${packs.length?`<div class="crew-packs__list hscroll-fade">${chips}</div>`:`<p class="crew-packs__empty">${escapeHTML(t.crew_packs_empty||"")}</p>`}
    </section>`}function crewAfterPacks(d){const box=document.querySelector("#view-crew .crew-packs__list");if(!box||motionOff())return;const fresh=crewPacksChanged.justAdded;crewPacksChanged.justAdded="";const els=[...box.querySelectorAll(".crew-pack")],key="crewpacks|"+d.code+"|"+(d.packs||[]).map(p=>p.code).join(",");motionFirst(key)&&els.forEach((el,i)=>{fresh&&el.dataset.pack!==fresh||el.animate&&el.animate([{opacity:0,transform:"translateY(8px) scale(0.96)"},{opacity:1,transform:"none"}],{duration:300,delay:fresh?0:50*Math.min(i,8),easing:"cubic-bezier(0.2, 0.8, 0.2, 1)",fill:"backwards"})})}function crewOpenPacksAdd(){const t=crewT(),code=crewPage.code,on=new Set(crewPacksOf(code).map(p=>p.code)),mine=(typeof packsKnownCodes=="function"?packsKnownCodes():[]).filter(p=>!on.has(p.code)),rows=mine.map(p=>`
      <button type="button" class="crew-pick" onclick="crewPackAddTo('${jsStringAttr(code)}', '${jsStringAttr(p.code)}', '${jsStringAttr(p.kind)}', '${jsStringAttr(p.title||"")}')">
        <span class="crew-pick__icon" aria-hidden="true">${p.kind==="words"?"✍️":"🧠"}</span>
        <span class="crew-pick__name">${escapeHTML(p.title||p.code)}</span>
        <span class="crew-pick__code" dir="ltr">${escapeHTML(p.code)}</span>
      </button>`).join("");crewModal(`
    <div class="modal-icon" aria-hidden="true">📦</div>
    <div class="sheet__title">${escapeHTML(t.crew_packs_add_title||"")}</div>
    <p class="sheet__subtitle">${escapeHTML(mine.length?t.crew_packs_add_sub||"":t.crew_packs_none_here||"")}</p>
    ${mine.length?`<div class="modal-list crew-picks">${rows}</div>`:""}
    <div class="modal-actions">
      <button type="button" class="btn btn--secondary" onclick="closeModal('crew-modal'); catalogOpen('quizmaker')"><span aria-hidden="true">🧠</span> ${escapeHTML(t.crew_packs_make||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.cancel||"")}</button>
    </div>`)}function crewPackRemove(packCode){const t=crewT(),code=crewPage.code,p=crewPacksOf(code).find(x=>x.code===packCode)||{};showConfirmModal(crewFmt(t.crew_pack_remove_q,{t:crewIso(p.title||packCode)}),async()=>{const res=await crewRemovePack(code,packCode);if(!res||!res.ok){showToast(roomErrLocal(res&&res.error||"")||t.crew_err_net,"error");return}res.crew&&(crewPage.data[code]=res.crew,crewCacheWrite(code,res.crew)),showToast(t.crew_pack_removed||"","info"),crewPacksChanged()})}function crewSwitch(code){code!==crewPage.code&&(crewPage.code=code,crewTouch(code),haptic("light"),renderCrew())}function crewTab(k){if(CREW_TABS.indexOf(k)===-1||k===crewPage.tab)return;const from=CREW_TABS.indexOf(crewPage.tab);crewPage.tab=k,haptic("light");const view=document.getElementById("view-crew");if(!view)return;view.querySelectorAll(".crew-tabs .segmented__item").forEach((b,i)=>{const on=CREW_TABS[i]===k;b.classList.toggle("is-active",on),b.setAttribute("aria-selected",on?"true":"false")});const pane=document.getElementById("crew-pane"),data=crewPage.data[crewPage.code]||crewCacheRead()[crewPage.code];if(!(!pane||!data)&&(pane.innerHTML=crewPaneHtml(k,data,crewT()),crewAfterPane(k,data),!motionOff()&&pane.animate)){const rtl=document.documentElement.dir==="rtl",dx=(CREW_TABS.indexOf(k)>from?1:-1)*(rtl?-1:1)*28;pane.animate([{opacity:0,transform:`translateX(${dx}px)`},{opacity:1,transform:"none"}],{duration:260,easing:"cubic-bezier(0.2, 0.8, 0.2, 1)"})}}function crewPaneHtml(k,d,t){return k==="champs"?crewChampsHtml(d,t):k==="titles"?crewTitlesHtml(d,t):k==="nights"?crewNightsHtml(d,t):crewMonthHtml(d,t)}function crewAfterPane(k,d){const pane=document.getElementById("crew-pane");if(!pane)return;const key=["crewpane",d.code,k,d.nightCount,JSON.stringify(d.table.map(r=>r.won+"/"+r.points))].join("|");motionFirst(key)&&(pane.querySelectorAll("[data-count-to]").forEach(el=>{const to=Number(el.dataset.countTo)||0;to>0&&typeof countUp=="function"&&countUp(el,0,to)}),pane.querySelectorAll(".crew-pop").forEach((el,i)=>{el.animate&&el.animate([{opacity:0,transform:"translateY(10px) scale(0.97)"},{opacity:1,transform:"none"}],{duration:320,delay:60*Math.min(i,10),easing:"cubic-bezier(0.2, 0.8, 0.2, 1)",fill:"backwards"})}))}function crewMonthHtml(d,t){const table=d.table||[],won=table.filter(r=>r.won>0),nights=(d.nights||[]).filter(n=>String(n.date||"").slice(0,7)===d.month).length;let podium="";if(won.length){const top=won.slice(0,3),rankOf=r=>1+won.filter(x=>x.won>r.won||x.won===r.won&&x.points>r.points).length,rise=motionFirst(["crewpod",d.code,d.month,JSON.stringify(top.map(r=>r.id+r.won+r.points))].join("|")),atOf=i=>150+(top.length-1-i)*520;podium=`<div class="podium crew-podium${rise?" podium--rise":""}" ${rise?`data-reveal-ms="${atOf(0)+620}"`:""}>`+top.map((r,i)=>{const rank=Math.min(3,rankOf(r));return`<div class="podium__place podium__place--${i+1} podium__place--rank${rank}" style="--at:${atOf(i)}ms">
            <div class="podium__who">
              <span class="podium__medal" aria-hidden="true">${["🥇","🥈","🥉"][rank-1]}</span>
              <span class="podium__name">${escapeHTML(r.name)}</span>
              <span class="podium__score">${crewFmt(escapeHTML(r.won===1?t.crew_nights_1:t.crew_nights_n),{n:crewNum(r.won)})}</span>
              <span class="crew-podium__pts">${crewFmt(escapeHTML(t.crew_points_n||""),{n:crewNum(r.points)})}</span>
            </div>
            <div class="podium__block"><span class="metric">${rank}</span></div>
          </div>`}).join("")+"</div>"}const rows=(won.length?table.slice(Math.min(3,won.length)):table).map((r,i)=>{const pos=(won.length?Math.min(3,won.length):0)+i+1,you=r.id===d.you;return`<div class="crew-row crew-pop ${you?"is-you":""}">
        <span class="crew-row__n metric">${pos}</span>
        ${crewAvatar(r.name,"crew-av--s")}
        <span class="crew-row__who">${escapeHTML(r.name)}${you?` <span class="badge badge--accent">${escapeHTML(t.crew_you||"")}</span>`:""}</span>
        <span class="crew-row__stat"><b data-count-to="${r.won}">${r.won}</b> <small>${escapeHTML(t.crew_col_nights||"")}</small></span>
        <span class="crew-row__stat"><b data-count-to="${r.points}">${r.points}</b> <small>${escapeHTML(t.crew_col_points||"")}</small></span>
      </div>`}).join(""),champ=(d.champions||[])[0],title=(d.titles||[])[0],lastNight=(d.nights||[])[0],peek=`
    <div class="crew-peek">
      <button type="button" class="crew-peek__c crew-pop" onclick="crewTab('champs')"><span class="crew-peek__e" aria-hidden="true">🏆</span><b>${escapeHTML(t.crew_tab_champs||"")}</b><span>${champ?escapeHTML(champ.names.join("، ")):escapeHTML(t.crew_peek_none||"")}</span></button>
      <button type="button" class="crew-peek__c crew-pop" onclick="crewTab('titles')"><span class="crew-peek__e" aria-hidden="true">🏷️</span><b>${escapeHTML(t.crew_tab_titles||"")}</b><span>${title?escapeHTML((t["crew_t_"+title.key]||"")+": "+title.name):escapeHTML(t.crew_peek_none||"")}</span></button>
      <button type="button" class="crew-peek__c crew-pop" onclick="crewTab('nights')"><span class="crew-peek__e" aria-hidden="true">🗓️</span><b>${escapeHTML(t.crew_tab_nights||"")}</b><span>${lastNight?escapeHTML(crewFmt(t.crew_peek_last,{day:crewDayName(lastNight.date).split(/[،,]/)[0]})):escapeHTML(t.crew_peek_none||"")}</span></button>
    </div>`;return`${won.length?"":`
    <div class="crew-note crew-pop">
      <span class="crew-note__icon" aria-hidden="true">🌙</span>
      <span>${escapeHTML(nights?t.crew_month_nowin||"":t.crew_month_empty||"")}</span>
    </div>`}${podium}
    ${rows?`<div class="card crew-table">${rows}</div>`:""}
    <p class="crew-hint">${escapeHTML(t.crew_month_hint||"")}</p>
    ${peek}`}function crewChampsHtml(d,t){const list=d.champions||[];return list.length?`<div class="crew-wall">${list.map(c=>`
      <div class="crew-champ crew-pop">
        <span class="crew-champ__cup" aria-hidden="true">🏆</span>
        <span class="crew-champ__month">${escapeHTML(crewMonthName(c.month,!0))}</span>
        <span class="crew-champ__names">${c.names.map(n=>crewAvatar(n,"crew-av--s")+" "+escapeHTML(n)).join("<br>")}</span>
        <span class="crew-champ__stat">${crewFmt(escapeHTML(c.won===1?t.crew_nights_1:t.crew_nights_n),{n:crewNum(c.won)})} · ${crewFmt(escapeHTML(t.crew_points_n||""),{n:crewNum(c.points)})}</span>
      </div>`).join("")}</div>`:`<div class="crew-note crew-pop"><span class="crew-note__icon" aria-hidden="true">🏆</span><span>${escapeHTML(t.crew_champs_empty||"")}</span></div>`}function crewTitlesHtml(d,t){const titles=d.titles||[],records=d.records||[],titleCards=titles.length?`<div class="crew-titles">${titles.map(x=>`
      <div class="crew-title crew-pop">
        <span class="crew-title__e" aria-hidden="true">${CREW_TITLE_ICONS[x.key]||"🏷️"}</span>
        <b class="crew-title__name">${escapeHTML(t["crew_t_"+x.key]||x.key)}</b>
        <span class="crew-title__who">${crewAvatar(x.name,"crew-av--xs")} ${escapeHTML(x.name)}</span>
        <small class="crew-title__why">${crewFmt(escapeHTML(t["crew_tw_"+x.key]||""),{n:crewNum(x.n)})}</small>
      </div>`).join("")}</div>`:`<div class="crew-note crew-pop"><span class="crew-note__icon" aria-hidden="true">🏷️</span><span>${escapeHTML(t.crew_titles_empty||"")}</span></div>`,recordRows=records.length?`<div class="card crew-records">${records.map(r=>`
      <div class="crew-rec crew-pop">
        <span class="crew-rec__e" aria-hidden="true">${CREW_RECORD_ICONS[r.key]||"⭐"}</span>
        <span class="crew-rec__what">${escapeHTML(t["crew_r_"+r.key]||r.key)}<small>${escapeHTML(r.name)}${r.date?" · "+escapeHTML(r.key==="month_nights"?crewMonthName(r.date,!0):crewDayName(r.date)):""}</small></span>
        <b class="crew-rec__v" data-count-to="${r.value}">${r.value}</b>
      </div>`).join("")}</div>`:`<p class="crew-hint">${escapeHTML(t.crew_records_empty||"")}</p>`;return`${titleCards}
    <div class="section__head crew-sub"><h3 class="section__title">${escapeHTML(t.crew_records||"")}</h3><span class="section__rule"></span></div>
    ${recordRows}`}function crewNightsHtml(d,t){const list=d.nights||[];return list.length?`<div class="crew-nights">${list.map(n=>{const games=Array.from(new Set(n.games||[]));return`<div class="crew-night crew-pop">
        <div class="crew-night__head"><span class="crew-night__date">${escapeHTML(crewDayName(n.date))}</span>
          ${n.winners&&n.winners.length?`<span class="crew-night__win">👑 ${escapeHTML(n.winners.join("، "))}</span>`:""}</div>
        <div class="crew-night__games">${games.map(g=>`<span class="crew-night__game" title="${escapeHTML(crewGameName(g,t))}">${crewGameIcon(g)}<span>${escapeHTML(crewGameName(g,t))}</span></span>`).join("")}</div>
        <div class="crew-night__top">${(n.top||[]).map((r,i)=>`<span class="crew-night__who ${r.guest?"is-guest":""}">${["🥇","🥈","🥉"][i]||""} ${escapeHTML(r.name)} ${crewNum(r.p)}${r.guest?` <small>${escapeHTML(t.crew_guest||"")}</small>`:""}</span>`).join("")}</div>
        ${n.prog?crewNightProgHtml(n.prog,t):""}
      </div>`}).join("")}</div>`:`<div class="crew-note crew-pop"><span class="crew-note__icon" aria-hidden="true">🗓️</span><span>${escapeHTML(t.crew_nights_empty||"")}</span></div>`}function crewNightProgHtml(p,t){const champs=(p.champs||[]).join("، "),aw=(p.aw||[]).slice(0,6).map(a=>`<span class="crew-night__aw" title="${escapeHTML(t["prog_aw_"+a.k]||a.k)}"><span aria-hidden="true">${CREW_PROG_ICONS[a.k]||"🏅"}</span> <b>${escapeHTML(t["prog_aw_"+a.k]||a.k)}</b> ${escapeHTML(a.name)}</span>`).join("");return`<div class="crew-night__prog">
      <span class="crew-prog-badge"><span aria-hidden="true">🌙</span> ${escapeHTML(t.crew_prog_badge||"")}${p.n>1?` <span class="metric">×${p.n}</span>`:""}</span>
      ${champs?`<span class="crew-night__pchamp">${escapeHTML(crewFmt(t.crew_prog_champ,{name:champs}))}</span>`:""}
      ${aw?`<div class="crew-night__aws">${aw}</div>`:""}
    </div>`}function crewOpenAdd(){const t=crewT();crewModal(`
    <div class="modal-icon" aria-hidden="true">🎉</div>
    <div class="sheet__title">${escapeHTML(t.crew_add||"")}</div>
    <div class="modal-actions">
      <button type="button" class="btn btn--primary btn--lg" onclick="crewOpenCreate()">${escapeHTML(t.crew_create||"")}</button>
      <button type="button" class="btn btn--secondary" onclick="crewOpenJoin('')">${escapeHTML(t.crew_join||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.cancel||"")}</button>
    </div>`)}function crewOpenCreate(){const t=crewT(),me=typeof roomName!="undefined"&&roomName.get()||"";crewModal(`
    <div class="modal-icon" aria-hidden="true">🎉</div>
    <div class="sheet__title">${escapeHTML(t.crew_create||"")}</div>
    <p class="sheet__subtitle">${escapeHTML(t.crew_create_sub||"")}</p>
    <label class="field"><span class="field__label">${escapeHTML(t.crew_name_label||"")}</span>
      <input type="text" id="crew-f-name" maxlength="30" autocomplete="off" placeholder="${escapeHTML(t.crew_name_ph||"")}" onkeydown="if(event.key==='Enter') crewCreateGo()"></label>
    <label class="field"><span class="field__label">${escapeHTML(t.crew_me_label||"")}</span>
      <input type="text" id="crew-f-me" maxlength="24" autocomplete="off" value="${escapeHTML(me)}" placeholder="${escapeHTML(t.placeholder_name||"")}" onkeydown="if(event.key==='Enter') crewCreateGo()"></label>
    <p class="field__error hidden" id="crew-f-err" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn--primary btn--lg" id="crew-f-go" onclick="crewCreateGo()">${escapeHTML(t.crew_create_go||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.cancel||"")}</button>
    </div>`),setTimeout(()=>{const el=document.getElementById("crew-f-name");el&&el.focus()},320)}function crewFieldError(msg,fieldId){const err=document.getElementById("crew-f-err");err&&(err.textContent=msg||"",err.classList.toggle("hidden",!msg));const f=fieldId&&document.getElementById(fieldId);f&&msg&&(f.focus(),typeof blockStartAt=="function"&&blockStartAt(f))}function crewBusy(on){const b=document.getElementById("crew-f-go");b&&(b.disabled=!!on)}async function crewCreateGo(){const t=crewT(),name=String((document.getElementById("crew-f-name")||{}).value||"").trim(),me=String((document.getElementById("crew-f-me")||{}).value||"").trim();if(!name)return crewFieldError(t.crew_err_name,"crew-f-name");if(!me)return crewFieldError(t.crew_err_me,"crew-f-me");crewBusy(!0);const res=await crewApi("create",{name,me});if(crewBusy(!1),!res||!res.ok)return crewFieldError(roomErrLocal(res&&res.error||"")||t.crew_err_net);crewJoined(res,me),showToast(crewFmt(t.crew_made,{name:res.crew.name}),"success"),typeof confetti=="function"&&!motionOff()&&confetti({particleCount:70,spread:70,origin:{y:.4}})}function crewJoined(res,me){crewRemember({code:res.code,name:res.crew.name,memberId:res.memberId,key:res.key,me},!0),crewPage.code=res.code,crewPage.tab="month",crewPage.data[res.code]=res.crew,crewPage.at[res.code]=Date.now(),crewCacheWrite(res.code,res.crew),(res.crew.members||[]).forEach(m=>{typeof addToPlayerLibrary=="function"&&addToPlayerLibrary(m.name)}),typeof roomName!="undefined"&&!String(roomName.get()||"").trim()&&me&&roomName.set(me),closeModal("crew-modal"),appState.currentView!=="crew"?setView("crew"):renderCrew(),typeof Room!="undefined"&&Room.state&&Room.state.crew&&Room.state.crew.code===res.code&&!Room.state.youAreScreen&&(Room.act("crewMe",{code:res.code,key:res.key}).catch(()=>{}),typeof routeRoomState=="function"&&onRoomView()&&routeRoomState(Room.state))}let crewJoinPeek=null;function crewOpenJoin(code){const t=crewT();crewJoinPeek=null,crewModal(`
    <div class="modal-icon" aria-hidden="true">🎉</div>
    <div class="sheet__title">${escapeHTML(t.crew_join||"")}</div>
    <p class="sheet__subtitle">${escapeHTML(t.crew_join_sub||"")}</p>
    <label class="field"><span class="field__label">${escapeHTML(t.crew_code||"")}</span>
      <input type="text" id="crew-f-code" maxlength="80" autocomplete="off" autocapitalize="characters" dir="ltr" class="crew-codein" value="${escapeHTML(code||"")}" placeholder="ABCDEF" onkeydown="if(event.key==='Enter') crewPeekGo()"></label>
    <p class="field__error hidden" id="crew-f-err" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn--primary btn--lg" id="crew-f-go" onclick="crewPeekGo()">${escapeHTML(t.crew_next||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.cancel||"")}</button>
    </div>`),code?crewPeekGo():setTimeout(()=>{const el=document.getElementById("crew-f-code");el&&el.focus()},320)}function crewCodeOf(text){const s=String(text||"").trim(),m=/(?:[?&]crew=|\/s\/)([A-Za-z]{6})/.exec(s),c=(m?m[1]:s).toUpperCase().replace(/[^A-Z]/g,"");return/^[A-Z]{6}$/.test(c)?c:""}async function crewPeekGo(){const t=crewT(),code=crewCodeOf((document.getElementById("crew-f-code")||{}).value);if(!code)return crewFieldError(t.crew_err_code,"crew-f-code");if(crewEntry(code)){closeModal("crew-modal"),crewPage.code=code,crewTouch(code),appState.currentView!=="crew"?setView("crew"):renderCrew();return}crewBusy(!0);const res=await crewApi("peek",{code});if(crewBusy(!1),!res||!res.ok)return crewFieldError(res&&res.error==="CREW_NOT_FOUND"?t.crew_err_notfound:roomErrLocal(res&&res.error||"")||t.crew_err_net,"crew-f-code");crewJoinPeek=res.crew,crewWhoSheet()}function crewWhoSheet(guessNew){const t=crewT(),c=crewJoinPeek;if(!c)return;const me=typeof roomName!="undefined"&&roomName.get()||"",match=c.members.find(m=>typeof samePlayer=="function"?samePlayer(m.name,me):m.name===me);crewModal(`
    <div class="modal-icon" aria-hidden="true">🎉</div>
    <div class="sheet__title">${escapeHTML(c.name)}</div>
    <p class="sheet__subtitle">${escapeHTML(t.crew_who||"")}</p>
    <div class="crew-who">${c.members.map(m=>`
      <button type="button" class="crew-who__m ${match&&match.id===m.id?"is-guess":""}" onclick="crewClaim('${jsStringAttr(m.id)}')">
        ${crewAvatar(m.name)}<span>${escapeHTML(m.name)}</span>
      </button>`).join("")}
    </div>
    <details class="crew-new" ${guessNew||!c.members.length?"open":""}>
      <summary class="btn btn--secondary">${escapeHTML(t.crew_im_new||"")}</summary>
      <label class="field"><span class="field__label">${escapeHTML(t.crew_me_label||"")}</span>
        <input type="text" id="crew-f-me" maxlength="24" autocomplete="off" value="${escapeHTML(match?"":me)}" placeholder="${escapeHTML(t.placeholder_name||"")}" onkeydown="if(event.key==='Enter') crewJoinNew()"></label>
      <button type="button" class="btn btn--primary" id="crew-f-go" onclick="crewJoinNew()">${escapeHTML(t.crew_join_go||"")}</button>
    </details>
    <p class="field__error hidden" id="crew-f-err" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.cancel||"")}</button>
    </div>`)}async function crewClaim(memberId){const t=crewT(),c=crewJoinPeek;if(!c)return;const res=await crewApi("join",{code:c.code,claim:memberId});if(!res||!res.ok)return crewFieldError(roomErrLocal(res&&res.error||"")||t.crew_err_net);const m=(res.crew.members||[]).find(x=>x.id===res.memberId);crewJoined(res,m?m.name:""),showToast(crewFmt(t.crew_welcome,{name:res.crew.name}),"success")}async function crewJoinNew(){const t=crewT(),c=crewJoinPeek;if(!c)return;const me=String((document.getElementById("crew-f-me")||{}).value||"").trim();if(!me)return crewFieldError(t.crew_err_me,"crew-f-me");crewBusy(!0);const res=await crewApi("join",{code:c.code,name:me});if(crewBusy(!1),res&&res.error==="NAME_TAKEN")return crewFieldError(crewFmt(t.crew_err_taken,{name:me}),"crew-f-me");if(!res||!res.ok)return crewFieldError(roomErrLocal(res&&res.error||"")||t.crew_err_net);crewJoined(res,me),showToast(crewFmt(t.crew_welcome,{name:res.crew.name}),"success"),typeof confetti=="function"&&!motionOff()&&confetti({particleCount:60,spread:70,origin:{y:.4}})}function crewOpenInvite(){const t=crewT(),code=crewPage.code,e=crewEntry(code)||{},url=crewInviteUrl(code,e.name);crewModal(`
    <div class="sheet__title">${escapeHTML(crewFmt(t.crew_invite_title,{name:e.name||""}))}</div>
    <p class="sheet__subtitle">${escapeHTML(t.crew_invite_sub||"")}</p>
    <div class="crew-invite__code" dir="ltr">${escapeHTML(code)}</div>
    <div id="crew-qr" class="room-qr crew-qr" aria-hidden="true"></div>
    <div class="modal-actions">
      <button type="button" class="btn btn--primary btn--lg" onclick="crewShare()"><span aria-hidden="true">🔗</span> ${escapeHTML(t.crew_share||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.close||t.cancel||"")}</button>
    </div>`),renderJoinQR("crew-qr",url)}function crewShare(){const t=crewT(),e=crewEntry(crewPage.code)||{};return shareOrCopy(crewInviteUrl(crewPage.code,e.name),crewFmt(t.crew_share_text,{name:e.name||"",code:crewPage.code}),t.room_link_copied||"")}function crewOpenRoom(){crewTouch(crewPage.code),typeof roomCreateEmpty=="function"&&roomCreateEmpty()}function crewOpenMembers(){const t=crewT(),code=crewPage.code,d=crewPage.data[code]||crewCacheRead()[code];if(!d)return;const mgr=crewIsMgr(d),rows=d.members.map(m=>`
    <div class="crew-mem ${m.id===d.you?"is-you":""}">
      ${crewAvatar(m.name)}
      <span class="crew-mem__name">${escapeHTML(m.name)}
        ${m.id===d.managerId?`<span class="badge lobby-row__host"><span aria-hidden="true">👑</span> ${escapeHTML(t.crew_manager||"")}</span>`:""}
        ${m.id===d.you?`<span class="badge badge--accent">${escapeHTML(t.crew_you||"")}</span>`:""}</span>
      ${mgr&&m.id!==d.you?`<span class="crew-mem__acts">
        <button type="button" class="iconbtn" onclick="crewRenameMember('${jsStringAttr(m.id)}')" aria-label="${escapeHTML(t.crew_rename_member||"")}" title="${escapeHTML(t.crew_rename_member||"")}">✏️</button>
        <button type="button" class="iconbtn" onclick="crewHandOver('${jsStringAttr(m.id)}')" aria-label="${escapeHTML(t.crew_hand_over||"")}" title="${escapeHTML(t.crew_hand_over||"")}">👑</button>
        <button type="button" class="iconbtn" onclick="crewRemove('${jsStringAttr(m.id)}')" aria-label="${escapeHTML(t.crew_remove||"")}" title="${escapeHTML(t.crew_remove||"")}">✕</button>
      </span>`:mgr?`<span class="crew-mem__acts"><button type="button" class="iconbtn" onclick="crewRenameMember('${jsStringAttr(m.id)}')" aria-label="${escapeHTML(t.crew_rename_member||"")}" title="${escapeHTML(t.crew_rename_member||"")}">✏️</button></span>`:""}
    </div>`).join(""),pairHere=!mgr&&d.you&&d.you===d.managerId?`
    <label class="field"><span class="field__label">${escapeHTML(t.crew_pair_here||"")}</span>
      <input type="text" id="crew-f-pair" inputmode="numeric" maxlength="7" autocomplete="one-time-code" dir="ltr" placeholder="${escapeHTML(t.crew_pair_ph||"")}" onkeydown="if(event.key==='Enter') crewPairGo()"></label>
    <button type="button" class="btn btn--primary" id="crew-f-go" onclick="crewPairGo()">${escapeHTML(t.confirm||"")}</button>
    <p class="field__error hidden" id="crew-f-err" role="alert"></p>`:"";crewModal(`
    <div class="sheet__title">${escapeHTML(crewFmt(t.crew_members_title,{n:d.members.length}))}</div>
    <p class="sheet__subtitle">${escapeHTML(mgr?t.crew_members_mgr:t.crew_members_sub)}</p>
    <div class="modal-list crew-mems">${rows}</div>${pairHere}
    <div class="modal-actions">
      ${mgr?`<button type="button" class="btn btn--secondary" onclick="crewRenameCrew()">✏️ ${escapeHTML(t.crew_rename||"")}</button>`:""}
      ${mgr?`<button type="button" class="btn btn--secondary" onclick="crewPairCode()"><span aria-hidden="true">📱</span> ${escapeHTML(t.crew_pair_add||"")}</button>`:""}
      <button type="button" class="btn btn--danger-soft" onclick="crewLeave()">${escapeHTML(t.crew_leave||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="closeModal('crew-modal')">${escapeHTML(t.close||t.cancel||"")}</button>
    </div>`)}function crewAskName(title,value,go){const t=crewT();crewAskName.go=go,crewModal(`
    <div class="sheet__title">${escapeHTML(title)}</div>
    <input type="text" id="crew-f-one" maxlength="30" autocomplete="off" value="${escapeHTML(value||"")}" onkeydown="if(event.key==='Enter') crewAskNameGo()">
    <p class="field__error hidden" id="crew-f-err" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn--primary btn--lg" id="crew-f-go" onclick="crewAskNameGo()">${escapeHTML(t.confirm||"")}</button>
      <button type="button" class="btn btn--ghost" onclick="crewOpenMembers()">${escapeHTML(t.cancel||"")}</button>
    </div>`),setTimeout(()=>{const el=document.getElementById("crew-f-one");el&&(el.focus(),el.select())},320)}async function crewAskNameGo(){const v=String((document.getElementById("crew-f-one")||{}).value||"").trim();if(!v)return crewFieldError(crewT().crew_err_me,"crew-f-one");crewAskName.go&&await crewAskName.go(v)}async function crewMove(action,payload,reopen){const code=crewPage.code;crewBusy(!0);const res=await crewAct(code,action,payload);return crewBusy(!1),!res||!res.ok?(crewFieldError(roomErrLocal(res&&res.error||"")||crewT().crew_err_net),showToast(roomErrLocal(res&&res.error||"")||crewT().crew_err_net,"error"),null):(res.crew&&(crewPage.data[code]=res.crew,crewCacheWrite(code,res.crew)),reopen?crewOpenMembers():closeModal("crew-modal"),renderCrew(),res)}function crewRenameCrew(){const d=crewPage.data[crewPage.code]||{};crewAskName(crewT().crew_rename||"",d.name,v=>crewMove("rename",{name:v},!0))}function crewRenameMember(id){const m=((crewPage.data[crewPage.code]||{}).members||[]).find(x=>x.id===id)||{};crewAskName(crewT().crew_rename_member||"",m.name,v=>crewMove("renameMember",{id,name:v},!0))}function crewHandOver(id){const t=crewT(),m=((crewPage.data[crewPage.code]||{}).members||[]).find(x=>x.id===id)||{};closeModal("crew-modal"),showConfirmModal(crewFmt(t.crew_hand_over_q,{name:m.name||""}),()=>crewMove("handOver",{id},!0))}function crewRemove(id){const t=crewT(),m=((crewPage.data[crewPage.code]||{}).members||[]).find(x=>x.id===id)||{};closeModal("crew-modal"),showConfirmModal(crewFmt(t.crew_remove_q,{name:m.name||""}),()=>crewMove("removeMember",{id},!0))}async function crewPairCode(){const t=crewT(),code=crewPage.code,res=await crewAct(code,"pairCode");if(!res||!res.ok||!res.pair){showToast(roomErrLocal(res&&res.error||"")||t.crew_err_net,"error");return}crewModal(`
    <div class="modal-icon" aria-hidden="true">📱</div>
    <div class="sheet__title">${escapeHTML(t.crew_pair_title||"")}</div>
    <p class="sheet__subtitle">${escapeHTML(t.crew_pair_sub||"")}</p>
    <div class="crew-invite__code" dir="ltr">${escapeHTML(res.pair.code)}</div>
    <div class="modal-actions">
      <button type="button" class="btn btn--ghost" onclick="crewOpenMembers()">${escapeHTML(t.close||t.cancel||"")}</button>
    </div>`)}async function crewPairGo(){const t=crewT(),typed=String((document.getElementById("crew-f-pair")||{}).value||"").replace(/[^0-9٠-٩]/g,"").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));if(typed.length!==6)return crewFieldError(t.crew_pair_ph||"","crew-f-pair");const res=await crewMove("pair",{code:typed},!0);res&&res.crew&&crewIsMgr(res.crew)&&showToast(t.crew_pair_ok||"","success")}function crewLeave(){const t=crewT(),code=crewPage.code,e=crewEntry(code)||{};closeModal("crew-modal"),showConfirmModal(crewFmt(t.crew_leave_q,{name:e.name||""}),async()=>{const res=await crewAct(code,"leave");res&&(res.ok||res.out||res.gone)?(crewForget(code),crewCacheWrite(code,null),delete crewPage.data[code],crewPage.code="",showToast((res.phoneOnly?t.crew_left_phone:t.crew_left)||"","info"),renderCrew()):showToast(roomErrLocal(res&&res.error||"")||t.crew_err_net,"error")})}typeof onLanguageChange=="function"&&onLanguageChange(view=>{view==="crew"&&renderCrew()});