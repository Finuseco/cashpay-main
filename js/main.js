/* Interactions communes : rendu des composants, langue, menu, animations, filtres, formulaire. */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Composants partagés + contenu dynamique
    if (window.renderLayout) window.renderLayout();
    if (window.renderServices) window.renderServices();

    // 2. Langue
    I18N.apply(I18N.initial());
    document.addEventListener('click', e => {
        const b = e.target.closest('.lang button');
        if (b) I18N.apply(b.getAttribute('data-lang'));
    });

    // 3. En-tête : ombre au défilement
    const header = document.getElementById('site-header');
    const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 4. Menu mobile + sous-menu « À propos »
    const toggle = document.getElementById('menu-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.querySelector('i').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
    }
    document.querySelectorAll('.has-dd > button').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const li = btn.parentElement;
            const open = li.classList.toggle('open');
            btn.setAttribute('aria-expanded', String(open));
        });
    });
    document.addEventListener('click', () => document.querySelectorAll('.has-dd.open').forEach(li => li.classList.remove('open')));

    // 5. Apparition au défilement
    const reveal = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
        el.style.setProperty('--d', ((i % 6) * 0.07) + 's');
        reveal.observe(el);
    });

    // 6. Compteurs animés
    const counter = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            counter.unobserve(en.target);
            const el = en.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            const suffix = el.getAttribute('data-suffix') || '';
            const start = performance.now();
            const tick = now => {
                const p = Math.min((now - start) / 1200, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(el => counter.observe(el));

    // 7. Filtres des services
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter');
        filters.forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('[data-services] .card').forEach(c => {
            c.classList.toggle('hidden', cat !== 'all' && c.getAttribute('data-cat') !== cat);
            c.classList.add('in');
        });
    }));

    // 8. Message WhatsApp pré-rempli selon la langue
    const wa = document.getElementById('wa-float');
    const updateWa = () => {
        if (wa) wa.href = 'https://wa.me/' + CASHPAY.WA_NUMBER + '?text=' + encodeURIComponent(I18N.t('wa.msg', 'Bonjour CashPay, '));
    };
    updateWa();
    document.addEventListener('langchange', updateWa);

    // 9. Formulaire de contact (ouvre le client mail ou WhatsApp)
    const form = document.getElementById('contact-form');
    if (form) {
        const build = () => {
            const d = new FormData(form);
            const name = (d.get('name') || '').toString().trim();
            const email = (d.get('email') || '').toString().trim();
            const subject = (d.get('subject') || '').toString().trim();
            const msg = (d.get('message') || '').toString().trim();
            if (!name || !msg) { alert(I18N.t('ct.err', 'Merci de renseigner votre nom et votre message.')); return null; }
            const body = msg + '\n\n— ' + name + (email ? ' (' + email + ')' : '');
            return { subject, body };
        };
        form.addEventListener('submit', e => {
            e.preventDefault();
            const m = build();
            if (m) window.location.href = 'mailto:' + CASHPAY.EMAIL + '?subject=' + encodeURIComponent('[CashPay] ' + m.subject) + '&body=' + encodeURIComponent(m.body);
        });
        const waBtn = document.getElementById('contact-wa');
        if (waBtn) waBtn.addEventListener('click', () => {
            const m = build();
            if (m) window.open('https://wa.me/' + CASHPAY.WA_NUMBER + '?text=' + encodeURIComponent(m.subject + '\n' + m.body), '_blank', 'noopener');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
// 10. Ordinateur qui code : frappe animée d'un exemple de code (décoratif)
(function () {
    const out = document.querySelector('[data-typing]');
    if (!out) return;
    const nums = document.querySelector('[data-lines]');
    const pos = document.querySelector('[data-pos]');
    const body = out.closest('.ed-body');
    const CODE = [
        '// Exemple illustratif — votre vision, notre code',
        'const app = {',
        '  nom: "Votre application",',
        '  modules: ["core e-banking", "stock", "finances"],',
        '  mobile: ["Android", "iOS"],',
        '};',
        '',
        'async function payer(commande) {',
        '  const res = await CashPay.collect(commande);',
        '  if (res.status === "SUCCESS") {',
        '    await notifier("SMS", "WhatsApp");',
        '  }',
        '  return res;',
        '}',
        '',
        'deploy(app, { serveur: "VPS", ssl: true });'
    ].join('\n');

    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const hl = t => esc(t).replace(/(\/\/.*$)|("[^"\n]*"?)|\b(const|async|function|await|return|if|true)\b|\b(\d+)\b|\b([A-Za-z_]\w*)(?=\()/gm,
        (m, c, str, kw, num, fn) => c ? '<span class="tok-c">' + c + '</span>' : str ? '<span class="tok-s">' + str + '</span>'
            : kw ? '<span class="tok-k">' + kw + '</span>' : num ? '<span class="tok-n">' + num + '</span>' : '<span class="tok-f">' + fn + '</span>');

    function draw(i) {
        const shown = CODE.slice(0, i);
        const lines = shown.split('\n');
        out.innerHTML = hl(shown) + '<span class="cursor"></span>';
        const count = Math.max(lines.length, 12);
        let n = ''; for (let k = 1; k <= count; k++) n += k + (k < count ? '\n' : '');
        nums.textContent = n;
        if (pos) pos.textContent = 'Ln ' + lines.length + ', Col ' + (lines[lines.length - 1].length + 1);
        body.scrollTop = body.scrollHeight;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(CODE.length); return; }

    let i = 0, visible = false, timer = null;
    function tick() {
        if (!visible) { timer = null; return; }
        if (i >= CODE.length) { timer = setTimeout(() => { i = 0; draw(0); timer = setTimeout(tick, 600); }, 3200); return; }
        i = Math.min(CODE.length, i + 1 + (Math.random() < 0.35 ? 1 : 0));
        draw(i);
        timer = setTimeout(tick, CODE[i - 1] === '\n' ? 140 : 22 + Math.random() * 40);
    }
    new IntersectionObserver(es => {
        visible = es[0].isIntersecting;
        if (visible && !timer) tick();
    }, { threshold: 0.2 }).observe(out.closest('.workstation'));
    draw(0);
})();
});
