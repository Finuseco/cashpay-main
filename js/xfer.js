/* Section « Envoyez de l'argent partout dans le monde » :
   deux téléphones recomposés en HTML/CSS (Kinshasa → Paris) et une animation du transfert,
   déclenchée au toucher du bouton « Envoyer Transfert » ou du bouton « Lancer le transfert ».
   Montants fictifs : exemple illustratif. */
document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('xfer-stage');
    if (!stage) return;

    const DEMO = { startFC: 1250000, startEUR: 1450, sentFC: 280000, recvEUR: 100, rate: 2800 };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const L = () => (window.I18N ? I18N.lang : 'fr');
    const T = (k, fr) => (window.I18N ? I18N.t(k, fr) : fr);

    /* ---------- formats de nombres (FR : 1 250 000 FC · 1 450,00 € / EN : 1,250,000 FC · €1,450.00) ---------- */
    const nf = (n, d) => new Intl.NumberFormat(L() === 'en' ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
    const fc = n => nf(Math.round(n), 0) + ' FC';
    const eur = n => (L() === 'en' ? '€' + nf(n, 2) : nf(n, 2) + ' €');

    /* ---------- construction des deux téléphones ---------- */
    const TILES = [
        ['or', 'fa-paper-plane', 'xf.t1', 'Envoyer Transfert'], ['', 'fa-arrow-down', 'xf.t2', 'Retrait Espèces'],
        ['', 'fa-circle-dollar-to-slot', 'xf.t3', 'Crédit & Prêts'], ['', 'fa-qrcode', 'xf.t4', 'PayScan Panier/POS'],
        ['or', 'fa-plus', 'xf.t5', 'Dépôt Recharger'], ['', 'fa-file-invoice', 'xf.t6', 'Paiement Factures'],
        ['', 'fa-credit-card', 'xf.t7', 'Mes Cartes'], ['', 'fa-sliders', 'xf.t8', 'Voir Plus']
    ];
    const KIND = {
        kin: { ava: 'P', flag: 'FR', cls: 'cdf', lbl: ['xf.lbl.cdf', 'Solde Franc Congolais (CDF)'], acct: 'CD0100000001', send: true,
               contacts: [['A', '#0f766e', 'Amani'], ['C', '#c2410c', 'Christel'], ['E', '#6d28d9', 'Éric']],
               rows: [['in', 'fa-arrow-down', 'xf.tx.d1', 'Dépôt Mobile Money', 'xf.yday', 'Hier', '+', 50000, 'fc'], ['out', 'fa-file-invoice', 'xf.tx.d2', 'Paiement de facture', 'xf.yday', 'Hier', '-', 15000, 'fc']] },
        par: { ava: 'P', flag: 'FR', cls: 'eur', lbl: ['xf.lbl.eur', 'Solde Euro (EUR)'], acct: 'FR0200000007', send: false,
               contacts: [['K', '#c2410c', 'Kévin'], ['M', '#0f766e', 'Marie'], ['L', '#6d28d9', 'Lucas']],
               rows: [['in', 'fa-credit-card', 'xf.tx.d3', 'Dépôt par carte', 'xf.yday', 'Hier', '+', 200, 'eur'], ['out', 'fa-bag-shopping', 'xf.tx.d4', 'Achat en ligne', 'xf.yday', 'Hier', '-', 12, 'eur']] }
    };
    const amt = (sign, v, cur) => (sign === '+' ? '+ ' : '− ') + (cur === 'fc' ? fc(v) : eur(v));
    const txRow = (r, cls) => `<li class="app-tx ${cls || ''}"><i class="${r[0]} fa-solid ${r[1]}"></i><div><b data-i18n="${r[2]}">${r[3]}</b><small data-i18n="${r[4]}">${r[5]}</small></div><strong class="${r[6] === '+' ? 'p' : 'm'}" data-amt="${r[6]}|${r[7]}|${r[8]}">${amt(r[6], r[7], r[8])}</strong></li>`;

    const phone = (id) => {
        const k = KIND[id];
        const tiles = TILES.map((t, i) => `<div class="app-tile ${t[0]}${k.send && i === 0 ? ' xf-send' : ''}"><i class="fa-solid ${t[1]}"></i><span data-i18n="${t[2]}">${t[3]}</span></div>`).join('');
        const cos = k.contacts.map(c => `<div class="app-co"><i style="background:${c[1]}">${c[0]}</i>${c[2]}</div>`).join('');
        return `<div class="device xf-phone ${id}" aria-hidden="true">
            <span class="dev-key k1"></span><span class="dev-key k2"></span><span class="dev-key k3"></span>
            <div class="dev-screen"><div class="app">
                <div class="app-top">
                    <div class="app-status"><span>12:19</span><span><i class="fa-solid fa-signal"></i> <i class="fa-solid fa-battery-three-quarters"></i></span></div>
                    <div class="app-head"><span class="app-ava">${k.ava}</span>
                        <div class="app-hi"><small data-i18n="xf.hello">Bienvenue</small><b>Patrick <i class="fa-solid fa-circle-check"></i></b></div>
                        <span class="app-pill">${k.flag}</span><span class="app-ic"><i class="fa-solid fa-bell"></i><em></em></span><span class="app-ic"><i class="fa-solid fa-gear"></i></span></div>
                    <div class="app-card ${k.cls}"><div class="app-card-l"><span data-i18n="${k.lbl[0]}">${k.lbl[1]}</span> <i class="fa-regular fa-eye"></i></div>
                        <div class="app-bal" data-bal="${id}"></div>
                        <div class="app-acct"><span><span data-i18n="xf.acct">N° de compte CP</span> : ${k.acct}</span><i class="fa-regular fa-copy"></i></div></div>
                    <div class="app-dots"><i class="on"></i><i></i><i></i><i></i></div>
                </div>
                <div class="app-body">
                    <div class="app-sec"><b data-i18n="xf.recent">Contacts récents</b><span data-i18n="xf.all">Voir tout</span></div>
                    <div class="app-contacts">${cos}<div class="app-co add"><i class="fa-solid fa-plus"></i><span data-i18n="xf.add">Ajouter</span></div><div class="app-co all"><i class="fa-solid fa-user"></i><span data-i18n="xf.contacts">Contacts</span></div></div>
                    <div class="app-grid">${tiles}</div>
                    <div class="app-sec"><b data-i18n="xf.tx">Transactions</b><span data-i18n="xf.all">Voir tout</span></div>
                    <div class="app-tabs"><span class="on" data-i18n="xf.tab1">Toutes</span><span data-i18n="xf.tab2">Entrants (+)</span><span data-i18n="xf.tab3">Sortants (-)</span></div>
                    <ul class="app-list" data-list="${id}">${k.rows.map(r => txRow(r)).join('')}</ul>
                </div>
                <div class="app-nav"><span class="on"><i class="fa-solid fa-wallet"></i><span data-i18n="xf.n1">Portefeuille</span></span><span><i class="fa-solid fa-clock-rotate-left"></i><span data-i18n="xf.n2">Historique</span></span><span class="fab"><i class="fa-solid fa-plus"></i></span><span><i class="fa-regular fa-credit-card"></i><span data-i18n="xf.n3">Cartes</span></span><span><i class="fa-solid fa-user"></i><span data-i18n="xf.n4">Profil</span></span></div>
            </div></div>
            <span class="dev-cam"></span></div>`;
    };

    const arcSvg = `<svg class="xfer-arc" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <defs><mask id="xf-mask" maskUnits="userSpaceOnUse" x="-100" y="-400" width="1200" height="1800"><path id="xf-reveal" d="" fill="none" stroke="#fff" stroke-width="60" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></mask></defs>
        <path class="arc-base" id="xf-base" d=""/><path class="arc-trail" id="xf-trail" d="" mask="url(#xf-mask)"/></svg>`;

    stage.innerHTML = `<div class="xfer-map"></div>${arcSvg}
        <div class="xf-city l"><i class="fa-solid fa-location-dot" style="color:#9f5dd7"></i><span data-i18n="xf.kin">Kinshasa, RDC</span><em>CDF</em></div>
        <div class="xf-city r"><i class="fa-solid fa-location-dot" style="color:#6c15c1"></i><span data-i18n="xf.par">Paris, France</span><em>EUR</em></div>
        ${phone('kin')}${phone('par')}
        <div class="xf-coin usd"><b>$</b><small>USD</small></div><div class="xf-coin gbp"><b>£</b><small>GBP</small></div><div class="xf-coin cny"><b>¥</b><small>CNY</small></div>
        <div class="xf-rate"><span data-i18n="xf.rate">Taux en temps réel</span> : <b>1 € = ${fc(DEMO.rate)}</b></div>
        <div class="xf-hint"><i class="fa-solid fa-hand-pointer"></i><span data-i18n="xf.hint">Touchez « Envoyer »</span></div>
        <div class="xf-bubble sent"><i class="fa-solid fa-arrow-up"></i><div><small data-i18n="xf.sent">Envoyé</small><b data-sent></b></div></div>
        <div class="xf-bubble recv"><i class="fa-solid fa-arrow-down"></i><div><small data-i18n="xf.recv">Reçu</small><b data-recv></b></div></div>
        <div class="xf-plane" id="xf-plane"><i class="fa-solid fa-paper-plane"></i></div>`;

    /* ---------- trajectoire : courbe de Bézier en coordonnées normalisées (0..1 de la scène) ---------- */
    const SHAPES = {
        wide: [[.30, .31], [.40, -.05], [.60, -.05], [.70, .31]],
        narrow: [[.26, .25], [.34, -.02], [.66, -.02], [.74, .25]]
    };
    const mq = window.matchMedia('(max-width: 760px)');
    let P = SHAPES.wide;
    const bez = t => {
        const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
        return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
    };
    const setShape = () => {
        P = mq.matches ? SHAPES.narrow : SHAPES.wide;
        const d = `M${P[0][0] * 1000} ${P[0][1] * 1000} C${P[1][0] * 1000} ${P[1][1] * 1000} ${P[2][0] * 1000} ${P[2][1] * 1000} ${P[3][0] * 1000} ${P[3][1] * 1000}`;
        ['xf-base', 'xf-trail', 'xf-reveal'].forEach(id => stage.querySelector('#' + id).setAttribute('d', d));
    };
    setShape();
    (mq.addEventListener ? mq.addEventListener('change', setShape) : mq.addListener(setShape));

    /* ---------- état et rendu ---------- */
    const $ = s => stage.querySelector(s);
    const balKin = $('[data-bal="kin"]'), balPar = $('[data-bal="par"]');
    const plane = $('#xf-plane'), reveal = $('#xf-reveal');
    const bSent = $('.xf-bubble.sent'), bRecv = $('.xf-bubble.recv');
    const playBtn = document.getElementById('xf-play'), playLbl = playBtn && playBtn.querySelector('span'), playIco = playBtn && playBtn.querySelector('i');
    const live = document.getElementById('xf-live');
    let fcNow = DEMO.startFC, eurNow = DEMO.startEUR, mode = 'idle';   // idle | running | done

    const paint = () => {
        balKin.textContent = fc(fcNow); balPar.textContent = eur(eurNow);
        $('[data-sent]').textContent = '− ' + fc(DEMO.sentFC); $('[data-recv]').textContent = '+ ' + eur(DEMO.recvEUR);
        stage.querySelectorAll('[data-amt]').forEach(el => { const [s, v, c] = el.getAttribute('data-amt').split('|'); el.textContent = amt(s, +v, c); });
        const rate = $('.xf-rate b'); if (rate) rate.textContent = '1 € = ' + fc(DEMO.rate);
    };
    const label = () => {
        if (!playLbl) return;
        const m = { idle: ['xf.play', 'Lancer le transfert', 'fa-play'], running: ['xf.running', 'Transfert en cours…', 'fa-spinner fa-spin'], done: ['xf.replay', 'Rejouer le transfert', 'fa-rotate-right'] }[mode];
        playLbl.textContent = T(m[0], m[1]); playIco.className = 'fa-solid ' + m[2]; playBtn.disabled = mode === 'running';
    };
    const reset = () => {
        fcNow = DEMO.startFC; eurNow = DEMO.startEUR; mode = 'idle';
        stage.classList.remove('is-run', 'is-done');
        [bSent, bRecv].forEach(b => b.classList.remove('show'));
        plane.classList.remove('fly'); reveal.style.strokeDashoffset = 1;
        stage.querySelectorAll('.app-tx.new').forEach(n => n.remove());
        stage.querySelectorAll('.xf-phone').forEach(p => p.classList.remove('pulse'));
        paint(); label();
    };
    const addRow = (id, row) => { const ul = $(`[data-list="${id}"]`); ul.insertAdjacentHTML('afterbegin', txRow(row, 'new' + (id === 'par' ? ' in-row' : ''))); const li = ul.firstElementChild; li.querySelectorAll('[data-i18n]').forEach(e => { if (window.I18N && L() === 'en') e.textContent = I18N.t(e.getAttribute('data-i18n'), e.textContent); }); };

    const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const FLY_START = 700, FLY_END = 3300, DONE = 5600;

    function run() {
        if (mode === 'running') return;
        reset(); mode = 'running'; label();
        stage.classList.add('is-run');
        const tile = $('.xf-send'); tile.classList.add('pressed'); setTimeout(() => tile.classList.remove('pressed'), 260);
        bSent.classList.add('show');

        if (reduce) { finish(); return; }
        const t0 = performance.now(); let arrived = false;
        const frame = now => {
            const e = now - t0;
            if (e >= FLY_START && !arrived) {
                const p = Math.min(1, (e - FLY_START) / (FLY_END - FLY_START)), q = ease(p), [x, y] = bez(q);
                plane.classList.add('fly'); plane.style.left = x * 100 + '%'; plane.style.top = y * 100 + '%';
                reveal.style.strokeDashoffset = 1 - q;
                fcNow = DEMO.startFC - DEMO.sentFC * q; balKin.textContent = fc(fcNow);
                if (p >= 1) {
                    arrived = true; plane.classList.remove('fly');
                    $('.xf-phone.par').classList.add('pulse'); bRecv.classList.add('show');
                    addRow('kin', ['out', 'fa-paper-plane', 'xf.tx.out', 'Transfert vers Paris', 'xf.now', "À l'instant", '-', DEMO.sentFC, 'fc']);
                    addRow('par', ['in', 'fa-arrow-down', 'xf.tx.in', 'Reçu de Kinshasa', 'xf.now', "À l'instant", '+', DEMO.recvEUR, 'eur']);
                    countUp(performance.now());
                }
            }
            if (e < DONE) requestAnimationFrame(frame); else finish();
        };
        requestAnimationFrame(frame);
    }
    function countUp(start) {
        const step = now => { const p = Math.min(1, (now - start) / 900); eurNow = DEMO.startEUR + DEMO.recvEUR * (1 - Math.pow(1 - p, 3)); balPar.textContent = eur(eurNow); if (p < 1 && mode === 'running') requestAnimationFrame(step); };
        requestAnimationFrame(step);
    }
    function finish() {
        fcNow = DEMO.startFC - DEMO.sentFC; eurNow = DEMO.startEUR + DEMO.recvEUR;
        reveal.style.strokeDashoffset = 0; plane.classList.remove('fly');
        bSent.classList.add('show'); bRecv.classList.add('show');
        if (!stage.querySelector('[data-list="kin"] .app-tx.new')) {
            addRow('kin', ['out', 'fa-paper-plane', 'xf.tx.out', 'Transfert vers Paris', 'xf.now', "À l'instant", '-', DEMO.sentFC, 'fc']);
            addRow('par', ['in', 'fa-arrow-down', 'xf.tx.in', 'Reçu de Kinshasa', 'xf.now', "À l'instant", '+', DEMO.recvEUR, 'eur']);
        }
        stage.classList.remove('is-run'); stage.classList.add('is-done'); mode = 'done'; paint(); label();
        if (live) live.textContent = `${T('xf.sent', 'Envoyé')} : ${fc(DEMO.sentFC)} → ${T('xf.recv', 'Reçu')} : ${eur(DEMO.recvEUR)}`;
    }

    /* ---------- entrées : toucher le téléphone, le bouton, ou arrivée dans l'écran ---------- */
    stage.addEventListener('click', e => { if (e.target.closest('.xf-send')) run(); });
    if (playBtn) playBtn.addEventListener('click', run);
    document.querySelectorAll('.xf-feat').forEach(f => f.addEventListener('click', () => { f.classList.remove('tapped'); void f.offsetWidth; f.classList.add('tapped'); }));
    let auto = false;
    new IntersectionObserver(es => { if (es[0].isIntersecting && !auto && mode === 'idle') { auto = true; setTimeout(run, 500); } }, { threshold: 0.5 }).observe(stage);
    document.addEventListener('langchange', () => { paint(); label(); });

    paint(); label();
});
