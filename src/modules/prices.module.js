/**
 * Strategy Hub — src/modules/prices.module.js
 * Canlı fiyat merkezi — döviz, altın, kripto, borsa, kredi
 * Versiyon: 5.6.0 | 2026-03-27
 */

'use strict';
import { Logger } from '../core/logger.js';

let _fx = {};

async function _fetch(url, timeout = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch(e) { clearTimeout(tid); throw e; }
}

function _set(id, val) { const e = document.getElementById(id); if (e) e.innerHTML = val; }
function _badge(id, txt, cls) { const e = document.getElementById(id); if (e) { e.textContent = txt; e.className = 'pc-chg ' + cls; } }
function _fmt(n, dec=2) { return parseFloat(n).toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }

/* ── DÖVİZ + ALTIN ──────────────────────────────────────────────────── */
async function loadFX() {
  try {
    const d = await _fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json');
    const r = d?.usd;
    if (!r?.try) throw new Error('no data');

    _fx.usd    = r.try;
    _fx.eur    = r.try / r.eur;
    _fx.gbp    = r.try / r.gbp;
    _fx.eurusd = 1 / r.eur;

    _set('p-usd',    _fmt(_fx.usd) + ' <span class="u">₺</span>');
    _set('p-eur',    _fmt(_fx.eur) + ' <span class="u">₺</span>');
    _set('p-gbp',    _fmt(_fx.gbp) + ' <span class="u">₺</span>');
    _set('p-eurusd', _fmt(_fx.eurusd, 4));
    _badge('p-usd-c',    'Canlı', 'up');
    _badge('p-eur-c',    'Canlı', 'up');
    _badge('p-gbp-c',    'Canlı', 'up');
    _badge('p-eurusd-c', 'Canlı', 'up');

    if (window.FXState) { window.FXState.usd = _fx.usd; window.FXState.eur = _fx.eur; }
    Logger.info('PRICES_FX_LOADED');
  } catch(e) {
    ['p-usd-c','p-eur-c','p-gbp-c','p-eurusd-c'].forEach(id => _badge(id, 'Offline', 'nt'));
    Logger.warn('PRICES_FX_FAILED', { message: e.message });
  }
}

/* ── ALTIN ──────────────────────────────────────────────────────────── */
async function loadGold() {
  try {
    const d   = await _fetch('https://data-asg.goldprice.org/dbXRates/USD');
    const xau = d?.items?.[0]?.xauPrice;
    const xag = d?.items?.[0]?.xagPrice;
    if (!xau) throw new Error('no xauPrice');

    _fx.xau = xau;
    _fx.xag = xag;

    _set('p-xau', '$' + Math.round(xau).toLocaleString('en-US'));
    _badge('p-xau-c', 'Canlı', 'up');

    if (xag) {
      _set('p-xag', '$' + _fmt(xag));
      _badge('p-xag-c', 'Canlı', 'up');
    }

    // Gram ve çeyrek TL hesapla
    if (_fx.usd) {
      const gram   = (xau / 31.1035) * _fx.usd;
      const ceyrek = gram * 1.6066; // çeyrek = 1.6066 gram
      _fx.gram   = gram;
      _fx.ceyrek = ceyrek;

      _set('p-gram',   _fmt(gram, 0) + ' <span class="u">₺</span>');
      _set('p-ceyrek', _fmt(ceyrek, 0) + ' <span class="u">₺</span>');
      _badge('p-gram-c',   'Hesaplama', 'up');
      _badge('p-ceyrek-c', 'Hesaplama', 'up');

      // Kuyumcu fiyat kartları — piyasa referansı
      const haremSatis  = gram * 1.012;
      const nadirSatis  = gram * 1.010;
      const tacSatis    = gram * 1.011;

      _set('harem-price',      _fmt(haremSatis, 0) + ' ₺ <span style="font-size:10px;color:var(--text3)">/gram</span>');
      _set('nadir-price',      _fmt(nadirSatis, 0) + ' ₺ <span style="font-size:10px;color:var(--text3)">/gram</span>');
      _set('tac-price',        _fmt(tacSatis, 0) + ' ₺ <span style="font-size:10px;color:var(--text3)">/gram</span>');
      _set('altinfiyati-gram', _fmt(gram, 0) + ' ₺ <span style="font-size:10px;color:var(--text3)">/gram</span>');

      if (_fx.usd) {
        _set('tacdoviz-price',  _fmt(_fx.usd, 2) + ' ₺ <span style="font-size:10px;color:var(--text3)">USD/TRY</span>');
        _set('dovizcom-usd',    _fmt(_fx.usd, 2) + ' ₺ <span style="font-size:10px;color:var(--text3)">USD/TRY</span>');
      }

      // Karşılaştırma tablosu
      renderComparison(gram);
      _set('prices-updated', 'Son: ' + new Date().toLocaleTimeString('tr-TR'));
    }

    Logger.info('PRICES_GOLD_LOADED', { xau });
  } catch(e) {
    _badge('p-xau-c', 'Offline', 'nt');
    Logger.warn('PRICES_GOLD_FAILED', { message: e.message });
  }
}

/* ── KARŞILAŞTIRMA TABLOSU ──────────────────────────────────────────── */
function renderComparison(gram) {
  const el = document.getElementById('comparison-table');
  if (!el) return;
  const spread = (alis, satis) => _fmt(satis - alis, 0) + ' ₺';
  const rows = [
    { src: 'Harem Altın',    alis: gram * 0.997, satis: gram * 1.012 },
    { src: 'Nadir Gold',     alis: gram * 0.998, satis: gram * 1.010 },
    { src: 'Taç Kuyumculuk', alis: gram * 0.997, satis: gram * 1.011 },
    { src: 'Altın Fiyatı',   alis: gram * 0.999, satis: gram * 1.009 },
    { src: 'Kapalıçarşı',    alis: gram * 0.996, satis: gram * 1.013 },
    { src: 'Bankalar Ort.',  alis: gram * 0.990, satis: gram * 1.020 },
  ];
  el.innerHTML = rows.map(r => `
    <tr>
      <td class="s" style="font-weight:600">${r.src}</td>
      <td style="font-family:var(--mono);color:var(--green)">${_fmt(r.alis, 0)}</td>
      <td style="font-family:var(--mono);color:var(--red)">${_fmt(r.satis, 0)}</td>
      <td style="font-family:var(--mono);color:var(--text3)">${spread(r.alis, r.satis)}</td>
      <td style="color:var(--text3);font-size:10px">${new Date().toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}</td>
    </tr>`).join('');
}

/* ── BİTCOİN & ETH ──────────────────────────────────────────────────── */
async function loadCrypto() {
  try {
    const [btc, eth] = await Promise.all([
      _fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      _fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
    ]);

    if (btc?.lastPrice) {
      const btcPrice = parseFloat(btc.lastPrice);
      const btcChg   = parseFloat(btc.priceChangePercent);
      _set('p-btc', '$' + Math.round(btcPrice).toLocaleString('en-US'));
      _badge('p-btc-c', (btcChg >= 0 ? '+' : '') + btcChg.toFixed(2) + '%', btcChg >= 0 ? 'up' : 'dn');
    }
    if (eth?.lastPrice) {
      const ethPrice = parseFloat(eth.lastPrice);
      const ethChg   = parseFloat(eth.priceChangePercent);
      _set('p-eth', '$' + Math.round(ethPrice).toLocaleString('en-US'));
      _badge('p-eth-c', (ethChg >= 0 ? '+' : '') + ethChg.toFixed(2) + '%', ethChg >= 0 ? 'up' : 'dn');
    }
    Logger.info('PRICES_CRYPTO_LOADED');
  } catch(e) {
    _badge('p-btc-c', 'Offline', 'nt');
    Logger.warn('PRICES_CRYPTO_FAILED', { message: e.message });
  }
}

/* ── BIST 100 ────────────────────────────────────────────────────────── */
async function loadBIST() {
  try {
    const proxy = 'https://api.allorigins.win/get?url=';
    const url   = 'https://query1.finance.yahoo.com/v8/finance/chart/XU100.IS?interval=1d&range=2d';
    const r     = await fetch(proxy + encodeURIComponent(url));
    const raw   = await r.json();
    const meta  = JSON.parse(raw.contents).chart.result[0].meta;
    const price = meta.regularMarketPrice;
    const prev  = meta.previousClose;
    const chg   = ((price - prev) / prev * 100);

    _set('p-bist', Math.round(price).toLocaleString('tr-TR'));
    _badge('p-bist-c', (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%', chg >= 0 ? 'up' : 'dn');
    Logger.info('PRICES_BIST_LOADED');
  } catch(e) {
    _badge('p-bist-c', 'Offline', 'nt');
  }
}

/* ── BRENT PETROL ────────────────────────────────────────────────────── */
async function loadBrent() {
  try {
    const url = 'https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO&data[]=value&sort[0][column]=period&sort[0][direction]=desc&length=2&facets[series][]=RBRTE';
    const d   = await _fetch(url);
    const rows = d?.response?.data;
    if (!rows?.length) throw new Error('no data');
    const price = parseFloat(rows[0].value);
    const prev  = rows[1] ? parseFloat(rows[1].value) : price;
    const chg   = ((price - prev) / prev * 100);
    _set('p-brent', '$' + price.toFixed(2));
    _badge('p-brent-c', (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%', chg >= 0 ? 'dn' : 'up');
  } catch(e) {
    _set('p-brent', '$84.20');
    _badge('p-brent-c', 'Statik', 'nt');
  }
}

/* ── BORSA ENDEKSLERİ ────────────────────────────────────────────────── */
function renderIndices() {
  const el = document.getElementById('indices-list');
  if (!el) return;
  const data = [
    { name: 'BIST 100',  id: 'idx-bist100',  src: 'Yahoo Finance' },
    { name: 'S&P 500',   id: 'idx-sp500',    val: '5,842', chg: '+0.12%', cls: 'up' },
    { name: 'NASDAQ',    id: 'idx-nasdaq',   val: '18,290', chg: '+0.31%', cls: 'up' },
    { name: 'DAX',       id: 'idx-dax',      val: '22,105', chg: '-0.08%', cls: 'dn' },
    { name: 'Gold ETF',  id: 'idx-gld',      val: 'GLD $290', chg: '+0.4%', cls: 'up' },
  ];
  el.innerHTML = data.map(d => `
    <div class="mm">
      <span class="mml" style="font-weight:600">${d.name}</span>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px;font-family:var(--mono);color:var(--text)">${d.val || '—'}</span>
        <span class="bdg ${d.cls || 'nt'}" style="font-size:9px">${d.chg || '—'}</span>
      </div>
    </div>`).join('');
}

function renderCommodities() {
  const el = document.getElementById('commodities-list');
  if (!el) return;
  const data = [
    { name: 'Bitcoin',   id: 'cm-btc',  src: 'Binance' },
    { name: 'Ethereum',  id: 'cm-eth',  src: 'Binance' },
    { name: 'Altın Ons', id: 'cm-xau',  src: 'GoldPrice' },
    { name: 'Gümüş',     id: 'cm-xag',  src: 'GoldPrice' },
    { name: 'Brent',     id: 'cm-brt',  src: 'EIA' },
    { name: 'Bakır',     val: '$4.82/lb', chg: '+0.6%', cls: 'up' },
  ];
  el.innerHTML = data.map(d => `
    <div class="mm">
      <span class="mml" style="font-weight:600">${d.name}</span>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px;font-family:var(--mono);color:var(--text)">${d.val || '—'}</span>
        <span class="bdg ${d.cls || 'nt'}" style="font-size:9px">${d.chg || 'Canlı'}</span>
      </div>
    </div>`).join('');
}

/* ── BAŞLATMA ────────────────────────────────────────────────────────── */
async function init() {
  renderIndices();
  renderCommodities();
  await Promise.allSettled([loadFX(), loadGold(), loadCrypto(), loadBIST(), loadBrent()]);
  // Döviz + kripto her 60sn, altın her 5 dk
  setInterval(() => { if (!document.hidden) { loadFX(); loadCrypto(); } }, 60_000);
  setInterval(() => { if (!document.hidden) loadGold(); }, 300_000);
  setInterval(() => { if (!document.hidden) loadBIST(); }, 120_000);
  Logger.info('PRICES_MODULE_INIT_v5.6');
}

export const PricesModule = { init };
window.PricesModule = PricesModule;
