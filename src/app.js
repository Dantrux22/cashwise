let _authUser = null;
let _syncDebounce = null;

// ═══════════════════════════════════════════════════════
// FIREBASE CONFIG
// ═══════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB6DJpoQBHQWC0Rcf6V6d5AwYUP4u5P94g",
  authDomain:        "gestor-de-gastos-22.firebaseapp.com",
  projectId:         "gestor-de-gastos-22",
  storageBucket:     "gestor-de-gastos-22.firebasestorage.app",
  messagingSenderId: "314127277353",
  appId:             "1:314127277353:web:7d6b64fdd6b1aa4da76b38",
  measurementId:     "G-YSQ1TWHQ6X"
};

const FIREBASE_ENABLED = true; // Firebase configurado ✅
let _fbApp=null, _fbAuth=null, _fbDb=null;
if(FIREBASE_ENABLED){
  try{
    _fbApp  = firebase.initializeApp(FIREBASE_CONFIG);
    _fbAuth = firebase.auth();
    _fbDb   = firebase.firestore();
    console.log('[finflow] Firebase ✅');
  }catch(e){ console.warn('[finflow] Firebase error:', e.message); }
}


// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const SK = 'finflow_v3';
const MNAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MSHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MASK = '•••';

const DEFAULT_CATS = {
  expense:[
    {id:'e1',e:'🛒',n:'Mercado',c:'#34d48a'},{id:'e2',e:'🍽️',n:'Comidas',c:'#f5a623'},
    {id:'e3',e:'🚗',n:'Transporte',c:'#6b8cff'},{id:'e4',e:'🏠',n:'Vivienda',c:'#b57bee'},
    {id:'e5',e:'💊',n:'Salud',c:'#f0566a'},{id:'e6',e:'🎬',n:'Ocio',c:'#38bdf8'},
    {id:'e7',e:'👗',n:'Ropa',c:'#f5a623'},{id:'e8',e:'📱',n:'Suscripc.',c:'#6b8cff'},
  ],
  income:[
    {id:'i1',e:'💼',n:'Sueldo',c:'#34d48a'},{id:'i2',e:'💻',n:'Freelance',c:'#6b8cff'},
    {id:'i3',e:'📈',n:'Dividendos',c:'#f5a623'},{id:'i4',e:'🎁',n:'Regalo',c:'#b57bee'},
    {id:'i5',e:'🛍️',n:'Ventas',c:'#34d48a'},{id:'i6',e:'✨',n:'Otro',c:'#94a3b8'},
  ],
  invest:[
    {id:'v1',e:'📊',n:'Acciones',c:'#f5a623'},{id:'v2',e:'₿',n:'Cripto',c:'#f5a623'},
    {id:'v3',e:'🏦',n:'Plazo fijo',c:'#f5a623'},{id:'v4',e:'🏢',n:'Inmuebles',c:'#f5a623'},
    {id:'v5',e:'💹',n:'FCI',c:'#f5a623'},{id:'v6',e:'✨',n:'Otro',c:'#94a3b8'},
  ]
};

const EMOJIS = [
  '🛒','🍽️','🚗','🏠','💊','🎬','👗','📱','☕','🍕','🚕','⛽','🛵','🚲','🚌',
  '💼','💻','📈','📊','💰','🏦','💳','🧾','📋','🖥️','📞','✉️','🏧','💵','🤝',
  '🎮','✈️','🎓','🎵','🎸','🎨','📚','🏋️','⚽','🎾','🏊','🧘','🎯','🎲','🎪',
  '🌿','⚡','🐶','🐱','🏡','🌱','☀️','🌙','❄️','🔥','🌈','🍀','⭐','💫','🎉',
  '🏥','💈','🧴','💄','🧹','🛁','💪','🧠','❤️','🎁','🛍️','✨','🔑','🏆','📦',
  '🎪','🎭','🎊','🚀','🌍','🏖️','🎿','🎳','🏄','🚴','🤸','⛰️','🌋','🏕️','🎠',
];
const COLORS = [
  '#34d48a','#22c55e','#84cc16','#a3e635',
  '#6b8cff','#38bdf8','#06b6d4','#3b82f6',
  '#f0566a','#f43f5e','#e879f9','#d946ef',
  '#f5a623','#fb923c','#f59e0b','#eab308',
  '#b57bee','#a855f7','#8b5cf6','#7c3aed',
  '#94a3b8','#64748b','#6b7280','#78716c',
];
const ACCENTS = ['#34d48a','#6b8cff','#b57bee','#f5a623','#f0566a'];
const GOAL_EMOJIS = ['🎯','✈️','🏠','🚗','💻','📱','🎓','💍','🏖️','🎿','🏋️','💰','🌍','🎪','🎁'];
const CURRENCIES = [
  {code:'ARS',name:'Peso Argentino',flag:'🇦🇷',sym:'$'},
  {code:'NZD',name:'Dólar Neozelandés',flag:'🇳🇿',sym:'NZ$'},
  {code:'USD',name:'Dólar Estadounidense',flag:'🇺🇸',sym:'US$'},
  {code:'EUR',name:'Euro',flag:'🇪🇺',sym:'€'},
  {code:'GBP',name:'Libra Esterlina',flag:'🇬🇧',sym:'£'},
  {code:'BRL',name:'Real Brasileño',flag:'🇧🇷',sym:'R$'},
  {code:'CLP',name:'Peso Chileno',flag:'🇨🇱',sym:'$'},
  {code:'MXN',name:'Peso Mexicano',flag:'🇲🇽',sym:'$'},
  {code:'UYU',name:'Peso Uruguayo',flag:'🇺🇾',sym:'$U'},
  {code:'COP',name:'Peso Colombiano',flag:'🇨🇴',sym:'$'},
  {code:'PEN',name:'Sol Peruano',flag:'🇵🇪',sym:'S/'},
  {code:'BOB',name:'Boliviano',flag:'🇧🇴',sym:'Bs'},
  {code:'PYG',name:'Guaraní',flag:'🇵🇾',sym:'₲'},
  {code:'CAD',name:'Dólar Canadiense',flag:'🇨🇦',sym:'CA$'},
  {code:'AUD',name:'Dólar Australiano',flag:'🇦🇺',sym:'A$'},
  {code:'CHF',name:'Franco Suizo',flag:'🇨🇭',sym:'Fr'},
  {code:'JPY',name:'Yen Japonés',flag:'🇯🇵',sym:'¥'},
  {code:'CNY',name:'Yuan Chino',flag:'🇨🇳',sym:'¥'},
  {code:'KRW',name:'Won Coreano',flag:'🇰🇷',sym:'₩'},
  {code:'INR',name:'Rupia India',flag:'🇮🇳',sym:'₹'},
  {code:'TRY',name:'Lira Turca',flag:'🇹🇷',sym:'₺'},
  {code:'ZAR',name:'Rand Sudafricano',flag:'🇿🇦',sym:'R'},
  {code:'BTC',name:'Bitcoin',flag:'₿',sym:'₿'},
  {code:'ETH',name:'Ethereum',flag:'Ξ',sym:'Ξ'},
  {code:'USDT',name:'Tether',flag:'💲',sym:'₮'},
  {code:'USDC',name:'USD Coin',flag:'💵',sym:'$'},
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
function loadState(){
  try{ const d=JSON.parse(localStorage.getItem(SK)); return d; }catch(e){ return null; }
}
function saveState(){
  try{ localStorage.setItem(SK,JSON.stringify(S)); }catch(_e){}
  // Auto-sync a Firebase si hay usuario logueado
  if(typeof _authUser !== 'undefined' && _authUser && typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED){
    clearTimeout(_syncDebounce);
    _syncDebounce=setTimeout(()=>uploadToCloud(_authUser.uid), 2500);
  }
}

const _saved = loadState();
const S = _saved || {
  txs:[], cats:JSON.parse(JSON.stringify(DEFAULT_CATS)),
  currency:CURRENCIES[0], useComma:true, hidden:false, accent:'#34d48a',
  budgets:[], goals:[], recurring:[], lang:'es',
};
// Guards
if(!Array.isArray(S.txs)) S.txs=[];
if(!S.cats||typeof S.cats!=='object') S.cats=JSON.parse(JSON.stringify(DEFAULT_CATS));
if(!Array.isArray(S.cats.expense)) S.cats.expense=JSON.parse(JSON.stringify(DEFAULT_CATS.expense));
if(!Array.isArray(S.cats.income))  S.cats.income=JSON.parse(JSON.stringify(DEFAULT_CATS.income));
if(!Array.isArray(S.cats.invest))  S.cats.invest=JSON.parse(JSON.stringify(DEFAULT_CATS.invest));
if(!S.currency||!S.currency.sym) S.currency=CURRENCIES[0];
if(typeof S.useComma==='undefined') S.useComma=true;
if(typeof S.hidden==='undefined') S.hidden=false;
if(!Array.isArray(S.budgets)) S.budgets=[];
if(!Array.isArray(S.goals)) S.goals=[];
if(!Array.isArray(S.recurring)) S.recurring=[];
if(!S.lang) S.lang='es';
if(!S.accent) S.accent='#34d48a';
if(typeof S.guestMode==='undefined') S.guestMode=false;
if(!S.pendingInvites) S.pendingInvites=[];
if(typeof S.budgetAlerts==='undefined') S.budgetAlerts=true;
if(typeof S.useThousands==='undefined') S.useThousands=true;
if(typeof S.darkMode==='undefined') S.darkMode=true;

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
let navStack=['s-home'], curScreen='s-home';

function goTo(id){
  if(id===curScreen) return;
  const prev=navStack[navStack.length-1];
  document.getElementById(prev).classList.add('back');
  document.getElementById(id).classList.remove('hidden','back');
  navStack.push(id);
  if(navStack.length>20) navStack.splice(0,navStack.length-20);
  curScreen=id;
  // On-enter refresh (base + Split)
  const R={
    's-invest':renderInvest,
    's-cats':renderCatLists,
    's-budgets':renderBudgets,
    's-goals':renderGoals,
    's-recurring':renderRecurring,
    's-profile':renderProfile,
    's-allTx':renderAllTx,
    's-monthly':()=>{monthlyYear=new Date().getFullYear();monthlyMonth=new Date().getMonth();renderMonthly();},
    's-split':()=>initSplit(),
    's-split-group':()=>renderGroupDetail(),
    's-split-settings':()=>renderSplitSettings(),
    's-data':()=>{ switchDataTab('export'); document.getElementById('import-preview').style.display='none'; document.getElementById('sankey-preview-wrap').style.display='none'; _pendingImportTxs=[]; },
  };
  if(R[id]) R[id]();
}

function goBack(){
  if(navStack.length<=1) return;
  const cur=navStack.pop();
  const prev=navStack[navStack.length-1];
  document.getElementById(cur).classList.add('hidden');
  document.getElementById(prev).classList.remove('hidden','back');
  curScreen=prev;
  // Refresh on return
  const R={'s-home':refreshHome,'s-invest':renderInvest,'s-cats':renderCatLists,
           's-budgets':renderBudgets,'s-goals':renderGoals,'s-monthly':renderMonthly,
           's-recurring':renderRecurring,'s-split-expense':buildSplitCatGrid};
  if(R[prev]) R[prev]();

  // Ocultar tacho al salir de s-add
  const _screen = navStack.length > 0 ? navStack[navStack.length-1] : '';
  if(_screen !== 's-add'){
    const _del = document.getElementById('tx-delete-btn');
    if(_del) _del.style.display='none';
  }
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
let _uid=Date.now();
function uid(){ return 'x'+(++_uid).toString(36); }

function fmt(n){
  const a=Math.abs(n);
  const grp=typeof S!=='undefined'?S.useThousands!==false:true;
  const opts={minimumFractionDigits:0,maximumFractionDigits:2,useGrouping:grp};
  return a.toLocaleString('es-AR',opts);
}
function fmtShort(n){ if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(n>=10000?0:1)+'k'; return fmt(n); }
function fmtCompact(n){ if(Math.abs(n)>=100000) return (n/1000).toFixed(0).replace('.',getSep())+'k'; if(Math.abs(n)>=10000) return (n/1000).toFixed(1).replace('.',getSep())+'k'; return fmt(n); }
function getSep(){ return S.useComma?',':'.'; }
function sym(){ return S.currency.sym; }

function normAmt(s){
  // Remove thousands separators then normalize decimal
  return parseFloat(s.replace(/\.(?=\d{3})/g,'').replace(',','.'))||0;
}

function dayLabel(iso){
  const d=new Date(iso), now=new Date(), yes=new Date();
  yes.setDate(yes.getDate()-1);
  const M=MSHORT, D=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  if(d.toDateString()===now.toDateString()) return `Hoy — ${d.getDate()} ${M[d.getMonth()]}`;
  if(d.toDateString()===yes.toDateString()) return `Ayer — ${d.getDate()} ${M[d.getMonth()]}`;
  return `${D[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}`;
}

function sameWeek(a){
  const d=new Date(a),now=new Date();
  const s=new Date(now); s.setDate(now.getDate()-((now.getDay()+6)%7)); s.setHours(0,0,0,0);
  return d>=s;
}
function sameMonth(a){ const d=new Date(a),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }
function sameYear(a){ return new Date(a).getFullYear()===new Date().getFullYear(); }

function filterTxs(period){
  if(period==='semana') return S.txs.filter(t=>sameWeek(t.date));
  if(period==='mes')    return S.txs.filter(t=>sameMonth(t.date));
  if(period==='año')    return S.txs.filter(t=>sameYear(t.date));
  return [...S.txs];
}

function findCat(type,name){
  const pool=type==='invest'?S.cats.invest:type==='income'?S.cats.income:S.cats.expense;
  return pool.find(c=>c.n===name);
}

function spentInCat(catName, month, year){
  return S.txs
    .filter(t=>t.type==='expense'&&t.cat===catName&&new Date(t.date).getMonth()===month&&new Date(t.date).getFullYear()===year)
    .reduce((a,t)=>a+t.amount,0);
}

// ═══════════════════════════════════════════
// RECURRING — apply on load
// ═══════════════════════════════════════════
function applyRecurring(){
  const now=new Date();
  const todayStr=now.toISOString().slice(0,10);
  let applied=0;
  S.recurring.forEach(r=>{
    const expectedDay=r.day;
    // Check if already registered this month
    const alreadyDone=S.txs.some(t=>{
      const td=new Date(t.date);
      return t.recurringId===r.id && td.getMonth()===now.getMonth() && td.getFullYear()===now.getFullYear();
    });
    if(!alreadyDone && now.getDate()>=expectedDay){
      S.txs.unshift({
        id:uid(), type:r.type, amount:r.amount,
        cat:r.cat, note:r.name+' (automático)',
        date:new Date(now.getFullYear(),now.getMonth(),expectedDay).toISOString(),
        recurringId:r.id,
      });
      applied++;
    }
  });
  if(applied>0){ saveState(); showToast(`↺ ${applied} recurrente${applied>1?'s':''} registrado${applied>1?'s':''}`); }
}

// ═══════════════════════════════════════════
// HOME REFRESH
// ═══════════════════════════════════════════
let curPeriod='todo';

function refreshHome(){
  const txs=filterTxs(curPeriod);
  const income=txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expense=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const invest=S.txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
  const net=income-expense;
  const s=sym();

  const hBalEl=document.getElementById('h-bal');
  hBalEl.textContent=(net<0?'-':'')+fmt(net);
  hBalEl.style.color=net<0?'var(--rd)':net===0?'var(--mu)':'var(--tx)';
  document.getElementById('h-sym').textContent=s;
  document.getElementById('h-inc').textContent=s+fmtCompact(income);
  document.getElementById('h-exp').textContent=s+fmtCompact(expense);
  document.getElementById('h-net').textContent=(net>=0?'+':'-')+s+fmtCompact(Math.abs(net));
  document.getElementById('h-invest').textContent=s+fmt(invest);

  const cn=document.getElementById('c-net');
  cn.textContent=(net>=0?'+':'-')+s+fmt(net);
  cn.className='chart-net'+(net<0?' neg':'');
  document.getElementById('cs-inc').textContent='+'+s+fmtCompact(income);
  document.getElementById('cs-exp').textContent='-'+s+fmtCompact(expense);
  document.getElementById('cs-net').textContent=(net>=0?'+':'-')+s+fmtCompact(Math.abs(net));

  drawChart(txs);
  renderTxList(txs,'tx-list',5);
  if(S.hidden) applyHide(true);

  // Alertas de presupuesto y próximos vencimientos
  const homeAlertsEl=document.getElementById('home-alerts');
  if(homeAlertsEl){ homeAlertsEl.innerHTML=''; renderBudgetAlerts(homeAlertsEl); renderUpcoming(homeAlertsEl); }
}

function setFilter(p,el){
  curPeriod=p;
  document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  const L={'semana':'Semana','mes':'Mes','año':'Año','todo':'Todo'};
  document.getElementById('c-period').textContent=L[p]||p;
  refreshHome();
}

// ═══════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════
function drawCanvas(txs, period) {
  const canvas = document.getElementById('chart-cv');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = canvas.offsetHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  const now = new Date();
  let incData = [], expData = [];

  if(period === 'semana') {
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay()+6)%7));
    start.setHours(0,0,0,0);
    for(let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const day = txs.filter(t => new Date(t.date).toDateString() === d.toDateString());
      incData.push(day.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0));
      expData.push(day.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0));
    }
  } else if(period === 'mes') {
    for(let wk=0; wk<4; wk++) {
      const wTxs = txs.filter(t => {
        const d = new Date(t.date);
        return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() && Math.floor((d.getDate()-1)/7)===wk;
      });
      incData.push(wTxs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0));
      expData.push(wTxs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0));
    }
  } else if(period === 'año') {
    for(let m=0; m<12; m++) {
      const mTxs = txs.filter(t => { const d=new Date(t.date); return d.getMonth()===m && d.getFullYear()===now.getFullYear(); });
      incData.push(mTxs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0));
      expData.push(mTxs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0));
    }
  } else {
    if(!txs.length) return;
    const sorted = [...txs].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const first = new Date(sorted[0].date);
    let cur = new Date(first.getFullYear(), first.getMonth(), 1);
    while(cur <= now) {
      const m=cur.getMonth(), y=cur.getFullYear();
      const mTxs = txs.filter(t=>{ const d=new Date(t.date); return d.getMonth()===m&&d.getFullYear()===y; });
      incData.push(mTxs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0));
      expData.push(mTxs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0));
      cur.setMonth(cur.getMonth()+1);
    }
  }

  if(!incData.length && !expData.length) return;
  const n = Math.max(incData.length, expData.length);
  const maxVal = Math.max(...incData, ...expData, 1);
  const PAD = {l:8, r:16, t:16, b:8};
  const cw = w - PAD.l - PAD.r;
  const ch = h - PAD.t - PAD.b;
  const xp = i => PAD.l + (i/(n-1||1))*cw;
  const yp = v => PAD.t + ch - (v/maxVal)*ch;

  function drawLine(data, color, fillColor) {
    if(data.every(v=>v===0)) return;
    // Área rellena
    ctx.beginPath();
    ctx.moveTo(xp(0), yp(0));
    ctx.lineTo(xp(0), yp(data[0]));
    for(let i=1; i<data.length; i++) {
      const cpx = (xp(i-1)+xp(i))/2;
      ctx.bezierCurveTo(cpx, yp(data[i-1]), cpx, yp(data[i]), xp(i), yp(data[i]));
    }
    ctx.lineTo(xp(data.length-1), yp(0));
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    // Línea
    ctx.beginPath();
    ctx.moveTo(xp(0), yp(data[0]));
    for(let i=1; i<data.length; i++) {
      const cpx = (xp(i-1)+xp(i))/2;
      ctx.bezierCurveTo(cpx, yp(data[i-1]), cpx, yp(data[i]), xp(i), yp(data[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Punto final
    ctx.beginPath();
    ctx.arc(xp(data.length-1), yp(data[data.length-1]), 4, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawLine(incData, '#34D48A', 'rgba(52,212,138,0.15)');
  drawLine(expData, '#f0566a', 'rgba(240,86,106,0.15)');
}

function drawChart(txs){
  // c-xlbls ya no se usa — los labels se dibujan en el canvas
  const xlbls=document.getElementById('c-xlbls');
  if(xlbls) xlbls.innerHTML='';
  drawCanvas(txs, curPeriod);
}

function drawTrendChart(){
  drawCanvas(S.txs, 'todo');
}

// ═══════════════════════════════════════════
// TX LIST
// ═══════════════════════════════════════════
function renderTxList(txs, containerId, limit){
  const list=document.getElementById(containerId);
  if(!list) return;
  list.innerHTML='';
  const sorted=[...txs].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const show=limit?sorted.slice(0,limit):sorted;
  if(show.length===0){
    list.innerHTML='<div class="empty-state"><span class="big">💸</span>Sin movimientos todavía.<br>Tocá + para agregar el primero.</div>';
    return;
  }
  const groups={};
  show.forEach(tx=>{ const dk=tx.date.slice(0,10); if(!groups[dk])groups[dk]=[]; groups[dk].push(tx); });
  Object.entries(groups).forEach(([dk,items])=>{
    const hdr=document.createElement('div'); hdr.className='day-hdr';
    const total=items.filter(t=>t.type!=='invest').reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0);
    hdr.innerHTML=`<span>${dayLabel(dk+'T12:00:00')}</span><span class="day-total">${total>=0?'+':'-'}${sym()}${fmt(total)}</span>`;
    list.appendChild(hdr);
    items.forEach(tx=>list.appendChild(buildTxItem(tx)));
  });
}

function buildTxItem(tx){
  const isIn=tx.type==='income', isV=tx.type==='invest';
  const cls=isIn?'g':isV?'a':'r';
  const bg=isIn?'var(--gd)':isV?'var(--amd)':'var(--s2)';
  const cat=findCat(tx.type,tx.cat);
  const emoji=cat?cat.e:(isIn?'💰':isV?'📈':'💸');
  const el=document.createElement('div'); el.className='tx-item';
  const recBadge=tx.recurringId?'<span class="rec-badge">↺</span>':'';
  const splitBadge=tx.isSplit?'<span class="rec-badge" style="color:var(--bl);background:var(--bld)">⚡ Split</span>':'';
  el.innerHTML=`
    <div class="tx-ico" style="background:${bg}">${emoji}</div>
    <div class="tx-info">
      <div class="tx-name">${tx.note||tx.cat||'Sin nota'}${recBadge}${splitBadge}</div>
      <div class="tx-cat">${tx.cat||''}</div>
    </div>
    <div class="tx-r">
      <div class="tx-amt ${cls}">${isIn?'+':isV?'':'-'}${sym()}${fmt(tx.amount)}</div>
      <div class="tx-dt">${tx.date.slice(5,10).replace('-','/')}</div>
    </div>`;
  el.onclick=()=>openEdit(tx.id);
  return el;
}

// ═══════════════════════════════════════════
// ADD TRANSACTION
// ═══════════════════════════════════════════
let txType='expense', amtStr='0', selCat=null, editingId=null;

function openAdd(forceType){
  editingId=null; editingTxId=null; amtStr='0'; selCat=null;
  const titleEl=document.getElementById('add-title');
  if(titleEl) titleEl.textContent='Nueva transacción';
  const noteEl=document.getElementById('note-inp');
  if(noteEl) noteEl.value='';
  txDate=new Date(); updateDateLbl();
  setType(forceType||'expense');
  updateAmt();
  renderTxCatCircles('expense');
  // Tacho siempre visible: en modo nuevo limpia el formulario
  showDeleteBtn(false);
  hideNumpad();
  goTo('s-add');
}

function toggleExtras(){
  document.getElementById('extras-body').classList.toggle('open');
  document.getElementById('extras-toggle').classList.toggle('open');
}

function setType(txT){
  txType=txT;
  // Botones tipo nuevo diseño
  ['e','i','v'].forEach(t=>{
    const el=document.getElementById('btn-'+t);
    if(!el) return;
    el.className='tx-type-btn';
    if(t==='e'&&txT==='expense') el.classList.add('active-e');
    if(t==='i'&&txT==='income') el.classList.add('active-i');
    if(t==='v'&&txT==='invest') el.classList.add('active-v');
  });
  // Color monto
  const disp=document.getElementById('amt-display');
  if(disp) disp.className='amt-num '+(txT==='income'?'ic':txT==='invest'?'vc':'ec');
  // Botón guardar color
  const sb=document.getElementById('save-btn');
  if(sb) sb.style.color=txT==='income'?'var(--gr)':txT==='invest'?'var(--am)':'var(--rd)';
  // Categorías
  renderTxCatCircles(txT);
  updateAmt();
}

function buildCatGrid(containerId, type, selected, onSel){
  const g=document.getElementById(containerId); if(!g) return;
  g.innerHTML='';
  const pool=type==='invest'?S.cats.invest:type==='income'?S.cats.income:S.cats.expense;
  pool.forEach(c=>{
    const b=document.createElement('div'); b.className='cat-btn';
    if(selected===c.n){ b.style.borderColor=c.c; b.style.background=c.c+'20'; b.querySelector&&setTimeout(()=>{const cn=b.querySelector('.cn');if(cn)cn.style.color=c.c;},0); }
    b.innerHTML=`<div class="ce">${c.e}</div><div class="cn">${c.n}</div>`;
    b.onclick=()=>{
      g.querySelectorAll('.cat-btn').forEach(x=>{x.style.borderColor='var(--br)';x.style.background='var(--s1)';const cn=x.querySelector('.cn');if(cn)cn.style.color='var(--mu)';});
      b.style.borderColor=c.c; b.style.background=c.c+'20'; b.querySelector('.cn').style.color=c.c;
      onSel(c.n);
    };
    g.appendChild(b);
  });
}

function np(k){
  const sep=getSep();
  if(k==='del'){ amtStr=amtStr.length>1?amtStr.slice(0,-1):'0'; }
  else if(k==='dec'){ if(!amtStr.includes(sep)) amtStr+=sep; }
  else { if(amtStr==='0') amtStr=k; else if(amtStr.replace(/[^0-9]/g,'').length<12) amtStr+=k; }
  updateAmt();
  updateNumpadPreview();
}

function updateAmt(){
  document.getElementById('dec-key').textContent=getSep();
  const raw=amtStr.replace(',','.');
  const parts=raw.split('.');
  const intFmt=isNaN(parseInt(parts[0]))?'0':parseInt(parts[0]).toLocaleString('es-AR');
  const decPart=parts.length>1?(getSep()+parts[1]):'';
  document.getElementById('amt-display').innerHTML=intFmt+decPart+'<span class="amt-cur"></span>';
}

function saveTx(){
  const amt=normAmt(amtStr);
  if(amt<=0){ showToast('⚠️ Ingresá un monto'); return; }
  const note=document.getElementById('note-inp').value.trim();
  const tx={id:editingId||uid(),type:txType,amount:amt,cat:selCat||'',note,date:(typeof txDate!=='undefined'?txDate:new Date()).toISOString()};
  if(editingId){ const i=S.txs.findIndex(t=>t.id===editingId); if(i!==-1)S.txs[i]=tx; showToast('✅ Actualizado'); }
  else { S.txs.unshift(tx); showToast(`✅ ${txType==='income'?'+':'-'}${sym()}${fmt(amt)}`); }
  saveState();
  checkBudgetAlerts(tx);
  const wasInvest=txType==='invest';
  amtStr='0'; selCat=null; editingId=null;
  document.getElementById('note-inp').value='';
  updateAmt();
  setTimeout(()=>{ goBack(); if(wasInvest) setTimeout(()=>goTo('s-invest'),60); else refreshHome(); },500);
}

function checkBudgetAlerts(tx){
  if(!S.budgetAlerts) return;
  if(tx.type!=='expense') return;
  const budget=S.budgets.find(b=>b.cat===tx.cat);
  if(!budget) return;
  const now=new Date();
  const spent=spentInCat(tx.cat,now.getMonth(),now.getFullYear());
  const pct=spent/budget.limit;
  if(pct>=1) showToast(`⚠️ Superaste el presupuesto de ${tx.cat}!`);
  else if(pct>=0.8) showToast(`🔔 80% del presupuesto de ${tx.cat}`);
}

// ═══════════════════════════════════════════
// EDIT TRANSACTION
// ═══════════════════════════════════════════
let editingTxId=null, editAmtStr='0', editSelCat=null;

function openEdit(id){
  const tx=S.txs.find(t=>t.id===id); if(!tx) return;
  editingTxId=id; editingId=id;
  amtStr=String(tx.amount).replace('.',getSep());
  selCat=tx.cat||null;
  const noteEl=document.getElementById('note-inp');
  if(noteEl) noteEl.value=tx.note||'';
  const titleEl=document.getElementById('add-title');
  if(titleEl) titleEl.textContent='Editar movimiento';
  txDate=tx.date?new Date(tx.date):new Date();
  updateDateLbl();
  setType(tx.type);
  updateAmt();
  renderTxCatCircles(tx.type);
  // Tacho en modo edición: borra el movimiento
  showDeleteBtn(true);
  hideNumpad();
  goTo('s-add');
}

function closeEdit(){ editingTxId=null; goBack(); }

function enp(k){
  const sep=getSep();
  if(k==='del'){ editAmtStr=editAmtStr.length>1?editAmtStr.slice(0,-1):'0'; }
  else if(k==='dec'){ if(!editAmtStr.includes(sep)) editAmtStr+=sep; }
  else { if(editAmtStr==='0') editAmtStr=k; else if(editAmtStr.replace(/[^0-9]/g,'').length<12) editAmtStr+=k; }
  updateEditAmt();
}

function updateEditAmt(){
  document.getElementById('edit-dec-key').textContent=getSep();
  const raw=editAmtStr.replace(',','.');
  const parts=raw.split('.');
  const intFmt=isNaN(parseInt(parts[0]))?'0':parseInt(parts[0]).toLocaleString('es-AR');
  const decPart=parts.length>1?(getSep()+parts[1]):'';
  document.getElementById('edit-amt-display').innerHTML=intFmt+decPart+'<span class="amt-cur"></span>';
}

function saveEdit(){
  const tx=S.txs.find(t=>t.id===editingTxId); if(!tx){ closeEdit(); return; }
  const amt=normAmt(editAmtStr);
  if(amt<=0){ showToast('⚠️ Monto inválido'); return; }
  tx.amount=amt; tx.note=document.getElementById('edit-note-inp').value.trim();
  if(editSelCat) tx.cat=editSelCat;
  saveState(); showToast('✅ Cambios guardados'); closeEdit();
  setTimeout(()=>{ if(curScreen==='s-home') refreshHome(); if(curScreen==='s-invest') renderInvest(); },50);
}

function deleteTx(){
  if(!editingTxId) return;
  showConfirm('Eliminar','¿Eliminar este movimiento?',()=>{
    const wasInvest=S.txs.find(t=>t.id===editingTxId)?.type==='invest';
    S.txs=S.txs.filter(t=>t.id!==editingTxId);
    saveState(); closeEdit(); showToast('🗑️ Eliminado');
    setTimeout(()=>{ refreshHome(); if(wasInvest) renderInvest(); },50);
  });
}

// ═══════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════
function renderInvest(){
  const invTxs=S.txs.filter(t=>t.type==='invest').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=invTxs.reduce((a,t)=>a+t.amount,0);
  const s=sym();
  document.getElementById('inv-sym').textContent=s;
  document.getElementById('inv-total').textContent=fmt(total);
  document.getElementById('inv-total2').textContent=s+fmt(total);
  document.getElementById('inv-count').textContent=invTxs.length;
  const list=document.getElementById('inv-list'); list.innerHTML='';
  if(invTxs.length===0){ list.innerHTML='<div class="empty-state"><span class="big">📊</span>Sin inversiones registradas.</div>'; return; }
  invTxs.forEach(tx=>{
    const cat=findCat('invest',tx.cat);
    const el=document.createElement('div'); el.className='inv-item';
    const pct=total>0?Math.round(tx.amount/total*100):0;
    el.innerHTML=`
      <div class="inv-ico">${cat?cat.e:'📈'}</div>
      <div class="inv-info">
        <div class="inv-name">${tx.note||tx.cat||'Inversión'}</div>
        <div class="inv-sub">${tx.cat||''} · ${tx.date.slice(0,10)}</div>
        <div class="inv-bar"><div class="inv-bar-fill" style="width:0%" data-pct="${pct}"></div></div>
      </div>
      <div class="inv-r"><div class="inv-val">${s}${fmt(tx.amount)}</div></div>`;
    el.style.cursor='pointer';
    el.onclick=()=>openEdit(tx.id);
    list.appendChild(el);
    setTimeout(()=>{ const f=el.querySelector('.inv-bar-fill'); if(f) f.style.width=f.dataset.pct+'%'; },150);
  });
}

// ═══════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════
let editingBudgetId=null, budgetSelCat=null;

function renderBudgets(){
  const list=document.getElementById('budget-list'); if(!list) return; list.innerHTML='';
  const now=new Date();
  if(S.budgets.length===0){
    list.innerHTML='<div class="empty-state"><span class="big">🎯</span>Sin presupuestos.<br>Creá uno para controlar tus gastos.</div>'; return;
  }
  S.budgets.forEach(b=>{
    const spent=spentInCat(b.cat,now.getMonth(),now.getFullYear());
    const pct=Math.min(spent/b.limit,1);
    const over=spent>b.limit, warn=pct>=0.8&&!over;
    const cat=findCat('expense',b.cat);
    const color=over?'var(--rd)':warn?'var(--am)':'var(--gr)';
    const el=document.createElement('div'); el.className='budget-item'+(over?' over':warn?' warn':'');
    el.innerHTML=`
      <div class="budget-top">
        <div class="budget-left">
          <div class="budget-ico" style="background:${cat?cat.c+'20':'var(--s2)'}">${cat?cat.e:'📦'}</div>
          <div class="budget-name">${b.cat}</div>
        </div>
        <div class="budget-right">
          <div class="budget-spent" style="color:${color}">${sym()}${fmt(spent)}</div>
          <div class="budget-limit">de ${sym()}${fmt(b.limit)}</div>
        </div>
      </div>
      <div class="budget-bar-wrap">
        <div class="budget-bar-fill" style="width:0%;background:${color}" data-pct="${Math.round(pct*100)}"></div>
      </div>`;
    el.onclick=()=>openBudgetModal(b.id);
    list.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const f=el.querySelector('.budget-bar-fill');
    if(f) f.style.width=f.dataset.pct+'%';
  }));
  });
}



function openBudgetModal(id){
  editingBudgetId=id; budgetSelCat=null;
  const existing=id?S.budgets.find(b=>b.id===id):null;
  document.getElementById('budget-modal-title').textContent=id?'Editar presupuesto':'Nuevo presupuesto';
  document.getElementById('budget-limit-inp').value=existing?existing.limit:'';
  document.getElementById('budget-del-btn').style.display=id?'block':'none';
  buildCatGrid('budget-cat-grid','expense',existing?existing.cat:null,cn=>{budgetSelCat=cn;});
  if(existing) budgetSelCat=existing.cat;
  document.getElementById('budget-modal').classList.remove('hidden');
}
function closeBudgetModal(){ document.getElementById('budget-modal').classList.add('hidden'); editingBudgetId=null; }

function saveBudget(){
  if(!budgetSelCat){ showToast('⚠️ Elegí una categoría'); return; }
  const limit=parseFloat(document.getElementById('budget-limit-inp').value)||0;
  if(limit<=0){ showToast('⚠️ Ingresá un límite'); return; }
  if(editingBudgetId){
    const b=S.budgets.find(x=>x.id===editingBudgetId);
    if(b){ b.cat=budgetSelCat; b.limit=limit; }
  } else {
    if(S.budgets.find(b=>b.cat===budgetSelCat)){ showToast('⚠️ Ya existe un presupuesto para esa categoría'); return; }
    S.budgets.push({id:uid(),cat:budgetSelCat,limit});
  }
  saveState(); closeBudgetModal(); renderBudgets(); showToast('✅ Presupuesto guardado');
}
function deleteBudget(){
  if(!editingBudgetId) return;
  showConfirm('Eliminar presupuesto','¿Eliminar este presupuesto?',()=>{
    S.budgets=S.budgets.filter(b=>b.id!==editingBudgetId);
    saveState(); closeBudgetModal(); renderBudgets(); showToast('🗑️ Eliminado');
  });
}

// ═══════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════
let editingGoalId=null, goalEmoji='🎯';

function renderGoals(){
  const list=document.getElementById('goal-list'); if(!list) return; list.innerHTML='';
  if(S.goals.length===0){
    list.innerHTML='<div class="empty-state"><span class="big">🎯</span>Sin metas todavía.<br>Tocá + para crear tu primera meta.</div>';
    return;
  }
  S.goals.forEach(g=>{
    const pct=Math.min(g.saved/g.target,1);
    const done=pct>=1;
    const el=document.createElement('div'); el.className='goal-item';
    el.innerHTML=`
      <span class="goal-emoji">${g.emoji||'🎯'}</span>
      <div class="goal-top">
        <div>
          <div class="goal-name">${g.name}</div>
          <div class="goal-sub">${done?'✅ ¡Meta alcanzada!':'En progreso'}</div>
        </div>
        <div class="goal-amounts">
          <div class="goal-saved">${sym()}${fmt(g.saved)}</div>
          <div class="goal-target">de ${sym()}${fmt(g.target)}</div>
        </div>
      </div>
      <div class="goal-bar-wrap" style="margin-bottom:8px">
        <div class="goal-bar-fill" style="width:0%;background:${done?'var(--gr)':'var(--bl)'}" data-pct="${Math.round(pct*100)}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="goal-pct">${Math.round(pct*100)}% completado</div>
        <div style="display:flex;gap:6px">
          <button style="padding:5px 10px;border-radius:9px;background:var(--s2);color:var(--mu);border:1px solid var(--br);font-size:12px;font-weight:600;cursor:pointer"
            onclick="event.stopPropagation();openGoalHistory('${g.id}')">📋</button>
          <button style="padding:5px 14px;border-radius:9px;background:var(--bld);color:var(--bl);border:1px solid rgba(107,140,255,.3);font-size:12px;font-weight:600;cursor:pointer" 
            onclick="event.stopPropagation();quickAddToGoal('${g.id}')">+ Abonar</button>
        </div>
      </div>`;
    el.onclick=()=>openGoalModal(g.id);
    list.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const f=el.querySelector('.goal-bar-fill');
      if(f) f.style.width=f.dataset.pct+'%';
    }));
  });
}

function quickAddToGoal(id){
  const g=S.goals.find(x=>x.id===id); if(!g) return;
  // Mostrar input inline para abonar
  const modal_html=`
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:var(--s1);border:1px solid var(--br);border-radius:20px;padding:24px;width:100%;max-width:320px">
        <div style="font-size:22px;text-align:center;margin-bottom:8px">${g.emoji||'🎯'}</div>
        <div style="font-size:15px;font-weight:600;text-align:center;margin-bottom:4px">${g.name}</div>
        <div style="font-size:12px;color:var(--mu);text-align:center;margin-bottom:16px">
          Ahorrado: ${sym()}${fmt(g.saved)} de ${sym()}${fmt(g.target)}
        </div>
        <div style="font-size:12px;color:var(--mu);margin-bottom:6px">¿Cuánto querés abonar?</div>
        <input id="quick-goal-inp" type="number" placeholder="0" min="0" 
          style="width:100%;background:var(--s2);border:1px solid var(--br);border-radius:12px;padding:12px 14px;color:var(--tx);font-size:16px;font-family:inherit;outline:none;margin-bottom:14px;box-sizing:border-box">
        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('quick-goal-overlay').remove()" 
            style="flex:1;padding:12px;border-radius:12px;background:var(--s2);border:1px solid var(--br);font-size:14px;font-weight:600;cursor:pointer;color:var(--tx)">Cancelar</button>
          <button onclick="confirmQuickAddGoal('${id}')"
            style="flex:1;padding:12px;border-radius:12px;background:var(--gr);border:none;font-size:14px;font-weight:600;cursor:pointer;color:#0f0f13">Abonar</button>
        </div>
      </div>
    </div>`;
  const overlay=document.createElement('div');
  overlay.id='quick-goal-overlay';
  overlay.innerHTML=modal_html;
  document.querySelector('.phone').appendChild(overlay);
  setTimeout(()=>{ const inp=document.getElementById('quick-goal-inp'); if(inp) inp.focus(); },100);
}

function confirmQuickAddGoal(id){
  const inp=document.getElementById('quick-goal-inp');
  const amt=parseFloat(inp?.value)||0;
  if(amt<=0){ showToast('⚠️ Ingresá un monto'); return; }
  const g=S.goals.find(x=>x.id===id); if(!g) return;
  g.saved=Math.min(g.saved+amt, g.target);
  if(!g.deposits) g.deposits=[];
  g.deposits.push({amount:amt,date:new Date().toISOString()});
  saveState();
  document.getElementById('quick-goal-overlay')?.remove();
  renderGoals();
  const pct=Math.round(g.saved/g.target*100);
  showToast(pct>=100?'🎉 ¡Meta alcanzada!':'✅ '+sym()+fmt(amt)+' abonado ('+pct+'%)');
}



function openGoalModal(id){
  editingGoalId=id;
  const g=id?S.goals.find(x=>x.id===id):null;
  goalEmoji=g?g.emoji||'🎯':'🎯';
  document.getElementById('goal-modal-title').textContent=id?'Editar meta':'Nueva meta';
  document.getElementById('goal-name-inp').value=g?g.name:'';
  document.getElementById('goal-target-inp').value=g?g.target:'';
  document.getElementById('goal-saved-inp').value=g?g.saved:'';
  document.getElementById('goal-del-btn').style.display=id?'block':'none';
  document.getElementById('goal-add-btn').style.display=id?'block':'none';
  renderGoalEmojis();
  document.getElementById('goal-modal').classList.remove('hidden');
}

function renderGoalEmojis(){
  const row=document.getElementById('goal-emoji-row'); row.innerHTML='';
  GOAL_EMOJIS.forEach(e=>{
    const b=document.createElement('div');
    const sel=e===goalEmoji;
    b.style.cssText='width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:2px solid '+(sel?'var(--gr)':'transparent')+';background:'+(sel?'var(--gd)':'var(--s2)');
    b.textContent=e;
    b.onclick=()=>{ goalEmoji=e; renderGoalEmojis(); };
    row.appendChild(b);
  });
}
function closeGoalModal(){ document.getElementById('goal-modal').classList.add('hidden'); editingGoalId=null; }

function saveGoal(){
  const name=document.getElementById('goal-name-inp').value.trim();
  const target=parseFloat(document.getElementById('goal-target-inp').value)||0;
  const savedVal=document.getElementById('goal-saved-inp').value;
  const saved=savedVal===''?0:parseFloat(savedVal)||0;
  if(!name){ showToast('⚠️ Ingresá un nombre'); return; }
  if(target<=0){ showToast('⚠️ Ingresá un monto objetivo'); return; }
  if(editingGoalId){
    const g=S.goals.find(x=>x.id===editingGoalId);
    if(g){ g.name=name; g.target=target; g.saved=saved; g.emoji=goalEmoji; }
  } else {
    S.goals.push({id:uid(),name,target,saved,emoji:goalEmoji});
  }
  saveState(); closeGoalModal(); renderGoals(); showToast('✅ Meta guardada');
}

function addToGoal(){
  const g=S.goals.find(x=>x.id===editingGoalId); if(!g) return;
  // Usar el campo saved directamente — el usuario edita el valor y guarda
  showToast('✏️ Editá el monto ahorrado y guardá');
  document.getElementById('goal-saved-inp').focus();
}

function deleteGoal(){
  if(!editingGoalId) return;
  showConfirm('Eliminar meta','¿Eliminar esta meta de ahorro?',()=>{
    S.goals=S.goals.filter(g=>g.id!==editingGoalId);
    saveState(); closeGoalModal(); renderGoals(); showToast('🗑️ Meta eliminada');
  });
}

// ═══════════════════════════════════════════
// RECURRING
// ═══════════════════════════════════════════
let editingRecId=null, recType='expense', recSelCat=null;

function renderRecurring(){
  const list=document.getElementById('rec-list'); if(!list) return; list.innerHTML='';
  if(S.recurring.length===0){
    list.innerHTML='<div class="empty-state"><span class="big">↺</span>Sin recurrentes.<br>Agregá tus gastos fijos.</div>'; return;
  }
  S.recurring.forEach(r=>{
    const isIn=r.type==='income';
    const cat=findCat(r.type,r.cat);
    const el=document.createElement('div'); el.className='tx-item';
    el.innerHTML=`
      <div class="tx-ico" style="background:${isIn?'var(--gd)':'var(--s2)'}">${cat?cat.e:isIn?'💰':'💸'}</div>
      <div class="tx-info">
        <div class="tx-name">${r.name}</div>
        <div class="tx-cat">${r.cat||''} · Día ${r.day} de cada mes</div>
      </div>
      <div class="tx-r">
        <div class="tx-amt ${isIn?'g':'r'}">${isIn?'+':'-'}${sym()}${fmt(r.amount)}</div>
      </div>`;
    el.onclick=()=>openRecModal(r.id);
    list.appendChild(el);
  });
}

function openRecModal(id){
  editingRecId=id; recSelCat=null;
  const r=id?S.recurring.find(x=>x.id===id):null;
  document.getElementById('rec-modal-title').textContent=id?'Editar recurrente':'Nuevo recurrente';
  document.getElementById('rec-name-inp').value=r?r.name:'';
  document.getElementById('rec-amt-inp').value=r?r.amount:'';
  document.getElementById('rec-day-inp').value=r?r.day:'';
  document.getElementById('rec-del-btn').style.display=id?'block':'none';
  const recT=r?r.type:'expense';
  setRecType(recT);
  if(r) recSelCat=r.cat;
  document.getElementById('rec-modal').classList.remove('hidden');
}
function closeRecModal(){ document.getElementById('rec-modal').classList.add('hidden'); editingRecId=null; }

function setRecType(recTxT){
  recType=recTxT;
  document.getElementById('rec-btn-e').className='type-btn'+(recTxT==='expense'?' ae':'');
  document.getElementById('rec-btn-i').className='type-btn'+(recTxT==='income'?' ai':'');
  buildCatGrid('rec-cat-grid',recTxT,recSelCat,cn=>{recSelCat=cn;});
}

function saveRec(){
  const name=document.getElementById('rec-name-inp').value.trim();
  const amount=parseFloat(document.getElementById('rec-amt-inp').value)||0;
  const day=parseInt(document.getElementById('rec-day-inp').value)||1;
  if(!name){ showToast('⚠️ Ingresá un nombre'); return; }
  if(amount<=0){ showToast('⚠️ Ingresá un monto'); return; }
  if(!recSelCat){ showToast('⚠️ Elegí una categoría'); return; }
  if(editingRecId){
    const r=S.recurring.find(x=>x.id===editingRecId);
    if(r){ r.name=name; r.amount=amount; r.day=day; r.type=recType; r.cat=recSelCat; }
  } else {
    S.recurring.push({id:uid(),name,amount,day,type:recType,cat:recSelCat});
  }
  saveState(); closeRecModal(); renderRecurring(); showToast('✅ Recurrente guardado');
}
function deleteRec(){
  if(!editingRecId) return;
  showConfirm('Eliminar recurrente','¿Eliminar este recurrente?',()=>{
    S.recurring=S.recurring.filter(r=>r.id!==editingRecId);
    saveState(); closeRecModal(); renderRecurring(); showToast('🗑️ Eliminado');
  });
}

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
let editingCatType=null, editingCatId=null, newCatEmoji=EMOJIS[0], newCatColor=COLORS[0];

function renderCatLists(){
  ['expense','income','invest'].forEach(t=>renderCatSec(t,'cats-'+t));
}
function renderCatSec(type, cid){
  const el=document.getElementById(cid); if(!el) return; el.innerHTML='';
  S.cats[type].forEach(c=>{
    const d=document.createElement('div'); d.className='cat-mgr-item';
    d.innerHTML=`<div class="cat-mgr-ico" style="background:${c.c}20;border:1.5px solid ${c.c}55">${c.e}</div><div class="cat-mgr-name">${c.n}</div><div class="cat-mgr-edit" style="color:${c.c}">Editar ›</div>`;
    d.onclick=()=>openEditCat(type,c.id);
    el.appendChild(d);
  });
  const add=document.createElement('div'); add.className='cat-add-btn';
  add.innerHTML=`<div class="cat-mgr-ico" style="background:var(--s2)">➕</div><div style="font-size:13px;color:var(--mu)">Nueva categoría</div>`;
  add.onclick=()=>openNewCat(type);
  el.appendChild(add);
}

function openNewCat(type='expense'){
  editingCatType=type; editingCatId=null;
  const L={expense:'gasto',income:'ingreso',invest:'inversión'};
  document.getElementById('cat-modal-title').textContent=`Nueva cat. de ${L[type]}`;
  document.getElementById('cat-name-inp').value='';
  document.getElementById('cat-del-btn').style.display='none';
  newCatEmoji=EMOJIS[0]; newCatColor=COLORS[0];
  renderEmojiPicker(); renderColorPicker();
  document.getElementById('cat-modal').classList.remove('hidden');
}
function openEditCat(type,id){
  const cat=S.cats[type].find(c=>c.id===id); if(!cat) return;
  editingCatType=type; editingCatId=id;
  document.getElementById('cat-modal-title').textContent='Editar categoría';
  document.getElementById('cat-name-inp').value=cat.n;
  document.getElementById('cat-del-btn').style.display='block';
  newCatEmoji=cat.e; newCatColor=cat.c;
  renderEmojiPicker(); renderColorPicker();
  document.getElementById('cat-modal').classList.remove('hidden');
}
function closeCatModal(){ document.getElementById('cat-modal').classList.add('hidden'); }

function renderEmojiPicker(){
  const el=document.getElementById('emoji-picker'); el.innerHTML='';
  EMOJIS.forEach(em=>{
    const b=document.createElement('div'); b.className='em-opt'+(em===newCatEmoji?' sel':'');
    b.textContent=em; b.onclick=()=>{ newCatEmoji=em; renderEmojiPicker(); };
    el.appendChild(b);
  });
}
function renderColorPicker(){
  const el=document.getElementById('color-picker'); el.innerHTML='';
  COLORS.forEach(col=>{
    const b=document.createElement('div'); b.className='co-opt'+(col===newCatColor?' sel':'');
    b.style.background=col; b.onclick=()=>{ newCatColor=col; renderColorPicker(); };
    el.appendChild(b);
  });
}

function saveCat(){
  const name=document.getElementById('cat-name-inp').value.trim();
  if(!name){ showToast('⚠️ Escribí un nombre'); return; }
  if(editingCatId){
    const cat=S.cats[editingCatType].find(c=>c.id===editingCatId);
    if(cat){ cat.e=newCatEmoji; cat.n=name; cat.c=newCatColor; }
    showToast('✅ Categoría actualizada');
  } else {
    S.cats[editingCatType].push({id:'c_'+uid(),e:newCatEmoji,n:name,c:newCatColor});
    showToast(`✅ "${name}" creada`);
  }
  saveState(); closeCatModal(); renderCatLists();
  if(document.getElementById('split-cat-grid')) buildSplitCatGrid();
}
function deleteCat(){
  if(!editingCatId) return;
  showConfirm('Eliminar categoría','Los movimientos con esta categoría no se borran.',()=>{
    S.cats[editingCatType]=S.cats[editingCatType].filter(c=>c.id!==editingCatId);
    if(editingCatType==='expense' && splitSelCat){
      if(!S.cats.expense.some(c=>c.n===splitSelCat)){
        splitSelCat=null;
        const icon=document.getElementById('split-exp-cat-icon');
        if(icon) icon.textContent='💸';
      }
    }
    saveState(); closeCatModal(); renderCatLists(); showToast('🗑️ Categoría eliminada');
    if(document.getElementById('split-cat-grid')) buildSplitCatGrid();
  });
}

// ═══════════════════════════════════════════
// MONTHLY SUMMARY
// ═══════════════════════════════════════════
let monthlyYear=new Date().getFullYear(), monthlyMonth=new Date().getMonth();

function changeMonth(dir){
  monthlyMonth+=dir;
  if(monthlyMonth<0){monthlyMonth=11;monthlyYear--;}
  if(monthlyMonth>11){monthlyMonth=0;monthlyYear++;}
  renderMonthly();
}

function renderMonthly(){
  document.getElementById('monthly-title').textContent=MNAMES[monthlyMonth]+' '+monthlyYear;
  const s=sym();
  const scroll=document.getElementById('monthly-scroll'); scroll.innerHTML='';

  // Datos mes actual
  const txs=S.txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===monthlyMonth&&d.getFullYear()===monthlyYear;});
  const income=txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expense=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const invest=txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
  const balance=income-expense;

  // Datos mes anterior para comparación
  const prevM=monthlyMonth===0?11:monthlyMonth-1;
  const prevY=monthlyMonth===0?monthlyYear-1:monthlyYear;
  const txsPrev=S.txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===prevM&&d.getFullYear()===prevY;});
  const prevIncome=txsPrev.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const prevExpense=txsPrev.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const prevInvest=txsPrev.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);

  function diffBadge(cur,prev){
    if(prev===0) return '';
    const pct=Math.round((cur-prev)/prev*100);
    const up=pct>=0;
    return `<span style="font-size:10px;font-weight:600;color:${up?'var(--gr)':'var(--rd)'};margin-left:4px">${up?'↑':'↓'}${Math.abs(pct)}%</span>`;
  }

  // ── Cards de resumen (2x2) ──
  const balColor=balance>=0?'var(--gr)':'var(--rd)';
  const balBg=balance>=0?'var(--gd)':'var(--rdd)';
  const balBorder=balance>=0?'rgba(52,212,138,.2)':'rgba(240,86,106,.2)';
  const sum=document.createElement('div');
  sum.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
    <div style="background:var(--rdd);border:1px solid rgba(240,86,106,.2);border-radius:14px;padding:13px 12px">
      <div style="font-size:10px;color:var(--rd);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Gastos</div>
      <div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:var(--rd)">${s}${fmt(expense)}${diffBadge(expense,prevExpense)}</div>
    </div>
    <div style="background:var(--gd);border:1px solid rgba(52,212,138,.2);border-radius:14px;padding:13px 12px">
      <div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Ingresos</div>
      <div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:var(--gr)">${s}${fmt(income)}${diffBadge(income,prevIncome)}</div>
    </div>
    <div style="background:${balBg};border:1px solid ${balBorder};border-radius:14px;padding:13px 12px">
      <div style="font-size:10px;color:${balColor};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Balance neto</div>
      <div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:${balColor}">${balance>=0?'+':''}${s}${fmt(Math.abs(balance))}</div>
    </div>
    <div style="background:var(--amd);border:1px solid rgba(245,166,35,.2);border-radius:14px;padding:13px 12px">
      <div style="font-size:10px;color:var(--am);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Inversiones</div>
      <div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:var(--am)">${s}${fmt(invest)}${diffBadge(invest,prevInvest)}</div>
    </div>
  </div>`;
  scroll.appendChild(sum);

  if(expense>0){
    // ── Donut + leyenda ──
    const groups2={};
    txs.filter(t=>t.type==='expense').forEach(t=>{const k=t.cat||'Sin cat';groups2[k]=(groups2[k]||0)+t.amount;});
    const entries=Object.entries(groups2).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const total2=entries.reduce((a,[,v])=>a+v,0);
    const colors=['#6B8CFF','#34D48A','#F0566A','#FBBF24','#A78BFA','#60A5FA'];

    let svgPaths=''; let offDeg=0;
    const r=52,cx=60,cy=60,hole=34;
    entries.forEach(([,amt],i)=>{
      const angle=amt/total2*360;
      if(angle<0.5){offDeg+=angle;return;}
      const s1=offDeg*Math.PI/180, e1=(offDeg+angle)*Math.PI/180;
      const x1=cx+r*Math.cos(s1-Math.PI/2), y1=cy+r*Math.sin(s1-Math.PI/2);
      const x2=cx+r*Math.cos(e1-Math.PI/2), y2=cy+r*Math.sin(e1-Math.PI/2);
      svgPaths+=`<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${angle>180?1:0} 1 ${x2} ${y2}Z" fill="${colors[i]}" opacity=".92"/>`;
      offDeg+=angle;
    });
    svgPaths+=`<circle cx="${cx}" cy="${cy}" r="${hole}" fill="var(--bg)"/>`;
    svgPaths+=`<text x="${cx}" y="${cy-5}" text-anchor="middle" fill="var(--mu)" font-size="9" font-family="DM Sans">Gastos</text>`;
    svgPaths+=`<text x="${cx}" y="${cy+9}" text-anchor="middle" fill="var(--tx)" font-size="11" font-weight="600" font-family="DM Mono">${sym()}${fmt(expense)}</text>`;

    let legend='<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px">';
    entries.forEach(([cat,amt],i)=>{
      const pct=Math.round(amt/total2*100);
      const cd=findCat('expense',cat);
      legend+=`<div style="display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:50%;background:${colors[i]};flex-shrink:0"></div>
        <div style="flex:1;font-size:11px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cd?cd.e+' ':''}${cat}</div>
        <div style="font-size:11px;font-weight:600;color:var(--tx);font-family:'DM Mono',monospace">${s}${fmt(amt)}</div>
        <div style="font-size:10px;color:var(--mu);width:26px;text-align:right">${pct}%</div>
      </div>`;
    });
    legend+='</div>';

    const donutWrap=document.createElement('div');
    donutWrap.style.cssText='background:var(--s1);border:1px solid var(--br);border-radius:16px;padding:16px;display:flex;align-items:center;gap:16px;margin-bottom:12px';
    donutWrap.innerHTML=`<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0">${svgPaths}</svg>${legend}`;
    scroll.appendChild(donutWrap);

    // ── Categoría estrella ──
    const topCat=entries[0];
    if(topCat){
      const cd=findCat('expense',topCat[0]);
      const starDiv=document.createElement('div');
      starDiv.style.cssText='background:var(--amd);border:1px solid rgba(245,166,35,.25);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:12px';
      starDiv.innerHTML=`
        <div style="font-size:28px">${cd?cd.e:'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--am);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">⭐ Mayor gasto del mes</div>
          <div style="font-size:14px;font-weight:600">${topCat[0]}</div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:700;color:var(--rd)">${s}${fmt(topCat[1])}</div>`;
      scroll.appendChild(starDiv);
    }

    // ── Top 3 gastos individuales ──
    const top3=txs.filter(t=>t.type==='expense').sort((a,b)=>b.amount-a.amount).slice(0,3);
    if(top3.length){
      const t3hdr=document.createElement('div'); t3hdr.className='sec-hdr'; t3hdr.style.marginBottom='8px';
      t3hdr.innerHTML='<span class="sec-ttl">Top 3 gastos</span>';
      scroll.appendChild(t3hdr);
      top3.forEach((tx,i)=>{
        const cat=findCat('expense',tx.cat);
        const row=document.createElement('div');
        row.style.cssText='background:var(--s1);border:1px solid var(--br);border-radius:13px;padding:11px 14px;display:flex;align-items:center;gap:10px;margin-bottom:7px';
        row.innerHTML=`
          <div style="width:28px;height:28px;border-radius:8px;background:var(--rdd);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${cat?cat.e:'💸'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tx.note||tx.cat||'Sin descripción'}</div>
            <div style="font-size:11px;color:var(--mu);margin-top:1px">${tx.cat||''}</div>
          </div>
          <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--rd);flex-shrink:0">${s}${fmt(tx.amount)}</div>`;
        scroll.appendChild(row);
      });
    }

    // ── Gastos por categoría con barra de progreso ──
    const catHdr=document.createElement('div'); catHdr.className='sec-hdr'; catHdr.style.marginBottom='8px';
    catHdr.innerHTML='<span class="sec-ttl">Por categoría</span>';
    scroll.appendChild(catHdr);
    const groups={};
    txs.filter(t=>t.type==='expense').forEach(t=>{const k=t.cat||'Sin categoría';groups[k]=(groups[k]||0)+t.amount;});
    Object.entries(groups).sort((a,b)=>b[1]-a[1]).forEach(([catName,total])=>{
      const cat=findCat('expense',catName);
      const pct=Math.round(total/expense*100);
      const row=document.createElement('div');
      row.style.cssText='background:var(--s1);border:1px solid var(--br);border-radius:13px;padding:12px 14px;display:flex;align-items:center;gap:11px;cursor:pointer;margin-bottom:7px;transition:background .14s';
      row.innerHTML=`
        <div style="width:36px;height:36px;border-radius:10px;background:${(cat&&cat.c)||'#94a3b8'}20;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${(cat&&cat.e)||'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;margin-bottom:5px">${catName}</div>
          <div style="height:3px;background:var(--s3);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${(cat&&cat.c)||'#94a3b8'};border-radius:2px;transition:width .4s"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:600;font-family:'DM Mono',monospace;color:var(--rd)">${s}${fmt(total)}</div>
          <div style="font-size:10px;color:var(--mu);margin-top:1px">${pct}%</div>
        </div>`;
      row.onmouseover=()=>row.style.background='var(--s2)';
      row.onmouseout=()=>row.style.background='var(--s1)';
      row.onclick=()=>openCatHistory('expense',catName,monthlyMonth,monthlyYear);
      scroll.appendChild(row);
    });
  }

  // ── Racha de ahorro ──
  if(txs.length>0){
    const rachaDiv=document.createElement('div');
    const positivo=balance>=0;
    rachaDiv.style.cssText=`background:${positivo?'var(--gd)':'var(--rdd)'};border:1px solid ${positivo?'rgba(52,212,138,.2)':'rgba(240,86,106,.2)'};border-radius:14px;padding:14px 16px;margin-top:4px;margin-bottom:12px;display:flex;align-items:center;gap:12px`;
    const msg=positivo
      ? ['🏆','¡Excelente mes! Ahorraste '+s+fmt(balance)+'. Seguí así.']
      : ['💡','Gastaste '+s+fmt(Math.abs(balance))+' más de lo que ingresaste. ¿Podés reducir algún gasto?'];
    rachaDiv.innerHTML=`<div style="font-size:26px">${msg[0]}</div><div style="font-size:13px;color:${positivo?'var(--gr)':'var(--rd)'};line-height:1.5">${msg[1]}</div>`;
    scroll.appendChild(rachaDiv);
  }

  if(txs.length===0) scroll.innerHTML='<div class="empty-state"><span class="big">📅</span>Sin movimientos en este mes.</div>';
}

function openCatHistory(type,catName,month,year){
  const cat=findCat(type,catName);
  document.getElementById('cat-history-title').textContent=(cat?cat.e:'')+' '+catName;
  const txs=S.txs.filter(t=>{const d=new Date(t.date);return t.type===type&&t.cat===catName&&d.getMonth()===month&&d.getFullYear()===year;}).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const total=txs.reduce((a,t)=>a+t.amount,0);
  document.getElementById('cat-history-stats').innerHTML=`
    <div style="background:var(--s1);border:1px solid var(--br);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:var(--mu);margin-bottom:4px">${MNAMES[month]} ${year} · ${txs.length} mov.</div>
        <div style="font-size:24px;font-weight:500;font-family:'DM Mono',monospace;color:${type==='income'?'var(--gr)':'var(--rd)'}">${type==='income'?'+':'-'}${sym()}${fmt(total)}</div>
      </div>
      <div style="font-size:40px">${(cat&&cat.e)||'📦'}</div>
    </div>`;
  const list=document.getElementById('cat-history-list'); list.innerHTML='';
  if(txs.length===0){ list.innerHTML='<div class="empty-state"><span class="big">🔍</span>Sin movimientos.</div>'; }
  else { txs.forEach(tx=>list.appendChild(buildTxItem(tx))); }
  goTo('s-cat-history');
}

// ═══════════════════════════════════════════
// HIDE NUMBERS
// ═══════════════════════════════════════════
function toggleHide(){ S.hidden=!S.hidden; saveState(); applyHide(S.hidden); }

function applyHide(hide){
  const ico=document.getElementById('hide-ico');
  ico.innerHTML=hide
    ?'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    :'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  if(hide){
    const ids=['h-bal','h-inc','h-exp','h-net','h-invest','cs-inc','cs-exp','cs-net','c-net','inv-total','inv-total2'];
    ids.forEach(id=>{ const el=document.getElementById(id); if(!el) return; if(!el.dataset.real) el.dataset.real=el.textContent; el.textContent=MASK; });
  } else {
    const ids=['h-bal','h-inc','h-exp','h-net','h-invest','cs-inc','cs-exp','cs-net','c-net','inv-total','inv-total2'];
    ids.forEach(id=>{ const el=document.getElementById(id); if(!el) return; delete el.dataset.real; });
    refreshHome();
    if(curScreen==='s-invest') renderInvest();
  }
}

// ═══════════════════════════════════════════
// CURRENCY
// ═══════════════════════════════════════════
function renderCurrList(list){
  const el=document.getElementById('curr-list'); el.innerHTML='';
  list.forEach(c=>{
    const it=document.createElement('div'); it.className='curr-item'+(c.code===S.currency.code?' sel':'');
    it.innerHTML=`<div class="curr-flag">${c.flag}</div><div class="curr-info"><div class="curr-name">${c.name}</div><div class="curr-code">${c.code} · ${c.sym}</div></div>${c.code===S.currency.code?'<div class="curr-check">✓</div>':''}`;
    it.onclick=()=>{ S.currency=c; saveState(); updateCurrUI(); closeCurrModal(); refreshHome(); showToast(c.flag+' '+c.code); };
    el.appendChild(it);
  });
}
function updateCurrUI(){
  document.getElementById('curr-val').textContent=S.currency.flag+' '+S.currency.code;
  document.getElementById('curr-sub').textContent=S.currency.name+' · '+S.currency.code;
  document.getElementById('h-sym').textContent=S.currency.sym;
  document.getElementById('add-curr-lbl').textContent=S.currency.code;
  const is=document.getElementById('inv-sym'); if(is) is.textContent=S.currency.sym;
}
function openCurrModal(){ renderCurrList(CURRENCIES); document.getElementById('curr-search').value=''; document.getElementById('curr-modal').classList.remove('hidden'); }
function closeCurrModal(){ document.getElementById('curr-modal').classList.add('hidden'); }
function filterCurr(q){ renderCurrList(CURRENCIES.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.code.toLowerCase().includes(q.toLowerCase()))); }

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function toggleComma(row){
  const tog=row.querySelector('.toggle'); tog.classList.toggle('on');
  S.useComma=tog.classList.contains('on'); saveState();
  document.getElementById('dec-key').textContent=getSep();
  document.getElementById('comma-sub').textContent=S.useComma?'Activo: 1.250,50':'Activo: 1,250.50';
  showToast(S.useComma?'Decimal: coma (,)':'Decimal: punto (.)');
}
function toggleThousands(row){
  const tog=row.querySelector('.toggle'); tog.classList.toggle('on');
  S.useThousands=tog.classList.contains('on'); saveState();
  showToast(S.useThousands?'Separador de miles activado':'Separador de miles desactivado');
}
function toggleBudgetAlerts(row){
  const tog=row.querySelector('.toggle'); tog.classList.toggle('on');
  S.budgetAlerts=tog.classList.contains('on'); saveState();
  showToast(S.budgetAlerts?'Alertas de presupuesto activadas':'Alertas desactivadas');
}
function toggleHideOnStart(row){
  const tog=row.querySelector('.toggle'); tog.classList.toggle('on');
  S.hidden=tog.classList.contains('on'); saveState();
  showToast(S.hidden?'Balance oculto al abrir':'Balance visible al abrir');
}
function applyDarkMode(dark){
  if(dark) document.body.classList.remove('light');
  else document.body.classList.add('light');
}
function toggleDarkMode(row){
  const tog=row.querySelector('.toggle'); tog.classList.toggle('on');
  S.darkMode=tog.classList.contains('on'); saveState();
  applyDarkMode(S.darkMode);
}

const LANGS = [
  {code:'es', label:'Español', flag:'🇦🇷'},
  {code:'en', label:'English', flag:'🇺🇸'},
];

function setLang(lang){
  S.lang=lang; saveState();
  updateLangUI();
  closeLangModal();
  showToast(lang==='es'?'Idioma: Español 🇦🇷':'Language: English 🇺🇸');
}

const T = {
  es:{
    // Home
    balLbl:'Balance disponible', incomeLabel:'Ingresos', expenseLabel:'Gastos', netLabel:'Neto',
    investedLabel:'Invertido', lastMov:'Últimos movimientos', seeAll:'Ver todos →',
    thisWeek:'Semana', thisMonth:'Mes', thisYear:'Año', all:'Todo',
    // Legacy keys (kept for compatibility)
    income:'Ingresos', expense:'Gastos', net:'Neto', invested:'Invertido',
    // Add TX
    newTx:'Nueva transacción', saveBtn:'Guardar', cancelBtn:'Cancelar',
    typeExpense:'Gasto', typeIncome:'Ingreso', typeInvest:'Inversión',
    descPlaceholder:'Descripción (opcional)', notePlaceholder:'Nota (opcional)',
    freqCats:'Categorías frecuentes', allCatsExpense:'Categorías de gasto',
    allCatsIncome:'Categorías de ingreso', allCatsInvest:'Categorías de inversión',
    tapAmount:'Tocá para ingresar el monto', today:'Hoy', done:'Listo',
    // Edit TX
    editTx:'Editar movimiento', saveChanges:'Guardar cambios',
    // All TX
    allTx:'Todos los movimientos', allTxSearch:'Buscar por descripción...',
    chipAll:'Todos', chipExpense:'Gastos', chipIncome:'Ingresos', chipInvest:'Inversiones',
    // Invest
    invest:'Inversiones', totalInvested:'Total invertido', capital:'Capital',
    records:'Registros', myRecords:'Mis registros', addRecord:'+ Agregar →',
    // Budgets
    budgets:'Presupuestos', budgetsDesc:'Establecé límites de gasto por categoría. Te avisamos al llegar al 80%.',
    // Goals
    goals:'Metas de ahorro', goalsDesc:'Fijate cuánto falta para cada objetivo. Aboná manualmente tu progreso.',
    // Recurring
    recurring:'Recurrentes', recurringDesc:'Alquiler, suscripciones, sueldos. Se registran automáticamente el día que corresponde.',
    // Categories
    cats:'Categorías', catsDesc:'Tocá para editar. + para crear nueva.',
    catsExpense:'GASTOS', catsIncome:'INGRESOS', catsInvest:'INVERSIONES',
    category:'Categoría',
    // Monthly
    monthly:'Resumen mensual',
    // Profile
    profile:'Perfil',
    // Settings
    settings:'Ajustes', back:'Volver',
    secAccess:'Accesos', secFinance:'Finanzas', secLanguage:'Idioma',
    secCurrency:'Moneda', secNumbers:'Números', secData:'Datos',
    secGeneral:'General', secAppearance:'Apariencia', secDanger:'Zona de peligro',
    rBudgets:'Presupuestos', rBudgetsSub:'Límites por categoría',
    rGoals:'Metas de ahorro', rGoalsSub:'Objetivos y progreso',
    rRecurring:'Recurrentes', rRecurringSub:'Gastos e ingresos automáticos',
    rMonthly:'Resumen mensual', rMonthlySub:'Gastos por categoría',
    rLang:'Idioma de la app', rCurrency:'Moneda principal',
    rDecimal:'Coma decimal', rThousands:'Separador de miles', rThousandsSub:'Ej: 1.250 vs 1250',
    rData:'Gestionar datos', rDataSub:'Exportar e importar historial',
    rBudgetAlerts:'Alertas de presupuesto', rBudgetAlertsSub:'Avisa al 80% y 100% del límite',
    rHideBalance:'Ocultar balance al abrir', rHideBalanceSub:'El balance aparece tapado',
    rDarkMode:'Modo oscuro', rAccent:'Color de acento',
    rClearAll:'Borrar todos los datos',
    // Data screen
    data:'Gestionar datos', exportTab:'Exportar', importTab:'Importar',
    // Split
    splitExpTitle:'Nuevo gasto', splitDescPh:'¿En qué gastaron? (opcional)',
    splitNotePh:'Nota opcional', splitPaid:'Pagó', splitDivide:'Dividir',
    splitToPersonal:'Agregar a mis finanzas', splitCatRequired:'Categoría *',
    splitGroups:'Grupos', splitDebts:'Mis deudas', splitActivity:'Actividad',
    newGroup:'Nuevo grupo', splitSettings:'Ajustes de Split',
    expDetail:'Detalle del gasto',
    grpExpenses:'Gastos', grpDebts:'Deudas', grpStats:'Stats',
    // Legacy
    saveExpense:'Guardar gasto', saveIncome:'Guardar ingreso', saveInvest:'Guardar inversión',
    investments:'Inversiones', categories:'Categorías',
  },
  en:{
    // Home
    balLbl:'Available balance', incomeLabel:'Income', expenseLabel:'Expenses', netLabel:'Net',
    investedLabel:'Invested', lastMov:'Latest movements', seeAll:'See all →',
    thisWeek:'Week', thisMonth:'Month', thisYear:'Year', all:'All',
    // Legacy keys (kept for compatibility)
    income:'Income', expense:'Expenses', net:'Net', invested:'Invested',
    // Add TX
    newTx:'New transaction', saveBtn:'Save', cancelBtn:'Cancel',
    typeExpense:'Expense', typeIncome:'Income', typeInvest:'Investment',
    descPlaceholder:'Description (optional)', notePlaceholder:'Note (optional)',
    freqCats:'Frequent categories', allCatsExpense:'Expense categories',
    allCatsIncome:'Income categories', allCatsInvest:'Investment categories',
    tapAmount:'Tap to enter amount', today:'Today', done:'Done',
    // Edit TX
    editTx:'Edit transaction', saveChanges:'Save changes',
    // All TX
    allTx:'All transactions', allTxSearch:'Search transactions...',
    chipAll:'All', chipExpense:'Expenses', chipIncome:'Income', chipInvest:'Investments',
    // Invest
    invest:'Investments', totalInvested:'Total invested', capital:'Capital',
    records:'Records', myRecords:'My records', addRecord:'+ Add →',
    // Budgets
    budgets:'Budgets', budgetsDesc:'Set spending limits by category. We alert you at 80%.',
    // Goals
    goals:'Savings goals', goalsDesc:'Track how much is left for each goal. Update your progress manually.',
    // Recurring
    recurring:'Recurring', recurringDesc:'Rent, subscriptions, salaries. Recorded automatically on the due day.',
    // Categories
    cats:'Categories', catsDesc:'Tap to edit. + to create new.',
    catsExpense:'EXPENSES', catsIncome:'INCOME', catsInvest:'INVESTMENTS',
    category:'Category',
    // Monthly
    monthly:'Monthly summary',
    // Profile
    profile:'Profile',
    // Settings
    settings:'Settings', back:'Back',
    secAccess:'Quick access', secFinance:'Finance', secLanguage:'Language',
    secCurrency:'Currency', secNumbers:'Numbers', secData:'Data',
    secGeneral:'General', secAppearance:'Appearance', secDanger:'Danger zone',
    rBudgets:'Budgets', rBudgetsSub:'Limits by category',
    rGoals:'Savings goals', rGoalsSub:'Goals and progress',
    rRecurring:'Recurring', rRecurringSub:'Automatic expenses and income',
    rMonthly:'Monthly summary', rMonthlySub:'Expenses by category',
    rLang:'App language', rCurrency:'Main currency',
    rDecimal:'Decimal comma', rThousands:'Thousands separator', rThousandsSub:'E.g.: 1,250 vs 1250',
    rData:'Manage data', rDataSub:'Export and import history',
    rBudgetAlerts:'Budget alerts', rBudgetAlertsSub:'Alerts at 80% and 100% of limit',
    rHideBalance:'Hide balance on open', rHideBalanceSub:'Balance appears hidden',
    rDarkMode:'Dark mode', rAccent:'Accent color',
    rClearAll:'Delete all data',
    // Data screen
    data:'Manage data', exportTab:'Export', importTab:'Import',
    // Split
    splitExpTitle:'New expense', splitDescPh:'What was it for? (optional)',
    splitNotePh:'Optional note', splitPaid:'Paid by', splitDivide:'Split',
    splitToPersonal:'Add to my finances', splitCatRequired:'Category *',
    splitGroups:'Groups', splitDebts:'My debts', splitActivity:'Activity',
    newGroup:'New group', splitSettings:'Split settings',
    expDetail:'Expense detail',
    grpExpenses:'Expenses', grpDebts:'Debts', grpStats:'Stats',
    // Legacy
    saveExpense:'Save expense', saveIncome:'Save income', saveInvest:'Save investment',
    investments:'Investments', categories:'Categories',
  }
};

function t(key){ return (T[S.lang]||T.es)[key]||key; }

function updateLangUI(){
  const lang = LANGS.find(l=>l.code===S.lang) || LANGS[0];
  // 1. Apply all data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.dataset.i18n;
    const val=t(key);
    if(val!==key) el.textContent=val;
  });
  // 2. Apply all data-i18n-ph (placeholders)
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key=el.dataset.i18nPh;
    const val=t(key);
    if(val!==key) el.placeholder=val;
  });
  // 3. Special elements: lang-sub, lang-val
  const lsub=document.getElementById('lang-sub');
  if(lsub) lsub.textContent=lang.label+' '+lang.flag;
  const lval=document.getElementById('lang-val');
  if(lval) lval.textContent=lang.flag+' '+lang.code.toUpperCase();
  // 4. Type buttons in s-add (btn-e, btn-i, btn-v) — text nodes only
  const bte=document.getElementById('btn-e');
  if(bte) bte.textContent=t('typeExpense');
  const bti=document.getElementById('btn-i');
  if(bti) bti.textContent=t('typeIncome');
  const btv=document.getElementById('btn-v');
  if(btv) btv.textContent=t('typeInvest');
  // 5. Accent dots re-render (text-free, no action needed)
  // 6. Category label in add screen based on current type
  const acl=document.getElementById('tx-all-cats-label');
  if(acl){
    const type=typeof txType!=='undefined'?txType:'expense';
    if(type==='income') acl.textContent=t('allCatsIncome');
    else if(type==='invest') acl.textContent=t('allCatsInvest');
    else acl.textContent=t('allCatsExpense');
  }
}

function openLangModal(){
  const list = document.getElementById('lang-list');
  list.innerHTML = '';
  LANGS.forEach(l=>{
    const it = document.createElement('div');
    it.className = 'curr-item'+(l.code===S.lang?' sel':'');
    it.innerHTML = `<div class="curr-flag">${l.flag}</div>
      <div class="curr-info"><div class="curr-name">${l.label}</div><div class="curr-code">${l.code.toUpperCase()}</div></div>
      ${l.code===S.lang?'<div class="curr-check">✓</div>':''}`;
    it.onclick = ()=>setLang(l.code);
    list.appendChild(it);
  });
  document.getElementById('lang-modal').classList.remove('hidden');
}

function closeLangModal(){
  document.getElementById('lang-modal').classList.add('hidden');
}

function renderAccentDots(){
  const el=document.getElementById('accent-dots'); el.innerHTML='';
  ACCENTS.forEach(col=>{
    const d=document.createElement('div'); d.className='ac-dot'+(col===S.accent?' sel':'');
    d.style.background=col;
    d.onclick=()=>{ S.accent=col; saveState(); document.documentElement.style.setProperty('--gr',col); renderAccentDots(); };
    el.appendChild(d);
  });
}

// ═══════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════
function exportCSV(){
  const rows=[['id','tipo','monto','categoria','nota','fecha']];
  S.txs.forEach(t=>rows.push([t.id,t.type,t.amount,t.cat||'',t.note||'',t.date]));
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  download('cashwise-historial.csv','data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv));
  showToast('📥 CSV exportado');
}

function parseCSVLine(line){
  const res=[]; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){ if(inQ&&line[i+1]==='"'){cur+='"';i++;} else inQ=!inQ; }
    else if(ch===','&&!inQ){ res.push(cur); cur=''; }
    else cur+=ch;
  }
  res.push(cur); return res;
}

function importData(){ document.getElementById('import-csv-inp').click(); }
function handleImportCSV(inp){
  const file=inp.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const lines=e.target.result.trim().split('\n').slice(1);
    let count=0;
    lines.forEach(line=>{
      if(!line.trim()) return;
      const cols=parseCSVLine(line);
      if(cols.length>=6){
        const [id,type,amount,cat,note,date]=cols;
        if(!['income','expense','invest'].includes(type)) return;
        if(!S.txs.find(t=>t.id===id)){
          S.txs.push({id:id||uid(),type,amount:parseFloat(amount)||0,cat:cat||'',note:note||'',date:date||new Date().toISOString()});
          count++;
        }
      }
    });
    saveState(); refreshHome();
    showToast(count>0?`✅ ${count} movimientos importados`:'⚠️ Sin datos nuevos');
  };
  reader.readAsText(file); inp.value='';
}

function exportJSON(){
  download('cashwise-backup.json','data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(S,null,2)));
  showToast('📦 Backup exportado');
}
function importJSON(){ document.getElementById('import-json-inp').click(); }
function handleImportJSON(inp){
  const file=inp.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      showConfirm('Restaurar backup','Esto reemplazará todos tus datos actuales.',()=>{
        Object.assign(S,data);
        if(!Array.isArray(S.txs)) S.txs=[];
        if(!Array.isArray(S.budgets)) S.budgets=[];
        if(!Array.isArray(S.goals)) S.goals=[];
        if(!Array.isArray(S.recurring)) S.recurring=[];
        saveState(); updateCurrUI(); refreshHome();
        showToast('✅ Backup restaurado');
      });
    }catch(_e){ showToast('❌ Archivo inválido'); }
  };
  reader.readAsText(file); inp.value='';
}

function download(filename,dataUrl){
  const a=document.createElement('a'); a.href=dataUrl; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ═══════════════════════════════════════════
// LOAD SCRIPT HELPER
// ═══════════════════════════════════════════
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector('script[src="'+src+'"]')){ res(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
}

// ═══════════════════════════════════════════
// DATA SCREEN — TABS
// ═══════════════════════════════════════════
function switchDataTab(tab){
  document.getElementById('data-tab-exp').classList.toggle('active', tab==='export');
  document.getElementById('data-tab-imp').classList.toggle('active', tab==='import');
  document.getElementById('data-pane-export').style.display = tab==='export'?'':'none';
  document.getElementById('data-pane-import').style.display = tab==='import'?'':'none';
}

// ═══════════════════════════════════════════
// EXPORT — CSV (mejorado)
// ═══════════════════════════════════════════
function exportCSVNew(){
  if(!S.txs.length){ showToast('⚠️ Sin movimientos para exportar'); return; }
  const rows=[['Fecha','Tipo','Monto','Categoría','Nota']];
  const typeLabel={'income':'Ingreso','expense':'Gasto','invest':'Inversión'};
  S.txs.forEach(t=>{
    const d=new Date(t.date);
    const fecha=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
    rows.push([fecha, typeLabel[t.type]||t.type, t.amount, t.cat||'', t.note||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  download('cashwise-historial.csv','data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv));
  showToast('📥 CSV exportado');
}

// ═══════════════════════════════════════════
// EXPORT — XLSX
// ═══════════════════════════════════════════
async function exportXLSX(){
  if(!S.txs.length){ showToast('⚠️ Sin movimientos para exportar'); return; }
  showToast('⏳ Generando Excel...');
  try{
    await loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
    const XLSX=window.XLSX;
    // Hoja 1: Historial
    const typeLabel={'income':'Ingreso','expense':'Gasto','invest':'Inversión'};
    const histRows=[['Fecha','Tipo','Monto','Categoría','Nota']];
    S.txs.forEach(t=>{
      const d=new Date(t.date);
      const fecha=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
      histRows.push([fecha, typeLabel[t.type]||t.type, t.amount, t.cat||'', t.note||'']);
    });
    const ws1=XLSX.utils.aoa_to_sheet(histRows);
    // Hoja 2: Resumen
    const totIncome=S.txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
    const totExpense=S.txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
    const totInvest=S.txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
    const catMap={};
    S.txs.forEach(t=>{ if(!catMap[t.cat]) catMap[t.cat]=0; catMap[t.cat]+=t.amount; });
    const topCats=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const resRows=[['Resumen',''],[],['Tipo','Total'],['Ingresos',totIncome],['Gastos',totExpense],['Inversiones',totInvest],[],['Top categorías',''],['Categoría','Monto']];
    topCats.forEach(([cat,amt])=>resRows.push([cat,amt]));
    const ws2=XLSX.utils.aoa_to_sheet(resRows);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,'Historial',ws1);
    XLSX.utils.book_append_sheet(wb,'Resumen',ws2);
    XLSX.writeFile(wb,'cashwise-historial.xlsx');
    showToast('📊 Excel exportado');
  }catch(e){ showToast('❌ Error al generar Excel'); console.error(e); }
}

// ═══════════════════════════════════════════
// EXPORT — PDF
// ═══════════════════════════════════════════
async function exportPDF(){
  if(!S.txs.length){ showToast('⚠️ Sin movimientos para exportar'); return; }
  showToast('⏳ Generando PDF...');
  try{
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    // Header
    doc.setFontSize(22); doc.setTextColor(52,212,138);
    doc.text('fin\xB7flow',14,18);
    doc.setFontSize(10); doc.setTextColor(120,120,160);
    const now=new Date();
    doc.text('Historial exportado '+now.toLocaleDateString('es-AR'),14,25);
    // Totales
    const totIncome=S.txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
    const totExpense=S.txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
    const totInvest=S.txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
    doc.setFontSize(9); doc.setTextColor(60,60,80);
    doc.text('Ingresos: '+sym()+fmt(totIncome)+'   Gastos: '+sym()+fmt(totExpense)+'   Inversiones: '+sym()+fmt(totInvest),14,32);
    // Tabla
    const typeLabel={'income':'Ingreso','expense':'Gasto','invest':'Inversión'};
    const rows=S.txs.map(t=>{
      const d=new Date(t.date);
      return [d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(), typeLabel[t.type]||t.type, sym()+fmt(t.amount), t.cat||'', t.note||''];
    });
    doc.autoTable({
      startY:37,
      head:[['Fecha','Tipo','Monto','Categoría','Nota']],
      body:rows,
      styles:{fontSize:8,cellPadding:2.5,textColor:[240,240,248],fillColor:[26,26,34]},
      headStyles:{fillColor:[52,212,138],textColor:[15,15,19],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[22,22,30]},
      didParseCell:function(data){
        if(data.section==='body'&&data.column.index===1){
          const v=data.cell.raw;
          if(v==='Ingreso') data.cell.styles.textColor=[52,212,138];
          else if(v==='Gasto') data.cell.styles.textColor=[240,86,106];
          else if(v==='Inversión') data.cell.styles.textColor=[245,166,35];
        }
      }
    });
    doc.save('cashwise-historial.pdf');
    showToast('📑 PDF exportado');
  }catch(e){ showToast('❌ Error al generar PDF'); console.error(e); }
}

// ═══════════════════════════════════════════
// EXPORT — SANKEY SVG
// ═══════════════════════════════════════════
let _sankeySVGContent='';
function exportSankey(){
  if(!S.txs.length){ showToast('⚠️ Sin movimientos para exportar'); return; }
  const svg=buildSankeySVG();
  _sankeySVGContent=svg;
  const wrap=document.getElementById('sankey-preview-wrap');
  const previewEl=document.getElementById('sankey-preview-svg');
  previewEl.innerHTML=svg;
  wrap.style.display='';
  wrap.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function downloadSankeyNow(){
  if(!_sankeySVGContent) return;
  download('cashwise-sankey.svg','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(_sankeySVGContent));
  showToast('🌊 Sankey exportado');
}

function buildSankeySVG(){
  const W=700,H=420,PAD=16,NODE_W=140,NODE_H_MIN=28;
  const incomeMap={}, expenseMap={};
  S.txs.forEach(t=>{
    if(t.type==='income'){ incomeMap[t.cat||'Otro']=(incomeMap[t.cat||'Otro']||0)+t.amount; }
    if(t.type==='expense'){ expenseMap[t.cat||'Otro']=(expenseMap[t.cat||'Otro']||0)+t.amount; }
  });
  const incEntries=Object.entries(incomeMap).sort((a,b)=>b[1]-a[1]);
  const expEntries=Object.entries(expenseMap).sort((a,b)=>b[1]-a[1]);
  const totalIncome=incEntries.reduce((a,[,v])=>a+v,0)||1;
  const totalExpense=expEntries.reduce((a,[,v])=>a+v,0)||1;
  const USABLE_H=H-PAD*2;
  const CENTER_X=W/2;
  const CENTER_W=80;
  // Colors for categories (cycle through palette)
  const PALETTE=['#34d48a','#6b8cff','#f5a623','#b57bee','#f0566a','#38bdf8','#22c55e','#fb923c'];
  function nodeColor(i){ return PALETTE[i%PALETTE.length]; }
  // Build income nodes
  const incNodes=incEntries.map(([cat,amt],i)=>({cat,amt,pct:amt/totalIncome,color:nodeColor(i)}));
  const expNodes=expEntries.map(([cat,amt],i)=>({cat,amt,pct:amt/totalExpense,color:nodeColor(i+4)}));
  // Layout income nodes (left column)
  const LEFT_X=PAD;
  const RIGHT_X=W-PAD-NODE_W;
  function layoutNodes(nodes,totalH){
    const GAP=8;
    const totalGaps=(nodes.length-1)*GAP;
    const availH=totalH-totalGaps;
    let y=PAD;
    return nodes.map(n=>{
      const h=Math.max(NODE_H_MIN,Math.round(n.pct*availH));
      const node={...n,y,h};
      y+=h+GAP;
      return node;
    });
  }
  const incLaid=layoutNodes(incNodes,USABLE_H);
  const expLaid=layoutNodes(expNodes,USABLE_H);
  // Center node
  const centerH=Math.max(60,Math.round((totalIncome/(totalIncome+totalExpense))*USABLE_H));
  const centerY=(H-centerH)/2;
  // Build SVG
  let paths='', rects='', texts='';
  // Income links → center
  const centerInX=CENTER_X-CENTER_W/2;
  const centerOutX=CENTER_X+CENTER_W/2;
  let incOffsetAtCenter=centerY;
  incLaid.forEach(n=>{
    const lh=Math.round(n.pct*centerH);
    const x0=LEFT_X+NODE_W;
    const y0=n.y+n.h/2-lh/2;
    const x1=centerInX;
    const y1=incOffsetAtCenter;
    const mx=(x0+x1)/2;
    paths+=`<path d="M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1+lh} C${mx},${y1+lh} ${mx},${y0+lh} ${x0},${y0+lh} Z" fill="${n.color}" opacity="0.35"/>`;
    incOffsetAtCenter+=lh;
  });
  // Center → expense links
  let expOffsetAtCenter=centerY;
  expLaid.forEach(n=>{
    const lh=Math.round(n.pct*centerH);
    const x0=centerOutX;
    const y0=expOffsetAtCenter;
    const x1=RIGHT_X;
    const y1=n.y+n.h/2-lh/2;
    const mx=(x0+x1)/2;
    paths+=`<path d="M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1+lh} C${mx},${y1+lh} ${mx},${y0+lh} ${x0},${y0+lh} Z" fill="${n.color}" opacity="0.35"/>`;
    expOffsetAtCenter+=lh;
  });
  // Income rects + labels
  incLaid.forEach(n=>{
    rects+=`<rect x="${LEFT_X}" y="${n.y}" width="${NODE_W}" height="${n.h}" rx="6" fill="${n.color}" opacity="0.85"/>`;
    const fs=Math.min(12,Math.max(8,n.h-4));
    texts+=`<text x="${LEFT_X+NODE_W/2}" y="${n.y+n.h/2}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="#0f0f13" font-family="DM Sans,sans-serif" font-weight="600">${n.cat}</text>`;
    texts+=`<text x="${LEFT_X+NODE_W+4}" y="${n.y+n.h/2}" text-anchor="start" dominant-baseline="middle" font-size="9" fill="#7878a0" font-family="DM Mono,monospace">${fmt(n.amt)}</text>`;
  });
  // Center rect
  rects+=`<rect x="${CENTER_X-CENTER_W/2}" y="${centerY}" width="${CENTER_W}" height="${centerH}" rx="8" fill="#1a1a22"/>`;
  texts+=`<text x="${CENTER_X}" y="${centerY+centerH/2-8}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#f0f0f8" font-family="DM Sans,sans-serif" font-weight="600">Balance</text>`;
  const net=totalIncome-totalExpense;
  const netColor=net>=0?'#34d48a':'#f0566a';
  texts+=`<text x="${CENTER_X}" y="${centerY+centerH/2+8}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="${netColor}" font-family="DM Mono,monospace">${(net>=0?'+':'')+fmt(net)}</text>`;
  // Expense rects + labels
  expLaid.forEach(n=>{
    rects+=`<rect x="${RIGHT_X}" y="${n.y}" width="${NODE_W}" height="${n.h}" rx="6" fill="${n.color}" opacity="0.85"/>`;
    const fs=Math.min(12,Math.max(8,n.h-4));
    texts+=`<text x="${RIGHT_X+NODE_W/2}" y="${n.y+n.h/2}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="#0f0f13" font-family="DM Sans,sans-serif" font-weight="600">${n.cat}</text>`;
    texts+=`<text x="${RIGHT_X-4}" y="${n.y+n.h/2}" text-anchor="end" dominant-baseline="middle" font-size="9" fill="#7878a0" font-family="DM Mono,monospace">${fmt(n.amt)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#0f0f13;border-radius:16px">${paths}${rects}${texts}</svg>`;
}

// ═══════════════════════════════════════════
// IMPORT — data file handling
// ═══════════════════════════════════════════
let _pendingImportTxs=[];

function handleDataDrop(e){
  e.preventDefault();
  document.getElementById('data-drop-zone').classList.remove('dragover');
  const file=e.dataTransfer.files[0];
  if(file) processDataFile(file);
}
function handleDataFileSelect(inp){
  const file=inp.files[0];
  if(file) processDataFile(file);
  inp.value='';
}

function processDataFile(file){
  const name=file.name.toLowerCase();
  if(name.endsWith('.csv')){ parseImportCSV(file); }
  else if(name.endsWith('.xlsx')||name.endsWith('.xls')){ parseImportXLSX(file); }
  else if(name.endsWith('.pdf')){ parseImportPDF(file); }
  else { showToast('⚠️ Formato no soportado'); }
}

// ── CSV parsing with smart column detection ──
function parseImportCSV(file){
  const reader=new FileReader();
  reader.onload=e=>{ _pendingImportTxs=parseCSVImport(e.target.result); showImportPreview(); };
  reader.readAsText(file,'UTF-8');
}

function parseCSVImport(text){
  const lines=text.trim().split(/\r?\n/);
  if(!lines.length) return [];
  const headerLine=parseCSVLine(lines[0].toLowerCase());
  // Detect column indices
  const fIdx=headerLine.findIndex(h=>/fecha|date|d[íi]a|data/.test(h));
  const aIdx=headerLine.findIndex(h=>/monto|importe|amount|valor|d[eé]bito|cr[eé]dito|debit|credit/.test(h));
  const tIdx=headerLine.findIndex(h=>/^tipo$|^type$/.test(h));
  const cIdx=headerLine.findIndex(h=>/cat|categor/.test(h));
  const nIdx=headerLine.findIndex(h=>/nota|note|descripci[oó]n|description|concepto|detalle/.test(h));
  const txs=[];
  lines.slice(1).forEach(line=>{
    if(!line.trim()) return;
    const cols=parseCSVLine(line);
    const rawDate=fIdx>=0?cols[fIdx]:'';
    const rawAmt=aIdx>=0?cols[aIdx]:'';
    const rawType=tIdx>=0?cols[tIdx]:'';
    const rawCat=cIdx>=0?cols[cIdx]:'';
    const rawNote=nIdx>=0?cols[nIdx]:'';
    const amount=parseImportAmount(rawAmt);
    if(isNaN(amount)||amount===0) return;
    const date=normalizeImportDate(rawDate)||new Date().toISOString();
    let type=normalizeImportType(rawType);
    if(!type){ type=amount<0?'expense':'income'; }
    const finalAmt=Math.abs(amount);
    txs.push({id:uid(),type,amount:finalAmt,cat:rawCat.trim()||'Importado',note:rawNote.trim(),date});
  });
  return txs;
}

// ── XLSX parsing ──
async function parseImportXLSX(file){
  showToast('⏳ Procesando Excel...');
  try{
    await loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
    const XLSX=window.XLSX;
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_csv(ws);
    _pendingImportTxs=parseCSVImport(data);
    showImportPreview();
  }catch(e){ showToast('❌ Error al leer Excel'); console.error(e); }
}

// ── PDF parsing ──
async function parseImportPDF(file){
  showToast('⏳ Extrayendo texto del PDF...');
  try{
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const pdfjsLib=window.pdfjsLib||window['pdfjs-dist/build/pdf'];
    if(!pdfjsLib){ showToast('❌ No se pudo cargar PDF.js'); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:buf}).promise;
    let fullText='';
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);
      const tc=await page.getTextContent();
      fullText+=tc.items.map(it=>it.str).join(' ')+'\n';
    }
    _pendingImportTxs=parsePDFText(fullText);
    showImportPreview();
  }catch(e){ showToast('❌ Error al leer PDF'); console.error(e); }
}

function parsePDFText(text){
  const lines=text.split('\n');
  const dateRe=/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
  const amtRe=/[\$\€\£]?\s*([\d\.]+(?:[,\.]\d{2})?)/;
  const txs=[];
  lines.forEach(line=>{
    const dm=line.match(dateRe);
    const am=line.match(amtRe);
    if(dm&&am){
      const date=normalizeImportDate(dm[0])||new Date().toISOString();
      const amount=parseImportAmount(am[1]);
      if(!amount||isNaN(amount)) return;
      txs.push({id:uid(),type:'expense',amount:Math.abs(amount),cat:'Importado PDF',note:line.trim().slice(0,60),date});
    }
  });
  return txs;
}

// ── Helpers ──
function parseImportAmount(raw){
  if(!raw) return NaN;
  // Remove currency symbols and thousands separators, normalize decimal
  let s=String(raw).replace(/[^\d,.\-]/g,'').trim();
  // If both comma and dot: last one is decimal
  if(s.indexOf(',')>-1&&s.indexOf('.')>-1){
    const lastComma=s.lastIndexOf(',');
    const lastDot=s.lastIndexOf('.');
    if(lastComma>lastDot){ s=s.replace(/\./g,'').replace(',','.'); }
    else { s=s.replace(/,/g,''); }
  } else {
    s=s.replace(',','.');
  }
  return parseFloat(s);
}

function normalizeImportDate(raw){
  if(!raw) return null;
  // Try YYYY-MM-DD
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)){ const d=new Date(raw); if(!isNaN(d)) return d.toISOString(); }
  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const m1=raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if(m1){
    let [,d,mo,y]=m1;
    if(y.length===2) y='20'+y;
    const dt=new Date(+y,+mo-1,+d);
    if(!isNaN(dt)) return dt.toISOString();
  }
  // Try MM/DD/YYYY
  const m2=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m2){
    const [,mo,d,y]=m2;
    const dt=new Date(+y,+mo-1,+d);
    if(!isNaN(dt)) return dt.toISOString();
  }
  return null;
}

function normalizeImportType(raw){
  if(!raw) return null;
  const r=raw.trim().toLowerCase();
  if(/ingreso|income/.test(r)) return 'income';
  if(/gasto|expense|egreso/.test(r)) return 'expense';
  if(/inver/.test(r)) return 'invest';
  return null;
}

// ── Preview ──
function showImportPreview(){
  const preview=document.getElementById('import-preview');
  const title=document.getElementById('import-preview-title');
  const rows=document.getElementById('import-preview-rows');
  const btn=document.getElementById('confirm-import-btn');
  if(!_pendingImportTxs.length){ showToast('⚠️ No se detectaron movimientos'); return; }
  title.textContent=_pendingImportTxs.length+' movimientos detectados';
  btn.textContent='Confirmar importar '+_pendingImportTxs.length+' movimientos';
  const typeLabel={'income':'Ingreso','expense':'Gasto','invest':'Inversión'};
  const typeColor={'income':'var(--gr)','expense':'var(--rd)','invest':'var(--am)'};
  rows.innerHTML='';
  _pendingImportTxs.slice(0,5).forEach(t=>{
    const d=new Date(t.date);
    const fecha=d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
    const row=document.createElement('div');
    row.className='import-preview-row';
    row.innerHTML='<span style="flex:1;color:var(--mu)">'+fecha+'</span>'
      +'<span style="width:60px;color:'+typeColor[t.type]+';font-weight:600">'+typeLabel[t.type]+'</span>'
      +'<span style="width:80px;text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">'+sym()+fmt(t.amount)+'</span>'
      +'<span style="flex:1;color:var(--mu);padding-left:8px">'+t.cat+'</span>';
    rows.appendChild(row);
  });
  if(_pendingImportTxs.length>5){
    const more=document.createElement('div');
    more.style.cssText='font-size:11px;color:var(--mu);padding:6px 0;text-align:center';
    more.textContent='... y '+((_pendingImportTxs.length-5))+' más';
    rows.appendChild(more);
  }
  preview.style.display='';
}

function cancelImport(){
  _pendingImportTxs=[];
  document.getElementById('import-preview').style.display='none';
}

function confirmImport(){
  if(!_pendingImportTxs.length) return;
  let added=0;
  _pendingImportTxs.forEach(t=>{
    // Deduplicar por fecha+monto+nota
    const fp=t.date.slice(0,10)+'|'+t.amount+'|'+(t.note||'');
    const dup=S.txs.some(x=>x.date.slice(0,10)+'|'+x.amount+'|'+(x.note||'')===fp);
    if(!dup){ S.txs.push(t); added++; }
  });
  saveState(); refreshHome();
  document.getElementById('import-preview').style.display='none';
  _pendingImportTxs=[];
  showToast(added>0?'✅ '+added+' movimientos importados y sincronizados':'⚠️ Sin datos nuevos (ya existían)');
}

function clearAll(){
  showConfirm('Borrar todos los datos','Elimina TODAS las transacciones, presupuestos y metas. No se puede deshacer.',()=>{
    S.txs=[]; S.budgets=[]; S.goals=[]; S.recurring=[];
    saveState(); refreshHome(); showToast('🗑️ Datos eliminados');
  });
}

// ═══════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════


// ═══════════════════════════════════════════
// CONFIRM + TOAST
// ═══════════════════════════════════════════
let _confirmCb=null;
function showConfirm(title,msg,onOk){
  document.getElementById('conf-title').textContent=title;
  document.getElementById('conf-msg').textContent=msg;
  _confirmCb=onOk;
  document.getElementById('confirm-bg').classList.remove('hidden');
}
function closeConfirm(){ document.getElementById('confirm-bg').classList.add('hidden'); _confirmCb=null; }
document.getElementById('conf-ok').onclick=()=>{ if(_confirmCb)_confirmCb(); closeConfirm(); };

let _toastTimer=null;
function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>t.classList.remove('show'),2400);
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════

// ── detectPlatform ──
function detectPlatform(){
  const ua=navigator.userAgent.toLowerCase();
  if(/iphone|ipad|ipod/.test(ua)) S.platform='ios';
  else if(/android/.test(ua)) S.platform='android';
  else S.platform='web';
}

// ── renderProfile ──
function renderProfile(){
  // Stats
  const spent=S.txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const invest=S.txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
  const totalCats=Object.values(S.cats).reduce((a,arr)=>a+arr.length,0);
  const setEl=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  setEl('profile-tx-count', S.txs.length);
  setEl('profile-spent-total', sym()+fmt(spent));
  setEl('profile-cats', totalCats);
  // Fecha de primer movimiento
  if(S.txs.length){
    const oldest=new Date(Math.min(...S.txs.map(t=>new Date(t.date))));
    setEl('profile-since', oldest.toLocaleDateString('es-AR',{month:'short',year:'numeric'}));
  } else {
    setEl('profile-since','—');
  }
  // Auth state
  const user=_authUser;
  const linkedSec=document.getElementById('profile-linked-sec');
  const unlinkedSec=document.getElementById('profile-unlinked-sec');
  const accSec=document.getElementById('profile-account-sec');
  const nameEl=document.getElementById('profile-name');
  const emailEl=document.getElementById('profile-email');
  const avatarEl=document.getElementById('profile-avatar');
  if(user){
    // Logueado
    if(linkedSec) linkedSec.style.display='block';
    if(unlinkedSec) unlinkedSec.style.display='none';
    if(accSec) accSec.style.display='block';
    if(nameEl) nameEl.textContent=user.displayName||user.email.split('@')[0];
    if(emailEl) emailEl.textContent=user.email;
    if(user.photoURL&&avatarEl){
      avatarEl.innerHTML='<img src="'+user.photoURL+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.parentNode.textContent=String.fromCodePoint(128100)">';
    }
    const linkedName=document.getElementById('profile-linked-name');
    const linkedEmail=document.getElementById('profile-linked-email');
    if(linkedName) linkedName.textContent=user.displayName||user.email.split('@')[0];
    if(linkedEmail) linkedEmail.textContent=user.email;
    // Ocultar botones de vincular
    const gr=document.getElementById('google-row');
    const fr=document.getElementById('facebook-row');
    if(gr) gr.style.display='none';
    if(fr) fr.style.display='none';
    // Sección cuenta: sync info
    if(accSec){
      accSec.style.display='block';
      accSec.innerHTML='<div class="set-sec-ttl">Cuenta</div><div class="set-card">'
        +'<div class="set-row" style="cursor:default"><div><div class="set-lbl">Sincronización automática</div>'
        +'<div class="set-sub">'+(S.lastSync?'Última: '+new Date(S.lastSync).toLocaleString('es-AR',{timeStyle:'short',dateStyle:'short'}):'Activa ✅')+'</div></div>'
        +'<div style="font-size:18px">☁️</div></div>'
        +'<div class="set-row" onclick="forceSync()"><div><div class="set-lbl">Sincronizar ahora</div></div><div class="set-arr">↑</div></div>'
        +'<div class="set-row" onclick="authLogout()"><div><div class="set-lbl" style="color:var(--rd)">Cerrar sesión</div></div><div class="set-arr" style="color:var(--rd)">›</div></div>'
        +'</div>';
    }
  } else {
    // No logueado
    if(linkedSec) linkedSec.style.display='none';
    if(unlinkedSec) unlinkedSec.style.display='block';
    if(accSec) accSec.style.display='none';
    if(nameEl) nameEl.textContent=S.skipAuth?'Usando sin cuenta':'Sin sesión iniciada';
    if(emailEl) emailEl.textContent=S.skipAuth?'Datos guardados en este dispositivo':'';
    if(avatarEl) avatarEl.textContent='👤';
    const gr=document.getElementById('google-row');
    const fr=document.getElementById('facebook-row');
    if(gr){ gr.style.display='flex'; gr.onclick=()=>showAuthOverlay(); }
    if(fr) fr.style.display='none';
    const gs=document.getElementById('google-sub');
    if(gs) gs.textContent='Iniciar sesión para sincronizar';
  }
}


// ── Numpad del monto — aparece al tocar el 0 ──
let _numpadVisible = false;
let _splitNumpadVisible = false;

function showNumpad(){
  _numpadVisible = true;
  const np = document.getElementById('main-numpad');
  const spacer = document.getElementById('numpad-spacer');
  const hint = document.getElementById('amt-tap-hint');
  if(np){ np.style.transform = 'translateY(0)'; }
  if(spacer){ spacer.style.height = '220px'; }
  if(hint){ hint.style.display = 'none'; }
  // Subir el tacho para que no quede tapado por el numpad
  const del = document.getElementById('tx-delete-btn');
  if(del && del.style.display !== 'none'){ del.style.bottom = '244px'; del.style.transition='bottom .25s'; }
  updateNumpadPreview();
}

function hideNumpad(){
  _numpadVisible = false;
  const np = document.getElementById('main-numpad');
  const spacer = document.getElementById('numpad-spacer');
  if(np){ np.style.transform = 'translateY(100%)'; }
  if(spacer){ spacer.style.height = '0'; }
  // Volver el tacho a su posición original
  const del = document.getElementById('tx-delete-btn');
  if(del && del.style.display !== 'none'){ del.style.bottom = '24px'; del.style.transition='bottom .25s'; }
}

function updateNumpadPreview(){
  const el = document.getElementById('numpad-amt-preview');
  if(!el) return;
  const sep = getSep();
  const raw = amtStr.replace(',','.');
  const parts = raw.split('.');
  const intFmt = isNaN(parseInt(parts[0]))?'0':parseInt(parts[0]).toLocaleString('es-AR');
  const decPart = parts.length>1?(sep+parts[1]):'';
  el.textContent = sym() + intFmt + decPart;
}

// Override np para también actualizar el preview
// np actualizado para incluir updateNumpadPreview (ver función np original)

// Split numpad
function showSplitNumpad(){
  _splitNumpadVisible = true;
  const np = document.getElementById('split-numpad');
  if(np) np.style.transform = 'translateY(0)';
  updateSplitNumpadPreview();
}

function hideSplitNumpad(){
  _splitNumpadVisible = false;
  const np = document.getElementById('split-numpad');
  if(np) np.style.transform = 'translateY(100%)';
  updateSplitSummary();
}

function updateSplitNumpadPreview(){
  const el = document.getElementById('split-numpad-preview');
  if(!el) return;
  const sep = getSep();
  const raw = splitAmtStr.replace(',','.');
  const parts = raw.split('.');
  const intFmt = isNaN(parseInt(parts[0]))?'0':parseInt(parts[0]).toLocaleString('es-AR');
  const decPart = parts.length>1?(sep+parts[1]):'';
  el.textContent = sym() + intFmt + decPart;
}

// Override snp para también actualizar el preview del split



function showDeleteBtn(isEdit){
  const btn = document.getElementById('tx-delete-btn');
  if(!btn) return;
  btn.style.display = 'flex';
  btn.style.opacity = '1';
  btn.style.transform = 'scale(1)';
  btn.style.transition = 'transform .2s, opacity .2s, bottom .3s';
  if(isEdit){
    // Modo edición: borrar movimiento
    btn.title = 'Eliminar movimiento';
    btn.onclick = deleteTx;
    btn.style.background = 'var(--rdd)';
    btn.style.borderColor = 'rgba(240,86,106,.4)';
  } else {
    // Modo nuevo: limpiar formulario
    btn.title = 'Limpiar';
    btn.onclick = ()=>{
      amtStr='0'; selCat=null;
      document.getElementById('note-inp').value='';
      txDate=new Date(); updateDateLbl();
      updateAmt(); renderTxCatCircles(txType);
      hideNumpad();
      showToast('🗑️ Formulario limpiado');
    };
    btn.style.background = 'var(--s2)';
    btn.style.borderColor = 'var(--br)';
    // Cambiar ícono a "limpiar"
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
  }
}

// ══════════════════════════════════════════════════════
// PUNTO 1: FAB de grupo Split abre formulario directo
// ══════════════════════════════════════════════════════
// openAddSplitExpense ya recibe curGroupId — el FAB del grupo ya lo llama
// Solo asegurar que el título y los participantes estén preseleccionados
// (ya implementado en la versión anterior)

// ══════════════════════════════════════════════════════
// PUNTO 2: Búsqueda y filtros en Todos los movimientos
// ══════════════════════════════════════════════════════
let allTxTypeFilter='all', allTxCatFilter=null, allTxDateFrom=null, allTxDateTo=null;

function renderAllTx(){
  filterAllTx();
}

function filterAllTx(){
  const q=(document.getElementById('alltx-search')?.value||'').toLowerCase().trim();
  const clearBtn=document.getElementById('alltx-clear');
  if(clearBtn) clearBtn.style.display=q?'block':'none';
  let txs=[...S.txs].sort((a,b)=>new Date(b.date)-new Date(a.date));
  // Tipo
  if(allTxTypeFilter!=='all') txs=txs.filter(t=>t.type===allTxTypeFilter);
  // Categoría
  if(allTxCatFilter) txs=txs.filter(t=>t.cat===allTxCatFilter);
  // Fechas
  if(allTxDateFrom) txs=txs.filter(t=>new Date(t.date)>=new Date(allTxDateFrom));
  if(allTxDateTo) txs=txs.filter(t=>new Date(t.date)<=new Date(allTxDateTo+'T23:59:59'));
  // Búsqueda texto
  if(q) txs=txs.filter(t=>(t.note||'').toLowerCase().includes(q)||(t.cat||'').toLowerCase().includes(q));
  // Info
  const info=document.getElementById('alltx-info');
  const totalAmt=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  if(info) info.textContent=txs.length+' movimiento'+(txs.length!==1?'s':'')+(allTxTypeFilter==='expense'?' · Total: '+sym()+fmt(totalAmt):'');
  renderTxList(txs,'all-tx-list');
}

function clearAllTxSearch(){
  const inp=document.getElementById('alltx-search');
  if(inp) inp.value='';
  filterAllTx();
}

function setAllTxType(type){
  allTxTypeFilter=type;
  ['all','expense','income','invest','cat','date'].forEach(t=>{
    const el=document.getElementById('chip-'+t);
    if(el) el.classList.toggle('active', t===type||(t==='cat'&&allTxCatFilter)||(t==='date'&&(allTxDateFrom||allTxDateTo)));
  });
  filterAllTx();
}

function openAllTxCatFilter(){
  const list=document.getElementById('alltx-cat-list');
  list.innerHTML='';
  // Todas las categorías usadas
  const used=[...new Set(S.txs.map(t=>t.cat).filter(Boolean))].sort();
  // Opción "Todas"
  const all=document.createElement('div');
  all.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:13px 4px;border-bottom:1px solid var(--br);cursor:pointer';
  all.innerHTML='<span style="font-size:14px;font-weight:500">Todas las categorías</span>'+(allTxCatFilter===null?'<span style="color:var(--gr)">✓</span>':'');
  all.onclick=()=>{ allTxCatFilter=null; document.getElementById('alltx-cat-modal').classList.add('hidden'); document.getElementById('chip-cat').classList.remove('active'); filterAllTx(); };
  list.appendChild(all);
  used.forEach(cat=>{
    const cd=findCat('expense',cat)||findCat('income',cat)||findCat('invest',cat);
    const el=document.createElement('div');
    el.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:13px 4px;border-bottom:1px solid var(--br);cursor:pointer';
    el.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">${cd?cd.e:'📁'}</span><span style="font-size:14px">${cat}</span></div>${allTxCatFilter===cat?'<span style="color:var(--gr)">✓</span>':''}`;
    el.onclick=()=>{ allTxCatFilter=cat; document.getElementById('alltx-cat-modal').classList.add('hidden'); document.getElementById('chip-cat').classList.add('active'); filterAllTx(); };
    list.appendChild(el);
  });
  document.getElementById('alltx-cat-modal').classList.remove('hidden');
}

function openAllTxDateFilter(){
  document.getElementById('alltx-date-modal').classList.remove('hidden');
}
function applyAllTxDateFilter(){
  allTxDateFrom=document.getElementById('alltx-date-from').value||null;
  allTxDateTo=document.getElementById('alltx-date-to').value||null;
  document.getElementById('alltx-date-modal').classList.add('hidden');
  document.getElementById('chip-date').classList.toggle('active',!!(allTxDateFrom||allTxDateTo));
  filterAllTx();
}
function clearAllTxDateFilter(){
  allTxDateFrom=null; allTxDateTo=null;
  document.getElementById('alltx-date-from').value='';
  document.getElementById('alltx-date-to').value='';
  document.getElementById('alltx-date-modal').classList.add('hidden');
  document.getElementById('chip-date').classList.remove('active');
  filterAllTx();
}

// ══════════════════════════════════════════════════════
// PUNTO 3: Alertas de presupuesto en el dashboard
// ══════════════════════════════════════════════════════
function renderBudgetAlerts(container){
  if(!S.budgets||!S.budgets.length) return;
  const now=new Date(); const mo=now.getMonth(); const yr=now.getFullYear();
  const monthTxs=S.txs.filter(t=>{ const d=new Date(t.date); return d.getMonth()===mo&&d.getFullYear()===yr&&t.type==='expense'; });
  const alerts=[];
  S.budgets.forEach(b=>{
    const spent=monthTxs.filter(t=>t.cat===b.cat).reduce((a,t)=>a+t.amount,0);
    const pct=spent/b.limit;
    if(pct>=0.8) alerts.push({b,spent,pct});
  });
  if(!alerts.length) return;
  const wrap=document.createElement('div');
  wrap.style.cssText='padding:0 20px;margin-bottom:12px';
  alerts.forEach(({b,spent,pct})=>{
    const isOver=pct>=1;
    const cd=findCat('expense',b.cat);
    const el=document.createElement('div');
    el.className='dash-alert '+(isOver?'danger':'warn');
    el.innerHTML=`
      <div style="font-size:18px">${isOver?'🚨':'⚠️'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:${isOver?'var(--rd)':'#fbbf24'}">${isOver?'Presupuesto agotado':'Presupuesto al '+Math.round(pct*100)+'%'}</div>
        <div style="font-size:11px;color:var(--mu)">${cd?cd.e+' ':''} ${b.cat} · ${sym()}${fmt(spent)} de ${sym()}${fmt(b.limit)}</div>
      </div>
      <div style="font-size:11px;font-weight:600;color:${isOver?'var(--rd)':'#fbbf24'}">${Math.round(pct*100)}%</div>`;
    el.onclick=()=>goTo('s-budgets');
    wrap.appendChild(el);
  });
  container.appendChild(wrap);
}

// PUNTO 4: Próximos vencimientos en el dashboard
function renderUpcoming(container){
  if(!S.recs||!S.recs.length) return;
  const now=new Date();
  const upcoming=S.recs.map(r=>{
    // Calcular próxima fecha
    const day=r.day||1;
    let next=new Date(now.getFullYear(),now.getMonth(),day);
    if(next<=now) next=new Date(now.getFullYear(),now.getMonth()+1,day);
    const daysLeft=Math.ceil((next-now)/(1000*60*60*24));
    return {...r,next,daysLeft};
  }).filter(r=>r.daysLeft<=10).sort((a,b)=>a.daysLeft-b.daysLeft);
  if(!upcoming.length) return;
  const wrap=document.createElement('div');
  wrap.style.cssText='padding:0 20px;margin-bottom:12px';
  const hdr=document.createElement('div');
  hdr.className='sec-hdr'; hdr.style.marginBottom='8px';
  hdr.innerHTML='<span class="sec-ttl">Próximos vencimientos</span><span class="sec-lnk" onclick="goTo(\'s-recurring\')">Ver todos</span>';
  wrap.appendChild(hdr);
  upcoming.slice(0,3).forEach(r=>{
    const el=document.createElement('div');
    el.className='dash-alert info';
    el.style.marginBottom='7px';
    const urgency=r.daysLeft<=3?'var(--rd)':r.daysLeft<=7?'#fbbf24':'var(--bl)';
    el.innerHTML=`
      <div style="font-size:16px">${r.emoji||'🔄'}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${r.note||r.cat||'Recurrente'}</div>
        <div style="font-size:11px;color:var(--mu)">${r.daysLeft===0?'Hoy':r.daysLeft===1?'Mañana':'En '+r.daysLeft+' días'} · ${sym()}${fmt(r.amount)}</div>
      </div>
      <div style="font-size:11px;font-weight:700;color:${urgency}">${r.daysLeft===0?'HOY':r.daysLeft+'d'}</div>`;
    el.onclick=()=>goTo('s-recurring');
    wrap.appendChild(el);
  });
  container.appendChild(wrap);
}

// ══════════════════════════════════════════════════════
// PUNTO 7: Historial de abonos a metas + retirar
// ══════════════════════════════════════════════════════
let _currentGoalId=null;

function openGoalHistory(id){
  _currentGoalId=id;
  const g=S.goals.find(x=>x.id===id); if(!g) return;
  const list=document.getElementById('goal-history-list');
  list.innerHTML='';
  const deposits=g.deposits||[];
  if(!deposits.length){
    list.innerHTML='<div style="padding:20px;text-align:center;color:var(--mu);font-size:13px">Sin abonos registrados</div>';
  } else {
    [...deposits].reverse().forEach((d,i)=>{
      const el=document.createElement('div');
      el.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:13px 4px;border-bottom:1px solid var(--br)';
      el.innerHTML=`
        <div>
          <div style="font-size:13px;font-weight:500">${sym()}${fmt(d.amount)}</div>
          <div style="font-size:11px;color:var(--mu)">${new Date(d.date).toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'})}</div>
        </div>
        <button onclick="undoGoalDeposit('${id}',${deposits.length-1-i})" style="background:var(--rdd);border:none;color:var(--rd);padding:6px 12px;border-radius:9px;font-size:12px;cursor:pointer">Deshacer</button>`;
      list.appendChild(el);
    });
  }
  const wb=document.getElementById('goal-withdraw-btn');
  if(wb) wb.style.display=deposits.length?'block':'none';
  document.getElementById('goal-history-modal').classList.remove('hidden');
}

function undoGoalDeposit(goalId, idx){
  const g=S.goals.find(x=>x.id===goalId); if(!g||!g.deposits) return;
  const deposit=g.deposits[idx];
  if(!deposit) return;
  showConfirm('Deshacer abono','¿Deshacer este abono de '+sym()+fmt(deposit.amount)+'?',()=>{
    g.saved=Math.max(0, g.saved-deposit.amount);
    g.deposits.splice(idx,1);
    saveState();
    openGoalHistory(goalId);
    renderGoals();
    showToast('✅ Abono deshecho');
  });
}

function withdrawGoalAmount(){
  const g=S.goals.find(x=>x.id===_currentGoalId); if(!g) return;
  document.getElementById('goal-history-modal').classList.add('hidden');
  // Abrir quick add con monto negativo
  const modal_html=`
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:var(--s1);border:1px solid var(--br);border-radius:20px;padding:24px;width:100%;max-width:320px">
        <div style="font-size:22px;text-align:center;margin-bottom:8px">${g.emoji||'🎯'}</div>
        <div style="font-size:15px;font-weight:600;text-align:center;margin-bottom:4px">${g.name}</div>
        <div style="font-size:12px;color:var(--mu);text-align:center;margin-bottom:16px">Disponible: ${sym()}${fmt(g.saved)}</div>
        <input id="withdraw-inp" type="number" placeholder="0" min="0" max="${g.saved}"
          style="width:100%;background:var(--s2);border:1px solid var(--br);border-radius:12px;padding:12px 14px;color:var(--tx);font-size:16px;font-family:inherit;outline:none;margin-bottom:14px;box-sizing:border-box">
        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('withdraw-overlay').remove()"
            style="flex:1;padding:12px;border-radius:12px;background:var(--s2);border:1px solid var(--br);font-size:14px;font-weight:600;cursor:pointer;color:var(--tx)">Cancelar</button>
          <button onclick="confirmWithdraw('${g.id}')"
            style="flex:1;padding:12px;border-radius:12px;background:var(--rdd);border:1px solid rgba(240,86,106,.3);font-size:14px;font-weight:600;cursor:pointer;color:var(--rd)">Retirar</button>
        </div>
      </div>
    </div>`;
  const overlay=document.createElement('div'); overlay.id='withdraw-overlay'; overlay.innerHTML=modal_html;
  document.querySelector('.phone').appendChild(overlay);
  setTimeout(()=>document.getElementById('withdraw-inp')?.focus(),100);
}

function confirmWithdraw(goalId){
  const inp=document.getElementById('withdraw-inp');
  const amt=parseFloat(inp?.value)||0;
  const g=S.goals.find(x=>x.id===goalId); if(!g) return;
  if(amt<=0||amt>g.saved){ showToast('⚠️ Monto inválido'); return; }
  g.saved=parseFloat((g.saved-amt).toFixed(2));
  if(!g.deposits) g.deposits=[];
  g.deposits.push({amount:-amt,date:new Date().toISOString(),type:'withdraw'});
  saveState();
  document.getElementById('withdraw-overlay')?.remove();
  renderGoals();
  showToast('✅ '+sym()+fmt(amt)+' retirado de la meta');
}

// ══════════════════════════════════════════════════════
// PUNTO 8: Marcar deuda como saldada desde el lado del acreedor
// ══════════════════════════════════════════════════════
function markDebtReceived(gid, fromId, toId, amount){
  showConfirm('Marcar como recibido',
    'Confirmás que recibiste '+sym()+fmt(amount)+' de '+getMemberName(gid,fromId)+'?',
    ()=>{
      S.split.expenses.push({
        id:uid(), groupId:gid, amount,
        desc:getMemberName(gid,fromId)+' → '+getMemberName(gid,toId),
        cat:'', note:'Pago recibido',
        payerId:fromId, method:'exact',
        shares:[{memberId:toId,amount}],
        date:new Date().toISOString(), emoji:'✅',
        comments:[], isSettlement:true,
      });
      saveState(); renderGroupDetail(); renderSplitContent();
      showToast('✅ Pago registrado como recibido');
    }
  );
}


// ── Resumen mensual — notificación in-app el 1ro de cada mes ──
function importMoneeExcel() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    showToast('⏳ Importando...');
    try {
      const data = await file.arrayBuffer();
      parseMoneeExcel(data);
    } catch(err) {
      showToast('❌ Error al leer el archivo: ' + err.message);
    }
  };
  input.click();
}

function parseMoneeExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const MONEE_CAT_MAP = {
    'Salario':'Sueldo','Otros Ingresos':'Otro',
    'Comida y Supermercado':'Mercado','General':'Otro',
    'Transporte':'Transporte','Alojamiento':'Vivienda',
    'Ropa':'Ropa','Salud':'Salud','Entretenimiento':'Ocio',
    'Compras y Regalos':'Ropa','Teléfono':'Suscripc.',
    'Caravana':'Vivienda','Vuelo':'Transporte',
    'Documentación':'Otro','Unknown':'Otro'
  };

  const MONTH_MAP = {
    'January':0,'February':1,'March':2,'April':3,'May':4,'June':5,
    'July':6,'August':7,'September':8,'October':9,'November':10,'December':11
  };

  // Debug temporal
  alert('HEADERS: ' + JSON.stringify(rows[0]) + '\n\nFILA 1: ' + JSON.stringify(rows[1]));

  let imported = 0, skipped = 0, duplicates = 0;
  const newTxs = [];

  for(let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if(!row || row.length < 6) continue;

    const [account, category, description, person, dateStr, amount, recurring, status] = row;

    if(i === 1) console.log('[Monee] dateStr:', dateStr, '| tipo:', typeof dateStr, '| isDate:', dateStr instanceof Date, '| amount:', amount, '| status:', status);

    if(status && status !== 'Settled') { skipped++; continue; }
    if(!amount || amount === 0) { skipped++; continue; }

    let date;
    try {
      if(dateStr instanceof Date) {
        date = new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate(), 12, 0, 0).toISOString();
      } else if(typeof dateStr === 'number') {
        const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
        date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0).toISOString();
      } else {
        const parts = String(dateStr).trim().split(' ');
        const day = parseInt(parts[0]);
        const month = MONTH_MAP[parts[1]];
        const year = parseInt(parts[2]);
        if(isNaN(day) || isNaN(month) || isNaN(year)) throw new Error();
        date = new Date(year, month, day, 12, 0, 0).toISOString();
      }
    } catch(e) { skipped++; continue; }

    const note = String(description || '').trim();
    const isDup = S.txs.some(t =>
      t.note === note &&
      Math.abs(t.amount - Math.abs(amount)) < 0.01 &&
      t.date.slice(0,10) === date.slice(0,10)
    );
    if(isDup) { duplicates++; continue; }

    const type = amount > 0 ? 'income' : 'expense';
    const cat = MONEE_CAT_MAP[String(category || '').trim()] || 'Otro';

    newTxs.push({
      id: uid(),
      type,
      amount: Math.abs(parseFloat(parseFloat(amount).toFixed(2))),
      cat,
      note,
      date
    });
    imported++;
  }

  if(newTxs.length === 0) {
    showToast(`⚠️ Sin datos nuevos (${duplicates} duplicados, ${skipped} omitidos)`);
    return;
  }

  S.txs = [...S.txs, ...newTxs];
  saveState();
  refreshHome();
  showToast(`✅ ${imported} movimientos importados${duplicates > 0 ? ` (${duplicates} duplicados omitidos)` : ''}`);
}

function showVerificationPending(user) {
  const existing = document.getElementById('verify-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'verify-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:600;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center';
  overlay.innerHTML = `
    <div style="font-size:56px;margin-bottom:24px">📧</div>
    <div style="font-size:22px;font-weight:700;color:var(--tx);margin-bottom:12px">Verificá tu email</div>
    <div style="font-size:15px;color:var(--mu);line-height:1.6;margin-bottom:8px">
      Enviamos un link de verificación a
    </div>
    <div style="font-size:15px;font-weight:600;color:var(--gr);margin-bottom:32px">${user.email}</div>
    <div style="font-size:13px;color:var(--mu);line-height:1.6;margin-bottom:32px">
      Revisá tu bandeja de entrada y spam.<br>Tocá el link para activar tu cuenta.
    </div>
    <button onclick="checkEmailVerification()"
      style="width:100%;max-width:320px;padding:16px;border-radius:16px;background:var(--gr);border:none;color:#0f0f13;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px">
      Ya verifiqué mi email ✓
    </button>
    <button onclick="resendVerificationEmail('${user.email}')"
      style="width:100%;max-width:320px;padding:14px;border-radius:16px;background:var(--s2);border:1px solid var(--br);color:var(--mu);font-size:14px;cursor:pointer;margin-bottom:12px">
      Reenviar email
    </button>
    <button onclick="logoutAndShowAuth()"
      style="width:100%;max-width:320px;padding:14px;border-radius:16px;background:transparent;border:none;color:var(--mu);font-size:13px;cursor:pointer">
      Usar sin cuenta
    </button>
  `;
  document.body.appendChild(overlay);
}

async function checkEmailVerification() {
  try {
    await _fbAuth.currentUser.reload();
    if(_fbAuth.currentUser.emailVerified) {
      document.getElementById('verify-overlay')?.remove();
      showToast('✅ Email verificado');
      await onUserLoggedIn(_fbAuth.currentUser);
    } else {
      showToast('⚠️ Todavía no verificaste tu email');
    }
  } catch(e) {
    showToast('Error al verificar: ' + e.message);
  }
}

async function resendVerificationEmail(email) {
  try {
    await _fbAuth.currentUser.sendEmailVerification();
    showToast('📧 Email reenviado a ' + email);
  } catch(e) {
    showToast('Error: ' + e.message);
  }
}

function logoutAndShowAuth() {
  document.getElementById('verify-overlay')?.remove();
  if(_fbAuth) _fbAuth.signOut();
  S.skipAuth = true;
  saveState();
}

function checkMonthlyReminder() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Solo el día 1 del mes
  if (day !== 1) return;

  // Flag para no mostrar más de una vez por día 1 (pero los datos siempre son frescos)
  const key = 'cw_monthly_' + year + '_' + month;
  if (localStorage.getItem(key)) return;

  // Calcular datos FRESCOS del mes anterior desde S.txs
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const txsPrevMonth = S.txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  if (!txsPrevMonth.length) return;

  const gastos = txsPrevMonth
    .filter(t => t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0);

  const ingresos = txsPrevMonth
    .filter(t => t.type === 'income')
    .reduce((a, t) => a + t.amount, 0);

  const nombreMes = new Date(prevYear, prevMonth, 1)
    .toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  const modal = document.getElementById('monthly-modal');
  if (!modal) return;

  const mesEl = document.getElementById('monthly-modal-mes');
  const gastoEl = document.getElementById('monthly-modal-gasto');
  const ingresoEl = document.getElementById('monthly-modal-ingreso');

  // Siempre actualizar con datos frescos antes de mostrar
  if (mesEl) mesEl.textContent = nombreMes;
  if (gastoEl) gastoEl.textContent = sym() + fmt(gastos);
  if (ingresoEl) ingresoEl.textContent = sym() + fmt(ingresos);

  localStorage.setItem(key, '1');

  setTimeout(() => modal.classList.remove('hidden'), 1200);
}

function closeMonthlyModal() {
  document.getElementById('monthly-modal')?.classList.add('hidden');
}

function testMonthlyModal() {
  const now = new Date();
  const key = 'cw_monthly_' + now.getFullYear() + '_' + now.getMonth();
  localStorage.removeItem(key);
  const month = now.getMonth();
  const year = now.getFullYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const txsPrev = S.txs.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const gastos = txsPrev.filter(t => t.type==='expense').reduce((a,t) => a+t.amount, 0);
  const ingresos = txsPrev.filter(t => t.type==='income').reduce((a,t) => a+t.amount, 0);
  const nombreMes = new Date(prevYear, prevMonth, 1)
    .toLocaleString('es-AR', {month:'long', year:'numeric'});
  const modal = document.getElementById('monthly-modal');
  const mesEl = document.getElementById('monthly-modal-mes');
  const gastoEl = document.getElementById('monthly-modal-gasto');
  const ingresoEl = document.getElementById('monthly-modal-ingreso');
  if (mesEl) mesEl.textContent = nombreMes;
  if (gastoEl) gastoEl.textContent = sym() + fmt(gastos);
  if (ingresoEl) ingresoEl.textContent = sym() + fmt(ingresos);
  localStorage.setItem(key, '1');
  modal.classList.remove('hidden');
}

function showWelcome(nombre) {
  if (localStorage.getItem('cw_welcomed')) return;
  const modal = document.getElementById('welcome-modal');
  const nameEl = document.getElementById('welcome-name');
  if (!modal) return;
  if (nameEl && nombre) nameEl.textContent = 'Hola, ' + nombre + ' 👋';
  modal.classList.remove('hidden');
  localStorage.setItem('cw_welcomed', '1');
}

function closeWelcome() {
  document.getElementById('welcome-modal')?.classList.add('hidden');
}

window.addEventListener('load',()=>{
  detectPlatform();
  // Mostrar aviso si está en file://
  if(location.protocol==='file:'){
    const w=document.getElementById('auth-file-warning');
    if(w) w.style.display='block';
  }
  initAuth();
  if(S.accent) document.documentElement.style.setProperty('--gr',S.accent);
  updateCurrUI();
  renderAccentDots();
  const decKey=document.getElementById('dec-key'); if(decKey) decKey.textContent=getSep();
  const togCo=document.getElementById('tog-comma'); if(togCo&&!S.useComma) togCo.classList.remove('on');
  const togTh=document.getElementById('tog-thousands'); if(togTh&&!S.useThousands) togTh.classList.remove('on');
  const togBa=document.getElementById('tog-budget'); if(togBa&&!S.budgetAlerts) togBa.classList.remove('on');
  const togHs=document.getElementById('tog-hide-start'); if(togHs&&S.hidden) togHs.classList.add('on');
  const togDk=document.getElementById('tog-dark'); if(togDk&&!S.darkMode) togDk.classList.remove('on');
  applyDarkMode(S.darkMode);
  updateLangUI();
  applyRecurring();
  refreshHome();
  if(S.hidden) applyHide(true);
  checkMonthlyReminder();
});



// ═══════════════════════════════════════════════════════
// SPLIT — Módulo completo rediseñado
// ═══════════════════════════════════════════════════════

// ── Estado Split ──
if(!S.split) S.split={groups:[],expenses:[]};
if(!Array.isArray(S.split.groups)) S.split.groups=[];
if(!Array.isArray(S.split.expenses)) S.split.expenses=[];
if(!S.splitPrefs) S.splitPrefs={simplify:true,showSettled:true,autoPersonal:false,defaultMethod:'equal'};

// ── Variables globales de Split ──
let curGroupId=null;
let splitTabActive='groups', grpTabActive='expenses';
let splitAmtStr='0', splitMethod='equal', splitPayerId=null, splitSelCat=null;
let splitMemberShares={}, splitParticipantIds=[];
let editingGroupId=null, groupEmoji='👥', groupMembers=[];
let settleData=null, _currentSplitExpId=null;

// ── Emojis de grupo ──
const GROUP_EMOJIS=['🏠','✈️','🎉','🍕','🎿','🏖️','💼','🎓','🤝','👥','🎮','🍺','🏕️','🚗','🎭','🌍','🏋️','🎪','🎸','💊'];

// ── Helpers ──
function getGroup(id){ return (S.split.groups||[]).find(g=>g.id===id); }
function getGroupExpenses(gid){ return (S.split.expenses||[]).filter(e=>e.groupId===gid&&!e._deleted); }
function getMemberName(gid,mid){
  const g=getGroup(gid); if(!g) return mid;
  const m=g.members.find(x=>x.id===mid);
  return m?m.name:mid;
}
function spSym(){ return sym(); }
function spFmt(n){
  // Usa las preferencias de la app principal
  return fmt(n);
}
function ME_NAME(){ return (S.linkedAccount&&S.linkedAccount.name)||'Yo'; }

// ── Calcular balances ──
function calcBalances(gid){
  const g=getGroup(gid); if(!g) return {};
  const bal={};
  g.members.forEach(m=>{ bal[m.id]={net:0,paid:0,share:0}; });
  getGroupExpenses(gid).forEach(exp=>{
    if(!bal[exp.payerId]) bal[exp.payerId]={net:0,paid:0,share:0};
    bal[exp.payerId].paid+=exp.amount;
    exp.shares.forEach(sh=>{
      if(!bal[sh.memberId]) bal[sh.memberId]={net:0,paid:0,share:0};
      bal[sh.memberId].share+=sh.amount;
    });
  });
  Object.keys(bal).forEach(id=>{
    bal[id].net=bal[id].paid-bal[id].share;
  });
  return bal;
}

// ── Simplificar deudas (algoritmo greedy) ──
function simplifyDebts(balances){
  const debtors=[],creditors=[];
  Object.entries(balances).forEach(([id,b])=>{
    if(b.net<-0.01) debtors.push({id,amt:-b.net});
    else if(b.net>0.01) creditors.push({id,amt:b.net});
  });
  debtors.sort((a,b)=>b.amt-a.amt);
  creditors.sort((a,b)=>b.amt-a.amt);
  const result=[]; let i=0,j=0;
  while(i<debtors.length&&j<creditors.length){
    const pay=Math.min(debtors[i].amt,creditors[j].amt);
    if(pay>0.01) result.push({from:debtors[i].id,to:creditors[j].id,amount:parseFloat(pay.toFixed(2))});
    debtors[i].amt-=pay; creditors[j].amt-=pay;
    if(debtors[i].amt<0.01) i++;
    if(creditors[j].amt<0.01) j++;
  }
  return result;
}

// ── Calcular partes de división ──
function calcSplitShares(total,members,method,shares){
  const n=members.length; if(n===0) return [];
  if(method==='equal'){
    const base=parseFloat((total/n).toFixed(2));
    const diff=parseFloat((total-base*n).toFixed(2));
    return members.map((m,i)=>({memberId:m.id,amount:i===0?base+diff:base}));
  }
  if(method==='pct'){
    return members.map(m=>({memberId:m.id,amount:parseFloat((total*(parseFloat(shares[m.id])||0)/100).toFixed(2))}));
  }
  if(method==='exact'){
    return members.map(m=>({memberId:m.id,amount:parseFloat(parseFloat(shares[m.id]||0).toFixed(2))}));
  }
  if(method==='shares'){
    const total_sh=members.reduce((a,m)=>a+(parseFloat(shares[m.id])||1),0)||1;
    return members.map(m=>({memberId:m.id,amount:parseFloat((total*(parseFloat(shares[m.id])||1)/total_sh).toFixed(2))}));
  }
  return members.map(m=>({memberId:m.id,amount:parseFloat((total/n).toFixed(2))}));
}

// ═══ NAVEGACIÓN ═══════════════════════════════════════

function switchSplitTab(tab){
  splitTabActive=tab;
  ['groups','debts','activity'].forEach(t=>{
    const el=document.getElementById('split-tab-'+t);
    if(el) el.classList.toggle('active',t===tab);
  });
  renderSplitContent();
}

function switchGrpTab(tab){
  grpTabActive=tab;
  ['expenses','balances','stats'].forEach(t=>{
    const el=document.getElementById('grp-tab-'+t);
    if(el) el.classList.toggle('active',t===tab);
  });
  renderGroupDetail();
}

// ═══ NUEVO FLUJO DE GASTO SPLIT (estilo Splitwise) ═══

// Categorías agrupadas para Split
const SPLIT_CATS = [
  {group:'Recientes', items:[]}, // se llena dinámicamente
  {group:'Comida y bebida', items:[
    {e:'🍕',n:'Comida'},{e:'🍺',n:'Bar'},{e:'☕',n:'Café'},{e:'🛒',n:'Supermercado'},
    {e:'🍣',n:'Restaurant'},{e:'🍔',n:'Fast food'},{e:'🥡',n:'Delivery'},
  ]},
  {group:'Transporte', items:[
    {e:'🚗',n:'Auto'},{e:'✈️',n:'Vuelo'},{e:'🚌',n:'Colectivo'},{e:'🚕',n:'Taxi/Uber'},
    {e:'🚂',n:'Tren'},{e:'⛽',n:'Nafta'},{e:'🅿️',n:'Estacionamiento'},
  ]},
  {group:'Alojamiento', items:[
    {e:'🏨',n:'Hotel'},{e:'🏠',n:'Alquiler'},{e:'🏕️',n:'Camping'},{e:'🛋️',n:'Airbnb'},
  ]},
  {group:'Entretenimiento', items:[
    {e:'🎬',n:'Cine'},{e:'🎵',n:'Música'},{e:'🎮',n:'Juegos'},{e:'🎭',n:'Show'},
    {e:'⛷️',n:'Deporte'},{e:'🎳',n:'Actividad'},
  ]},
  {group:'Servicios', items:[
    {e:'💡',n:'Electricidad'},{e:'💧',n:'Agua'},{e:'📱',n:'Teléfono'},
    {e:'🌐',n:'Internet'},{e:'🧹',n:'Limpieza'},{e:'🔧',n:'Reparación'},
  ]},
  {group:'Otros', items:[
    {e:'🎁',n:'Regalo'},{e:'💊',n:'Salud'},{e:'📚',n:'Educación'},
    {e:'👔',n:'Ropa'},{e:'💸',n:'Otro'},
  ]},
];

// ── Abrir pagador ──
function openPayerModal(){
  const g=getGroup(curGroupId); if(!g) return;
  const list=document.getElementById('payer-modal-list');
  list.innerHTML='';
  g.members.forEach(m=>{
    const sel=m.id===splitPayerId;
    const el=document.createElement('div');
    el.className='sp-payer-opt';
    el.innerHTML=`
      <div style="width:44px;height:44px;border-radius:50%;background:${m.isMe?'var(--gd)':'var(--bld)'};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${m.isMe?'var(--gr)':'var(--bl)'}">
        ${m.name[0].toUpperCase()}
      </div>
      <div style="flex:1">
        <div style="font-size:15px;font-weight:${sel?'600':'400'}">${m.name}${m.isMe?' (vos)':''}</div>
      </div>
      ${sel?'<div style="color:var(--gr);font-size:20px;font-weight:700">✓</div>':''}`;
    el.onclick=()=>{
      splitPayerId=m.id;
      updatePayerMini();
      document.getElementById('payer-modal').classList.add('hidden');
    };
    list.appendChild(el);
  });
  document.getElementById('payer-modal').classList.remove('hidden');
}

function updatePayerMini(){
  const g=getGroup(curGroupId); if(!g) return;
  const m=g.members.find(x=>x.id===splitPayerId)||g.members[0];
  if(!m) return;
  const av=document.getElementById('payer-avatar-mini');
  const nm=document.getElementById('payer-name-mini');
  if(av){
    av.textContent=m.name[0].toUpperCase();
    av.style.background=m.isMe?'var(--gd)':'var(--bld)';
    av.style.color=m.isMe?'var(--gr)':'var(--bl)';
  }
  if(nm) nm.textContent=m.isMe?'Yo':m.name;
}

// ── Abrir opciones de división (modal) ──
function openSplitOptionsModal(){
  const g=getGroup(curGroupId); if(!g) return;
  // Sincronizar método activo
  ['equal','exact','pct','shares','adjustment'].forEach(m=>{
    const el=document.getElementById('smt-'+m);
    if(el) el.classList.toggle('active',m===splitMethod);
  });
  renderSplitOptionsModal();
  document.getElementById('split-options-modal').classList.remove('hidden');
}

function closeSplitOptionsModal(){
  document.getElementById('split-options-modal').classList.add('hidden');
  updateSplitSummary();
}

function setSplitMethodModal(method){
  splitMethod=method;
  ['equal','exact','pct','shares','adjustment'].forEach(m=>{
    const el=document.getElementById('smt-'+m);
    if(el) el.classList.toggle('active',m===method);
  });
  renderSplitOptionsModal();
}

function renderSplitOptionsModal(){
  const g=getGroup(curGroupId); if(!g) return;
  const total=normAmt(splitAmtStr);
  const participants=g.members.filter(m=>splitParticipantIds.includes(m.id));
  const shares=calcSplitShares(total,participants,splitMethod,splitMemberShares);
  const list=document.getElementById('split-options-list');
  if(!list) return; list.innerHTML='';

  // Descripción del método
  const descs={
    equal:'Todos pagan la misma parte.',
    exact:'Ingresá el monto exacto de cada uno.',
    pct:'Ingresá el porcentaje de cada uno.',
    shares:'Ingresá cuántas partes le corresponden a cada uno.',
    adjustment:'Ajustá cuánto más o menos paga cada uno respecto a la parte igual.',
  };
  const descEl=document.getElementById('split-method-desc');
  if(descEl) descEl.textContent=descs[splitMethod]||'';

  // Total por persona
  const n=participants.length||1;
  const perPerson=parseFloat((total/n).toFixed(2));
  const ppEl=document.getElementById('split-per-person');
  const pcEl=document.getElementById('split-person-count');
  if(ppEl) ppEl.textContent=splitMethod==='equal'?sym()+fmt(perPerson)+'/persona':'Total: '+sym()+fmt(total);
  if(pcEl) pcEl.textContent='('+n+' persona'+(n!==1?'s':'')+(splitMethod==='equal'?' · partes iguales':'')+')';

  // Todos seleccionados?
  const allSel=g.members.every(m=>splitParticipantIds.includes(m.id));
  const allBtn=document.getElementById('all-selected-check');
  if(allBtn) allBtn.parentElement.style.opacity=allSel?'1':'.7';

  // Renderizar cada miembro
  g.members.forEach(m=>{
    const inPart=splitParticipantIds.includes(m.id);
    const sh=shares.find(s=>s.memberId===m.id)||{amount:0};
    const row=document.createElement('div');
    row.className='sp-member-opt-row';
    // Check de participación
    let rightSide='';
    if(splitMethod==='equal'){
      rightSide=`<div class="sp-member-opt-amt" style="color:${inPart?'var(--bl)':'var(--mu)'}">${inPart?sym()+fmt(sh.amount):'—'}</div>`;
    } else if(splitMethod==='exact'){
      const v=splitMemberShares[m.id]!==undefined?splitMemberShares[m.id]:'';
      rightSide=`<input type="number" class="sp-member-opt-input" value="${v}" placeholder="0" min="0"
        oninput="splitMemberShares['${m.id}']=+this.value;renderSplitOptionsModal()" ${!inPart?'disabled style="opacity:.4"':''}>`;
    } else if(splitMethod==='pct'){
      const v=splitMemberShares[m.id]!==undefined?splitMemberShares[m.id]:Math.round(100/n);
      rightSide=`<div style="display:flex;align-items:center;gap:4px">
        <input type="number" class="sp-member-opt-input" value="${v}" placeholder="0" min="0" max="100"
          oninput="splitMemberShares['${m.id}']=+this.value;renderSplitOptionsModal()" ${!inPart?'disabled style="opacity:.4"':''}><span style="color:var(--mu);font-size:13px">%</span>
        </div>`;
    } else if(splitMethod==='shares'){
      const v=splitMemberShares[m.id]||1;
      rightSide=`<div style="display:flex;align-items:center;gap:4px">
        <input type="number" class="sp-member-opt-input" value="${v}" placeholder="1" min="1"
          oninput="splitMemberShares['${m.id}']=+this.value;renderSplitOptionsModal()" ${!inPart?'disabled style="opacity:.4"':''}><span style="color:var(--mu);font-size:13px">×</span>
        </div>`;
    } else if(splitMethod==='adjustment'){
      const base=parseFloat((total/n).toFixed(2));
      const adj=splitMemberShares[m.id]||0;
      rightSide=`<div style="display:flex;align-items:center;gap:4px">
        <span style="font-size:12px;color:var(--mu)">+/−</span>
        <input type="number" class="sp-member-opt-input" value="${adj}" placeholder="0"
          oninput="splitMemberShares['${m.id}']=+this.value;renderSplitOptionsModal()" ${!inPart?'disabled style="opacity:.4"':''}></div>`;
    }
    row.innerHTML=`
      <div class="sp-member-check ${inPart?'checked':''}" onclick="toggleParticipant('${m.id}')">
        ${inPart?'<svg width="12" height="10" viewBox="0 0 12 10"><polyline points="1,5 4.5,8.5 11,1" stroke="#0f0f13" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
      </div>
      <div style="width:38px;height:38px;border-radius:50%;background:${m.isMe?'var(--gd)':'var(--bld)'};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:${m.isMe?'var(--gr)':'var(--bl)'};flex-shrink:0">
        ${m.name[0].toUpperCase()}
      </div>
      <div class="sp-member-opt-info">
        <div class="sp-member-opt-name">${m.name}${m.isMe?' (vos)':''}</div>
        ${splitMethod!=='equal'&&inPart?`<div class="sp-member-opt-sub">${sym()}${fmt(sh.amount)}</div>`:''}
      </div>
      <div>${rightSide}</div>`;
    list.appendChild(row);
  });

  // Aviso si no suma
  if((splitMethod==='exact'||splitMethod==='pct')&&total>0){
    const total_shares=shares.reduce((a,s)=>a+s.amount,0);
    const diff=Math.abs(total_shares-total);
    if(diff>0.01){
      const warn=document.createElement('div');
      warn.style.cssText='padding:10px;background:var(--rdd);border-radius:10px;font-size:12px;color:var(--rd);text-align:center;margin-top:8px';
      const pct_txt=splitMethod==='pct'?Math.round(total_shares/total*100)+'% asignado':sym()+fmt(diff)+' de diferencia';
      warn.textContent='⚠️ '+pct_txt;
      list.appendChild(warn);
    }
  }
}

function toggleParticipant(memberId){
  if(splitParticipantIds.includes(memberId)){
    if(splitParticipantIds.length<=2){ showToast('⚠️ Mínimo 2 participantes'); return; }
    splitParticipantIds=splitParticipantIds.filter(id=>id!==memberId);
    if(splitPayerId===memberId) splitPayerId=splitParticipantIds[0];
  } else {
    splitParticipantIds.push(memberId);
  }
  renderSplitOptionsModal();
}

function selectAllParticipants(){
  const g=getGroup(curGroupId); if(!g) return;
  splitParticipantIds=g.members.map(m=>m.id);
  renderSplitOptionsModal();
}

function updateSplitSummary(){
  const g=getGroup(curGroupId); if(!g) return;
  const total=normAmt(splitAmtStr);
  const participants=g.members.filter(m=>splitParticipantIds.includes(m.id));
  const n=participants.length;
  const methodNames={equal:'Partes iguales',exact:'Montos exactos',pct:'Porcentaje',shares:'Partes proporcionales',adjustment:'Con ajuste'};
  const summaryEl=document.getElementById('split-summary-text');
  const subEl=document.getElementById('split-summary-sub');
  if(summaryEl) summaryEl.textContent=methodNames[splitMethod]||'Partes iguales';
  if(subEl){
    if(splitMethod==='equal'&&total>0) subEl.textContent=sym()+fmt(parseFloat((total/n).toFixed(2)))+'/persona · '+n+' personas';
    else subEl.textContent=n+' persona'+(n!==1?'s':'');
  }
}

// ── Categorías Split ──
function openSplitCatModal(){
  renderSplitCatList('');
  document.getElementById('split-cat-search').value='';
  document.getElementById('split-cat-modal').classList.remove('hidden');
}

function filterSplitCats(){
  const q=document.getElementById('split-cat-search').value;
  renderSplitCatList(q);
}

function renderSplitCatList(query){
  const list=document.getElementById('split-cat-list');
  if(!list) return;
  list.innerHTML='';
  const q=query.toLowerCase();
  SPLIT_CATS.forEach(group=>{
    let items=group.items;
    if(q) items=items.filter(it=>it.n.toLowerCase().includes(q)||it.e.includes(q));
    if(!items.length) return;
    if(!q){
      const h=document.createElement('div'); h.className='sp-cat-group-title';
      h.textContent=group.group; list.appendChild(h);
    }
    items.forEach(it=>{
      const el=document.createElement('div'); el.className='sp-cat-item';
      const bg=splitSelCat===it.n?'var(--bld)':'var(--s2)';
      const bc=splitSelCat===it.n?'rgba(107,140,255,.3)':'transparent';
      el.innerHTML=`
        <div class="sp-cat-icon" style="background:${bg};border:2px solid ${bc}">${it.e}</div>
        <div style="font-size:14px;font-weight:${splitSelCat===it.n?'600':'400'};color:${splitSelCat===it.n?'var(--bl)':'var(--tx)'}">
          ${it.n}
        </div>
        ${splitSelCat===it.n?'<div style="margin-left:auto;color:var(--gr);font-size:18px">✓</div>':''}`;
      el.onclick=()=>{
        splitSelCat=it.n;
        const iconEl=document.getElementById('split-exp-cat-icon');
        if(iconEl) iconEl.textContent=it.e;
        document.getElementById('split-cat-modal').classList.add('hidden');
      };
      list.appendChild(el);
    });
  });
}

function initSplit(){
  // Asegurar defaults
  if(!S.split) S.split={groups:[],expenses:[]};
  if(!S.splitPrefs) S.splitPrefs={simplify:true,showSettled:true,autoPersonal:false,defaultMethod:'equal'};
  splitTabActive='groups';
  renderSplitContent();
}

// ═══ RENDER SPLIT MAIN ════════════════════════════════

function renderSplitContent(){
  const scroll=document.getElementById('split-scroll');
  if(!scroll) return;
  scroll.innerHTML='';
  if(splitTabActive==='groups') renderSplitGroups(scroll);
  else if(splitTabActive==='debts') renderAllDebts(scroll);
  else renderSplitActivity(scroll);
}

function renderSplitGroups(container){
  if(!S.split.groups.length){
    container.innerHTML=`<div class="empty-state">
      <span class="big">👥</span>
      Sin grupos todavía.<br>
      <span style="font-size:12px;color:var(--mu)">Tocá + para crear tu primer grupo.</span>
    </div>`;
    return;
  }
  S.split.groups.forEach(g=>{
    const bal=calcBalances(g.id);
    const me=g.members.find(m=>m.isMe);
    const myNet=me&&bal[me.id]?bal[me.id].net:0;
    const exps=getGroupExpenses(g.id).filter(e=>!e.isSettlement);
    const total=exps.reduce((a,e)=>a+e.amount,0);
    const balClass=myNet>0.01?'owed':myNet<-0.01?'owe':'even';
    const balText=myNet>0.01?`Te deben ${spSym()}${spFmt(myNet)}`:
                  myNet<-0.01?`Debés ${spSym()}${spFmt(-myNet)}`:'Saldado ✓';

    const card=document.createElement('div');
    card.className='sp-group-card';

    // Avatares de miembros (hasta 4 + "+N")
    const visibleMembers=g.members.slice(0,4);
    const extraCount=g.members.length-4;
    const avatarsHtml=visibleMembers.map(m=>{
      const bg=m.isMe?'var(--gd)':'var(--bld)';
      const color=m.isMe?'var(--gr)':'var(--bl)';
      return `<div class="sp-avatar" style="background:${bg};color:${color}">${m.name[0].toUpperCase()}</div>`;
    }).join('')+(extraCount>0?`<div class="sp-avatar sp-avatar-extra">+${extraCount}</div>`:'');

    card.innerHTML=`
      <div class="sp-group-head">
        <div class="sp-group-emoji">${g.emoji||'👥'}</div>
        <div class="sp-group-info">
          <div class="sp-group-name">${g.name}</div>
          <div class="sp-group-meta">${g.members.length} integrante${g.members.length!==1?'s':''} · ${exps.length} gasto${exps.length!==1?'s':''}</div>
        </div>
        <div class="sp-group-balance">
          <div class="sp-balance-val ${balClass}">${balText}</div>
          <div class="sp-balance-lbl">Total: ${spSym()}${spFmt(total)}</div>
        </div>
      </div>
      <div class="sp-members-row">${avatarsHtml}</div>`;
    card.onclick=()=>{ curGroupId=g.id; grpTabActive='expenses'; goTo('s-split-group'); };
    container.appendChild(card);
  });
}

function renderAllDebts(container){
  const allDebts=[];
  let totalOwe=0, totalOwed=0;
  (S.split.groups||[]).forEach(g=>{
    const bal=calcBalances(g.id);
    const debts=S.splitPrefs.simplify?simplifyDebts(bal):buildRawDebts(bal);
    debts.forEach(d=>{
      const fromMe=g.members.find(m=>m.id===d.from&&m.isMe);
      const toMe=g.members.find(m=>m.id===d.to&&m.isMe);
      if(fromMe){ totalOwe+=d.amount; allDebts.push({...d,groupName:g.name,groupId:g.id,g,fromMe:true,toMe:false}); }
      else if(toMe){ totalOwed+=d.amount; allDebts.push({...d,groupName:g.name,groupId:g.id,g,fromMe:false,toMe:true}); }
    });
  });

  // Resumen
  const sum=document.createElement('div');
  sum.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px';
  sum.innerHTML=`
    <div style="background:var(--rdd);border:1px solid rgba(240,86,106,.2);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--rd);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Yo debo</div>
      <div style="font-size:19px;font-weight:700;font-family:'DM Mono',monospace;color:var(--rd)">${totalOwe>0.01?spSym()+spFmt(totalOwe):'—'}</div>
    </div>
    <div style="background:var(--gd);border:1px solid rgba(52,212,138,.2);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Me deben</div>
      <div style="font-size:19px;font-weight:700;font-family:'DM Mono',monospace;color:var(--gr)">${totalOwed>0.01?spSym()+spFmt(totalOwed):'—'}</div>
    </div>`;
  container.appendChild(sum);

  if(!allDebts.length){
    const ok=document.createElement('div');
    ok.style.cssText='background:var(--gd);border:1px solid rgba(52,212,138,.2);border-radius:16px;padding:24px;text-align:center';
    ok.innerHTML='<div style="font-size:32px;margin-bottom:8px">🎉</div><div style="font-size:15px;font-weight:600;color:var(--gr)">¡Sin deudas pendientes!</div><div style="font-size:12px;color:var(--mu);margin-top:4px">Todo está saldado en todos tus grupos</div>';
    container.appendChild(ok); return;
  }

  const iOwe=allDebts.filter(d=>d.fromMe);
  const theyOwe=allDebts.filter(d=>d.toMe);

  if(iOwe.length){
    const h=document.createElement('div'); h.className='sec-hdr'; h.style.marginBottom='10px';
    h.innerHTML='<span class="sec-ttl" style="color:var(--rd)">↑ Tengo que pagar</span>';
    container.appendChild(h);
    iOwe.forEach(d=>{ container.appendChild(buildDebtCard(d,true)); });
  }
  if(theyOwe.length){
    const h=document.createElement('div'); h.className='sec-hdr'; h.style.cssText='margin-bottom:10px;margin-top:4px';
    h.innerHTML='<span class="sec-ttl" style="color:var(--gr)">↓ Me tienen que pagar</span>';
    container.appendChild(h);
    theyOwe.forEach(d=>{ container.appendChild(buildDebtCard(d,false)); });
  }
}

function buildRawDebts(balances){
  // Sin simplificar: cada par que se debe algo
  const result=[];
  const ids=Object.keys(balances);
  for(let i=0;i<ids.length;i++){
    for(let j=0;j<ids.length;j++){
      if(i===j) continue;
      // Calcular desde txs directas (simplificación mínima)
    }
  }
  return simplifyDebts(balances); // fallback por ahora
}

function buildDebtCard(d,withPayBtn){
  const fromName=getMemberName(d.groupId,d.from);
  const toName=getMemberName(d.groupId,d.to);
  const el=document.createElement('div');
  el.className='sp-debt-card '+(withPayBtn?'fromme':'tome');
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:${withPayBtn?'12px':'0'}">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">
          <span style="color:${withPayBtn?'var(--rd)':'var(--tx)'}">${fromName}</span>
          <span style="color:var(--mu);margin:0 6px">le paga a</span>
          <span style="color:${withPayBtn?'var(--gr)':'var(--gr)'}">${toName}</span>
        </div>
        <div style="font-size:11px;color:var(--mu);margin-top:2px">${d.groupName}</div>
      </div>
      <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace;color:${withPayBtn?'var(--rd)':'var(--gr)'}">
        ${spSym()}${spFmt(d.amount)}
      </div>
    </div>`;
  if(withPayBtn){
    const btn=document.createElement('button');
    btn.style.cssText='width:100%;padding:11px;border-radius:12px;background:var(--gr);border:none;color:#0f0f13;font-size:13px;font-weight:600;cursor:pointer';
    btn.textContent='💸 Registrar pago';
    btn.onclick=()=>openSettleModal(d.groupId,d.from,d.to,d.amount);
    el.appendChild(btn);
  }
  return el;
}

function renderSplitActivity(container){
  const all=[...(S.split.expenses||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,40);
  if(!all.length){
    container.innerHTML='<div class="empty-state"><span class="big">📋</span>Sin actividad todavía.</div>';
    return;
  }
  all.forEach(exp=>{
    const g=getGroup(exp.groupId);
    const payer=g?getMemberName(exp.groupId,exp.payerId):'?';
    const el=document.createElement('div'); el.className='sp-exp-item';
    el.innerHTML=`
      <div class="sp-exp-head">
        <div class="sp-exp-icon">${exp.emoji||'💸'}</div>
        <div style="flex:1;min-width:0">
          <div class="sp-exp-desc">${exp.desc||'Gasto'}</div>
          <div class="sp-exp-meta">Pagó ${payer} · ${g?g.name:''} · ${exp.date.slice(0,10)}</div>
        </div>
        <div class="sp-exp-amt">${spSym()}${spFmt(exp.amount)}</div>
      </div>`;
    el.onclick=()=>openSplitExpDetail(exp.id);
    container.appendChild(el);
  });
}

// ═══ DETALLE DE GRUPO ════════════════════════════════

function renderGroupDetail(){
  const g=getGroup(curGroupId); if(!g) return;
  // Título
  const titleEl=document.getElementById('grp-title');
  if(titleEl) titleEl.textContent=(g.emoji||'👥')+' '+g.name;
  // Balance bar
  const bal=calcBalances(curGroupId);
  const me=g.members.find(m=>m.isMe);
  const myNet=me&&bal[me.id]?bal[me.id].net:0;
  const bb=document.getElementById('grp-balance-bar');
  if(bb){
    const bg=myNet>0.01?'var(--gd)':myNet<-0.01?'var(--rdd)':'var(--s2)';
    const bc=myNet>0.01?'rgba(52,212,138,.2)':myNet<-0.01?'rgba(240,86,106,.2)':'var(--br)';
    const vc=myNet>0.01?'var(--gr)':myNet<-0.01?'var(--rd)':'var(--mu)';
    const txt=myNet>0.01?'Te deben':myNet<-0.01?'Debés':'Saldado';
    bb.innerHTML=`<div style="background:${bg};border:1px solid ${bc};border-radius:12px;padding:11px 16px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:12px;color:var(--mu)">${txt} en este grupo</div>
      <div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:${vc}">${myNet>0.01?'+':myNet<-0.01?'-':''}${spSym()}${spFmt(Math.abs(myNet))}</div>
    </div>`;
  }
  // Scroll
  const scroll=document.getElementById('grp-scroll');
  if(!scroll) return; scroll.innerHTML='';
  if(grpTabActive==='expenses') renderGroupExpenses(scroll);
  else if(grpTabActive==='balances') renderGroupBalances(scroll);
  else renderGroupStats(scroll);
}

function renderGroupExpenses(container){
  const g=getGroup(curGroupId); if(!g) return;
  const exps=getGroupExpenses(curGroupId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!exps.length){
    container.innerHTML='<div class="empty-state"><span class="big">💸</span>Sin gastos.<br>Tocá + para agregar el primero.</div>';
    return;
  }
  exps.forEach(exp=>{
    const payer=getMemberName(curGroupId,exp.payerId);
    const isPayer=g.members.find(m=>m.id===exp.payerId&&m.isMe);
    const myShare=exp.shares.find(sh=>g.members.find(m=>m.id===sh.memberId&&m.isMe));
    const el=document.createElement('div'); el.className='sp-exp-item';
    const sharesHtml=exp.shares.map(sh=>{
      const isMe=g.members.find(m=>m.id===sh.memberId&&m.isMe);
      const isPayerChip=sh.memberId===exp.payerId;
      const cls=isPayerChip?'payer':isMe?'me':'';
      return `<div class="sp-share-chip ${cls}">${getMemberName(curGroupId,sh.memberId)}: ${spSym()}${spFmt(sh.amount)}</div>`;
    }).join('');
    // Badge "vos pagaste" o "te deben X"
    let statusBadge='';
    if(isPayer) statusBadge=`<span style="font-size:10px;background:var(--gd);color:var(--gr);padding:2px 7px;border-radius:6px;font-weight:500">Vos pagaste</span>`;
    else if(myShare) statusBadge=`<span style="font-size:10px;background:var(--rdd);color:var(--rd);padding:2px 7px;border-radius:6px;font-weight:500">Tu parte: ${spSym()}${spFmt(myShare.amount)}</span>`;
    el.innerHTML=`
      <div class="sp-exp-head">
        <div class="sp-exp-icon">${exp.isSettlement?'✅':(exp.emoji||'💸')}</div>
        <div style="flex:1;min-width:0">
          <div class="sp-exp-desc">${exp.desc||'Gasto'}${exp.isSettlement?' <span style="font-size:10px;color:var(--mu)">(pago)</span>':''}</div>
          <div class="sp-exp-meta">Pagó ${payer} · ${exp.date.slice(5,10).replace('-','/')}</div>
        </div>
        <div style="text-align:right">
          <div class="sp-exp-amt">${spSym()}${spFmt(exp.amount)}</div>
        </div>
      </div>
      ${statusBadge?`<div style="margin-bottom:6px">${statusBadge}</div>`:''}
      <div class="sp-exp-shares">${sharesHtml}</div>
      ${exp.note?`<div style="font-size:11px;color:var(--mu);margin-top:6px;padding-top:6px;border-top:1px solid var(--br)">💬 ${exp.note}</div>`:''}`;
    el.onclick=()=>openSplitExpDetail(exp.id);
    container.appendChild(el);
  });
}

function renderGroupBalances(container){
  const g=getGroup(curGroupId); if(!g) return;
  const bal=calcBalances(curGroupId);
  const exps=getGroupExpenses(curGroupId).filter(e=>!e.isSettlement);
  const totalSpent=exps.reduce((a,e)=>a+e.amount,0);

  // Resumen cards
  const sumEl=document.createElement('div');
  sumEl.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px';
  sumEl.innerHTML=`
    <div style="background:var(--bld);border:1px solid rgba(107,140,255,.2);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--bl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Total gastado</div>
      <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace;color:var(--bl)">${spSym()}${spFmt(totalSpent)}</div>
    </div>
    <div style="background:var(--s1);border:1px solid var(--br);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Por persona</div>
      <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace">${spSym()}${spFmt(g.members.length?totalSpent/g.members.length:0)}</div>
    </div>`;
  container.appendChild(sumEl);

  // Balance individual
  const h1=document.createElement('div'); h1.className='sec-hdr'; h1.style.marginBottom='10px';
  h1.innerHTML='<span class="sec-ttl">Balance individual</span>'; container.appendChild(h1);
  [...g.members].sort((a,b)=>(bal[b.id]?bal[b.id].net:0)-(bal[a.id]?bal[a.id].net:0)).forEach(m=>{
    const b=bal[m.id]||{net:0,paid:0,share:0};
    const vc=b.net>0.01?'var(--gr)':b.net<-0.01?'var(--rd)':'var(--mu)';
    const icon=b.net>0.01?'↑':b.net<-0.01?'↓':'=';
    const bgc=b.net>0.01?'var(--gd)':b.net<-0.01?'var(--rdd)':'var(--s2)';
    const el=document.createElement('div'); el.className='sp-bal-row';
    el.innerHTML=`
      <div class="sp-bal-person">
        <div style="width:36px;height:36px;border-radius:50%;background:${bgc};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:${vc}">${icon}</div>
        <div>
          <div style="font-size:13px;font-weight:500">${m.name}${m.isMe?' <span style="color:var(--mu);font-size:11px;font-weight:400">(vos)</span>':''}</div>
          <div style="font-size:10px;color:var(--mu)">Pagó ${spSym()}${spFmt(b.paid)} · Gastó ${spSym()}${spFmt(b.share)}</div>
        </div>
      </div>
      <div>
        <div class="sp-bal-amount" style="color:${vc};text-align:right">${b.net>0.01?'+':b.net<-0.01?'-':''}${spSym()}${spFmt(Math.abs(b.net))}</div>
        <div style="font-size:10px;color:var(--mu);text-align:right">${b.net>0.01?'le deben':b.net<-0.01?'debe':'saldado'}</div>
      </div>`;
    container.appendChild(el);
  });

  // Cómo saldar
  const debts=S.splitPrefs.simplify?simplifyDebts(bal):simplifyDebts(bal);
  const h2=document.createElement('div'); h2.className='sec-hdr'; h2.style.cssText='margin-bottom:12px;margin-top:8px';
  h2.innerHTML=`<span class="sec-ttl">Cómo saldar${S.splitPrefs.simplify?' (simplificado)':''}</span>`;
  container.appendChild(h2);

  if(!debts.length){
    const ok=document.createElement('div');
    ok.style.cssText='background:var(--gd);border:1px solid rgba(52,212,138,.2);border-radius:14px;padding:18px;text-align:center';
    ok.innerHTML='<div style="font-size:24px;margin-bottom:6px">🎉</div><div style="font-size:14px;font-weight:600;color:var(--gr)">¡Todo saldado!</div>';
    container.appendChild(ok);
  } else {
    if(S.splitPrefs.simplify){
      const info=document.createElement('div');
      info.style.cssText='font-size:11px;color:var(--mu);margin-bottom:12px;line-height:1.5;background:var(--s1);border-radius:10px;padding:10px 12px';
      info.textContent=`${debts.length} pago${debts.length!==1?'s':''} para saldar todas las deudas del grupo:`;
      container.appendChild(info);
    }
    debts.forEach(d=>{ container.appendChild(buildGroupDebtCard(d,g,curGroupId)); });
  }

  // Historial de pagos
  if(S.splitPrefs.showSettled){
    const settles=getGroupExpenses(curGroupId).filter(e=>e.isSettlement);
    if(settles.length){
      const h3=document.createElement('div'); h3.className='sec-hdr'; h3.style.cssText='margin-top:8px;margin-bottom:10px';
      h3.innerHTML='<span class="sec-ttl">Pagos registrados</span>'; container.appendChild(h3);
      settles.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(s=>{
        const fromN=getMemberName(curGroupId,s.payerId);
        const toN=s.shares[0]?getMemberName(curGroupId,s.shares[0].memberId):'?';
        const el=document.createElement('div');
        el.style.cssText='background:var(--gd);border:1px solid rgba(52,212,138,.15);border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:10px;margin-bottom:7px';
        el.innerHTML=`<div style="font-size:18px">✅</div>
          <div style="flex:1"><div style="font-size:12px;font-weight:500;color:var(--gr)">${fromN} le pagó a ${toN}</div>
          <div style="font-size:10px;color:var(--mu);margin-top:1px">${s.date.slice(0,10)}</div></div>
          <div style="font-size:13px;font-weight:600;font-family:'DM Mono',monospace;color:var(--gr)">${spSym()}${spFmt(s.amount)}</div>`;
        container.appendChild(el);
      });
    }
  }
}

function buildGroupDebtCard(d,g,gid){
  const fromName=getMemberName(gid,d.from);
  const toName=getMemberName(gid,d.to);
  const fromMe=g.members.find(m=>m.id===d.from&&m.isMe);
  const toMe=g.members.find(m=>m.id===d.to&&m.isMe);
  const el=document.createElement('div');
  el.className='sp-debt-card'+(fromMe?' fromme':toMe?' tome':'');
  el.style.marginBottom='10px';

  // Diseño con avatares
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:${fromMe?'12px':'6px'}">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px">
        <div style="width:40px;height:40px;border-radius:50%;background:${fromMe?'var(--rdd)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:${fromMe?'var(--rd)':'var(--mu)'}">
          ${fromName[0].toUpperCase()}
        </div>
        <div style="font-size:11px;font-weight:500;color:${fromMe?'var(--rd)':'var(--tx)'};text-align:center;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fromMe?'Vos':fromName}</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
        <div style="font-size:15px;font-weight:700;font-family:'DM Mono',monospace;color:${fromMe?'var(--rd)':'var(--mu)'}">
          ${spSym()}${spFmt(d.amount)}
        </div>
        <div style="display:flex;align-items:center;width:100%;gap:0">
          <div style="flex:1;height:2px;background:${fromMe?'var(--rd)':'var(--mu)'};border-radius:1px;opacity:.5"></div>
          <div style="color:${fromMe?'var(--rd)':'var(--mu)'};font-size:16px;margin-top:-2px">›</div>
        </div>
        <div style="font-size:10px;color:var(--mu)">le paga a</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px">
        <div style="width:40px;height:40px;border-radius:50%;background:${toMe?'var(--gd)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:${toMe?'var(--gr)':'var(--mu)'}">
          ${toName[0].toUpperCase()}
        </div>
        <div style="font-size:11px;font-weight:500;color:${toMe?'var(--gr)':'var(--tx)'};text-align:center;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${toMe?'Vos':toName}</div>
      </div>
    </div>`;

  if(fromMe){
    const btn=document.createElement('button');
    btn.style.cssText='width:100%;padding:11px;border-radius:12px;background:var(--gr);border:none;color:#0f0f13;font-size:13px;font-weight:600;cursor:pointer';
    btn.textContent='💸 Registrar pago';
    btn.onclick=()=>openSettleModal(gid,d.from,d.to,d.amount);
    el.appendChild(btn);
  } else if(toMe){
    const note=document.createElement('div');
    note.style.cssText='font-size:11px;color:var(--mu);text-align:center;padding-top:4px;margin-bottom:8px';
    note.textContent='Esperando que '+fromName+' te pague';
    el.appendChild(note);
    const markBtn=document.createElement('button');
    markBtn.style.cssText='width:100%;padding:10px;border-radius:12px;background:var(--gd);border:1px solid rgba(52,212,138,.25);color:var(--gr);font-size:13px;font-weight:600;cursor:pointer';
    markBtn.textContent='✅ Marcar como recibido';
    markBtn.onclick=()=>markDebtReceived(gid,d.from,d.to,d.amount);
    el.appendChild(markBtn);
  }
  return el;
}

function renderGroupStats(container){
  const g=getGroup(curGroupId); if(!g) return;
  const exps=getGroupExpenses(curGroupId).filter(e=>!e.isSettlement);
  if(!exps.length){ container.innerHTML='<div class="empty-state"><span class="big">📊</span>Sin datos todavía.</div>'; return; }

  const total=exps.reduce((a,e)=>a+e.amount,0);
  // Resumen
  const sum=document.createElement('div');
  sum.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px';
  sum.innerHTML=`
    <div style="background:var(--bld);border:1px solid rgba(107,140,255,.2);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--bl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Total</div>
      <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace;color:var(--bl)">${spSym()}${spFmt(total)}</div>
    </div>
    <div style="background:var(--s1);border:1px solid var(--br);border-radius:14px;padding:14px;text-align:center">
      <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Por persona</div>
      <div style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace">${spSym()}${spFmt(total/g.members.length)}</div>
    </div>`;
  container.appendChild(sum);

  // Quién pagó más
  const h1=document.createElement('div'); h1.className='sec-hdr'; h1.style.marginBottom='12px';
  h1.innerHTML='<span class="sec-ttl">Quién pagó más</span>'; container.appendChild(h1);
  const paid={};
  g.members.forEach(m=>{ paid[m.id]=0; });
  exps.forEach(e=>{ paid[e.payerId]=(paid[e.payerId]||0)+e.amount; });
  const maxP=Math.max(...Object.values(paid),1);
  Object.entries(paid).sort((a,b)=>b[1]-a[1]).forEach(([mid,amt])=>{
    const m=g.members.find(x=>x.id===mid); if(!m) return;
    const el=document.createElement('div'); el.className='sp-stat-bar';
    el.innerHTML=`
      <div class="sp-stat-label">${m.name}</div>
      <div class="sp-stat-track"><div class="sp-stat-fill" style="width:0%;background:var(--bl)" data-pct="${Math.round(amt/maxP*100)}"></div></div>
      <div class="sp-stat-val">${spSym()}${spFmt(amt)}</div>`;
    container.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const f=el.querySelector('.sp-stat-fill'); if(f) f.style.width=f.dataset.pct+'%';
    }));
  });

  // Por categoría
  const h2=document.createElement('div'); h2.className='sec-hdr'; h2.style.cssText='margin-bottom:12px;margin-top:8px';
  h2.innerHTML='<span class="sec-ttl">Por categoría</span>'; container.appendChild(h2);
  const byCat={};
  exps.forEach(e=>{ const cat=e.cat||'Sin categoría'; byCat[cat]=(byCat[cat]||0)+e.amount; });
  const maxC=Math.max(...Object.values(byCat),1);
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([cat,amt])=>{
    const cd=findCat('expense',cat);
    const el=document.createElement('div'); el.className='sp-stat-bar';
    el.innerHTML=`
      <div class="sp-stat-label">${cd?cd.e+' ':''} ${cat}</div>
      <div class="sp-stat-track"><div class="sp-stat-fill" style="width:0%;background:${cd?cd.c:'var(--bl)'}" data-pct="${Math.round(amt/maxC*100)}"></div></div>
      <div class="sp-stat-val">${spSym()}${spFmt(amt)}</div>`;
    container.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const f=el.querySelector('.sp-stat-fill'); if(f) f.style.width=f.dataset.pct+'%';
    }));
  });

  // Meses activos
  const months={};
  exps.forEach(e=>{
    const d=new Date(e.date);
    const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    months[key]=(months[key]||0)+e.amount;
  });
  if(Object.keys(months).length>1){
    const h3=document.createElement('div'); h3.className='sec-hdr'; h3.style.cssText='margin-bottom:12px;margin-top:8px';
    h3.innerHTML='<span class="sec-ttl">Por mes</span>'; container.appendChild(h3);
    const maxM=Math.max(...Object.values(months),1);
    Object.entries(months).sort().reverse().slice(0,6).forEach(([key,amt])=>{
      const [y,m]=key.split('-');
      const label=new Date(parseInt(y),parseInt(m)-1).toLocaleString('es-AR',{month:'short',year:'2-digit'});
      const el=document.createElement('div'); el.className='sp-stat-bar';
      el.innerHTML=`
        <div class="sp-stat-label">${label}</div>
        <div class="sp-stat-track"><div class="sp-stat-fill" style="width:0%;background:var(--gr)" data-pct="${Math.round(amt/maxM*100)}"></div></div>
        <div class="sp-stat-val">${spSym()}${spFmt(amt)}</div>`;
      container.appendChild(el);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const f=el.querySelector('.sp-stat-fill'); if(f) f.style.width=f.dataset.pct+'%';
      }));
    });
  }
}

// ═══ DETALLE GASTO SPLIT ══════════════════════════════

let _currentSplitExpIdGlobal=null;

function openSplitExpDetail(expId){
  _currentSplitExpIdGlobal=expId;
  const exp=S.split.expenses.find(e=>e.id===expId); if(!exp) return;
  const g=getGroup(exp.groupId);
  const scroll=document.getElementById('split-exp-detail-scroll');
  if(!scroll) return; scroll.innerHTML='';

  // Header
  const hdr=document.createElement('div');
  hdr.style.cssText='background:var(--bld);border:1px solid rgba(107,140,255,.2);border-radius:18px;padding:20px;margin-bottom:16px;text-align:center';
  hdr.innerHTML=`
    <div style="font-size:38px;margin-bottom:10px">${exp.isSettlement?'✅':(exp.emoji||'💸')}</div>
    <div style="font-size:24px;font-weight:700;font-family:'DM Mono',monospace;color:var(--bl)">${spSym()}${spFmt(exp.amount)}</div>
    <div style="font-size:15px;font-weight:500;margin-top:6px">${exp.desc||'Gasto'}</div>
    <div style="font-size:11px;color:var(--mu);margin-top:4px">${g?g.name:''} · ${exp.date.slice(0,10)} · Pagó <strong>${getMemberName(exp.groupId,exp.payerId)}</strong></div>`;
  scroll.appendChild(hdr);

  // División
  const dh=document.createElement('div'); dh.className='sec-hdr'; dh.style.marginBottom='10px';
  dh.innerHTML='<span class="sec-ttl">División</span>'; scroll.appendChild(dh);
  exp.shares.forEach(sh=>{
    const mname=getMemberName(exp.groupId,sh.memberId);
    const isMe=g&&g.members.find(m=>m.id===sh.memberId&&m.isMe);
    const isPayer=sh.memberId===exp.payerId;
    const el=document.createElement('div');
    el.style.cssText='background:var(--s1);border:1px solid var(--br);border-radius:13px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
    el.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:50%;background:${isMe?'var(--bld)':isPayer?'var(--gd)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${isMe?'var(--bl)':isPayer?'var(--gr)':'var(--mu)'}">
          ${mname[0].toUpperCase()}
        </div>
        <div>
          <div style="font-size:13px;font-weight:500">${mname}${isMe?' (vos)':''}${isPayer?' 💳':''}</div>
          <div style="font-size:10px;color:var(--mu)">${isPayer?'Pagó el total':isMe?'Tu parte':'Su parte'}</div>
        </div>
      </div>
      <div style="font-size:15px;font-weight:600;font-family:'DM Mono',monospace;color:${isPayer?'var(--gr)':'var(--rd)'}">
        ${isPayer?'+':'-'}${spSym()}${spFmt(sh.amount)}
      </div>`;
    scroll.appendChild(el);
  });

  // Nota
  if(exp.note){
    const ne=document.createElement('div');
    ne.style.cssText='background:var(--s2);border-radius:12px;padding:11px 14px;margin-bottom:12px;font-size:12px;color:var(--mu)';
    ne.textContent='💬 '+exp.note; scroll.appendChild(ne);
  }

  // Comentarios
  if(exp.comments&&exp.comments.length){
    const ch=document.createElement('div'); ch.className='sec-hdr'; ch.style.cssText='margin-top:4px;margin-bottom:10px';
    ch.innerHTML='<span class="sec-ttl">Comentarios</span>'; scroll.appendChild(ch);
    exp.comments.forEach(cm=>{
      const el=document.createElement('div');
      el.style.cssText='background:var(--s2);border-radius:10px;padding:9px 12px;margin-bottom:6px';
      el.innerHTML=`<div style="font-size:11px;font-weight:600;color:var(--bl)">${cm.author}</div><div style="font-size:12px;line-height:1.5;margin-top:2px">${cm.text}</div><div style="font-size:10px;color:var(--mu);margin-top:2px">${cm.date.slice(0,10)}</div>`;
      scroll.appendChild(el);
    });
  }

  // Agregar comentario
  const ac=document.createElement('div'); ac.style.cssText='display:flex;gap:8px;padding:8px 0 16px';
  ac.innerHTML=`<input class="note-inp" type="text" placeholder="Agregar comentario..." id="new-comment-inp" maxlength="120" style="flex:1;margin:0">
    <button onclick="addSplitComment('${expId}')" style="padding:0 14px;border-radius:12px;background:var(--bld);color:var(--bl);border:1px solid rgba(107,140,255,.3);font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">Enviar</button>`;
  scroll.appendChild(ac);

  // Eliminar
  if(!exp.isSettlement){
    const del=document.createElement('div'); del.style.paddingTop='4px';
    del.innerHTML=`<button onclick="deleteSplitExpense('${expId}')" style="width:100%;padding:13px;border-radius:14px;background:var(--rdd);border:1px solid rgba(240,86,106,.3);color:var(--rd);font-size:13px;font-weight:600;cursor:pointer">Eliminar gasto</button>`;
    scroll.appendChild(del);
  }

  goTo('s-split-exp-detail');
}

function editSplitExpense(){
  showToast('✏️ Edición próximamente');
}

function addSplitComment(expId){
  const inp=document.getElementById('new-comment-inp');
  const txt=inp?inp.value.trim():''; if(!txt) return;
  const exp=S.split.expenses.find(e=>e.id===expId); if(!exp) return;
  if(!exp.comments) exp.comments=[];
  exp.comments.push({author:ME_NAME(),text:txt,date:new Date().toISOString()});
  saveState(); inp.value=''; openSplitExpDetail(expId); showToast('💬 Comentario agregado');
}

function deleteSplitExpense(expId){
  showConfirm('Eliminar gasto','¿Eliminar este gasto? Los balances del grupo se actualizarán.',()=>{
    S.split.expenses=S.split.expenses.filter(e=>e.id!==expId);
    saveState(); goBack(); renderGroupDetail(); showToast('🗑️ Gasto eliminado');
  });
}

// ═══ GRUPOS ═══════════════════════════════════════════

function openNewGroup(){
  editingGroupId=null; groupEmoji='👥'; groupMembers=[];
  const titleEl=document.getElementById('new-group-title');
  const nameEl=document.getElementById('group-name-inp');
  const saveBtn=document.getElementById('save-group-btn');
  const delBtn=document.getElementById('delete-group-btn');
  const emojiBtn=document.getElementById('group-emoji-btn');
  const emojiPicker=document.getElementById('group-emoji-picker');
  if(titleEl) titleEl.textContent='Nuevo grupo';
  if(nameEl) nameEl.value='';
  if(saveBtn) saveBtn.textContent='Crear grupo';
  if(delBtn) delBtn.style.display='none';
  if(emojiBtn) emojiBtn.textContent='👥';
  if(emojiPicker) emojiPicker.style.display='none';
  renderGroupMembersList();
  document.getElementById('new-group-modal').classList.remove('hidden');
}

function openGroupSettings(){
  const g=getGroup(curGroupId); if(!g) return;
  editingGroupId=curGroupId;
  groupEmoji=g.emoji||'👥';
  groupMembers=JSON.parse(JSON.stringify(g.members));
  const titleEl=document.getElementById('new-group-title');
  const nameEl=document.getElementById('group-name-inp');
  const saveBtn=document.getElementById('save-group-btn');
  const delBtn=document.getElementById('delete-group-btn');
  const emojiBtn=document.getElementById('group-emoji-btn');
  const emojiPicker=document.getElementById('group-emoji-picker');
  if(titleEl) titleEl.textContent='Editar grupo';
  if(nameEl) nameEl.value=g.name;
  if(saveBtn) saveBtn.textContent='Guardar cambios';
  if(delBtn) delBtn.style.display='block';
  if(emojiBtn) emojiBtn.textContent=groupEmoji;
  if(emojiPicker) emojiPicker.style.display='none';
  renderGroupMembersList();
  document.getElementById('new-group-modal').classList.remove('hidden');
}

function closeNewGroup(){ document.getElementById('new-group-modal').classList.add('hidden'); }

function renderGroupEmojiRow(){
  const row=document.getElementById('group-emoji-row'); if(!row) return; row.innerHTML='';
  GROUP_EMOJIS.forEach(e=>{
    const sel=e===groupEmoji;
    const b=document.createElement('div');
    b.style.cssText='width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:all .15s;border:2px solid '+(sel?'var(--bl)':'transparent')+';background:'+(sel?'var(--bld)':'var(--s2)');
    b.textContent=e;
    b.onclick=()=>{ groupEmoji=e; renderGroupEmojiRow(); };
    row.appendChild(b);
  });
  const btn=document.getElementById('group-emoji-btn');
  if(btn) btn.textContent=groupEmoji;
}

function renderGroupMembersList(){
  const list=document.getElementById('group-members-list'); if(!list) return; list.innerHTML='';
  // "Yo" siempre primero
  const meEl=document.createElement('div');
  meEl.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--br)';
  meEl.innerHTML=`
    <div style="width:32px;height:32px;border-radius:50%;background:var(--gd);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--gr)">
      ${ME_NAME()[0].toUpperCase()}
    </div>
    <span style="flex:1;font-size:13px;font-weight:500">${ME_NAME()}</span>
    <span style="font-size:11px;color:var(--mu);background:var(--gd);padding:2px 8px;border-radius:7px;color:var(--gr)">Vos</span>`;
  list.appendChild(meEl);
  // Otros miembros
  groupMembers.filter(m=>!m.isMe).forEach(m=>{
    const el=document.createElement('div');
    el.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--br)';
    el.innerHTML=`
      <div style="width:32px;height:32px;border-radius:50%;background:var(--bld);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--bl)">
        ${m.name[0].toUpperCase()}
      </div>
      <span style="flex:1;font-size:13px;font-weight:500">${m.name}</span>
      <button onclick="removeMember('${m.id}')" style="width:28px;height:28px;border-radius:50%;background:var(--rdd);border:none;color:var(--rd);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">×</button>`;
    list.appendChild(el);
  });
  if(!groupMembers.filter(m=>!m.isMe).length){
    const empty=document.createElement('div');
    empty.style.cssText='padding:10px 0;font-size:12px;color:var(--mu);text-align:center';
    empty.textContent='Sin integrantes todavía. Agregá al menos uno.';
    list.appendChild(empty);
  }
}

function addMember(){
  const inp=document.getElementById('new-member-inp');
  const name=inp.value.trim(); if(!name){ return; }
  if(name.toLowerCase()===ME_NAME().toLowerCase()){ showToast('⚠️ Ya estás en el grupo'); inp.value=''; return; }
  if(groupMembers.some(m=>m.name.toLowerCase()===name.toLowerCase())){ showToast('⚠️ Ese nombre ya existe'); inp.value=''; return; }
  groupMembers.push({id:uid(),name,isMe:false});
  inp.value=''; renderGroupMembersList();
}

function removeMember(id){
  // No se puede remover si tiene gastos asignados (si es edición)
  if(editingGroupId){
    const hasExpenses=getGroupExpenses(editingGroupId).some(e=>
      e.payerId===id || e.shares.some(s=>s.memberId===id)
    );
    if(hasExpenses){ showToast('⚠️ No se puede eliminar: tiene gastos asignados'); return; }
  }
  groupMembers=groupMembers.filter(m=>m.id!==id);
  renderGroupMembersList();
}

function saveGroup(){
  const name=document.getElementById('group-name-inp').value.trim();
  if(!name){ showToast('⚠️ Ingresá un nombre para el grupo'); return; }
  if(groupMembers.filter(m=>!m.isMe).length===0){ showToast('⚠️ Agregá al menos un integrante'); return; }
  const allMembers=[{id:uid(),name:ME_NAME(),isMe:true},...groupMembers.filter(m=>!m.isMe)];
  if(editingGroupId){
    const g=getGroup(editingGroupId);
    if(g){
      g.name=name; g.emoji=groupEmoji;
      // Mantener IDs existentes, solo agregar nuevos
      const existingIds=g.members.map(m=>m.id);
      const newMembers=allMembers.filter(m=>m.isMe||!existingIds.includes(m.id));
      // Actualizar nombre de "Yo"
      const meIdx=g.members.findIndex(m=>m.isMe);
      if(meIdx>=0) g.members[meIdx].name=ME_NAME();
      // Agregar nuevos
      newMembers.filter(m=>!m.isMe).forEach(m=>{
        if(!g.members.find(x=>x.id===m.id)) g.members.push(m);
      });
      // Remover los que ya no están
      const newIds=groupMembers.filter(m=>!m.isMe).map(m=>m.id);
      g.members=g.members.filter(m=>m.isMe||newIds.includes(m.id));
    }
    showToast('✅ Grupo actualizado');
  } else {
    S.split.groups.push({id:uid(),name,emoji:groupEmoji,members:allMembers,createdAt:new Date().toISOString()});
    showToast('✅ Grupo "'+name+'" creado');
  }
  saveState(); closeNewGroup(); renderSplitContent();
}

function deleteGroup(){
  showConfirm('Eliminar grupo','¿Eliminar "'+getGroup(curGroupId)?.name+'" y todos sus gastos? No se puede deshacer.',()=>{
    S.split.groups=S.split.groups.filter(g=>g.id!==curGroupId);
    S.split.expenses=S.split.expenses.filter(e=>e.groupId!==curGroupId);
    saveState(); closeNewGroup(); goBack(); renderSplitContent();
    showToast('🗑️ Grupo eliminado');
  });
}

function inviteMemberByEmail(){
  showToast('✉️ Invitaciones por email: próximamente');
}

// ═══ AGREGAR GASTO SPLIT ══════════════════════════════

function buildSplitCatGrid(){
  buildCatGrid('split-cat-grid','expense',splitSelCat,cn=>{
    splitSelCat=cn;
    const cd=findCat('expense',cn);
    const icon=document.getElementById('split-exp-cat-icon');
    if(icon) icon.textContent=cd?cd.e:'💸';
    updateSplitCatActions();
  });
  const grid=document.getElementById('split-cat-grid'); if(!grid) return;
  const add=document.createElement('div'); add.className='cat-btn';
  add.innerHTML='<div class="ce">➕</div><div class="cn" style="color:var(--mu)">Nueva</div>';
  add.onclick=()=>openNewCat('expense');
  grid.appendChild(add);
  updateSplitCatActions();
}

function updateSplitCatActions(){
  const area=document.getElementById('split-cat-actions'); if(!area) return;
  if(!splitSelCat){ area.style.display='none'; return; }
  const cd=findCat('expense',splitSelCat); if(!cd){ area.style.display='none'; return; }
  area.style.display='flex';
  const lbl=document.getElementById('split-sel-cat-lbl');
  if(lbl) lbl.textContent=cd.e+' '+cd.n;
}

function editSelectedSplitCat(){
  const cd=findCat('expense',splitSelCat); if(!cd) return;
  openEditCat('expense',cd.id);
}

function openAddSplitExpense(){
  const g=getGroup(curGroupId); if(!g){ showToast('⚠️ Grupo no encontrado'); return; }
  // Reset estado
  splitAmtStr='0'; splitSelCat=null; splitMemberShares={};
  splitMethod=S.splitPrefs.defaultMethod||'equal';
  // Participantes: todos por defecto
  splitParticipantIds=g.members.map(m=>m.id);
  // Quién pagó: yo por defecto
  const me=g.members.find(m=>m.isMe);
  splitPayerId=me?me.id:g.members[0].id;

  // Actualizar UI
  document.getElementById('split-exp-title').textContent='Nuevo gasto';
  document.getElementById('split-desc-inp').value='';
  document.getElementById('split-note-inp').value='';
  document.getElementById('split-curr-lbl').textContent=S.currency.code;
  document.getElementById('split-dec-key').textContent=getSep();
  document.getElementById('split-cat-label').textContent='';

  // Método activo
  ['equal','pct','exact','shares'].forEach(m=>{
    const el=document.getElementById('sm-'+m);
    if(el) el.classList.toggle('active',m===splitMethod);
  });

  // Categorías
  buildSplitCatGrid();

  // Auto-personal según preferencias
  const toggle=document.getElementById('split-to-personal');
  if(toggle){
    if(S.splitPrefs.autoPersonal) toggle.classList.add('on');
    else toggle.classList.remove('on');
  }

  renderSplitPayerRow();
  renderSplitParticipants();
  updateSplitAmt();
  renderSplitDivision();
  goTo('s-split-expense');
}

function renderSplitPayerRow(){
  const g=getGroup(curGroupId); if(!g) return;
  const row=document.getElementById('split-payer-row'); if(!row) return; row.innerHTML='';
  g.members.forEach(m=>{
    const sel=m.id===splitPayerId;
    const btn=document.createElement('div');
    btn.className='sp-payer-btn'+(sel?' active':'');
    btn.innerHTML=`
      <div style="width:26px;height:26px;border-radius:50%;background:${sel?'var(--gr)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${sel?'#0f0f13':'var(--mu)'}">
        ${m.name[0].toUpperCase()}
      </div>
      <span class="sp-payer-name" style="color:${sel?'var(--gr)':'var(--mu)'}">${m.isMe?'Yo':m.name}</span>
      ${sel?'<span style="font-size:12px;color:var(--gr)">✓</span>':''}`;
    btn.onclick=()=>{ splitPayerId=m.id; renderSplitPayerRow(); renderSplitDivision(); };
    row.appendChild(btn);
  });
}

function renderSplitParticipants(){
  const g=getGroup(curGroupId); if(!g) return;
  const row=document.getElementById('split-participants-row'); if(!row) return; row.innerHTML='';
  g.members.forEach(m=>{
    const sel=splitParticipantIds.includes(m.id);
    const btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;cursor:pointer;border:2px solid '+(sel?'var(--bl)':'var(--br)')+';background:'+(sel?'var(--bld)':'var(--s1)')+';transition:all .15s';
    btn.innerHTML=`
      <div style="width:24px;height:24px;border-radius:50%;background:${sel?'var(--bl)':'var(--s2)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${sel?'#fff':'var(--mu)'}">
        ${m.name[0].toUpperCase()}
      </div>
      <span style="font-size:13px;font-weight:500;color:${sel?'var(--bl)':'var(--mu)'}">${m.isMe?'Yo':m.name}</span>
      ${sel?'<span style="font-size:11px;color:var(--bl)">✓</span>':''}`;
    btn.onclick=()=>{
      if(sel){
        if(splitParticipantIds.length<=2){ showToast('⚠️ Mínimo 2 participantes'); return; }
        splitParticipantIds=splitParticipantIds.filter(id=>id!==m.id);
      } else {
        splitParticipantIds.push(m.id);
      }
      // Si el payer no participa, hacerlo participar
      if(!splitParticipantIds.includes(splitPayerId)){
        splitPayerId=splitParticipantIds[0];
        renderSplitPayerRow();
      }
      renderSplitParticipants();
      renderSplitDivision();
    };
    row.appendChild(btn);
  });
}

function setSplitMethod(method){
  splitMethod=method;
  ['equal','pct','exact','shares'].forEach(m=>{
    const el=document.getElementById('sm-'+m);
    if(el) el.classList.toggle('active',m===method);
  });
  renderSplitDivision();
}

function renderSplitDivision(){
  const g=getGroup(curGroupId); if(!g) return;
  const total=normAmt(splitAmtStr);
  const participants=g.members.filter(m=>splitParticipantIds.includes(m.id));
  const container=document.getElementById('split-members-division');
  if(!container) return; container.innerHTML='';
  if(!participants.length){
    container.innerHTML='<div style="padding:10px;text-align:center;font-size:12px;color:var(--mu)">Seleccioná participantes arriba</div>';
    return;
  }
  const shares=calcSplitShares(total,participants,splitMethod,splitMemberShares);
  participants.forEach((m)=>{
    const sh=shares.find(s=>s.memberId===m.id)||{amount:0};
    const row=document.createElement('div'); row.className='sp-div-row';
    let inputHtml='';
    if(splitMethod==='pct'){
      const v=splitMemberShares[m.id]!==undefined?splitMemberShares[m.id]:Math.round(100/participants.length);
      inputHtml=`<input type="number" value="${v}" min="0" max="100" style="width:55px;background:var(--s2);border:1px solid var(--br);border-radius:8px;padding:6px 8px;color:var(--tx);font-size:13px;text-align:right;outline:none" oninput="splitMemberShares['${m.id}']=+this.value;renderSplitDivision()"><span style="font-size:12px;color:var(--mu);margin-left:2px">%</span>`;
    } else if(splitMethod==='exact'){
      const v=splitMemberShares[m.id]!==undefined?splitMemberShares[m.id]:'';
      inputHtml=`<input type="number" value="${v}" min="0" placeholder="0" style="width:75px;background:var(--s2);border:1px solid var(--br);border-radius:8px;padding:6px 8px;color:var(--tx);font-size:13px;text-align:right;outline:none" oninput="splitMemberShares['${m.id}']=+this.value;renderSplitDivision()">`;
    } else if(splitMethod==='shares'){
      const v=splitMemberShares[m.id]||1;
      inputHtml=`<input type="number" value="${v}" min="1" style="width:55px;background:var(--s2);border:1px solid var(--br);border-radius:8px;padding:6px 8px;color:var(--tx);font-size:13px;text-align:right;outline:none" oninput="splitMemberShares['${m.id}']=+this.value;renderSplitDivision()"><span style="font-size:12px;color:var(--mu);margin-left:2px">×</span>`;
    } else {
      inputHtml=`<span class="sp-div-amt">${spSym()}${spFmt(sh.amount)}</span>`;
    }
    row.innerHTML=`
      <div style="width:28px;height:28px;border-radius:50%;background:${m.isMe?'var(--gd)':'var(--bld)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${m.isMe?'var(--gr)':'var(--bl)'};flex-shrink:0">
        ${m.name[0].toUpperCase()}
      </div>
      <div style="flex:1">
        <div class="sp-div-name">${m.isMe?'Yo':m.name}</div>
        ${splitMethod!=='equal'?`<div class="sp-div-sub">${spSym()}${spFmt(sh.amount)}</div>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:4px">${inputHtml}</div>`;
    container.appendChild(row);
  });

  // Total check para métodos manuales
  if(splitMethod==='exact'||splitMethod==='pct'){
    const totalShares=shares.reduce((a,s)=>a+s.amount,0);
    const diff=Math.abs(totalShares-total);
    if(diff>0.1&&total>0){
      const warn=document.createElement('div');
      warn.style.cssText='padding:8px 12px;background:var(--rdd);border-radius:9px;font-size:11px;color:var(--rd);margin-top:6px;text-align:center';
      const diffText=splitMethod==='pct'?`${Math.round((totalShares/total)*100)}% asignado`:`Diferencia: ${spSym()}${spFmt(diff)}`;
      warn.textContent='⚠️ '+diffText;
      container.appendChild(warn);
    }
  }
}

// Teclado numérico Split
function snp(k){
  const sep=getSep();
  if(k==='del'){ splitAmtStr=splitAmtStr.length>1?splitAmtStr.slice(0,-1):'0'; }
  else if(k==='dec'){ if(!splitAmtStr.includes(sep)) splitAmtStr+=sep; }
  else { if(splitAmtStr==='0') splitAmtStr=k; else if(splitAmtStr.replace(/[^0-9]/g,'').length<12) splitAmtStr+=k; }
  updateSplitAmt(); renderSplitDivision();
  updateSplitNumpadPreview();
}

function updateSplitAmt(){
  const sep=getSep();
  const decKey=document.getElementById('split-dec-key');
  if(decKey) decKey.textContent=sep;
  const raw=splitAmtStr.replace(',','.');
  const parts=raw.split('.');
  const intFmt=isNaN(parseInt(parts[0]))?'0':parseInt(parts[0]).toLocaleString('es-AR');
  const decPart=parts.length>1?(sep+parts[1]):'';
  const disp=document.getElementById('split-amt-display');
  if(disp) disp.innerHTML=intFmt+decPart+'<span class="amt-cur"></span>';
}

function saveSplitExpense(){
  const g=getGroup(curGroupId); if(!g){ showToast('⚠️ Grupo no encontrado'); return; }
  const total=normAmt(splitAmtStr);
  if(total<=0){ showToast('⚠️ Ingresá un monto'); return; }
  if(!splitSelCat){ showToast('⚠️ Seleccioná una categoría'); return; }
  const participants=g.members.filter(m=>splitParticipantIds.includes(m.id));
  if(!participants.length){ showToast('⚠️ Seleccioná participantes'); return; }
  const desc=document.getElementById('split-desc-inp').value.trim();
  const note=document.getElementById('split-note-inp').value.trim();
  const toPersonal=document.getElementById('split-to-personal').classList.contains('on');
  const shares=calcSplitShares(total,participants,splitMethod,splitMemberShares);
  // Validar que los montos suman correctamente
  if(splitMethod==='exact'){
    const sum=shares.reduce((a,s)=>a+s.amount,0);
    if(Math.abs(sum-total)>0.1){ showToast('⚠️ Los montos exactos no suman al total'); return; }
  }
  const catData=splitSelCat?findCat('expense',splitSelCat):null;
  const exp={
    id:uid(), groupId:curGroupId, amount:total,
    desc, cat:splitSelCat||'', note,
    payerId:splitPayerId, method:splitMethod, shares,
    date:new Date().toISOString(),
    emoji:catData?catData.e:'💸', comments:[], isSettlement:false,
  };
  S.split.expenses.push(exp);
  // Agregar al historial personal
  if(toPersonal){
    const me=g.members.find(m=>m.isMe);
    const myShare=me?shares.find(sh=>sh.memberId===me.id):null;
    const isPayer=splitPayerId===(me?me.id:null);
    if(myShare||isPayer){
      S.txs.unshift({
        id:uid(), type:'expense',
        amount:isPayer?total:(myShare?myShare.amount:0),
        cat:splitSelCat||'', note:desc+' · Split',
        date:new Date().toISOString(), isSplit:true, splitRef:exp.id,
      });
    }
  }
  saveState();
  showToast('✅ '+spSym()+spFmt(total)+' agregado al grupo');
  goBack(); renderGroupDetail();
}

// ═══ LIQUIDAR DEUDA ═══════════════════════════════════

function openSettleModal(gid,fromId,toId,amount){
  settleData={gid,fromId,toId,amount};
  const fromName=getMemberName(gid,fromId);
  const toName=getMemberName(gid,toId);
  // Avatares
  const fa=document.getElementById('settle-from-avatar');
  const ta=document.getElementById('settle-to-avatar');
  const fn=document.getElementById('settle-from-name');
  const tn=document.getElementById('settle-to-name');
  if(fa) fa.textContent=fromName[0].toUpperCase();
  if(ta) ta.textContent=toName[0].toUpperCase();
  if(fn) fn.textContent=fromName;
  if(tn) tn.textContent=toName;
  const info=document.getElementById('settle-info');
  if(info) info.innerHTML=`<strong>${fromName}</strong> le paga <strong style="color:var(--gr)">${toName}</strong><br><span style="font-size:12px;color:var(--mu)">Deuda a saldar: </span><strong style="font-family:'DM Mono',monospace">${spSym()}${spFmt(amount)}</strong>`;
  const amtInp=document.getElementById('settle-amt-inp');
  if(amtInp) amtInp.value=amount;
  document.getElementById('settle-modal').classList.remove('hidden');
}

function closeSettleModal(){
  document.getElementById('settle-modal').classList.add('hidden');
  settleData=null;
}

function confirmSettle(){
  if(!settleData) return;
  const amtInp=document.getElementById('settle-amt-inp');
  const amt=parseFloat(amtInp?amtInp.value:0)||0;
  if(amt<=0){ showToast('⚠️ Ingresá un monto válido'); return; }
  const toPersonal=document.getElementById('settle-to-personal').classList.contains('on');
  const g=getGroup(settleData.gid);
  const fromName=getMemberName(settleData.gid,settleData.fromId);
  const toName=getMemberName(settleData.gid,settleData.toId);
  // Registrar como gasto de tipo "pago" en el grupo
  S.split.expenses.push({
    id:uid(), groupId:settleData.gid, amount:amt,
    desc:`${fromName} → ${toName}`,
    cat:'', note:'Liquidación de deuda',
    payerId:settleData.fromId, method:'exact',
    shares:[{memberId:settleData.toId,amount:amt}],
    date:new Date().toISOString(), emoji:'💸',
    comments:[], isSettlement:true,
  });
  // Al historial personal
  if(toPersonal&&g){
    const isMe=g.members.find(m=>m.id===settleData.fromId&&m.isMe);
    if(isMe){
      S.txs.unshift({
        id:uid(), type:'expense', amount:amt,
        cat:'', note:'Pago a '+toName+' (Split)',
        date:new Date().toISOString(), isSplit:true,
      });
    }
  }
  saveState();
  closeSettleModal();
  renderGroupDetail(); renderSplitContent();
  showToast('✅ Pago de '+spSym()+spFmt(amt)+' registrado');
}

// ═══ SETTINGS DE SPLIT ════════════════════════════════

function renderSplitSettings(){
  const prefs=S.splitPrefs||{simplify:true,showSettled:true,autoPersonal:false,defaultMethod:'equal'};
  // Toggles
  ['simplify','showSettled','autoPersonal'].forEach(key=>{
    const el=document.getElementById('sp-pref-'+key);
    if(!el) return;
    if(prefs[key]) el.classList.add('on'); else el.classList.remove('on');
  });
  // Método por defecto
  ['equal','pct','exact','shares'].forEach(m=>{
    const el=document.getElementById('sp-def-'+m+'-check');
    if(el) el.style.display=prefs.defaultMethod===m?'block':'none';
  });
}

function toggleSplitPref(key){
  if(!S.splitPrefs) S.splitPrefs={simplify:true,showSettled:true,autoPersonal:false,defaultMethod:'equal'};
  S.splitPrefs[key]=!S.splitPrefs[key];
  saveState();
  renderSplitSettings();
  showToast(S.splitPrefs[key]?'✅ Activado':'Desactivado');
}

function setSplitDefaultMethod(method){
  if(!S.splitPrefs) S.splitPrefs={simplify:true,showSettled:true,autoPersonal:false,defaultMethod:'equal'};
  S.splitPrefs.defaultMethod=method;
  saveState();
  renderSplitSettings();
  const names={equal:'Partes iguales',pct:'Porcentaje',exact:'Monto exacto',shares:'Partes personalizadas'};
  showToast('✅ División por defecto: '+names[method]);
}

function clearAllSplitData(){
  showConfirm('Borrar todo','¿Eliminar TODOS los grupos y gastos de Split? No se puede deshacer.',()=>{
    S.split={groups:[],expenses:[]};
    saveState(); goBack();
    showToast('🗑️ Datos de Split eliminados');
  });
}

function promptJoinGroup(){
  const code=prompt('🔗 Código de invitación:');
  if(code) showToast('✉️ Invitaciones por código: próximamente');
}


function initAuth(){
  if(!FIREBASE_ENABLED){
    if(!S.skipAuth) showAuthOverlay();
    return;
  }
  // Auto-chequear verificación al abrir la app
  if(_fbAuth.currentUser && !_fbAuth.currentUser.emailVerified) {
    _fbAuth.currentUser.reload().then(() => {
      if(_fbAuth.currentUser.emailVerified) {
        document.getElementById('verify-overlay')?.remove();
        showToast('✅ Email verificado');
        onUserLoggedIn(_fbAuth.currentUser);
      }
    });
  }

  // Detectar si venimos de un link de verificación de email
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');

  if(mode === 'verifyEmail' && oobCode) {
    _fbAuth.applyActionCode(oobCode).then(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
      if(_fbAuth.currentUser) {
        _fbAuth.currentUser.reload().then(() => {
          document.getElementById('verify-overlay')?.remove();
          showToast('✅ Email verificado correctamente');
          onUserLoggedIn(_fbAuth.currentUser);
        });
      } else {
        showToast('✅ Email verificado — iniciá sesión');
      }
    }).catch(() => {
      showToast('⚠️ Link inválido o expirado');
    });
  }

  // Manejar resultado del redirect de Google
  _fbAuth.getRedirectResult().then(result => {
    if(result && result.user){
      onUserLoggedIn(result.user);
    }
  }).catch(e => {
    if(e.code !== 'auth/no-auth-event') console.warn('Redirect error:', e);
  });
  // Listener principal de estado
  _fbAuth.onAuthStateChanged(async user => {
    _authUser = user;
    if(user){
      await onUserLoggedIn(user);
    } else {
      if(!S.skipAuth) showAuthOverlay();
    }
  });
}

function showAuthOverlay(){
  const el = document.getElementById('auth-overlay');
  if(el) el.classList.remove('hidden');
}
function hideAuthOverlay(){
  const el = document.getElementById('auth-overlay');
  if(el) el.classList.add('hidden');
}

// ── Tabs ──
function switchAuthTab(tab){
  _authTab = tab;
  document.getElementById('auth-tab-login').classList.toggle('active', tab==='login');
  document.getElementById('auth-tab-register').classList.toggle('active', tab==='register');
  document.getElementById('auth-form-login').style.display = tab==='login'?'block':'none';
  document.getElementById('auth-form-register').style.display = tab==='register'?'block':'none';
  clearAuthError();
}
function showAuthError(msg){
  const el=document.getElementById('auth-error');
  el.textContent=msg; el.classList.add('show');
  el.style.background='var(--rdd)'; el.style.color='var(--rd)'; el.style.borderColor='rgba(240,86,106,.3)';
}
function clearAuthError(){ document.getElementById('auth-error').classList.remove('show'); }

// ── Email Login ──
async function authEmailLogin(){
  if(!FIREBASE_ENABLED){ showAuthError('Firebase no configurado. Seguí las instrucciones en el código.'); return; }
  const email = document.getElementById('auth-email-login').value.trim();
  const pass  = document.getElementById('auth-pass-login').value;
  if(!email||!pass){ showAuthError('Completá todos los campos'); return; }
  if(location.protocol==='file:'){
    showAuthError('⚠️ Para usar autenticación, abrí el archivo desde un servidor HTTP. Mientras tanto usá "Continuar sin cuenta".');
    return;
  }
  const btn = document.getElementById('btn-email-login');
  btn.textContent='Iniciando...'; btn.disabled=true;
  try{
    await _fbAuth.signInWithEmailAndPassword(email, pass);
    clearAuthError();
  }catch(e){
    btn.textContent='Iniciar sesión'; btn.disabled=false;
    showAuthError(authErrorMsg(e.code));
  }
}

// ── Email Register ──
async function authEmailRegister(){
  if(!FIREBASE_ENABLED){ showAuthError('Firebase no configurado.'); return; }
  const name  = document.getElementById('auth-name-register').value.trim();
  const email = document.getElementById('auth-email-register').value.trim();
  const pass  = document.getElementById('auth-pass-register').value;
  if(!name){ showAuthError('Ingresá tu nombre'); return; }
  if(!email){ showAuthError('Ingresá tu email'); return; }
  if(pass.length<6){ showAuthError('La contraseña debe tener al menos 6 caracteres'); return; }
  if(location.protocol==='file:'){
    showAuthError('⚠️ Para registrarte, abrí el archivo desde un servidor HTTP. Mientras tanto usá "Continuar sin cuenta".');
    return;
  }
  const btn = document.getElementById('btn-email-register');
  btn.textContent='Creando cuenta...'; btn.disabled=true;
  try{
    const cred = await _fbAuth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await cred.user.sendEmailVerification();
    showToast('📧 Revisá tu email para verificar tu cuenta');
    clearAuthError();
    showWelcome(name);
  }catch(e){
    btn.textContent='Crear cuenta'; btn.disabled=false;
    showAuthError(authErrorMsg(e.code));
  }
}

// ── Google ──
async function authGoogle(){
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if(isSafari){
    showToast('⚠️ Usá email y contraseña en Safari');
    return;
  }
  if(!_fbAuth) return;
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await _fbAuth.signInWithPopup(provider);
    await onUserLoggedIn(result.user);
  }catch(e){
    showAuthError('Error: ' + e.message);
  }
}

// ── Olvidé contraseña ──
async function authForgotPassword(){
  if(!FIREBASE_ENABLED) return;
  const email = document.getElementById('auth-email-login').value.trim();
  if(!email){ showAuthError('Ingresá tu email primero'); return; }
  try{
    await _fbAuth.sendPasswordResetEmail(email);
    const el = document.getElementById('auth-error');
    el.textContent='✅ Te enviamos un email para restablecer tu contraseña';
    el.style.background='var(--gd)'; el.style.color='var(--gr)'; el.style.borderColor='rgba(52,212,138,.3)';
    el.classList.add('show');
  }catch(e){ showAuthError(authErrorMsg(e.code)); }
}

// ── Usar sin cuenta ──
function showEmailAuth() {
  console.log('showEmailAuth llamada');
  console.log('auth-overlay:', document.getElementById('auth-overlay'));
  const overlay = document.getElementById('auth-overlay');
  if(!overlay) { alert('Error: auth-overlay no encontrado'); return; }
  overlay.classList.remove('hidden');
  overlay.style.cssText = 'display:flex!important;position:fixed!important;inset:0!important;z-index:999!important;flex-direction:column!important;background:var(--bg)!important;align-items:center!important;justify-content:center!important;padding:32px 28px!important;overflow-y:auto!important;';
  switchAuthTab('login');
  console.log('overlay clases después:', overlay.className);
  console.log('overlay style:', overlay.style.cssText);
}

function skipAuth(){
  S.skipAuth=true; saveState();
  hideAuthOverlay();
  showToast('💾 Usando sin cuenta — datos guardados en el dispositivo');
}

// ── Cuando se loguea ──
async function onUserLoggedIn(user){
  // Bloquear si el email no está verificado
  if(user.email && !user.emailVerified &&
     !user.providerData.find(p => p.providerId === 'google.com')) {
    const overlay = document.getElementById('auth-overlay');
    if(overlay) overlay.style.cssText = '';
    if(overlay) overlay.classList.add('hidden');
    showVerificationPending(user);
    return;
  }
  hideAuthOverlay();
  const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
  if (isNewUser) showWelcome(user.displayName || 'nuevo usuario');
  S.linkedAccount={
    uid: user.uid,
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    photoURL: user.photoURL||null,
    provider: user.providerData[0]?.providerId||'email',
  };
  S.skipAuth=false;
  saveState();
  const hasLocalData = S.txs.length>0||S.split.groups.length>0;
  const cloudData = await loadFromCloud(user.uid);
  if(!cloudData||cloudData._isEmpty){
    // Nube vacía → subir datos locales automáticamente
    if(hasLocalData){
      await uploadToCloud(user.uid);
      showToast('☁️ Datos locales subidos a tu cuenta');
    }
  } else if(hasLocalData){
    // Datos en ambos lados → subir locales automáticamente
    await uploadToCloud(user.uid);
    showToast('☁️ Datos sincronizados con tu cuenta');
  } else {
    // Solo hay datos en la nube → cargar
    mergeCloudData(cloudData);
    saveState(); refreshHome();
    showToast('✅ Datos cargados desde tu cuenta');
  }
  updateProfileUI(user);
}

// ── Sync modal ──
function showSyncModal(){
  document.getElementById('sync-overlay-bg').classList.remove('hidden');
  document.getElementById('sync-card').classList.remove('hidden');
}
function hideSyncModal(){
  document.getElementById('sync-overlay-bg').classList.add('hidden');
  document.getElementById('sync-card').classList.add('hidden');
}

async function syncChoice(choice){
  const uid=_authUser?.uid;
  hideSyncModal();
  if(choice==='upload'){
    await uploadToCloud(uid);
    showToast('☁️ Datos locales subidos a tu cuenta');
  } else if(choice==='download'){
    const d=await loadFromCloud(uid);
    if(d){ mergeCloudData(d); saveState(); refreshHome(); }
    showToast('📥 Datos de tu cuenta cargados');
  } else {
    showToast('💾 Manteniendo datos locales');
  }
  if(_authUser) updateProfileUI(_authUser);
}

// ── Firestore: subir ──
async function uploadToCloud(uid){
  if(!FIREBASE_ENABLED||!_fbDb||!uid) return;
  try{
    await _fbDb.collection('users').doc(uid).set({
      txs: S.txs||[],
      cats: S.cats,
      budgets: S.budgets||[],
      goals: S.goals||[],
      recurring: S.recurring||[],
      currency: S.currency,
      useComma: S.useComma,
      accent: S.accent||'#34d48a',
      lang: S.lang||'es',
      split: S.split||{groups:[],expenses:[]},
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      _isEmpty: false,
    },{merge:true});
    S.lastSync=new Date().toISOString();
    // No llamar saveState() aquí para evitar loop infinito
    try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(_e){}
  }catch(e){ console.warn('[finflow] Error sync:', e.message); }
}

// ── Firestore: descargar ──
async function loadFromCloud(uid){
  if(!FIREBASE_ENABLED||!_fbDb||!uid) return null;
  try{
    const doc=await _fbDb.collection('users').doc(uid).get();
    return doc.exists?doc.data():{_isEmpty:true};
  }catch(e){ console.warn('[finflow] Error load:', e.message); return null; }
}

// ── Merge datos de la nube ──
function mergeCloudData(data){
  if(Array.isArray(data.txs))       S.txs=data.txs;
  if(data.cats&&typeof data.cats==='object') S.cats=data.cats;
  if(Array.isArray(data.budgets))   S.budgets=data.budgets;
  if(Array.isArray(data.goals))     S.goals=data.goals;
  if(Array.isArray(data.recurring)) S.recurring=data.recurring;
  if(data.currency&&data.currency.sym) S.currency=data.currency;
  if(data.split&&Array.isArray(data.split.groups)) S.split=data.split;
  if(typeof data.useComma!=='undefined') S.useComma=data.useComma;
  if(data.accent) S.accent=data.accent;
  if(data.lang) S.lang=data.lang;
}

// ── Auto-sync al guardar ──


// ── Logout ──
async function authLogout(){
  showConfirm('Cerrar sesión','¿Querés cerrar sesión? Tus datos locales se mantienen.',async()=>{
    if(FIREBASE_ENABLED&&_fbAuth) try{ await _fbAuth.signOut(); }catch(_e){}
    _authUser=null;
    S.linkedAccount=null; S.skipAuth=false;
    try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(_e){}
    renderProfile();
    showToast('Sesión cerrada');
    showAuthOverlay();
  });
}

// ── Force sync ──
async function forceSync(){
  if(!_authUser){ showToast('⚠️ Iniciá sesión primero'); return; }
  showToast('⏳ Sincronizando...');
  await uploadToCloud(_authUser.uid);
  showToast('✅ Sincronizado');
  renderProfile();
}

// ── UI del perfil con auth real ──
function updateProfileUI(user){
  if(!user) return;
  const nameEl=document.getElementById('profile-name');
  const emailEl=document.getElementById('profile-email');
  const avatarEl=document.getElementById('profile-avatar');
  if(nameEl) nameEl.textContent=user.displayName||user.email.split('@')[0];
  if(emailEl) emailEl.textContent=user.email;
  if(user.photoURL&&avatarEl){
    avatarEl.innerHTML=`<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.parentNode.textContent='👤'">`;
  }
  renderProfile();
}

// ── renderProfile override para mostrar estado auth ──


// ── Errores Firebase en español ──
function authErrorMsg(code){
  const m={
    'auth/user-not-found':'No existe una cuenta con ese email',
    'auth/wrong-password':'Contraseña incorrecta',
    'auth/email-already-in-use':'Ya existe una cuenta con ese email',
    'auth/weak-password':'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email':'El email no es válido',
    'auth/too-many-requests':'Demasiados intentos. Esperá unos minutos.',
    'auth/network-request-failed':'Sin conexión a internet',
    'auth/popup-blocked':'El popup fue bloqueado. Permitilo en tu navegador.',
    'auth/invalid-credential':'Email o contraseña incorrectos',
    'auth/cancelled-popup-request':'Operación cancelada',
  };
  return m[code]||'Error ('+code+')';
}

function authFacebook(){
  showAuthError('Facebook login próximamente. Usá Google o email por ahora.');
}

function closeNFC(){ /* NFC removido */ }

// ── Stubs de funciones legacy ──
function simulateNFCPayment(){ showToast('📱 NFC no disponible en esta versión'); }
function linkAccount(){ showEmailAuth(); }
function unlinkAccount(){ authLogout(); }
function logout(){ authLogout(); }

// ── Toggle emoji picker en grupo ──
function toggleEmojiPicker(){
  const picker=document.getElementById('group-emoji-picker');
  if(!picker) return;
  const visible=picker.style.display!=='none';
  picker.style.display=visible?'none':'block';
  if(!visible) renderGroupEmojiRow();
}

// ── Búsqueda de miembros en tiempo real ──
function searchMembersLive(query){
  const res=document.getElementById('member-search-results');
  if(!res) return;
  if(!query.trim()){ res.innerHTML=''; return; }
  // Buscar usuarios registrados en Firebase que coincidan
  // Por ahora mostramos sugerencia de agregar como contacto local
  const isEmail=query.includes('@');
  const suggestion=isEmail?
    `<div style="padding:8px;background:var(--bld);border-radius:9px;font-size:12px;color:var(--bl)">
      Agregar <strong>${query}</strong> como integrante (sin cuenta verificada)
    </div>`:
    `<div style="padding:8px;background:var(--s3);border-radius:9px;font-size:12px;color:var(--mu)">
      Ingresá el email para vincular con un usuario registrado, o usá solo el nombre.
    </div>`;
  res.innerHTML=suggestion;
}

// openNewGroup actualizado


// openGroupSettings actualizado


// ── Categorías en círculos (diseño unificado) ──
function renderTxCatCircles(type){
  // Frecuentes
  const freqSec=document.getElementById('tx-freq-section');
  const freqGrid=document.getElementById('tx-freq-grid');
  const allGrid=document.getElementById('cat-grid');
  const allLabel=document.getElementById('tx-all-cats-label');

  const cats=S.cats[type]||[];
  // Frecuentes: los primeros 4 que usó recientemente
  const recentCats=[...new Set(S.txs.filter(t=>t.type===type).slice(0,20).map(t=>t.cat))].filter(Boolean).slice(0,5);

  if(freqGrid&&freqSec){
    if(recentCats.length){
      freqSec.style.display='block';
      freqGrid.innerHTML='';
      recentCats.forEach(catName=>{
        const cat=cats.find(x=>x.n===catName);
        if(!cat) return;
        freqGrid.appendChild(buildCatCircle(cat, type, true));
      });
    } else {
      freqSec.style.display='none';
    }
  }
  if(allGrid){
    const label=document.getElementById('tx-freq-label');
    if(allLabel) allLabel.textContent=type==='expense'?'Categorías de gasto':type==='income'?'Categorías de ingreso':'Tipo de inversión';
    allGrid.innerHTML='';
    cats.forEach(cat=>{ allGrid.appendChild(buildCatCircle(cat, type, false)); });
  }
}

function buildCatCircle(cat, type, isFreq){
  const el=document.createElement('div');
  const isSelected=selCat===cat.n;
  el.className='tx-cat-circle'+(isSelected?' selected':'');
  // Colores pastel según tipo
  const bg=cat.c||'var(--bld)';
  const opacity=isSelected?'1':'0.75';
  el.innerHTML=`
    <div class="tx-cat-circle-icon" style="background:${bg};opacity:${opacity}">${cat.e||'📁'}</div>
    <div class="tx-cat-circle-name">${cat.n.length>11?cat.n.slice(0,10)+'…':cat.n}</div>`;
  el.onclick=()=>{
    selCat=isSelected?null:cat.n;
    renderTxCatCircles(txType);
  };
  return el;
}

// ── Selector de fecha simple ──
let txDate=new Date();
function pickDate(){
  const input=document.createElement('input');
  input.type='date';
  input.value=txDate.toISOString().slice(0,10);
  input.style.cssText='position:fixed;opacity:0;top:50%;left:50%;transform:translate(-50%,-50%)';
  document.body.appendChild(input);
  input.showPicker?.();
  input.addEventListener('change',()=>{
    txDate=new Date(input.value+'T12:00:00');
    updateDateLbl();
    input.remove();
  });
  input.addEventListener('blur',()=>setTimeout(()=>input.remove(),200));
}
function updateDateLbl(){
  const el=document.getElementById('date-lbl');
  if(!el) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const d=new Date(txDate); d.setHours(0,0,0,0);
  const diff=Math.round((d-today)/(1000*60*60*24));
  if(diff===0) el.textContent='Hoy';
  else if(diff===-1) el.textContent='Ayer';
  else el.textContent=txDate.toLocaleDateString('es-AR',{day:'numeric',month:'short',year:'numeric'});
}

function setupKeyboardHandlers(){
  const textInputs=['note-inp','split-desc-inp','split-note-inp','new-member-inp'];
  textInputs.forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('focus',()=>{
      document.querySelectorAll('.tx-bottom-bar').forEach(b=>b.style.transform='translateY(110%)');
    });
    el.addEventListener('blur',()=>{
      setTimeout(()=>{
        document.querySelectorAll('.tx-bottom-bar').forEach(b=>b.style.transform='translateY(0)');
      },150);
    });
  });
}