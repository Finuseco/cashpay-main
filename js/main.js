// CashPay All Showcase - Interaction & Translation Logic

const translations = {
    'fr': {
        'nav-services': 'Services',
        'nav-finance': 'Finance',
        'nav-business': 'Business',
        'nav-apps': 'Applications',
        'nav-web-access': 'Login',
        'nav-signin': 'S\'inscrire',
        'hero-title': 'Services de paiements nationaux et internationaux <br><span class="highlight">en multi-devises mondiales.</span>',
        'hero-desc': 'L\'expérience ultime pour la gestion de vos finances et de vos activités commerciales. Centralisez vos paiements et vos échanges au sein d\'un écosystème souverain conçu pour votre croissance.',
        'btn-download': 'Télécharger l\'App',
        'btn-open-account': 'Ouvrir un compte',
        'services-title': 'Un écosystème de services <span class="highlight">illimités</span>',
        'services-subtitle': 'Découvrez comment CashPay All simplifie votre quotidien financier.',
        'service-transfer-title': 'Transferts & Envois',
        'service-transfer-desc': 'Envoyez de l\'argent à vos proches instantanément, au niveau national et international (WU, MG, Ria) aux meilleurs taux.',
        'service-bills-title': 'Factures & TV',
        'service-bills-desc': 'Réglez vos abonnements Canal+, StarTimes ou Starlink et payez vos factures d\'eau (REGIDESO) et d\'électricité en 2 clics.',
        'service-jojo-title': 'JoJo Shopping',
        'service-jojo-desc': 'Le market public souverain. Commandez des produits certifiés et payez directement avec votre solde numérique.',
        'service-airlines-title': 'Jojo Airlines',
        'service-airlines-desc': 'Réservez vos vols nationaux et internationaux directement. Émission instantanée de votre PNR et e-billet.',
        'service-onchat-title': 'OnChat Social',
        'service-onchat-desc': 'La fusion entre messagerie et finance. Discutez avec vos amis et transférez des fonds au sein même du chat.',
        'service-airtime-title': 'Crédit Mobile',
        'service-airtime-desc': 'Rechargez votre crédit téléphonique ou celui de vos proches pour tous les opérateurs (Airtel, Orange, Vodacom, MTN).',
        'service-vault-title': 'CashPay Vault USB',
        'service-vault-desc': 'Sécurisez vos actifs hors-ligne. Transformez votre support USB en un coffre-fort financier impénétrable avec la technologie .CPK.',
        'finance-tag': 'SERVICES FINANCIERS',
        'finance-title': 'Gérez et empruntez <br>en toute <span class="highlight">souveraineté.</span>',
        'finance-desc': 'CashPay All vous offre des outils financiers avancés pour gérer votre capital et soutenir vos projets commerciaux.',
        'finance-loan-title': 'Prêts Instantanés',
        'finance-dat-title': 'Dépôts à Terme (DAT)',
        'cards-tag': 'CARTES INTERNATIONALES',
        'cards-title': 'Visa & Mastercard <span class="highlight">JIT.</span>',
        'cards-desc': 'Nos cartes innovantes "Just-In-Time" n\'ont pas de solde propre. Elles utilisent directement votre portefeuille CashPay pour chaque transaction, garantissant une sécurité maximale.',
        'cards-li-1': '<i class="fa-solid fa-check"></i> Aucun solde stocker sur la carte',
        'cards-li-2': '<i class="fa-solid fa-check"></i> Activation/Désactivation instantanée',
        'dl-title': 'Prêt à révolutionner vos finances ?',
        'dl-subtitle': 'Téléchargez l\'expérience CashPay All sur toutes vos plateformes.',
        'dl-android-std': 'Android Standard',
        'dl-android-std-desc': 'L\'expérience complète. Recommandée pour tous.',
        'dl-btn-apk': 'Télécharger APK',
        'dl-btn-exe': 'Télécharger .EXE',
        'dl-windows': 'Windows Desktop',
        'dl-windows-desc': 'JoJo AI et gestion de compte sur votre PC.',
        'dl-windows-note': 'Version stable Windows 10/11',
        'dl-ios': 'Apple iOS',
        'dl-ios-desc': 'Disponible pour iPhone et iPad.',
        'dl-ios-note': 'Compatible avec processeurs M1/M2',
        'dl-lite': 'Version Lite',
        'dl-lite-desc': 'Optimisée pour les connexions 2G/3G.',
        'dl-btn-lite': 'APK Lite',
        'footer-brand-desc': 'Le premier réseau financier souverain interconnecté. Une marque de FINUSECO SARL.',
        'footer-col-1': 'Écosystème',
        'footer-col-2': 'Pro',
        'footer-col-3': 'Légal',
        'footer-link-web': 'Portefeuille Web',
        'footer-link-jojo': 'JoJo Market',
        'footer-link-about': 'À propos de nous',
        'footer-link-dev': 'Développeurs',
        'footer-link-agent': 'Espace Agent',
        'footer-link-privacy': 'Confidentialité',
        'footer-link-tos': 'Conditions d\'utilisation',
        'footer-copyright': 'Tous droits réservés.',
    },
    'en': {
        'nav-services': 'Services',
        'nav-finance': 'Finance',
        'nav-business': 'Business',
        'nav-apps': 'Apps',
        'nav-web-access': 'Login',
        'nav-signin': 'Sign Up',
        'hero-title': 'International and national payment services <br><span class="highlight">in global multi-currencies.</span>',
        'hero-desc': 'The ultimate experience for managing your finances and business activities. Centralize your payments and exchanges within a sovereign ecosystem designed for your growth.',
        'btn-download': 'Download App',
        'btn-open-account': 'Open Account',
        'services-title': 'An ecosystem of <span class="highlight">unlimited</span> services',
        'services-subtitle': 'Discover how CashPay All simplifies your daily financial life.',
        'service-transfer-title': 'Transfers & Remittances',
        'service-transfer-desc': 'Send money to loved ones instantly, nationally and internationally (WU, MG, Ria) at the best rates.',
        'service-bills-title': 'Bills & TV',
        'service-bills-desc': 'Pay your Canal+, StarTimes or Starlink subscriptions and water/electricity bills in 2 clicks.',
        'service-jojo-title': 'JoJo Shopping',
        'service-jojo-desc': 'The sovereign public market. Order certified products and pay directly with your digital balance.',
        'service-airlines-title': 'Jojo Airlines',
        'service-airlines-desc': 'Book national and international flights directly. Instant PNR and e-ticket issuance.',
        'service-onchat-title': 'OnChat Social',
        'service-onchat-desc': 'The fusion between messaging and finance. Chat with friends and transfer funds right within the chat.',
        'service-airtime-title': 'Mobile Credit',
        'service-airtime-desc': 'Top up your phone credit or that of your loved ones for all operators (Airtel, Orange, Vodacom, MTN).',
        'service-vault-title': 'CashPay Vault USB',
        'service-vault-desc': 'Secure your assets offline. Transform your USB drive into an impenetrable financial vault with .CPK technology.',
        'finance-tag': 'FINANCIAL SERVICES',
        'finance-title': 'Manage and borrow <br>with full <span class="highlight">sovereignty.</span>',
        'finance-desc': 'CashPay All offers you advanced financial tools to manage your capital and support your commercial projects.',
        'finance-loan-title': 'Instant Loans',
        'finance-dat-title': 'Term Deposits (DAT)',
        'cards-tag': 'INTERNATIONAL CARDS',
        'cards-title': 'JIT Visa & Mastercard <span class="highlight">Cards.</span>',
        'cards-desc': 'Our innovative "Just-In-Time" cards don\'t have their own balance. They use your CashPay wallet directly for each transaction, ensuring maximum security.',
        'cards-li-1': '<i class="fa-solid fa-check"></i> No balance stored on card',
        'cards-li-2': '<i class="fa-solid fa-check"></i> Instant activation/deactivation',
        'dl-title': 'Ready to revolutionize your finances?',
        'dl-subtitle': 'Download the CashPay All experience on all your platforms.',
        'dl-android-std': 'Android Standard',
        'dl-android-std-desc': 'The full experience. Recommended for everyone.',
        'dl-btn-apk': 'Download APK',
        'dl-btn-exe': 'Download .EXE',
        'dl-windows': 'Windows Desktop',
        'dl-windows-desc': 'JoJo AI and account management on your PC.',
        'dl-windows-note': 'Stable version Windows 10/11',
        'dl-ios': 'Apple iOS',
        'dl-ios-desc': 'Available for iPhone and iPad.',
        'dl-ios-note': 'Compatible with M1/M2 processors',
        'dl-lite': 'Lite Version',
        'dl-lite-desc': 'Optimized for 2G/3G connections.',
        'dl-btn-lite': 'APK Lite',
        'footer-brand-desc': 'The first interconnected sovereign financial network. A brand of FINUSECO SARL.',
        'footer-col-1': 'Ecosystem',
        'footer-col-2': 'Pro',
        'footer-col-3': 'Legal',
        'footer-link-web': 'Web Wallet',
        'footer-link-jojo': 'JoJo Market',
        'footer-link-about': 'About Us',
        'footer-link-dev': 'Developers',
        'footer-link-agent': 'Agent Space',
        'footer-link-privacy': 'Privacy',
        'footer-link-tos': 'Terms of Use',
        'footer-copyright': 'All rights reserved.',
    }
};

function setLanguage(lang) {
    localStorage.setItem('cashpay-lang', lang);
    
    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-btn-${lang}`);
    if(activeBtn) activeBtn.classList.add('active');

    // Update texts
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Handle button text specifically if needed
    const mainCta = document.getElementById('main-cta-btn');
    if (mainCta) {
        mainCta.innerText = window.innerWidth <= 768 ? 'Login' : translations[lang]['nav-web-access'];
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial Language
    const savedLang = localStorage.getItem('cashpay-lang') || 'fr';
    setLanguage(savedLang);

    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    // Hamburger Menu Logic
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-xmark');
            } else {
                icon.classList.replace('fa-xmark', 'fa-bars');
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
            });
        });
    }

    // Adjust button text on resize
    window.addEventListener('resize', () => {
        const currentLang = localStorage.getItem('cashpay-lang') || 'fr';
        setLanguage(currentLang);
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // Reveal animation
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .dl-card, .feature-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        revealObserver.observe(el);
    });

    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .visible { opacity: 1 !important; transform: translateY(0) !important; }
        </style>
    `);
});

window.setLanguage = setLanguage;