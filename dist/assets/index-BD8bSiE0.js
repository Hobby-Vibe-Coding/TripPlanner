(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(){return localStorage.getItem(`tp_token`)}function t(e){localStorage.setItem(`tp_token`,e)}function n(e){let t=(e||``).match(/(\d+):(\d+)\s*(AM|PM)/i);if(!t)return null;let n=parseInt(t[1]),r=parseInt(t[2]),i=t[3].toUpperCase();return i===`PM`&&n!==12&&(n+=12),i===`AM`&&n===12&&(n=0),n*60+r}function r(e){let t=Math.floor(e/60)%24,n=e%60,r=t<12?`AM`:`PM`;return`${t%12==0?12:t%12}:${String(n).padStart(2,`0`)} ${r}`}function i(e){let t=n(e);return t===null?e:r(t+60)}function a(e,t){return t<e.length?e[t]:i(e[e.length-1])}function o(){let e=[];for(let t=0;t<24;t++)for(let n=0;n<60;n+=30)e.push(r(t*60+n));return e}function s(e,t,i){let a=n(e),o=n(t);if(a===null||o===null||o<a)return[];let s=[];for(let e=a;e<=o;e+=i)s.push(r(e));return s}var c=[`7:00 AM`,`8:00 AM`,`9:00 AM`,`10:00 AM`,`11:00 AM`,`12:00 PM`,`1:00 PM`,`2:00 PM`,`3:00 PM`,`4:00 PM`,`5:00 PM`,`6:00 PM`,`7:00 PM`,`8:00 PM`,`9:00 PM`,`10:00 PM`,`11:00 PM`],l=`America/Adak.Pacific/Honolulu.America/Anchorage.America/Juneau.America/Metlakatla.America/Nome.America/Sitka.America/Yakutat.America/Los_Angeles.America/Boise.America/Denver.America/Phoenix.America/Chicago.America/Indiana/Knox.America/Indiana/Tell_City.America/Indiana/Indianapolis.America/Indiana/Marengo.America/Indiana/Petersburg.America/Indiana/Vevay.America/Indiana/Vincennes.America/Indiana/Winamac.America/Kentucky/Louisville.America/Kentucky/Monticello.America/Detroit.America/New_York.America/North_Dakota/Beulah.America/North_Dakota/Center.America/North_Dakota/New_Salem.America/Sao_Paulo.Atlantic/Reykjavik.Europe/London.Europe/Paris.Europe/Berlin.Europe/Helsinki.Europe/Moscow.Asia/Dubai.Asia/Kolkata.Asia/Bangkok.Asia/Singapore.Asia/Ho_Chi_Minh.Asia/Tokyo.Asia/Seoul.Asia/Shanghai.Australia/Sydney.Pacific/Auckland`.split(`.`);function u(e){return l.map(t=>`<option value="${t}" ${t===e?`selected`:``}>${t.replace(/_/g,` `)}</option>`).join(``)}function d(){let e=document.getElementById(`tz-clock`);if(!e)return;let t=currentTrip();if(t?.timezone)try{e.textContent=new Intl.DateTimeFormat(void 0,{timeZone:t.timezone,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}).format(new Date)}catch{e.textContent=`—`}}var f=null;function p(){m(),d(),f=setInterval(d,1e3)}function m(){f&&=(clearInterval(f),null)}var h=null;function g(){h&&=(clearInterval(h),null)}function _(){g(),v(),h=setInterval(v,6e4)}function v(){ce(),le()}function ee(e){return String(e).padStart(2,`0`)}function y(e){return`${e.getFullYear()}-${ee(e.getMonth()+1)}-${ee(e.getDate())}`}function te(e,t){try{return new Intl.DateTimeFormat(`en-CA`,{timeZone:t,year:`numeric`,month:`2-digit`,day:`2-digit`}).format(e)}catch{return y(e)}}function ne(e,t){let n=new Date(e);return n.setDate(n.getDate()+t),y(n)}function re(e){return(e?.timezone||``).trim()||null}function ie(e){let t=new Date,n=re(e);return n?te(t,n):y(t)}function ae(e,t){let n=new Intl.DateTimeFormat(`en-US`,{timeZone:e,year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}),r=Object.fromEntries(n.formatToParts(t).filter(e=>e.type!==`literal`).map(e=>[e.type,e.value]));return Date.UTC(+r.year,r.month-1,+r.day,+r.hour,+r.minute,+r.second)-t.getTime()}function oe(e,t,n,r,i,a){let o=Date.UTC(e,t-1,n,r,i,0);return new Date(o-ae(a,new Date(o)))}function se(e,t,n){if(!t)return null;let r=t.match(/(\d+):(\d+)\s*(AM|PM)/i);if(!r)return null;let i=parseInt(r[1]),a=parseInt(r[2]),o=r[3].toUpperCase();if(o===`PM`&&i!==12&&(i+=12),o===`AM`&&i===12&&(i=0),!n){let t=new Date(e);return t.setHours(i,a,0,0),t}return oe(e.getFullYear(),e.getMonth()+1,e.getDate(),i,a,n)}function ce(){let e=currentTrip();if(!e||!e.startDate)return;let t=new Date,n=re(e),r=ie(e),i=e.timeSlots||c,a=fe(e.startDate);a&&document.querySelectorAll(`.itin-cell.slot.filled`).forEach(e=>{let o=parseInt(e.dataset.didx),s=parseInt(e.dataset.sidx),c=parseInt(e.dataset.span)||1;if(ne(a,o)<r){e.classList.add(`slot-past`);return}let l=new Date(a);l.setDate(l.getDate()+o);let u=se(l,i[s],n),d=se(l,i[Math.min(s+c,i.length-1)],n);if(!u||!d)return;let f=u<=t&&t<d;e.classList.toggle(`slot-past`,!f&&d<=t)})}function le(){document.querySelectorAll(`.itin-now-line`).forEach(e=>e.remove());let e=currentTrip();if(!e||!e.startDate)return;let t=new Date,n=re(e),r=e.timeSlots||c,i=fe(e.startDate);if(!i)return;let a=ie(e),o=-1;for(let t=0;t<e.itinerary.length;t++)if(ne(i,t)===a){o=t;break}if(o===-1||window.innerWidth<=600&&window.itinMobileDay!==o)return;let s=document.querySelector(`.itin-grid`);if(!s)return;let l=Array.from(s.querySelectorAll(`.itin-cell.time`)).filter(e=>e.textContent.trim()!==`Time`);if(!l.length)return;let u=new Date(i);u.setDate(u.getDate()+o);let d=r.map(e=>se(u,e,n)),f=d[0],p=d[d.length-1];if(!f||!p)return;let m=s.getBoundingClientRect(),h=null;if(t<=f)h=l[0].getBoundingClientRect().top-m.top;else if(t>=p)h=l[l.length-1].getBoundingClientRect().bottom-m.top;else for(let e=0;e<d.length-1;e++){let n=d[e],r=d[e+1];if(n&&r&&n<=t&&t<r){let i=l[e].getBoundingClientRect(),a=l[e+1].getBoundingClientRect(),o=(t-n)/(r-n);h=i.top-m.top+o*(a.top-i.top);break}}if(h===null)return;let g=document.createElement(`div`);g.className=`itin-now-line`,g.style.top=`${h}px`,s.appendChild(g)}function ue(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}function de(e){return e==null?``:String(e).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function fe(e){if(!e)return null;let t=new Date(e+`T00:00:00`);return isNaN(t)?null:t}function pe(e,t){return!e||!t?0:Math.round((t-e)/(1e3*60*60*24))}function me(e){let t=fe(e);if(!t)return null;let n=new Date;return n.setHours(0,0,0,0),pe(n,t)}function he(e,t={month:`short`,day:`numeric`,year:`numeric`}){let n=fe(e);return n?n.toLocaleDateString(void 0,t):``}function ge(e){if(!e)return``;let t=new Date(e);return isNaN(t)?e:e.includes(`T`)&&!e.endsWith(`T`)?t.toLocaleDateString(void 0,{month:`short`,day:`numeric`})+` `+t.toLocaleTimeString(void 0,{hour:`numeric`,minute:`2-digit`}):t.toLocaleDateString(void 0,{month:`short`,day:`numeric`,year:`numeric`})}function _e(e){return!e.startDate||!e.endDate?null:pe(fe(e.startDate),fe(e.endDate))+1}function ve(e){return String(e).replace(/'/g,`\\'`).replace(/"/g,`&quot;`)}Object.assign(window,{getToken:e,setToken:t,parseTime12:n,formatTime12:r,nextTimeStr:i,slotEndLabel:a,allHalfHourTimes:o,generateSlotsFromRange:s,getTimezoneOptions:u,tickTzClock:d,startTzClock:p,stopTzClock:m,tickItinClock:v,startItinClock:_,stopItinClock:g,applyItineraryTimeState:ce,renderCurrentTimeLine:le,parseSlotTime:se,uid:ue,escapeHtml:de,escapeAttr:ve,parseDate:fe,daysBetween:pe,daysUntil:me,fmtDate:he,fmtBookingTime:ge,tripDuration:_e});var ye=()=>window.render(),be=()=>({trips:[],settings:{theme:`beach`,currency:`USD`}});async function xe(){try{let t=await fetch(`/api/data`,{headers:{Authorization:`Bearer ${e()}`}});if(t.status===401)return window.clearToken(),be();if(!t.ok)throw Error(`fetch failed`);let n=await t.json();return n.trips=n.trips||[],n.trips.forEach(e=>{e.driveFolder?`thumbnailUrl`in e.driveFolder||(e.driveFolder.thumbnailUrl=null):e.driveFolder={folderId:null,thumbnailId:null,thumbnailUrl:null}}),n.settings=Object.assign({theme:`beach`,currency:`USD`},n.settings||{}),n}catch{return be()}}function Se(){if(Me()&&window._shareToken){let e=Ne();if(!e)return;fetch(`/api/share/${window._shareToken}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({trip:e})}).catch(console.error);return}let t=e();t&&fetch(`/api/data`,{method:`PUT`,headers:{Authorization:`Bearer ${t}`,"Content-Type":`application/json`},body:JSON.stringify(b)}).then(e=>{e.ok||e.json().then(e=>console.error(`Save failed:`,e)).catch(()=>console.error(`Save failed:`,e.status))}).catch(console.error)}var b=be(),x={view:`home`,tripId:null,tab:`overview`},S=null,Ce=`all`,we=localStorage.getItem(`tp_simplify_debts`)!==`false`,Te=!1;function Ee(e){b=e}function De(e){S=e}function Oe(e){Te=e}function ke(e){we=e,localStorage.setItem(`tp_simplify_debts`,e),ye()}function Ae(e){let t=b.settings.currency||`USD`;if(e==null||isNaN(e))return`—`;try{return new Intl.NumberFormat(void 0,{style:`currency`,currency:t,maximumFractionDigits:2}).format(e)}catch{return`$`+Number(e).toFixed(2)}}function je(e){window.guardEdit()&&(document.documentElement.setAttribute(`data-theme`,e),b.settings.theme=e,S&&localStorage.setItem(`tp_theme`,e),ze({type:`updateSettings`,theme:e}))}function Me(){return document.documentElement.hasAttribute(`data-share`)}function Ne(){return b.trips.find(e=>e.id===x.tripId)}function Pe(){Oe(!1),x={view:`home`,tripId:null,tab:`overview`},ye()}function Fe(e,t){window.itinMobileDay!==void 0&&(window.itinMobileDay=0),Oe(!1),x={view:`trip`,tripId:e,tab:t||`overview`},ye()}function Ie(e){Oe(!1),x.tab=e,ye()}function Le(e){Ce=e,x.view===`home`&&typeof window.renderHomePast==`function`?window.renderHomePast():ye(),requestAnimationFrame(()=>Re(e))}function Re(e){if(e===`all`){let e=document.getElementById(`past-root`);e&&e.scrollIntoView({behavior:`smooth`,block:`start`});return}let t=document.getElementById(`past-year-${e}`);t&&t.scrollIntoView({behavior:`smooth`,block:`start`})}function ze(t){if(Me()&&window._shareToken){let e=Ne();if(!e)return;fetch(`/api/share/${window._shareToken}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({trip:e})}).catch(console.error);return}let n=e();n&&fetch(`/api/mutate`,{method:`POST`,headers:{Authorization:`Bearer ${n}`,"Content-Type":`application/json`},body:JSON.stringify(t)}).then(e=>{e.ok||e.json().then(e=>console.error(`[mutate:${t.type}] failed:`,e)).catch(()=>console.error(`[mutate] failed:`,e.status))}).catch(console.error)}Object.assign(window,{saveState:Se,loadState:xe,mutate:ze,currentTrip:Ne,setSimplifyDebts:ke,fmtCurrency:Ae,setTheme:je,goHome:Pe,openTrip:Fe,setTab:Ie,setPastYearFilter:Le,scrollPastYearIntoView:Re});function Be(){localStorage.removeItem(`tp_token`),localStorage.removeItem(`tp_theme`),De(null),Ee(be());let e=document.getElementById(`app-root`);e&&(e.innerHTML=``),Ve(),window.showLoginModal()}function Ve(){let e=document.getElementById(`user-btn`),t=document.getElementById(`user-label`);S?(e&&(e.style.display=``),t&&(t.textContent=S.username)):e&&(e.style.display=`none`)}function He(){confirm(`Signed in as "${S?.username}"\n\nSign out?`)&&Be()}function Ue(){return!!S}function We(){return document.documentElement.hasAttribute(`data-share`)}function Ge(){return S?!0:document.documentElement.getAttribute(`data-share`)===`edit`}function Ke(){return Ge()?!0:We()?(window.showModal({title:`Read-only view`,size:`sm`,body:`<p style="margin:0;line-height:1.6;">This trip was shared with you in <strong>read-only</strong> mode — you can view but not make changes.</p>`,actions:[{label:`Got it`,primary:!0,onClick:()=>window.closeModal()}]}),!1):(S||window.showLoginModal(),!1)}Object.assign(window,{clearToken:Be,updateHeaderUI:Ve,openUserMenu:He,isLoggedIn:Ue,isShareMode:We,isEditing:Ge,guardEdit:Ke});function qe({title:e,body:t,actions:n,size:r,onOpen:i,dismissOnOverlay:a=!0}){let o=document.getElementById(`modal-root`);o.innerHTML=`
    <div class="modal-bg" ${a?`onclick="if(event.target===this) closeModal()"`:``}>
      <div class="modal" style="${r===`sm`?`max-width:380px;`:r===`lg`?`max-width:720px;`:``}">
        <div class="modal-head">
          <h3>${e}</h3>
          <button class="icon-btn" onclick="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">${t}</div>
        <div class="modal-foot">
          ${(n||[]).map((e,t)=>`<button class="btn ${e.primary?`primary`:e.danger?`danger`:``}" data-aidx="${t}">${e.label}</button>`).join(``)}
        </div>
      </div>
    </div>
  `,(n||[]).forEach((e,t)=>{o.querySelector(`[data-aidx="${t}"]`).onclick=e.onClick}),i&&i()}function Je(){document.getElementById(`modal-root`).innerHTML=``}Object.assign(window,{showModal:qe,closeModal:Je});var Ye=()=>window.render(),Xe=()=>window.isLoggedIn();function Ze(e=`login`){let t=document.getElementById(`modal-root`);if(!t)return;let n=`width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:14px;`;t.innerHTML=`
    <div class="modal-bg login-bg" onclick="if(event.target===this&&${Xe()})closeModal()">
      <div class="modal" style="max-width:400px;">
        <div class="modal-head" style="padding:22px 24px 0;">
          <h3 id="auth-modal-title" style="font-size:20px;font-weight:700;">Sign In</h3>
        </div>
        <div class="modal-body" style="padding:20px 24px 28px;">

          <div style="display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <button id="tab-login" onclick="switchAuthTab('login')"
              style="flex:1;padding:10px;border:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
                     background:var(--primary);color:white;transition:background .15s;">
              Sign In
            </button>
            <button id="tab-register" onclick="switchAuthTab('register')"
              style="flex:1;padding:10px;border:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
                     background:var(--surface);color:var(--ink-soft);transition:background .15s;">
              Register
            </button>
          </div>

          <div id="auth-form-login">
            <div class="field">
              <label>Username</label>
              <input type="text" id="login-username" placeholder="your username" autocomplete="username"
                     style="${n}"
                     onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()" />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="your password" autocomplete="current-password"
                     style="${n}"
                     onkeydown="if(event.key==='Enter')submitLogin()" />
            </div>
            <div id="login-error" style="color:#c0392b;font-size:12px;margin-bottom:10px;display:none;"></div>
            <button class="btn primary" style="width:100%;padding:12px;font-size:14px;" onclick="submitLogin()">Sign In</button>
          </div>

          <div id="auth-form-register" style="display:none;">
            <div class="field">
              <label>Username</label>
              <input type="text" id="reg-username" placeholder="3–20 chars: letters, numbers, underscore" autocomplete="username"
                     style="${n}"
                     onkeydown="if(event.key==='Enter')document.getElementById('reg-password').focus()" />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="reg-password" placeholder="min 8 characters" autocomplete="new-password"
                     style="${n}"
                     onkeydown="if(event.key==='Enter')document.getElementById('reg-confirm').focus()" />
            </div>
            <div class="field">
              <label>Confirm password</label>
              <input type="password" id="reg-confirm" placeholder="repeat password" autocomplete="new-password"
                     style="${n}"
                     onkeydown="if(event.key==='Enter')submitRegister()" />
            </div>
            <div id="reg-error" style="color:#c0392b;font-size:12px;margin-bottom:10px;display:none;"></div>
            <button class="btn primary" style="width:100%;padding:12px;font-size:14px;" onclick="submitRegister()">Create Account</button>
          </div>

        </div>
      </div>
    </div>`,Qe(e)}function Qe(e){let t=e===`login`;document.getElementById(`auth-form-login`).style.display=t?``:`none`,document.getElementById(`auth-form-register`).style.display=t?`none`:``,document.getElementById(`auth-modal-title`).textContent=t?`Sign In`:`Create Account`,document.getElementById(`tab-login`).style.background=t?`var(--primary)`:`var(--surface)`,document.getElementById(`tab-login`).style.color=t?`white`:`var(--ink-soft)`,document.getElementById(`tab-register`).style.background=t?`var(--surface)`:`var(--primary)`,document.getElementById(`tab-register`).style.color=t?`var(--ink-soft)`:`white`;let n=t?`login-username`:`reg-username`;setTimeout(()=>document.getElementById(n)?.focus(),50)}async function $e(){let e=document.getElementById(`login-username`)?.value.trim(),n=document.getElementById(`login-password`)?.value,r=document.getElementById(`login-error`);if(!e||!n)return;let i=document.querySelector(`#auth-form-login .btn.primary`);i&&(i.disabled=!0);try{let r=await fetch(`/api/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:e,password:n})}),i=await r.json();if(!r.ok)throw Error(i.error||`Login failed`);t(i.token);try{De(JSON.parse(atob(i.token.split(`.`)[1])))}catch{De(null)}Ve(),closeModal(),Ee(await loadState()),Ye()}catch(e){i&&(i.disabled=!1),r&&(r.textContent=e.message,r.style.display=``)}}async function et(){let e=document.getElementById(`reg-username`)?.value.trim(),n=document.getElementById(`reg-password`)?.value,r=document.getElementById(`reg-confirm`)?.value,i=document.getElementById(`reg-error`);if(!e||!n||!r)return;if(n!==r){i&&(i.textContent=`Passwords do not match.`,i.style.display=``);return}let a=document.querySelector(`#auth-form-register .btn.primary`);a&&(a.disabled=!0);try{let r=await fetch(`/api/auth/register`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:e,password:n})}),i=await r.json();if(!r.ok)throw Error(i.error||`Registration failed`);t(i.token);try{De(JSON.parse(atob(i.token.split(`.`)[1])))}catch{De(null)}Ve(),closeModal(),Ee(await loadState()),Ye()}catch(e){a&&(a.disabled=!1),i&&(i.textContent=e.message,i.style.display=``)}}Object.assign(window,{showLoginModal:Ze,switchAuthTab:Qe,submitLogin:$e,submitRegister:et});var C={expr:``,just:!1};function tt(){showModal({title:`Quick calculator`,size:`sm`,body:`
      <div class="calc">
        <div class="calc-display">
          <div class="expr" id="calc-expr"></div>
          <div id="calc-val">0</div>
        </div>
        <div class="calc-grid">
          ${`AC,÷,×,⌫,7,8,9,−,4,5,6,+,1,2,3,=,0,.,(,)`.split(`,`).map((e,t)=>`<button class="calc-btn ${[`÷`,`×`,`−`,`+`,`=`].includes(e)?e===`=`?`eq`:`op`:e===`AC`||e===`⌫`||e===`(`||e===`)`?`fn`:``}" onclick="calcPress('${e}')">${e}</button>`).join(``)}
        </div>
        <div class="calc-help">
          <strong>Power tools:</strong> use buttons above, or type math directly.<br>
          Split by N people: e.g. <span class="kbd">450 / 8</span> → ${fmtCurrency(56.25)}<br>
          Press <span class="kbd">Enter</span> to compute.
        </div>
      </div>
    `,actions:[{label:`Close`,onClick:closeModal}]}),document.addEventListener(`keydown`,rt)}function nt(){document.removeEventListener(`keydown`,rt)}function rt(e){if(!document.querySelector(`.calc`)){nt();return}let t=e.key;/[0-9.+\-*/()]/.test(t)?(at(t),e.preventDefault()):t===`Enter`||t===`=`?(st(),e.preventDefault()):t===`Backspace`?(ot(),e.preventDefault()):t===`Escape`&&(closeModal(),nt())}function it(e){e===`AC`?(C.expr=``,C.just=!1):e===`⌫`?ot():e===`=`?st():at(e===`÷`?`/`:e===`×`?`*`:e===`−`?`-`:e),ct()}function at(e){C.just&&/[0-9.]/.test(e)&&(C.expr=``),C.expr+=e,C.just=!1,ct()}function ot(){C.expr=C.expr.slice(0,-1),ct()}function st(){if(C.expr)try{if(!/^[\d\s+\-*/().]+$/.test(C.expr)){alert(`Invalid expression`);return}let e=Function(`"use strict";return (`+C.expr+`)`)();document.getElementById(`calc-expr`).textContent=C.expr+` =`,C.expr=String(e),C.just=!0,ct()}catch{alert(`Invalid expression`)}}function ct(){let e=document.getElementById(`calc-val`),t=document.getElementById(`calc-expr`);e&&(e.textContent=C.expr||`0`,C.just||(t.textContent=``))}Object.assign(window,{openCalc:tt,calcPress:it});var lt=()=>window.render(),ut=e=>window.mutate(e),dt=()=>window.guardEdit(),ft=()=>window.currentTrip(),pt=e=>window.escapeHtml(e),mt=()=>window.uid(),ht=[`#fef9c3`,`#dcfce7`,`#dbeafe`,`#fce7f3`,`#ffe4e6`];function gt(e){return Array.isArray(e.notes)?e.notes:e.notes?[{id:mt(),text:e.notes}]:[]}function _t(e){return`
    <div class="panel">
      <div class="panel-head"><h3>Notes & ideas</h3></div>
      <div class="panel-sub" style="margin-bottom:20px;">Jot down anything — links, restaurant ideas, packing reminders, contact numbers...</div>
      <div class="sticky-board">
        ${gt(e).map((e,t)=>`
    <div class="sticky-note" style="background:${ht[t%ht.length]}">
      <button class="note-remove" onclick="removeNote('${e.id}')" title="Remove note">×</button>
      <textarea placeholder="Write something..." oninput="updateNote('${e.id}', this.value)">${pt(e.text)}</textarea>
    </div>`).join(``)}
        <button class="sticky-add" onclick="addNote()">
          <span style="font-size:24px;line-height:1">+</span>
          <span>Add Note</span>
        </button>
      </div>
    </div>
  `}function vt(){if(!dt())return;let e=ft();if(!e)return;Array.isArray(e.notes)||(e.notes=gt(e));let t={id:mt(),text:``};e.notes.push(t),ut({type:`addNote`,tripId:e.id,note:t}),lt()}function yt(e){if(!dt())return;let t=ft();t&&(Array.isArray(t.notes)||(t.notes=gt(t)),t.notes=t.notes.filter(t=>t.id!==e),ut({type:`deleteNote`,noteId:e}),lt())}var bt={};function xt(e,t){if(!dt())return;let n=ft();if(!n)return;Array.isArray(n.notes)||(n.notes=gt(n));let r=n.notes.find(t=>t.id===e);r&&(r.text=t,clearTimeout(bt[e]),bt[e]=setTimeout(()=>ut({type:`updateNote`,noteId:e,text:t}),400))}Object.assign(window,{getNotes:gt,renderNotes:_t,addNote:vt,removeNote:yt,updateNote:xt});var St=e=>window.mutate(e),Ct=()=>window.guardEdit(),wt=()=>window.currentTrip(),Tt=e=>window.escapeHtml(e),Et=e=>window.escapeAttr(e),Dt=()=>window.uid(),Ot=e=>window.fmtBookingTime(e),kt=0,At=10,jt=``,Mt=null,Nt=()=>window.tripPanelRender();function Pt(e){kt=e,Nt()}function Ft(e){At=parseInt(e),kt=0,Nt()}function It(e){jt=e,kt=0,clearTimeout(Mt),Mt=setTimeout(()=>{window.renderReservationsPanel()||window.render();let e=document.getElementById(`reservation-search`);e&&(e.focus(),e.setSelectionRange(e.value.length,e.value.length))},200)}function Lt(e){let t=(e||``).trim();return t?/^https?:\/\//i.test(t)?t:`https://`+t:``}function Rt(e,t){let n=e.reservations||[],r=n.map((e,t)=>({r:e,i:t})),i=jt.toLowerCase().trim(),a=i?r.filter(({r:e})=>(e.name||``).toLowerCase().includes(i)||(e.status||``).toLowerCase().includes(i)||(e.confNum||``).toLowerCase().includes(i)||(e.link||``).toLowerCase().includes(i)||(e.note||``).toLowerCase().includes(i)||(e.dueDate||``).toLowerCase().includes(i)||Ot(e.dueDate).toLowerCase().includes(i)):r,o=!t&&At>0?Math.max(1,Math.ceil(a.length/At)):1,s=Math.min(kt,o-1),c=t?0:s*At,l=t?a.length:c+At,u=a.slice(c,l).map(({r:e,i:t})=>`
    <tr>
      <td class="col-item"><input value="${Tt(e.name||``)}" onchange="updateRes(${t},'name',this.value)" placeholder="What to book" /></td>
      <td class="col-status">
        <div class="res-status-cell">
          <select class="res-status-select" onchange="updateRes(${t},'status',this.value)" id="res-sel-${t}">
            <option value="pending" ${e.status===`pending`?`selected`:``}>Pending</option>
            <option value="booked" ${e.status===`booked`?`selected`:``}>Booked</option>
            <option value="cancelled" ${e.status===`cancelled`?`selected`:``}>Cancelled</option>
          </select>
          <span class="res-status ${e.status||`pending`}" onclick="document.getElementById('res-sel-${t}').click()">${e.status||`pending`}</span>
        </div>
      </td>
      <td><input type="datetime-local" value="${e.dueDate||``}" onchange="updateRes(${t},'dueDate',this.value)" style="font-size:12px;" /></td>
      <td><input value="${Tt(e.confNum||``)}" onchange="updateRes(${t},'confNum',this.value)" placeholder="—" /></td>
      <td class="col-link">
        <div class="res-link-cell">
          <input class="res-link-input" value="${Tt(e.link||``)}" onchange="updateRes(${t},'link',this.value)" placeholder="https://..." />
          ${e.link?.trim()?`<a href="${Et(Lt(e.link))}" target="_blank" rel="noopener noreferrer" class="res-open-btn" title="Open link">Open ↗</a>`:``}
        </div>
      </td>
      <td class="col-note"><textarea rows="2" onchange="updateRes(${t},'note',this.value)">${Tt(e.note||``)}</textarea></td>
      <td class="row-actions no-print">
        <button class="icon-btn" onclick="deleteRes(${t})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </td>
    </tr>
  `).join(``);return`
    <div class="panel">
      <div class="panel-head">
        <h3>Reservations & must-book list</h3>
        <div class="actions">
          <button class="btn sm primary" onclick="addRes()">+ Add reservation</button>
        </div>
      </div>

      ${n.length>0?`
        <div class="no-print" style="display:flex;align-items:center;margin-bottom:15px;">
          <div style="flex:8;position:relative;">
            <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink-soft);pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="reservation-search" type="text" placeholder="Search by item, status, confirm #, link, note…"
              value="${Tt(jt)}"
              oninput="setResSearch(this.value)"
              style="width:100%;padding:7px 10px 7px 30px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;background:var(--surface-2);box-sizing:border-box;" />
            ${jt?`<button onclick="setResSearch('')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-soft);font-size:16px;line-height:1;padding:0;" title="Clear">×</button>`:``}
          </div>
          <div style="flex:2;"></div>
          <div style="flex:2;display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:13px;color:var(--ink-soft);white-space:nowrap;">
            Rows per page:
            <select onchange="setResPageSize(this.value)" style="padding:3px 6px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:13px;background:var(--surface-2);">
              ${[5,10,15,20].map(e=>`<option value="${e}" ${At===e?`selected`:``}>${e}</option>`).join(``)}
            </select>
          </div>
        </div>
      `:``}

      ${n.length===0?`
        <div class="empty-mini">
          <h4>Nothing to book yet 🎟️</h4>
          <p>Track tours, restaurants, tickets, and anything that needs advance booking.</p>
          <button class="btn primary sm" onclick="addRes()" style="margin-top:8px;">+ Add first reservation</button>
        </div>
      `:`
        <div class="t-wrap">
          <table class="t">
            <thead><tr>
              <th class="col-item">Item</th><th class="col-status">Status</th><th>Booking time</th><th>Confirm #</th>
              <th class="col-link">Link</th><th class="col-note">Note</th><th class="no-print"></th>
            </tr></thead>
            <tbody>${u||`<tr><td colspan="7" style="padding:20px 12px;color:var(--ink-soft);text-align:center;">No reservations match "<strong>${Tt(jt)}</strong>".</td></tr>`}</tbody>
          </table>
        </div>

        ${!t&&a.length>0?`
        <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:13px;">
          <div style="color:var(--ink-soft);">
            ${(()=>{let e=a.length,t=[];return i&&t.push(`matching "<strong>${Tt(jt)}</strong>"`),`Showing ${e} reservation${e===1?``:`s`}${t.length?` `+t.join(` `):``}.`})()}
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--ink-soft);margin-right:4px;">Page ${s+1} of ${o}</span>
            <button class="btn sm" onclick="setResPage(${s-1})" ${s===0?`disabled`:``} style="min-width:32px;padding:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            ${Array.from({length:o},(e,t)=>t).filter(e=>Math.abs(e-s)<=2||e===0||e===o-1).reduce((e,t,n,r)=>(n>0&&t-r[n-1]>1&&e.push(`<span style="color:var(--ink-soft);padding:0 2px;">…</span>`),e.push(`<button class="btn sm ${t===s?`primary`:``}" onclick="setResPage(${t})" style="min-width:32px;">${t+1}</button>`),e),[]).join(``)}
            <button class="btn sm" onclick="setResPage(${s+1})" ${s===o-1?`disabled`:``} style="min-width:32px;padding:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>`:``}
      `}
    </div>
  `}function zt(){if(!Ct())return;let e=wt();e.reservations=e.reservations||[];let t={id:Dt(),name:``,status:`pending`,dueDate:``,confNum:``,link:``,note:``};e.reservations.push(t),St({type:`addReservation`,tripId:e.id,reservation:t}),Nt()}function Bt(e,t,n){if(!Ct())return;let r=wt().reservations[e];r[t]=n,St({type:`updateReservation`,resId:r.id,fields:{[t]:n}}),(t===`status`||t===`link`)&&Nt()}function Vt(e){if(!Ct())return;let[t]=wt().reservations.splice(e,1);St({type:`deleteReservation`,resId:t.id}),Nt()}Object.assign(window,{renderReservations:Rt,addRes:zt,updateRes:Bt,deleteRes:Vt,setResPage:Pt,setResPageSize:Ft,setResSearch:It});var Ht=()=>window.render(),Ut=()=>window.tripPanelRender(),Wt=()=>window.updateTripHeaderStats(),w=e=>window.mutate(e),Gt=()=>window.guardEdit(),T=()=>window.currentTrip(),Kt=e=>window.escapeHtml(e),qt=()=>window.uid(),Jt=e=>window.parseDate(e),Yt=[],Xt=null,Zt=new Map,Qt=3600*1e3,$t=null,E=-1,en=[];function tn(e){return!e.packing||e.packing.length===0?`
      <div class="panel">
        <div class="panel-head"><h3>Packing list</h3></div>
        <div class="empty-mini">
          <h4>Empty packing list 🧳</h4>
          <p>Start from a template or build from scratch.</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">
            <button class="btn primary sm" onclick="loadPackingTemplate()">+ Load template</button>
            <button class="btn sm" onclick="addPackCategory()">+ Empty category</button>
          </div>
        </div>
      </div>
    `:`
    <div class="panel">
      <div class="panel-head">
        <h3>Packing list</h3>
        <div class="actions">
          <button class="btn sm" onclick="addPackCategory()">+ Add category</button>
        </div>
      </div>
      <div class="pack-grid">
        ${e.packing.map((e,t)=>{let n=e.items.length,r=e.items.filter(e=>e.packed).length;return`
            <div class="pack-cat" data-ci="${t}">
              <div class="pack-cat-head">
                <div class="pack-cat-title">
                  <input value="${Kt(e.name)}" onchange="updatePackCat(${t}, this.value)" />
                </div>
                <span class="pack-cat-progress">${r}/${n}</span>
                <button class="icon-btn no-print" style="width:28px;height:28px;" title="Delete category" onclick="deletePackCat(${t})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="pack-bar"><div class="pack-bar-fill" style="--pct:${n?r/n:0}"></div></div>
              <div class="pack-items">
                ${e.items.map((e,n)=>`
                  <div class="pack-item ${e.packed?`checked`:``}" data-ii="${n}">
                    <input type="checkbox" ${e.packed?`checked`:``} onchange="togglePack(${t},${n})" />
                    <input type="text" value="${Kt(e.name)}" onchange="updatePackItem(${t},${n},this.value)" />
                    <button class="x" onclick="deletePackItem(${t},${n})" title="Remove">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                `).join(``)}
              </div>
              <div class="pack-add no-print">
                <input placeholder="+ Add item" onkeydown="if(event.key==='Enter'){addPackItem(${t},this.value);this.value=''}" />
              </div>
            </div>
          `}).join(``)}
      </div>
    </div>
  `}function nn(){if(!Gt())return;let e=T();e.packing=PACKING_TEMPLATE.map(e=>({id:qt(),name:e.name,items:e.items.map(e=>({id:qt(),name:e,packed:!1}))})),w({type:`syncPackCategories`,tripId:e.id,categories:e.packing}),Ut()}function rn(e){if(clearTimeout($t),!e.trim()||e.length<2){un();return}$t=setTimeout(()=>an(e),300)}async function an(e){try{en=(await(await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(e)}&count=8&language=en&format=json`)).json()).results||[],on()}catch{un()}}function on(){let e=document.getElementById(`dest-dropdown`);if(e){if(!en.length){e.style.display=`none`;return}E=-1,e.innerHTML=en.map((e,t)=>{let n=[e.admin1,e.country].filter(Boolean).join(`, `);return`<div class="dest-option" onmousedown="selectDestination(${t})">
      <div class="dest-option-name">${Kt(e.name)}</div>
      ${n?`<div class="dest-option-sub">${Kt(n)}</div>`:``}
    </div>`}).join(``),e.style.display=`block`}}function sn(e){let t=en[e];if(!t)return;let n=[t.name,t.admin1,t.country].filter(Boolean).join(`, `),r={lat:t.latitude,lng:t.longitude},i=T();i&&(Zt.delete(i.destination),i.destination=n,i.destinationCoords=r,w({type:`updateTripFields`,tripId:i.id,fields:{destination:n,destLat:r.lat,destLng:r.lng}}),Ht())}function cn(e){let t=document.getElementById(`dest-dropdown`);!t||t.style.display===`none`||(e.key===`ArrowDown`?(e.preventDefault(),E=Math.min(E+1,en.length-1),ln()):e.key===`ArrowUp`?(e.preventDefault(),E=Math.max(E-1,0),ln()):e.key===`Enter`&&E>=0?(e.preventDefault(),sn(E)):e.key===`Escape`&&un())}function ln(){let e=document.getElementById(`dest-dropdown`);e&&[...e.querySelectorAll(`.dest-option`)].forEach((e,t)=>e.classList.toggle(`ac-sel`,t===E))}function un(){let e=document.getElementById(`dest-dropdown`);e&&(e.style.display=`none`),en=[],E=-1}function dn(e){if(Xt=null,document.getElementById(`nt-dest-dropdown`),!e.trim()||e.length<2){pn();return}clearTimeout($t),$t=setTimeout(async()=>{try{Yt=(await(await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(e)}&count=8&language=en&format=json`)).json()).results||[];let t=document.getElementById(`nt-dest-dropdown`);if(!t)return;if(!Yt.length){t.style.display=`none`;return}t.innerHTML=Yt.map((e,t)=>{let n=[e.admin1,e.country].filter(Boolean).join(`, `);return`<div class="dest-option" onmousedown="selectNtDest(${t})">
          <div class="dest-option-name">${Kt(e.name)}</div>
          ${n?`<div class="dest-option-sub">${Kt(n)}</div>`:``}
        </div>`}).join(``),t.style.display=`block`}catch{pn()}},300)}function fn(e){let t=Yt[e];if(!t)return;let n=[t.name,t.admin1,t.country].filter(Boolean).join(`, `);Xt={lat:t.latitude,lng:t.longitude};let r=document.getElementById(`nt-dest`);r&&(r.value=n),pn()}function pn(){let e=document.getElementById(`nt-dest-dropdown`);e&&(e.style.display=`none`),Yt=[]}var mn={0:`☀️`,1:`🌤️`,2:`⛅`,3:`☁️`,45:`🌫️`,48:`🌫️`,51:`🌦️`,53:`🌦️`,55:`🌧️`,61:`🌧️`,63:`🌧️`,65:`🌧️`,71:`❄️`,73:`❄️`,75:`❄️`,77:`🌨️`,80:`🌦️`,81:`🌧️`,82:`⛈️`,85:`🌨️`,86:`🌨️`,95:`⛈️`,96:`⛈️`,99:`⛈️`};function hn(e){return mn[e]||`🌡️`}function gn(e){if(!e.destination||!e.startDate)return``;let t=Jt(e.startDate),n=e.endDate?Jt(e.endDate):t;if(!t)return``;let r=new Date;r.setHours(0,0,0,0);let i=Math.round((t-r)/864e5);if(Math.round((n-r)/864e5)<0)return``;if(i>7){let e=i-7,t=new Date(r.getTime()+e*864e5),n=e===1?`tomorrow`:t.toLocaleDateString(void 0,{month:`short`,day:`numeric`});return`<div class="stat overview-weather" style="padding:16px;">
      <div class="stat-label" style="margin-bottom:4px;">Weather forecast</div>
      <div style="font-size:12px;color:var(--ink-soft);line-height:1.6;">
        🗓️ Available in <strong>${e}</strong> day${e===1?``:`s`}<br>
        <span style="font-size:11px;">7-day forecast unlocks ${n}.</span>
      </div>
    </div>`}let a=Zt.get(e.destination);if((!a||Date.now()-a.fetchedAt>Qt)&&!a?.loading&&_n(e.destination,e.destinationCoords),!a||a.loading)return`<div class="stat overview-weather" style="padding:16px;"><div class="stat-label">Weather forecast</div><div style="font-size:12px;color:var(--ink-soft);margin-top:8px;">Loading…</div></div>`;if(a.error||!a.data)return``;let{daily:o}=a.data;if(!o)return``;let s=new Date().toISOString().slice(0,10),c=o.time.slice(0,7).map((e,t)=>{let n=new Date(e+`T00:00:00`).toLocaleDateString(void 0,{weekday:`short`}),r=hn(o.weathercode[t]),i=Math.round(o.temperature_2m_max[t]),a=Math.round(o.temperature_2m_min[t]),c=e===s;return`<div class="weather-day${c?` today`:``}">
      <div class="weather-day-label">${c?`Today`:n}</div>
      <div class="weather-icon">${r}</div>
      <div class="weather-hi">${i}°</div>
      <div class="weather-lo">${a}°</div>
    </div>`}).join(``);return`<div class="stat overview-weather" style="padding:16px;">
    <div class="stat-label" style="margin-bottom:0;">Weather forecast</div>
    <div style="font-size:11px;color:var(--ink-soft);margin-bottom:2px;">${Kt(e.destination)}</div>
    <div class="weather-strip">${c}</div>
  </div>`}async function _n(e,t=null){if(e){Zt.set(e,{data:null,fetchedAt:Date.now(),loading:!0});try{let n=t?{latitude:t.lat,longitude:t.lng}:null;if(!n&&(n=(await(await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(e)}&count=1&language=en&format=json`)).json()).results?.[0],!n)){Zt.set(e,{data:null,fetchedAt:Date.now(),error:`Location not found`});return}let r=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${n.latitude}&longitude=${n.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`)).json();Zt.set(e,{data:r,fetchedAt:Date.now()})}catch{Zt.set(e,{data:null,fetchedAt:Date.now(),error:`Failed`})}x.view===`trip`&&x.tab===`overview`&&Ht()}}function vn(){if(!Gt())return;let e=T();e.packing=e.packing||[];let t={id:qt(),name:`New category`,items:[]};e.packing.push(t),w({type:`addPackCategory`,tripId:e.id,category:t}),Ut()}function yn(e,t){if(!Gt())return;let n=T().packing[e];n.name=t,w({type:`updatePackCategory`,categoryId:n.id,name:t})}function bn(e){if(!Gt()||!confirm(`Delete this category and all its items?`))return;let[t]=T().packing.splice(e,1);w({type:`deletePackCategory`,categoryId:t.id}),Ut()}function xn(e,t){if(!Gt()||(t=t.trim(),!t))return;let n=T(),r={id:qt(),name:t,packed:!1};n.packing[e].items.push(r),w({type:`addPackItem`,categoryId:n.packing[e].id,item:r}),Ut()}function Sn(e,t,n){if(!Gt())return;let r=T().packing[e].items[t];r.name=n,w({type:`updatePackItem`,itemId:r.id,name:n})}function Cn(e,t){if(!Gt())return;let n=T(),r=n.packing[e].items[t];r.packed=!r.packed,w({type:`updatePackItem`,itemId:r.id,packed:r.packed});let i=document.querySelector(`.pack-cat[data-ci="${e}"]`);if(i&&x.tab===`packing`){let a=i.querySelector(`.pack-item[data-ii="${t}"]`);if(a){a.classList.toggle(`checked`,r.packed);let e=a.querySelector(`input[type="checkbox"]`);e&&(e.checked=r.packed)}let o=n.packing[e].items,s=o.length,c=o.filter(e=>e.packed).length,l=i?.querySelector(`.pack-cat-progress`);l&&(l.textContent=`${c}/${s}`);let u=i?.querySelector(`.pack-bar-fill`);u&&u.style.setProperty(`--pct`,s?c/s:0),Wt(n);return}Ut()}function wn(e,t){if(!Gt())return;let[n]=T().packing[e].items.splice(t,1);w({type:`deletePackItem`,itemId:n.id}),Ut()}Object.assign(window,{renderPacking:tn,loadPackingTemplate:nn,onDestInput:rn,onDestKeydown:cn,selectDestination:sn,closeDestDropdown:un,highlightDestOption:ln,onNtDestInput:dn,selectNtDest:fn,closeNtDestDropdown:pn,renderWeatherWidget:gn,addPackCategory:vn,updatePackCat:yn,deletePackCat:bn,addPackItem:xn,updatePackItem:Sn,togglePack:Cn,deletePackItem:wn,getNtDestCoords:()=>Xt,resetNtDestCoords:()=>{Xt=null}});var Tn=()=>window.render(),En=e=>window.mutate(e),Dn=e=>window.showModal(e),On=()=>window.closeModal(),kn=()=>window.guardEdit(),An=()=>window.currentTrip(),jn=e=>window.escapeHtml(e),Mn=e=>window.escapeAttr(e),Nn=e=>window.svgIcon(e),Pn=new Map,Fn=300*1e3,D=[],In=0,Ln=new Set;function Rn(e){let t=e.driveFolder||{},n=t.folderId||null,r=t.thumbnailId||null,i=document.documentElement.getAttribute(`data-share`)===`read`,a=n?Pn.get(n):null,o=!a||Date.now()-a.fetchedAt>Fn;n&&o&&!a?.loading&&zn(n);let s=n?`<div class="drive-link-row">
        <span class="drive-folder-label" title="${jn(n)}">📁 Google Drive folder linked</span>
        ${i?``:`
          <button class="btn sm" onclick="refreshDrivePhotos('${Mn(n)}')">Refresh</button>
          <button class="btn sm ghost" style="color:#c0392b;" onclick="unlinkDriveFolder()">Unlink</button>`}
      </div>`:i?``:`<div style="margin-bottom:16px;">
        <button class="btn primary" onclick="openLinkDriveModal()">${Nn(`camera`)} Link Google Drive Folder</button>
        <p class="hint" style="margin-top:8px;">Paste a Google Drive folder URL. The folder must be set to "Anyone with the link can view."</p>
      </div>`,c=``;return c=n?!a||a.loading?`<div class="empty-mini">Loading photos…</div>`:a.error?`<div class="empty-mini" style="color:#c0392b;">${jn(a.error)}</div>`:a.files.length?`<div class="photo-grid">${a.files.map((e,t)=>{let n=e.id===r,a=getFileThumbUrl(e,400);return`<div class="photo-thumb${n?` is-cover`:``}" onclick="openLightbox(${t})">
        <img data-src="${Mn(a)}" src="" alt="${jn(e.name)}" loading="lazy" decoding="async" />
        ${n?`<div class="photo-thumb-cover-badge">★ Cover</div>`:``}
        <div class="photo-thumb-overlay">
          ${i?``:`<button class="photo-thumb-star${n?` is-thumb`:``}" onclick="setTripThumbnail(event,'${Mn(e.id)}')" title="${n?`Set another photo as cover`:`Set as trip cover`}">★</button>`}
          <span class="photo-thumb-name">${jn(e.name)}</span>
        </div>
      </div>`}).join(``)}</div>`:`<div class="empty-mini">No images found in this folder.</div>`:`<div class="empty-mini">No Drive folder linked yet.</div>`,`<div class="panel">
    <div class="panel-head">
      <h3>Photos</h3>
      ${a?.files?.length?`<span style="font-size:13px;color:var(--ink-soft);">${a.files.length} photo${a.files.length===1?``:`s`}</span>`:``}
    </div>
    ${s}
    ${c}
  </div>`}async function zn(e,t=!1){if(!e)return;let n=Pn.get(e);if(!n?.loading&&!(!t&&n&&Date.now()-n.fetchedAt<Fn)){Pn.set(e,{files:n?.files||[],fetchedAt:n?.fetchedAt||0,loading:!0}),x.view===`trip`&&x.tab===`photos`&&Tn();try{let t=await fetch(`/api/drive/folder?folderId=${encodeURIComponent(e)}`),n=await t.json();if(!t.ok)throw Error(n.error||`Failed to load photos`);Pn.set(e,{files:n.files||[],fetchedAt:Date.now()}),D=n.files||[]}catch(t){Pn.set(e,{files:[],fetchedAt:Date.now(),error:t.message})}x.view===`trip`&&x.tab===`photos`&&Tn()}}var Bn=null;function Vn(){Bn&&=(Bn.disconnect(),null);let e=document.querySelectorAll(`.photo-thumb img[data-src]`);if(e.length){if(!(`IntersectionObserver`in window)){e.forEach(e=>{e.dataset.src&&(e.src=e.dataset.src)});return}Bn=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.dataset.src&&(e.target.src=e.target.dataset.src,Bn.unobserve(e.target))})},{rootMargin:`400px`}),e.forEach(e=>Bn.observe(e))}}function Hn(e){Pn.delete(e),Tn()}function Un(){kn()&&Dn({title:`Link Google Drive Folder`,size:`sm`,body:`<div class="field">
      <label>Folder URL or ID</label>
      <input id="drive-folder-input" placeholder="https://drive.google.com/drive/folders/…" autofocus style="width:100%;" />
      <div class="hint">Set the folder to "Anyone with the link can view" in Google Drive first.</div>
    </div>
    <div id="drive-link-error" style="color:#c0392b;font-size:13px;display:none;margin-top:8px;"></div>`,actions:[{label:`Cancel`,onClick:On},{label:`Link Folder`,primary:!0,onClick:Wn}]})}function Wn(){let e=document.getElementById(`drive-folder-input`),t=document.getElementById(`drive-link-error`),n=(e?.value||``).trim(),r=n.match(/\/folders\/([a-zA-Z0-9_-]+)/)||n.match(/^([a-zA-Z0-9_-]{10,})$/);if(!r){t&&(t.textContent=`Could not find a folder ID. Paste the full Drive folder URL.`,t.style.display=``);return}let i=r[1],a=An();a&&(a.driveFolder||={folderId:null,thumbnailId:null,thumbnailUrl:null},a.driveFolder.folderId=i,En({type:`updateTripFields`,tripId:a.id,fields:{driveFolderId:i}}),On(),Tn(),zn(i,!0))}function Gn(){if(!kn()||!confirm(`Remove the linked Drive folder? Photos will no longer show.`))return;let e=An();e&&(e.driveFolder={folderId:null,thumbnailId:null,thumbnailUrl:null},En({type:`updateTripFields`,tripId:e.id,fields:{driveFolderId:null,driveThumbnailId:null,driveThumbnailUrl:null}}),Tn())}function Kn(e,t){if(e&&e.stopPropagation(),!kn())return;let n=An();n&&(n.driveFolder||={folderId:null,thumbnailId:null,thumbnailUrl:null},n.driveFolder.thumbnailId=t,En({type:`updateTripFields`,tripId:n.id,fields:{driveThumbnailId:t}}),Tn(),document.getElementById(`modal-root`)?.querySelector(`.lightbox-bg`)&&Jn())}function qn(e){let t=An();D=(t?.driveFolder?.folderId?Pn.get(t.driveFolder.folderId):null)?.files||[],D.length&&(In=e,Jn())}function Jn(){if(!D.length)return;let e=D[In],t=D.length,n=An()?.driveFolder?.thumbnailId===e.id,r=document.documentElement.getAttribute(`data-share`)===`read`,i=getFileThumbUrl(e,400),a=getFileThumbUrl(e,1200),o=document.getElementById(`modal-root`);if(o.innerHTML=`<div class="lightbox-bg" onclick="if(event.target===this)closeLightbox()" id="lightbox-bg">
    <div class="lightbox-img-wrap">
      <img id="lightbox-img" src="${Mn(i)}" alt="${jn(e.name)}" />
    </div>
    <button class="lightbox-close" onclick="closeLightbox()" title="Close (Esc)">✕</button>
    ${t>1?`<button class="lightbox-nav prev" onclick="moveLightbox(-1)">&#8249;</button>
    <button class="lightbox-nav next" onclick="moveLightbox(1)">&#8250;</button>`:``}
    <div class="lightbox-counter">${In+1} / ${t}</div>
    ${r?``:`<button class="lightbox-cover-btn${n?` is-thumb`:``}" onclick="setTripThumbnail(event,'${Mn(e.id)}')">${n?`★ Trip Cover`:`☆ Set as Cover`}</button>`}
  </div>`,Ln.has(e.id)){let e=document.getElementById(`lightbox-img`);e&&(e.src=a)}else{let t=new Image;t.onload=()=>{Ln.add(e.id);let t=document.getElementById(`lightbox-img`);t&&(t.src=a)},t.src=a}D.length>1&&[-1,1,2].forEach(t=>{let n=D[(In+t+D.length)%D.length];if(n&&n!==e&&!Ln.has(n.id)){let e=new Image;e.onload=()=>Ln.add(n.id),e.src=getFileThumbUrl(n,1200)}})}function Yn(e){D.length&&(In=(In+e+D.length)%D.length,Jn())}function Xn(){document.getElementById(`modal-root`).innerHTML=``}Object.assign(window,{renderPhotos:Rn,setupPhotoLazyLoad:Vn,refreshDrivePhotos:Hn,openLinkDriveModal:Un,unlinkDriveFolder:Gn,setTripThumbnail:Kn,openLightbox:qn,renderLightbox:Jn,moveLightbox:Yn,closeLightbox:Xn});var Zn=e=>window.mutate(e),Qn=e=>window.showModal(e),$n=()=>window.closeModal(),er=()=>window.guardEdit(),O=()=>window.currentTrip(),k=e=>window.escapeHtml(e),A=e=>window.fmtCurrency(e),j=e=>window.escapeAttr(e),tr=()=>window.uid(),nr=e=>window.tripDuration(e),rr=[`Transport`,`Lodging`,`Activities`,`Food`,`Shopping`,`Misc`],ir=[{id:`equal`,label:`Equal`,icon:`=`,desc:`Each traveler pays the same amount. Use when everyone benefited equally.`},{id:`exact`,label:`Exact`,icon:`1.23`,desc:`Each traveler pays a fixed dollar amount you enter directly. Use when you've already worked out who owes what.`},{id:`percent`,label:`Percent`,icon:`%`,desc:`Each traveler pays a percentage of the bill (must total 100%). Use for fixed long-term ratios.`},{id:`shares`,label:`Shares`,icon:`≡`,desc:`Each traveler pays in proportion to assigned shares. Use when one traveler owes 2× another, etc.`},{id:`adjust`,label:`Adjust`,icon:`+/−`,desc:`Equal split, then add or subtract a dollar amount per traveler. Use for one-off favors or fines.`}],ar=0,or=10,sr=``,cr=null,M=()=>window.tripPanelRender();function lr(e){ar=e,M()}function ur(e){or=parseInt(e),ar=0,M()}function dr(e){sr=e,ar=0,clearTimeout(cr),cr=setTimeout(()=>{window.renderExpensesPanel()||window.render();let e=document.getElementById(`expense-search`);e&&(e.focus(),e.setSelectionRange(e.value.length,e.value.length))},200)}function N(e,t){return e.splitAmong?e.splitAmong.filter(e=>t.includes(e)):t.slice()}function fr(e,t){let n=parseFloat(e.cost)||0,r=N(e,t),i={};if(!r.length)return i;let a=e.splitMethod||`equal`,o=e.splitDetails||{};if(a===`equal`){let e=n/r.length;r.forEach(t=>i[t]=e)}else if(a===`exact`)r.forEach(e=>i[e]=parseFloat(o[e])||0);else if(a===`percent`)r.forEach(e=>i[e]=n*(parseFloat(o[e])||0)/100);else if(a===`shares`||a===`days`){let e=0;if(r.forEach(t=>e+=parseFloat(o[t])||0),e<=0){let e=n/r.length;r.forEach(t=>i[t]=e)}else r.forEach(t=>i[t]=n*(parseFloat(o[t])||0)/e)}else if(a===`adjust`){let e=0;r.forEach(t=>e+=parseFloat(o[t])||0);let t=(n-e)/r.length;r.forEach(e=>i[e]=t+(parseFloat(o[e])||0))}return i}function pr(e,t){let n=fr(e,t);return Object.values(n).reduce((e,t)=>e+(t||0),0)}function mr(e,t){let n=e.expenses||[],r=e.travelers||[],i=getMyTraveler(e.id),a=n.map((e,t)=>({e,i:t})).filter(({e})=>i?(e.paidBy||[]).includes(i)||N(e,r).includes(i):!0),o=sr.toLowerCase().trim(),s=o?a.filter(({e})=>(e.name||``).toLowerCase().includes(o)||(e.category||``).toLowerCase().includes(o)||(e.note||``).toLowerCase().includes(o)||(e.paidBy||[]).some(e=>e.toLowerCase().includes(o))):a,c=!t&&or>0?Math.max(1,Math.ceil(s.length/or)):1,l=Math.min(ar,c-1),u=t?0:l*or,d=t?s.length:u+or,f=s.slice(u,d),p=s.reduce((e,{e:t})=>e+(parseFloat(t.cost)||0),0),m={},h={},g={},_={},v={};r.forEach(e=>{m[e]=0,h[e]=0,g[e]=0,_[e]=0,v[e]=0}),n.forEach(e=>{let t=parseFloat(e.cost)||0,n=fr(e,r);Object.entries(n).forEach(([e,t])=>{m[e]!==void 0&&(m[e]+=t)});let i=e.paidBy&&e.paidBy.length?e.paidBy:r[0]?[r[0]]:[];i.length&&i.forEach(e=>{h[e]!==void 0&&(h[e]+=t/i.length)});let a=e.settledBy||[],o=N(e,r);o.forEach(e=>{let t=n[e]||0;i.includes(e)||a.includes(e)?g[e]+=t:_[e]+=t}),o.forEach(e=>{if(!i.includes(e)&&!a.includes(e)){let t=(n[e]||0)/i.length;i.forEach(e=>{v[e]!==void 0&&(v[e]+=t)})}})});let ee=f.map(({e,i:t})=>{let n=pr(e,r),i=parseFloat(e.cost)||0,a=Math.abs(n-i)<.01,o=r.length?N(e,r):[],s=o.length>0?i/o.length:0,c=(e.splitMethod||`equal`)!==`equal`||e.splitAmong&&e.splitAmong.length>0&&e.splitAmong.length<r.length?`${A(s)} avg · ${o.length} ppl`:o.length>0?A(s):`$0.00`;return`
    <tr>
      <td class="col-name"><input value="${k(e.name||``)}" onchange="updateExpense(${t},'name',this.value)" placeholder="Expense" /></td>
      <td class="col-cat"><select onchange="updateExpense(${t},'category',this.value)">
        ${rr.map(t=>`<option ${e.category===t?`selected`:``}>${t}</option>`).join(``)}
      </select></td>
      <td class="col-cost num"><input type="number" step="0.01" value="${e.cost||``}" onchange="updateExpense(${t},'cost',parseFloat(this.value)||0)" /></td>
      <td class="col-date"><input type="date" value="${e.date||``}" onchange="updateExpense(${t},'date',this.value)" /></td>
      <td class="col-paid">
        <button class="payer-btn" onclick="openPayerDialog(${t})" title="Select who paid & settle up">
          ${(e.paidBy||[]).length?(e.paidBy||[]).map(e=>`<span class="payer-tag">${k(e)}</span>`).join(``):`<span class="payer-placeholder">Select payer</span>`}
          ${(()=>{let t=r.length?N(e,r):[],n=e.paidBy||[],i=e.settledBy||[],a=t.filter(e=>!n.includes(e)),o=a.filter(e=>i.includes(e)).length;return a.length>0&&n.length>0?`<span style="font-size:10px;color:`+(o===a.length?`#2e7d32`:`var(--ink-soft)`)+`;margin-left:2px;">`+o+`/`+a.length+`</span>`:``})()}
        </button>
      </td>
      <td class="col-note"><input value="${k(e.note||``)}" onchange="updateExpense(${t},'note',this.value)" placeholder="" /></td>
      <td class="col-per">
        <button class="split-cell-btn" onclick="openSplitEditor(${t})" title="Customize split">
          ${c} ${!a&&i>0?`<span style="color:#c0392b;" title="Allocation doesn't match cost">⚠</span>`:``}
        </button>
      </td>
      <td class="row-actions no-print">
        <button class="icon-btn" onclick="deleteExpense(${t})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </td>
    </tr>
  `}).join(``);return`
    <div class="panel">
      <div class="panel-head">
        <h3>Expenses</h3>
        <div class="actions">
          <button class="btn sm" onclick="openCalc()" title="Calculator">🧮 Calculator</button>
          <button class="btn sm primary" onclick="addExpense()">+ Add expense</button>
        </div>
      </div>

      ${n.length>0?`
        <div class="no-print" style="display:flex;align-items:center;margin-bottom:15px;">
          <div style="flex:8;position:relative;">
            <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink-soft);pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="expense-search" type="text" placeholder="Search by name, category, payer…"
              value="${k(sr)}"
              oninput="setExpenseSearch(this.value)"
              style="width:100%;padding:7px 10px 7px 30px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;background:var(--surface-2);box-sizing:border-box;" />
            ${sr?`<button onclick="setExpenseSearch('')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-soft);font-size:16px;line-height:1;padding:0;" title="Clear">×</button>`:``}
          </div>
          <div style="flex:2;"></div>
          <div style="flex:2;display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:13px;color:var(--ink-soft);white-space:nowrap;">
            Rows per page:
            <select onchange="setExpensePageSize(this.value)" style="padding:3px 6px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:13px;background:var(--surface-2);">
              ${[5,10,15,20].map(e=>`<option value="${e}" ${or===e?`selected`:``}>${e}</option>`).join(``)}
            </select>
          </div>
        </div>
      `:``}

      ${n.length===0?`
        <div class="empty-mini">
          <h4>No expenses yet 💸</h4>
          <p>Add your flights, lodging, activities — anything you're spending on this trip.</p>
          <button class="btn primary sm" onclick="addExpense()" style="margin-top:8px;">+ Add first expense</button>
        </div>
      `:`
        <div class="t-wrap">
          <table class="t">
            <thead><tr>
              <th class="col-name">Expense</th><th class="col-cat">Category</th><th class="col-cost" style="text-align:right;">Cost</th>
              <th class="col-date">Date</th><th class="col-paid">Paid by</th><th class="col-note">Note</th><th class="col-per">Per Person</th>
              <th class="no-print"></th>
            </tr></thead>
            <tbody>${ee||`<tr><td colspan="8" style="padding:20px 12px;color:var(--ink-soft);text-align:center;">${o?`No expenses match "<strong>${k(sr)}</strong>".`:`No expenses involve <strong>${k(i)}</strong> yet.`}</td></tr>`}</tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total</td>
                <td class="num">${A(p)}</td>
                <td colspan="4"></td>
                <td class="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${!t&&s.length>0?`
        <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:13px;">
          <div style="color:var(--ink-soft);">
            ${(()=>{let e=[];o&&e.push(`matching "<strong>${k(sr)}</strong>"`),i&&e.push(`involving <strong>${k(i)}</strong>`);let t=s.length;return`Showing ${t} expense${t===1?``:`s`}${e.length?` `+e.join(` and `):``}.`+(i?` <span style="font-size:11px;">(Tap your name in Overview to clear.)</span>`:``)})()}
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--ink-soft);margin-right:4px;">Page ${l+1} of ${c}</span>
            <button class="btn sm" onclick="setExpensePage(${l-1})" ${l===0?`disabled`:``} style="min-width:32px;padding:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            ${Array.from({length:c},(e,t)=>t).filter(e=>Math.abs(e-l)<=2||e===0||e===c-1).reduce((e,t,n,r)=>(n>0&&t-r[n-1]>1&&e.push(`<span style="color:var(--ink-soft);padding:0 2px;">…</span>`),e.push(`<button class="btn sm ${t===l?`primary`:``}" onclick="setExpensePage(${t})" style="min-width:32px;">${t+1}</button>`),e),[]).join(``)}
            <button class="btn sm" onclick="setExpensePage(${l+1})" ${l===c-1?`disabled`:``} style="min-width:32px;padding:6px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>`:``}

        ${r.length>=1?`
          <h4 style="margin:18px 0 0; margin-bottom: 18px;">Per-person breakdown</h4>
          <div class="panel-sub">Compares each person's share of expenses vs. what they've paid. Click a person to see their expense details.</div>
          <div class="split-summary">
            ${r.map(e=>{let t=m[e]||0,n=(h[e]||0)-t,r=n>.01?`var(--primary)`:n<-.01?`#c0392b`:`var(--ink-soft)`,i=_[e]||0,a=v[e]||0,o=t>0,s=n>.01,c=n<-.01,l=s?a<.01:c?i<.01:!1,u=s?a>.01?`${A(a)} unsettled`:``:i>.01?`${A(i)} unsettled`:``;return`
                <div class="split-pill" onclick="openPersonDetail('${j(e)}')" title="Click to see ${k(e)}'s expenses">
                  <div class="who">${k(e)}</div>
                  <div class="amt">${A(t)}</div>
                  <div class="text-sm" style="color:${r};margin-top:2px;">
                    ${s?`Is owed `+A(n):c?`Owes `+A(-n):`Even`}
                  </div>
                  ${o&&u?`<div class="text-sm" style="color:#c0392b;margin-top:1px;font-size:10px;">${u}</div>`:``}
                  ${o&&l?`<div class="text-sm" style="color:#2e7d32;margin-top:1px;font-size:10px;">✓ All settled</div>`:``}
                </div>
              `}).join(``)}
          </div>
        `:`<div class="hint" style="margin-top:14px;">Add travelers (in Overview tab) to see per-person breakdowns.</div>`}
      `}
    </div>
  `}function hr(e){if(!er())return;let t=O();if(!t)return;let n=t.travelers||[];if(!n.length){alert(`Add travelers first (in the Overview tab) so you can split this expense.`);return}let r=t.expenses[e];r.splitAmong||=n.slice(),r.splitMethod=r.splitMethod||`equal`,r.splitDetails=r.splitDetails||{},Qn({title:`Split: ${r.name||`Expense`} (${A(parseFloat(r.cost)||0)})`,size:`lg`,body:`<div id="split-editor-body"></div>`,actions:[{label:`Done`,primary:!0,onClick:()=>{let t=O();P(t,t.expenses[e]),$n(),M()}}]}),gr(e)}function gr(e){let t=O(),n=t.expenses[e],r=t.travelers||[],i=N(n,r),a=parseFloat(n.cost)||0,o=n.splitMethod||`equal`,s=ir.find(e=>e.id===o)||ir[0],c=fr(n,r),l=Object.values(c).reduce((e,t)=>e+(t||0),0),u=Math.abs(l-a)<.01,d=``,f=``;if(!i.length)d=`<div style="padding:24px;text-align:center;color:var(--ink-soft);">Select at least one traveler above.</div>`;else if(o===`equal`)f=`<div class="split-row-head cols-2"><div>Traveler</div><div style="text-align:right;">Amount</div></div>`,d=i.map(e=>`
      <div class="split-row cols-2">
        <div class="who">${k(e)}</div>
        <div class="amt-out" style="text-align:right;">${A(c[e]||0)}</div>
      </div>
    `).join(``);else if(o===`exact`)f=`<div class="split-row-head cols-2"><div>Traveler</div><div style="text-align:right;">Amount (${b.settings.currency})</div></div>`,d=i.map(t=>`
      <div class="split-row cols-2">
        <div class="who">${k(t)}</div>
        <input class="split-in" type="number" step="0.01" value="${n.splitDetails[t]===void 0?(c[t]||0).toFixed(2):n.splitDetails[t]}"
               onchange="updateSplitDetail(${e}, '${j(t)}', this.value)" style="max-width:140px;margin-left:auto;display:block;text-align:right;"/>
      </div>
    `).join(``);else if(o===`percent`)f=`<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Percent</div><div style="text-align:right;">Amount</div></div>`,d=i.map(t=>{let r=n.splitDetails[t]===void 0?(100/i.length).toFixed(2):n.splitDetails[t];return`
      <div class="split-row cols-3">
        <div class="who">${k(t)}</div>
        <div><input class="split-in" type="number" step="0.01" value="${r}"
                onchange="updateSplitDetail(${e}, '${j(t)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${A(c[t]||0)}</div>
      </div>
    `}).join(``);else if(o===`shares`)f=`<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Shares</div><div style="text-align:right;">Amount</div></div>`,d=i.map(t=>{let r=n.splitDetails[t]===void 0?1:n.splitDetails[t];return`
      <div class="split-row cols-3">
        <div class="who">${k(t)}</div>
        <div><input class="split-in" type="number" step="1" min="0" value="${r}"
                onchange="updateSplitDetail(${e}, '${j(t)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${A(c[t]||0)}</div>
      </div>
    `}).join(``);else if(o===`days`){f=`<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Days</div><div style="text-align:right;">Amount</div></div>`;let r=nr(t)||1;d=i.map(t=>{let i=n.splitDetails[t]===void 0?r:n.splitDetails[t];return`
      <div class="split-row cols-3">
        <div class="who">${k(t)}</div>
        <div><input class="split-in" type="number" step="1" min="0" value="${i}"
                onchange="updateSplitDetail(${e}, '${j(t)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${A(c[t]||0)}</div>
      </div>
    `}).join(``)}else if(o===`adjust`){f=`<div class="split-row-head cols-4"><div>Traveler</div><div style="text-align:right;">Equal share</div><div style="text-align:right;">Adjustment</div><div style="text-align:right;">Final</div></div>`;let t=(a-i.reduce((e,t)=>e+(parseFloat(n.splitDetails[t])||0),0))/i.length;d=i.map(r=>{let i=n.splitDetails[r]===void 0?0:n.splitDetails[r];return`
      <div class="split-row cols-4">
        <div class="who">${k(r)}</div>
        <div class="amt-out muted-out" style="text-align:right;">${A(t)}</div>
        <div class="adj-wrap"><input class="split-in adj" type="number" step="0.01" value="${i}"
                onchange="updateSplitDetail(${e}, '${j(r)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${A(c[r]||0)}</div>
      </div>
    `}).join(``)}let p=``;if(o===`percent`){let e=i.reduce((e,t)=>e+(parseFloat(n.splitDetails[t])||0),0);p=`<div class="split-summary-line">
      <div>Total: <span class="${Math.abs(e-100)<.01?`ok`:`bad`}">${e.toFixed(2)}%</span></div>
      <div>${A(l)} ${u?`<span class="ok">✓ Fully allocated</span>`:`<span class="bad">≠ ${A(a)}</span>`}</div>
    </div>`}else p=o===`shares`?`<div class="split-summary-line">
      <div>Total shares: ${i.reduce((e,t)=>e+(parseFloat(n.splitDetails[t])||0),0)}</div>
      <div>${A(l)} ${u?`<span class="ok">✓ Fully allocated</span>`:`<span class="bad">≠ ${A(a)}</span>`}</div>
    </div>`:o===`days`?`<div class="split-summary-line">
      <div>Total person-days: ${i.reduce((e,t)=>e+(parseFloat(n.splitDetails[t])||0),0)}</div>
      <div>${A(l)} ${u?`<span class="ok">✓ Fully allocated</span>`:`<span class="bad">≠ ${A(a)}</span>`}</div>
    </div>`:`<div class="split-summary-line">
      <div>Total: <strong>${A(l)}</strong></div>
      <div>${u?`<span class="ok">✓ Fully allocated</span>`:`<span class="bad">${A(l-a>0?l-a:a-l)} ${l>a?`over`:`short`}</span>`}</div>
    </div>`;let m=`
    <div class="field">
      <label>Split method</label>
      <div class="split-methods">
        ${ir.map(t=>`
          <button class="split-method ${o===t.id?`sel`:``}" onclick="changeSplitMethod(${e}, '${t.id}')">
            <div class="sm-icon">${t.icon}</div>
            <div class="sm-label">${t.label}</div>
          </button>
        `).join(``)}
      </div>
      <div class="split-desc">${s.desc}</div>
    </div>

    <div class="field">
      <label>Who's involved? (${i.length} of ${r.length})</label>
      ${(()=>{let i=(t.groups||[]).filter(e=>e.members.filter(e=>r.includes(e)).length>0);return i.length?`<div class="split-group-row">
          ${i.map(i=>{let a=i.members.filter(e=>r.includes(e)),o=a.every(e=>(n.splitAmong||r).includes(e)),s=(t.groups||[]).indexOf(i);return`<button class="group-chip-btn ${o?`selected`:``}"
              onclick="toggleGroupParticipants(${e}, ${s})">
              ${k(i.name)} <span style="opacity:0.7;font-weight:400;">${a.length}</span>
            </button>`}).join(``)}
        </div>`:``})()}
      <div class="split-participants">
        ${r.map(t=>`
            <label class="split-chip ${(n.splitAmong||r).includes(t)?`on`:``}" onclick="toggleSplitParticipant(${e}, '${j(t)}')">
              <div class="dot"></div> ${k(t)}
            </label>
          `).join(``)}
        <button class="split-chip" style="background:transparent;font-weight:600;color:var(--primary);"
                onclick="setAllSplitParticipants(${e}, ${i.length===r.length})">
          ${i.length===r.length?`Clear all`:`Select all`}
        </button>
      </div>
    </div>

    <div class="field">
      <label>Allocation</label>
      <div class="split-rows">
        ${f}
        ${d}
      </div>
      ${p}
      ${o!==`equal`&&i.length?`
        <div style="margin-top:8px;display:flex;justify-content:flex-end;">
          <button class="btn sm" onclick="splitAutoBalance(${e})">⚖ Auto-balance</button>
        </div>
      `:``}
    </div>
  `;document.getElementById(`split-editor-body`).innerHTML=m}function _r(e,t){let n=O(),r=n.expenses[e];r.splitMethod=t;let i=N(r,n.travelers||[]);if(r.splitDetails={},t===`percent`){let e=i.length?100/i.length:0;i.forEach(t=>r.splitDetails[t]=parseFloat(e.toFixed(2)))}else if(t===`shares`)i.forEach(e=>r.splitDetails[e]=1);else if(t===`days`){let e=nr(n)||1;i.forEach(t=>r.splitDetails[t]=e)}else if(t===`adjust`)i.forEach(e=>r.splitDetails[e]=0);else if(t===`exact`){let e=parseFloat(r.cost)||0,t=i.length?e/i.length:0;i.forEach(e=>r.splitDetails[e]=parseFloat(t.toFixed(2)))}P(n,r),gr(e)}function vr(e,t,n){let r=O(),i=r.expenses[e];i.splitDetails=i.splitDetails||{},i.splitDetails[t]=parseFloat(n)||0,P(r,i),gr(e)}function yr(e,t){let n=O(),r=n.expenses[e];r.splitAmong=r.splitAmong||(n.travelers||[]).slice();let i=r.splitAmong.indexOf(t);i>=0?r.splitAmong.splice(i,1):r.splitAmong.push(t),r.splitDetails&&Object.keys(r.splitDetails).forEach(e=>{r.splitAmong.includes(e)||delete r.splitDetails[e]}),P(n,r),gr(e)}function br(e,t){let n=O(),r=n.expenses[e];r.splitAmong=t?[]:(n.travelers||[]).slice(),P(n,r),gr(e)}function xr(e,t){let n=O(),r=n.expenses[e],i=n.travelers||[],a=(n.groups||[])[t];if(!a)return;let o=a.members.filter(e=>i.includes(e));r.splitAmong=r.splitAmong||i.slice(),o.every(e=>r.splitAmong.includes(e))?r.splitAmong=r.splitAmong.filter(e=>!o.includes(e)):o.forEach(e=>{r.splitAmong.includes(e)||r.splitAmong.push(e)}),r.splitDetails&&Object.keys(r.splitDetails).forEach(e=>{r.splitAmong.includes(e)||delete r.splitDetails[e]}),P(n,r),gr(e)}function Sr(e){let t=O(),n=t.expenses[e],r=parseFloat(n.cost)||0,i=N(n,t.travelers||[]);if(!i.length)return;let a=n.splitMethod;if(a===`percent`){let e=i[i.length-1],t=0;for(let e=0;e<i.length-1;e++)t+=parseFloat(n.splitDetails[i[e]])||0;n.splitDetails[e]=parseFloat((100-t).toFixed(2))}else if(a===`exact`){let e=i[i.length-1],t=0;for(let e=0;e<i.length-1;e++)t+=parseFloat(n.splitDetails[i[e]])||0;n.splitDetails[e]=parseFloat((r-t).toFixed(2))}else a===`adjust`&&i.forEach(e=>n.splitDetails[e]=0);P(t,n),gr(e)}function P(e,t){let n=e.travelers||[];Zn({type:`syncExpenseParticipants`,tripId:e.id,expenseId:t.id,paidBy:t.paidBy||[],splitAmong:N(t,n),settledBy:t.settledBy||[],splitMethod:t.splitMethod||`equal`,splitDetails:t.splitDetails||{}})}function Cr(e){if(!er())return;let t=O();if(!t)return;if(!(t.travelers||[]).length){alert(`Add travelers first (in the Overview tab).`);return}let n=t.expenses[e];n.paidBy=n.paidBy||[],n.settledBy=n.settledBy||[],Qn({title:`Payment: ${n.name||`Expense`} (${A(parseFloat(n.cost)||0)})`,size:`lg`,body:`<div id="payer-dialog-body"></div>`,actions:[{label:`Done`,primary:!0,onClick:()=>{let t=O();P(t,t.expenses[e]),$n(),M()}}]}),wr(e)}function wr(e){let t=O(),n=t.expenses[e],r=t.travelers||[],i=N(n,r);parseFloat(n.cost);let a=fr(n,r),o=n.paidBy||[],s=n.settledBy||[],c=r.map(t=>`<div class="settle-payer-chip ${o.includes(t)?`on`:``}" onclick="dialogTogglePayer(${e}, '${j(t)}')">
      <div class="chip-dot"></div> ${k(t)}
    </div>`).join(``),l=``;if(o.length>0&&i.length>0){let t=i.map(t=>{let n=a[t]||0,r=o.includes(t),i=s.includes(t),c;return c=r?`<div class="settle-toggle is-payer">Payer</div>`:`<div class="settle-toggle ${i?`settled`:``}" onclick="dialogToggleSettle(${e}, '${j(t)}')">
          ${i?`✓ Settled`:`Unsettled`}
        </div>`,`<div class="settle-row">
        <div class="settle-name">${k(t)}</div>
        <div class="settle-amt">${A(n)}</div>
        ${c}
      </div>`}).join(``),n=i.filter(e=>!o.includes(e)),r=n.filter(e=>s.includes(e)).length,c=n.filter(e=>!s.includes(e)).reduce((e,t)=>e+(a[t]||0),0);l=`
      <div class="settle-section">
        <div class="settle-section-label">Settle up</div>
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:10px;">
          Mark participants as settled once they've paid back the payer${o.length>1?`s`:``}.
        </div>
        <div class="settle-rows">${t}</div>
        <div class="settle-summary">
          <span>${r}/${n.length} settled</span>
          <span style="color:${c>.01?`#c0392b`:`#2e7d32`}">
            ${c>.01?A(c)+` unsettled`:`✓ All settled`}
          </span>
        </div>
      </div>
    `}else o.length===0&&(l=`<div style="padding:16px;text-align:center;color:var(--ink-soft);font-size:13px;">Select who paid above to track settlements.</div>`);document.getElementById(`payer-dialog-body`).innerHTML=`
    <div class="settle-section">
      <div class="settle-section-label">Who paid?</div>
      <div style="font-size:12px;color:var(--ink-soft);margin-bottom:8px;">Select the person(s) who paid for this expense upfront.</div>
      <div class="settle-payer-chips">${c}</div>
    </div>
    ${l}
  `}function Tr(e,t){let n=O(),r=n.expenses[e];r.paidBy=r.paidBy||[];let i=r.paidBy.indexOf(t);if(i>=0?r.paidBy.splice(i,1):r.paidBy.push(t),i>=0&&r.settledBy){let e=r.settledBy.indexOf(t);e>=0&&r.settledBy.splice(e,1)}P(n,r),wr(e)}function Er(e,t){let n=O(),r=n.expenses[e];r.settledBy=r.settledBy||[];let i=r.settledBy.indexOf(t);i>=0?r.settledBy.splice(i,1):r.settledBy.push(t),P(n,r),wr(e)}function Dr(e){if(!er())return;let t=O(),n=getMyTraveler(t.id);if(!n)return;let r=t.travelers||[];Qn({title:`Settle up with ${k(e)}?`,size:`sm`,body:`<p>Mark all outstanding expenses between <strong>${k(n)}</strong> and <strong>${k(e)}</strong> as settled — in both directions.</p>`,actions:[{label:`Settle all`,primary:!0,onClick:()=>{(t.expenses||[]).forEach(i=>{let a=i.paidBy&&i.paidBy.length?i.paidBy:[],o=N(i,r),s=!1;a.includes(e)&&o.includes(n)&&!a.includes(n)&&!(i.settledBy||[]).includes(n)&&(i.settledBy=[...i.settledBy||[],n],s=!0),a.includes(n)&&o.includes(e)&&!a.includes(e)&&!(i.settledBy||[]).includes(e)&&(i.settledBy=[...i.settledBy||[],e],s=!0),s&&P(t,i)}),$n(),M()}},{label:`Cancel`,onClick:$n}]})}function Or(e,t){if(!er())return;let n=O(),r=n.expenses[e];r&&(r.settledBy=r.settledBy||[],r.settledBy.includes(t)||(r.settledBy.push(t),P(n,r),M()))}function kr(e){let t=getMyTraveler(e.id);if(!t)return{owesMe:[],iOwe:[]};let n=e.travelers||[],r=[],i=[];return(e.expenses||[]).forEach((e,a)=>{if(!parseFloat(e.cost))return;let o=e.paidBy&&e.paidBy.length?e.paidBy:[],s=N(e,n),c=fr(e,n),l=e.settledBy||[];o.includes(t)&&s.forEach(n=>{n===t||o.includes(n)||l.includes(n)||r.push({name:n,amount:c[n]||0,expenseIdx:a,expenseName:e.name||`Untitled`})}),!o.includes(t)&&s.includes(t)&&!l.includes(t)&&o.forEach(n=>{i.push({name:n,amount:(c[t]||0)/o.length,expenseIdx:a,expenseName:e.name||`Untitled`})})}),{owesMe:r,iOwe:i}}function Ar(e){let t=O();if(!t)return;let n=t.expenses||[],r=t.travelers||[],i=[],a=0,o=0,s=0,c=0,l=0;n.forEach((t,n)=>{let u=parseFloat(t.cost)||0,d=N(t,r),f=t.paidBy&&t.paidBy.length?t.paidBy:r[0]?[r[0]]:[],p=f.includes(e);if(!d.includes(e)&&!p)return;let m=fr(t,r),h=d.includes(e)&&m[e]||0;a+=h;let g=0;p&&(g=u/f.length),o+=g;let _=(t.settledBy||[]).includes(e),v,ee=0,y=0;if(p){let e=d.filter(e=>!f.includes(e));y=e.length,ee=e.filter(e=>(t.settledBy||[]).includes(e)).length,v=y===0?`payer-solo`:ee===y?`payer-full`:ee===0?`payer-none`:`payer-partial`,s+=h,e.filter(e=>!(t.settledBy||[]).includes(e)).forEach(e=>{l+=m[e]||0})}else _?(v=`settled`,s+=h):(v=`unsettled`,c+=h);i.push({name:t.name||`Untitled`,category:t.category||`Misc`,date:t.date||``,totalCost:u,share:h,paidAmount:g,status:v,settledCount:ee,debtorCount:y,index:n})});let u=l-c,d=u>.01?`positive`:u<-.01?`negative`:`even`,f=u>.01?`Is owed `+A(u):u<-.01?`Owes `+A(-u):`Even`,p=e=>{let t=e.status;return t===`payer-full`||t===`payer-solo`?`<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Fully recovered</span>`:t===`payer-partial`?`<span style="display:inline-block;background:#fff8e1;color:#f57f17;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">${e.settledCount}/${e.debtorCount} settled</span>`:t===`payer-none`?`<span style="display:inline-block;background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Awaiting payment</span>`:t===`settled`?`<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Settled</span>`:`<span style="display:inline-block;background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Unsettled</span>`},m=i.length?i.map(e=>`
    <tr>
      <td><strong>${k(e.name)}</strong></td>
      <td class="cat-badge"><span>${k(e.category)}</span></td>
      <td class="num">${A(e.totalCost)}</td>
      <td>${e.date||`—`}</td>
      <td class="num">${A(e.share)}</td>
      <td class="num">${e.status.startsWith(`payer`)?A(e.paidAmount):e.status===`settled`?A(e.share):A(0)}</td>
      <td style="text-align:center;">${p(e)}</td>
    </tr>
  `).join(``):`<tr><td colspan="7" style="text-align:center;color:var(--ink-soft);padding:24px;">No expenses yet</td></tr>`;Qn({title:`${k(e)}'s Expenses`,size:`lg`,body:`
      <div class="person-detail-summary" style="grid-template-columns:repeat(4,1fr);">
        <div class="person-detail-stat">
          <div class="label">Total Owed</div>
          <div class="value">${A(a)}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Total Paid</div>
          <div class="value">${A(o)}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Balance</div>
          <div class="value ${d}">${f}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Settled</div>
          <div class="value ${c<.01&&a>0?`positive`:c>.01?`negative`:`even`}">
            ${a>0?c<.01?`✓ All`:A(c)+` left`:`—`}
          </div>
        </div>
      </div>
      <div class="person-detail-expenses">
        <table>
          <thead>
            <tr>
              <th>Expense</th>
              <th>Category</th>
              <th class="num">Total Cost</th>
              <th>Date</th>
              <th class="num">Their Share</th>
              <th class="num">Paid</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>${m}</tbody>
          ${i.length?`
          <tfoot>
            <tr>
              <td colspan="4">Total</td>
              <td class="num">${A(a)}</td>
              <td class="num">${A(o)}</td>
              <td></td>
            </tr>
          </tfoot>`:``}
        </table>
      </div>
    `,actions:[{label:`Close`,primary:!0,onClick:()=>$n()}]})}function jr(){if(!er())return;let e=O();e.expenses=e.expenses||[];let t={id:tr(),name:``,category:`Misc`,cost:null,date:``,paidBy:[],settledBy:[],note:``};e.expenses.push(t),Zn({type:`addExpense`,tripId:e.id,expense:t}),M()}function Mr(e,t,n){if(!er())return;let r=O(),i=r.expenses[e];i[t]=n,[`name`,`category`,`cost`,`date`,`note`].includes(t)?Zn({type:`updateExpense`,expenseId:i.id,fields:{[t]:n}}):P(r,i),(t===`cost`||t===`paidBy`)&&M()}function Nr(e){if(!er())return;let t=O(),[n]=t.expenses.splice(e,1);Zn({type:`deleteExpense`,tripId:t.id,expenseId:n.id}),M()}Object.assign(window,{setExpensePage:lr,setExpensePageSize:ur,setExpenseSearch:dr,expenseParticipants:N,computeSplit:fr,renderExpenses:mr,openSplitEditor:hr,changeSplitMethod:_r,updateSplitDetail:vr,toggleSplitParticipant:yr,setAllSplitParticipants:br,toggleGroupParticipants:xr,splitAutoBalance:Sr,openPayerDialog:Cr,dialogTogglePayer:Tr,dialogToggleSettle:Er,settleWithPerson:Dr,settleOneDebt:Or,buildDetailedDebts:kr,openPersonDetail:Ar,addExpense:jr,updateExpense:Mr,deleteExpense:Nr});var F=()=>window.render(),I=e=>window.mutate(e),Pr=e=>window.showModal(e),Fr=()=>window.closeModal(),Ir=()=>window.guardEdit(),L=()=>window.currentTrip(),R=e=>window.escapeHtml(e),Lr=e=>window.parseDate(e),Rr=()=>window.isEditing(),zr=[`6:00 AM`,`7:00 AM`,`8:00 AM`,`9:00 AM`,`10:00 AM`,`11:00 AM`,`12:00 PM`,`1:00 PM`,`2:00 PM`,`3:00 PM`,`4:00 PM`,`5:00 PM`,`6:00 PM`,`7:00 PM`,`8:00 PM`,`9:00 PM`,`10:00 PM`,`11:00 PM`],z=0;Object.defineProperty(window,"itinMobileDay",{get(){return z},set(e){z=e},configurable:!0});function Br(e){let t=L();t&&(z=Math.max(0,Math.min(t.itinerary.length-1,z+e)),F())}function Vr(){let e=L();if(!e)return;let t=Math.max(0,Math.min(e.itinerary.length-1,z)),n=e.itinerary[t],r=e.timeSlots||zr,i=Lr(e.startDate),a=`Day ${t+1}`;if(i){let e=new Date(i);e.setDate(e.getDate()+t),a=e.toLocaleDateString(void 0,{weekday:`long`,month:`long`,day:`numeric`})}let o=[],s=new Set;r.forEach((e,t)=>{if(s.has(t))return;let i=n.slots[t];if(!i||!i.activity?.trim())return;let a=Math.min(i.span||1,r.length-t);for(let e=1;e<a;e++)s.add(t+e);let c=a>1?`${e} – ${slotEndLabel(r,t+a)}`:e;o.push({time:c,activity:i.activity,address:i.address})});let c=o.length?o.map(e=>`
        <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);">
          <div style="min-width:100px;font-size:11px;color:var(--ink-soft);font-weight:600;font-variant-numeric:tabular-nums;padding-top:2px;">${e.time}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">${R(e.activity)}</div>
            ${e.address?`<div style="font-size:11px;color:var(--ink-soft);margin-top:3px;">📍 ${R(e.address)}</div>`:``}
          </div>
        </div>`).join(``):`<p style="color:var(--ink-soft);text-align:center;padding:24px 0;">No activities planned for this day yet.</p>`,l=n.theme?` · ${n.theme}`:``;Pr({title:`${R(a)}${R(l)}`,body:`<div style="max-height:65vh;overflow-y:auto;">${c}</div>`,actions:[{label:`Close`,primary:!0,onClick:Fr}]})}function Hr(e){let t=e.timeSlots||zr,n=Lr(e.startDate),r=window.innerWidth<=600;z=Math.max(0,Math.min(e.itinerary.length-1,z));let i=r?[z]:e.itinerary.map((e,t)=>t),a=`grid-template-columns: 80px repeat(${i.length}, minmax(160px, 1fr)); grid-template-rows: auto repeat(${t.length}, minmax(46px, auto));`,o=``;o+=`<div class="itin-cell time itin-time-hdr" style="grid-row:1; grid-column:1;">Time</div>`,i.forEach((t,r)=>{let i=e.itinerary[t],a=``;if(n){let e=new Date(n);e.setDate(e.getDate()+t),a=e.toLocaleDateString(void 0,{weekday:`short`,month:`short`,day:`numeric`})}let s=t+1,c=e.travelerSchedule||{},l=Object.entries(c).filter(([,e])=>e.joinDay===s).map(([e])=>e),u=Object.entries(c).filter(([,e])=>e.leaveDay===s).map(([e])=>e),d=[...l.map(e=>`<div class="itin-trav-sched join">👋 ${R(e)}</div>`),...u.map(e=>`<div class="itin-trav-sched leave">${R(e)} ↗</div>`)].join(``);o+=`
      <div class="itin-cell daycol" style="grid-row:1; grid-column:${r+2};">
        <div class="dnum">Day ${t+1}</div>
        ${a?`<div class="ddate">${a}</div>`:``}
        ${d}
        <input class="theme-in" value="${R(i.theme||``)}" placeholder="Day theme..." onchange="updateDayTheme(${t}, this.value)" />
      </div>`}),i.forEach((n,r)=>{let i=e.itinerary[n],a=new Set;t.forEach((s,c)=>{if(a.has(c))return;i.slots[c]||(i.slots[c]={time:s,activity:``});let l=i.slots[c],u=l.activity||``,d=!!(u||l.filled),f=Math.min(l.span||1,t.length-c);for(let e=1;e<f;e++)a.add(c+e);let p=f>1?`grid-row: ${c+2} / span ${f}`:`grid-row: ${c+2}`,m=`grid-column: ${r+2}`,h=u?f>1?`${t[c]} – ${slotEndLabel(t,c+f)}`:t[c]:``,g=l.reservationId||``,_=g?(e.reservations||[]).find(e=>e.id===g):null,v=_?`
        <div class="slot-res-badge ${_.status||`pending`}">
          ${_.status===`booked`?`✓`:_.status===`cancelled`?`✗`:`⏳`}
          ${R(_.name)}
        </div>`:``,ee=u&&Rr()?`
        <button class="slot-res-link-btn ${_?`linked`:``}"
                onclick="openResLinkPicker(${n},${c})" title="${_?`Change reservation link`:`Link reservation`}">
          🔗
        </button>`:``,y=l.address||``,te=y?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(y)}`:``,ne=u&&Rr()&&!y?`
        <input class="slot-addr-input" value="" placeholder="📍 Add address..."
               onchange="updateSlotField(${n},${c},'address',this.value)"
               onclick="event.stopPropagation()" />`:``,re=u&&y?`
        <div class="slot-addr-row">
          <a class="slot-addr-link" href="${te}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${R(y)}
          </a>
          ${Rr()?`<button class="slot-addr-clear" onclick="event.stopPropagation();updateSlotField(${n},${c},'address','')" title="Remove address">✕</button>`:``}
        </div>`:``,ie=d&&Rr()?`
        <button class="slot-delete-btn" onclick="event.stopPropagation();deleteSlot(${n},${c})" title="Remove activity">✕</button>`:``;o+=`<div class="itin-cell slot ${d?`filled`:``}" style="${p}; ${m};"
                     data-didx="${n}" data-sidx="${c}" data-span="${f}">
        <div class="slot-content">
          ${h?`<div class="slot-time-badge">${h}</div>`:``}
          <textarea class="autogrow" onchange="updateSlot(${n}, ${c}, this.value)" placeholder="${d&&!u?`Enter activity...`:``}">${R(u)}</textarea>
          ${ne}
          ${re}
          ${v}
        </div>
        ${u?`<div class="drag-handle" onmousedown="startSlotDrag(event, ${n}, ${c})"></div>`:``}
        ${d?`<div class="slot-btns">${u?`<button class="mobile-edit-btn" onclick="openActivityTimeDialog(${n}, ${c})" title="Edit time">⏱</button>`:``}${ee}${ie}</div>`:``}
      </div>`})}),t.forEach((e,t)=>{o+=`<div class="itin-cell time" style="grid-row:${t+2}; grid-column:1;">${e}</div>`});let s=``;if(n){let e=new Date(n);e.setDate(e.getDate()+z),s=e.toLocaleDateString(void 0,{weekday:`short`,month:`short`,day:`numeric`})}return`
    <div class="panel">
      <div class="panel-head">
        <h3>Day-by-day itinerary</h3>
        <div class="actions">
          <button class="btn sm" onclick="openTimeSlotsEditor()">⏱ Edit time slots</button>
        </div>
      </div>
      <div class="panel-sub no-print">Tap any cell to add an activity. Drag the bottom edge to span multiple hours. On mobile, tap ⏱ to set duration.</div>
      ${`
    <div class="itin-day-nav">
      <button class="itin-day-nav-btn" onclick="navItinDay(-1)" ${z===0?`disabled`:``}>‹</button>
      <div class="itin-day-nav-center">
        <div class="itin-day-label">Day ${z+1} of ${e.itinerary.length}</div>
        ${s?`<div class="itin-day-date-label">${s}</div>`:``}
        <button class="itin-day-summary-btn" onclick="showDaySummary()">📋 Day summary</button>
      </div>
      <button class="itin-day-nav-btn" onclick="navItinDay(1)" ${z===e.itinerary.length-1?`disabled`:``}>›</button>
    </div>`}
      <div class="itin-grid-wrap">
        <div class="itin-grid" style="${a}">
          ${o}
        </div>
      </div>
    </div>
  `}function Ur(e,t){let n=L(),r=n.itinerary[e]?.slots[t];if(!r)return;let i=(n.reservations||[]).filter(e=>e.name?.trim()),a=r.reservationId||``,o=Lr(n.startDate),s=``;if(o){let t=new Date(o);t.setDate(t.getDate()+e),s=t.toISOString().slice(0,10)}let c={booked:`✓`,pending:`⏳`,cancelled:`✗`};Pr({title:`Link reservation`,size:`sm`,body:`
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
        Choose a reservation to link to <strong>${R(r.activity)}</strong>.
      </p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${i.length?i.map(n=>{let r=n.id===a,i=s&&n.dueDate?.startsWith(s);return`
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;cursor:pointer;
                          border:1.5px solid ${r?`var(--primary)`:`var(--line)`};
                          background:${r?`var(--primary-soft)`:`var(--surface-2)`};user-select:none;">
              <input type="radio" name="res-pick" value="${n.id}" ${r?`checked`:``}
                     style="accent-color:var(--primary);" onchange="linkSlotReservation(${e},${t},'${n.id}')" />
              <span style="flex:1;font-size:13px;font-weight:600;">${R(n.name)}</span>
              <span class="slot-res-badge ${n.status||`pending`}" style="pointer-events:none;">
                ${c[n.status]||`⏳`} ${n.status||`pending`}
              </span>
              ${i&&!r?`<span style="font-size:10px;color:var(--primary);">same day</span>`:``}
            </label>`}).join(``):`<p class="muted text-sm">No named reservations yet. Add some in the Reservations tab.</p>`}
      </div>
      ${a?`<button class="btn sm ghost" style="margin-top:12px;color:#c0392b;"
                             onclick="linkSlotReservation(${e},${t},'')">✕ Remove link</button>`:``}
    `,actions:[{label:`Done`,primary:!0,onClick:()=>{Fr(),F()}}]})}function Wr(e,t,n){let r=L();if(!r.itinerary[e]?.slots[t])return;r.itinerary[e].slots[t].reservationId=n||void 0;let i=r.itinerary[e];I({type:`updateDaySlots`,tripId:r.id,dayId:i.id,slots:i.slots})}function Gr(e,t,n,r){if(!Ir())return;let i=L();if(!i.itinerary[e]?.slots[t])return;i.itinerary[e].slots[t][n]=r||void 0;let a=i.itinerary[e];I({type:`updateDaySlots`,tripId:i.id,dayId:a.id,slots:a.slots}),F()}function Kr(e,t){if(!Ir())return;let n=L();n.itinerary[e].theme=t,I({type:`updateDayTheme`,tripId:n.id,dayId:n.itinerary[e].id,theme:t})}function qr(e,t,n){if(!Ir())return;let r=L();r.itinerary[e].slots[t]||(r.itinerary[e].slots[t]={time:(r.timeSlots||zr)[t],activity:``});let i=r.itinerary[e].slots[t],a=!!(n&&n.trim());i.activity=n,i.filled=a,a||(i.span=1);let o=r.itinerary[e];I({type:`updateDaySlots`,tripId:r.id,dayId:o.id,slots:o.slots}),F()}function Jr(e,t){if(!Ir())return;let n=L(),r=n.itinerary[e]?.slots[t];r&&Pr({title:`Remove activity`,size:`sm`,body:`<p style="margin:0;font-size:14px;">Remove ${r.activity?.trim()?`"${r.activity.trim().substring(0,40)}"`:`this activity`} from the itinerary? This cannot be undone.</p>`,actions:[{label:`Cancel`,onClick:Fr},{label:`Remove`,danger:!0,onClick:()=>{r.activity=``,r.filled=!1,r.span=1,delete r.address,delete r.reservationId;let t=n.itinerary[e];I({type:`updateDaySlots`,tripId:n.id,dayId:t.id,slots:t.slots}),Fr(),F()}}]})}function Yr(){if(!Ir())return;let e=L(),t=e.timeSlots||zr,n=t[0]||`7:00 AM`,r=t[t.length-1]||`11:00 PM`,i=60;if(t.length>=2){let e=parseTime12(t[0]),n=parseTime12(t[1]);e!==null&&n!==null&&n>e&&(i=n-e)}let a=allHalfHourTimes(),o=e=>a.map(t=>`<option${t===e?` selected`:``}>${t}</option>`).join(``);Pr({title:`Time slots`,size:`sm`,body:`
      <div class="activity-time-form">
        <p style="font-size:13px;color:var(--ink-soft);margin:0 0 4px;">Choose the time range and interval. All days share the same slots.</p>
        <div class="field-row">
          <label>First slot</label>
          <select id="tse-start" oninput="(function(){const a=allHalfHourTimes(),s=document.getElementById('tse-start').value,l=document.getElementById('tse-last').value;if(a.indexOf(l)<=a.indexOf(s)){const ni=Math.min(a.indexOf(s)+2,a.length-1);document.getElementById('tse-last').value=a[ni];}document.getElementById('tse-preview').textContent=''+(function(){const g=generateSlotsFromRange(s,document.getElementById('tse-last').value,parseInt(document.getElementById('tse-interval').value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';})();})()">
            ${o(n)}
          </select>
        </div>
        <div class="field-row">
          <label>Last slot</label>
          <select id="tse-last" oninput="document.getElementById('tse-preview').textContent=(function(){const g=generateSlotsFromRange(document.getElementById('tse-start').value,this.value,parseInt(document.getElementById('tse-interval').value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';}).call(this)">
            ${o(r)}
          </select>
        </div>
        <div class="field-row">
          <label>Interval</label>
          <select id="tse-interval" oninput="document.getElementById('tse-preview').textContent=(function(){const g=generateSlotsFromRange(document.getElementById('tse-start').value,document.getElementById('tse-last').value,parseInt(this.value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';}).call(this)">
            <option value="30" ${i===30?`selected`:``}>Every 30 minutes</option>
            <option value="60" ${i===60?`selected`:``}>Every 1 hour</option>
            <option value="120" ${i===120?`selected`:``}>Every 2 hours</option>
          </select>
        </div>
        <div id="tse-preview" style="font-size:12px;color:var(--ink-soft);padding:6px 0;"></div>
      </div>
    `,onOpen:()=>{let e=generateSlotsFromRange(n,r,i),t=document.getElementById(`tse-preview`);t&&(t.textContent=e.length?`${e.length} slots: ${e[0]} → ${e[e.length-1]}`:`No slots`)},actions:[{label:`Cancel`,onClick:Fr},{label:`Save`,primary:!0,onClick:()=>{let t=document.getElementById(`tse-start`).value,n=document.getElementById(`tse-last`).value,r=parseInt(document.getElementById(`tse-interval`).value),i=generateSlotsFromRange(t,n,r);if(!i.length)return alert(`No slots generated — make sure first slot is before last slot.`);e.timeSlots=i,e.itinerary.forEach(e=>{let t={};(e.slots||[]).forEach(e=>{t[e.time]={activity:e.activity,span:e.span,filled:e.filled}}),e.slots=i.map(e=>({time:e,activity:(t[e]||{}).activity||``,span:(t[e]||{}).span||1,...t[e]?.filled?{filled:!0}:{}}))}),I({type:`syncTimeSlots`,tripId:e.id,timeSlots:e.timeSlots,days:e.itinerary}),Fr(),F()}}]})}var Xr=null;function Zr(e,t,n){if(!Rr())return;e.preventDefault();let r=L(),i=r.timeSlots||zr,a=e.target.closest(`.itin-cell.slot`);if(!a)return;let o=a.closest(`.itin-grid`).querySelectorAll(`.itin-cell.time:not(.daycol)`),s=[];o.forEach(e=>{e.style.gridRow&&parseInt(e.style.gridRow)>=2&&s.push(e)});let c=s.map(e=>{let t=e.getBoundingClientRect();return{top:t.top,bottom:t.bottom,mid:t.top+t.height/2}});Xr={dIdx:t,sIdx:n,startSpan:r.itinerary[t].slots[n].span||1,rowBounds:c,maxSpan:i.length-n};let l=e=>{if(!Xr)return;let i=e.touches?e.touches[0].clientY:e.clientY,o=1;for(let e=n;e<Xr.rowBounds.length;e++)i>=Xr.rowBounds[e].mid&&(o=e-n+1);o=Math.max(1,Math.min(o,Xr.maxSpan));let s=r.itinerary[t];for(let e=1;e<o;e++){let t=s.slots[n+e];if(t&&(t.filled||t.activity&&t.activity.trim())){o=e;break}}if(o!==(r.itinerary[t].slots[n].span||1)){r.itinerary[t].slots[n].span=o;for(let e=1;e<o;e++)s.slots[n+e]&&(s.slots[n+e].span=1);a.style.gridRow=`${n+2} / span ${o}`}},u=()=>{Xr=null,document.removeEventListener(`mousemove`,l),document.removeEventListener(`mouseup`,u),document.removeEventListener(`touchmove`,l),document.removeEventListener(`touchend`,u);let e=L(),n=e?.itinerary[t];n&&I({type:`updateDaySlots`,tripId:e.id,dayId:n.id,slots:n.slots}),F()};document.addEventListener(`mousemove`,l),document.addEventListener(`mouseup`,u),document.addEventListener(`touchmove`,l,{passive:!1}),document.addEventListener(`touchend`,u)}function Qr(e,t){let n=L();if(!n)return;let r=n.timeSlots||zr,i=n.itinerary[e],a=i.slots[t],o=a.span||1,s=Lr(n.startDate),c=`Day ${e+1}`;if(s){let t=new Date(s);t.setDate(t.getDate()+e),c=t.toLocaleDateString(void 0,{weekday:`short`,month:`short`,day:`numeric`})}let l=r.map((e,n)=>`<option value="${n}" ${n===t?`selected`:``}>${e}</option>`).join(``),u=t+o,d=[];for(let e=t+1;e<=r.length;e++){let n=!1;for(let r=t+1;r<e;r++)if(i.slots[r]&&i.slots[r].activity&&i.slots[r].activity.trim()){n=!0;break}if(n)break;let a=slotEndLabel(r,e);d.push(`<option value="${e}" ${e===u?`selected`:``}>${a}</option>`)}let f=d.join(``);Pr({title:`${R(a.activity||`Activity`)}`,size:`sm`,body:`
      <div class="activity-time-form">
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:4px;">${c}</div>
        <div class="field">
          <label>Activity</label>
          <textarea id="atd-activity" rows="2" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:14px;">${R(a.activity||``)}</textarea>
        </div>
        <div class="field-row">
          <label>Start</label>
          <select id="atd-start">${l}</select>
        </div>
        <div class="field-row">
          <label>End</label>
          <select id="atd-end">${f}</select>
        </div>
      </div>
    `,actions:[{label:`Cancel`,onClick:Fr},{label:`Save`,primary:!0,onClick:()=>{let e=document.getElementById(`atd-activity`).value,a=parseInt(document.getElementById(`atd-start`).value),o=parseInt(document.getElementById(`atd-end`).value),s=Math.max(1,o-a);a===t?(i.slots[t].activity=e,i.slots[t].span=s):(i.slots[t].activity=``,i.slots[t].span=1,i.slots[a]||(i.slots[a]={time:r[a],activity:``}),i.slots[a].activity=e,i.slots[a].span=s),I({type:`updateDaySlots`,tripId:n.id,dayId:i.id,slots:i.slots}),Fr(),F()}}]})}Object.assign(window,{renderItinerary:Hr,navItinDay:Br,showDaySummary:Vr,openTimeSlotsEditor:Yr,openResLinkPicker:Ur,linkSlotReservation:Wr,updateSlotField:Gr,updateDayTheme:Kr,updateSlot:qr,deleteSlot:Jr,startSlotDrag:Zr,openActivityTimeDialog:Qr});var B=()=>window.render(),V=e=>window.mutate(e),$r=e=>window.showModal(e),H=()=>window.closeModal(),U=()=>window.guardEdit(),ei=()=>window.currentTrip(),W=e=>window.escapeHtml(e),G=e=>window.fmtCurrency(e),K=e=>window.escapeAttr(e),ti=()=>window.uid(),ni=e=>window.fmtBookingTime(e),ri=e=>window.tripDuration(e),ii=()=>window.isEditing(),ai=()=>window.isShareMode();function oi(e,t,n,r){let i=(t.travelerSchedule||{})[e],a=i?` <span class="trav-schedule-badge">Day ${i.joinDay}–${i.leaveDay??`?`}</span>`:``,o=r?`<button class="trav-schedule-btn" onclick="event.stopPropagation();openTravelerScheduleModal('${K(e)}','${K(t.id)}')" title="Set join/leave days">📅</button>`:``,s=`<button class="trav-remove-x" onclick="event.stopPropagation();removeTraveler('${K(e)}')" title="Remove ${K(e)}">✕</button>`,c=r?``:`onclick="setMyTraveler('${K(e)}')"`;return`<span class="tag ${n?`is-me`:``}" ${c} ${r?``:`title="${n?`This is you! Click to unset.`:`Click to set as you`}"`}>${W(e)}${a}${n?` <span class="me-badge">(You)</span>`:``}${o}${s}</span>`}function si(e){let t=(e.expenses||[]).reduce((e,t)=>e+(parseFloat(t.cost)||0),0),n=Math.max(1,(e.travelers||[]).length),r=(e.reservations||[]).filter(e=>e.status!==`booked`&&e.status!==`cancelled`&&e.name?.trim()).slice(0,3),i=(e.tasks||[]).filter(e=>e.status!==`done`&&e.title?.trim()).slice(0,3),a=(e.itinerary||[]).map((e,t)=>({i:t+1,theme:e.theme})).filter(e=>e.theme),o=document.documentElement.getAttribute(`data-share`)===`read`,s=(e.announcements||[]).filter(e=>e.pinned),c=(e.announcements||[]).filter(e=>!e.pinned),l=ii();return`
    <div class="panel">
      ${Si(e,s,c,o,l)}
      <div class="panel-head">
        <h3>At a glance</h3>
      </div>

      <div class="overview-grid">

        ${renderWeatherWidget(e)}

        <div class="stat overview-travelers" style="padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div class="stat-label" style="margin:0;">Travelers</div>
            ${o?``:`<div style="display:flex;gap:6px;align-items:center;">
              <button class="trav-edit-btn${Te?` active`:``}" onclick="toggleTravEditMode()">${Te?`Done`:`✎ Edit`}</button>
              <button class="btn sm ghost" onclick="openGroupsModal('${e.id}')">Groups →</button>
            </div>`}
          </div>
          ${(()=>{let t=e.groups||[],n=e.travelers||[];if(!n.length)return`<span class="muted text-sm">${o?`No travelers listed.`:`Add travelers below ↓`}</span>`;if(o)return n.map(t=>{let n=q(e.id)===t;return`<span class="tag ${n?`is-me`:``}" onclick="setMyTraveler('${K(t)}')" style="cursor:pointer;"
                  title="${n?`This is you! Click to unset.`:`Click to set as you`}">${W(t)}${n?` <span class="me-badge">(You)</span>`:``}</span>`}).join(` `);let r=new Set(t.flatMap(e=>e.members)),i=n.filter(e=>!r.has(e)),a=`<div class="${Te?`trav-edit-mode`:``}">`;return t.forEach(t=>{let r=t.members.filter(e=>n.includes(e));r.length&&(a+=`<div style="margin-bottom:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);margin-bottom:4px;">${W(t.name)}</div>
                <div>${r.map(t=>oi(t,e,q(e.id)===t,Te)).join(` `)}</div>
              </div>`)}),i.length&&(a+=`<div>${i.map(t=>oi(t,e,q(e.id)===t,Te)).join(` `)}</div>`),a+=`</div>`,a})()}
          ${o?`
          <div style="margin-top:6px;"><span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">Tap your name to track your share</span></div>
          `:`
          <div style="margin-top:6px;"><span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">Tap your name to track your share</span></div>
          <div style="margin-top:10px;">
            <input id="trav-input" placeholder="Add traveler name + Enter"
                   style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:var(--surface-2);"
                   onkeydown="if(event.key==='Enter'){addTraveler(this.value);this.value='';}"/>
          </div>`}
        </div>

        ${(()=>{let t=q(e.id),n=t?xi(e):null;if(!n)return`
          <div class="my-summary overview-my-summary" style="opacity:0.6;">
            <div class="my-summary-head">
              <h4>My Summary</h4>
            </div>
            <p class="hint" style="margin:8px 0 0;">👆 Tap your name in the Travelers list above to see your personal expense breakdown.</p>
          </div>`;let r=t;return`
          <div class="my-summary overview-my-summary">
            <div class="my-summary-head">
              <h4>My Summary — ${W(r)}</h4>
              <button class="btn sm ghost" onclick="openPersonDetail('${K(r)}')">View full details →</button>
            </div>
            <div class="my-summary-stats">
              <div class="my-stat">
                <div class="label">My Share</div>
                <div class="value">${G(n.myOwed)}</div>
              </div>
              <div class="my-stat">
                <div class="label">I Paid</div>
                <div class="value">${G(n.myPaid)}</div>
              </div>
              <div class="my-stat">
                <div class="label">Balance</div>
                <div class="value" style="color:${n.net>.01?`var(--primary)`:n.net<-.01?`#c0392b`:`var(--ink-soft)`}">
                  ${n.net>.01?`Owed `+G(n.net):n.net<-.01?`Owe `+G(-n.net):`Even`}
                </div>
              </div>
              ${n.owesMe.length>0?`
              <div class="my-stat">
                <div class="label">Owed to me</div>
                <div class="value" style="color:#c0392b;font-size:${n.owesMe.length>2?`12px`:`14px`};line-height:1.5;">
                  ${n.owesMe.map(e=>W(e.name)).join(`<br>`)}
                </div>
              </div>`:``}
              ${n.myOwed>0&&n.myUnsettled<.01&&n.owesMe.length===0?`
              <div class="my-stat">
                <div class="label">Settled</div>
                <div class="value" style="color:#2e7d32">✓ All</div>
              </div>`:``}
            </div>
            ${(()=>{let t=buildDetailedDebts(e),i=we?n.owesMe.length>0:t.owesMe.length>0,a=we?n.iOwe.length>0:t.iOwe.length>0,o=e=>ii()?`<button class="btn sm" onclick="${e}" style="margin:0 6px;font-size:11px;padding:2px 8px;white-space:nowrap;">✓ Settle</button>`:``,s=i||a?`
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;">
                  <span style="color:var(--ink-soft);">View:</span>
                  <button class="btn sm ${we?`primary`:``}" onclick="setSimplifyDebts(true)">Simplified</button>
                  <button class="btn sm ${we?``:`primary`}" onclick="setSimplifyDebts(false)">Per expense</button>
                </div>`:``,c=we?n.owesMe.map(e=>`
                    <div class="my-debt-row">
                      <span class="name">${W(e.name)}</span>
                      ${o(`settleWithPerson('`+K(e.name)+`')`)}
                      <span class="amt owed-to-me">+${G(e.amount)}</span>
                    </div>`).join(``):t.owesMe.map(e=>`
                    <div class="my-debt-row">
                      <span class="name" style="flex-shrink:0;">${W(e.name)}</span>
                      <span style="color:var(--ink-soft);font-size:11px;flex:1;margin:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${W(e.expenseName)}">${W(e.expenseName)}</span>
                      ${o(`settleOneDebt(`+e.expenseIdx+`,'`+K(e.name)+`')`)}
                      <span class="amt owed-to-me" style="flex-shrink:0;">+${G(e.amount)}</span>
                    </div>`).join(``),l=we?n.iOwe.map(e=>`
                    <div class="my-debt-row">
                      <span class="name">${W(e.name)}</span>
                      ${o(`settleWithPerson('`+K(e.name)+`')`)}
                      <span class="amt i-owe">-${G(e.amount)}</span>
                    </div>`).join(``):t.iOwe.map(e=>`
                    <div class="my-debt-row">
                      <span class="name" style="flex-shrink:0;">${W(e.name)}</span>
                      <span style="color:var(--ink-soft);font-size:11px;flex:1;margin:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${W(e.expenseName)}">${W(e.expenseName)}</span>
                      ${o(`settleOneDebt(`+e.expenseIdx+`,'`+K(r)+`')`)}
                      <span class="amt i-owe" style="flex-shrink:0;">-${G(e.amount)}</span>
                    </div>`).join(``);return s+(i?`<div class="my-debts"><div class="my-debts-title">People who owe me</div>${c}</div>`:``)+(a?`<div class="my-debts" style="margin-top:${i?`10px`:`0`};"><div class="my-debts-title">I owe</div>${l}</div>`:``)})()}
            ${!buildDetailedDebts(e).owesMe.length&&!buildDetailedDebts(e).iOwe.length&&n.myOwed>0?`
              <div style="text-align:center;color:var(--ink-soft);font-size:13px;padding:8px;">All settled up — no outstanding debts!</div>
            `:``}
            ${n.myOwed===0?`
              <div style="text-align:center;color:var(--ink-soft);font-size:13px;padding:8px;">No expenses yet. Add some in the Expenses tab.</div>
            `:``}
          </div>
          `})()}

        <div class="stat overview-budget" style="padding:16px;">
          <div class="stat-label">Budget <span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">(per person)</span></div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <input type="number" step="0.01" placeholder="—" value="${e.budget||``}" onchange="updateTrip('budget', this.value ? parseFloat(this.value) : null)"
                   style="font-size:22px;font-weight:700;color:var(--ink);border:none;background:transparent;width:140px;"/>
            <span class="muted text-sm">${b.settings.currency} / person</span>
          </div>
          ${e.budget&&!o?(()=>{let r=q(e.id)?xi(e):null;if(r){let t=r.myOwed,n=t>e.budget,i=e.budget-t;return`
              <div class="text-sm" style="margin-top:6px;color:${n?`#c0392b`:`var(--ink-soft)`};">
                ${n?`⚠️ Over by `+G(t-e.budget):G(i)+` remaining`} · your share
              </div>
              <div class="pack-bar" style="margin-top:8px;"><div class="pack-bar-fill" style="width:${Math.min(100,t/e.budget*100)}%;background:${n?`#e74c3c`:`linear-gradient(90deg,var(--primary),var(--accent))`}"></div></div>
              `}let i=e.budget*n,a=t>i,o=i-t;return`
            <div class="text-sm" style="margin-top:6px;color:var(--ink-soft);">Group budget: ${G(i)}</div>
            <div class="text-sm" style="margin-top:4px;color:${a?`#c0392b`:`var(--ink-soft)`};">
              ${a?`⚠️ Over by `+G(t-i):G(o)+` remaining`} · group total
            </div>
            <div class="pack-bar" style="margin-top:8px;"><div class="pack-bar-fill" style="width:${Math.min(100,t/i*100)}%;background:${a?`#e74c3c`:`linear-gradient(90deg,var(--primary),var(--accent))`}"></div></div>
            <div class="muted text-sm" style="margin-top:6px;">Tap your name in Travelers to see personal progress</div>
            `})():``}
        </div>

        ${a.length?`
        <div class="stat overview-themes" style="padding:16px;">
          <div class="stat-label">Day themes</div>
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px;">
            ${a.map(e=>`<div style="font-size:15px;"><strong>Day ${e.i}:</strong> <span style="font-family:'Caveat',cursive;font-size:20px;color:var(--primary);">${W(e.theme)}</span></div>`).join(``)}
          </div>
        </div>
        `:``}

        ${r.length||i.length?`
        <div class="stat overview-needs" style="padding:16px;">
          ${i.length?`
            <div class="stat-label">📋 To Do</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
              ${i.map(e=>`<div class="text-sm">• ${W(e.title)}${e.assignedTo?` <span class="tag" style="font-size:10px;padding:1px 6px;margin-left:4px;">${W(e.assignedTo)}</span>`:``}${e.dueDate?` <span class="muted">by ${ni(e.dueDate)}</span>`:``}</div>`).join(``)}
            </div>
            <button class="btn sm" style="margin-top:10px;" onclick="document.getElementById('tasks-section')?.scrollIntoView({behavior:'smooth'})">View all →</button>
          `:``}
          ${r.length&&i.length?`<div style="border-top:1px solid var(--line);margin:12px 0;"></div>`:``}
          ${r.length?`
            <div class="stat-label">⚠️ To Book</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
              ${r.map(e=>`<div class="text-sm">• ${W(e.name)}${e.dueDate?` <span class="muted">by ${ni(e.dueDate)}</span>`:``}</div>`).join(``)}
            </div>
            <button class="btn sm" style="margin-top:10px;" onclick="setTab('reservations')">View all →</button>
          `:``}
        </div>
        `:``}
      </div>

      ${Oi(e,o,l)}
      ${Ci(e,s,c,o,l)}
    </div>
  `}function ci(e){li(e)}function li(e){let t=(b.trips||[]).find(t=>t.id===e);if(!t)return;t.groups=t.groups||[];let n=t.travelers||[],r=new Set(t.groups.flatMap(e=>e.members.filter(e=>n.includes(e)))),i=n.filter(e=>!r.has(e)),a=t.groups.map((t,r)=>{let i=t.members.filter(e=>n.includes(e));return`
      <div class="group-lane" id="glane-${r}"
           ondragover="event.preventDefault();this.classList.add('drag-over')"
           ondragleave="this.classList.remove('drag-over')"
           ondrop="dropTravelerIntoGroup(event,${r},'${K(e)}')">
        <div class="group-lane-header">
          <input class="group-lane-name" value="${K(t.name)}"
                 onchange="renameGroup(${r},'${K(e)}',this.value)"
                 onblur="renameGroup(${r},'${K(e)}',this.value)" />
          <button class="btn sm ghost" style="padding:2px 8px;font-size:11px;color:#c0392b;"
                  onclick="deleteGroup(${r},'${K(e)}')">Remove</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;">
          ${i.length?i.map(e=>ui(e,r)).join(``):`<span class="muted text-sm">Drag travelers here</span>`}
        </div>
      </div>`}).join(``);$r({title:`Manage groups`,size:`sm`,body:`
      <div style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
        Drag travelers between groups. Click a group name to rename it.
      </div>
      ${`
    <div class="group-lane" id="glane-ungrouped" style="border-style:solid;background:var(--surface-2);"
         ondragover="event.preventDefault();this.classList.add('drag-over')"
         ondragleave="this.classList.remove('drag-over')"
         ondrop="dropTravelerIntoGroup(event,-1,'${K(e)}')">
      <div class="group-lane-header">
        <span class="group-lane-name" style="cursor:default;">Ungrouped</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;">
        ${i.length?i.map(e=>ui(e,-1)).join(``):`<span class="muted text-sm" style="font-size:12px;">All travelers are in groups</span>`}
      </div>
    </div>`}
      ${a}
      <button class="btn sm" style="margin-top:12px;width:100%;" onclick="addGroup('${K(e)}')">+ New group</button>
    `,actions:[{label:`Done`,primary:!0,onClick:()=>{H(),B()}}]})}function ui(e,t){return`<span class="trav-draggable" draggable="true"
    ondragstart="event.dataTransfer.setData('text/plain','${K(e)}|${t}')">${W(e)}</span>`}function di(e,t,n){e.preventDefault(),document.querySelectorAll(`.group-lane`).forEach(e=>e.classList.remove(`drag-over`));let[r,i]=e.dataTransfer.getData(`text/plain`).split(`|`),a=(b.trips||[]).find(e=>e.id===n);!a||!r||(a.groups=a.groups||[],a.groups.forEach(e=>{e.members=e.members.filter(e=>e!==r)}),t>=0&&a.groups[t]&&(a.groups[t].members.includes(r)||a.groups[t].members.push(r)),a.groups.forEach(e=>V({type:`updateGroup`,tripId:n,groupId:e.id,members:e.members})),li(n))}function fi(e){let t=(b.trips||[]).find(t=>t.id===e);if(!t)return;t.groups=t.groups||[];let n={id:ti(),name:`Group ${t.groups.length+1}`,members:[]};t.groups.push(n),V({type:`addGroup`,tripId:e,group:n}),li(e)}function pi(e,t,n){let r=(b.trips||[]).find(e=>e.id===t);if(!r||!r.groups[e])return;let i=(n||``).trim()||r.groups[e].name;r.groups[e].name=i,V({type:`updateGroup`,tripId:t,groupId:r.groups[e].id,name:i})}function mi(e,t){let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let[r]=n.groups.splice(e,1);V({type:`deleteGroup`,tripId:t,groupId:r.id}),li(t)}function hi(){U()&&(Oe(!Te),B())}function gi(e){if(!U()||(e=(e||``).trim(),!e))return;let t=ei();t&&(t.travelers=t.travelers||[],t.travelers.push(e),V({type:`addTraveler`,tripId:t.id,name:e}),B())}function _i(e){if(!U())return;let t=ei();t&&(t.travelers=(t.travelers||[]).filter(t=>t!==e),q(t.id)===e&&localStorage.removeItem(`myTraveler_`+t.id),V({type:`removeTraveler`,tripId:t.id,name:e}),B())}function q(e){return localStorage.getItem(`myTraveler_`+e)||null}function vi(e){let t=ei();if(!t)return;let n=q(t.id);if(ai()&&n&&n!==e){$r({title:`Switch traveler?`,size:`sm`,body:`<p>You're currently viewing as <strong>${W(n)}</strong>. Switch to <strong>${W(e)}</strong>?</p>`,actions:[{label:`Switch`,primary:!0,onClick:()=>{localStorage.setItem(`myTraveler_`+t.id,e),H(),B()}},{label:`Cancel`,onClick:H}]});return}n===e?localStorage.removeItem(`myTraveler_`+t.id):localStorage.setItem(`myTraveler_`+t.id,e),B()}function yi(e){$r({title:`Who are you?`,size:`sm`,body:`<p style="margin-bottom:12px;color:var(--ink-soft);">Select your name to track your personal expense summary.</p>
      <div style="display:flex;flex-wrap:wrap;">${(e.travelers||[]).map(t=>`
    <button class="btn" style="margin:4px 4px 4px 0;"
      onclick="selectTravelerFromModal('${K(t)}', '${K(e.id)}')">
      ${W(t)}
    </button>`).join(``)}</div>`,actions:[{label:`Skip`,onClick:H}],dismissOnOverlay:!1})}function bi(e,t){localStorage.setItem(`myTraveler_`+t,e),H(),B()}function xi(e){let t=q(e.id);if(!t)return null;let n=e.expenses||[],r=e.travelers||[],i=0,a=0,o=0,s=0,c={};r.forEach(e=>{e!==t&&(c[e]=0)}),n.forEach(e=>{let n=parseFloat(e.cost)||0,l=expenseParticipants(e,r),u=e.paidBy&&e.paidBy.length?e.paidBy:[],d=u.includes(t);if(!l.includes(t)&&!d)return;let f=computeSplit(e,r),p=l.includes(t)&&f[t]||0;i+=p,d&&(a+=n/u.length);let m=e.settledBy||[],h=d||m.includes(t);h?o+=p:s+=p,d?l.forEach(e=>{e===t||c[e]===void 0||!u.includes(e)&&!m.includes(e)&&(c[e]+=f[e]||0)}):u.length>0&&!h&&u.forEach(e=>{e===t||c[e]===void 0||(c[e]-=p/u.length)})});let l=[],u=[];Object.entries(c).forEach(([e,t])=>{t>.01?l.push({name:e,amount:t}):t<-.01&&u.push({name:e,amount:-t})}),l.sort((e,t)=>t.amount-e.amount),u.sort((e,t)=>t.amount-e.amount);let d=Object.values(c).reduce((e,t)=>e+t,0);return{myOwed:i,myPaid:a,mySettled:o,myUnsettled:s,owesMe:l,iOwe:u,net:d}}function Si(e,t,n,r,i){return t.length?`
    <div class="ann-pinned-section">
      ${t.map(t=>`
        <div class="ann-banner">
          <span class="ann-pin-icon">📌</span>
          <div class="ann-text">${W(t.text)}</div>
          ${i?`<div class="ann-controls">
            <button class="ann-btn" onclick="toggleAnnouncementPin('${K(t.id)}','${K(e.id)}')" title="Unpin">📌</button>
            <button class="ann-btn" onclick="editAnnouncement('${K(t.id)}','${K(e.id)}')" title="Edit">✎</button>
            <button class="ann-btn" onclick="deleteAnnouncement('${K(t.id)}','${K(e.id)}')" title="Remove" style="color:#c0392b;">✕</button>
          </div>`:``}
        </div>
      `).join(``)}
    </div>
  `:``}function Ci(e,t,n,r,i){let a=[...t,...n];return!a.length&&!i?``:`
    <div class="ann-manage-section">
      <div class="panel-head" style="margin-top:8px;">
        <h3>Announcements</h3>
        ${i?`<button class="btn sm" onclick="addAnnouncement('${K(e.id)}')">+ Add</button>`:``}
      </div>
      ${a.length?``:`<div class="muted text-sm" style="padding:8px 0 4px;">No announcements yet. Add one to keep your group in the loop.</div>`}
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${a.map(t=>`
          <div class="ann-item ${t.pinned?`ann-item-pinned`:``}">
            <span class="ann-item-icon">${t.pinned?`📌`:`📢`}</span>
            <span class="ann-item-text">${W(t.text)}</span>
            ${i?`<div class="ann-controls">
              <button class="ann-btn" onclick="toggleAnnouncementPin('${K(t.id)}','${K(e.id)}')" title="${t.pinned?`Unpin`:`Pin`}">${t.pinned?`📌`:`📍`}</button>
              <button class="ann-btn" onclick="editAnnouncement('${K(t.id)}','${K(e.id)}')" title="Edit">✎</button>
              <button class="ann-btn" onclick="deleteAnnouncement('${K(t.id)}','${K(e.id)}')" title="Remove" style="color:#c0392b;">✕</button>
            </div>`:``}
          </div>
        `).join(``)}
      </div>
    </div>
  `}function wi(e){U()&&$r({title:`New announcement`,size:`sm`,body:`<textarea id="ann-text-new" style="width:100%;min-height:80px;padding:8px;border:1px solid var(--line);border-radius:8px;font-size:14px;resize:vertical;" placeholder="Type your announcement…"></textarea>
           <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;cursor:pointer;">
             <input type="checkbox" id="ann-pin-new" /> Pin this announcement
           </label>`,actions:[{label:`Post`,primary:!0,onClick:()=>{let t=(document.getElementById(`ann-text-new`)?.value||``).trim(),n=document.getElementById(`ann-pin-new`)?.checked||!1;if(!t)return;let r=(b.trips||[]).find(t=>t.id===e);if(!r)return;let i={id:ti(),text:t,pinned:n,ann_order:(r.announcements||[]).length};r.announcements=[...r.announcements||[],i],V({type:`addAnnouncement`,tripId:e,announcement:i}),H(),B()}},{label:`Cancel`,onClick:H}]})}function Ti(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let r=(n.announcements||[]).find(t=>t.id===e);r&&$r({title:`Edit announcement`,size:`sm`,body:`<textarea id="ann-text-edit" style="width:100%;min-height:80px;padding:8px;border:1px solid var(--line);border-radius:8px;font-size:14px;resize:vertical;">${W(r.text)}</textarea>`,actions:[{label:`Save`,primary:!0,onClick:()=>{let n=(document.getElementById(`ann-text-edit`)?.value||``).trim();n&&(r.text=n,V({type:`updateAnnouncement`,tripId:t,annId:e,ann_text:n}),H(),B())}},{label:`Cancel`,onClick:H}]})}function Ei(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let r=(n.announcements||[]).find(t=>t.id===e);r&&(r.pinned=!r.pinned,V({type:`toggleAnnouncementPin`,tripId:t,annId:e}),B())}function Di(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);n&&(n.announcements=(n.announcements||[]).filter(t=>t.id!==e),V({type:`deleteAnnouncement`,tripId:t,annId:e}),B())}function Oi(e,t,n){let r=e.tasks||[],i=r.filter(e=>e.status!==`done`);return!r.length&&!n?``:`
    <div class="tasks-section" id="tasks-section">
      <div class="panel-head" style="margin-top:8px;">
        <h3>Tasks <span class="muted text-sm" style="font-weight:400;text-transform:none;letter-spacing:0;">${i.length} pending</span></h3>
      </div>
      <div class="task-list">
        ${r.map(t=>ki(t,e,n)).join(``)}
        ${n?`
          <div class="task-add-row">
            <input id="task-input-${K(e.id)}" class="task-add-input" placeholder="New task + Enter"
                   onkeydown="if(event.key==='Enter'){addTaskFromInput('${K(e.id)}')}"/>
            <select id="task-assignee-${K(e.id)}" class="task-assignee-select">
              <option value="">Unassigned</option>
              ${(e.travelers||[]).map(e=>`<option value="${K(e)}">${W(e)}</option>`).join(``)}
            </select>
            <button class="btn sm" onclick="addTaskFromInput('${K(e.id)}')">Add</button>
          </div>
        `:r.length?``:`<div class="muted text-sm" style="padding:8px 0;">No tasks yet.</div>`}
      </div>
    </div>
  `}function ki(e,t,n){let r=e.status===`done`;return`
    <div class="task-row ${r?`task-done`:``}">
      ${n?`<input type="checkbox" class="task-check" ${r?`checked`:``} onchange="toggleTask('${K(e.id)}','${K(t.id)}')" />`:`<span class="task-status-icon">${r?`✓`:`·`}</span>`}
      <span class="task-title">${W(e.title)}</span>
      ${e.assignedTo?`<span class="tag task-assignee-tag">${W(e.assignedTo)}</span>`:``}
      ${e.dueDate?`<span class="muted text-sm task-due">by ${ni(e.dueDate)}</span>`:``}
      ${n?`<button class="icon-btn task-delete" onclick="deleteTask('${K(e.id)}','${K(t.id)}')" title="Delete">✕</button>`:``}
    </div>
  `}function Ai(e){if(!U())return;let t=document.getElementById(`task-input-`+e),n=document.getElementById(`task-assignee-`+e),r=(t?.value||``).trim();if(!r)return;let i=n?.value||``,a=(b.trips||[]).find(t=>t.id===e);if(!a)return;let o={id:ti(),title:r,assignedTo:i,status:`pending`,dueDate:``,task_order:(a.tasks||[]).length};a.tasks=[...a.tasks||[],o],V({type:`addTask`,tripId:e,task:o}),B()}function ji(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let r=(n.tasks||[]).find(t=>t.id===e);r&&(r.status=r.status===`done`?`pending`:`done`,V({type:`toggleTask`,tripId:t,taskId:e}),B())}function Mi(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);n&&(n.tasks=(n.tasks||[]).filter(t=>t.id!==e),V({type:`deleteTask`,tripId:t,taskId:e}),B())}function Ni(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let r=ri(n),i=(n.travelerSchedule||{})[e]||{};$r({title:`${e} — Availability`,size:`sm`,body:`
      <p style="color:var(--ink-soft);font-size:13px;margin-bottom:12px;">
        Set join/leave day to mark partial attendance. Leave blank = full trip.
      </p>
      <div style="display:flex;gap:16px;">
        <label style="flex:1;font-size:13px;">Joins on day
          <input id="trav-sched-join" type="number" min="1" max="${r||99}" value="${i.joinDay||``}"
                 style="display:block;width:100%;margin-top:4px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:14px;" placeholder="1"/>
        </label>
        <label style="flex:1;font-size:13px;">Leaves after day
          <input id="trav-sched-leave" type="number" min="1" max="${r||99}" value="${i.leaveDay||``}"
                 style="display:block;width:100%;margin-top:4px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:14px;" placeholder="${r||`?`}"/>
        </label>
      </div>
      ${r?`<div class="muted text-sm" style="margin-top:8px;">Trip is ${r} days long (Day 1–${r})</div>`:``}
    `,actions:[{label:`Save`,primary:!0,onClick:()=>Pi(e,t)},{label:`Clear (full trip)`,onClick:()=>Fi(e,t)},{label:`Cancel`,onClick:H}]})}function Pi(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);if(!n)return;let r=parseInt(document.getElementById(`trav-sched-join`)?.value)||null,i=parseInt(document.getElementById(`trav-sched-leave`)?.value)||null;if(!r&&!i){Fi(e,t);return}n.travelerSchedule=n.travelerSchedule||{},n.travelerSchedule[e]={joinDay:r||1,leaveDay:i||ri(n)},V({type:`setTravelerSchedule`,tripId:t,travelerName:e,joinDay:r||1,leaveDay:i||ri(n)}),H(),B()}function Fi(e,t){if(!U())return;let n=(b.trips||[]).find(e=>e.id===t);n&&(n.travelerSchedule&&delete n.travelerSchedule[e],V({type:`setTravelerSchedule`,tripId:t,travelerName:e,joinDay:null,leaveDay:null}),H(),B())}Object.assign(window,{renderOverview:si,openGroupsModal:ci,renderGroupsModal:li,dropTravelerIntoGroup:di,addGroup:fi,renameGroup:pi,deleteGroup:mi,toggleTravEditMode:hi,addTraveler:gi,removeTraveler:_i,getMyTraveler:q,setMyTraveler:vi,computeMyData:xi,showTravelerSelectModal:yi,selectTravelerFromModal:bi,addAnnouncement:wi,editAnnouncement:Ti,toggleAnnouncementPin:Ei,deleteAnnouncement:Di,addTaskFromInput:Ai,toggleTask:ji,deleteTask:Mi,openTravelerScheduleModal:Ni,saveTravelerSchedule:Pi,clearTravelerSchedule:Fi});var Ii=()=>window.render(),J=e=>window.showModal(e),Y=()=>window.closeModal(),Li=e=>window.escapeHtml(e),X=e=>window.escapeAttr(e),Ri=()=>window.getToken(),zi={"application/pdf":`📄`};function Bi(e){return zi[e]||(e.startsWith(`image/`)?`🖼️`:`📎`)}function Vi(e){return e<1024?e+` B`:e<1024*1024?(e/1024).toFixed(0)+` KB`:(e/(1024*1024)).toFixed(1)+` MB`}function Hi(e){if(!e)return``;try{return new Date(e).toLocaleDateString(void 0,{month:`short`,day:`numeric`,year:`numeric`})}catch{return``}}function Ui(e){let t=b._docs?.[e.id]||null,n=b._docsUploading?.[e.id]||!1;return`
    <div class="panel docs-panel">
      <div class="panel-head">
        <h3>🔒 Document Vault</h3>
        <span class="muted text-sm" style="font-weight:400;font-size:12px;">Private — never shared</span>
      </div>
      <p class="hint" style="margin-bottom:12px;">
        Upload boarding passes, hotel confirmations, visa scans, or any trip documents.
        These files are <strong>private to you</strong> and never visible to shared trip viewers.
      </p>

      ${t===null?`
        <div id="docs-loading-${X(e.id)}" class="muted text-sm" style="padding:12px 0;">
          Loading documents…
        </div>
      `:`
        <div class="doc-upload-zone" id="doc-dropzone-${X(e.id)}"
             ondragover="event.preventDefault();this.classList.add('drag-over')"
             ondragleave="this.classList.remove('drag-over')"
             ondrop="docDropHandler(event,'${X(e.id)}')">
          <div class="doc-upload-inner">
            ${n?`<div class="doc-upload-progress"><div class="doc-progress-bar" id="doc-progress-bar-${X(e.id)}"></div></div><div class="muted text-sm" style="margin-top:6px;" id="doc-upload-status-${X(e.id)}">Uploading…</div>`:`<input type="file" id="doc-file-input-${X(e.id)}" accept="image/*,application/pdf" style="display:none"
                       onchange="docFileSelected(event,'${X(e.id)}')" />
                 <button class="btn" onclick="document.getElementById('doc-file-input-${X(e.id)}').click()">+ Upload file</button>
                 <span class="muted text-sm" style="margin-left:8px;">or drag & drop · images & PDFs up to 20 MB</span>`}
          </div>
        </div>

        ${t.length?`
          <div class="doc-grid">
            ${t.map(t=>`
              <div class="doc-card">
                <div class="doc-icon">${Bi(t.mime_type)}</div>
                <div class="doc-info">
                  <div class="doc-label">${Li(t.label)}</div>
                  <div class="doc-meta">${Vi(t.size_bytes)} · ${Hi(t.uploaded_at)}</div>
                </div>
                <div class="doc-actions">
                  <button class="btn sm" onclick="viewDocument('${X(t.id)}','${X(t.label)}')">View</button>
                  <button class="icon-btn doc-delete-btn" onclick="deleteDocument('${X(t.id)}','${X(e.id)}')" title="Delete">✕</button>
                </div>
              </div>
            `).join(``)}
          </div>
        `:`
          <div class="muted text-sm" style="padding:16px 0 8px;">No documents uploaded yet.</div>
        `}
      `}
    </div>
  `}async function Wi(e){let t=Ri();if(t)try{let n=await fetch(`/api/docs/list?tripId=${encodeURIComponent(e)}`,{headers:{Authorization:`Bearer ${t}`}});if(!n.ok)throw Error(await n.text());let r=await n.json();b._docs=b._docs||{},b._docs[e]=r,Ii()}catch{let t=document.getElementById(`docs-loading-${e}`);t&&(t.textContent=`Failed to load documents.`)}}function Gi(e,t){e.preventDefault(),document.getElementById(`doc-dropzone-${t}`)?.classList.remove(`drag-over`);let n=e.dataTransfer?.files?.[0];n&&qi(n,t)}function Ki(e,t){let n=e.target?.files?.[0];n&&qi(n,t)}async function qi(e,t){if(Ri()){if(![`image/jpeg`,`image/png`,`image/gif`,`image/webp`,`image/heic`,`image/heif`,`application/pdf`].includes(e.type)){J({title:`Unsupported file`,size:`sm`,body:`<p>Only images (JPEG, PNG, GIF, WebP, HEIC) and PDFs are allowed.</p>`,actions:[{label:`OK`,onClick:Y}]});return}if(e.size>20*1024*1024){J({title:`File too large`,size:`sm`,body:`<p>Maximum file size is 20 MB.</p>`,actions:[{label:`OK`,onClick:Y}]});return}await new Promise(n=>{J({title:`Label this document`,size:`sm`,body:`<input id="doc-label-input" placeholder="e.g. Boarding pass, Hotel confirmation…"
                    value="${X(e.name.replace(/\.[^.]+$/,``))}"
                    style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:var(--surface-2);" />`,actions:[{label:`Upload`,primary:!0,onClick:async()=>{let r=document.getElementById(`doc-label-input`)?.value?.trim()||e.name;Y(),await Ji(e,t,r),n()}},{label:`Cancel`,onClick:()=>{Y(),n()}}]})})}}async function Ji(e,t,n){let r=Ri();b._docsUploading=b._docsUploading||{},b._docsUploading[t]=!0,Ii();let i=new FormData;return i.append(`file`,e),i.append(`tripId`,t),i.append(`label`,n),new Promise(e=>{let n=new XMLHttpRequest;n.open(`POST`,`/api/docs/upload`),n.setRequestHeader(`Authorization`,`Bearer ${r}`),n.upload.onprogress=e=>{if(e.lengthComputable){let n=Math.round(e.loaded/e.total*100),r=document.getElementById(`doc-progress-bar-${t}`),i=document.getElementById(`doc-upload-status-${t}`);r&&(r.style.transform=`scaleX(${n/100})`),i&&(i.textContent=`Uploading… ${n}%`)}},n.onload=()=>{if(b._docsUploading[t]=!1,n.status===200){let e=JSON.parse(n.responseText);b._docs=b._docs||{},b._docs[t]=[e,...b._docs[t]||[]]}else try{J({title:`Upload failed`,size:`sm`,body:`<p>${Li(JSON.parse(n.responseText).error||`Unknown error`)}</p>`,actions:[{label:`OK`,onClick:Y}]})}catch{J({title:`Upload failed`,size:`sm`,body:`<p>An error occurred during upload.</p>`,actions:[{label:`OK`,onClick:Y}]})}Ii(),e()},n.onerror=()=>{b._docsUploading[t]=!1,Ii(),J({title:`Upload failed`,size:`sm`,body:`<p>Network error during upload.</p>`,actions:[{label:`OK`,onClick:Y}]}),e()},n.send(i)})}async function Yi(e,t){let n=Ri();if(n)try{let t=await fetch(`/api/docs/file/${encodeURIComponent(e)}`,{headers:{Authorization:`Bearer ${n}`}});if(!t.ok){J({title:`Error`,size:`sm`,body:`<p>Could not open file.</p>`,actions:[{label:`OK`,onClick:Y}]});return}let r=await t.blob(),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.target=`_blank`,a.rel=`noopener noreferrer`,a.click(),setTimeout(()=>URL.revokeObjectURL(i),3e4)}catch{J({title:`Error`,size:`sm`,body:`<p>Could not open file.</p>`,actions:[{label:`OK`,onClick:Y}]})}}function Xi(e,t){J({title:`Delete document?`,size:`sm`,body:`<p>This will permanently delete this file. It cannot be undone.</p>`,actions:[{label:`Delete`,primary:!0,onClick:async()=>{Y();let n=Ri();if(n)try{await fetch(`/api/docs/${encodeURIComponent(e)}`,{method:`DELETE`,headers:{Authorization:`Bearer ${n}`}}),b._docs=b._docs||{},b._docs[t]=(b._docs[t]||[]).filter(t=>t.id!==e),Ii()}catch{J({title:`Error`,size:`sm`,body:`<p>Could not delete file.</p>`,actions:[{label:`OK`,onClick:Y}]})}}},{label:`Cancel`,onClick:Y}]})}Object.assign(window,{renderDocuments:Ui,loadDocuments:Wi,docDropHandler:Gi,docFileSelected:Ki,viewDocument:Yi,deleteDocument:Xi});var Zi=e=>window.showModal(e),Qi=()=>window.closeModal(),$i=e=>window.fmtCurrency(e),ea=(e,t)=>window.fmtDate(e,t),ta=e=>window.tripDuration(e),na=e=>window.svgIcon(e),ra=[`overview`,`itinerary`,`expenses`,`packing`,`reservations`,`notes`,`photos`],ia={overview:`Overview`,itinerary:`Itinerary`,expenses:`Expenses`,packing:`Packing`,reservations:`Reservations`,notes:`Notes`,photos:`Photos`};function aa(){let e=document.getElementById(`share-read-input`);if(!e)return;let t=e.dataset.base,n=ra.filter(e=>document.getElementById(`stab-${e}`)?.checked);e.value=n.length===ra.length?t:`${t}&tabs=${n.join(`,`)}`,oa(`read`)}function oa(e){let t=document.getElementById(`share-qr-panel-${e}`);if(!t||!t.classList.contains(`open`))return;let n=e===`read`?`share-read-input`:`share-edit-input`,r=document.getElementById(n);if(!r)return;let i=encodeURIComponent(r.value),a=t.querySelector(`img`),o=t.querySelector(`a`),s=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${i}`;a&&(a.src=s),o&&(o.href=s)}function sa(e){let t=document.getElementById(`share-qr-panel-${e}`);t&&t.classList.toggle(`open`)&&oa(e)}async function ca(e){Zi({title:`Share this trip`,size:`sm`,body:`<div style="text-align:center;padding:16px 0;color:var(--ink-soft);">Generating links…</div>`,actions:[{label:`Close`,onClick:Qi}]});try{let t={Authorization:`Bearer ${getToken()}`,"Content-Type":`application/json`},[n,r]=await Promise.all([fetch(`/api/share/create`,{method:`POST`,headers:t,body:JSON.stringify({tripId:e,mode:`read`})}),fetch(`/api/share/create`,{method:`POST`,headers:t,body:JSON.stringify({tripId:e,mode:`edit`})})]),[i,a]=await Promise.all([n.json(),r.json()]);if(!n.ok)throw Error(i.error||`Failed to create read link`);if(!r.ok)throw Error(a.error||`Failed to create edit link`);let o=`${location.origin}/?share=${i.token}`,s=`${location.origin}/?share=${a.token}`;Zi({title:`Share this trip`,size:`sm`,body:`
        <div class="field">
          <label>View-only link</label>
          <div class="share-tabs-wrap">
            <div class="share-tabs-label">Tabs to include</div>
            <div class="share-tabs">
              ${ra.map(e=>`
                <label class="share-tab-chip">
                  <input type="checkbox" id="stab-${e}" value="${e}" checked onchange="updateShareReadLink()"
                         />
                  ${ia[e]}
                </label>`).join(``)}
            </div>
          </div>
          <div class="share-link-row">
            <input id="share-read-input" class="share-link-input" value="${o}" data-base="${o}" readonly />
            <button class="btn sm primary" onclick="copyShareLinkById('share-read-input','share-read-msg')">Copy</button>
            <button class="btn sm" onclick="toggleShareQR('read')" title="Show QR code">${na(`qr`)}</button>
          </div>
          <div id="share-read-msg" style="color:var(--primary);font-size:12px;margin-top:4px;display:none;">Copied!</div>
          <div id="share-qr-panel-read" class="share-qr-panel">
            <img src="" alt="QR Code" width="220" height="220" />
            <div class="qr-hint">Scan to view this trip without signing in</div>
            <a class="btn sm" href="" download="trip-view-qr.png">Download QR</a>
          </div>
          <div class="hint" style="margin-top:6px;">Anyone can view this trip without signing in.</div>
        </div>
        <div class="field" style="margin-top:16px;">
          <label>Editable link</label>
          <div class="share-link-row">
            <input id="share-edit-input" class="share-link-input" value="${s}" readonly />
            <button class="btn sm primary" onclick="copyShareLinkById('share-edit-input','share-edit-msg')">Copy</button>
            <button class="btn sm" onclick="toggleShareQR('edit')" title="Show QR code">${na(`qr`)}</button>
          </div>
          <div id="share-edit-msg" style="color:var(--primary);font-size:12px;margin-top:4px;display:none;">Copied!</div>
          <div id="share-qr-panel-edit" class="share-qr-panel">
            <img src="" alt="QR Code" width="220" height="220" />
            <div class="qr-hint">Scan to open this trip in edit mode</div>
            <a class="btn sm" href="" download="trip-edit-qr.png">Download QR</a>
          </div>
          <div class="hint" style="margin-top:6px;color:#c0392b;">
            ⚠ Anyone with this link can edit this trip. They cannot delete it or access other trips.
          </div>
        </div>
      `,actions:[{label:`Done`,primary:!0,onClick:Qi}]})}catch(e){Zi({title:`Share this trip`,size:`sm`,body:`<div style="color:#c0392b;padding:12px 0;">${e.message}</div>`,actions:[{label:`Close`,onClick:Qi}]})}}function la(e,t){let n=document.getElementById(e);n&&navigator.clipboard.writeText(n.value).then(()=>{let e=document.getElementById(t);e&&(e.style.display=``,setTimeout(()=>e.style.display=`none`,2e3))}).catch(()=>{n.select(),document.execCommand(`copy`)})}function ua(e){let t=b.trips.find(t=>t.id===e);if(!t)return;let n=da(t);Zi({title:`Trip Card`,size:`lg`,body:`<div class="highlight-card-preview"><img id="hc-preview" src="${n.toDataURL(`image/png`)}" style="width:100%;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);" /></div>
      <p class="hint" style="text-align:center;">Download and share anywhere — Instagram, group chat, email.</p>`,actions:[{label:`Close`,onClick:Qi},{label:`Download PNG`,primary:!0,onClick:()=>fa(n,t.title)}]})}function da(e){let t=1200,n=document.createElement(`canvas`);n.width=t,n.height=630;let r=n.getContext(`2d`),i=`system-ui, -apple-system, 'Segoe UI', sans-serif`;function a(){let a=r.createLinearGradient(0,0,t,630);a.addColorStop(0,`#fdf6ee`),a.addColorStop(1,`#fff0dc`),r.fillStyle=a,r.fillRect(0,0,t,630),r.save(),r.beginPath(),r.moveTo(80,56),r.lineTo(504,56),r.arcTo(528,56,528,80,24),r.lineTo(528,550),r.arcTo(528,574,504,574,24),r.lineTo(80,574),r.arcTo(56,574,56,550,24),r.lineTo(56,80),r.arcTo(56,56,80,56,24),r.closePath(),r.clip();let o=r.createLinearGradient(56,56,528,574);if(o.addColorStop(0,`#e07b39`),o.addColorStop(1,`#f5a55a`),r.fillStyle=o,r.fillRect(56,56,472,518),n._thumbImg){let e=n._thumbImg,t=Math.max(472/e.width,518/e.height),i=e.width*t,a=e.height*t;r.drawImage(e,56+(472-i)/2,56+(518-a)/2,i,a)}else r.font=`197px serif`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillText(e.emoji||`✈️`,292,315);r.restore(),r.textAlign=`left`,r.textBaseline=`alphabetic`;let s=140;r.fillStyle=`#1a1a1a`,r.font=`bold 68px ${i}`;let c=e.title||`My Trip`;for(;r.measureText(c).width>552&&c.length>2;)c=c.slice(0,-1);if(c!==e.title&&(c=c.trimEnd()+`…`),r.fillText(c,592,s),s+=78,e.destination){r.fillStyle=`#e07b39`,r.font=`bold 36px ${i}`;let t=e.destination;for(;r.measureText(t).width>552&&t.length>2;)t=t.slice(0,-1);t!==e.destination&&(t=t.trimEnd()+`…`),r.fillText(t,592,s),s+=52}if(e.startDate){r.fillStyle=`#666`,r.font=`500 30px ${i}`;let t=ea(e.startDate,{month:`short`,day:`numeric`,year:`numeric`})+(e.endDate?` – `+ea(e.endDate,{month:`short`,day:`numeric`,year:`numeric`}):``);r.fillText(t,592,s),s+=48}s+=16,r.strokeStyle=`#e5d5c5`,r.lineWidth=2,r.beginPath(),r.moveTo(592,s),r.lineTo(t-56,s),r.stroke(),s+=36;let l=[];(e.travelers||[]).length&&l.push(`👥 ${e.travelers.length} traveler${e.travelers.length===1?``:`s`}`);let u=(e.expenses||[]).reduce((e,t)=>e+(parseFloat(t.cost)||0),0);u>0&&l.push(`💰 ${$i(u)}`);let d=ta(e);d&&l.push(`📅 ${d} day${d===1?``:`s`}`),l.length&&(r.fillStyle=`#555`,r.font=`500 28px ${i}`,r.fillText(l.join(`   ·   `),592,s)),r.fillStyle=`#bba898`,r.font=`400 22px ${i}`,r.fillText(`wanderwise ~ trip planner`,592,588)}if(a(),e.driveFolder?.thumbnailId){let t=new Image;t.crossOrigin=`anonymous`,t.onload=()=>{n._thumbImg=t,a();let e=document.getElementById(`hc-preview`);e&&(e.src=n.toDataURL(`image/png`))},t.onerror=()=>{a()},t.src=`/api/drive/thumb?fileId=${encodeURIComponent(e.driveFolder.thumbnailId)}&sz=600`}return n}function fa(e,t){let n=document.createElement(`a`);n.href=e.toDataURL(`image/png`),n.download=`${(t||`trip`).replace(/[^a-z0-9]/gi,`-`).toLowerCase()}-card.png`,n.click()}Object.assign(window,{updateShareReadLink:aa,updateShareQR:oa,toggleShareQR:sa,openShareModal:ca,copyShareLinkById:la,openHighlightCardModal:ua,generateTripCard:da,downloadTripCard:fa});var pa=()=>window.render(),ma=()=>window.saveState(),ha=e=>window.mutate(e),ga=e=>window.showModal(e),_a=()=>window.closeModal(),va=()=>window.guardEdit(),ya=()=>window.isLoggedIn(),ba=[{id:`beach`,label:`Beach`,emoji:`🏖️`,p1:`#009eb0`,p2:`#ff7e6b`,bg:`linear-gradient(135deg,#b7e7f0,#ffe9c4,#ffc1b0)`},{id:`forest`,label:`Forest`,emoji:`🌲`,p1:`#2e7d4f`,p2:`#c97b3a`,bg:`linear-gradient(135deg,#cfeacf,#e9f3d6,#f5e9c8)`},{id:`city`,label:`City`,emoji:`🏙️`,p1:`#1f5f8b`,p2:`#d4a44a`,bg:`linear-gradient(135deg,#d6e1ec,#eef1f4,#f5e8d4)`},{id:`sunset`,label:`Sunset`,emoji:`🌅`,p1:`#d94a6e`,p2:`#f4a261`,bg:`linear-gradient(135deg,#ffd5b8,#ffb3c1,#d4a8e0)`},{id:`aurora`,label:`Aurora`,emoji:`🌌`,p1:`#5b4b9c`,p2:`#2bb3a3`,bg:`linear-gradient(135deg,#b8c8e8,#c8b8e8,#a8d8d0)`},{id:`mono`,label:`Mono`,emoji:`✈️`,p1:`#2b2b2b`,p2:`#777777`,bg:`linear-gradient(135deg,#ececec,#f6f6f6,#e2e2e2)`},{id:`sakura`,label:`Sakura`,emoji:`🌸`,p1:`#c2185b`,p2:`#c9a227`,bg:`linear-gradient(135deg,#fce4ec,#fdf0f5,#fef9e7)`},{id:`desert`,label:`Desert`,emoji:`🏜️`,p1:`#c1440e`,p2:`#d4a843`,bg:`linear-gradient(135deg,#f5deb3,#f0c9a0,#e8b88a)`},{id:`arctic`,label:`Arctic`,emoji:`🏔️`,p1:`#0277bd`,p2:`#8e6bbf`,bg:`linear-gradient(135deg,#e8f4fd,#f0eafa,#e4f2f8)`},{id:`tropics`,label:`Tropics`,emoji:`🌴`,p1:`#00796b`,p2:`#ff6f00`,bg:`linear-gradient(135deg,#b2dfdb,#dcedc8,#fff9c4)`},{id:`midnight`,label:`Midnight`,emoji:`🌃`,p1:`#7c5cbf`,p2:`#e040fb`,bg:`linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)`},{id:`golden`,label:`Golden Hour`,emoji:`🌄`,p1:`#b35a00`,p2:`#c0392b`,bg:`linear-gradient(135deg,#ffe8c0,#ffd49e,#ffbc7a)`}];function xa(){let e={trips:b.trips.length,expenses:b.trips.reduce((e,t)=>e+(t.expenses||[]).length,0),items:b.trips.reduce((e,t)=>e+(t.packing||[]).reduce((e,t)=>e+t.items.length,0),0)};ga({title:`Settings`,body:`
      <div class="set-panel">
        <div class="field">
          <label>Color theme</label>
          <div class="theme-grid">
            ${ba.map(e=>`
              <div class="theme-swatch ${b.settings.theme===e.id?`sel`:``}" onclick="pickTheme('${e.id}')"
                   style="--p1:${e.p1};--p2:${e.p2};">
                <div class="preview" style="background:${e.bg};">
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">${e.emoji}</div>
                  <div style="position:absolute;bottom:6px;right:6px;width:18px;height:18px;border-radius:50%;background:${e.p2};border:2px solid white;"></div>
                </div>
                <div class="name">${e.label}</div>
              </div>
            `).join(``)}
          </div>
        </div>

        <div class="field">
          <label>Currency</label>
          <select onchange="updateCurrency(this.value)">
            ${[`USD`,`EUR`,`GBP`,`JPY`,`CAD`,`AUD`,`CHF`,`CNY`,`INR`,`MXN`,`BRL`,`KRW`,`SGD`,`VND`,`THB`].map(e=>`<option ${b.settings.currency===e?`selected`:``}>${e}</option>`).join(``)}
          </select>
        </div>

        ${ya()?`
        <div class="field">
          <label>Data</label>
          <div class="row">
            <button class="btn" onclick="exportJson()">⬇ Export all to JSON</button>
            <label class="btn">
              ⬆ Import JSON
              <input type="file" accept=".json" style="display:none;" onchange="importJson(event)"/>
            </label>
          </div>
          <div class="hint" style="margin-top:8px;">
            ${e.trips} trip${e.trips===1?``:`s`} · ${e.expenses} expense${e.expenses===1?``:`s`} · ${e.items} packing item${e.items===1?``:`s`} synced to cloud.<br>
            Export a JSON backup any time. Import merges by trip ID — existing backups still work.
          </div>
        </div>

        <div class="field">
          <label style="color:#c0392b;">Danger zone</label>
          <button class="btn danger" onclick="resetAll()">Reset all data</button>
        </div>
        `:``}

        <div class="field">
          <label>App</label>
          <button class="btn" onclick="hardRefresh()">🔄 Hard refresh &amp; empty cache</button>
          <div class="hint" style="margin-top:8px;">Clears the service worker cache and reloads. Use if the app feels stuck on an old version.</div>
        </div>
      </div>
    `,actions:[{label:`Done`,primary:!0,onClick:_a}]})}async function Sa(){if(`serviceWorker`in navigator){let e=await navigator.serviceWorker.getRegistrations();await Promise.all(e.map(e=>e.unregister()))}if(`caches`in window){let e=await caches.keys();await Promise.all(e.map(e=>caches.delete(e)))}location.reload(!0)}function Ca(e){setTheme(e),document.querySelectorAll(`.theme-swatch`).forEach(e=>e.classList.remove(`sel`)),document.querySelectorAll(`.theme-swatch[onclick*="${e}"]`).forEach(e=>e.classList.add(`sel`))}function wa(e){va()&&(b.settings.currency=e,ha({type:`updateSettings`,currency:e}),pa())}function Ta(){let e={version:1,exportedAt:new Date().toISOString(),...b},t=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`trip-planner-backup-${new Date().toISOString().slice(0,10)}.json`,r.click(),URL.revokeObjectURL(n)}function Ea(e){let t=e.target.files[0];if(!t)return;e.target.value=``;let n=new FileReader;n.onload=e=>{let t;try{t=JSON.parse(e.target.result)}catch{ga({title:`Import failed`,size:`sm`,body:`<p style="color:var(--red,#e53);margin:0;">The selected file is not valid JSON.</p>`,actions:[{label:`OK`,primary:!0,onClick:_a}]});return}if(!Array.isArray(t.trips)){ga({title:`Import failed`,size:`sm`,body:`<p style="color:var(--red,#e53);margin:0;">This doesn't look like a TripPlanner backup — <code>trips</code> array not found.</p>`,actions:[{label:`OK`,primary:!0,onClick:_a}]});return}let n=t.trips.filter(e=>e&&e.id&&e.title),r=t.trips.length-n.length,i=new Set(b.trips.map(e=>e.id)),a=n.filter(e=>!i.has(e.id)),o=n.length-a.length;ga({title:`Import trips`,size:`sm`,body:`<ul style="margin:0;padding:0 0 0 18px;line-height:1.9;">${[`<strong>${a.length}</strong> trip${a.length===1?``:`s`} will be added`,o?`<strong>${o}</strong> already exist and will be skipped`:``,r?`<strong>${r}</strong> item${r===1?``:`s`} skipped (missing id or title)`:``].filter(Boolean).map(e=>`<li>${e}</li>`).join(``)}</ul>${t.version?`<p style="font-size:12px;color:var(--ink-soft);margin:10px 0 0;">Backup v${t.version} · Exported ${t.exportedAt?new Date(t.exportedAt).toLocaleDateString():`unknown date`}</p>`:``}`,actions:[{label:`Add ${a.length} trip${a.length===1?``:`s`}`,primary:!0,onClick:()=>{a.forEach(e=>b.trips.push(e)),t.settings&&(b.settings=Object.assign(b.settings,t.settings)),ma(),_a(),pa()}},{label:`Cancel`,onClick:_a}]})},n.readAsText(t)}function Da(){ya()&&confirm(`Delete ALL trips and data? This cannot be undone.`)&&confirm(`Really? Last chance.`)&&(Ee(be()),ma(),_a(),goHome())}Object.assign(window,{openSettings:xa,hardRefresh:Sa,pickTheme:Ca,updateCurrency:wa,exportJson:Ta,importJson:Ea,resetAll:Da});var Oa=()=>window.render(),ka=e=>window.mutate(e),Aa=e=>window.showModal(e),ja=()=>window.closeModal(),Ma=()=>window.guardEdit(),Na=()=>window.currentTrip(),Pa=()=>window.uid(),Fa=e=>window.parseDate(e),Ia=(e,t)=>window.daysBetween(e,t),La=e=>window.tripDuration(e),Ra=()=>window.renderLightbox(),za=[`7:00 AM`,`8:00 AM`,`9:00 AM`,`10:00 AM`,`11:00 AM`,`12:00 PM`,`1:00 PM`,`2:00 PM`,`3:00 PM`,`4:00 PM`,`5:00 PM`,`6:00 PM`,`7:00 PM`,`8:00 PM`,`9:00 PM`,`10:00 PM`,`11:00 PM`],Ba=`🏖️.🌴.🗽.🏔️.🌋.🏝️.🌆.🏰.🎢.🎡.🗼.🏛️.⛩️.🛕.🌅.🌇.🏕️.⛺.🚣.🏄.🎿.⛷️.🏂.🚗.✈️.🚂.🛳️.🏟️.🎭.🎨.🍣.🍕.🍷.☕.🎪.🎰.🎢.🦘.🦒.🐠`.split(`.`),Va=[{name:`Essentials`,items:[`First aid kit`,`Advil / pain reliever`,`Cough drops`,`Hydrocortisone`,`Band-aids`,`Hand sanitizer`,`Tissues`,`Masks`]},{name:`Clothes`,items:[`Pajamas`,`Jacket / layers`,`Underwear & socks`,`3 outfits`,`Swimwear`,`Comfortable walking shoes`]},{name:`Electronics`,items:[`Phone charger`,`Power bank`,`USB adapter`,`Headphones / AirPods`,`Camera`,`Laptop / iPad`]},{name:`Skincare`,items:[`Cleanser`,`Moisturizer`,`Sunscreen (face)`,`Cotton pads`,`Acne patches`,`Lip balm`]},{name:`Beauty`,items:[`Mascara`,`Lipstick`,`Eyebrow pencil`,`Makeup remover`,`Eyelash curler`]},{name:`Body care`,items:[`Body wash`,`Shampoo & conditioner`,`Body lotion`,`Sunscreen (body)`,`Deodorant`]},{name:`Hair care`,items:[`Hair dryer`,`Comb / brush`,`Hair ties`,`Curler / straightener`]},{name:`Dental`,items:[`Toothbrush`,`Toothpaste`,`Floss / flosser`,`Mouthwash`]},{name:`Outside kit`,items:[`Umbrella`,`Hat / cap`,`Tote / reusable bag`,`Sunglasses`,`Sandals`]},{name:`Documents`,items:[`ID / Driver license`,`Passport`,`Wallet & cards`,`Reservation printouts`,`Insurance card`]},{name:`Miscellaneous`,items:[`Tripod`,`Snacks`,`Board games`,`Travel iron`,`Lint roller`]}];function Ha(e){if(!Ma())return null;let t=e.startDate?Fa(e.startDate):null,n=e.endDate?Fa(e.endDate):null,r=t&&n?Ia(t,n)+1:3,i={id:Pa(),title:e.title||`New Trip`,destination:e.destination||``,emoji:e.emoji||`🏖️`,startDate:e.startDate||``,endDate:e.endDate||``,travelers:(e.travelers||``).split(`,`).map(e=>e.trim()).filter(Boolean),budget:e.budget?parseFloat(e.budget):null,expenses:[],packing:e.useTemplate?Va.map(e=>({id:Pa(),name:e.name,items:e.items.map(e=>({id:Pa(),name:e,packed:!1}))})):[],itinerary:Array.from({length:r},(e,t)=>({id:Pa(),theme:``,slots:za.map(e=>({time:e,activity:``}))})),reservations:[],notes:[],timeSlots:za.slice(),timezone:``,createdAt:new Date().toISOString(),driveFolder:{folderId:null,thumbnailId:null,thumbnailUrl:null},destinationCoords:e.destinationCoords||null};return b.trips.push(i),ka({type:`createTrip`,trip:i}),i}function Ua(e){b.trips=b.trips.filter(t=>t.id!==e),ka({type:`deleteTrip`,tripId:e})}function Wa(e,t){t&&t.stopPropagation();let n=b.trips.find(t=>t.id===e);if(!n)return;let r=JSON.parse(JSON.stringify(n));r.id=Pa(),r.title=n.title+` (copy)`,r.startDate=``,r.endDate=``,r.expenses=[],r.createdAt=new Date().toISOString(),(r.packing||[]).forEach(e=>e.items.forEach(e=>{e.packed=!1,e.id=Pa()})),b.trips.push(r),ka({type:`createTrip`,trip:r}),x.view===`home`&&typeof window.homePanelRender==`function`?window.homePanelRender():Oa()}var Ga={};function Ka(e,t){if(!Ma())return;let n=Na();n&&(n[e]=t,[`budget`,`timezone`].includes(e)&&Oa(),clearTimeout(Ga[e]),Ga[e]=setTimeout(()=>ka({type:`updateTripFields`,tripId:n.id,fields:{[e]:t}}),400))}function qa(e,t){if(!Ma())return;let n=Na();if(!n)return;e===`start`?n.startDate=t:n.endDate=t,Ja(n);let r=e===`start`?{startDate:t}:{endDate:t};ka({type:`updateTripFields`,tripId:n.id,fields:r}),ka({type:`syncTimeSlots`,tripId:n.id,timeSlots:n.timeSlots||[],days:n.itinerary}),Oa()}function Ja(e){if(!e.startDate||!e.endDate)return;let t=La(e);if(t===null||t<1)return;let n=t;for(;e.itinerary.length<n;)e.itinerary.push({id:Pa(),theme:``,slots:(e.timeSlots||za).map(e=>({time:e,activity:``}))});e.itinerary.length>n&&(e.itinerary=e.itinerary.slice(0,n))}function Ya(){let e=Na();e&&confirm(`Delete "${e.title}"? This cannot be undone.`)&&(Ua(e.id),goHome())}function Xa(){let e=document.getElementById(`avatar-menu`);if(e){e.remove();return}if(!Na()?.driveFolder?.thumbnailId)return;let t=document.documentElement.getAttribute(`data-share`)===`read`,n=document.createElement(`div`);n.id=`avatar-menu`,n.className=`avatar-menu`,n.innerHTML=`
    <button onclick="openCoverPhotoLightbox()">🔍 View image</button>
    ${t?``:`<hr>
    <button onclick="setTab('photos');closeAvatarMenu()">🖼️ Change image</button>
    <button class="danger" onclick="removeCoverPhoto()">😊 Change to emoji</button>`}
  `;let r=document.querySelector(`.trip-emoji`),i=r?r.getBoundingClientRect():{bottom:100,left:30};n.style.top=i.bottom+8+`px`,n.style.left=i.left+`px`,document.body.appendChild(n),setTimeout(()=>document.addEventListener(`click`,Za,{once:!0}),0)}function Za(e){let t=document.getElementById(`avatar-menu`);t&&!t.contains(e.target)&&t.remove()}function Qa(){document.getElementById(`avatar-menu`)?.remove()}function $a(){Qa();let e=Na(),t=e?.driveFolder?.thumbnailId;if(!t)return;let n=e?.driveFolder?.folderId?driveCache.get(e.driveFolder.folderId):null;if(n?.files?.length){let e=n.files.findIndex(e=>e.id===t);lightboxFiles=n.files,lightboxIdx=e>=0?e:0}else lightboxFiles=[{id:t,name:`Cover photo`,thumbnailLink:null}],lightboxIdx=0;Ra()}function eo(){if(Qa(),!Ma()||!confirm(`Remove the cover photo and revert to the trip emoji?`))return;let e=Na();e&&e.driveFolder&&(e.driveFolder.thumbnailId=null,ka({type:`updateTripFields`,tripId:e.id,fields:{driveThumbnailId:null}}),Oa())}function to(){if(!Ma())return;let e=Na();e&&Aa({title:`Choose a trip icon`,body:`<div class="emoji-picker">${Ba.map(t=>`<button class="${e.emoji===t?`sel`:``}" onclick="pickEmoji('${t}')">${t}</button>`).join(``)}</div><div class="hint" style="margin-top:12px;">Or paste any emoji here: <input id="custom-emoji" style="width:60px;padding:6px;border:1px solid var(--line);border-radius:6px;font-size:18px;" onchange="pickEmoji(this.value)"/></div>`,actions:[{label:`Close`,onClick:ja}]})}function no(e){if(e=(e||``).trim(),!e)return;let t=Na();t.emoji=e,ka({type:`updateTripFields`,tripId:t.id,fields:{emoji:e}}),ja(),Oa()}function ro(){window.resetNtDestCoords?.(),Aa({title:`Plan a new trip`,body:`
      <div class="field">
        <label>Trip name *</label>
        <input id="nt-title" placeholder="e.g. Tokyo Summer 2026" autofocus />
      </div>
      <div class="field">
        <label>Destination</label>
        <div class="dest-ac-wrap" style="width:100%;">
          <input id="nt-dest" placeholder="e.g. Tokyo, Japan" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font-size:14px;color:var(--ink);background:var(--surface-2);"
            oninput="onNtDestInput(this.value)" onblur="setTimeout(closeNtDestDropdown, 200)" autocomplete="off" />
          <div id="nt-dest-dropdown" class="dest-dropdown" style="left:0;min-width:100%;"></div>
        </div>
      </div>
      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Start date</label><input id="nt-start" type="date" /></div>
        <div class="field" style="flex:1;"><label>End date</label><input id="nt-end" type="date" /></div>
      </div>
      <div class="field">
        <label>Travelers (comma separated)</label>
        <input id="nt-trav" placeholder="e.g. Hoang, Sam, Maya" />
      </div>
      <div class="field">
        <label>Budget per person (${b.settings.currency}, optional)</label>
        <input id="nt-budget" type="number" step="0.01" placeholder="e.g. 500" />
      </div>
      <div class="field">
        <label>Icon</label>
        <div class="emoji-picker" id="nt-emoji-grid">
          ${Ba.slice(0,16).map((e,t)=>`<button class="${t===0?`sel`:``}" data-e="${e}" onclick="selectNtEmoji(this)">${e}</button>`).join(``)}
        </div>
      </div>
      <div class="field">
        <label><input type="checkbox" id="nt-template" checked style="width:auto;margin-right:6px;"/> Pre-fill packing list with smart defaults</label>
        <div class="hint">Recommended — gives you 11 categories with common items. All editable.</div>
      </div>
    `,actions:[{label:`Cancel`,onClick:ja},{label:`Create trip`,primary:!0,onClick:()=>{let e=document.getElementById(`nt-title`).value.trim();if(!e){alert(`Please give your trip a name.`);return}let t=document.querySelector(`#nt-emoji-grid .sel`),n=Ha({title:e,destination:document.getElementById(`nt-dest`).value,destinationCoords:window.getNtDestCoords?.()??null,startDate:document.getElementById(`nt-start`).value,endDate:document.getElementById(`nt-end`).value,travelers:document.getElementById(`nt-trav`).value,budget:document.getElementById(`nt-budget`).value,emoji:t?t.dataset.e:`🏖️`,useTemplate:document.getElementById(`nt-template`).checked});n&&(ja(),openTrip(n.id))}}]})}function io(e){document.querySelectorAll(`#nt-emoji-grid .sel`).forEach(e=>e.classList.remove(`sel`)),e.classList.add(`sel`)}Object.assign(window,{newTrip:Ha,deleteTrip:Ua,duplicateTrip:Wa,updateTrip:Ka,updateTripDates:qa,syncItineraryToDateRange:Ja,confirmDeleteTrip:Ya,openTripAvatarMenu:Xa,closeAvatarMenu:Qa,openCoverPhotoLightbox:$a,removeCoverPhoto:eo,openEmojiPicker:to,pickEmoji:no,openNewTrip:ro,selectNtEmoji:io});var ao=()=>window.render(),oo=e=>window.mutate(e),so=e=>window.showModal(e),co=()=>window.closeModal(),lo=()=>window.guardEdit(),Z=e=>window.escapeHtml(e),uo=e=>window.fmtCurrency(e),fo=e=>window.escapeAttr(e),po=e=>window.parseDate(e),mo=(e,t)=>window.fmtDate(e,t),ho=e=>window.daysUntil(e),go=e=>window.tripDuration(e);function _o(){let e=new Date,t=e.getFullYear(),n=e.getMonth()*100+e.getDate();return b.trips.filter(e=>{if(!e.startDate)return!1;let r=po(e.startDate);if(!r||r.getFullYear()>=t)return!1;let i=e.endDate?po(e.endDate):r,a=r.getMonth()*100+r.getDate(),o=(i||r).getMonth()*100+(i||r).getDate();return n>=a&&n<=o})}function vo(){let e=_o();if(!e.length)return``;let t=new Date;if(e.length===1){let n=e[0],r=t.getFullYear()-po(n.startDate).getFullYear();return`<div class="on-this-day-banner" onclick="openTrip('${n.id}')">
      <div style="font-size:28px;flex-shrink:0;">🗓️</div>
      <div class="on-this-day-content">
        <div class="on-this-day-label">On this day, ${r} year${r===1?``:`s`} ago</div>
        <div class="on-this-day-title">${Z(n.title)}</div>
        <div class="on-this-day-sub">${n.destination?Z(n.destination):``}${n.memoryLine?` · `+Z(n.memoryLine):``}</div>
      </div>
      <div style="font-size:20px;color:var(--ink-soft);">→</div>
    </div>`}return`<div style="margin-bottom:16px;">
    <div class="on-this-day-label" style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--primary,#e07b39);">🗓️ On this day</div>
    <div class="on-this-day-multi">${e.map(e=>{let n=t.getFullYear()-po(e.startDate).getFullYear();return`<div class="on-this-day-chip" onclick="openTrip('${e.id}')">
      <div class="on-this-day-label" style="margin-bottom:2px;">${n}yr ago</div>
      <div style="font-size:13px;font-weight:600;">${Z(e.title)}</div>
      ${e.destination?`<div style="font-size:12px;color:var(--ink-soft);">${Z(e.destination)}</div>`:``}
    </div>`}).join(``)}</div>
  </div>`}var yo=12;function bo(){let e=b.trips.slice().sort((e,t)=>(e.startDate||`z`).localeCompare(t.startDate||`z`));return{trips:e,upcoming:e.filter(e=>{let t=ho(e.endDate);return t===null||t>=0}),past:e.filter(e=>{let t=ho(e.endDate);return t!==null&&t<0})}}function xo(){let{upcoming:e}=bo(),t=e.slice(0,yo),n=e.length>t.length;return`
    <div class="section-head">
      <h2>Upcoming <span class="muted">${e.length} ${e.length===1?`trip`:`trips`}</span></h2>
    </div>
    <div class="trip-grid">
      ${t.map(Ao).join(``)}
      <div class="trip-card new" onclick="openNewTrip()">
        <div class="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
        <div>Plan a new trip</div>
      </div>
    </div>
    ${n?`<div style="text-align:center;margin-top:14px;"><button class="btn sm" onclick="loadMoreUpcoming()">Load more (${e.length-t.length} remaining)</button></div>`:``}
  `}function So(){let{past:e}=bo();if(!e.length)return``;let t=[...new Set(e.map(e=>(e.startDate||``).slice(0,4)).filter(Boolean))].sort((e,t)=>e-t),n=t.includes(Ce)?Ce:`all`,r=t.reduce((t,n)=>(t[n]=e.filter(e=>(e.startDate||``).startsWith(n)).length,t),{}),i=n===`all`?t:t.filter(e=>e===n),a=n===`all`?e.length:e.filter(e=>(e.startDate||``).startsWith(n)).length,o=n===`all`?e:e.filter(e=>(e.startDate||``).startsWith(n)),s=`
    <div class="year-map" role="tablist" aria-label="Past years">
      <button class="year-pill-mini ${n===`all`?`active`:``}" onclick="setPastYearFilter('all')">All</button>
      <div class="year-track" id="year-track">
        ${t.map(e=>`
          <div class="year-node ${n===e?`active`:``}" data-year="${e}" onclick="setPastYearFilter('${e}')" role="button">
            <div class="year-dot"></div>
            <div class="year-label">${e}</div>
            <div class="year-count">${r[e]}</div>
          </div>`).join(``)}
        <div class="year-handle" id="year-handle"><div class="year-tooltip" id="year-tooltip"></div></div>
      </div>
    </div>`,c=n===`all`?i.map((t,n)=>{let r=e.filter(e=>(e.startDate||``).startsWith(t));return`
          <div class="past-year" id="past-year-${t}" data-year="${t}">
            <div class="past-year-header">${t} · ${r.length} trip${r.length===1?``:`s`}</div>
            <div class="postcard-row">
              ${r.map((e,t)=>Mo(e,t+n)).join(``)}
            </div>
          </div>`}).join(``):`<div class="postcard-grid">${o.map(Mo).join(``)}</div>`;return`
    <section class="past-section" id="past-root">
      <div class="past-head">
        <div class="past-title">
          <h2>Past</h2>
          <span class="muted">${a} ${a===1?`trip`:`trips`}</span>
        </div>
        ${s}
      </div>
      <div class="postcard-wall">
        ${c}
      </div>
    </section>`}function Co(){let{trips:e,upcoming:t}=bo(),n=t.find(e=>ho(e.startDate)!==null),r=n?`Your next adventure is <strong>${Z(n.title)}</strong> — ${ho(n.startDate)>0?ho(n.startDate)+` days to go`:ho(n.startDate)===0?`starts today!`:`in progress`} 🎉`:`Let's plan something amazing. Tap <strong>New Trip</strong> to start.`;return`
    <section class="hero">
      <div class="hero-text">
        <h1>Hey ${Z(S?.username||`there`)} — <span class="accent">where are we going?</span></h1>
        <p>${r}</p>
      </div>
      <div class="hero-emoji">${b.trips.length?`🌎`:`✈️`}</div>
    </section>

    ${vo()}

    ${e.length===0?`
      <div class="empty-state">
        <div class="e-emoji">🧭</div>
        <h3>No trips yet</h3>
        <p>Create your first trip and we'll set up packing lists, an itinerary, and an expense tracker for you.</p>
        <button class="btn primary lg" onclick="openNewTrip()">+ Plan my first trip</button>
      </div>
    `:`
      <div id="home-upcoming-section">${xo()}</div>
      <div id="home-past-section">${So()}</div>
    `}
  `}function wo(){let e=document.getElementById(`home-upcoming-section`);if(!e){ao();return}e.innerHTML=xo()}function To(){let e=document.getElementById(`home-past-section`);if(!e){ao();return}e.innerHTML=So(),No()}function Eo(){if(x.view!==`home`){ao();return}wo(),To()}function Do(){yo+=12,wo()}function Oo(e,t=400){return e.thumbnailLink?e.thumbnailLink.replace(/=s\d+$/,`=s${t}`):`/api/drive/thumb?fileId=${encodeURIComponent(e.id)}&sz=${t}`}function ko(e){let{thumbnailId:t}=e.driveFolder||{};return t?`/api/drive/thumb?fileId=${encodeURIComponent(t)}`:null}function Ao(e){let t=ho(e.startDate),n=ho(e.endDate),r,i=``;t===null?(r=`no date`,i=`past`):t>0?r=`in ${t}d`:t===0?(r=`today!`,i=`live`):n!==null&&n>=0?(r=`live now`,i=`live`):(r=`${-t}d ago`,i=`past`);let a=(e.expenses||[]).reduce((e,t)=>e+(parseFloat(t.cost)||0),0),o=(e.travelers||[]).length,s=go(e),c=e.startDate||e.endDate?`${mo(e.startDate,{month:`short`,day:`numeric`})}${e.endDate?` – `+mo(e.endDate,{month:`short`,day:`numeric`,year:`numeric`}):``}`:`Dates TBD`;return`
    <div class="trip-card" onclick="openTrip('${e.id}')">
      <div class="trip-card-cd ${i}">${r}</div>
      ${(()=>{let t=ko(e);return`<div class="trip-card-banner${t?` has-thumb`:``}">
        ${t?`<img src="${fo(t)}" alt="${Z(e.title)}" loading="lazy" decoding="async" onerror="this.parentElement.classList.remove('has-thumb');this.remove()" />`:e.emoji||`🌍`}
      </div>`})()}
      <div class="trip-card-title">${Z(e.title)}</div>
      <div class="trip-card-dest">${Z(e.destination||`Destination TBD`)}</div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${c}${s?` <span class="muted">· ${s}d</span>`:``}
      </div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        ${o?o+` `+(o===1?`traveler`:`travelers`):`Solo or TBD`}
      </div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        ${a>0?uo(a):e.budget?uo(e.budget)+`/person budget`:`No expenses yet`}
      </div>
      <button class="btn sm edit-action" style="margin-top:10px;width:100%;justify-content:center;"
              onclick="duplicateTrip('${e.id}', event)" title="Duplicate as template">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Duplicate
      </button>
    </div>
  `}function jo(e){return(e.memoryLine||``).trim()||(e.destination||``).trim()||`Memory`}function Mo(e,t){let n=e.startDate||e.endDate?`${mo(e.startDate,{month:`short`,day:`numeric`})}${e.endDate?` – `+mo(e.endDate,{month:`short`,day:`numeric`,year:`numeric`}):``}`:`Dates TBD`,r=(e.travelers||[]).length,i=(e.expenses||[]).reduce((e,t)=>e+(parseFloat(t.cost)||0),0),a=go(e),o=jo(e);return`
    <article class="postcard" data-trip-id="${fo(e.id)}" onclick="handlePostcardClick(event, '${e.id}')">
      <div class="stamp">${(e.startDate||``).slice(0,4)||``}</div>
      <div class="postcard-emoji">${e.emoji||`🌍`}</div>
      <div class="postcard-title">${Z(e.title)}</div>
      <div class="postcard-sub">${Z(n)}</div>
      <div class="postcard-memory">${Z(o)}</div>

      <div class="postcard-reveal">
        <div class="text-sm">${r?r+` traveler`+(r===1?``:`s`):`Travelers TBD`} · ${a?a+` day`+(a===1?``:`s`):`Dates TBD`}</div>
        <div class="text-sm" style="margin-top:4px;">${i>0?uo(i)+` total`:e.budget?uo(e.budget)+`/person budget`:`No expenses yet`}</div>
        <div class="postcard-actions">
          <button class="btn sm" onclick="openTrip('${e.id}'); event.stopPropagation();">Open trip</button>
          <button class="postcard-edit" onclick="openMemoryLineEditor('${e.id}'); event.stopPropagation();">✎ Memory</button>
        </div>
      </div>
    </article>
  `}function No(){let e=document.getElementById(`year-track`),t=document.getElementById(`year-handle`),n=document.getElementById(`year-tooltip`);if(!e||!t)return;let r=Array.from(e.querySelectorAll(`.year-node`));if(!r.length)return;let i=()=>Ce===`all`?r[r.length-1]:r.find(e=>e.dataset.year===Ce)||r[r.length-1],a=(r,i)=>{if(!r)return;let a=e.getBoundingClientRect(),o=r.getBoundingClientRect(),s=o.left-a.left+o.width/2;t.style.left=`${s}px`,n&&(n.textContent=r.dataset.year||``,n.style.display=i?`block`:`none`)},o=t=>{let n=e.getBoundingClientRect(),i=Math.min(Math.max(t,n.left),n.right),a=r[0],o=1/0;return r.forEach(e=>{let t=e.getBoundingClientRect(),n=t.left+t.width/2,r=Math.abs(n-i);r<o&&(o=r,a=e)}),a};a(i(),!1);let s=!1,c=null,l=e=>{if(!s)return;let t=o(e.clientX);c=t.dataset.year,a(t,!0)},u=e=>{if(s){s=!1;try{t.releasePointerCapture(e.pointerId)}catch{}document.removeEventListener(`pointermove`,l),document.removeEventListener(`pointerup`,u),c&&Ce!==c?setPastYearFilter(c):a(i(),!1),c=null}};t.onpointerdown=e=>{s=!0,t.setPointerCapture(e.pointerId),document.addEventListener(`pointermove`,l),document.addEventListener(`pointerup`,u)},e.onpointerdown=e=>{if(e.target===t)return;let n=o(e.clientX);c=n.dataset.year,a(n,!0),c&&Ce!==c?setPastYearFilter(c):a(i(),!1),c=null}}function Po(e,t){let n=e.currentTarget;if(!(e.target.closest(`.postcard-actions`)||e.target.closest(`.postcard-edit`))){if(n.classList.contains(`revealed`)){openTrip(t);return}document.querySelectorAll(`.postcard.revealed`).forEach(e=>e.classList.remove(`revealed`)),n.classList.add(`revealed`)}}function Fo(e){if(!lo())return;let t=(b.trips||[]).find(t=>t.id===e);t&&so({title:`Edit memory line`,size:`sm`,body:`
      <div class="field">
        <label>Memory line</label>
        <input id="memory-line-input" value="${fo((t.memoryLine||``).trim())}" placeholder="${fo(t.destination||`Memory line`)}" />
      </div>
    `,actions:[{label:`Cancel`,onClick:co},{label:`Save`,primary:!0,onClick:()=>{let n=(document.getElementById(`memory-line-input`).value||``).trim();t.memoryLine=n,oo({type:`updateTripFields`,tripId:t.id,fields:{memoryLine:n}}),co();let r=document.querySelector(`.postcard[data-trip-id="${e}"]`);if(r){let e=r.querySelector(`.postcard-memory`);e&&(e.textContent=n||(t.destination||``).trim()||`Memory`)}else Eo()}}]})}Object.assign(window,{getOnThisDayTrips:_o,renderOnThisDay:vo,renderHome:Co,renderHomeUpcoming:wo,renderHomePast:To,homePanelRender:Eo,loadMoreUpcoming:Do,getFileThumbUrl:Oo,getTripThumbnailUrl:ko,renderTripCard:Ao,getTripMemoryLine:jo,renderPostcard:Mo,setupPastYearScrubber:No,handlePostcardClick:Po,openMemoryLineEditor:Fo});var Io=()=>window.currentTrip(),Lo=e=>window.escapeHtml(e),Ro=e=>window.fmtCurrency(e),zo=e=>window.escapeAttr(e),Bo=e=>window.daysUntil(e),Vo=e=>window.tripDuration(e),Ho=()=>window.isEditing(),Uo=()=>window.isShareMode(),Wo=e=>window.renderDocuments(e),Go=[`overview`,`itinerary`,`expenses`,`packing`,`reservations`,`notes`,`photos`,`documents`],Ko=[`#fef9c3`,`#dcfce7`,`#dbeafe`,`#fce7f3`,`#ffe4e6`];function qo(){document.documentElement.setAttribute(`data-theme`,b.settings.theme||`beach`),window.stopTzClock?.(),window.stopItinClock?.();let e=document.getElementById(`app-root`);if(x.view===`home`?e.innerHTML=renderHome():x.view===`trip`&&(e.innerHTML=is()),document.querySelectorAll(`textarea.autogrow:not([data-autogrow-bound])`).forEach(Jo),x.view===`trip`&&Io()?.timezone&&window.startTzClock?.(),x.view===`trip`&&x.tab===`itinerary`&&(requestAnimationFrame(()=>{window.applyItineraryTimeState?.(),window.renderCurrentTimeLine?.()}),window.startItinClock?.()),x.view===`trip`&&x.tab===`photos`&&window.setupPhotoLazyLoad?.(),x.view===`trip`&&x.tab===`documents`){let e=Io();e&&b._docs?.[e.id]===void 0&&window.loadDocuments?.(e.id)}x.view===`home`&&setupPastYearScrubber()}function Jo(e){if(e.dataset.autogrowBound)return;e.dataset.autogrowBound=`1`;let t,n=()=>{cancelAnimationFrame(t),t=requestAnimationFrame(()=>{e.style.height=`0`,e.style.height=e.scrollHeight+2+`px`})};e.addEventListener(`input`,n),n()}function Yo(e){return`
    ${renderOverview(e)}
    <h2 style="margin:24px 0 12px;">Itinerary</h2>
    ${renderItinerary(e)}
    <h2 style="margin:24px 0 12px;">Expenses</h2>
    ${renderExpenses(e,!0)}
    <h2 style="margin:24px 0 12px;">Packing List</h2>
    ${renderPacking(e)}
    <h2 style="margin:24px 0 12px;">Reservations</h2>
    ${renderReservations(e,!0)}
    ${getNotes(e).length?`<h2 style="margin:24px 0 12px;">Notes</h2><div class="panel"><div class="sticky-board">${getNotes(e).map((e,t)=>`<div class="sticky-note" style="background:${Ko[t%Ko.length]};pointer-events:none"><div style="font-size:13px;line-height:1.6;white-space:pre-wrap">${Lo(e.text)}</div></div>`).join(``)}</div></div>`:``}
  `}function Xo(){let e=Io(),t=document.getElementById(`print-root`);!e||!t||x.view!==`trip`||(t.innerHTML=Yo(e),document.querySelectorAll(`#print-root textarea.autogrow:not([data-autogrow-bound])`).forEach(Jo))}function Zo(){let e=document.getElementById(`print-root`);e&&(e.innerHTML=``)}window.addEventListener(`beforeprint`,Xo),window.addEventListener(`afterprint`,Zo);function Qo(e){let t=(e.expenses||[]).reduce((e,t)=>e+(parseFloat(t.cost)||0),0),n=getMyTraveler(e.id),r=n?(e.expenses||[]).filter(t=>expenseParticipants(t,e.travelers||[]).includes(n)).reduce((e,t)=>e+(parseFloat(t.cost)||0),0):null,i=(e.reservations||[]).filter(e=>e.status!==`booked`&&e.status!==`cancelled`&&e.name?.trim()).length,a=(e.packing||[]).reduce((e,t)=>e+t.items.length,0);return{totalSpend:t,myExpensesTotal:r,reservOpen:i,packDone:(e.packing||[]).reduce((e,t)=>e+t.items.filter(e=>e.packed).length,0),packTotal:a}}function $o(e){if(e||=Io(),!e)return;let{totalSpend:t,myExpensesTotal:n,reservOpen:r,packDone:i,packTotal:a}=Qo(e),o=e=>document.getElementById(e),s=o(`stat-total-spend`);s&&(s.textContent=Ro(t));let c=o(`stat-my-expenses`);c&&(c.textContent=Ro(n));let l=o(`stat-packed`);l&&(l.textContent=`${i}/${a}`);let u=o(`stat-to-book`);u&&(u.textContent=String(r))}function es(){let e=Io(),t=document.getElementById(`expenses-root`);return!e||!t?!1:(t.innerHTML=renderExpenses(e),t.querySelectorAll(`textarea.autogrow:not([data-autogrow-bound])`).forEach(Jo),$o(e),!0)}function ts(){let e=Io(),t=document.getElementById(`packing-root`);return!e||!t?!1:(t.innerHTML=renderPacking(e),t.querySelectorAll(`textarea.autogrow:not([data-autogrow-bound])`).forEach(Jo),$o(e),!0)}function ns(){let e=Io(),t=document.getElementById(`reservations-root`);return!e||!t?!1:(t.innerHTML=renderReservations(e),t.querySelectorAll(`textarea.autogrow:not([data-autogrow-bound])`).forEach(Jo),!0)}function rs(){if(x.view!==`trip`){qo();return}x.tab===`expenses`&&es()||x.tab===`packing`&&ts()||x.tab===`reservations`&&ns()||qo()}function is(){let e=Io();if(!e)return goHome(),``;let t=Bo(e.startDate),n=Bo(e.endDate),r=``;r=t===null?`Add dates →`:t>0?`${t} days until departure`:t===0?`🎉 Today's the day!`:n!==null&&n>=0?`✈️ Trip in progress`:`${-t} days ago`;let i=Vo(e),{totalSpend:a,myExpensesTotal:o,reservOpen:s,packDone:c,packTotal:l}=Qo(e),u=getMyTraveler(e.id),d=window._shareTabs||Go;d.includes(x.tab)||(x.tab=d[0]||`overview`);let f=x.tab;return`
    <div class="trip-header">
      <div class="trip-header-row">
        ${getTripThumbnailUrl(e)?`<div class="trip-emoji" onclick="openTripAvatarMenu()" title="Photo options" style="padding:0;overflow:hidden;cursor:pointer;"><img src="${zo(getTripThumbnailUrl(e))}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:22px;" /></div>`:`<div class="trip-emoji" onclick="openEmojiPicker()" title="Change icon">${e.emoji}</div>`}
        <div class="trip-meta">
          <div class="trip-title">
            <input value="${Lo(e.title)}" oninput="updateTrip('title', this.value)" placeholder="Trip name" ${Ho()?``:`readonly`} />
          </div>
        </div>
      </div>
      <div class="trip-sub">
        <div class="trip-sub-loc-tz">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${Ho()?`<div class="dest-ac-wrap">
              <input id="dest-ac-input" style="background:transparent;border:none;color:inherit;font:inherit;width:200px;"
                     value="${Lo(e.destination)}" oninput="onDestInput(this.value)" onkeydown="onDestKeydown(event)"
                     onblur="setTimeout(closeDestDropdown,200)" placeholder="Destination" autocomplete="off" />
              <div id="dest-dropdown" class="dest-dropdown"></div>
            </div>`:`<input style="background:transparent;border:none;color:inherit;font:inherit;width:200px;" value="${Lo(e.destination)}" placeholder="Destination" readonly />`}
          </span>
          ${Ho()?`
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <select style="background:transparent;border:none;color:inherit;font:inherit;font-size:13px;cursor:pointer;max-width:220px;"
                    onchange="updateTrip('timezone', this.value)" title="Destination time zone">
              <option value="">Time zone (optional)</option>
              ${getTimezoneOptions(e.timezone||``)}
            </select>
          </span>`:e.timezone?`
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${e.timezone.replace(/_/g,` `)}
          </span>`:``}
        </div>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" style="background:transparent;border:none;color:inherit;font:inherit;"
                 value="${e.startDate}" onchange="updateTripDates('start', this.value)" ${Ho()?``:`readonly`} />
          →
          <input type="date" style="background:transparent;border:none;color:inherit;font:inherit;"
                 value="${e.endDate}" onchange="updateTripDates('end', this.value)" ${Ho()?``:`readonly`} />
        </span>
      </div>
      <div class="trip-actions-bar no-print">
        <button class="btn ghost share-hidden trip-back-btn" onclick="goHome()" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          All trips
        </button>
        <button class="btn edit-action" onclick="openShareModal('${e.id}')" title="Share this trip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
        <button class="btn danger edit-action" onclick="confirmDeleteTrip()" title="Delete trip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
      <div class="trip-stats">
        <div class="stat"><div class="stat-label">Countdown</div><div class="stat-value primary">${r}</div></div>
        <div class="stat"><div class="stat-label">Duration</div><div class="stat-value">${i?i+(i===1?` day`:` days`):`—`}</div></div>
        <div class="stat"><div class="stat-label">Travelers</div><div class="stat-value">${(e.travelers||[]).length||`—`}</div></div>
        ${d.includes(`expenses`)?`<div class="stat"><div class="stat-label">Total spend</div><div class="stat-value accent" id="stat-total-spend">${Ro(a)}</div><div style="font-size:11px;color:var(--ink-soft);margin-top:2px;">all expenses</div></div>`:``}
        ${d.includes(`expenses`)&&u?`<div class="stat"><div class="stat-label">Your expenses</div><div class="stat-value" id="stat-my-expenses">${Ro(o)}</div><div style="font-size:11px;color:var(--ink-soft);margin-top:2px;">as ${Lo(u)}</div></div>`:``}
        ${d.includes(`packing`)?`<div class="stat"><div class="stat-label">Packed</div><div class="stat-value" id="stat-packed">${c}/${l}</div></div>`:``}
        ${d.includes(`reservations`)?`<div class="stat"><div class="stat-label">To book</div><div class="stat-value" id="stat-to-book">${s}</div></div>`:``}
        ${(()=>{let t=e.tasks||[],n=t.filter(e=>e.status!==`done`).length;return t.length?`<div class="stat"><div class="stat-label">Tasks</div><div class="stat-value" id="stat-tasks">${n}/${t.length}</div></div>`:``})()}
        ${e.timezone?`<div class="stat" id="tz-stat"><div class="stat-label">Local time</div><div class="stat-value" id="tz-clock">—</div></div>`:``}
      </div>
    </div>

    <div class="tabs no-print" style="align-items:center;justify-content:space-around">
      ${d.includes(`overview`)?Q(`overview`,`Overview`,$(`home`)):``}
      ${d.includes(`itinerary`)?Q(`itinerary`,`Itinerary`,$(`calendar`)):``}
      ${d.includes(`expenses`)?Q(`expenses`,`Expenses`,$(`dollar`)):``}
      ${d.includes(`packing`)?Q(`packing`,`Packing`,$(`luggage`)):``}
      ${d.includes(`reservations`)?Q(`reservations`,`Reservations`,$(`bookmark`)):``}
      ${d.includes(`notes`)?Q(`notes`,`Notes`,$(`edit`)):``}
      ${d.includes(`photos`)?Q(`photos`,`Photos`,$(`camera`)):``}
      ${!Uo()&&d.includes(`documents`)?Q(`documents`,`Docs`,$(`lock`)):``}
    </div>

    ${f===`overview`?renderOverview(e):``}
    ${f===`itinerary`?renderItinerary(e):``}
    ${f===`expenses`?`<div id="expenses-root">${renderExpenses(e)}</div>`:``}
    ${f===`packing`?`<div id="packing-root">${renderPacking(e)}</div>`:``}
    ${f===`reservations`?`<div id="reservations-root">${renderReservations(e)}</div>`:``}
    ${f===`notes`?renderNotes(e):``}
    ${f===`photos`?renderPhotos(e):``}
    ${f===`documents`&&!Uo()?Wo(e):``}
  `}function Q(e,t,n){return`<button class="tab ${x.tab===e?`active`:``}" onclick="setTab('${e}')">${n}${t}</button>`}function $(e){return{home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10"/></svg>`,calendar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,dollar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,luggage:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><line x1="9" y1="11" x2="9" y2="17"/><line x1="15" y1="11" x2="15" y2="17"/></svg>`,bookmark:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,edit:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,camera:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,qr:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-4"/><path d="M14 17v4"/></svg>`,sparkle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 3l.75 2.75L8.5 7l-2.75.75L5 10.5l-.75-2.75L1.5 7l2.75-.75L5 3z" opacity=".5"/><path d="M19 14l.75 2.75L22.5 18l-2.75.75L19 21.5l-.75-2.75L15.5 18l2.75-.75L19 14z" opacity=".5"/></svg>`,image:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,lock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`}[e]||``}Object.assign(window,{render:qo,autoGrow:Jo,renderTrip:is,tabBtn:Q,svgIcon:$,buildPrintHtml:Yo,updateTripHeaderStats:$o,getTripHeaderStats:Qo,renderExpensesPanel:es,renderPackingPanel:ts,renderReservationsPanel:ns,tripPanelRender:rs}),document.addEventListener(`DOMContentLoaded`,async()=>{let t=localStorage.getItem(`tp_theme`)||`beach`;document.documentElement.setAttribute(`data-theme`,t),`serviceWorker`in navigator&&navigator.serviceWorker.register(`/sw.js`).catch(()=>{});let n=new URLSearchParams(location.search).get(`share`);if(n){await os(n);return}let r=e();if(r)try{De(JSON.parse(atob(r.split(`.`)[1])))}catch{De(null)}S?(Ve(),Ee(await xe()),window.render()):window.showLoginModal(),document.addEventListener(`keydown`,e=>{document.getElementById(`lightbox-bg`)&&(e.key===`Escape`?window.closeLightbox():e.key===`ArrowLeft`?window.moveLightbox(-1):e.key===`ArrowRight`&&window.moveLightbox(1))})});var as=[`overview`,`itinerary`,`expenses`,`packing`,`reservations`,`notes`,`photos`];async function os(e){document.getElementById(`app-root`).innerHTML=`<div style="text-align:center;padding:60px 20px;color:var(--ink-soft);">Loading shared trip…</div>`;try{let t=await fetch(`/api/share/${e}`);if(!t.ok)throw Error(`not found`);let{trip:n,settings:r,mode:i}=await t.json();Ee({trips:[n],settings:r||{theme:`beach`,currency:`USD`}}),document.documentElement.setAttribute(`data-share`,i===`edit`?`edit`:`read`);let a=document.getElementById(`share-banner`);a.style.display=``,i===`edit`?(window._shareToken=e,a.innerHTML=`
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Editing shared trip — changes save automatically`):a.innerHTML=`🔗 Shared view — read only`;let o=new URLSearchParams(location.search).get(`tabs`);window._shareTabs=o?o.split(`,`).filter(e=>as.includes(e)):null;let s=window._shareTabs?window._shareTabs[0]:`overview`;Object.assign(x,{view:`trip`,tripId:n.id,tab:s||`overview`}),window.render(),!window.getMyTraveler(n.id)&&(n.travelers||[]).length>0&&window.showTravelerSelectModal(n)}catch{document.getElementById(`app-root`).innerHTML=`
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🔗</div>
        <h3>Share link not found</h3>
        <p style="color:var(--ink-soft);">This link may have expired or been removed.</p>
        <button class="btn primary" onclick="location.href='/'">Go home</button>
      </div>`}}