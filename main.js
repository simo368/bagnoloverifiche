/* ===================================
   ASD Bagnolo Calcio a 5 — Main JS
   =================================== */

// --- CONFIGURAZIONE FOGLI GOOGLE ---
// Incolla qui i link in formato TSV generati da Fogli Google (File > Condividi > Pubblica sul web > Formato: Valori separati da tabulazione (.tsv))
const URL_CLASSIFICA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=0&single=true&output=tsv";
const URL_RISULTATI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=18686350&single=true&output=tsv";
const URL_NEWS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=327540627&single=true&output=tsv";

// Funzione di utilità per leggere e parsare il TSV
async function fetchTSV(url) {
  try {
    if (!url || url.includes("INSERISCI_QUI")) return [];
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    lines.shift(); // Rimuove riga di intestazione
    return lines.map(line => line.split('\t').map(cell => cell.trim()));
  } catch (e) {
    console.error("Errore nel caricamento dati da Fogli Google: ", e);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Hamburger Menu (Mobile) ---- */
  const hamburger = document.querySelector('.hamburger');
  const navlinks = document.querySelector('.navlinks');
  if (hamburger && navlinks) {
    hamburger.addEventListener('click', () => {
      navlinks.classList.toggle('open');
    });
  }

  /* ---- Active Nav Link ---- */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  /* ---- Contact Form (simulated) ---- */
  const form = document.getElementById('form-contatti');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = 'Invio in corso...';
      btn.style.opacity = '0.7';
      btn.disabled = true;
      setTimeout(() => {
        alert('Messaggio inviato con successo! Ti risponderemo il prima possibile.');
        btn.innerText = originalText;
        btn.style.opacity = '1';
        btn.disabled = false;
        form.reset();
      }, 1000);
    });
  }

  /* ---- Dati Dinamici Fogli Google ---- */
  initDatiDinamici();

  /* ---- Timeline (Storia) ---- */
  const tl = document.getElementById('timeline-items');
  if (tl) {
    const storiaData = [
      ['1993', 'Fondazione ASD Bagnolo', 'Un gruppo di appassionati di Bagnolo in Piano fonda l\'associazione per promuovere il calcio a 5 nel territorio.'],
      ['1998', 'Prima promozione in Serie C', 'Dopo cinque stagioni di crescita, la prima squadra conquista la promozione nella Serie C regionale.'],
      ['2007', 'Apertura Settore Giovanile', 'Nasce ufficialmente il settore giovanile con Allievi e Giovanissimi. Il seme del futuro. Nello stesso anno nasce anche il sito web ufficiale.'],
      ['2015', 'Storica promozione in Serie B', 'Il traguardo più grande: la prima squadra raggiunge la Serie B FIGC, il secondo livello del futsal italiano.'],
      ['2017', 'Squadra Femminile ai Playoff', 'La G-Tech Bagnolo femminile raggiunge i playoff regionali, segnando un\'importante crescita del movimento.'],
      ['2026', 'Stagione in Serie B — Girone C', 'La squadra milita nel Girone C della Serie B, affrontando avversarie da tutta l\'Italia centro-settentrionale.'],
    ];
    storiaData.forEach(item => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;margin-bottom:28px;padding-left:4px';
      div.innerHTML = `
        <div class="timeline-dot"></div>
        <div style="font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:.2em;color:#F5C500;margin-bottom:3px">${item[0]}</div>
        <div style="font-family:var(--fd);font-weight:800;font-size:17px;text-transform:uppercase;color:#fff;margin-bottom:5px">${item[1]}</div>
        <div style="font-size:12px;color:#AAAAAA;line-height:1.6">${item[2]}</div>
      `;
      tl.appendChild(div);
    });
  }

});

/* =========================================
   FUNZIONI RENDER DATI DA FOGLI GOOGLE
   ========================================= */

async function initDatiDinamici() {
  await Promise.all([
    renderClassifica(),
    renderRisultati(),
    renderNews()
  ]);
}

async function renderClassifica() {
  const data = await fetchTSV(URL_CLASSIFICA);
  if (data.length === 0) {
    const elPos = document.getElementById('hero-classifica-pos');
    if (elPos) elPos.innerText = `-`;
    return;
  }

  // Aggiorna anteprima Home
  const bagnoloRow = data.find(r => r[1] && r[1].toLowerCase().includes('bagnolo'));
  if (bagnoloRow) {
    const elPos = document.getElementById('hero-classifica-pos');
    if (elPos) elPos.innerText = `${bagnoloRow[0]}° posto · ${bagnoloRow[6]} pt`;
  }

  // Render tabella completa in Classifica.html
  const tbody = document.getElementById('classifica-body');
  if (tbody) {
    tbody.innerHTML = '';
    data.forEach(r => {
      if (r.length < 7) return;
      const tr = document.createElement('tr');
      const highlight = r[1].toLowerCase().includes('bagnolo');
      if (highlight) tr.style.background = 'rgba(245,197,0,0.07)';
      const isFirst = r[0] === '1';
      tr.innerHTML = `
        <td style="text-align:left">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
            background:${isFirst ? '#F5C500' : '#222'};border-radius:3px;font-family:var(--fd);font-weight:800;
            font-size:11px;color:${isFirst ? '#0D0D0D' : '#aaa'}">${r[0]}</span>
        </td>
        <td style="text-align:left;font-weight:600;color:${highlight ? '#F5C500' : '#fff'}">${r[1]}</td>
        <td style="text-align:center">${r[2]}</td>
        <td style="text-align:center">${r[3]}</td>
        <td style="text-align:center">${r[4]}</td>
        <td style="text-align:center">${r[5]}</td>
        <td style="text-align:center;font-family:var(--fd);font-weight:900;font-size:14px;color:${highlight ? '#F5C500' : '#fff'}">${r[6]}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function renderRisultati() {
  const data = await fetchTSV(URL_RISULTATI);
  if (data.length === 0) {
    const heroRis = document.getElementById('hero-risultato-testo');
    if (heroRis) heroRis.innerText = 'Nessuna partita';
    const heroDett = document.getElementById('hero-risultato-dettaglio');
    if (heroDett) heroDett.innerHTML = '';
    const statContainer = document.getElementById('statistiche-stagione');
    if (statContainer) statContainer.innerHTML = '<div style="grid-column:1/-1;color:var(--gr)">Nessuna statistica disponibile</div>';
    return;
  }

  // Trova risultati effettivamente giocati
  const risultatiGiocati = data.filter(r => r[3] && r[4] && r[3] !== '' && r[4] !== '');
  const ultimo = risultatiGiocati[risultatiGiocati.length - 1];

  // Aggiorna Hero Bar in Home
  if (ultimo) {
    const heroRisultato = document.getElementById('hero-risultato-testo');
    const heroDettaglio = document.getElementById('hero-risultato-dettaglio');
    if (heroRisultato) {
      heroRisultato.innerText = `${ultimo[1]} ${ultimo[3]} — ${ultimo[4]} ${ultimo[2]}`;
      let esitoLabel = ultimo[5] === 'V' ? 'Vittoria' : (ultimo[5] === 'S' ? 'Sconfitta' : 'Pareggio');
      heroDettaglio.innerHTML = `<span style="font-size:11px;color:rgba(0,0,0,.55)">Giornata ${ultimo[0]}</span><span class="hero-bar-tag">${esitoLabel}</span>`;
    }
  }

  const heroGiornate = document.getElementById('hero-stagione-giornate');
  if (heroGiornate) {
    heroGiornate.innerHTML = `<span style="font-size:11px;color:rgba(0,0,0,.55)">${risultatiGiocati.length} giornate disputate</span>`;
  }

  // Render Tabella Tutti i Risultati
  const tuttiBody = document.getElementById('tutti-risultati-body');
  if (tuttiBody) {
    tuttiBody.innerHTML = '';
    data.forEach(r => {
      const isGiocata = r[3] && r[4];
      const tr = document.createElement('tr');
      let esitoHtml = '';
      if (isGiocata && r[5]) {
        let cl = r[5] === 'V' ? 'badge-v' : (r[5] === 'S' ? 'badge-s' : 'badge-n');
        esitoHtml = `<span class="${cl}">${r[5]}</span>`;
      }
      tr.innerHTML = `<td style="color:var(--gr);font-size:11px">${r[0]}</td><td>${r[1]} – ${r[2]}</td><td style="font-weight:700;text-align:center">${isGiocata ? r[3] + '-' + r[4] : '-'}</td><td style="text-align:center">${esitoHtml}</td>`;
      tuttiBody.appendChild(tr);
    });
  }

  // Render Tabella Ultimi 6 Risultati
  const ultimiBody = document.getElementById('ultimi-risultati-body');
  if (ultimiBody) {
    ultimiBody.innerHTML = '';
    const ultimiSei = risultatiGiocati.slice(-6).reverse();
    ultimiSei.forEach(r => {
      const tr = document.createElement('tr');
      let cl = r[5] === 'V' ? 'badge-v' : (r[5] === 'S' ? 'badge-s' : 'badge-n');
      let esitoHtml = `<span class="${cl}">${r[5]}</span>`;
      tr.innerHTML = `<td style="font-size:11px;color:var(--gr)">G.${r[0]}</td><td>${r[1]} – ${r[2]}</td><td style="font-weight:700;text-align:center">${r[3]}-${r[4]}</td><td style="text-align:center">${esitoHtml}</td>`;
      ultimiBody.appendChild(tr);
    });
  }

  // Statistiche Calcolate Automaticamente
  const statContainer = document.getElementById('statistiche-stagione');
  if (statContainer) {
    let v = 0, n = 0, s = 0, gf = 0, gs = 0, pt = 0;
    risultatiGiocati.forEach(r => {
      if (r[5] === 'V') { v++; pt += 3; }
      else if (r[5] === 'N') { n++; pt += 1; }
      else if (r[5] === 'S') { s++; }

      let golCasa = parseInt(r[3]) || 0;
      let golOspite = parseInt(r[4]) || 0;
      if (r[1].toLowerCase().includes('bagnolo')) {
        gf += golCasa; gs += golOspite;
      } else {
        gf += golOspite; gs += golCasa;
      }
    });
    statContainer.innerHTML = `
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:var(--y)">${v}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Vittorie</div></div>
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:#facc15">${n}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Pareggi</div></div>
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:#f87171">${s}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Sconfitte</div></div>
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:#fff">${gf}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Gol Fatti</div></div>
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:#fff">${gs}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Gol Subiti</div></div>
      <div><div style="font-family:var(--fd);font-weight:900;font-size:28px;color:var(--y)">${pt}</div><div style="font-size:10px;color:var(--gr);text-transform:uppercase;letter-spacing:.1em">Punti</div></div>
    `;
  }
}

window.newsDataStore = [];

function openNewsModal(index) {
  const r = window.newsDataStore[index];
  if (!r) return;

  let cat = r[0] || 'News';
  const info = r[1] || '';
  const title = r[2] || '';
  const riassunto = r[3] || '';
  const testoCompleto = r[4] || riassunto; // Fallback al riassunto se non c'è articolo lungo
  const result = r[5] || '';
  const esito = r[6] || '';
  const fotoUrl = r[7] || '';
  const altreFotoStr = r[8] || '';

  let tagColor = 'var(--y)'; let tagText = 'var(--bk)';
  let badgeHtml = '';
  if (esito === 'S') { tagColor = '#3a1a1a'; tagText = '#f87171'; cat = 'Sconfitta'; badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-s">S</span><span style="font-size:12px;font-weight:bold;color:#fff">${result}</span></div>`; }
  else if (esito === 'N') { tagColor = '#2a2a1a'; tagText = '#facc15'; cat = 'Pareggio'; badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-n">N</span><span style="font-size:12px;font-weight:bold;color:#fff">${result}</span></div>`; }
  else if (esito === 'V') { badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-v">V</span><span style="font-size:12px;font-weight:bold;color:#fff">${result}</span></div>`; }

  let imageHtml = '';
  if (fotoUrl) {
    imageHtml = `<img src="${fotoUrl}" alt="Immagine News" class="news-modal-image">`;
  }

  // Costruisci la griglia delle foto extra
  let galleryHtml = '';
  if (altreFotoStr.trim() !== '') {
    const urls = altreFotoStr.split(',').map(url => url.trim()).filter(url => url !== '');
    if (urls.length > 0) {
      galleryHtml = `<div style="margin-top:24px;border-top:1px solid var(--bd);padding-top:24px">
        <div style="font-family:var(--fd);font-weight:700;font-size:14px;text-transform:uppercase;color:var(--y);margin-bottom:12px;letter-spacing:0.1em">Galleria Foto</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:10px">
          ${urls.map(u => `<a href="${u}" target="_blank"><img src="${u}" style="width:100%;height:140px;object-fit:cover;border-radius:4px;border:1px solid var(--bd);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'"></a>`).join('')}
        </div>
      </div>`;
    }
  }

  // Crea la modale se non esiste
  let modalOverlay = document.getElementById('news-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'news-modal-overlay';
    modalOverlay.className = 'news-modal-overlay';
    modalOverlay.onclick = function (e) {
      if (e.target === modalOverlay) closeNewsModal();
    };
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="news-modal-content">
      <div class="news-modal-close" onclick="closeNewsModal()">×</div>
      ${imageHtml}
      <div class="news-modal-body">
        <div style="font-size:11px;color:var(--y);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">${info}</div>
        <div style="font-family:var(--fd);font-weight:900;font-size:24px;line-height:1.1;text-transform:uppercase;color:#fff;margin-bottom:16px">${title}</div>
        <div style="font-size:14px;color:var(--grl);line-height:1.7;white-space:pre-wrap;">${testoCompleto}</div>
        ${result ? badgeHtml : ''}
        ${galleryHtml}
      </div>
    </div>
  `;

  // Previene lo scrolling della pagina sotto la modale
  document.body.style.overflow = 'hidden';

  // Mostra la modale (timeout per transizione CSS)
  setTimeout(() => modalOverlay.classList.add('active'), 10);
}

function closeNewsModal() {
  const modalOverlay = document.getElementById('news-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      document.body.style.overflow = '';
      modalOverlay.remove();
    }, 300);
  }
}

async function renderNews() {
  const data = await fetchTSV(URL_NEWS);
  const homeContainer = document.getElementById('home-news-container');
  const newsContainer = document.getElementById('news-container');

  if (data.length === 0) {
    if (homeContainer) homeContainer.innerHTML = '<div style="color:var(--gr)">Nessuna news al momento.</div>';
    if (newsContainer) newsContainer.innerHTML = '<div style="color:var(--gr)">Nessuna news al momento.</div>';
    return;
  }

  // Ordine inverso per avere le più recenti in alto
  const reversedData = [...data].reverse();
  window.newsDataStore = reversedData;

  function buildCardHtml(r, index) {
    let cat = r[0] || 'News';
    const info = r[1] || '';
    const title = r[2] || '';
    const riassunto = r[3] || '';
    // Usa il riassunto per la card. Se non c'è, previene errori.
    const textPreview = riassunto.length > 130 ? riassunto.substring(0, 130) + '...' : riassunto;
    const result = r[5] || '';
    const esito = r[6] || '';
    const fotoUrl = r[7] || '';

    let tagColor = 'var(--y)'; let tagText = 'var(--bk)';
    let badgeHtml = '';
    if (esito === 'S') { tagColor = '#3a1a1a'; tagText = '#f87171'; cat = 'Sconfitta'; badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-s">S</span><span style="font-size:11px;color:var(--gr)">' + result + '</span></div>'; }
    else if (esito === 'N') { tagColor = '#2a2a1a'; tagText = '#facc15'; cat = 'Pareggio'; badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-n">N</span><span style="font-size:11px;color:var(--gr)">' + result + '</span></div>'; }
    else if (esito === 'V') { badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-v">V</span><span style="font-size:11px;color:var(--gr)">' + result + '</span></div>'; }

    // Immagine di fallback per la card
    let cardImageStyle = fotoUrl
      ? "background-image: url('" + fotoUrl + "'); background-size: cover; background-position: center; border-radius: 6px 6px 0 0; border-bottom: 1px solid var(--bd);"
      : "background: var(--bg3);";

    let iconHtml = fotoUrl
      ? ''
      : '<div style="width:50px;height:50px;border-radius:50%;background:rgba(245,197,0,.15);display:flex;align-items:center;justify-content:center"><div style="width:22px;height:22px;border-radius:50%;background:rgba(245,197,0,.3)"></div></div>';

    return '' +
      '<div class="card" onclick="openNewsModal(' + index + ')" style="text-decoration:none;display:block;cursor:pointer;">' +
      '<div style="height:140px;' + cardImageStyle + 'display:flex;align-items:center;justify-content:center;position:relative">' +
      iconHtml +
      '<div style="position:absolute;top:10px;left:10px;background:' + tagColor + ';color:' + tagText + ';font-family:var(--fd);font-weight:800;font-size:9px;letter-spacing:.15em;text-transform:uppercase;padding:3px 8px;border-radius:2px">' + cat + '</div>' +
      '</div>' +
      '<div style="padding:18px">' +
      '<div style="font-size:11px;color:var(--gr);margin-bottom:7px">' + info + '</div>' +
      '<div style="font-family:var(--fd);font-weight:800;font-size:17px;line-height:1.2;text-transform:uppercase;color:#fff;margin-bottom:8px">' + title + '</div>' +
      '<div style="font-size:12px;color:var(--gr);line-height:1.6">' + textPreview + '</div>' +
      (result ? badgeHtml : '<div style="font-family:var(--fd);font-weight:700;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--y);margin-top:14px">Leggi tutto &rarr;</div>') +
      '</div>' +
      '</div>';
  }

  if (homeContainer) {
    homeContainer.innerHTML = '';
    reversedData.slice(0, 3).forEach((r, index) => {
      homeContainer.innerHTML += buildCardHtml(r, index);
    });
  }

  if (newsContainer) {
    newsContainer.innerHTML = '';
    reversedData.forEach((r, index) => {
      newsContainer.innerHTML += buildCardHtml(r, index);
    });
  }
}
