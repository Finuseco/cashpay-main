/* FAQ (Questions fréquemment posées) + témoignages clients.
   Contenu FR dans le code, anglais enregistré auprès du moteur i18n. */
(function () {
    const IMG = 'public/images/faq/';
    const FAQ_CATS = [
        { k: 'all', fr: 'Toutes', en: 'All' },
        { k: 'login', fr: 'Connexion', en: 'Sign in' },
        { k: 'account', fr: 'Compte & soldes', en: 'Account & balances' },
        { k: 'services', fr: 'Services', en: 'Services' },
        { k: 'help', fr: 'Aide & contact', en: 'Help & contact' }
    ];
    const FAQ = [
        { k: 'login', cat: 'login', img: 'faq-login.webp',
          q: ['Comment me connecter à CashPay All ?', 'How do I sign in to CashPay All?'],
          a: ["Ouvrez l'application et choisissez votre mode de connexion : <b>Téléphone</b> ou <b>Wallet ID</b>. Avec le téléphone, sélectionnez votre pays (par exemple République démocratique du Congo, +243) puis saisissez votre numéro à 9 chiffres. Touchez ensuite <b>Sign in / Continuer</b>. Vous pouvez aussi cocher « Remember me » ou utiliser « Continuer avec Google ».",
              'Open the app and pick how you sign in: <b>Phone</b> or <b>Wallet ID</b>. With your phone, select your country (for example Democratic Republic of the Congo, +243) and enter your 9-digit number. Then tap <b>Sign in / Continue</b>. You can also tick "Remember me" or use "Continue with Google".'] },
        { k: 'walletid', cat: 'login',
          q: ['Puis-je me connecter avec mon Wallet ID ?', 'Can I sign in with my Wallet ID?'],
          a: ["Oui. Sur l'écran de connexion, touchez l'onglet <b>Wallet ID</b> à côté de « Téléphone » et saisissez votre Wallet ID à la place du numéro de téléphone.",
              'Yes. On the sign-in screen, tap the <b>Wallet ID</b> tab next to "Phone" and enter your Wallet ID instead of your phone number.'] },
        { k: 'noaccount', cat: 'login',
          q: ["Je n'ai pas encore de compte, que faire ?", "I don't have an account yet. What should I do?"],
          a: ['Sur l\'écran de connexion, touchez <b>Register now</b> (« No account? »), ou ouvrez un compte depuis <a href="https://app.cashpay-all.com">app.cashpay-all.com</a>.',
              'On the sign-in screen, tap <b>Register now</b> ("No account?"), or open an account from <a href="https://app.cashpay-all.com">app.cashpay-all.com</a>.'] },
        { k: 'pin', cat: 'login', img: 'faq-pin.webp',
          q: ['Comment fonctionne le code PIN ?', 'How does the PIN code work?'],
          a: ["Après votre identification, l'application vous demande votre <b>code PIN CashPay</b> avec un clavier numérique. Si votre téléphone est compatible, vous pouvez utiliser votre <b>empreinte digitale</b> (icône à gauche du 0). Ce n'est pas votre compte ? Touchez « Changer de compte ».",
              'After you identify yourself, the app asks for your <b>CashPay PIN</b> on a numeric keypad. If your phone supports it, you can use your <b>fingerprint</b> (icon to the left of 0). Not your account? Tap "Change account".'] },
        { k: 'pinlost', cat: 'login',
          q: ["J'ai oublié mon code PIN", 'I forgot my PIN'],
          a: ['Touchez <b>Code PIN oublié ?</b> puis <b>Récupérer mon compte</b> et suivez les étapes. Si vous êtes bloqué, <a href="contact.html">contactez-nous</a> : nous vous aidons.',
              'Tap <b>Forgot PIN?</b> then <b>Recover my account</b> and follow the steps. If you are stuck, <a href="contact.html">contact us</a> and we will help.'] },
        { k: 'usd', cat: 'account', img: 'faq-usd.webp',
          q: ['Où voir mon solde en dollars (USD) ?', 'Where can I see my USD balance?'],
          a: ["Sur l'écran <b>Portefeuille</b>, la carte « Solde Dollar USD » affiche votre solde et la carte <b>VISA</b> associée dès l'ouverture. Touchez l'icône en forme d'œil pour afficher ou masquer le solde, et l'icône de copie pour copier votre numéro de compte CP.",
              'On the <b>Wallet</b> screen, the "USD Balance" card shows your balance and the linked <b>VISA</b> card as soon as you open the app. Tap the eye icon to show or hide the balance, and the copy icon to copy your CP account number.'] },
        { k: 'cdf', cat: 'account', img: 'faq-cdf.webp',
          q: ['Comment voir mon solde en francs congolais (CDF) ?', 'How do I see my Congolese franc (CDF) balance?'],
          a: ["Les points sous la carte de solde indiquent vos portefeuilles : faites glisser la carte pour passer d'un portefeuille à l'autre, du solde en dollars au <b>Solde Franc Congolais (CDF)</b>.",
              'The dots under the balance card show your wallets: swipe the card to move from one wallet to another, from the dollar balance to the <b>Congolese Franc (CDF) balance</b>.'] },
        { k: 'home', cat: 'services', img: 'faq-actions.webp',
          q: ["Que puis-je faire depuis l'écran d'accueil ?", 'What can I do from the home screen?'],
          a: ["Des raccourcis donnent accès aux opérations principales : <b>Envoyer Transfert</b>, <b>Retrait Espèces</b>, <b>Crédit & Prêts</b>, <b>PayScan Panier/POS</b>, <b>Dépôt Recharger</b>, <b>Paiement Factures</b>, <b>Mes Cartes</b> et <b>Voir Plus</b>. Plus bas, la liste <b>Transactions</b> se filtre en Toutes, Entrants (+) et Sortants (−).",
              'Shortcuts give access to the main operations: <b>Send Transfer</b>, <b>Cash Withdrawal</b>, <b>Credit & Loans</b>, <b>PayScan Cart/POS</b>, <b>Deposit / Top-up</b>, <b>Bill Payment</b>, <b>My Cards</b> and <b>See more</b>. Further down, the <b>Transactions</b> list filters into All, Incoming (+) and Outgoing (−).'] },
        { k: 'momo', cat: 'services',
          q: ['Quels réseaux Mobile Money et quelles devises ?', 'Which Mobile Money networks and currencies?'],
          a: ['CashPay All est connecté à M-Pesa, Airtel Money, Orange Money, Africell Money et MTN pour vos dépôts et retraits, et gère plus de 195 devises avec des taux de change en temps réel. Voir tous les <a href="services.html">services</a>.',
              'CashPay All is connected to M-Pesa, Airtel Money, Orange Money, Africell Money and MTN for deposits and withdrawals, and handles over 195 currencies with real-time exchange rates. See all <a href="services.html">services</a>.'] },
        { k: 'ussd', cat: 'services',
          q: ['Puis-je utiliser CashPay sans internet ?', 'Can I use CashPay without internet?'],
          a: ["Oui, avec le <b>USSD *2704#</b> : solde, transferts, retraits, recharge et prêts depuis n'importe quel téléphone, sans internet, validés par votre code PIN.",
              'Yes, with <b>USSD *2704#</b>: balance, transfers, withdrawals, top-ups and loans from any phone, no internet needed, validated by your PIN.'] },
        { k: 'cards', cat: 'services',
          q: ['Comment obtenir une carte Visa ou Mastercard ?', 'How do I get a Visa or Mastercard card?'],
          a: ['Les cartes virtuelles et prépayées sont alimentées par votre solde CashPay, le Vault USB ou le Bitcoin. Touchez <b>Mes Cartes</b> dans l\'application. Pour les entreprises et partenaires, voir la page <a href="cartes-b2b.html">cartes B2B</a>.',
              'Virtual and prepaid cards are funded by your CashPay balance, the USB Vault or Bitcoin. Tap <b>My Cards</b> in the app. For companies and partners, see the <a href="cartes-b2b.html">B2B cards</a> page.'] },
        { k: 'agent', cat: 'services', img: 'faq-agent.webp',
          q: ["Comment fonctionne l'espace Service Agent ?", 'How does the Agent Service space work?'],
          a: ["Les agents agréés disposent d'un espace dédié : <b>commissions</b> en CDF et en USD (bouton « Basculer »), <b>opérations client</b> (dépôt et retrait en espèces) et <b>gestion & services</b> (scanner QR, prêt, Starlink, historique, virement). Pour devenir agent, <a href=\"contact.html\">contactez-nous</a>.",
              'Authorised agents have a dedicated space: <b>commissions</b> in CDF and USD ("Switch" button), <b>customer operations</b> (cash deposit and withdrawal) and <b>management & services</b> (QR scan, loan, Starlink, history, transfer). To become an agent, <a href="contact.html">contact us</a>.'] },
        { k: 'support', cat: 'help',
          q: ['Comment contacter le support ?', 'How do I contact support?'],
          a: ['Écrivez-nous sur WhatsApp au <a href="https://wa.me/243853868021" target="_blank" rel="noopener">+243 85 386 80 21</a> ou par e-mail à <a href="mailto:info@cashpay-all.com">info@cashpay-all.com</a>.',
              'Write to us on WhatsApp at <a href="https://wa.me/243853868021" target="_blank" rel="noopener">+243 85 386 80 21</a> or by e-mail at <a href="mailto:info@cashpay-all.com">info@cashpay-all.com</a>.'] },
        { k: 'dev', cat: 'help',
          q: ["Je suis développeur ou entreprise : où trouver l'API ?", 'I am a developer or a company: where is the API?'],
          a: ['Le portail développeurs regroupe la documentation, les clés API, le SMS, WhatsApp, les paiements et les décaissements : <a href="https://developer.cashpay-all.com">developer.cashpay-all.com</a>. Voir aussi la page <a href="developpeurs.html">Développeurs</a>.',
              'The developer portal gathers documentation, API keys, SMS, WhatsApp, payments and payouts: <a href="https://developer.cashpay-all.com">developer.cashpay-all.com</a>. See also the <a href="developpeurs.html">Developers</a> page.'] }
    ];

    // Témoignages réels uniquement : ajouter ici, ex.
    // { name: 'Prénom N.', role: 'Commerçant, Kinshasa', fr: 'Texte du client…', en: 'Customer text…', photo: 'public/images/testimonials/x.webp' }
    const TESTIMONIALS = [];

    const en = {};
    FAQ.forEach(f => { en['faq.' + f.k + '.q'] = f.q[1]; en['faq.' + f.k + '.a'] = f.a[1]; });
    FAQ_CATS.forEach(c => { en['faqcat.' + c.k] = c.en; });
    TESTIMONIALS.forEach((t, i) => { en['tm.' + i + '.t'] = t.en || t.fr; en['tm.' + i + '.r'] = t.role_en || t.role || ''; });
    if (window.I18N) window.I18N.extend(en);

    function faqItem(f) {
        const img = f.img ? '<figure class="faq-shot"><img src="' + IMG + f.img + '" alt="" loading="lazy"></figure>' : '';
        return '<details class="faq-item' + (f.img ? ' has-img' : '') + '" id="faq-' + f.k + '" data-cat="' + f.cat + '" data-reveal>' +
            '<summary><span data-i18n="faq.' + f.k + '.q">' + f.q[0] + '</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>' +
            '<div class="faq-body">' + img + '<div class="faq-text" data-i18n="faq.' + f.k + '.a">' + f.a[0] + '</div></div></details>';
    }

    window.renderFaq = function () {
        const list = document.querySelector('[data-faq]');
        if (!list) return;
        list.innerHTML = FAQ.map(faqItem).join('');
        const cats = document.querySelector('[data-faq-cats]');
        if (cats) {
            cats.innerHTML = FAQ_CATS.map((c, i) => '<button type="button" class="faq-cat' + (i === 0 ? ' active' : '') + '" data-cat="' + c.k + '" data-i18n="faqcat.' + c.k + '">' + c.fr + '</button>').join('');
            cats.addEventListener('click', e => {
                const b = e.target.closest('.faq-cat'); if (!b) return;
                cats.querySelectorAll('.faq-cat').forEach(x => x.classList.toggle('active', x === b));
                const k = b.getAttribute('data-cat');
                list.querySelectorAll('.faq-item').forEach(d => { d.hidden = !(k === 'all' || d.getAttribute('data-cat') === k); });
            });
        }
        const target = location.hash && document.querySelector(location.hash);
        if (target && target.classList.contains('faq-item')) target.open = true;
        else { const first = list.querySelector('.faq-item'); if (first) first.open = true; }
    };

    window.renderTestimonials = function () {
        document.querySelectorAll('[data-testimonials]').forEach(box => {
            if (TESTIMONIALS.length) {
                box.innerHTML = TESTIMONIALS.map((t, i) =>
                    '<figure class="tm-card" data-reveal><i class="fa-solid fa-quote-left tm-q" aria-hidden="true"></i>' +
                    '<blockquote data-i18n="tm.' + i + '.t">' + t.fr + '</blockquote>' +
                    '<figcaption>' + (t.photo ? '<img src="' + t.photo + '" alt="">' : '<span class="tm-ini">' + t.name.charAt(0) + '</span>') +
                    '<div><b>' + t.name + '</b><span data-i18n="tm.' + i + '.r">' + (t.role || '') + '</span></div></figcaption></figure>').join('');
            } else {
                box.innerHTML = '<div class="tm-empty" data-reveal><i class="fa-solid fa-comments tm-q" aria-hidden="true"></i>' +
                    '<h3 data-i18n="tm.empty.t">Vous utilisez CashPay All ? Votre avis compte.</h3>' +
                    '<p data-i18n="tm.empty.d">Racontez-nous votre expérience : paiements, transferts, cartes ou intégration. Nous publions ici, avec votre accord, les témoignages de nos clients et partenaires.</p>' +
                    '<div class="hero-btns" style="justify-content:center"><a class="btn btn-primary" href="https://wa.me/243853868021?text=' + encodeURIComponent('Bonjour CashPay, voici mon témoignage : ') + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> <span data-i18n="tm.empty.wa">Envoyer mon témoignage</span></a>' +
                    '<a class="btn btn-outline" href="contact.html"><i class="fa-solid fa-envelope" aria-hidden="true"></i> <span data-i18n="tm.empty.ct">Nous écrire un message</span></a></div></div>';
            }
        });
    };
    if (window.I18N) window.I18N.extend({
        'tm.empty.t': 'Do you use CashPay All? Your feedback matters.',
        'tm.empty.d': 'Tell us about your experience: payments, transfers, cards or integration. With your consent, we publish here the testimonials of our customers and partners.',
        'tm.empty.wa': 'Send my testimonial', 'tm.empty.ct': 'Write us a message'
    });
})();
