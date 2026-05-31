/* ===================================
   ASD Bagnolo Calcio a 5 — Main JS
   =================================== */

// --- CONFIGURAZIONE WEBHOOKS MAKE.COM ---
const URL_WEBHOOK_CONTATTI = "https://hook.eu1.make.com/plb8bic7wyxpayf6qvwfachiewx33rf4";

// --- CONFIGURAZIONE FOGLI GOOGLE ---
const URL_CLASSIFICA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=0&single=true&output=tsv";
const URL_RISULTATI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=18686350&single=true&output=tsv";
const URL_NEWS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGt93SnbyMxCa8iiNGD1kSFmINdNsFT7uIVYvCuuqGj8IuZ4OyDcW5fqvRSGpyuAfV-2kE7WYMLMLP/pub?gid=327540627&single=true&output=tsv";

// Funzione di utilità per sanificare HTML contro attacchi XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text.replace(/[&<>"']/g, function (match) {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return match;
    }
  });
}

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
  // Tracciamento tempo caricamento per anti-spam
  const pageLoadedAt = Date.now();

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

  /* ---- Contact Form (Make.com Automation + Anti-Spam) ---- */
  const form = document.getElementById('form-contatti');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const feedback = document.getElementById('contatti-feedback');

      // Resetta feedback precedente
      if (feedback) feedback.innerHTML = '';

      // 1. Honeypot check (anti-spam)
      const honeypot = document.getElementById('contatti-cf-verification');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Spam rilevato tramite Honeypot.');
        // Mostriamo un finto successo per confondere il bot
        if (feedback) {
          feedback.innerHTML = `
            <div style="background:rgba(59,109,17,0.1);border:1px solid #3B6D11;color:#639922;padding:12px;border-radius:6px;font-size:13px;margin-top:14px">
              Messaggio inviato con successo! Ti risponderemo il prima possibile.
            </div>
          `;
        }
        form.reset();
        return;
      }

      // 2. Timestamp check (anti-spam)
      const secondsSinceLoad = (Date.now() - pageLoadedAt) / 1000;
      if (secondsSinceLoad < 3.0) {
        console.warn('Invio troppo rapido (Spam bot sospetto).');
        if (feedback) {
          feedback.innerHTML = `
            <div class="error-message">
              <span>⚠️</span>
              <span>Invio non autorizzato. Riprova con più calma.</span>
            </div>
          `;
        }
        return;
      }

      // Imposta stato di loading premium
      btn.classList.add('btn-loading');
      btn.disabled = true;

      // Raccoglie i dati del form
      const data = {
        nome: document.getElementById('contatti-nome').value.trim(),
        email: document.getElementById('contatti-email').value.trim(),
        oggetto: document.getElementById('contatti-oggetto').value,
        messaggio: document.getElementById('contatti-messaggio').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch(URL_WEBHOOK_CONTATTI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          // Successo
          alert('Messaggio inviato con successo! Ti risponderemo il prima possibile.');
          form.reset();
        } else {
          throw new Error('Server returned status: ' + response.status);
        }
      } catch (error) {
        console.error('Errore durante l\'invio del modulo contatti:', error);
        if (feedback) {
          feedback.innerHTML = `
            <div class="error-message">
              <span>⚠️</span>
              <span>Si è verificato un errore durante l'invio. Riprova più tardi o contatta direttamente <strong>info@bagnolocalcioa5.com</strong>.</span>
            </div>
          `;
        } else {
          alert('Si è verificato un errore durante l\'invio. Ti invitiamo a riprovare più tardi o a scriverci a info@bagnolocalcioa5.com');
        }
      } finally {
        // Ripristina stato del pulsante
        btn.classList.remove('btn-loading');
        btn.disabled = false;
      }
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
        <div style="font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:.2em;color:#F5C500;margin-bottom:3px">${escapeHTML(item[0])}</div>
        <div style="font-family:var(--fd);font-weight:800;font-size:17px;text-transform:uppercase;color:#fff;margin-bottom:5px">${escapeHTML(item[1])}</div>
        <div style="font-size:12px;color:#AAAAAA;line-height:1.6">${escapeHTML(item[2])}</div>
      `;
      tl.appendChild(div);
    });
  }

  /* ---- Cookie Banner ---- */
  initCookieBanner();

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
  const tbody = document.getElementById('classifica-body');

  // Mostra Skeleton loader se presente tbody
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="7"><div class="skeleton-row"></div></td></tr>
      <tr><td colspan="7"><div class="skeleton-row"></div></td></tr>
      <tr><td colspan="7"><div class="skeleton-row"></div></td></tr>
    `;
  }

  const data = await fetchTSV(URL_CLASSIFICA);
  if (data.length === 0) {
    const elPos = document.getElementById('hero-classifica-pos');
    if (elPos) elPos.innerText = `-`;
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--gr)">Dati classifica non disponibili.</td></tr>`;
    return;
  }

  // Aggiorna anteprima Home
  const bagnoloRow = data.find(r => r[1] && r[1].toLowerCase().includes('bagnolo'));
  if (bagnoloRow) {
    const elPos = document.getElementById('hero-classifica-pos');
    if (elPos) elPos.innerText = `${escapeHTML(bagnoloRow[0])}° posto · ${escapeHTML(bagnoloRow[6])} pt`;
  }

  // Render tabella completa in Classifica.html
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
            font-size:11px;color:${isFirst ? '#0D0D0D' : '#aaa'}">${escapeHTML(r[0])}</span>
        </td>
        <td style="text-align:left;font-weight:600;color:${highlight ? '#F5C500' : '#fff'}">${escapeHTML(r[1])}</td>
        <td style="text-align:center">${escapeHTML(r[2])}</td>
        <td style="text-align:center">${escapeHTML(r[3])}</td>
        <td style="text-align:center">${escapeHTML(r[4])}</td>
        <td style="text-align:center">${escapeHTML(r[5])}</td>
        <td style="text-align:center;font-family:var(--fd);font-weight:900;font-size:14px;color:${highlight ? '#F5C500' : '#fff'}">${escapeHTML(r[6])}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

async function renderRisultati() {
  const tuttiBody = document.getElementById('tutti-risultati-body');
  const ultimiBody = document.getElementById('ultimi-risultati-body');

  if (tuttiBody) {
    tuttiBody.innerHTML = `<tr><td colspan="4"><div class="skeleton-row"></div></td></tr>`;
  }
  if (ultimiBody) {
    ultimiBody.innerHTML = `<tr><td colspan="4"><div class="skeleton-row"></div></td></tr>`;
  }

  const data = await fetchTSV(URL_RISULTATI);
  if (data.length === 0) {
    const heroRis = document.getElementById('hero-risultato-testo');
    if (heroRis) heroRis.innerText = 'Nessuna partita';
    const heroDett = document.getElementById('hero-risultato-dettaglio');
    if (heroDett) heroDett.innerHTML = '';
    const statContainer = document.getElementById('statistiche-stagione');
    if (statContainer) statContainer.innerHTML = '<div style="grid-column:1/-1;color:var(--gr)">Nessuna statistica disponibile</div>';
    if (tuttiBody) tuttiBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--gr)">Risultati non disponibili.</td></tr>`;
    if (ultimiBody) ultimiBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--gr)">Risultati non disponibili.</td></tr>`;
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
      heroRisultato.innerText = `${escapeHTML(ultimo[1])} ${escapeHTML(ultimo[3])} — ${escapeHTML(ultimo[4])} ${escapeHTML(ultimo[2])}`;
      let esitoLabel = ultimo[5] === 'V' ? 'Vittoria' : (ultimo[5] === 'S' ? 'Sconfitta' : 'Pareggio');
      heroDettaglio.innerHTML = `<span style="font-size:11px;color:rgba(0,0,0,.55)">Giornata ${escapeHTML(ultimo[0])}</span><span class="hero-bar-tag">${escapeHTML(esitoLabel)}</span>`;
    }
  }

  const heroGiornate = document.getElementById('hero-stagione-giornate');
  if (heroGiornate) {
    heroGiornate.innerHTML = `<span style="font-size:11px;color:rgba(0,0,0,.55)">${escapeHTML(risultatiGiocati.length)} giornate disputate</span>`;
  }

  // Render Tabella Tutti i Risultati
  if (tuttiBody) {
    tuttiBody.innerHTML = '';
    data.forEach(r => {
      const isGiocata = r[3] && r[4];
      const tr = document.createElement('tr');
      let esitoHtml = '';
      if (isGiocata && r[5]) {
        let cl = r[5] === 'V' ? 'badge-v' : (r[5] === 'S' ? 'badge-s' : 'badge-n');
        esitoHtml = `<span class="${cl}">${escapeHTML(r[5])}</span>`;
      }
      tr.innerHTML = `<td style="color:var(--gr);font-size:11px">${escapeHTML(r[0])}</td><td>${escapeHTML(r[1])} – ${escapeHTML(r[2])}</td><td style="font-weight:700;text-align:center">${isGiocata ? escapeHTML(r[3]) + '-' + escapeHTML(r[4]) : '-'}</td><td style="text-align:center">${esitoHtml}</td>`;
      tuttiBody.appendChild(tr);
    });
  }

  // Render Tabella Ultimi 6 Risultati
  if (ultimiBody) {
    ultimiBody.innerHTML = '';
    const ultimiSei = risultatiGiocati.slice(-6).reverse();
    ultimiSei.forEach(r => {
      const tr = document.createElement('tr');
      let cl = r[5] === 'V' ? 'badge-v' : (r[5] === 'S' ? 'badge-s' : 'badge-n');
      let esitoHtml = `<span class="${cl}">${escapeHTML(r[5])}</span>`;
      tr.innerHTML = `<td style="font-size:11px;color:var(--gr)">G.${escapeHTML(r[0])}</td><td>${escapeHTML(r[1])} – ${escapeHTML(r[2])}</td><td style="font-weight:700;text-align:center">${escapeHTML(r[3])}-${escapeHTML(r[4])}</td><td style="text-align:center">${esitoHtml}</td>`;
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
  if (esito === 'S') { tagColor = '#3a1a1a'; tagText = '#f87171'; cat = 'Sconfitta'; badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-s">S</span><span style="font-size:12px;font-weight:bold;color:#fff">${escapeHTML(result)}</span></div>`; }
  else if (esito === 'N') { tagColor = '#2a2a1a'; tagText = '#facc15'; cat = 'Pareggio'; badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-n">N</span><span style="font-size:12px;font-weight:bold;color:#fff">${escapeHTML(result)}</span></div>`; }
  else if (esito === 'V') { badgeHtml = `<div style="display:inline-flex;gap:6px;align-items:center;margin-top:14px;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:4px"><span class="badge-v">V</span><span style="font-size:12px;font-weight:bold;color:#fff">${escapeHTML(result)}</span></div>`; }

  let imageHtml = '';
  if (fotoUrl) {
    imageHtml = `<img src="${escapeHTML(fotoUrl)}" alt="Immagine News" class="news-modal-image">`;
  }

  // Costruisci la griglia delle foto extra
  let galleryHtml = '';
  if (altreFotoStr.trim() !== '') {
    const urls = altreFotoStr.split(',').map(url => url.trim()).filter(url => url !== '');
    if (urls.length > 0) {
      galleryHtml = `<div style="margin-top:24px;border-top:1px solid var(--bd);padding-top:24px">
        <div style="font-family:var(--fd);font-weight:700;font-size:14px;text-transform:uppercase;color:var(--y);margin-bottom:12px;letter-spacing:0.1em">Galleria Foto</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:10px">
          ${urls.map(u => `<a href="${escapeHTML(u)}" target="_blank"><img src="${escapeHTML(u)}" style="width:100%;height:140px;object-fit:cover;border-radius:4px;border:1px solid var(--bd);transition:transform 0.2s" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'"></a>`).join('')}
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
        <div style="font-size:11px;color:var(--y);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">${escapeHTML(info)}</div>
        <div style="font-family:var(--fd);font-weight:900;font-size:24px;line-height:1.1;text-transform:uppercase;color:#fff;margin-bottom:16px">${escapeHTML(title)}</div>
        <div style="font-size:14px;color:var(--grl);line-height:1.7;white-space:pre-wrap;">${escapeHTML(testoCompleto)}</div>
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
  const homeContainer = document.getElementById('home-news-container');
  const newsContainer = document.getElementById('news-container');

  const skeletonHtml = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
  `;

  if (homeContainer) homeContainer.innerHTML = skeletonHtml;
  if (newsContainer) newsContainer.innerHTML = skeletonHtml;

  const data = await fetchTSV(URL_NEWS);

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
    const textPreview = riassunto.length > 130 ? riassunto.substring(0, 130) + '...' : riassunto;
    const result = r[5] || '';
    const esito = r[6] || '';
    const fotoUrl = r[7] || '';

    let tagColor = 'var(--y)'; let tagText = 'var(--bk)';
    let badgeHtml = '';
    if (esito === 'S') { tagColor = '#3a1a1a'; tagText = '#f87171'; cat = 'Sconfitta'; badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-s">S</span><span style="font-size:11px;color:var(--gr)">' + escapeHTML(result) + '</span></div>'; }
    else if (esito === 'N') { tagColor = '#2a2a1a'; tagText = '#facc15'; cat = 'Pareggio'; badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-n">N</span><span style="font-size:11px;color:var(--gr)">' + escapeHTML(result) + '</span></div>'; }
    else if (esito === 'V') { badgeHtml = '<div style="display:flex;gap:6px;align-items:center;margin-top:14px"><span class="badge-v">V</span><span style="font-size:11px;color:var(--gr)">' + escapeHTML(result) + '</span></div>'; }

    // Immagine di fallback per la card
    let cardImageStyle = fotoUrl
      ? "background-image: url('" + escapeHTML(fotoUrl) + "'); background-size: cover; background-position: center; border-radius: 6px 6px 0 0; border-bottom: 1px solid var(--bd);"
      : "background: var(--bg3);";

    let iconHtml = fotoUrl
      ? ''
      : '<div style="width:50px;height:50px;border-radius:50%;background:rgba(245,197,0,.15);display:flex;align-items:center;justify-content:center"><div style="width:22px;height:22px;border-radius:50%;background:rgba(245,197,0,.3)"></div></div>';

    return '' +
      '<div class="card" onclick="openNewsModal(' + index + ')" style="text-decoration:none;display:block;cursor:pointer;">' +
      '<div style="height:140px;' + cardImageStyle + 'display:flex;align-items:center;justify-content:center;position:relative">' +
      iconHtml +
      '<div style="position:absolute;top:10px;left:10px;background:' + tagColor + ';color:' + tagText + ';font-family:var(--fd);font-weight:800;font-size:9px;letter-spacing:.15em;text-transform:uppercase;padding:3px 8px;border-radius:2px">' + escapeHTML(cat) + '</div>' +
      '</div>' +
      '<div style="padding:18px">' +
      '<div style="font-size:11px;color:var(--gr);margin-bottom:7px">' + escapeHTML(info) + '</div>' +
      '<div style="font-family:var(--fd);font-weight:800;font-size:17px;line-height:1.2;text-transform:uppercase;color:#fff;margin-bottom:8px">' + escapeHTML(title) + '</div>' +
      '<div style="font-size:12px;color:var(--gr);line-height:1.6">' + escapeHTML(textPreview) + '</div>' +
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

// Inizializzazione del Banner dei Cookie (GDPR Compliant)
function initCookieBanner() {
  if (localStorage.getItem('cookieConsent') === 'accepted') return;

  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    max-width: 600px;
    margin: 0 auto;
    background: #0d0d0d;
    border: 1px solid var(--bd, #222);
    border-top: 3px solid var(--y, #F5C500);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-family: sans-serif;
    color: #fff;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  banner.innerHTML = `
    <div style="font-size: 14px; line-height: 1.6; color: #ccc;">
      <strong style="color: var(--y, #F5C500); font-size: 15px; display: block; margin-bottom: 6px;">🍪 Rispetto della tua Privacy</strong>
      Questo sito utilizza cookie tecnici strettamente necessari al corretto funzionamento del portale e dei moduli d'iscrizione. Non viene utilizzato alcun cookie di profilazione o tracciamento commerciale. Puoi prendere visione dell'informativa completa nella nostra 
      <a href="privacy-policy.html" style="color: var(--y, #F5C500); text-decoration: underline;">Privacy & Cookie Policy</a>.
    </div>
    <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
      <button id="cookie-decline-btn" style="background: transparent; border: 1px solid #444; color: #aaa; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Solo Necessari</button>
      <button id="cookie-accept-btn" style="background: var(--y, #F5C500); border: none; color: #0d0d0d; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Accetta Tutti</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Trigger animazione di entrata
  setTimeout(() => {
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0)';
  }, 100);

  const acceptBtn = document.getElementById('cookie-accept-btn');
  const declineBtn = document.getElementById('cookie-decline-btn');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      hideBanner(banner);
    });
    acceptBtn.addEventListener('mouseover', () => acceptBtn.style.background = '#ffd700');
    acceptBtn.addEventListener('mouseout', () => acceptBtn.style.background = 'var(--y, #F5C500)');
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted'); // Solo tecnici comunque
      hideBanner(banner);
    });
    declineBtn.addEventListener('mouseover', () => {
      declineBtn.style.borderColor = '#666';
      declineBtn.style.color = '#fff';
    });
    declineBtn.addEventListener('mouseout', () => {
      declineBtn.style.borderColor = '#444';
      declineBtn.style.color = '#aaa';
    });
  }
}

function hideBanner(banner) {
  banner.style.opacity = '0';
  banner.style.transform = 'translateY(30px)';
  setTimeout(() => banner.remove(), 400);
}
