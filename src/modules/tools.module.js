/**
 * Strategy Hub — src/modules/tools.module.js
 * İş Araçları: Kur Riski, Kârlılık, İhale, WhatsApp, Rapor, BAE, Backup
 * Versiyon: 6.1.0 | 2026-03-27
 */

'use strict';
import { Store }  from '../core/store.js';
import { Logger } from '../core/logger.js';
import { UI }     from '../core/ui.js';

function _fmt(n,dec=0){ return parseFloat(n||0).toLocaleString('tr-TR',{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _inp(id){ return parseFloat(document.getElementById(id)?.value)||0; }

/* ── KUR RİSKİ ───────────────────────────────────────────────────────── */
function calcFX(){
  const fx=window.FXState||{};
  const usd=fx.usd||44.18, eur=fx.eur||47.32;
  const recvUSD=_inp('fx-recv-usd'), recvEUR=_inp('fx-recv-eur');
  const debtTL=_inp('fx-debt-tl'), scenPct=_inp('fx-scenario')||5;
  const recvTL=recvUSD*usd+recvEUR*eur;
  const netPos=recvTL-debtTL;
  const gain=(recvUSD*usd*(1+scenPct/100)+recvEUR*eur*(1+scenPct/100))-debtTL-netPos;
  const loss=(recvUSD*usd*(1-scenPct/100)+recvEUR*eur*(1-scenPct/100))-debtTL-netPos;
  const el=document.getElementById('fx-result'); if(!el)return;
  const pc=netPos>=0?'var(--green)':'var(--red)';
  el.innerHTML=`
    <div style="margin-bottom:12px">
      <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Net Açık Pozisyon</div>
      <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:${pc}">${_fmt(netPos)} ₺</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px">Alacak ${_fmt(recvTL)} − Borç ${_fmt(debtTL)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="padding:8px;background:rgba(52,199,89,.08);border-radius:7px">
        <div style="font-size:9px;font-weight:700;color:var(--green);margin-bottom:2px">Kur +%${scenPct}</div>
        <div style="font-size:15px;font-weight:700;font-family:var(--mono);color:var(--green)">+${_fmt(gain)} ₺</div>
      </div>
      <div style="padding:8px;background:rgba(255,59,48,.08);border-radius:7px">
        <div style="font-size:9px;font-weight:700;color:var(--red);margin-bottom:2px">Kur −%${scenPct}</div>
        <div style="font-size:15px;font-weight:700;font-family:var(--mono);color:var(--red)">${_fmt(loss)} ₺</div>
      </div>
    </div>
    <div style="font-size:10px;color:var(--text3);line-height:1.6">
      <strong style="color:var(--text2)">Öneri:</strong> 
      ${netPos>0?'Net alacak pozisyonun var — USD alacaklarını hemen TL\'ye çevirme, kurda avantajlısın.':'Net borç pozisyonun var — döviz borcunu kapatmak için kur düşüşünü bekle.'}
    </div>`;
  const lu=document.getElementById('fx-live-usd'), le=document.getElementById('fx-live-eur');
  if(lu)lu.textContent=usd.toFixed(2); if(le)le.textContent=eur.toFixed(2);
}

/* ── MÜŞTERİ KÂRLILIĞI ─────────────────────────────────────────────── */
function calcProfit(){
  const fx=window.FXState||{};
  const usd=fx.usd||44.18;
  const order=_inp('prof-order'), costTL=_inp('prof-cost');
  const freight=_inp('prof-freight'), customs=_inp('prof-customs');
  const lc=_inp('prof-lc'), ins=_inp('prof-ins');
  if(!order)return;
  const orderTL=order*usd;
  const freightTL=freight*usd;
  const customsTL=orderTL*customs/100;
  const lcTL=orderTL*lc/100;
  const insTL=orderTL*ins/100;
  const totalCost=costTL+freightTL+customsTL+lcTL+insTL;
  const profit=orderTL-totalCost;
  const margin=orderTL>0?profit/orderTL*100:0;
  const mc=margin>25?'var(--green)':margin>15?'var(--gold)':'var(--red)';
  const advice=margin>25?'Mükemmel marj — devam et.':margin>15?'Kabul edilebilir — navlun optimize edilebilir mi?':'Düşük marj — fiyat revizyonu gerekli.';
  const el=document.getElementById('prof-result'); if(!el)return;
  const rows=[['Sipariş (TL)',orderTL,'gd'],['Üretim Maliyeti',costTL,'ne'],['Navlun',freightTL,'ne'],['Gümrük',customsTL,'ne'],['Akreditif',lcTL,'ne'],['Sigorta',insTL,'ne'],['Toplam Maliyet',totalCost,'hi']];
  el.innerHTML=`
    <div style="margin-bottom:10px">
      <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">Net Kâr</div>
      <div style="font-size:24px;font-weight:700;font-family:var(--mono);color:${mc}">${_fmt(profit)} ₺</div>
      <div style="font-size:11px;color:var(--text3)">%${margin.toFixed(1)} net marj</div>
    </div>
    ${rows.map(([l,v,c])=>`<div class="mm" style="padding:4px 0"><span class="mml">${l}</span><span class="mmv ${c}">${_fmt(v)} ₺</span></div>`).join('')}
    <div style="margin-top:10px;padding:8px;background:rgba(0,102,204,.06);border-radius:7px;font-size:10px;color:var(--text2)">${advice}</div>`;
}

/* ── İHALE TAKİP ────────────────────────────────────────────────────── */
const TENDERS=[
  {id:'t1',title:'Nijerya Enerji Bakanlığı — Güneş Santrali Ekipman',  org:'AfDB',      budget:'$85M',  deadline:'2026-05-15',sector:'energy',      country:'Nijerya',    finance:'AfDB Finansmanlı',match:95},
  {id:'t2',title:'Kenya Altyapı — Nairobi Çevre Yolu Bölüm 3',         org:'World Bank', budget:'$120M', deadline:'2026-04-30',sector:'construction', country:'Kenya',      finance:'WB Kredisi',   match:88},
  {id:'t3',title:'Senegal Tekstil Fabrikası Ekipman Alımı',             org:'IFC',        budget:'$12M',  deadline:'2026-06-10',sector:'textile',      country:'Senegal',    finance:'IFC Yatırımı', match:97},
  {id:'t4',title:'Etiyopya Tarım Makineleri 2026-2027',                 org:'UNDP',       budget:'$8M',   deadline:'2026-04-20',sector:'machinery',    country:'Etiyopya',   finance:'UNDP Hibesi',  match:82},
  {id:'t5',title:'Gana İçme Suyu Altyapısı — Ekipman Tedariki',        org:'AfDB',       budget:'$45M',  deadline:'2026-05-30',sector:'construction', country:'Gana',       finance:'AfDB',         match:79},
  {id:'t6',title:'Fildişi Sahili Gıda İşleme Tesisi',                  org:'IDA',        budget:'$18M',  deadline:'2026-07-01',sector:'food',         country:'Fildişi S.', finance:'IDA Kredisi',  match:91},
  {id:'t7',title:'Tanzanya Liman Modernizasyonu — Vinç ve Ekipman',     org:'AfDB',       budget:'$35M',  deadline:'2026-06-20',sector:'construction', country:'Tanzanya',   finance:'AfDB',         match:85},
  {id:'t8',title:'Fas Yenilenebilir Enerji — Rüzgar Türbini Parçaları', org:'EBRD',       budget:'$60M',  deadline:'2026-08-01',sector:'energy',       country:'Fas',        finance:'EBRD Kredisi', match:73},
  {id:'t9',title:'Mısır Kimya Sektörü — Ham Madde Tedariki',           org:'EIB',        budget:'$22M',  deadline:'2026-05-10',sector:'food',         country:'Mısır',      finance:'EIB',          match:88},
  {id:'t10',title:'Güney Afrika Tekstil — Makine Yenileme Projesi',    org:'IFC',        budget:'$9M',   deadline:'2026-09-15',sector:'textile',      country:'G. Afrika',  finance:'IFC',          match:94},
];

let _tenderFilter='all';
function filterTenders(f){ _tenderFilter=f; renderTenders(); }

function renderTenders(){
  const el=document.getElementById('tender-list'); if(!el)return;
  const list=_tenderFilter==='all'?TENDERS:TENDERS.filter(t=>t.sector===_tenderFilter);
  const sorted=[...list].sort((a,b)=>b.match-a.match);
  el.innerHTML=sorted.map(t=>{
    const days=Math.ceil((new Date(t.deadline)-new Date())/(1000*60*60*24));
    const urgCls=days<30?'dn':days<60?'wn':'up';
    const matchCls=t.match>=90?'gd':t.match>=80?'wn':'nt';
    return `
    <div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">${_esc(t.title)}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:10px;font-weight:700;color:var(--accent)">${_esc(t.org)}</span>
          <span style="font-size:10px;color:var(--text3)">·</span>
          <span style="font-size:10px;color:var(--text3)">${_esc(t.country)}</span>
          <span style="font-size:10px;color:var(--text3)">·</span>
          <span class="bdg nt" style="font-size:9px">${_esc(t.finance)}</span>
        </div>
      </div>
      <div style="text-align:right;white-space:nowrap">
        <div style="font-size:14px;font-weight:700;font-family:var(--mono);color:var(--text)">${_esc(t.budget)}</div>
        <span class="bdg ${urgCls}" style="font-size:9px">${days} gün</span>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:var(--text3);margin-bottom:2px">Eşleşme</div>
        <span class="bdg ${matchCls}" style="font-size:11px;font-weight:700">%${t.match}</span>
      </div>
    </div>`;
  }).join('');
}

/* ── WHATSAPP ŞABLONLARI ─────────────────────────────────────────────── */
const WA_TEMPLATES=[
  {label:'İlk Temas',      icon:'👋', body:'Merhaba [AD],\n\nDuay Global Trade olarak [ÜLKE] pazarına kaliteli Türk ürünleri tedarik ediyoruz. Size özel teklifimizi sunmak isteriz.\n\nÜrün kategorileri: [ÜRÜN]\nTeslimat süresi: [SÜRE] gün\n\nGörüşebilir miyiz?'},
  {label:'Teklif Gönderme',icon:'📋', body:'Sayın [AD],\n\nTalebiniz üzerine fiyat teklifimiz hazır:\n• Ürün: [ÜRÜN]\n• Miktar: [MİKTAR]\n• Birim Fiyat: $[FİYAT]\n• Toplam: $[TOPLAM]\n• Ödeme: [ÖDEME]\n• Teslimat: [SÜRE] gün\n\nAkreditif için bankanızı belirtir misiniz?'},
  {label:'Takip Mesajı',   icon:'📞', body:'Sayın [AD],\n\nGeçen hafta gönderdiğimiz teklifle ilgili değerlendirmeniz var mı?\n\nBir sonraki sevkiyat için kapasitenin dolmadan önce sipariş verilmesini öneririm.\n\nYardımcı olabilir miyim?'},
  {label:'Ödeme Hatırlatma',icon:'💳',body:'Sayın [AD],\n\nSipariş no [SIPARIS] için ödeme vadesi [TARİH] tarihinde dolmaktadır.\n\nBanka bilgilerimiz:\nHesap: [HESAP]\nSwift: [SWIFT]\n\nRicanın gönderilmesini rica ederiz.'},
  {label:'Sevkiyat Bildirimi',icon:'🚢',body:'Sayın [AD],\n\nSiparişiniz yola çıktı!\n\n• Konteyner: [KONTEYNER]\n• B/L No: [BL]\n• Tahmini Varış: [TARİH]\n• Liman: [LİMAN]\n\nBelgeler e-posta ile gönderildi.'},
  {label:'BAE Re-Export',  icon:'🇦🇪', body:'Dear [NAME],\n\nWe offer competitive pricing through our Dubai Free Zone operations:\n\n• 0% customs within free zone\n• Faster delivery via Jebel Ali\n• USD/AED payments available\n• Can re-export to [COUNTRY] duty-free\n\nInterested in a quotation?'},
];

function renderWATemplates(){
  const el=document.getElementById('wa-templates'); if(!el)return;
  el.innerHTML=WA_TEMPLATES.map(t=>`
    <div style="padding:12px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <span style="font-size:16px">${t.icon}</span>
        <span style="font-size:12px;font-weight:600;color:var(--text)">${_esc(t.label)}</span>
      </div>
      <div style="font-size:10px;color:var(--text3);line-height:1.6;margin-bottom:8px;white-space:pre-line">${_esc(t.body.slice(0,120))}…</div>
      <div style="display:flex;gap:6px">
        <button class="btn-secondary" style="font-size:10px;padding:4px 10px" onclick="navigator.clipboard.writeText(${JSON.stringify(t.body)}).then(()=>UI?.toast('Kopyalandı','success'))">Kopyala</button>
        <a href="https://wa.me/?text=${encodeURIComponent(t.body)}" target="_blank" rel="noopener"
          style="display:inline-flex;align-items:center;padding:4px 10px;background:rgba(52,199,89,.1);color:var(--green);border:1px solid rgba(52,199,89,.2);border-radius:6px;font-size:10px;font-weight:600;text-decoration:none">
          WhatsApp →
        </a>
      </div>
    </div>`).join('');
}

/* ── BAE KURULUM ────────────────────────────────────────────────────── */
function renderBAE(){
  const steps=document.getElementById('bae-steps'); 
  const costs=document.getElementById('bae-costs');
  if(steps) steps.innerHTML=[
    ['1','Serbest Bölge Seç','JAFZA (Jebel Ali), DAFZA veya IFZA — ihracat için JAFZA ideal'],
    ['2','Online Başvuru','freezone.ae — 15 dakika, pasaport + adres belgesi'],
    ['3','Ticari İzin','3 gün içinde e-mail ile gelir — $1,500-3,000'],
    ['4','Banka Hesabı','Emirates NBD veya Mashreq — 5-10 gün'],
    ['5','Depo/Ofis','Serbest bölge içi depo — aylık $500\'dan başlıyor'],
    ['6','İlk Sevkiyat','Türkiye\'den JAFZA\'ya → re-export Afrika/Asya\'ya'],
  ].map(([n,t,d])=>`
    <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="width:20px;height:20px;border-radius:50%;background:var(--text);color:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${n}</div>
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--text)">${t}</div>
        <div style="font-size:10px;color:var(--text3)">${d}</div>
      </div>
    </div>`).join('');
  
  if(costs) costs.innerHTML=[
    ['Lisans (yıllık)',      '$2,000–4,000',  'ne'],
    ['Depo (aylık, 200m²)',  '$800–1,500',    'ne'],
    ['Banka hesabı',         '$1,000 (bir kez)','ne'],
    ['Vize (2 kişi)',        '$1,500',        'ne'],
    ['Toplam kurulum',       '~$7,000',       'hi'],
    ['Yıllık tasarruf ($1M işlem)', '$20,000+','gd'],
    ['Geri ödeme süresi',   '~4 ay',         'gd'],
  ].map(([l,v,c])=>`<div class="mm" style="padding:5px 0"><span class="mml">${l}</span><span class="mmv ${c}">${v}</span></div>`).join('');
}

/* ── HAFTALIK RAPOR ─────────────────────────────────────────────────── */
async function generateReport(fmt='pdf'){
  const statusEl=document.getElementById('rpt-status');
  if(statusEl)statusEl.textContent='Rapor hazırlanıyor…';
  try{
    const fx=window.FXState||{};
    const pipe=Store.getCollection('africa_pipeline',[]).filter(x=>!x.isDeleted);
    const crm=Store.getCollection('africa_crm',[]).filter(x=>!x.isDeleted);
    const notes=Store.getCollection('user_notes',[]).filter(x=>!x.isDeleted);
    const total=pipe.reduce((a,p)=>{const s=String(p.val||'').replace(/[$,\s]/g,'').toUpperCase();const n=parseFloat(s);if(isNaN(n))return a;if(s.endsWith('M'))return a+n*1e6;if(s.endsWith('K'))return a+n*1e3;return a+n;},0);
    const now=new Date().toLocaleDateString('tr-TR');
    if(fmt==='excel'){
      let csv='\uFEFFŞirket,Ülke,Sektör,Değer,Aşama\n';
      pipe.forEach(p=>{csv+=`"${p.name}","${p.country}","${p.sector}","${p.val}","${p.stage}"\n`;});
      csv+='\nMüşteri,Ülke,Ödeme,Son Temas\n';
      crm.forEach(c=>{csv+=`"${c.name}","${c.country}","${c.payment}","${c.contact}"\n`;});
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=`rapor-${now}.csv`;a.click();
      URL.revokeObjectURL(url);
      if(statusEl)statusEl.textContent='✓ Excel indirildi.';
    } else {
      const w=window.open('','_blank');
      const upcoming=notes.filter(n=>n.reminder&&Math.ceil((new Date(n.reminder)-new Date())/86400000)<=7);
      w.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Haftalık Rapor ${now}</title>
      <style>body{font-family:-apple-system,system-ui,sans-serif;padding:40px;color:#1D1D1F;max-width:800px;margin:0 auto}
      h1{font-size:24px;font-weight:600;letter-spacing:-.02em;margin-bottom:4px}
      h2{font-size:14px;font-weight:600;color:#0066CC;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.06em}
      .meta{font-size:12px;color:#6E6E73;margin-bottom:32px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{text-align:left;padding:6px 8px;background:#F5F5F7;border-bottom:1px solid #E5E5EA;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6E6E73}
      td{padding:8px;border-bottom:1px solid #F5F5F7;color:#3C3C43}
      .stat{display:inline-block;padding:4px 10px;background:#F5F5F7;border-radius:6px;font-size:11px;font-weight:600;margin-right:8px;margin-bottom:8px}
      .green{color:#34C759}.red{color:#FF3B30}.blue{color:#0066CC}
      </style></head><body>
      <h1>Haftalık Yönetim Raporu</h1>
      <div class="meta">Strategy Hub · ${now} · USD/TRY: ${fx.usd?.toFixed(2)||'—'} · EUR/TRY: ${fx.eur?.toFixed(2)||'—'}</div>
      <div><span class="stat">Pipeline: $${(total/1e6).toFixed(1)}M</span><span class="stat">Fırsat: ${pipe.length}</span><span class="stat">Müşteri: ${crm.length}</span>${upcoming.length?`<span class="stat red">⚠ ${upcoming.length} acil hatırlatma</span>`:''}</div>
      <h2>Afrika Pipeline</h2>
      <table><tr><th>Şirket</th><th>Ülke</th><th>Değer</th><th>Aşama</th></tr>
      ${pipe.map(p=>`<tr><td>${p.name}</td><td>${p.country}</td><td>${p.val}</td><td>${p.stage}</td></tr>`).join('')}
      </table>
      <h2>Hatırlatmalar</h2>
      <table><tr><th>Başlık</th><th>Tarih</th><th>Öncelik</th></tr>
      ${notes.slice(0,10).map(n=>`<tr><td>${n.title}</td><td>${n.reminder||'—'}</td><td>${n.priority||'—'}</td></tr>`).join('')}
      </table>
      <h2>Piyasa Verileri</h2>
      <table><tr><th>Varlık</th><th>Değer</th></tr>
        <tr><td>USD/TRY</td><td>${fx.usd?.toFixed(2)||'—'} ₺</td></tr>
        <tr><td>EUR/TRY</td><td>${fx.eur?.toFixed(2)||'—'} ₺</td></tr>
        <tr><td>Ons Altın</td><td>$${fx.gold?Math.round(fx.gold).toLocaleString('en-US'):'—'}</td></tr>
        <tr><td>Bitcoin</td><td>$${fx.btc?Math.round(fx.btc).toLocaleString('en-US'):'—'}</td></tr>
      </table>
      <script>window.onload=()=>{window.print();}<\/script></body></html>`);
      w.document.close();
      if(statusEl)statusEl.textContent='✓ PDF penceresi açıldı — Yazdır → PDF kaydet.';
    }
    Logger.audit('WEEKLY_REPORT_GENERATED',{fmt});
  }catch(e){
    if(statusEl)statusEl.textContent='✕ Hata: '+e.message;
  }
}

/* ── VERİ YEDEKLEME ─────────────────────────────────────────────────── */
function exportAll(fmt='json'){
  const keys=['africa_pipeline','africa_crm','re_portfolio','biz_pipeline','user_notes','price_alarms','bookmarks','growth_books','growth_goals','kids_activities'];
  const data={exported_at:new Date().toISOString(),data:{}};
  keys.forEach(k=>{const v=Store.get(k);if(v)data.data[k]=v;});
  
  const now=new Date().toLocaleDateString('tr-TR').replace(/\./g,'-');
  const el=document.getElementById('export-status');

  if(fmt==='json'){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`strategy-hub-backup-${now}.json`;a.click();
    URL.revokeObjectURL(url);
    if(el)el.textContent=`✓ JSON yedek indirildi — ${new Date().toLocaleTimeString('tr-TR')}`;
  } else {
    let csv='\uFEFFKoleksiyon,Veri Sayısı\n';
    Object.entries(data.data).forEach(([k,v])=>{
      const arr=Array.isArray(v)?v:(v?.items||[v]);
      csv+=`"${k}",${arr.length}\n`;
    });
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`strategy-hub-backup-${now}.csv`;a.click();
    URL.revokeObjectURL(url);
    if(el)el.textContent='✓ CSV indirildi.';
  }
  Logger.audit('DATA_EXPORTED',{fmt});
}

function importData(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0];
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data.data)throw new Error('Geçersiz format');
        Object.entries(data.data).forEach(([k,v])=>Store.set(k,v));
        UI.toast(`Veriler yüklendi — ${Object.keys(data.data).length} koleksiyon.`,'success');
        Logger.audit('DATA_IMPORTED',{keys:Object.keys(data.data)});
      }catch(e){UI.toast('Hata: '+e.message,'error');}
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ── BAŞLATMA ────────────────────────────────────────────────────────── */
function init(){
  renderTenders();
  renderWATemplates();
  renderBAE();
  // FX verisi geldikten sonra hesapla
  window.addEventListener('fx:updated',()=>{ calcFX(); calcProfit(); });
  calcFX(); calcProfit();
  Logger.info('TOOLS_MODULE_INIT_v6.1');
}

export const ToolsModule={init,calcFX,calcProfit,filterTenders,generateReport,exportAll,importData};
window.ToolsModule=ToolsModule;
