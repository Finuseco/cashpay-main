/* Moteur de traduction FR / EN.
   - Le français est le texte déjà présent dans le HTML (sauvegardé au premier passage).
   - L'anglais vient du dictionnaire ci-dessous (+ celui des services, voir services-data.js).
   Utilisation : data-i18n="clé" (contenu) ou data-i18n-ph="clé" (placeholder). */
(function () {
    const EN = {
        /* ---------- Titres de pages ---------- */
        't.home': 'CashPay All — Your money, without borders',
        't.services': 'Services — CashPay All',
        't.workshops': 'Workshops — CashPay All',
        't.developers': 'Developers — CashPay All',
        't.cards': 'B2B Cards — CashPay All',
        't.about': 'About the app — CashPay All',
        't.company': 'FINUSECO — CashPay All',
        't.contact': 'Contact — CashPay All',

        /* ---------- Navigation & pied de page ---------- */
        'nav.home': 'Home', 'nav.services': 'Services', 'nav.workshops': 'Workshops', 'nav.developers': 'Developers',
        'nav.cards': 'B2B Cards', 'nav.about': 'About', 'nav.contact': 'Contact', 'nav.open': 'Open an account',
        'nav.about.app': 'The app', 'nav.about.app.d': 'CashPay All: how it works, security, platforms',
        'nav.about.co': 'The FINUSECO company', 'nav.about.co.d': 'Profile, brands, leadership',
        'foot.desc': 'The digital financial network that reduces cash and connects payments, cards, crypto and developer services. A brand of FINUSECO SARL.',
        'foot.explore': 'Explore', 'foot.eco': 'Ecosystem', 'foot.app': 'Web application', 'foot.devportal': 'Developer portal',
        'foot.dl': 'Download the app', 'foot.contact': 'Reach us', 'foot.rights': 'All rights reserved.',
        'foot.tagline': 'Congolese Digital Financial Service', 'wa.label': 'Chat on WhatsApp',
        'wa.msg': 'Hello CashPay, ',

        /* ---------- Accueil ---------- */
        'home.pill': 'A brand of FINUSECO SARL',
        'home.h1': 'Your money, <span class="highlight">without borders.</span>',
        'home.lead': 'National and international payments in multiple currencies, Visa & Mastercard cards, Mobile Money, crypto and developer services: all of CashPay All in a single ecosystem.',
        'home.dl': 'Download the app', 'home.open': 'Open an account',
        'chip.1': 'Instant transfer', 'chip.2': '195+ currencies', 'chip.3': 'Visa & Mastercard cards',
        'stat.cur': 'Currencies', 'stat.srv': 'Services', 'stat.lang': 'App languages', 'stat.cards': 'Card networks: Visa & Mastercard',
        'ws.tag': 'DESIGN SERVICES',
        'ws.title': 'We design the <span class="highlight">technology</span> behind your payments',
        'ws.sub': 'Two workshops under one roof: one engineers the systems and devices, the other builds the software.',
        'ws.more': 'Discover our workshops',
        'home.svc.tag': 'SERVICES', 'home.svc.title': 'An ecosystem of <span class="highlight">unlimited</span> services',
        'home.svc.sub': 'Discover how CashPay All simplifies your daily financial life.', 'home.svc.all': 'See all 20 services',
        'home.app.tag': 'OUR APPLICATION', 'home.app.title': 'Everything in <span class="highlight">one wallet</span>',
        'home.app.desc': 'Deposit, send, receive, pay by QR code, convert currencies and manage your cards from a single secure account, on mobile, on the web and by USSD.',
        'home.app.l1': 'Deposit and withdraw via Mobile Money, authorised agents or card',
        'home.app.l2': 'Instant sending in 195+ currencies at real-time rates',
        'home.app.l3': 'Visa & Mastercard cards funded by your balance, USB Vault or Bitcoin',
        'home.app.l4': 'Available in French and English on the web and Android',
        'home.app.more': 'About the app',
        'home.dev.tag': 'DEVELOPER SPACE', 'home.dev.title': 'Build on the <span class="highlight">CashPay</span> network',
        'home.dev.desc': 'Our developer portal gives you payment, payout, SMS, WhatsApp, exchange-rate and card-issuing APIs, with a sandbox, webhooks and documentation.',
        'home.dev.more': 'Explore the developer space',
        'home.b2b.tag': 'B2B CARDS', 'home.b2b.title': 'Prepaid cards for your <span class="highlight">partners</span>',
        'home.b2b.desc': 'Issue virtual and physical Visa & Mastercard prepaid cards for your customers and teams, funded just-in-time from your partner account.',
        'home.b2b.more': 'Discover B2B cards',
        'dl.title': 'Ready to transform your finances?', 'dl.sub': 'Download the CashPay All experience on all your platforms.',
        'dl.android': 'Android Standard', 'dl.android.d': 'The full experience. Recommended for everyone.', 'dl.apk': 'Download APK',
        'dl.win': 'Windows Desktop', 'dl.win.d': 'JoJo AI and account management on your PC.', 'dl.exe': 'Download .EXE', 'dl.win.n': 'Stable version Windows 10/11',
        'dl.ios': 'Apple iOS', 'dl.ios.d': 'Available for iPhone and iPad.', 'dl.ios.n': 'Coming soon on the App Store',
        'dl.lite': 'Lite version', 'dl.lite.d': 'Optimised for 2G/3G connections.', 'dl.lite.b': 'APK Lite',
        'cta.title': 'A project in mind? Let’s talk.', 'cta.desc': 'Payments, cards, applications or integrations: our team answers you quickly.',
        'cta.btn': 'Contact us', 'cta.wa': 'Write on WhatsApp',

        /* ---------- Page Services ---------- */
        'svcp.title': 'All our <span class="highlight">services</span>',
        'svcp.lead': 'Payments, finance, commerce and developer tools: twenty services in a single ecosystem.',
        'f.all': 'All', 'f.pay': 'Payments & transfers', 'f.fin': 'Finance & savings', 'f.life': 'Commerce & daily life', 'f.biz': 'Business & developers',
        'svcp.apps.title': 'Our <span class="highlight">brands</span> in the ecosystem',
        'svcp.apps.sub': 'Each product has its own identity, all connected to the same CashPay account.',

        /* ---------- Ateliers ---------- */
        'wp.title': 'Our <span class="highlight">design workshops</span>',
        'wp.lead': 'Two complementary workshops: systems & hardware engineering, and software engineering. From the idea to the deployed product.',
        'ws1.title': 'Systems & Engineering Design Workshop',
        'ws1.desc': 'We design the physical and technical building blocks of the payment ecosystem: secure devices, cards, gateways and infrastructure.',
        'ws1.l1': 'Offline value keys: USB keys with .CPK certificates and HSM vault',
        'ws1.l2': 'Prepaid and virtual Visa & Mastercard card programmes with just-in-time funding',
        'ws1.l3': 'USSD gateways and routing to reach any phone, even without internet',
        'ws1.l4': 'IoT integrations such as smart fuel-station controllers',
        'ws1.l5': 'Blockchain and crypto infrastructure (Bitcoin node, multi-network receiving addresses)',
        'ws2.title': 'Software Engineering Workshop',
        'ws2.desc': 'We design and build the applications that your users touch every day: mobile, web, APIs and integrations.',
        'ws2.l1': 'Android, iOS and web applications (fintech, e-commerce, corporate sites)',
        'ws2.l2': 'REST APIs, webhooks and payment-gateway integrations',
        'ws2.l3': 'WordPress plugin and ready-to-use SDKs',
        'ws2.l4': 'Real-time messaging, video meetings and online games',
        'ws2.l5': 'JoJo AI Studio: describe an application, get a starter project generated',
        'ws.contact': 'Request a quote',
        'wp.proc.title': 'How we <span class="highlight">work</span>', 'wp.proc.sub': 'A simple, transparent method from the first conversation to the support.',
        'step.1.t': 'Listen', 'step.1.d': 'We understand your goal, your users and your constraints.',
        'step.2.t': 'Design', 'step.2.d': 'Architecture, flows, interfaces and security are defined and validated with you.',
        'step.3.t': 'Build', 'step.3.d': 'Our engineers develop the hardware, the software and the integrations.',
        'step.4.t': 'Test', 'step.4.d': 'Sandbox environment, real-case scenarios and corrections before going live.',
        'step.5.t': 'Deploy & support', 'step.5.d': 'Production release, monitoring and continuous improvement.',
        'wp.cap.title': 'What our workshops <span class="highlight">produce</span>',
        'cap.1.t': 'Payment applications', 'cap.1.d': 'Wallets, checkout pages, transfer and bill-payment flows.',
        'cap.2.t': 'Secure hardware', 'cap.2.d': 'USB keys, vaults and devices that hold value offline.',
        'cap.3.t': 'Cards & programmes', 'cap.3.d': 'Prepaid, virtual and physical cards for your own customers.',
        'cap.4.t': 'APIs & integrations', 'cap.4.d': 'Connect your system to CashPay in a few lines of code.',
        'cap.5.t': 'Websites & platforms', 'cap.5.d': 'Corporate sites, marketplaces, news portals and business pages.',
        'cap.6.t': 'Assistants & automation', 'cap.6.d': 'AI assistants, notifications by SMS and WhatsApp, back-office tools.',

        /* ---------- Développeurs ---------- */
        'dv.title': 'The <span class="highlight">developer</span> space',
        'dv.lead': 'One portal to accept payments, move money, verify identities, issue cards and reach your users, anywhere in the world.',
        'dv.portal': 'Open the developer portal', 'dv.docs': 'Read the documentation',
        'dv.api.title': 'A complete suite of <span class="highlight">B2B APIs</span>',
        'dv.api.sub': 'Five families of services, documented and ready to integrate.',
        'dv.g1.t': 'Payments & Gateway', 'dv.g1.d': 'Accept payments globally via cards, wallets and mobile money.',
        'dv.g1.1': 'Hosted checkout (web)', 'dv.g1.2': 'Direct card payments', 'dv.g1.3': 'Server-to-server charges', 'dv.g1.4': 'Android native SDK', 'dv.g1.5': 'Wallet-to-wallet transfers',
        'dv.g2.t': 'Banking & Payouts', 'dv.g2.d': 'Move funds across banks and mobile money networks.',
        'dv.g2.1': 'Global bank transfers', 'dv.g2.2': 'Payouts to mobile money or bank', 'dv.g2.3': 'Bill payment',
        'dv.g3.t': 'Identity & Security', 'dv.g3.d': 'Verify identities and manage secure hardware assets.',
        'dv.g3.1': 'Identity & KYC', 'dv.g3.2': 'USB HSM Vault', 'dv.g3.3': 'Card issuing', 'dv.g3.4': 'Disputes',
        'dv.g4.t': 'Hardware & IoT', 'dv.g4.d': 'Integrate physical devices into the CashPay ecosystem.',
        'dv.g4.1': 'Smart fuel network', 'dv.g4.2': 'Station controllers & telemetry',
        'dv.g5.t': 'Value-added services', 'dv.g5.d': 'Engage your customers with SMS, WhatsApp and airtime.',
        'dv.g5.1': 'SMS API with custom sender ID', 'dv.g5.2': 'WhatsApp API', 'dv.g5.3': 'Airtime API', 'dv.g5.4': 'Real-time exchange rates', 'dv.g5.5': 'Ad network',
        'dv.code.tag': 'FROM IDEA TO FIRST REQUEST', 'dv.code.title': 'Integrate in <span class="highlight">minutes</span>',
        'dv.code.desc': 'Create your account, get your API keys from the dashboard, test in the sandbox and go live. Every endpoint is documented with request and response examples.',
        'dv.b1': 'Sandbox', 'dv.b2': 'Webhooks', 'dv.b3': 'SDKs', 'dv.b4': 'WordPress plugin', 'dv.b5': 'USSD gateway', 'dv.b6': 'JIT funding',
        'dv.price.title': 'Transparent <span class="highlight">pricing</span>', 'dv.price.sub': 'Prices are configured from your own dashboard.',
        'dv.p1.t': 'SMS API', 'dv.p1.d': 'Custom sender ID. $0.036 per SMS, i.e. $36 for 1,000 SMS.',
        'dv.p2.t': 'WhatsApp API', 'dv.p2.d': '$8 per month to message your customers on WhatsApp.',
        'dv.p3.t': 'Payments & payouts', 'dv.p3.d': 'Collection, payouts and B2B prepaid cards with prices set from your system.',
        'dv.p4.t': 'Exchange rates', 'dv.p4.d': 'Real-time rates for 195+ countries and currencies.',
        'dv.cta.title': 'Ready to start building?', 'dv.cta.desc': 'Get your API keys from the developer dashboard and make your first request to the CashPay network.',
        'dv.cta.btn': 'Create a developer account',

        /* ---------- Cartes B2B ---------- */
        'cb.title': 'B2B & prepaid cards for <span class="highlight">partners</span>',
        'cb.lead': 'Issue Visa and Mastercard cards for your customers, employees or agents, funded just-in-time from a single partner account.',
        'cb.api': 'See the card-issuing API',
        'cb.how.tag': 'THE JIT MODEL', 'cb.how.title': 'One <span class="highlight">fleet account</span>, unlimited cards',
        'cb.how.desc': 'Your partner fleet account powers all your B2B operations. Cards hold no balance of their own: every transaction draws just-in-time from the funding source you choose.',
        'cb.how.l1': 'No balance stored on the card, for maximum security',
        'cb.how.l2': 'Instant activation and deactivation, spending controls',
        'cb.how.l3': 'Funding from your CashPay balance, USB Vault or Bitcoin',
        'cb.how.l4': 'Virtual cards on demand and physical cards by order',
        'cb.types.title': 'Choose the <span class="highlight">right card</span>',
        'cb.t1.t': 'Virtual card', 'cb.t1.d': 'Issued instantly through the API for online payments and subscriptions.',
        'cb.t2.t': 'Physical card', 'cb.t2.d': 'A prepaid Visa or Mastercard card usable at ATMs and in stores.',
        'cb.t3.t': 'Visa & Mastercard', 'cb.t3.d': 'The two global networks, accepted by millions of merchants.',
        'cb.t4.t': 'Spending controls', 'cb.t4.d': 'Freeze, unfreeze and set limits for each cardholder.',
        'cb.use.title': 'Built for <span class="highlight">your business</span>',
        'cb.u1.t': 'Fintechs & platforms', 'cb.u1.d': 'Offer cards inside your own app without becoming an issuer.',
        'cb.u2.t': 'Companies & payroll', 'cb.u2.d': 'Pay salaries automatically onto cards and control team expenses.',
        'cb.u3.t': 'Merchants & marketplaces', 'cb.u3.d': 'Reward, refund and pay your sellers and customers.',
        'cb.u4.t': 'Agents & networks', 'cb.u4.d': 'Equip your field agents with funded cards in a few clicks.',
        'cb.steps.title': 'Start in <span class="highlight">four steps</span>',
        'cb.s1.t': 'Open a partner account', 'cb.s1.d': 'Create your developer account and get your API keys.',
        'cb.s2.t': 'Fund your fleet account', 'cb.s2.d': 'Top up by Mobile Money or bank card.',
        'cb.s3.t': 'Issue cards', 'cb.s3.d': 'Call the API or use the dashboard for each cardholder.',
        'cb.s4.t': 'Manage & monitor', 'cb.s4.d': 'Track transactions, freeze cards and receive webhooks.',
        'cb.cta.title': 'Launch your card programme', 'cb.cta.desc': 'Tell us about your use case and we will set up your partner account.',

        /* ---------- À propos de l'application ---------- */
        'ap.title': 'About the <span class="highlight">CashPay All</span> app',
        'ap.lead': 'Digital Finance Ecosystem: transfer money nationally and internationally, pay all kinds of bills and make everything digital.',
        'ap.what.tag': 'WHAT IS IT?', 'ap.what.title': 'Reduce cash, <span class="highlight">connect everything</span>',
        'ap.what.desc': 'CashPay All is a payment and finance application connected to all Mobile Money networks and card payment networks. Our goal: reduce cash and liquidity by making every payment digital, fast and traceable.',
        'ap.what.l1': 'Instant sending, receiving and payment', 'ap.what.l2': 'More than 195 currencies with real-time exchange rates',
        'ap.what.l3': 'Virtual and prepaid Visa & Mastercard cards', 'ap.what.l4': 'Mini Blockchain: receive crypto on the same CashPay account',
        'ap.feat.title': 'Main <span class="highlight">features</span>',
        'ap.f1.t': 'Deposit & withdraw', 'ap.f1.d': 'Mobile Money, authorised agents or payment card.',
        'ap.f2.t': 'Send & receive', 'ap.f2.d': 'Transfers between accounts, countries and currencies.',
        'ap.f3.t': 'Pay by QR', 'ap.f3.d': 'Scan to pay in shops and online.',
        'ap.f4.t': 'Cards', 'ap.f4.d': 'Virtual and prepaid cards, instantly frozen or activated.',
        'ap.f5.t': 'OnChat', 'ap.f5.d': 'Chat and send money in the same conversation.',
        'ap.f6.t': 'Loans', 'ap.f6.d': 'Request and repay Loan Me credit from the app.',
        'ap.how.title': 'How it <span class="highlight">works</span>',
        'ap.s1.t': 'Create your account', 'ap.s1.d': 'Register on the app or the web in a few minutes.',
        'ap.s2.t': 'Fund your wallet', 'ap.s2.d': 'Deposit by Mobile Money, agent or card.',
        'ap.s3.t': 'Send and pay', 'ap.s3.d': 'Transfers, bills, shopping and QR payments.',
        'ap.s4.t': 'Stay in control', 'ap.s4.d': 'PIN validation, instant SMS and e-mail alerts.',
        'ap.sec.tag': 'SECURITY', 'ap.sec.title': 'Your <span class="highlight">trust</span> comes first',
        'ap.sec.desc': 'Every sensitive operation is validated by your personal PIN code, notified instantly by SMS and e-mail, and fully traced.',
        'ap.sec.l1': 'PIN code validation, including on USSD *2704#', 'ap.sec.l2': 'Instant SMS and e-mail alerts', 'ap.sec.l3': 'Full transaction history',
        'ap.sec.l4': 'Cards without stored balance (just-in-time)', 'ap.sec.l5': 'Offline value with the USB Vault and .CPK certificates',
        'ap.plat.title': 'Available on <span class="highlight">every platform</span>',

        /* ---------- À propos de l'entreprise ---------- */
        'co.title': 'FINUSECO <span class="highlight">SARL</span>',
        'co.lead': 'Service Financier Numérique Congolais — the company behind CashPay All and a family of digital products.',
        'co.who.tag': 'WHO WE ARE', 'co.who.title': 'A Congolese <span class="highlight">digital finance</span> company',
        'co.who.desc': 'FINUSECO stands for “Service Financier Numérique Congolais” (Congolese Digital Financial Service). We design, build and operate payment and financial technologies that make money simpler, faster and more accessible, starting from the Democratic Republic of the Congo and reaching the world.',
        'co.mission.t': 'Mission', 'co.mission.d': 'Reduce cash and liquidity by making digital payments accessible to everyone.',
        'co.vision.t': 'Vision', 'co.vision.d': 'A sovereign, interconnected financial network that links people, businesses and partners worldwide.',
        'co.values.t': 'Values', 'co.values.d': 'Security, transparency, innovation and proximity with our users.',
        'co.brands.title': 'The <span class="highlight">FINUSECO</span> profiles',
        'co.brands.sub': 'Every brand and product of the group, in one place.',
        'br.cp': 'CashPay All', 'br.cp.d': 'Wallet, transfers, cards, crypto and payments.',
        'br.vault': 'CashPay Vault', 'br.vault.d': 'Digital vault reading CPK USB keys.',
        'br.onchat': 'OnChat', 'br.onchat.d': 'Messaging, calls and money transfers in the chat.',
        'br.jojo': 'JoJo Shopping', 'br.jojo.d': 'Online marketplace of the CashPay network.',
        'br.monpays': 'MonPays', 'br.monpays.d': 'Business pages and showcase for companies.',
        'br.jojoai': 'JoJo AI', 'br.jojoai.d': 'Smart assistant and application generator.',
        'br.dev': 'CashPay Developer', 'br.dev.d': 'B2B APIs, cards and tools for developers.',
        'br.loan': 'Loan Me', 'br.loan.d': 'Individual, business and group loans.',
        'co.lead.title': 'Our <span class="highlight">leadership</span>',
        'co.lead.sub': 'The people who steer the company.',
        'leader.ceo.role': 'Chief Executive Officer (CEO)',
        'leader.ceo.desc': 'Leads the vision, strategy and growth of FINUSECO SARL and the CashPay All ecosystem.',
        'leader.mgr.role': 'Manager', 'leader.mgr.desc': 'Coordinates the teams and oversees day-to-day operations.',

        /* ---------- Contact ---------- */
        'ct.title': 'Contact <span class="highlight">us</span>',
        'ct.lead': 'A question, a partnership or a project? Write to us by e-mail or WhatsApp.',
        'ct.mail': 'Professional e-mail', 'ct.wa': 'WhatsApp', 'ct.web': 'Website', 'ct.hours': 'We answer as quickly as possible.',
        'ct.form.title': 'Send us a message',
        'ct.name': 'Full name', 'ct.email': 'Your e-mail', 'ct.subject': 'Subject', 'ct.msg': 'Message',
        'ct.s1': 'General question', 'ct.s2': 'Partnership', 'ct.s3': 'Developer / API', 'ct.s4': 'B2B cards', 'ct.s5': 'Quote for a project', 'ct.s6': 'Support',
        'ct.ph.name': 'Your name', 'ct.ph.email': 'you@example.com', 'ct.ph.msg': 'How can we help you?',
        'ct.send': 'Send by e-mail', 'ct.sendwa': 'Send on WhatsApp',
        'ct.note': 'Your e-mail application will open with the message ready to send.',
        'ct.err': 'Please fill in your name and message.',

        /* ---------- Section transfert animé ---------- */
        'xf.tag': 'INTERNATIONAL TRANSFER', 'xf.title': 'Send money <span class="highlight">anywhere in the world</span>',
        'xf.sub': '195+ currencies · Real-time rates · Instant sending',
        'xf.play': 'Start the transfer', 'xf.running': 'Transfer in progress…', 'xf.replay': 'Replay the transfer',
        'xf.note': 'Tap “Send Transfer” on the left phone, or start the demo. Illustrative example with fictional amounts.',
        'xf.hint': 'Tap “Send”', 'xf.kin': 'Kinshasa, DR Congo', 'xf.par': 'Paris, France',
        'xf.sent': 'Sent', 'xf.recv': 'Received', 'xf.rate': 'Real-time rate',
        'xf.hello': 'Welcome', 'xf.acct': 'CP account no.', 'xf.lbl.cdf': 'Congolese Franc balance (CDF)', 'xf.lbl.eur': 'Euro balance (EUR)',
        'xf.recent': 'Recent contacts', 'xf.all': 'See all', 'xf.add': 'Add', 'xf.contacts': 'Contacts',
        'xf.t1': 'Send Transfer', 'xf.t2': 'Cash Withdrawal', 'xf.t3': 'Credit & Loans', 'xf.t4': 'PayScan Cart/POS',
        'xf.t5': 'Deposit Top up', 'xf.t6': 'Bill Payment', 'xf.t7': 'My Cards', 'xf.t8': 'See More',
        'xf.tx': 'Transactions', 'xf.tab1': 'All', 'xf.tab2': 'Incoming (+)', 'xf.tab3': 'Outgoing (-)',
        'xf.tx.d1': 'Mobile Money deposit', 'xf.tx.d2': 'Bill payment', 'xf.tx.d3': 'Card deposit', 'xf.tx.d4': 'Online purchase',
        'xf.tx.out': 'Transfer to Paris', 'xf.tx.in': 'Received from Kinshasa', 'xf.now': 'Just now', 'xf.yday': 'Yesterday',
        'xf.n1': 'Wallet', 'xf.n2': 'History', 'xf.n3': 'Cards', 'xf.n4': 'Profile',
        'xf.f1.t': 'Send', 'xf.f1.d': 'Anywhere, in an instant', 'xf.f2.t': 'Receive', 'xf.f2.d': 'Even from abroad',
        'xf.f3.t': 'Pay', 'xf.f3.d': 'Bills and shops', 'xf.f4.t': 'Sell', 'xf.f4.d': 'And buy online',
        'xf.f5.t': 'Withdraw', 'xf.f5.d': 'Cash, Mobile Money', 'xf.f6.t': 'Cards', 'xf.f6.d': 'Visa and Mastercard',

        /* ---------- Atelier génie logiciel (animé) ---------- */
        'sw.tag': `SOFTWARE ENGINEERING WORKSHOP`,
        'sw.title': `We design your application <span class="highlight">around your vision</span>`,
        'sw.desc': `Our software engineering workshop supports you from the idea to production: you describe your need, our engineers design, develop and deploy the application that fits you.`,
        'sw.types': `Applications we build`,
        'sw.t1': `Enterprise applications`, 'sw.t2': `Stock management`, 'sw.t3': `Financial management`, 'sw.t4': `Core e-banking`,
        'sw.t5': `Android and iOS mobile applications`, 'sw.t6': `E-commerce and marketplaces`,
        'sw.connect': `We connect your applications to all payment networks and platforms, with payments validated by partners at international level, for e-commerce as well as finance.`,
        'sw.msg': `SMS and WhatsApp gateways for developers: notifications, validation codes and customer messages sent straight from your application.`,
        'sw.vps': `We also support our partners in managing their VPS servers and in the most complex technical tasks.`,
        'sw.help': `CashPay is here to help you.`, 'sw.cta': `Talk about my project`,
        'cap.7.t': `Core e-banking`, 'cap.7.d': `Digital core banking: accounts, transactions, settlements and reports.`,
        'cap.8.t': `Business & stock management`, 'cap.8.d': `Stock, sales, finance and dashboards tailored to your activity.`,
        'cap.9.t': `VPS servers & infrastructure`, 'cap.9.d': `Support for partners in managing their servers and complex technical tasks.`,

        /* ---------- Intégration du paiement ---------- */
        'int.tag': `FOR BUSINESSES`,
        'int.title': `Integrate <span class="highlight">CashPay</span> payments into your application`,
        'int.desc': `Do you run an e-commerce or fintech application? Connect our payment method to collect from your customers (collection) and pay your users or partners (payout).`,
        'int.c1.t': `Collection`, 'int.c1.d': `Collect from your customers on your site or app: hosted payment page, direct card payment, Mobile Money or CashPay wallet.`,
        'int.c2.t': `Payment & payout`, 'int.c2.d': `Send money to your users, sellers, agents or employees through Mobile Money, bank or CashPay wallet.`,
        'int.c3.t': `E-commerce applications`, 'int.c3.d': `Online shops and marketplaces: WordPress plugin, payment page and API to validate every order.`,
        'int.c4.t': `Fintech applications`, 'int.c4.d': `Wallets, B2B prepaid cards, identity verification (KYC) and real-time exchange rates.`,
        'int.doc': `Payment documentation`, 'int.l1': `Hosted payment page`, 'int.l2': `Payouts`, 'int.l3': `WordPress plugin`,

        /* ---------- Messagerie ---------- */
        'msg.tag': `SMS & WHATSAPP`, 'msg.title': `Messaging for <span class="highlight">developers</span>`,
        'msg.desc': `Send SMS and WhatsApp messages from your applications with our gateways: validation codes, transaction alerts, notifications and customer reminders.`,
        'msg.sms.t': `SMS gateway`, 'msg.sms.d': `Custom sender ID. $0.036 per SMS, i.e. $36 for 1,000 SMS.`,
        'msg.wa.t': `WhatsApp gateway`, 'msg.wa.d': `$8 per month to message your customers on WhatsApp.`,
        'msg.docs.sms': `SMS documentation`, 'msg.docs.wa': `WhatsApp documentation`,
        'msg.head': `Messages sent by your applications`,
        'msg.b1': `Your CashPay validation code: 482 913`, 'msg.b2': `Payment of USD 25.00 received. Thank you for your order!`, 'msg.b3': `Order no. 1042 confirmed. Delivery tomorrow.`
    };

    const state = { lang: 'fr', en: EN };

    function apply(lang) {
        state.lang = lang === 'en' ? 'en' : 'fr';
        try { localStorage.setItem('cashpay-lang', state.lang); } catch (e) {}
        document.documentElement.lang = state.lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (!el.hasAttribute('data-fr')) el.setAttribute('data-fr', el.innerHTML);
            const key = el.getAttribute('data-i18n');
            el.innerHTML = (state.lang === 'en' && state.en[key] !== undefined) ? state.en[key] : el.getAttribute('data-fr');
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            if (!el.hasAttribute('data-fr-ph')) el.setAttribute('data-fr-ph', el.getAttribute('placeholder') || '');
            const key = el.getAttribute('data-i18n-ph');
            el.setAttribute('placeholder', (state.lang === 'en' && state.en[key] !== undefined) ? state.en[key] : el.getAttribute('data-fr-ph'));
        });
        document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === state.lang));
        document.dispatchEvent(new CustomEvent('langchange', { detail: state.lang }));
    }

    window.I18N = {
        apply,
        extend(obj) { Object.assign(state.en, obj); },
        t(key, fr) { return state.lang === 'en' && state.en[key] !== undefined ? state.en[key] : fr; },
        get lang() { return state.lang; },
        initial() {
            let l = 'fr';
            try { l = localStorage.getItem('cashpay-lang') || 'fr'; } catch (e) {}
            return l;
        }
    };
})();
