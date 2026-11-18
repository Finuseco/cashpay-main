/* En-tête, pied de page et bouton WhatsApp flottant partagés par toutes les pages.
   Les textes sont en français par défaut ; le moteur i18n fournit l'anglais via data-i18n. */
(function () {
    const WA_NUMBER = '243853868021';           // +243 85 386 80 21
    const WA_DISPLAY = '+243 85 386 80 21';
    const EMAIL = 'info@cashpay-all.com';
    const APP_URL = 'https://app.cashpay-all.com';
    const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbC4htiHAdNTdwakAX1Y'; // chaîne WhatsApp CashPay All

    window.CASHPAY = { WA_NUMBER, WA_DISPLAY, EMAIL, APP_URL, CHANNEL_URL };

    function headerHTML() {
        return `
        <div class="container nav">
            <a class="brand" href="index.html" aria-label="CashPay All">
                <img src="public/images/logo1.png" alt="CashPay All">
            </a>
            <ul class="nav-links" id="nav-links">
                <li><a href="index.html" data-page-link="home" data-i18n="nav.home">Accueil</a></li>
                <li><a href="services.html" data-page-link="services" data-i18n="nav.services">Services</a></li>
                <li><a href="ateliers.html" data-page-link="workshops" data-i18n="nav.workshops">Ateliers</a></li>
                <li><a href="developpeurs.html" data-page-link="developers" data-i18n="nav.developers">Développeurs</a></li>
                <li><a href="cartes-b2b.html" data-page-link="cards" data-i18n="nav.cards">Cartes B2B</a></li>
                <li class="has-dd">
                    <button type="button" aria-haspopup="true" aria-expanded="false">
                        <span data-i18n="nav.about">À propos</span> <i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>
                    </button>
                    <div class="dropdown">
                        <a href="apropos.html" data-page-link="about-app">
                            <i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>
                            <div><strong data-i18n="nav.about.app">L'application</strong><small data-i18n="nav.about.app.d">CashPay All : fonctionnement, sécurité, plateformes</small></div>
                        </a>
                        <a href="entreprise.html" data-page-link="company">
                            <i class="fa-solid fa-building" aria-hidden="true"></i>
                            <div><strong data-i18n="nav.about.co">L'entreprise FINUSECO</strong><small data-i18n="nav.about.co.d">Profil, marques, direction</small></div>
                        </a>
                        <a href="emplois.html" data-page-link="jobs">
                            <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                            <div><strong data-i18n="nav.jobs">Emplois & carrières</strong><small data-i18n="nav.jobs.d">Postes ouverts et candidature en ligne</small></div>
                        </a>
                    </div>
                </li>
                <li><a href="salaire.html" data-page-link="salary" data-i18n="nav.salary">Salaire</a></li>
                <li><a href="faq.html" data-page-link="faq" data-i18n="nav.faq">FAQ</a></li>
                <li><a href="contact.html" data-page-link="contact" data-i18n="nav.contact">Contact</a></li>
            </ul>
            <div class="nav-cta">
                <div class="lang" role="group" aria-label="Langue">
                    <button type="button" data-lang="fr">FR</button>
                    <button type="button" data-lang="en">EN</button>
                </div>
                <a class="btn btn-primary" href="${APP_URL}" data-i18n="nav.open">Ouvrir un compte</a>
                <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Menu" aria-expanded="false">
                    <i class="fa-solid fa-bars" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;
    }

    function footerHTML() {
        return `
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <img class="footer-logo" src="public/images/logo.png" alt="CashPay All">
                    <p data-i18n="foot.desc">Le réseau financier numérique qui réduit le cash et connecte paiements, cartes, crypto et services développeurs. Une marque de FINUSECO SARL.</p>
                </div>
                <div class="footer-col">
                    <h5 data-i18n="foot.explore">Explorer</h5>
                    <ul>
                        <li><a href="services.html" data-i18n="nav.services">Services</a></li>
                        <li><a href="ateliers.html" data-i18n="nav.workshops">Ateliers</a></li>
                        <li><a href="developpeurs.html" data-i18n="nav.developers">Développeurs</a></li>
                        <li><a href="cartes-b2b.html" data-i18n="nav.cards">Cartes B2B</a></li>
                        <li><a href="apropos.html" data-i18n="nav.about.app">L'application</a></li>
                        <li><a href="entreprise.html" data-i18n="nav.about.co">L'entreprise FINUSECO</a></li>
                        <li><a href="salaire.html" data-i18n="nav.salary">Salaire</a></li>
                        <li><a href="partenaires.html" data-i18n="nav.partners">Partenariat</a></li>
                        <li><a href="faq.html" data-i18n="nav.faq">FAQ</a></li>
                        <li><a href="emplois.html" data-i18n="nav.jobs.short">Emplois</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h5 data-i18n="foot.eco">Écosystème</h5>
                    <ul>
                        <li><a href="${APP_URL}" data-i18n="foot.app">Application web</a></li>
                        <li><a href="https://developer.cashpay-all.com" data-i18n="foot.devportal">Portail développeurs</a></li>
                        <li><a href="index.html#download" data-i18n="foot.dl">Télécharger l'app</a></li>
                        <li><a href="contact.html" data-i18n="nav.contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-col footer-contact">
                    <h5 data-i18n="foot.contact">Nous joindre</h5>
                    <ul>
                        <li><i class="fa-solid fa-envelope" aria-hidden="true"></i><a href="mailto:${EMAIL}">${EMAIL}</a></li>
                        <li><i class="fa-brands fa-whatsapp" aria-hidden="true"></i><a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener">${WA_DISPLAY}</a></li>
                        <li><i class="fa-solid fa-globe" aria-hidden="true"></i><a href="https://www.cashpay-all.com">www.cashpay-all.com</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-follow">
                <h5 data-i18n="foot.follow">Suivez CashPay All</h5>
                <div class="soc-box">
                    <a class="soc" data-net="wa" href="${CHANNEL_URL}" target="_blank" rel="noopener" aria-label="Chaîne WhatsApp CashPay All"><span class="soc-ico"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span><span class="soc-name" data-i18n="foot.channel">Chaîne</span></a>
                    <a class="soc" data-net="wa" href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" aria-label="WhatsApp ${WA_DISPLAY}"><span class="soc-ico"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span><span class="soc-name">WhatsApp</span></a>
                    <a class="soc" data-net="facebook" href="#" data-href="*" aria-label="Facebook"><span class="soc-ico"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i></span><span class="soc-name">Facebook</span></a>
                    <a class="soc" data-net="instagram" href="#" data-href="*" aria-label="Instagram"><span class="soc-ico"><i class="fa-brands fa-instagram" aria-hidden="true"></i></span><span class="soc-name">Instagram</span></a>
                    <a class="soc" data-net="x" href="#" data-href="*" aria-label="X"><span class="soc-ico"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></span><span class="soc-name">X</span></a>
                    <a class="soc" data-net="linkedin" href="#" data-href="*" aria-label="LinkedIn"><span class="soc-ico"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></span><span class="soc-name">LinkedIn</span></a>
                </div>
            </div>
            <div class="footer-bottom">
                <span>&copy; <span id="year"></span> FINUSECO SARL — CashPay All. <span data-i18n="foot.rights">Tous droits réservés.</span></span>
                <span data-i18n="foot.tagline">Service Financier Numérique Congolais</span>
            </div>
        </div>`;
    }

    function waHTML() {
        return `<a class="wa-float" id="wa-float" href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" aria-label="WhatsApp ${WA_DISPLAY}">
            <span class="wa-ico"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
            <span class="wa-label" data-i18n="wa.label">Discuter sur WhatsApp</span>
        </a>`;
    }

    function popupHTML() {
        return `<div class="welcome-pop" id="welcome-pop" role="dialog" aria-modal="true" aria-labelledby="welcome-title" hidden>
            <div class="welcome-card">
                <button type="button" class="welcome-close" id="welcome-close" aria-label="Fermer"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                <div class="welcome-ico"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></div>
                <h3 id="welcome-title" data-i18n="pop.title">Rejoignez la communauté CashPay All</h3>
                <p data-i18n="pop.desc">Abonnez-vous d'abord à notre chaîne WhatsApp pour suivre nos nouveautés, nos offres et nos services, et écrivez-nous sur notre page WhatsApp pour toute question.</p>
                <div class="welcome-btns">
                    <a class="btn btn-wa" href="${CHANNEL_URL}" target="_blank" rel="noopener" data-welcome-go><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> <span data-i18n="pop.channel">Suivre la chaîne WhatsApp</span></a>
                    <a class="btn btn-outline" href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" data-welcome-go><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> <span data-i18n="pop.page">Écrire sur WhatsApp</span></a>
                </div>
                <button type="button" class="welcome-later" id="welcome-later" data-i18n="pop.later">Plus tard</button>
            </div>
        </div>`;
    }

    function initWelcome() {
        const KEY = 'cashpay-welcome', DAYS = 7;
        try { const t = parseInt(localStorage.getItem(KEY) || '0', 10); if (t && Date.now() - t < DAYS * 864e5) return; } catch (e) {}
        if (!document.getElementById('welcome-pop')) document.body.insertAdjacentHTML('beforeend', popupHTML());
        const pop = document.getElementById('welcome-pop');
        let last = null;
        function close() {
            pop.classList.remove('show'); setTimeout(() => { pop.hidden = true; }, 300);
            try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
            document.removeEventListener('keydown', onKey);
            if (last && last.focus) last.focus();
        }
        function onKey(e) { if (e.key === 'Escape') close(); }
        pop.addEventListener('click', e => { if (e.target === pop || e.target.closest('#welcome-close, #welcome-later, [data-welcome-go]')) close(); });
        setTimeout(() => {
            if (document.getElementById('welcome-pop') !== pop) return;
            last = document.activeElement; pop.hidden = false;
            if (window.I18N) I18N.apply(I18N.lang);
            requestAnimationFrame(() => pop.classList.add('show'));
            document.addEventListener('keydown', onKey);
            const b = pop.querySelector('.btn'); if (b) b.focus();
        }, 3500);
    }

    window.renderLayout = function () {
        const h = document.getElementById('site-header');
        const f = document.getElementById('site-footer');
        if (h) h.innerHTML = headerHTML();
        if (f) f.innerHTML = footerHTML();
        if (!document.getElementById('wa-float')) document.body.insertAdjacentHTML('beforeend', waHTML());

        const page = document.body.getAttribute('data-page');
        document.querySelectorAll('[data-page-link]').forEach(a => {
            if (a.getAttribute('data-page-link') === page) a.classList.add('active');
        });
        if (page === 'about-app' || page === 'company') {
            const dd = document.querySelector('.has-dd > button');
            if (dd) dd.classList.add('active');
        }
        initWelcome();
        const y = document.getElementById('year');
        if (y) y.textContent = new Date().getFullYear();
    };
})();
