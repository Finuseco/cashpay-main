/* En-tête, pied de page et bouton WhatsApp flottant partagés par toutes les pages.
   Les textes sont en français par défaut ; le moteur i18n fournit l'anglais via data-i18n. */
(function () {
    const WA_NUMBER = '243853868021';           // +243 85 386 80 21
    const WA_DISPLAY = '+243 85 386 80 21';
    const EMAIL = 'info@cashpay-all.com';
    const APP_URL = 'https://app.cashpay-all.com';
    const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbC4htiHAdNTdwakAX1Y'; // chaîne WhatsApp CashPay All

    window.CASHPAY = { WA_NUMBER, WA_DISPLAY, EMAIL, APP_URL, CHANNEL_URL, MAIN_API: APP_URL + '/api/main' };

    if (window.I18N) I18N.extend({
        'foot.services': 'Services & solutions', 'foot.financing': 'Financing & business',
        'foot.company': 'About CashPay', 'foot.help': 'Help & information',
        'foot.news.title': 'Keep up with CashPay All',
        'foot.news.desc': 'News, practical guides and new services, delivered to your inbox.',
        'foot.news.open': 'Subscribe to the newsletter', 'foot.news.manage': 'Newsletter & preferences',
        'foot.articles': 'Articles & news', 'foot.guides': 'Financing & business guides',
        'nav.admin.login': 'Sign in to administration'
    });

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
                <li><a href="salaire.html" data-page-link="salary" data-i18n="nav.salary">Salaire</a></li>
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
                <li><a href="faq.html" data-page-link="faq" data-i18n="nav.faq">FAQ</a></li>
                <li><a href="contact.html" data-page-link="contact" data-i18n="nav.contact">Contact</a></li>
            </ul>
            <div class="nav-cta">
                <div class="lang" role="group" aria-label="Langue">
                    <button type="button" data-lang="fr">FR</button>
                    <button type="button" data-lang="en">EN</button>
                </div>
                <a class="btn btn-primary" href="${APP_URL}" data-i18n="nav.open">Ouvrir un compte</a>
                <a class="nav-admin-login" href="dashboard.html" title="Administration · Connexion / Sign in">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.2"></circle><path d="M5 21v-2a7 7 0 0 1 14 0v2"></path></svg>
                    <span class="sr-only" data-i18n="nav.admin.login">Se connecter à l’administration</span>
                </a>
                <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Menu" aria-expanded="false">
                    <i class="fa-solid fa-bars" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;
    }

    function footerHTML() {
        return `
        <div class="container">
            <section class="footer-newsletter" aria-labelledby="footer-news-title">
                <div><span class="newsletter-eyebrow">CASHPAY ALL · NEWSLETTER</span><h2 id="footer-news-title" data-i18n="foot.news.title">Gardez le lien avec CashPay All</h2><p data-i18n="foot.news.desc">Actualités, conseils pratiques et nouveaux services, directement dans votre boîte mail.</p></div>
                <div class="footer-newsletter-actions"><button type="button" class="btn btn-light" data-newsletter-open><i class="fa-regular fa-envelope" aria-hidden="true"></i><span data-i18n="foot.news.open">S'inscrire à la newsletter</span></button><a href="newsletter.html" data-i18n="foot.news.manage">Newsletter et préférences</a></div>
            </section>
            <div class="footer-grid footer-primary">
                <div class="footer-brand">
                    <img class="footer-logo" src="public/images/logo.png" alt="CashPay All">
                    <p data-i18n="foot.desc">Le réseau financier numérique qui réduit le cash et connecte paiements, cartes, crypto et services développeurs. Une marque de FINUSECO SARL.</p>
                </div>
                <div class="footer-col">
                    <h5 data-i18n="foot.services">Services et solutions</h5>
                    <ul>
                        <li><a href="services.html" data-i18n="nav.services">Services</a></li>
                        <li><a href="ateliers.html" data-i18n="nav.workshops">Ateliers</a></li>
                        <li><a href="developpeurs.html" data-i18n="nav.developers">Développeurs</a></li>
                        <li><a href="cartes-b2b.html" data-i18n="nav.cards">Cartes B2B</a></li>
                        <li><a href="salaire.html" data-i18n="nav.salary">Salaire</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h5 data-i18n="foot.financing">Financement et commerce</h5>
                    <ul>
                        <li><a href="financement-pme.html" data-i18n="nav.fin.sme">Financement des PME</a></li>
                        <li><a href="financement-startups.html" data-i18n="nav.fin.startup">Financement des startups</a></li>
                        <li><a href="livraison-paiement.html" data-i18n="nav.fin.deliv">Livraisons et paiements</a></li>
                        <li><a href="partenaires.html" data-i18n="nav.partners">Partenariat</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h5 data-i18n="foot.eco">Écosystème</h5>
                    <ul>
                        <li><a href="${APP_URL}" data-i18n="foot.app">Application web</a></li>
                        <li><a href="https://developer.cashpay-all.com" data-i18n="foot.devportal">Portail développeurs</a></li>
                        <li><a href="index.html#download" data-i18n="foot.dl">Télécharger l'app</a></li>
                        <li><a href="articles.html" data-i18n="foot.articles">Articles et actualités</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-grid footer-secondary">
                <div class="footer-col"><h5 data-i18n="foot.company">À propos de CashPay</h5><ul>
                    <li><a href="apropos.html" data-i18n="nav.about.app">L'application</a></li>
                    <li><a href="entreprise.html" data-i18n="nav.about.co">L'entreprise FINUSECO</a></li>
                    <li><a href="emplois.html" data-i18n="nav.jobs.short">Emplois</a></li>
                </ul></div>
                <div class="footer-col"><h5 data-i18n="foot.help">Aide et informations</h5><ul>
                    <li><a href="faq.html" data-i18n="nav.faq">FAQ</a></li>
                    <li><a href="contact.html" data-i18n="nav.contact">Contact</a></li>
                    <li><a href="articles.html#guides" data-i18n="foot.guides">Guides du financement et du commerce</a></li>
                    <li><a href="newsletter.html" data-i18n="foot.news.manage">Newsletter et préférences</a></li>
                </ul></div>
                <div class="footer-col footer-contact"><h5 data-i18n="foot.contact">Nous joindre</h5><ul>
                    <li><i class="fa-solid fa-envelope" aria-hidden="true"></i><a href="mailto:${EMAIL}">${EMAIL}</a></li>
                    <li><i class="fa-brands fa-whatsapp" aria-hidden="true"></i><a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener">${WA_DISPLAY}</a></li>
                    <li><i class="fa-solid fa-globe" aria-hidden="true"></i><a href="https://www.cashpay-all.com">www.cashpay-all.com</a></li>
                </ul></div>
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

    function loadNewsletter() {
        if (!document.getElementById('cashpay-newsletter-css')) {
            const style = document.createElement('link');
            style.id = 'cashpay-newsletter-css'; style.rel = 'stylesheet';
            style.href = 'css/newsletter.css?v=20261118-newsletter-v1';
            document.head.appendChild(style);
        }
        if (!document.getElementById('cashpay-newsletter-js')) {
            const script = document.createElement('script');
            script.id = 'cashpay-newsletter-js';
            script.src = 'js/newsletter.js?v=20261118-newsletter-v1';
            document.body.appendChild(script);
        }
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
        loadNewsletter();
        const y = document.getElementById('year');
        if (y) y.textContent = new Date().getFullYear();
    };
})();
