/* En-tête, pied de page et bouton WhatsApp flottant partagés par toutes les pages.
   Les textes sont en français par défaut ; le moteur i18n fournit l'anglais via data-i18n. */
(function () {
    const WA_NUMBER = '243853868021';           // +243 85 386 80 21
    const WA_DISPLAY = '+243 85 386 80 21';
    const EMAIL = 'info@cashpay-all.com';
    const APP_URL = 'https://app.cashpay-all.com';

    window.CASHPAY = { WA_NUMBER, WA_DISPLAY, EMAIL, APP_URL };

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
                    </div>
                </li>
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
        const y = document.getElementById('year');
        if (y) y.textContent = new Date().getFullYear();
    };
})();
