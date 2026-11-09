/* Données des services CashPay All (source unique pour l'accueil et la page Services).
   Chaque service : clé, icône Font Awesome, catégorie, textes FR + EN. */
(function () {
    const SERVICES = [
        // --- Paiements & transferts ---
        { k: 'transfer', cat: 'pay', icon: 'fa-solid fa-paper-plane',
          fr: ['Transferts & Envois', "Envoyez de l'argent à vos proches instantanément, au niveau national et international (WU, MG, Ria) aux meilleurs taux."],
          en: ['Transfers & Remittances', 'Send money to loved ones instantly, nationally and internationally (WU, MG, Ria) at the best rates.'] },
        { k: 'qr', cat: 'pay', icon: 'fa-solid fa-qrcode',
          fr: ['Paiement par QR', 'Payez en boutique en scannant un code QR, sans cash et sans monnaie à rendre.'],
          en: ['QR Payment', 'Pay in store by scanning a QR code: no cash, no change to give back.'] },
        { k: 'momo', cat: 'pay', icon: 'fa-solid fa-mobile-retro',
          fr: ['Mobile Money', 'Connecté à M-Pesa, Airtel Money, Orange Money, Africell Money et MTN pour vos dépôts et retraits.'],
          en: ['Mobile Money', 'Connected to M-Pesa, Airtel Money, Orange Money, Africell Money and MTN for deposits and withdrawals.'] },
        { k: 'fx', cat: 'pay', icon: 'fa-solid fa-money-bill-transfer',
          fr: ['Multi-devises & Change', 'Plus de 195 devises avec des taux de change en temps réel pour envoyer, recevoir et échanger.'],
          en: ['Multi-currency & Exchange', 'Over 195 currencies with real-time exchange rates to send, receive and exchange.'] },
        { k: 'bills', cat: 'pay', icon: 'fa-solid fa-receipt',
          fr: ['Factures & TV', "Réglez vos abonnements Canal+, StarTimes ou Starlink et payez vos factures d'eau (REGIDESO) et d'électricité en 2 clics."],
          en: ['Bills & TV', 'Pay your Canal+, StarTimes or Starlink subscriptions and water/electricity bills in 2 clicks.'] },
        { k: 'airtime', cat: 'pay', icon: 'fa-solid fa-mobile-screen',
          fr: ['Crédit Mobile', 'Rechargez votre crédit téléphonique ou celui de vos proches pour tous les opérateurs (Airtel, Orange, Vodacom, MTN).'],
          en: ['Mobile Credit', 'Top up your phone credit or that of your loved ones for all operators (Airtel, Orange, Vodacom, MTN).'] },
        { k: 'ussd', cat: 'pay', icon: 'fa-solid fa-hashtag',
          fr: ['USSD *2704#', "Solde, transferts, retraits, recharge et prêts depuis n'importe quel téléphone, sans internet, validés par code PIN."],
          en: ['USSD *2704#', 'Balance, transfers, withdrawals, top-ups and loans from any phone, no internet needed, validated by PIN.'] },
        // --- Finance & épargne ---
        { k: 'loanme', cat: 'fin', icon: 'fa-solid fa-hand-holding-dollar',
          fr: ['Loan Me', "Prêts individuels, d'entreprise ou de groupe, demandés et remboursés depuis l'application ou le USSD."],
          en: ['Loan Me', 'Individual, business or group loans, requested and repaid from the app or USSD.'] },
        { k: 'dat', cat: 'fin', icon: 'fa-solid fa-piggy-bank',
          fr: ['Dépôts à Terme (DAT)', 'Placez votre capital et faites-le fructifier avec des dépôts à terme gérés dans votre portefeuille.'],
          en: ['Term Deposits (DAT)', 'Put your capital to work with term deposits managed from your wallet.'] },
        { k: 'cards', cat: 'fin', icon: 'fa-solid fa-credit-card',
          fr: ['Cartes Visa & Mastercard', 'Cartes virtuelles et prépayées alimentées par votre solde CashPay, le Vault USB ou le Bitcoin.'],
          en: ['Visa & Mastercard Cards', 'Virtual and prepaid cards funded by your CashPay balance, the USB Vault or Bitcoin.'] },
        { k: 'vault', cat: 'fin', icon: 'fa-solid fa-vault',
          fr: ['CashPay Vault USB', 'Sécurisez vos actifs hors-ligne. Transformez votre clé USB en coffre-fort numérique grâce à la technologie .CPK.'],
          en: ['CashPay Vault USB', 'Secure your assets offline. Turn your USB key into a digital vault with .CPK technology.'] },
        { k: 'crypto', cat: 'fin', icon: 'fa-brands fa-bitcoin',
          fr: ['Crypto & Mini Blockchain', 'Recevez, envoyez et gérez vos cryptomonnaies (BTC, USDT…) depuis le même compte CashPay.'],
          en: ['Crypto & Mini Blockchain', 'Receive, send and manage your cryptocurrencies (BTC, USDT…) from the same CashPay account.'] },
        // --- Commerce & quotidien ---
        { k: 'jojo', cat: 'life', icon: 'fa-solid fa-bag-shopping',
          fr: ['JoJo Shopping', 'La place de marché en ligne du réseau CashPay. Achetez et vendez dans le monde entier et payez avec votre solde numérique.'],
          en: ['JoJo Shopping', 'The online marketplace of the CashPay network. Buy and sell worldwide and pay with your digital balance.'] },
        { k: 'airlines', cat: 'life', icon: 'fa-solid fa-plane',
          fr: ['Jojo Airlines', 'Réservez vos vols nationaux et internationaux directement. Émission instantanée de votre PNR et e-billet.'],
          en: ['Jojo Airlines', 'Book national and international flights directly. Instant PNR and e-ticket issuance.'] },
        { k: 'onchat', cat: 'life', icon: 'fa-solid fa-comments-dollar',
          fr: ['OnChat Social', 'La fusion entre messagerie et finance. Discutez avec vos amis et transférez des fonds au sein même du chat.'],
          en: ['OnChat Social', 'The fusion of messaging and finance. Chat with friends and transfer funds right within the chat.'] },
        { k: 'monpays', cat: 'life', icon: 'fa-solid fa-store',
          fr: ['MonPays', 'Créez la page de votre entreprise et présentez vos produits et services à toute la communauté.'],
          en: ['MonPays', 'Create your business page and showcase your products and services to the whole community.'] },
        { k: 'chess', cat: 'life', icon: 'fa-solid fa-chess',
          fr: ['Échecs en ligne', 'Affrontez d\'autres joueurs en temps réel, avec ou sans mise : le gagnant empoche le pot.'],
          en: ['Online Chess', 'Play other players in real time, with or without stakes: the winner takes the pot.'] },
        { k: 'jojoai', cat: 'life', icon: 'fa-solid fa-robot',
          fr: ['JoJo AI', 'Votre assistant intelligent et la gestion de votre compte sur ordinateur Windows.'],
          en: ['JoJo AI', 'Your smart assistant and account management on your Windows computer.'] },
        // --- Business & développeurs ---
        { k: 'devapi', cat: 'biz', icon: 'fa-solid fa-code',
          fr: ['API Développeurs', 'SMS, WhatsApp, paiements, taux de change, comptes flott JIT et plugin WordPress pour vos applications.'],
          en: ['Developer APIs', 'SMS, WhatsApp, payments, exchange rates, JIT float accounts and a WordPress plugin for your apps.'] },
        { k: 'agents', cat: 'biz', icon: 'fa-solid fa-people-group',
          fr: ["Réseau d'agents", 'Déposez et retirez votre argent chez des agents agréés, près de chez vous.'],
          en: ['Agent Network', 'Deposit and withdraw your money with authorised agents near you.'] },
    ];

    // Enregistre les traductions anglaises auprès du moteur i18n
    const en = {};
    SERVICES.forEach(s => { en['svc.' + s.k + '.t'] = s.en[0]; en['svc.' + s.k + '.d'] = s.en[1]; });
    if (window.I18N) window.I18N.extend(en);

    function card(s) {
        return '<article class="card" data-cat="' + s.cat + '" data-reveal>' +
            '<div class="icon-bubble"><i class="' + s.icon + '" aria-hidden="true"></i></div>' +
            '<h3 data-i18n="svc.' + s.k + '.t">' + s.fr[0] + '</h3>' +
            '<p data-i18n="svc.' + s.k + '.d">' + s.fr[1] + '</p></article>';
    }

    // <div data-services="all"> ou data-services="transfer,momo,cards"
    window.renderServices = function () {
        document.querySelectorAll('[data-services]').forEach(box => {
            const want = box.getAttribute('data-services');
            const list = want === 'all' ? SERVICES : want.split(',').map(k => SERVICES.find(s => s.k === k.trim())).filter(Boolean);
            box.innerHTML = list.map(card).join('');
        });
    };
    window.SERVICES = SERVICES;
})();
