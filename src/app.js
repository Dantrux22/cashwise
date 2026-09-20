let _authUser = null;
let _syncDebounce = null;
let _pendingUpload = false; // true cuando hay cambios locales no subidos aún

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
    console.log('[CashWise] Firebase ✅');
  }catch(e){ console.warn('[CashWise] Firebase error:', e.message); }
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

const EMOJI_GROUPS = [
  {label:'🍕 Comida',     emojis:['🍕','🍔','🌮','🍜','🍣','🥗','🍷','🧃','🍺','🥤','🍦','🧁','☕','🫖']},
  {label:'🏠 Hogar',      emojis:['🏠','🛋️','🪴','💡','🔧','🛁','🧹','🪣','🏡','🛏️']},
  {label:'🚗 Transporte', emojis:['🚗','🚕','🚌','🚂','✈️','🛵','🚲','⛽','🅿️','🚦']},
  {label:'💊 Salud',      emojis:['💊','🏥','🧬','💉','🩺','🏋️','🧘','🦷','👓']},
  {label:'🎮 Entrete.',   emojis:['🎮','🎬','🎵','🎭','🎨','📚','🎲','🎯','🏆','🎪']},
  {label:'👗 Ropa',       emojis:['👗','👟','👔','👜','🧢','💍','💄']},
  {label:'💼 Trabajo',    emojis:['💼','📊','💻','🖥️','📱','⌨️','🖨️','📋']},
  {label:'🐾 Mascotas',   emojis:['🐶','🐱','🐟','🐹','🐰','🦜']},
  {label:'✈️ Viajes',     emojis:['✈️','🏖️','🏔️','🗺️','🧳','🏕️','🎡']},
  {label:'💰 Finanzas',   emojis:['💰','💳','🏦','📈','💵','🪙']},
  {label:'🎁 Otros',      emojis:['🎁','🎀','💝','🔑','🧸','🪆','⭐','🌟']},
];
const EMOJIS = EMOJI_GROUPS.flatMap(g=>g.emojis);
const COLORS = [
  '#FF6B6B','#FF8E53','#FFA500','#FFD93D','#F9F871','#6BCB77','#00C9A7','#4FFBDF',
  '#4D96FF','#0081CF','#2C73D2','#0089BA','#845EC2','#C9B1FF','#D65DB1','#F178B6',
  '#FF6F91','#FF9671','#FFC75F','#C34A36','#926C00','#008F7A','#007A5E','#00B8A9',
  '#DEF7FF','#B0A8B9','#4B4453','#F8615A','#34d48a','#6b8cff',
];
const ACCENTS = ['#34d48a','#f4a7b9','#4d96ff','#845ec2','#ffd93d','#ff6b6b'];
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
  _pendingUpload=true;
  // Auto-sync a Firebase si hay usuario logueado
  if(typeof _authUser !== 'undefined' && _authUser && typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED){
    clearTimeout(_syncDebounce);
    _syncDebounce=setTimeout(()=>uploadToCloud(_authUser.uid), 2500);
  }
}

const _saved = loadState();
const S = _saved || {
  txs:[], cats:JSON.parse(JSON.stringify(DEFAULT_CATS)),
  currency:CURRENCIES[0], hidden:false, accent:'#34d48a',
  budgets:[], recurring:[], lang:'es',
};
// Guards
if(!Array.isArray(S.txs)) S.txs=[];
if(!S.cats||typeof S.cats!=='object') S.cats=JSON.parse(JSON.stringify(DEFAULT_CATS));
if(!Array.isArray(S.cats.expense)) S.cats.expense=JSON.parse(JSON.stringify(DEFAULT_CATS.expense));
if(!Array.isArray(S.cats.income))  S.cats.income=JSON.parse(JSON.stringify(DEFAULT_CATS.income));
if(!Array.isArray(S.cats.invest))  S.cats.invest=JSON.parse(JSON.stringify(DEFAULT_CATS.invest));
if(!S.currency||!S.currency.sym) S.currency=CURRENCIES[0];
if(typeof S.hidden==='undefined') S.hidden=false;
if(!Array.isArray(S.budgets)) S.budgets=[];
if(!Array.isArray(S.recurring)) S.recurring=[];
if(!Array.isArray(S.deletedTxIds)) S.deletedTxIds=[];
if(!S.lang) S.lang='es';
if(!S.accent) S.accent='#34d48a';
if(!Array.isArray(S.investCurrencies)) S.investCurrencies=['USD','EUR'];
if(typeof S.guestMode==='undefined') S.guestMode=false;
if(!S.pendingInvites) S.pendingInvites=[];
if(typeof S.budgetAlerts==='undefined') S.budgetAlerts=true;
if(typeof S.darkMode==='undefined') S.darkMode=true;

// No secondaryCurrency state — foreign currencies tracked per-invest-transaction only

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
  // On-enter refresh
  const R={
    's-invest':renderInvest,
    's-cats':renderCatLists,
    's-budgets':renderBudgets,
    's-recurring':renderRecurring,
    's-profile':renderProfile,
    's-settings':renderAccentDots,
    's-allTx':renderAllTx,
    's-monthly':()=>{monthlyYear=new Date().getFullYear();monthlyMonth=new Date().getMonth();renderMonthly();},
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
           's-budgets':renderBudgets,'s-monthly':renderMonthly,
           's-allTx':renderAllTx,'s-recurring':renderRecurring};
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
  return a.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:2,useGrouping:true});
}
function fmtShort(n){ if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(n>=10000?0:1)+'k'; return fmt(n); }
function fmtCompact(n){ if(Math.abs(n)>=100000) return (n/1000).toFixed(0).replace('.',getSep())+'k'; if(Math.abs(n)>=10000) return (n/1000).toFixed(1).replace('.',getSep())+'k'; return fmt(n); }
function getSep(){ return ','; }
function sym(){ return S.currency.sym; }

function normAmt(s){
  // Remove thousands separators then normalize decimal
  return parseFloat(s.replace(/\.(?=\d{3})/g,'').replace(',','.'))||0;
}

function dayLabel(iso){
  const d=new Date(iso), now=new Date(), yes=new Date();
  yes.setDate(yes.getDate()-1);
  const M=MSHORT, D=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0');
  if(d.toDateString()===now.toDateString()) return `Hoy — ${dd}/${mm}`;
  if(d.toDateString()===yes.toDateString()) return `Ayer — ${dd}/${mm}`;
  return `${D[d.getDay()]} ${dd}/${mm}`;
}
// Returns "YYYY-MM-DD" in LOCAL timezone — avoids UTC/local mismatch near midnight
function localDateKey(isoStr){
  const d=new Date(isoStr);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
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
  const txs=curPeriod==='todo'?S.txs:filterTxs(curPeriod);
  const periodLabels={semana:'Semana',mes:'Mes',año:'Año',todo:'Todo'};
  const periodEl=document.getElementById('c-period');
  if(periodEl) periodEl.textContent=periodLabels[curPeriod]||'Todo';
  // Only count main-currency transactions in the main dashboard
  const mainCode=S.currency.code;
  const mainTxs=txs.filter(t=>!t.currency||t.currency===mainCode);
  const income=mainTxs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expense=mainTxs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  // Net invest total (buy - sell) for main currency
  const invest=S.txs.filter(t=>t.type==='invest'&&(!t.currency||t.currency===mainCode)).reduce((a,t)=>a+(t.investType==='sell'?-t.amount:t.amount),0);
  // Only invest txs without excludeFromNet reduce the net balance
  const investForNet=mainTxs.filter(t=>t.type==='invest'&&!t.excludeFromNet).reduce((a,t)=>a+(t.investType==='sell'?-t.amount:t.amount),0);
  const net=income-expense-investForNet;
  const s=sym();

  const cn=document.getElementById('c-net');
  if(cn){ cn.textContent=(net>=0?'+':'-')+s+fmt(net); cn.className='chart-net'+(net<0?' neg':''); }
  const csIncEl=document.getElementById('cs-inc'); if(csIncEl) csIncEl.textContent='+'+s+fmtCompact(income);
  const csExpEl=document.getElementById('cs-exp'); if(csExpEl) csExpEl.textContent='-'+s+fmtCompact(expense);
  const csNetEl=document.getElementById('cs-net'); if(csNetEl) csNetEl.textContent=(net>=0?'+':'-')+s+fmtCompact(Math.abs(net));
  const csInvEl=document.getElementById('cs-inv'); if(csInvEl) csInvEl.textContent=s+fmtCompact(invest);

  drawChart(mainTxs);
  renderTxList(mainTxs.filter(t=>t.type!=='invest'),'tx-list',5);
  if(S.hidden) applyHide(true);
  // Secondary currency mini-row
  _renderSecondaryRow();

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
  drawDualCanvas(txs, period);
}

function _buildPeriodData(txs, period) {
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
    if(!txs.length) return { incData, expData };
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
  return { incData, expData };
}

function _initCanvas(id) {
  const canvas = document.getElementById(id);
  if(!canvas) return null;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = canvas.offsetHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  return { canvas, ctx, w, h };
}

// Gráfico dual: bezier para semana/mes/año, líneas rectas para todo
function drawDualCanvas(txs, period) {
  const cv = _initCanvas('chart-cv'); if(!cv) return;
  const { ctx, w, h } = cv;
  let { incData, expData } = _buildPeriodData(txs, period);
  if(!incData.length) return;

  if(period === 'todo') {
    let incCum = [], expCum = [], iSum = 0, eSum = 0;
    for(let i = 0; i < incData.length; i++) {
      iSum += incData[i]; incCum.push(iSum);
      eSum += expData[i]; expCum.push(eSum);
    }
    incData = incCum; expData = expCum;
    const maxVal = Math.max(...incData, ...expData, 1);
    const PAD = {l:8, r:24, t:16, b:8};
    const cw = w - PAD.l - PAD.r, ch = h - PAD.t - PAD.b;
    const n = incData.length;
    const xp = i => PAD.l + (i/(n-1||1))*cw;
    const yp = v => PAD.t + ch - (v/maxVal)*ch;
    function drawCleanLine(data, color) {
      if(!data.length || data.every(v=>v===0)) return;
      ctx.beginPath();
      ctx.moveTo(xp(0), yp(0));
      ctx.lineTo(xp(0), yp(data[0]));
      for(let i=1; i<data.length; i++) ctx.lineTo(xp(i), yp(data[i]));
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.beginPath();
      ctx.arc(xp(data.length-1), yp(data[data.length-1]), 5, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath();
      ctx.arc(xp(data.length-1), yp(data[data.length-1]), 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#0f0f13'; ctx.fill();
    }
    drawCleanLine(expData, '#f0566a');
    drawCleanLine(incData, '#34D48A');
    return;
  }

  // Semana / mes / año: acumulado con bezier
  let iSum2 = 0, eSum2 = 0;
  incData = incData.map(v => { iSum2 += v; return iSum2; });
  expData = expData.map(v => { eSum2 += v; return eSum2; });
  const n = incData.length;
  const maxVal = Math.max(...incData, ...expData, 1);
  const PAD = {l:8, r:16, t:16, b:8};
  const cw = w - PAD.l - PAD.r, ch = h - PAD.t - PAD.b;
  const xp = i => PAD.l + (i/(n-1||1))*cw;
  const yp = v => PAD.t + ch - (v/maxVal)*ch;

  function drawLine(data, color) {
    if(!data.length || data.every(v=>v===0)) return;
    ctx.beginPath();
    ctx.moveTo(xp(0), yp(data[0]));
    for(let i=1; i<data.length; i++) {
      const cpx = (xp(i-1)+xp(i))/2;
      ctx.bezierCurveTo(cpx, yp(data[i-1]), cpx, yp(data[i]), xp(i), yp(data[i]));
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.arc(xp(data.length-1), yp(data[data.length-1]), 5, 0, Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath();
    ctx.arc(xp(data.length-1), yp(data[data.length-1]), 2.5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(15,15,19,0.8)'; ctx.fill();
  }

  drawLine(expData, '#f0566a');
  drawLine(incData, '#34D48A');
}



function drawChart(txs){
  drawCanvas(txs, curPeriod);
}

function drawTrendChart(){
  drawCanvas(S.txs, 'todo');
}

// ── Helper: estado vacío ──
function renderEmptyState(container, emoji, msg){
  container.innerHTML=`<div class="empty-state"><span class="big">${emoji}</span>${msg}</div>`;
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
  if(show.length===0){ renderEmptyState(list,'💸','Sin movimientos todavía.<br>Tocá + para agregar el primero.'); return; }
  const groups={};
  show.forEach(tx=>{ const dk=localDateKey(tx.date); if(!groups[dk])groups[dk]=[]; groups[dk].push(tx); });
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
  const foreignCur=isV&&tx.currency&&tx.currency!==S.currency.code;
  const txSym=foreignCur?(CURRENCIES.find(c=>c.code===tx.currency)||{sym:tx.currency}).sym:sym();
  const amtSuffix=foreignCur?' '+tx.currency:'';
  el.innerHTML=`
    <div class="tx-ico" style="background:${bg}">${emoji}</div>
    <div class="tx-info">
      <div class="tx-name">${tx.note||tx.cat||'Sin nota'}${recBadge}</div>
      <div class="tx-cat">${tx.cat||''}</div>
    </div>
    <div class="tx-r">
      <div class="tx-amt ${cls}">${isIn?'+':isV?'':'-'}${txSym}${fmt(tx.amount)}${amtSuffix}</div>
      <div class="tx-dt">${localDateKey(tx.date).slice(8,10)}/${localDateKey(tx.date).slice(5,7)}</div>
    </div>`;
  el.onclick=()=>openEdit(tx.id);
  return el;
}

// ═══════════════════════════════════════════
// ADD TRANSACTION
// ═══════════════════════════════════════════
let txType='expense', amtStr='0', selCat=null, editingId=null;
let txDate=new Date();
let txCurrency='ARS'; // currency code string, default = S.currency.code
let txInvestType='buy'; // 'buy' | 'sell'

function openAdd(forceType){
  editingId=null; editingTxId=null; amtStr='0'; selCat=null;
  const titleEl=document.getElementById('add-title');
  if(titleEl) titleEl.textContent=t('newTx');
  const noteEl=document.getElementById('note-inp');
  if(noteEl) noteEl.value='';
  // Reset "Excluir del neto" toggle
  const enToggle=document.getElementById('exclude-net-toggle');
  if(enToggle) enToggle.classList.remove('on');
  txCurrency=S.currency.code;
  txInvestType='buy';
  txDate=new Date(); updateDateLbl();
  setType(forceType||'expense'); // calls renderTxCatCircles internally
  updateAmt();
  _showAddStep1(); // Paso 1: elegir tipo + categoría
  goTo('s-add');
}

// ── Flujo de alta en 2 pasos: Paso 1 (tipo+categoría) → Paso 2 (monto+detalle) ──
// Tocar una categoría en el Paso 1 avanza directo al Paso 2 (sin botón "siguiente").
// En modo edición (editingId set) ambos pasos se muestran juntos, como antes.
function _showAddStep1(){
  document.getElementById('add-step1').classList.remove('add-step-hidden');
  document.getElementById('add-step2').classList.add('add-step-hidden');
  document.getElementById('add-back-btn').classList.add('add-step-hidden');
  document.getElementById('add-cancel-btn').classList.remove('add-step-hidden');
  const delBtn=document.getElementById('tx-delete-btn');
  if(delBtn) delBtn.style.display='none';
  hideNumpad();
}

function _showAddStep2(){
  document.getElementById('add-step1').classList.add('add-step-hidden');
  document.getElementById('add-step2').classList.remove('add-step-hidden');
  document.getElementById('add-back-btn').classList.remove('add-step-hidden');
  document.getElementById('add-cancel-btn').classList.add('add-step-hidden');
  showDeleteBtn(false); // modo nuevo: tacho = "limpiar formulario"
  setTimeout(showNumpad, 60); // teclado auto-focado al entrar al Paso 2
}

function _showAddEditMode(){
  // Edición: todo en una sola pantalla (monto/detalle/fecha/guardar arriba, categoría abajo)
  document.getElementById('add-step1').classList.remove('add-step-hidden');
  document.getElementById('add-step2').classList.remove('add-step-hidden');
  document.getElementById('add-back-btn').classList.add('add-step-hidden');
  document.getElementById('add-cancel-btn').classList.remove('add-step-hidden');
}

function _addBackToStep1(){
  // Reinicia los campos del Paso 2 para que la próxima categoría elegida arranque limpia
  amtStr='0'; selCat=null;
  const noteEl=document.getElementById('note-inp');
  if(noteEl) noteEl.value='';
  txDate=new Date(); updateDateLbl();
  const enToggle=document.getElementById('exclude-net-toggle');
  if(enToggle) enToggle.classList.remove('on');
  txCurrency=S.currency.code;
  txInvestType='buy';
  _updateTxCurrencyToggle();
  _updateInvestTypeToggle();
  updateAmt();
  renderTxCatCircles(txType);
  _showAddStep1();
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
  // Botón guardar: siempre verde (.modal-btn ya lo define así), sin importar el tipo
  // Categorías
  renderTxCatCircles(txT);
  updateAmt();
  // Mostrar/ocultar toggle "Excluir del neto" solo para inversiones
  const enRow=document.getElementById('exclude-net-row');
  if(enRow) enRow.style.display=txT==='invest'?'':'none';
  // Mostrar/ocultar invest-type-row (Compra/Venta) solo para inversiones
  const itRow=document.getElementById('tx-invest-type-row');
  if(itRow) itRow.style.display=txT==='invest'?'':'none';
  if(txT==='invest') _updateInvestTypeToggle();
  // Mostrar/ocultar selector de moneda solo para inversiones
  _updateTxCurrencyToggle();
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
      g.children&&Array.from(g.children).forEach(x=>{x.style.borderColor='var(--br)';x.style.background='var(--s1)';const cn=x.querySelector('.cn');if(cn)cn.style.color='var(--mu)';});
      b.style.borderColor=c.c; b.style.background=c.c+'20'; const bcn=b.querySelector('.cn'); if(bcn) bcn.style.color=c.c;
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
  if(amt<=0){ showToast(t('tEnterAmt')); return; }
  const note=document.getElementById('note-inp').value.trim();
  const enToggle=document.getElementById('exclude-net-toggle');
  const excludeFromNet=txType==='invest'&&enToggle&&enToggle.classList.contains('on');
  const now=new Date().toISOString();
  const tx={id:editingId||uid(),type:txType,amount:amt,cat:selCat||'',note,date:txDate.toISOString(),modifiedAt:now};
  if(excludeFromNet) tx.excludeFromNet=true;
  if(txType==='invest'){
    if(txCurrency&&txCurrency!==S.currency.code) tx.currency=txCurrency;
    if(txInvestType==='sell') tx.investType='sell';
  }
  if(editingId){
    const original=S.txs.find(t=>t.id===editingId);
    if(original&&original.recurringId) tx.recurringId=original.recurringId;
    const i=S.txs.findIndex(t=>t.id===editingId);
    if(i!==-1)S.txs[i]=tx;
    showToast(t('tUpdated'));
  }
  else { S.txs.unshift(tx); showToast(`✅ ${txType==='income'?'+':'-'}${sym()}${fmt(amt)}`); }
  if(navigator.vibrate) navigator.vibrate(35); // feedback háptico breve al guardar
  saveState();
  if(typeof _authUser!=='undefined'&&_authUser&&typeof FIREBASE_ENABLED!=='undefined'&&FIREBASE_ENABLED){
    clearTimeout(_syncDebounce); uploadToCloud(_authUser.uid);
  }
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
let editingTxId=null;

function openEdit(id){
  const tx=S.txs.find(t=>t.id===id); if(!tx) return;
  editingTxId=id; editingId=id;
  amtStr=String(tx.amount).replace('.',getSep());
  selCat=tx.cat||null;
  const noteEl=document.getElementById('note-inp');
  if(noteEl) noteEl.value=tx.note||'';
  const titleEl=document.getElementById('add-title');
  if(titleEl) titleEl.textContent=t('editTx');
  txDate=tx.date?new Date(tx.date):new Date();
  updateDateLbl();
  setType(tx.type);
  updateAmt();
  renderTxCatCircles(tx.type);
  // Restore "Excluir del neto" toggle from saved tx
  const enToggle=document.getElementById('exclude-net-toggle');
  if(enToggle){ enToggle.classList.remove('on'); if(tx.excludeFromNet) enToggle.classList.add('on'); }
  // Restore currency and invest type (only meaningful for invest)
  txCurrency=(tx.type==='invest'&&tx.currency)?tx.currency:S.currency.code;
  txInvestType=tx.investType||'buy';
  _updateTxCurrencyToggle();
  _updateInvestTypeToggle();
  // Tacho en modo edición: borra el movimiento
  showDeleteBtn(true);
  hideNumpad();
  _showAddEditMode();
  goTo('s-add');
}

function closeEdit(){ editingTxId=null; editingId=null; goBack(); }

function deleteTx(){
  if(!editingTxId) return;
  showConfirm(t('cDeleteTx'),t('cDeleteTxMsg'),()=>{
    const wasInvest=S.txs.find(t=>t.id===editingTxId)?.type==='invest';
    // Registrar ID como eliminado para que el merge no lo restaure desde la nube
    if(!S.deletedTxIds.includes(editingTxId)) S.deletedTxIds.push(editingTxId);
    S.txs=S.txs.filter(t=>t.id!==editingTxId);
    saveState(); closeEdit(); showToast(t('tDeleted'));
    setTimeout(()=>{ refreshHome(); if(wasInvest) renderInvest(); },50);
  });
}

// ═══════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════
function renderInvest(){
  const invTxs=S.txs.filter(t=>t.type==='invest').sort((a,b)=>new Date(b.date)-new Date(a.date));
  const mainCode=S.currency.code;
  // Build net totals per currency (buy adds, sell subtracts)
  const byCode={};
  invTxs.forEach(t=>{
    const c=t.currency||mainCode;
    const sign=t.investType==='sell'?-1:1;
    byCode[c]=(byCode[c]||0)+sign*t.amount;
  });
  // Populate multi-currency totals header
  const totalsEl=document.getElementById('inv-totals-list');
  if(totalsEl){
    const codes=Object.keys(byCode);
    if(codes.length===0){
      totalsEl.innerHTML=`<div class="itv-line" style="font-size:38px;font-weight:300;font-family:'DM Mono',monospace;letter-spacing:-2px;color:var(--am)">${sym()}0</div>`;
    } else {
      totalsEl.innerHTML=codes.map(code=>{
        const cur=CURRENCIES.find(c=>c.code===code)||{sym:code,code};
        const total=byCode[code];
        const color=total<0?'var(--rd)':'var(--am)';
        const suffix=code!==mainCode?`<span style="font-size:16px;font-weight:400;letter-spacing:0;margin-left:3px">${code}</span>`:'';
        return `<div class="itv-line" style="font-size:32px;font-weight:300;font-family:'DM Mono',monospace;letter-spacing:-1.5px;color:${color};line-height:1.25">${total<0?'-':''}${cur.sym}${fmt(Math.abs(total))}${suffix}</div>`;
      }).join('');
    }
  }
  // Hide old breakdown panel (header now shows all currencies)
  const byCurEl=document.getElementById('inv-by-currency');
  if(byCurEl) byCurEl.style.display='none';
  document.getElementById('inv-count').textContent=invTxs.length;
  if(S.hidden) applyHide(true);
  const list=document.getElementById('inv-list'); list.innerHTML='';
  if(invTxs.length===0){ renderEmptyState(list,'📊','Sin inversiones registradas.'); return; }
  invTxs.forEach(tx=>{
    const cat=findCat('invest',tx.cat);
    const el=document.createElement('div'); el.className='inv-item';
    const isSell=tx.investType==='sell';
    const txCode=tx.currency||mainCode;
    const txCur=CURRENCIES.find(c=>c.code===txCode)||{sym:txCode};
    const amtStr=(isSell?'-':'')+txCur.sym+fmt(tx.amount)+(txCode!==mainCode?' '+txCode:'');
    const amtColor=isSell?'var(--rd)':'var(--am)';
    el.innerHTML=`
      <div class="inv-ico">${cat?cat.e:'📈'}</div>
      <div class="inv-info">
        <div class="inv-name">${tx.note||tx.cat||'Inversión'}</div>
        <div class="inv-sub">${isSell?'Venta':'Compra'}${tx.cat?' · '+tx.cat:''} · ${localDateKey(tx.date).slice(8,10)}/${localDateKey(tx.date).slice(5,7)}</div>
      </div>
      <div class="inv-r"><div class="inv-val" style="color:${amtColor}">${amtStr}</div></div>`;
    el.style.cursor='pointer';
    el.onclick=()=>openEdit(tx.id);
    list.appendChild(el);
  });
}

// ═══════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════
let editingBudgetId=null, budgetSelCat=null;

function renderBudgets(){
  const list=document.getElementById('budget-list'); if(!list) return; list.innerHTML='';
  const now=new Date();
  if(S.budgets.length===0){ renderEmptyState(list,'🎯','Sin presupuestos.<br>Creá uno para controlar tus gastos.'); return; }
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
        <div class="budget-bar-fill" style="background:${color}" data-pct="${Math.round(pct*100)}"></div>
      </div>`;
    el.onclick=()=>openBudgetModal(b.id);
    list.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const f=el.querySelector('.budget-bar-fill');
    if(f) f.style.transform='scaleX('+f.dataset.pct/100+')';
  }));
  });
}



function openBudgetModal(id){
  editingBudgetId=id; budgetSelCat=null;
  const existing=id?S.budgets.find(b=>b.id===id):null;
  document.getElementById('budget-modal-title').textContent=id?t('editBudget'):t('newBudget');
  document.getElementById('budget-limit-inp').value=existing?existing.limit:'';
  document.getElementById('budget-del-btn').style.display=id?'block':'none';
  buildCatGrid('budget-cat-grid','expense',existing?existing.cat:null,cn=>{budgetSelCat=cn;});
  if(existing) budgetSelCat=existing.cat;
  document.getElementById('budget-modal').classList.remove('hidden');
}
function closeBudgetModal(){ document.getElementById('budget-modal').classList.add('hidden'); editingBudgetId=null; }

function saveBudget(){
  if(!budgetSelCat){ showToast(t('tSelectCat')); return; }
  const limit=parseFloat(document.getElementById('budget-limit-inp').value)||0;
  if(limit<=0){ showToast(t('tEnterLimit')); return; }
  if(editingBudgetId){
    const b=S.budgets.find(x=>x.id===editingBudgetId);
    if(b){ b.cat=budgetSelCat; b.limit=limit; }
  } else {
    if(S.budgets.find(b=>b.cat===budgetSelCat)){ showToast(t('tBudgetExists')); return; }
    S.budgets.push({id:uid(),cat:budgetSelCat,limit});
  }
  saveState(); closeBudgetModal(); renderBudgets(); showToast(t('tBudgetSaved'));
}
function deleteBudget(){
  if(!editingBudgetId) return;
  showConfirm(t('cDeleteBudget'),t('cDeleteBudgetMsg'),()=>{
    S.budgets=S.budgets.filter(b=>b.id!==editingBudgetId);
    saveState(); closeBudgetModal(); renderBudgets(); showToast(t('tDeleted'));
  });
}

// ═══════════════════════════════════════════
// RECURRING
// ═══════════════════════════════════════════
let editingRecId=null, recType='expense', recSelCat=null;

function renderRecurring(){
  const list=document.getElementById('rec-list'); if(!list) return; list.innerHTML='';
  if(S.recurring.length===0){ renderEmptyState(list,'↺','Sin recurrentes.<br>Agregá tus gastos fijos.'); return; }
  S.recurring.forEach(r=>{
    const isIn=r.type==='income';
    const cat=findCat(r.type,r.cat);
    const el=document.createElement('div'); el.className='tx-item';
    el.innerHTML=`
      <div class="tx-ico" style="background:${isIn?'var(--gd)':'var(--s2)'}">${cat?cat.e:isIn?'💰':'💸'}</div>
      <div class="tx-info">
        <div class="tx-name">${r.name}</div>
        <div class="tx-cat">${r.cat||''} · ${t('dayOfMonth').replace('{n}',r.day)}</div>
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
  document.getElementById('rec-modal-title').textContent=id?t('editRec'):t('newRec');
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
  if(!name){ showToast(t('tEnterName')); return; }
  if(amount<=0){ showToast(t('tEnterAmt')); return; }
  if(!recSelCat){ showToast(t('tSelectCat')); return; }
  if(editingRecId){
    const r=S.recurring.find(x=>x.id===editingRecId);
    if(r){ r.name=name; r.amount=amount; r.day=day; r.type=recType; r.cat=recSelCat; }
  } else {
    S.recurring.push({id:uid(),name,amount,day,type:recType,cat:recSelCat});
  }
  saveState(); closeRecModal(); renderRecurring(); showToast(t('tRecurringSaved'));
}
function deleteRec(){
  if(!editingRecId) return;
  showConfirm(t('cDeleteRec'),t('cDeleteRecMsg'),()=>{
    S.recurring=S.recurring.filter(r=>r.id!==editingRecId);
    saveState(); closeRecModal(); renderRecurring(); showToast(t('tDeleted'));
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
    d.innerHTML=`<div class="cat-mgr-ico" style="background:${c.c}20;border:1.5px solid ${c.c}55">${c.e}</div><div class="cat-mgr-name">${c.n}</div><div class="cat-mgr-edit" style="color:${c.c}">${t('editItem')}</div>`;
    d.onclick=()=>openEditCat(type,c.id);
    el.appendChild(d);
  });
  const add=document.createElement('div'); add.className='cat-add-btn';
  add.innerHTML=`<div class="cat-mgr-ico" style="background:var(--s2)">➕</div><div style="font-size:13px;color:var(--mu)">${t('newCat')}</div>`;
  add.onclick=()=>openNewCat(type);
  el.appendChild(add);
}

function openNewCat(type='expense'){
  editingCatType=type; editingCatId=null;
  document.getElementById('cat-modal-title').textContent=t('newCat');
  document.getElementById('cat-name-inp').value='';
  document.getElementById('cat-del-btn').style.display='none';
  newCatEmoji=EMOJIS[0]; newCatColor=COLORS[0];
  renderEmojiPicker(); renderColorPicker();
  document.getElementById('cat-modal').classList.remove('hidden');
}
function openEditCat(type,id){
  const cat=S.cats[type].find(c=>c.id===id); if(!cat) return;
  editingCatType=type; editingCatId=id;
  document.getElementById('cat-modal-title').textContent=t('editCat');
  document.getElementById('cat-name-inp').value=cat.n;
  document.getElementById('cat-del-btn').style.display='block';
  newCatEmoji=cat.e; newCatColor=cat.c;
  renderEmojiPicker(); renderColorPicker();
  document.getElementById('cat-modal').classList.remove('hidden');
}
function closeCatModal(){ document.getElementById('cat-modal').classList.add('hidden'); }

function renderEmojiPicker(){
  const el=document.getElementById('emoji-picker'); el.innerHTML='';
  EMOJI_GROUPS.forEach(group=>{
    const lbl=document.createElement('div'); lbl.className='em-group-lbl';
    lbl.textContent=group.label; el.appendChild(lbl);
    const row=document.createElement('div'); row.className='em-group-row';
    group.emojis.forEach(em=>{
      const b=document.createElement('div'); b.className='em-opt'+(em===newCatEmoji?' sel':'');
      b.textContent=em; b.onclick=()=>{ newCatEmoji=em; renderEmojiPicker(); };
      row.appendChild(b);
    });
    el.appendChild(row);
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
  if(!name){ showToast(t('tWriteName')); return; }
  if(editingCatId){
    const cat=S.cats[editingCatType].find(c=>c.id===editingCatId);
    if(cat){ cat.e=newCatEmoji; cat.n=name; cat.c=newCatColor; }
    showToast(t('tCatUpdated'));
  } else {
    S.cats[editingCatType].push({id:'c_'+uid(),e:newCatEmoji,n:name,c:newCatColor});
    showToast(t('tSaved'));
  }
  saveState(); closeCatModal(); renderCatLists();
}
function deleteCat(){
  if(!editingCatId) return;
  showConfirm(t('cDeleteCat'),t('cDeleteCatMsg'),()=>{
    S.cats[editingCatType]=S.cats[editingCatType].filter(c=>c.id!==editingCatId);
    saveState(); closeCatModal(); renderCatLists(); showToast(t('tCatDeleted'));
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
  const balance=income-expense;
  // Inversiones: agrupar por moneda (compra suma, venta resta)
  const mainCode=S.currency.code;
  const investByCur={};
  txs.filter(t=>t.type==='invest').forEach(t=>{
    const code=t.currency||mainCode;
    const sign=t.investType==='sell'?-1:1;
    investByCur[code]=(investByCur[code]||0)+sign*t.amount;
  });
  const investTxs=txs.filter(t=>t.type==='invest');

  // Datos mes anterior para comparación
  const prevM=monthlyMonth===0?11:monthlyMonth-1;
  const prevY=monthlyMonth===0?monthlyYear-1:monthlyYear;
  const txsPrev=S.txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===prevM&&d.getFullYear()===prevY;});
  const prevIncome=txsPrev.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const prevExpense=txsPrev.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);

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
      <div style="font-size:10px;color:var(--am);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Inversiones · ${investTxs.length} mov.</div>
      ${Object.keys(investByCur).length===0
        ? `<div style="font-size:17px;font-weight:700;font-family:'DM Mono',monospace;color:var(--am)">${s}0</div>`
        : Object.entries(investByCur).map(([code,total])=>{
            const cur=CURRENCIES.find(c=>c.code===code)||{sym:code,code};
            const color=total<0?'var(--rd)':'var(--am)';
            const suffix=code!==mainCode?` <span style="font-size:10px;font-weight:500">${code}</span>`:'';
            return `<div style="font-size:${Object.keys(investByCur).length>1?'13px':'17px'};font-weight:700;font-family:'DM Mono',monospace;color:${color};line-height:1.35">${total<0?'-':''}${cur.sym}${fmt(Math.abs(total))}${suffix}</div>`;
          }).join('')
      }
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

    // ── Mayor gasto individual del mes ──
    const topTx=txs.filter(t=>t.type==='expense').sort((a,b)=>b.amount-a.amount)[0];
    if(topTx){
      const cd=findCat('expense',topTx.cat);
      const starDiv=document.createElement('div');
      starDiv.style.cssText='background:var(--amd);border:1px solid rgba(245,166,35,.25);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:12px';
      starDiv.innerHTML=`
        <div style="font-size:28px">${cd?cd.e:'💸'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--am);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">⭐ Mayor gasto del mes</div>
          <div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${topTx.note||topTx.cat||'Sin descripción'}</div>
          <div style="font-size:11px;color:var(--mu);margin-top:1px">${topTx.cat||''}</div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:15px;font-weight:700;color:var(--rd);flex-shrink:0">${s}${fmt(topTx.amount)}</div>`;
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

  // ── Detalle de inversiones del mes ──
  if(investTxs.length>0){
    const invHdr=document.createElement('div'); invHdr.className='sec-hdr'; invHdr.style.marginBottom='8px';
    invHdr.innerHTML='<span class="sec-ttl">Inversiones del mes</span>';
    scroll.appendChild(invHdr);
    // Resumen por moneda
    if(Object.keys(investByCur).length>0){
      const invSumDiv=document.createElement('div');
      invSumDiv.style.cssText='background:var(--amd);border:1px solid rgba(245,166,35,.2);border-radius:14px;padding:12px 14px;display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px';
      invSumDiv.innerHTML=Object.entries(investByCur).map(([code,total])=>{
        const cur=CURRENCIES.find(c=>c.code===code)||{sym:code,code};
        const color=total<0?'var(--rd)':'var(--am)';
        return `<div style="display:flex;flex-direction:column;gap:1px;min-width:80px">
          <div style="font-size:10px;color:var(--mu)">${cur.code}</div>
          <div style="font-size:15px;font-weight:700;font-family:'DM Mono',monospace;color:${color}">${total<0?'-':''}${cur.sym}${fmt(Math.abs(total))}</div>
        </div>`;
      }).join('');
      scroll.appendChild(invSumDiv);
    }
    // Lista de movimientos de inversión del mes
    investTxs.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(tx=>{
      const cat=findCat('invest',tx.cat);
      const isSell=tx.investType==='sell';
      const code=tx.currency||mainCode;
      const cur=CURRENCIES.find(c=>c.code===code)||{sym:code,code};
      const color=isSell?'var(--rd)':'var(--am)';
      const ldk=localDateKey(tx.date);
      const row=document.createElement('div');
      row.style.cssText='background:var(--s1);border:1px solid var(--br);border-radius:13px;padding:11px 14px;display:flex;align-items:center;gap:10px;margin-bottom:7px;cursor:pointer';
      row.innerHTML=`
        <div style="width:34px;height:34px;border-radius:10px;background:var(--amd);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${cat?cat.e:'📈'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tx.note||tx.cat||'Inversión'}</div>
          <div style="font-size:11px;color:var(--mu);margin-top:1px">${isSell?'Venta':'Compra'}${tx.cat?' · '+tx.cat:''} · ${ldk.slice(8,10)}/${ldk.slice(5,7)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:700;font-family:'DM Mono',monospace;color:${color}">${isSell?'-':''}${cur.sym}${fmt(tx.amount)}</div>
          ${code!==mainCode?`<div style="font-size:10px;color:var(--mu)">${code}</div>`:''}
        </div>`;
      row.onclick=()=>openEdit(tx.id);
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
    const ids=['cs-inc','cs-exp','cs-net','cs-inv','c-net'];
    ids.forEach(id=>{ const el=document.getElementById(id); if(!el) return; if(!el.dataset.real) el.dataset.real=el.textContent; el.textContent=MASK; });
    document.querySelectorAll('.itv-line').forEach(el=>{ if(!el.dataset.real) el.dataset.real=el.textContent; el.textContent=MASK; });
  } else {
    const ids=['cs-inc','cs-exp','cs-net','cs-inv','c-net'];
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
  document.getElementById('add-curr-lbl').textContent=S.currency.code;
  const sub=document.getElementById('invest-curr-sub');
  if(sub) sub.textContent=(S.investCurrencies||INVEST_PILL_CURRENCIES).join(', ');
}
function openCurrModal(){ renderCurrList(CURRENCIES); document.getElementById('curr-search').value=''; document.getElementById('curr-modal').classList.remove('hidden'); }
function closeCurrModal(){ document.getElementById('curr-modal').classList.add('hidden'); }
function filterCurr(q){ renderCurrList(CURRENCIES.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.code.toLowerCase().includes(q.toLowerCase()))); }

// ── Invest currencies modal ──────────────────────────────────────────────────
const INVEST_CUR_OPTIONS=['ARS','USD','EUR','GBP','BRL','JPY','CHF','CAD','AUD'];

function openInvestCurrModal(){
  _renderInvestCurrList();
  document.getElementById('invest-curr-modal').classList.remove('hidden');
}
function closeInvestCurrModal(){
  document.getElementById('invest-curr-modal').classList.add('hidden');
}
function _renderInvestCurrList(){
  const list=document.getElementById('invest-curr-list'); if(!list) return;
  const sel=S.investCurrencies||INVEST_PILL_CURRENCIES;
  list.innerHTML=INVEST_CUR_OPTIONS.map(code=>{
    const cur=CURRENCIES.find(c=>c.code===code)||{code,flag:'🌐',name:code};
    const on=sel.includes(code);
    return `<div class="set-row" onclick="toggleInvestCur('${code}')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:20px">${cur.flag}</div>
        <div><div class="set-lbl">${code}</div><div class="set-sub">${cur.name}</div></div>
      </div>
      <div id="icck-${code}" style="width:22px;height:22px;border-radius:50%;border:2px solid ${on?'var(--am)':'var(--br)'};background:${on?'var(--am)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;flex-shrink:0">${on?'✓':''}</div>
    </div>`;
  }).join('');
}
function toggleInvestCur(code){
  if(!Array.isArray(S.investCurrencies)) S.investCurrencies=['USD','EUR'];
  const i=S.investCurrencies.indexOf(code);
  if(i===-1){ S.investCurrencies.push(code); }
  else if(S.investCurrencies.length>1){ S.investCurrencies.splice(i,1); }
  saveState();
  _renderInvestCurrList();
  _updateTxCurrencyToggle();
  const sub=document.getElementById('invest-curr-sub');
  if(sub) sub.textContent=(S.investCurrencies||[]).join(', ');
}

// Default invest currencies (overridden by S.investCurrencies)
const INVEST_PILL_CURRENCIES=['USD','EUR'];

function setTxCurrency(code){
  txCurrency=code;
  _updateTxCurrencyToggle();
}

function setInvestType(t){
  txInvestType=t;
  _updateInvestTypeToggle();
}

function _updateInvestTypeToggle(){
  const isBuy=txInvestType!=='sell';
  const btnBuy=document.getElementById('btn-buy');
  const btnSell=document.getElementById('btn-sell');
  const base='flex:1;padding:7px 4px;border-radius:50px;text-align:center;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;';
  if(btnBuy) btnBuy.style.cssText=base+(isBuy?'background:var(--s1);color:var(--am);box-shadow:0 1px 6px rgba(0,0,0,.3)':'color:var(--mu)');
  if(btnSell) btnSell.style.cssText=base+(!isBuy?'background:var(--s1);color:var(--rd);box-shadow:0 1px 6px rgba(0,0,0,.3)':'color:var(--mu)');
}

function _updateTxCurrencyToggle(){
  const row=document.getElementById('tx-curr-row');
  if(!row) return;
  // Only show for invest type
  if(txType!=='invest'){ row.style.display='none'; return; }
  row.style.display='';
  const container=document.getElementById('tx-curr-pills');
  if(!container) return;
  container.innerHTML='';
  const mainCode=S.currency.code;
  const investCurs=Array.isArray(S.investCurrencies)&&S.investCurrencies.length?S.investCurrencies:INVEST_PILL_CURRENCIES;
  const allCodes=[mainCode,...investCurs.filter(c=>c!==mainCode)];
  allCodes.forEach(code=>{
    const cur=CURRENCIES.find(c=>c.code===code)||{code,sym:code,flag:''};
    const active=txCurrency===code;
    const pill=document.createElement('div');
    pill.style.cssText=`display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:${active?'600':'400'};cursor:pointer;border:1px solid ${active?'var(--am)':'var(--br)'};background:${active?'var(--amd)':'transparent'};color:${active?'var(--am)':'var(--mu)'};transition:all .15s;white-space:nowrap`;
    pill.textContent=cur.flag?cur.flag+' '+code:code;
    pill.onclick=()=>setTxCurrency(code);
    container.appendChild(pill);
  });
}

function _renderSecondaryRow(){
  const row=document.getElementById('h-secondary-row');
  if(!row) return;
  const mainCode=S.currency.code;
  // Find invest transactions with a non-main currency
  const foreignInvest=S.txs.filter(t=>t.type==='invest'&&t.currency&&t.currency!==mainCode);
  if(!foreignInvest.length){ row.style.display='none'; return; }
  // Group totals by currency code
  const byCode={};
  foreignInvest.forEach(t=>{ byCode[t.currency]=(byCode[t.currency]||0)+t.amount; });
  const parts=Object.entries(byCode).map(([code,total])=>{
    const cur=CURRENCIES.find(c=>c.code===code)||{sym:code};
    return cur.sym+fmt(total)+' '+code;
  });
  const bal=document.getElementById('h-secondary-bal');
  if(bal) bal.textContent=parts.join(' · ');
  row.style.display='block';
}


// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════

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
    descPlaceholder:'Descripción (opcional)',
    freqCats:'Categorías frecuentes', allCatsExpense:'Categorías de gasto',
    allCatsIncome:'Categorías de ingreso', allCatsInvest:'Categorías de inversión',
    tapAmount:'Tocá para ingresar el monto', today:'Hoy',
    // Edit TX
    editTx:'Editar movimiento',
    // All TX
    allTx:'Todos los movimientos', allTxSearch:'Buscar por descripción...',
    chipAll:'Todos', chipExpense:'Gastos', chipIncome:'Ingresos', chipInvest:'Inversiones',
    // Invest
    invest:'Inversiones', totalInvested:'Total invertido', capital:'Capital',
    records:'Registros', myRecords:'Mis registros', addRecord:'+ Agregar →',
    // Budgets
    budgets:'Presupuestos', budgetsDesc:'Establecé límites de gasto por categoría. Te avisamos al llegar al 80%.',
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
    secCurrency:'Moneda', secData:'Datos',
    secGeneral:'General', secAppearance:'Apariencia', secDanger:'Zona de peligro',
    rBudgets:'Presupuestos', rBudgetsSub:'Límites por categoría',
    rRecurring:'Recurrentes', rRecurringSub:'Gastos e ingresos automáticos',
    rMonthly:'Resumen mensual', rMonthlySub:'Gastos por categoría',
    rLang:'Idioma de la app', rCurrency:'Moneda principal',
    rData:'Gestionar datos', rDataSub:'Exportar e importar historial',
    rBudgetAlerts:'Alertas de presupuesto', rBudgetAlertsSub:'Avisa al 80% y 100% del límite',
    rHideBalance:'Ocultar balance al abrir', rHideBalanceSub:'El balance aparece tapado',
    rDarkMode:'Modo oscuro', rAccent:'Color de acento',
    rClearAll:'Borrar todos los datos',
    // Data screen
    data:'Gestionar datos', exportTab:'Exportar', importTab:'Importar',
    // Toasts
    tEnterAmt:'⚠️ Ingresá un monto', tInvalidAmt:'⚠️ Monto inválido',
    tUpdated:'✅ Actualizado', tSaved:'✅ Guardado', tDeleted:'🗑️ Eliminado',
    tSelectCat:'⚠️ Seleccioná una categoría',
    tEnterLimit:'⚠️ Ingresá un límite', tBudgetExists:'⚠️ Ya existe un presupuesto para esa categoría',
    tBudgetSaved:'✅ Presupuesto guardado',
    tEnterName:'⚠️ Ingresá un nombre',
    tRecurringSaved:'✅ Recurrente guardado',
    tCatUpdated:'✅ Categoría actualizada', tCatDeleted:'🗑️ Categoría eliminada',
    tNoExport:'⚠️ Sin datos para exportar',
    tCSVExported:'✅ CSV exportado', tExcelExported:'✅ Excel exportado', tPDFExported:'✅ PDF exportado',
    tDataDeleted:'🗑️ Datos eliminados', tDataRestored:'✅ Datos restaurados', tInvalidFile:'⚠️ Archivo inválido',
    tDepositUndone:'↩️ Depósito deshecho',
    tSynced:'✅ Sincronizado', tSyncing:'☁️ Sincronizando...', tWriteName:'⚠️ Escribí un nombre',
    // Confirm dialogs
    cDeleteTx:'Eliminar movimiento', cDeleteTxMsg:'¿Seguro que querés eliminar este movimiento?',
    cDeleteBudget:'Eliminar presupuesto', cDeleteBudgetMsg:'¿Seguro que querés eliminar este presupuesto?',
    cDeleteRec:'Eliminar recurrente', cDeleteRecMsg:'¿Seguro que querés eliminar este recurrente?',
    cDeleteCat:'Eliminar categoría', cDeleteCatMsg:'¿Seguro que querés eliminar esta categoría?',
    cDeleteAll:'Borrar todos los datos', cDeleteAllMsg:'Esta acción no se puede deshacer. ¿Continuar?',
    cRestoreBackup:'Restaurar backup', cRestoreBackupMsg:'Se reemplazarán todos los datos actuales. ¿Continuar?',
    cLogout:'Cerrar sesión', cLogoutMsg:'¿Cerrar sesión?',
    // Modal titles
    newBudget:'Nuevo presupuesto', editBudget:'Editar presupuesto',
    newRec:'Nuevo recurrente', editRec:'Editar recurrente',
    editCat:'Editar categoría', newCat:'Nueva categoría',
    // Empty states
    emptyTxs:'Sin movimientos', emptyBudgets:'Sin presupuestos aún',
    emptyRec:'Sin recurrentes aún',
    emptyTxMonth:'Sin movimientos este mes', emptyTxCat:'Sin movimientos en esta categoría',
    // Date modal
    selectDate:'Seleccionar fecha', applyDate:'Aplicar',
    // Recurring day label
    dayOfMonth:'Día {n} de cada mes',
    // Misc UI
    noDescription:'Sin descripción', noCat:'Sin categoría', editItem:'Editar ›',
    // Auth errors
    authUserNotFound:'Usuario no encontrado', authWrongPassword:'Contraseña incorrecta',
    authEmailInUse:'El email ya está en uso', authWeakPassword:'Contraseña muy débil (mínimo 6 caracteres)',
    authInvalidEmail:'Email inválido', authTooMany:'Demasiados intentos. Intentá más tarde.',
    authNoInternet:'Sin conexión a internet', authPopupBlocked:'Popup bloqueado por el navegador',
    authInvalidCred:'Credenciales inválidas', authCancelled:'Inicio de sesión cancelado',
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
    descPlaceholder:'Description (optional)',
    freqCats:'Frequent categories', allCatsExpense:'Expense categories',
    allCatsIncome:'Income categories', allCatsInvest:'Investment categories',
    tapAmount:'Tap to enter amount', today:'Today',
    // Edit TX
    editTx:'Edit transaction',
    // All TX
    allTx:'All transactions', allTxSearch:'Search transactions...',
    chipAll:'All', chipExpense:'Expenses', chipIncome:'Income', chipInvest:'Investments',
    // Invest
    invest:'Investments', totalInvested:'Total invested', capital:'Capital',
    records:'Records', myRecords:'My records', addRecord:'+ Add →',
    // Budgets
    budgets:'Budgets', budgetsDesc:'Set spending limits by category. We alert you at 80%.',
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
    secCurrency:'Currency', secData:'Data',
    secGeneral:'General', secAppearance:'Appearance', secDanger:'Danger zone',
    rBudgets:'Budgets', rBudgetsSub:'Limits by category',
    rRecurring:'Recurring', rRecurringSub:'Automatic expenses and income',
    rMonthly:'Monthly summary', rMonthlySub:'Expenses by category',
    rLang:'App language', rCurrency:'Main currency',
    rData:'Manage data', rDataSub:'Export and import history',
    rBudgetAlerts:'Budget alerts', rBudgetAlertsSub:'Alerts at 80% and 100% of limit',
    rHideBalance:'Hide balance on open', rHideBalanceSub:'Balance appears hidden',
    rDarkMode:'Dark mode', rAccent:'Accent color',
    rClearAll:'Delete all data',
    // Data screen
    data:'Manage data', exportTab:'Export', importTab:'Import',
    // Toasts
    tEnterAmt:'⚠️ Enter an amount', tInvalidAmt:'⚠️ Invalid amount',
    tUpdated:'✅ Updated', tSaved:'✅ Saved', tDeleted:'🗑️ Deleted',
    tSelectCat:'⚠️ Select a category',
    tEnterLimit:'⚠️ Enter a limit', tBudgetExists:'⚠️ A budget already exists for that category',
    tBudgetSaved:'✅ Budget saved',
    tEnterName:'⚠️ Enter a name',
    tRecurringSaved:'✅ Recurring saved',
    tCatUpdated:'✅ Category updated', tCatDeleted:'🗑️ Category deleted',
    tNoExport:'⚠️ No data to export',
    tCSVExported:'✅ CSV exported', tExcelExported:'✅ Excel exported', tPDFExported:'✅ PDF exported',
    tDataDeleted:'🗑️ Data deleted', tDataRestored:'✅ Data restored', tInvalidFile:'⚠️ Invalid file',
    tDepositUndone:'↩️ Deposit undone',
    tSynced:'✅ Synced', tSyncing:'☁️ Syncing...', tWriteName:'⚠️ Enter a name',
    // Confirm dialogs
    cDeleteTx:'Delete transaction', cDeleteTxMsg:'Are you sure you want to delete this transaction?',
    cDeleteBudget:'Delete budget', cDeleteBudgetMsg:'Are you sure you want to delete this budget?',
    cDeleteRec:'Delete recurring', cDeleteRecMsg:'Are you sure you want to delete this recurring item?',
    cDeleteCat:'Delete category', cDeleteCatMsg:'Are you sure you want to delete this category?',
    cDeleteAll:'Delete all data', cDeleteAllMsg:'This action cannot be undone. Continue?',
    cRestoreBackup:'Restore backup', cRestoreBackupMsg:'All current data will be replaced. Continue?',
    cLogout:'Log out', cLogoutMsg:'Log out?',
    // Modal titles
    newBudget:'New budget', editBudget:'Edit budget',
    newRec:'New recurring', editRec:'Edit recurring',
    editCat:'Edit category', newCat:'New category',
    // Empty states
    emptyTxs:'No transactions', emptyBudgets:'No budgets yet',
    emptyRec:'No recurring items yet',
    emptyTxMonth:'No transactions this month', emptyTxCat:'No transactions in this category',
    // Date modal
    selectDate:'Select date', applyDate:'Apply',
    // Recurring day label
    dayOfMonth:'Day {n} of each month',
    // Misc UI
    noDescription:'No description', noCat:'No category', editItem:'Edit ›',
    // Auth errors
    authUserNotFound:'User not found', authWrongPassword:'Wrong password',
    authEmailInUse:'Email already in use', authWeakPassword:'Password too weak (min 6 characters)',
    authInvalidEmail:'Invalid email', authTooMany:'Too many attempts. Try again later.',
    authNoInternet:'No internet connection', authPopupBlocked:'Popup blocked by browser',
    authInvalidCred:'Invalid credentials', authCancelled:'Sign-in cancelled',
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
  // 7. Re-render current dynamic screen so JS-generated text updates
  const scr=typeof curScreen!=='undefined'?curScreen:'';
  if(scr==='s-home') refreshHome();
  else if(scr==='s-budgets') renderBudgets();
  else if(scr==='s-recurring') renderRecurring();
  else if(scr==='s-cats') renderCatLists();
  else if(scr==='s-invest') renderInvest();
  else if(scr==='s-monthly') renderMonthly();
  else if(scr==='s-alltx') renderAllTx();
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
  const firstInvest=S.txs.find(t=>t.type==='invest');
  console.log('[Export] First invest tx (pre-serialize):', firstInvest?JSON.stringify({id:firstInvest.id,currency:firstInvest.currency,investType:firstInvest.investType,amount:firstInvest.amount}):'none');
  const payload={version:2,exportedAt:new Date().toISOString(),appName:'CashWise',data:S};
  download('cashwise-backup.json','data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(payload,null,2)));
  showToast('📦 Backup exportado');
}
function importJSON(){ document.getElementById('import-json-inp').click(); }
function handleImportJSON(inp){
  const file=inp.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const parsed=JSON.parse(e.target.result);
      // v2 wraps data under .data; v1 (legacy) is the raw S object
      const data=parsed.version>=2?parsed.data:parsed;
      showConfirm(t('cRestoreBackup'),t('cRestoreBackupMsg'),()=>{
        // Step 1: apply imported data (shallow — arrays/objects replaced by reference)
        Object.assign(S,data);

        // Debug: log first invest tx immediately after assign — should have currency/investType
        const _dbgInvest=S.txs.find(t=>t.type==='invest');
        console.log('[Import] After Object.assign — first invest tx:', _dbgInvest?JSON.stringify({id:_dbgInvest.id,currency:_dbgInvest.currency,investType:_dbgInvest.investType,amount:_dbgInvest.amount}):'none');

        // Step 2: guards — only fix missing/invalid fields; never touch individual tx objects
        if(!Array.isArray(S.txs)) S.txs=[];
        if(!S.cats||typeof S.cats!=='object') S.cats=JSON.parse(JSON.stringify(DEFAULT_CATS));
        if(!Array.isArray(S.cats.expense)) S.cats.expense=JSON.parse(JSON.stringify(DEFAULT_CATS.expense));
        if(!Array.isArray(S.cats.income))  S.cats.income=JSON.parse(JSON.stringify(DEFAULT_CATS.income));
        if(!Array.isArray(S.cats.invest))  S.cats.invest=JSON.parse(JSON.stringify(DEFAULT_CATS.invest));
        if(!Array.isArray(S.budgets)) S.budgets=[];
        if(!Array.isArray(S.recurring)) S.recurring=[];
        // Re-hydrate currency object from CURRENCIES array so all fields (flag, name, sym) are present
        if(S.currency&&S.currency.code){
          S.currency=CURRENCIES.find(c=>c.code===S.currency.code)||S.currency;
        }
        if(!S.currency||!S.currency.sym) S.currency=CURRENCIES[0];
        if(typeof S.hidden==='undefined') S.hidden=false;
        if(typeof S.darkMode==='undefined') S.darkMode=true;
        if(typeof S.guestMode==='undefined') S.guestMode=false;
        if(!S.lang) S.lang='es';
        if(!S.accent) S.accent='#34d48a';
        if(!Array.isArray(S.investCurrencies)) S.investCurrencies=['USD','EUR'];
        if(!Array.isArray(S.pendingInvites)) S.pendingInvites=[];

        // Debug: confirm tx fields survived guards
        const _dbgInvest2=S.txs.find(t=>t.type==='invest');
        console.log('[Import] After guards — first invest tx:', _dbgInvest2?JSON.stringify({id:_dbgInvest2.id,currency:_dbgInvest2.currency,investType:_dbgInvest2.investType}):'none');

        // Step 3: persist + upload immediately (skip debounce to avoid race with re-auth)
        saveState();
        if(typeof _authUser!=='undefined'&&_authUser&&typeof FIREBASE_ENABLED!=='undefined'&&FIREBASE_ENABLED){
          clearTimeout(_syncDebounce);
          uploadToCloud(_authUser.uid);
        }
        updateCurrUI(); refreshHome(); renderInvest();
        showToast(t('tDataRestored'));
      });
    }catch(_e){ showToast(t('tInvalidFile')); }
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
  if(!S.txs.length){ showToast(t('tNoExport')); return; }
  const rows=[['Fecha','Tipo','Monto','Categoría','Nota']];
  const typeLabel={'income':'Ingreso','expense':'Gasto','invest':'Inversión'};
  S.txs.forEach(t=>{
    const d=new Date(t.date);
    const fecha=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
    rows.push([fecha, typeLabel[t.type]||t.type, t.amount, t.cat||'', t.note||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  download('cashwise-historial.csv','data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv));
  showToast(t('tCSVExported'));
}

// ═══════════════════════════════════════════
// EXPORT — XLSX (formato Monee)
// ═══════════════════════════════════════════
function exportXLSX(){
  if(typeof XLSX === 'undefined'){ showToast('⚠️ Cargando...'); return; }
  if(!S.txs.length){ showToast(t('tNoExport')); return; }

  const rows = S.txs
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .map(t => ({
      'Account name': 'CashWise',
      'Category': t.cat || 'General',
      'Description': t.note || '',
      'Person': S.userName || 'Usuario',
      'Date': (d=>{return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();})(new Date(t.date)),
      'Amount': t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
      'Recurring': t.recurringId ? 'Yes' : 'No',
      'Payment status': 'Settled'
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    {wch:15}, {wch:20}, {wch:30}, {wch:12},
    {wch:18}, {wch:12}, {wch:10}, {wch:15}
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CashWise');

  const date = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `cashwise-export-${date}.xlsx`);
  showToast(t('tExcelExported'));
}

// ═══════════════════════════════════════════
// EXPORT — PDF
// ═══════════════════════════════════════════
async function exportPDF(){
  if(!S.txs.length){ showToast(t('tNoExport')); return; }
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
    doc.text('Historial exportado '+String(now.getDate()).padStart(2,'0')+'/'+String(now.getMonth()+1).padStart(2,'0')+'/'+now.getFullYear(),14,25);
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
      return [String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(), typeLabel[t.type]||t.type, sym()+fmt(t.amount), t.cat||'', t.note||''];
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
    showToast(t('tPDFExported'));
  }catch(e){ showToast('❌ Error al generar PDF'); console.error(e); }
}

// ═══════════════════════════════════════════
// EXPORT — SANKEY SVG
// ═══════════════════════════════════════════
let _sankeySVGContent='';
function exportSankey(){
  if(!S.txs.length){ showToast(t('tNoExport')); return; }
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
    const fecha=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
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
  showConfirm(t('cDeleteAll'),t('cDeleteAllMsg'),()=>{
    S.txs=[]; S.budgets=[]; S.recurring=[];
    saveState(); refreshHome(); showToast(t('tDataDeleted'));
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
  const user = _authUser;
  const s = sym();

  // Stats
  const txCount = S.txs.length;
  const spent = S.txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const catCount = [...new Set(S.txs.map(t=>t.cat))].length;
  const since = S.txs.length > 0
    ? (d=>{return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();})(new Date([...S.txs].sort((a,b)=>new Date(a.date)-new Date(b.date))[0].date))
    : '—';

  const statTxs = document.getElementById('stat-txs');
  const statSpent = document.getElementById('stat-spent');
  const statCats = document.getElementById('stat-cats');
  const statSince = document.getElementById('stat-since');
  if(statTxs) statTxs.textContent = txCount;
  if(statSpent) statSpent.textContent = s + fmtCompact(spent);
  if(statCats) statCats.textContent = catCount;
  if(statSince) statSince.textContent = since;

  // Avatar e info
  const avatarEl = document.getElementById('profile-avatar');
  const initialEl = document.getElementById('profile-initial');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const badgeEl = document.getElementById('profile-badge');

  if(user){
    const name = user.displayName || user.email.split('@')[0];
    if(initialEl) initialEl.textContent = name[0].toUpperCase();
    if(nameEl) nameEl.textContent = name;
    if(emailEl) emailEl.textContent = user.email;
    if(badgeEl){
      badgeEl.textContent = user.emailVerified ? '✓ Cuenta verificada' : '⚠️ Email sin verificar';
      badgeEl.style.color = user.emailVerified ? 'var(--gr)' : 'var(--am)';
    }
    if(user.photoURL && avatarEl){
      avatarEl.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
  } else {
    if(initialEl) initialEl.textContent = '?';
    if(nameEl) nameEl.textContent = 'Sin sesión iniciada';
    if(emailEl) emailEl.textContent = '';
    if(badgeEl){ badgeEl.textContent = 'Modo local'; badgeEl.style.color = 'var(--mu)'; }
  }

  // Sección de cuenta
  const authSection = document.getElementById('profile-auth-section');
  if(authSection){
    if(user){
      authSection.innerHTML = `
        <div class="set-row" onclick="forceSync()" style="cursor:pointer">
          <div>
            <div class="set-lbl">Sincronizar ahora <span id="sync-status-chip"></span></div>
            <div class="set-sub">${S.lastSync?'Última: '+(d=>{return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');})(new Date(S.lastSync)):'Sincronización automática activa'}</div>
          </div>
          <div style="color:var(--bl)">↑↓</div>
        </div>
        <div class="set-row" onclick="authLogout()" style="cursor:pointer">
          <div>
            <div class="set-lbl" style="color:var(--rd)">Cerrar sesión</div>
            <div class="set-sub">${user.email}</div>
          </div>
          <div style="color:var(--rd)">›</div>
        </div>`;
    } else {
      authSection.innerHTML = `
        <div class="set-row" onclick="showEmailAuth()" style="cursor:pointer">
          <div>
            <div class="set-lbl">Iniciar sesión con email</div>
            <div class="set-sub">Sincronizá tus datos en la nube</div>
          </div>
          <div style="color:var(--mu)">›</div>
        </div>
        <div class="set-row" onclick="authGoogle()" style="cursor:pointer">
          <div>
            <div class="set-lbl">Iniciar sesión con Google</div>
            <div class="set-sub">Acceso rápido con tu cuenta Google</div>
          </div>
          <div style="color:var(--mu)">›</div>
        </div>`;
    }
  }
  // Actualizar chip de estado después de renderizar
  setTimeout(_updateSyncChip, 0);
}


// ── Numpad del monto — aparece al tocar el 0 ──
let _numpadVisible = false;

function showNumpad(){
  _numpadVisible = true;
  const np = document.getElementById('main-numpad');
  const spacer = document.getElementById('numpad-spacer');
  const hint = document.getElementById('amt-tap-hint');
  if(np){ np.style.transform = 'translateY(0)'; }
  if(spacer){ spacer.style.height = '220px'; }
  if(hint){ hint.style.display = 'none'; }
  // Subir el tacho para que quede arriba del teclado, no tapado
  const del = document.getElementById('tx-delete-btn');
  if(del && del.style.display !== 'none'){ del.style.transform='translateY(-280px)'; }
  updateNumpadPreview();
}

function hideNumpad(){
  _numpadVisible = false;
  const np = document.getElementById('main-numpad');
  const spacer = document.getElementById('numpad-spacer');
  if(np){ np.style.transform = 'translateY(100%)'; }
  if(spacer){ spacer.style.height = '0'; }
  // Volver el tacho a su posición original (el teclado ya no está ahí)
  const del = document.getElementById('tx-delete-btn');
  if(del && del.style.display !== 'none'){ del.style.transform='translateY(0)'; }
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



function showDeleteBtn(isEdit){
  const btn = document.getElementById('tx-delete-btn');
  if(!btn) return;
  btn.style.display = 'flex';
  btn.style.opacity = '1';
  btn.style.transform = 'scale(1)';
  btn.style.transition = 'transform .25s, opacity .2s';
  btn.style.background = 'var(--rdd)';
  btn.style.borderColor = 'rgba(240,86,106,.4)';
  if(isEdit){
    // Modo edición: elimina el movimiento ya guardado (con confirmación, deleteTx())
    btn.title = 'Eliminar movimiento';
    btn.onclick = deleteTx;
  } else {
    // Modo nuevo: descarta el movimiento en curso (todavía no guardado) y vuelve
    // al inicio — mismo ícono y significado que en edición ("eliminar y salir"),
    // no un simple "limpiar campos y quedarse". Sin confirmación: no hay nada
    // guardado que perder todavía.
    btn.title = 'Descartar';
    btn.onclick = ()=>{
      amtStr='0'; selCat=null;
      document.getElementById('note-inp').value='';
      txDate=new Date(); updateDateLbl();
      updateAmt();
      hideNumpad();
      showToast('🗑️ Movimiento descartado');
      goBack();
    };
  }
}

// ══════════════════════════════════════════════════════
// Búsqueda y filtros en Todos los movimientos
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
  // Búsqueda texto: nota, categoría Y monto
  if(q) txs=txs.filter(t=>
    (t.note||'').toLowerCase().includes(q)||
    (t.cat||'').toLowerCase().includes(q)||
    String(t.amount).includes(q)
  );
  // Info bar — totales por tipo de los resultados filtrados
  const info=document.getElementById('alltx-info');
  if(info){
    const expTotal=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
    const incTotal=txs.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
    const invTotal=txs.filter(t=>t.type==='invest').reduce((a,t)=>a+t.amount,0);
    const hasFilters=q||allTxTypeFilter!=='all'||allTxCatFilter||allTxDateFrom||allTxDateTo;
    let parts=[txs.length+' movimiento'+(txs.length!==1?'s':'')];
    if(expTotal>0) parts.push('Gastos: '+sym()+fmt(expTotal));
    if(incTotal>0) parts.push('Ingresos: +'+sym()+fmt(incTotal));
    if(invTotal>0) parts.push('Inv: '+sym()+fmt(invTotal));
    info.textContent=parts.join(' · ');
    info.style.display=hasFilters?'block':'none';
  }
  // Botón limpiar-todo: visible cuando hay algún filtro activo
  const clrAll=document.getElementById('alltx-clear-all');
  if(clrAll){
    const anyFilter=allTxTypeFilter!=='all'||allTxCatFilter||allTxDateFrom||allTxDateTo;
    clrAll.style.display=anyFilter?'inline-flex':'none';
  }
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

// Limpiar TODOS los filtros (tipo + categoría + fechas + texto) de un tiro
function clearAllTxFilters(){
  allTxTypeFilter='all'; allTxCatFilter=null; allTxDateFrom=null; allTxDateTo=null;
  const inp=document.getElementById('alltx-search'); if(inp) inp.value='';
  const df=document.getElementById('alltx-date-from'); if(df) df.value='';
  const dt=document.getElementById('alltx-date-to'); if(dt) dt.value='';
  ['all','expense','income','invest','cat','date'].forEach(t=>{
    const el=document.getElementById('chip-'+t);
    if(el) el.classList.toggle('active',t==='all');
  });
  filterAllTx();
}

// Chips de fecha rápida — seleccionan rango sin abrir el modal
function quickAllTxDate(period){
  const now=new Date();
  let from,to;
  if(period==='month'){
    from=new Date(now.getFullYear(),now.getMonth(),1);
    to=new Date(now.getFullYear(),now.getMonth()+1,0);
  } else if(period==='lastmonth'){
    from=new Date(now.getFullYear(),now.getMonth()-1,1);
    to=new Date(now.getFullYear(),now.getMonth(),0);
  } else if(period==='year'){
    from=new Date(now.getFullYear(),0,1);
    to=new Date(now.getFullYear(),11,31);
  }
  const pad=n=>String(n).padStart(2,'0');
  const toISO=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  allTxDateFrom=toISO(from); allTxDateTo=toISO(to);
  const df=document.getElementById('alltx-date-from'); if(df) df.value=allTxDateFrom;
  const dt=document.getElementById('alltx-date-to'); if(dt) dt.value=allTxDateTo;
  // Marcar chip de fecha como activo y desmarcar los de período rápido del anterior
  document.getElementById('chip-date')?.classList.add('active');
  ['chip-qmonth','chip-qlastmonth','chip-qyear'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.classList.toggle('active',id==='chip-q'+period);
  });
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

  function findCatName(moneecat, type) {
    const catList = S.cats[type] || [];
    const allCats = [...(S.cats.expense||[]),...(S.cats.income||[]),...(S.cats.invest||[])];
    const exact = catList.find(c => c.n.toLowerCase() === moneecat.toLowerCase());
    if(exact) return exact.n;
    const exactAny = allCats.find(c => c.n.toLowerCase() === moneecat.toLowerCase());
    if(exactAny) return exactAny.n;
    const partial = allCats.find(c =>
      c.n.toLowerCase().includes(moneecat.toLowerCase()) ||
      moneecat.toLowerCase().includes(c.n.toLowerCase())
    );
    if(partial) return partial.n;
    return 'Otro';
  }

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
    const cat = findCatName(String(category || '').trim(), type);

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
    <div style="font-size:22px;font-weight:700;color:var(--tx);margin-bottom:16px">Verificá tu email</div>
    <div style="font-size:15px;color:var(--mu);line-height:1.7;margin-bottom:32px">
      Te enviamos un link a<br>
      <span style="font-weight:600;color:var(--gr)">${user.email}</span><br>
      Abrilo para activar tu cuenta.
    </div>
    <button onclick="checkEmailVerification()"
      style="width:100%;max-width:320px;padding:16px;border-radius:16px;background:var(--gr);border:none;color:#0f0f13;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px">
      Ya verifiqué →
    </button>
    <button onclick="resendVerificationEmail('${user.email}')"
      style="width:100%;max-width:320px;padding:14px;border-radius:16px;background:var(--s2);border:1px solid var(--br);color:var(--tx);font-size:14px;cursor:pointer;margin-bottom:12px">
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

// NOTE: Firebase Console → Authentication → Templates → Email address verification
// → Customize action URL → set to: https://dantrux22.github.io/cashwise/auth-action.html
const EMAIL_VERIFICATION_SETTINGS = {
  url: 'https://dantrux22.github.io/cashwise/auth-action.html',
  handleCodeInApp: false
};

async function resendVerificationEmail(email) {
  try {
    await _fbAuth.currentUser.sendEmailVerification(EMAIL_VERIFICATION_SETTINGS);
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

// ── Cloud sync ──────────────────────────────────────────────────────────────
let _lastSyncTime=0;
const SYNC_COOLDOWN_MS=30000; // 30s minimum between syncs

async function syncFromCloud(){
  if(!FIREBASE_ENABLED||!_authUser||!_fbDb) return;
  const now=Date.now();
  if(now-_lastSyncTime<SYNC_COOLDOWN_MS) return;
  _lastSyncTime=now;
  try{
    const cloudData=await loadFromCloud(_authUser.uid);
    if(!cloudData||cloudData._isEmpty) return;
    mergeCloudData(cloudData);
    saveState(); updateCurrUI(); refreshHome(); renderInvest();
  }catch(e){ console.warn('[Sync] syncFromCloud error:',e.message); }
}

// ── Pull-to-refresh ──────────────────────────────────────────────────────────
function _initPullToRefresh(){
  const scroll=document.getElementById('home-scroll');
  const indicator=document.getElementById('ptr-indicator');
  if(!scroll||!indicator) return;
  let startY=0, pulling=false, triggered=false;
  const THRESHOLD=60;

  scroll.addEventListener('touchstart',e=>{
    if(scroll.scrollTop>2) return; // only at top
    startY=e.touches[0].clientY;
    pulling=true; triggered=false;
  },{passive:true});

  scroll.addEventListener('touchmove',e=>{
    if(!pulling) return;
    const dy=e.touches[0].clientY-startY;
    if(dy>THRESHOLD&&!triggered){
      triggered=true;
      indicator.style.display='flex';
    }
  },{passive:true});

  scroll.addEventListener('touchend',()=>{
    if(!pulling) return;
    pulling=false;
    if(triggered){
      syncFromCloud().finally(()=>{ indicator.style.display='none'; });
    }
  });
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
  const togBa=document.getElementById('tog-budget'); if(togBa&&!S.budgetAlerts) togBa.classList.remove('on');
  const togHs=document.getElementById('tog-hide-start'); if(togHs&&S.hidden) togHs.classList.add('on');
  const togDk=document.getElementById('tog-dark'); if(togDk&&!S.darkMode) togDk.classList.remove('on');
  applyDarkMode(S.darkMode);
  updateLangUI();
  applyRecurring();
  refreshHome();
  if(S.hidden) applyHide(true);
  checkMonthlyReminder();
  _initPullToRefresh();
  // Auto-sync when app comes back into focus
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') syncFromCloud(); });
  window.addEventListener('focus',()=>syncFromCloud());
});

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

  const returningFromRedirect = !!sessionStorage.getItem('cw_google_redirect');

  // Manejar resultado del redirect de Google
  _fbAuth.getRedirectResult().then(async result => {
    sessionStorage.removeItem('cw_google_redirect');
    if(result && result.user){
      await onUserLoggedIn(result.user);
    } else if(returningFromRedirect){
      // Volvimos del redirect pero sin resultado — ITP de Safari bloqueó el estado
      // El usuario puede estar cacheado en onAuthStateChanged; si no, mostrar error
      if(!_authUser) showAuthError('No se pudo completar el login con Google. Intentá con email o revisá que el dominio esté autorizado en Firebase.');
    }
  }).catch(e => {
    sessionStorage.removeItem('cw_google_redirect');
    if(e.code !== 'auth/no-auth-event'){
      console.warn('Redirect error:', e.code, e.message);
      showAuthError('Error de Google: ' + (e.message || e.code));
    }
  });

  // Listener principal de estado
  _fbAuth.onAuthStateChanged(async user => {
    _authUser = user;
    if(user){
      // Si hay un redirect en vuelo, getRedirectResult() lo maneja para evitar doble llamada
      if(!sessionStorage.getItem('cw_google_redirect')){
        await onUserLoggedIn(user);
      }
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

// ── Password show/hide toggle ──
// Eye-off = password hidden (initial state); Eye-on = password visible
const _EYE_ON  = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const _EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
function authTogglePass(id){
  const inp=document.getElementById(id);
  const btn=document.getElementById(id+'-eye');
  if(!inp||!btn) return;
  const hidden=inp.type==='password';
  if(hidden){
    inp.type='text';
    btn.innerHTML=_EYE_ON;
    btn.setAttribute('aria-label','Ocultar contraseña');
  } else {
    inp.type='password';
    btn.innerHTML=_EYE_OFF;
    btn.setAttribute('aria-label','Mostrar contraseña');
  }
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
    const cred = await _fbAuth.signInWithEmailAndPassword(email, pass);
    clearAuthError();
    if(cred.user && cred.user.email && !cred.user.emailVerified &&
       !cred.user.providerData.find(p=>p.providerId==='google.com')) {
      btn.textContent='Iniciar sesión'; btn.disabled=false;
      document.getElementById('auth-overlay')?.classList.add('hidden');
      showVerificationPending(cred.user);
    }
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
    await cred.user.sendEmailVerification(EMAIL_VERIFICATION_SETTINGS);
    clearAuthError();
    // onAuthStateChanged → onUserLoggedIn will show the verification pending screen
  }catch(e){
    btn.textContent='Crear cuenta'; btn.disabled=false;
    showAuthError(authErrorMsg(e.code));
  }
}

// ── Google ──
async function authGoogle(){
  if(!_fbAuth) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if(isSafari || isIOS){
    // Safari/iOS: redirect es más confiable que popup en WKWebView
    try {
      sessionStorage.setItem('cw_google_redirect', '1');
      await _fbAuth.signInWithRedirect(provider);
    } catch(e){
      sessionStorage.removeItem('cw_google_redirect');
      showAuthError('Error iniciando Google: ' + e.message);
    }
  } else {
    try {
      const result = await _fbAuth.signInWithPopup(provider);
      if(result.user) await onUserLoggedIn(result.user);
    } catch(e){
      if(e.code === 'auth/popup-blocked'){
        // Desktop Safari u otro bloqueador — caer a redirect
        try {
          sessionStorage.setItem('cw_google_redirect', '1');
          await _fbAuth.signInWithRedirect(provider);
        } catch(e2){
          sessionStorage.removeItem('cw_google_redirect');
          showAuthError('Error: ' + e2.message);
        }
      } else if(e.code !== 'auth/popup-closed-by-user'){
        showAuthError('Error Google: ' + e.message);
      }
    }
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
  S.userName = user.displayName || user.email.split('@')[0];
  S.skipAuth=false;
  saveState();
  const hasLocalData = S.txs.length>0;
  const cloudData = await loadFromCloud(user.uid);

  if(!cloudData||cloudData._isEmpty){
    // Nube vacía → subir datos locales
    if(hasLocalData){ await uploadToCloud(user.uid); showToast('☁️ Datos locales subidos a tu cuenta'); }
    updateProfileUI(user); return;
  }

  // Siempre hacer merge bidireccional: nunca sobreescribir, nunca perder datos.
  // 1. Mergear nube → local (agrega txs de otros dispositivos)
  const prevCount = S.txs.length;
  mergeCloudData(cloudData);
  const addedFromCloud = S.txs.length - prevCount;

  // 2. Subir el estado mergeado a la nube (incluye txs offline + txs de nube)
  //    uploadToCloud también hace merge-before-write, por lo que es idempotente.
  await uploadToCloud(user.uid);

  saveState(); updateCurrUI(); refreshHome(); renderInvest();

  if(addedFromCloud>0){
    showToast('☁️ +'+addedFromCloud+' movimiento'+(addedFromCloud>1?'s':'')+' sincronizado'+(addedFromCloud>1?'s':'')+' desde tu cuenta');
  } else if(hasLocalData){
    showToast('☁️ Datos sincronizados con tu cuenta');
  } else {
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
    // Sube local pero con merge-before-write, no pierde datos de nube
    await uploadToCloud(uid);
    saveState(); updateCurrUI(); refreshHome(); renderInvest();
    showToast('☁️ Datos sincronizados');
  } else if(choice==='download'){
    const d=await loadFromCloud(uid);
    if(d){ mergeCloudData(d); saveState(); updateCurrUI(); refreshHome(); renderInvest(); }
    // Subir el merge (que incluye lo local + lo de nube)
    if(uid) await uploadToCloud(uid);
    showToast('☁️ Datos sincronizados');
  } else {
    showToast('💾 Sincronización pospuesta');
  }
  if(_authUser) updateProfileUI(_authUser);
}

// ── Firestore: subir (con merge read-before-write para no borrar datos de otros dispositivos) ──
async function uploadToCloud(uid){
  if(!FIREBASE_ENABLED||!_fbDb||!uid) return;
  try{
    // PASO 1: leer nube actual para evitar sobreescribir movimientos de otros dispositivos
    let txsToUpload = S.txs||[];
    let budgetsToUpload = S.budgets||[];
    let recurringToUpload = S.recurring||[];
    try{
      const currentCloud = await loadFromCloud(uid);
      if(currentCloud && !currentCloud._isEmpty){
        if(Array.isArray(currentCloud.txs) && currentCloud.txs.length){
          const merged = _mergeTxById(S.txs||[], currentCloud.txs);
          if(merged.length > (S.txs||[]).length){
            const added = merged.length - (S.txs||[]).length;
            console.log('[Upload] merge-before-write: +'+added+' txs de nube incorporados al local');
            S.txs = merged; // actualizar local con txs de otros dispositivos
          }
          txsToUpload = S.txs;
        }
        if(Array.isArray(currentCloud.budgets))   budgetsToUpload   = _mergeById(S.budgets,   currentCloud.budgets);
        if(Array.isArray(currentCloud.recurring)) recurringToUpload = _mergeById(S.recurring, currentCloud.recurring);
      }
    }catch(mergeErr){ console.warn('[Upload] merge-before-write falló, subiendo sin merge:', mergeErr.message); }

    // PASO 2: escribir el estado mergeado
    console.log('[Upload] subiendo', txsToUpload.length, 'txs');
    await _fbDb.collection('users').doc(uid).set({
      txs: txsToUpload,
      cats: S.cats,
      budgets: budgetsToUpload,
      recurring: recurringToUpload,
      currency: S.currency,
      darkMode: S.darkMode!==false,
      accent: S.accent||'#34d48a',
      lang: S.lang||'es',
      investCurrencies: S.investCurrencies||['USD','EUR'],
      deletedTxIds: S.deletedTxIds||[],
      userName: S.userName||'',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      _isEmpty: false,
    },{merge:true});
    S.lastSync=new Date().toISOString();
    _pendingUpload=false;
    try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(_e){}
    _updateSyncChip();
  }catch(e){
    console.warn('[CashWise] Error sync:', e.message);
    _updateSyncChip();
  }
}

// ── Firestore: descargar ──
async function loadFromCloud(uid){
  if(!FIREBASE_ENABLED||!_fbDb||!uid) return null;
  try{
    const doc=await _fbDb.collection('users').doc(uid).get();
    return doc.exists?doc.data():{_isEmpty:true};
  }catch(e){ console.warn('[CashWise] Error load:', e.message); return null; }
}

// ── Merge helpers: nunca borrar datos ──
// Mergea dos arrays de txs por ID. Regla: si existe en ambos lados, gana
// el que tiene modifiedAt más reciente; si solo existe en un lado, se conserva.
// Esto garantiza que los datos agregados offline nunca se pierden.
// Tradeoff aceptado: si el usuario borra un tx en otro dispositivo, puede
// que reaparezca hasta la próxima sincronización completa (puede borrarlo de nuevo).
function _mergeTxById(local, cloud){
  const deleted = new Set(S.deletedTxIds||[]);
  const localMap = new Map((local||[]).map(t=>[t.id, t]));
  const cloudMap = new Map((cloud||[]).map(t=>[t.id, t]));
  const result = [];
  // Incluir todos los de la nube (salvo los eliminados localmente)
  for(const [id, cloudTx] of cloudMap){
    if(deleted.has(id)) continue; // eliminado en este dispositivo — no restaurar
    const localTx = localMap.get(id);
    if(!localTx){
      result.push(cloudTx); // Solo en nube (agregado en otro dispositivo)
    } else {
      // En ambos: gana el más reciente
      const lMs = localTx.modifiedAt ? new Date(localTx.modifiedAt).getTime() : 0;
      const cMs = cloudTx.modifiedAt ? new Date(cloudTx.modifiedAt).getTime() : 0;
      result.push(lMs >= cMs ? localTx : cloudTx);
    }
  }
  // Agregar los que solo están en local (creados offline)
  for(const [id, localTx] of localMap){
    if(!cloudMap.has(id) && !deleted.has(id)) result.push(localTx);
  }
  return result;
}
// Merge genérico para arrays con campo .id (budgets, recurring)
function _mergeById(local, cloud){
  if(!Array.isArray(cloud)||!cloud.length) return local||[];
  if(!Array.isArray(local)||!local.length) return cloud||[];
  const map = new Map((cloud||[]).map(x=>[x.id, x]));
  for(const item of (local||[])){ if(item.id) map.set(item.id, item); }
  return Array.from(map.values());
}

// ── Merge datos de la nube (bidireccional — nunca sobreescribe) ──
function mergeCloudData(data){
  const prevTxCount = S.txs.length;
  if(Array.isArray(data.txs))       S.txs      = _mergeTxById(S.txs, data.txs);
  if(data.cats&&typeof data.cats==='object') S.cats = data.cats;
  if(Array.isArray(data.budgets))   S.budgets  = _mergeById(S.budgets, data.budgets);
  if(Array.isArray(data.recurring)) S.recurring= _mergeById(S.recurring, data.recurring);
  if(data.currency&&data.currency.code){
    S.currency=CURRENCIES.find(c=>c.code===data.currency.code)||data.currency;
  }
  if(typeof data.darkMode!=='undefined') S.darkMode=data.darkMode;
  if(data.accent) S.accent=data.accent;
  if(data.lang) S.lang=data.lang;
  if(Array.isArray(data.investCurrencies)) S.investCurrencies=data.investCurrencies;
  if(data.userName) S.userName=data.userName;
  // Unión de IDs eliminados para propagar bajas entre dispositivos
  if(Array.isArray(data.deletedTxIds) && data.deletedTxIds.length){
    const merged = new Set([...(S.deletedTxIds||[]), ...data.deletedTxIds]);
    S.deletedTxIds = Array.from(merged);
    // Quitar del array txs cualquier tx que figure como eliminada
    S.txs = S.txs.filter(t=>!merged.has(t.id));
  }
  const added = S.txs.length - prevTxCount;
  if(added>0) console.log('[Sync] mergeCloudData: +'+added+' movimientos desde nube');
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

// ── Force sync (bidireccional: siempre merge local + nube) ──
async function forceSync(){
  if(!_authUser){ showToast('⚠️ Iniciá sesión primero'); return; }
  showToast(t('tSyncing'));
  try{
    // 1. Descargar nube y mergear en local
    const cloudData = await loadFromCloud(_authUser.uid);
    let addedFromCloud = 0;
    if(cloudData && !cloudData._isEmpty){
      const prevCount = S.txs.length;
      mergeCloudData(cloudData);
      addedFromCloud = S.txs.length - prevCount;
    }
    // 2. Subir estado mergeado (uploadToCloud también hace merge-before-write)
    await uploadToCloud(_authUser.uid);
    saveState(); updateCurrUI(); refreshHome(); renderInvest(); renderProfile();
    if(addedFromCloud>0){
      showToast('☁️ +'+addedFromCloud+' movimiento'+(addedFromCloud>1?'s':'')+' desde otro dispositivo');
    } else {
      showToast(t('tSynced'));
    }
  }catch(e){
    console.warn('[forceSync] error:', e.message);
    showToast('⚠️ Error al sincronizar');
  }
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

// ── Errores Firebase en español ──
function authErrorMsg(code){
  const m={
    'auth/user-not-found':t('authUserNotFound'),
    'auth/wrong-password':t('authWrongPassword'),
    'auth/email-already-in-use':t('authEmailInUse'),
    'auth/weak-password':t('authWeakPassword'),
    'auth/invalid-email':t('authInvalidEmail'),
    'auth/too-many-requests':t('authTooMany'),
    'auth/network-request-failed':t('authNoInternet'),
    'auth/popup-blocked':t('authPopupBlocked'),
    'auth/invalid-credential':t('authInvalidCred'),
    'auth/cancelled-popup-request':t('authCancelled'),
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
    <div class="tx-cat-circle-name">${cat.n}</div>`;
  el.onclick=()=>{
    if(editingId){
      // Edición: solo seleccionar/deseleccionar, sin avanzar de pantalla ni autoguardar
      selCat=isSelected?null:cat.n;
      renderTxCatCircles(txType);
      return;
    }
    // Alta nueva: elegir categoría avanza directo al Paso 2 (monto+detalle)
    selCat=cat.n;
    renderTxCatCircles(txType);
    _showAddStep2();
  };
  return el;
}

// ═══════════════════════════════════════════
// PWA — Install prompt & Shortcuts
// ═══════════════════════════════════════════

let _pwaInstallEvent=null;

// Capturar el evento beforeinstallprompt para usarlo con el botón propio.
// El navegador lo dispara cuando la app es instalable y aún no está instalada.
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  _pwaInstallEvent=e;
  // No mostrar si el usuario ya descartó el banner en esta sesión o antes
  if(localStorage.getItem('pwa-install-dismissed')==='true') return;
  // Mostrar banner después de 20 segundos (no molestar al entrar)
  setTimeout(()=>{ if(_pwaInstallEvent) _showPWABanner(); }, 20000);
});

// La app ya está instalada (standalone): limpiar flag para que pueda aparecer
// el banner si alguna vez se reinstala desde el navegador.
window.addEventListener('appinstalled', ()=>{
  _pwaInstallEvent=null;
  localStorage.removeItem('pwa-install-dismissed');
});

function _showPWABanner(){
  if(document.getElementById('pwa-install-banner')) return;
  const banner=document.createElement('div');
  banner.id='pwa-install-banner';
  banner.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#1a1a22;border-top:1px solid #34D48A44;padding:14px 16px;z-index:9999;display:flex;align-items:center;gap:12px;animation:_pwaSlideUp .25s ease-out';
  banner.innerHTML=`
    <img src="cashwise_icon_192.png" style="width:40px;height:40px;border-radius:10px;flex-shrink:0" alt="">
    <div style="flex:1;min-width:0">
      <div style="font-size:14px;font-weight:600;color:#f0f0f8">Instalá CashWise</div>
      <div style="font-size:12px;color:#7878a0;margin-top:1px">Acceso rápido · funciona sin internet</div>
    </div>
    <button onclick="_installPWA()" style="background:#34D48A;color:#0f0f13;border:none;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0">Instalar</button>
    <button onclick="_dismissPWABanner()" style="background:transparent;color:#7878a0;border:none;padding:9px;cursor:pointer;font-size:18px;line-height:1;flex-shrink:0">✕</button>`;
  // Inyectar keyframe si no existe aún
  if(!document.getElementById('_pwa-style')){
    const s=document.createElement('style');
    s.id='_pwa-style';
    s.textContent='@keyframes _pwaSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(banner);
}

async function _installPWA(){
  if(!_pwaInstallEvent) return;
  _pwaInstallEvent.prompt();
  const {outcome}=await _pwaInstallEvent.userChoice;
  _pwaInstallEvent=null;
  const banner=document.getElementById('pwa-install-banner');
  if(banner) banner.remove();
  if(outcome==='accepted') showToast('✅ CashWise instalada');
}

function _dismissPWABanner(){
  localStorage.setItem('pwa-install-dismissed','true');
  const banner=document.getElementById('pwa-install-banner');
  if(banner){ banner.style.animation=''; banner.style.transition='transform .25s ease-in'; banner.style.transform='translateY(100%)'; setTimeout(()=>banner.remove(),260); }
}

// ── Shortcut handler: detectar ?action= al inicio ──
// Se ejecuta cuando el DOM y el estado S ya están listos (el script corre inline).
// Usamos un pequeño delay para que renderHome/refreshHome terminen primero.
(function _handlePWAShortcut(){
  const params=new URLSearchParams(window.location.search);
  const action=params.get('action');
  if(!action) return;
  // Limpiar la URL inmediatamente para no repetir la acción en recargas
  window.history.replaceState({},'',window.location.pathname);
  // Esperar a que la UI esté renderizada antes de navegar
  setTimeout(()=>{
    if(action==='add-expense') openAdd('expense');
    else if(action==='add-income') openAdd('income');
  }, 400);
})();

// ── Modal de selección de fecha (custom selects — funciona en iOS/Android/PWA) ──
function openDateModal(){
  const d = (txDate instanceof Date && !isNaN(txDate)) ? txDate : new Date();
  const curDay=d.getDate(), curMonth=d.getMonth()+1, curYear=d.getFullYear();
  const locale=(typeof S!=='undefined'&&S.lang==='en')?'en-US':'es-AR';

  // Días 1-31
  const dayEl=document.getElementById('date-sel-day');
  dayEl.innerHTML='';
  for(let i=1;i<=31;i++){
    const o=document.createElement('option');
    o.value=i; o.textContent=String(i).padStart(2,'0');
    if(i===curDay) o.selected=true;
    dayEl.appendChild(o);
  }

  // Meses
  const monthEl=document.getElementById('date-sel-month');
  monthEl.innerHTML='';
  for(let i=0;i<12;i++){
    const o=document.createElement('option');
    o.value=i+1;
    o.textContent=new Date(2000,i,1).toLocaleString(locale,{month:'long'}).replace(/^\w/,c=>c.toUpperCase());
    if(i+1===curMonth) o.selected=true;
    monthEl.appendChild(o);
  }

  // Años: 3 años atrás hasta 1 año adelante
  const yearEl=document.getElementById('date-sel-year');
  yearEl.innerHTML='';
  const ny=new Date().getFullYear();
  for(let y=ny-3;y<=ny+1;y++){
    const o=document.createElement('option');
    o.value=y; o.textContent=y;
    if(y===curYear) o.selected=true;
    yearEl.appendChild(o);
  }

  document.getElementById('date-modal').classList.remove('hidden');
}
function closeDateModal(){
  document.getElementById('date-modal').classList.add('hidden');
}
function applyDateModal(){
  const day=parseInt(document.getElementById('date-sel-day').value);
  const month=parseInt(document.getElementById('date-sel-month').value);
  const year=parseInt(document.getElementById('date-sel-year').value);
  txDate=new Date(year,month-1,day,12,0,0);
  updateDateLbl();
  closeDateModal();
}
function updateDateLbl(){
  const el=document.getElementById('date-lbl');
  if(!el) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const d=new Date(txDate); d.setHours(0,0,0,0);
  const diff=Math.round((d-today)/(1000*60*60*24));
  if(diff===0) el.textContent='Hoy';
  else if(diff===-1) el.textContent='Ayer';
  else el.textContent=String(txDate.getDate()).padStart(2,'0')+'/'+String(txDate.getMonth()+1).padStart(2,'0')+'/'+txDate.getFullYear();
}

function setupKeyboardHandlers(){
  const textInputs=['note-inp'];
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

// ═══════════════════════════════════════════
// SYNC — Indicador de estado y auto-retry
// ═══════════════════════════════════════════

// Actualiza el chip visual de sync en el perfil (si está visible).
// Estados: online/offline, pendiente o al día.
function _updateSyncChip(){
  const chip=document.getElementById('sync-status-chip');
  if(!chip) return;
  const online=navigator.onLine;
  const pending=_pendingUpload&&!!_authUser;
  if(!online){
    chip.textContent='📡 Sin conexión';
    chip.style.cssText='display:inline-block;font-size:11px;padding:3px 9px;border-radius:20px;background:rgba(245,166,35,.15);color:var(--am);font-weight:600';
  } else if(pending){
    chip.textContent='↑ Sincronizando...';
    chip.style.cssText='display:inline-block;font-size:11px;padding:3px 9px;border-radius:20px;background:var(--bld);color:var(--bl);font-weight:600';
  } else {
    chip.textContent='☁ Sincronizado';
    chip.style.cssText='display:inline-block;font-size:11px;padding:3px 9px;border-radius:20px;background:var(--gd);color:var(--gr);font-weight:600';
  }
}

// Subir cambios pendientes automáticamente al recuperar conexión.
// Si el usuario hizo cambios mientras estaba offline, se suben en cuanto hay red.
window.addEventListener('online', ()=>{
  _updateSyncChip();
  // Al reconectar: sync bidireccional para no perder txs de otros dispositivos.
  // Independiente de _pendingUpload — puede haber datos nuevos en la nube.
  if(_authUser&&FIREBASE_ENABLED){
    clearTimeout(_syncDebounce);
    setTimeout(()=>forceSync(), 1500); // pequeño delay para que la red estabilice
  }
});

window.addEventListener('offline', ()=>{
  _updateSyncChip();
});