(function () {
    'use strict';
    if (!window.I18N) return;
    I18N.extend({
 "st.1": "We finance young entrepreneurs",
 "st.2": "Young entrepreneurs, startups, fintechs, project owners: if you have an idea or a product that can make a difference, we finance it. Just apply with your project.",
 "st.3": "Who can apply?",
 "st.4": "Startups at every stage: idea, prototype, launched product or growth.",
 "st.5": "Fintechs and digital projects (payments, finance, online commerce).",
 "st.6": "Young entrepreneurs launching a business.",
 "st.7": "SMEs that want to finance their growth.",
 "st.8": "What we look at",
 "st.9": "The problem you solve and for whom.",
 "st.10": "Your team and its ability to execute.",
 "st.11": "Your market and your first results, even small ones.",
 "st.12": "The precise use of the financing requested.",
 "st.13": "How it works",
 "st.14": "Submit your project",
 "st.15": "Fill in the form below and, if possible, add a presentation (PDF, Word or PowerPoint).",
 "st.16": "We review it",
 "st.17": "Our financing team analyses your project and its potential.",
 "st.18": "Meeting",
 "st.19": "If the project fits, we meet to go deeper.",
 "st.20": "Decision, financing and guidance",
 "st.21": "We guide you on the best way to finance your project and make it grow.",
 "st.22": "Do not attach highly sensitive confidential documents. Your files are not stored on our server: they are sent by e-mail to our financing team.",
 "st.23": "Tips for presenting your project well",
 "st.24": "Be clear: one idea, one problem, one solution.",
 "st.25": "Quantify your need and explain what each dollar is for.",
 "st.26": "Show what already exists: mock-up, customers, first revenue.",
 "st.27": "Be honest about the risks: it builds trust.",
 "t.st": "Financing for startups and young entrepreneurs — CashPay All",
 "st.crumb": "Startup financing",
 "st.28": "Financing for startups and young entrepreneurs",
 "st.29": "Young entrepreneurs, startups, fintechs, project owners: we finance. Apply with your project and submit it online.",
 "art.cta.t": "A question about financing?",
 "art.cta.d": "Write to us, we will answer."
});

    var API = 'https://app.cashpay-all.com/api/projects', EN = I18N.lang === 'en';
    I18N.extend({"st.f.t": "Submit my project", "st.f.sub": "All fields marked with an asterisk are required.", "st.f.name": "Project name *", "st.f.kind": "Project type *", "st.f.stage": "Stage *", "st.f.sector": "Sector *", "st.f.amount": "Financing sought (USD)", "st.f.country": "Country *", "st.f.city": "City", "st.f.desc": "Describe your project * (at least 50 characters)", "st.f.use": "What will the financing be used for?", "st.f.first": "First name *", "st.f.last": "Last name *", "st.f.role": "Your role in the project", "st.f.phone": "Phone (WhatsApp) *", "st.f.email": "E-mail *", "st.f.web": "Project website or link", "st.f.docs": "Project presentation (PDF, Word or PowerPoint, 2 files, 5 MB each)", "st.f.consent": "I agree that this information is sent to CashPay All to review my project. *", "st.f.send": "Send my project", "st.k.startup": "Startup", "st.k.fintech": "Fintech", "st.k.pme": "SME / existing business", "st.k.commerce": "Commerce and delivery", "st.k.autre": "Other project", "st.s.idee": "Idea", "st.s.prototype": "Prototype", "st.s.produit": "Launched product", "st.s.croissance": "Growth", "st.done.t": "Your project has been sent", "st.done.d": "Our financing team will review it. A confirmation e-mail is on its way. Your reference:"});
    var $ = function (id) { return document.getElementById(id); };
    var L = function (k, fr) { return I18N.t(k, fr); };
    var started = Date.now(), busy = false;
    var errs = { en: { required: 'Please fill in all required fields.', desc: 'Please describe your project (at least 50 characters).', consent: 'Please tick the consent box.', size: 'A file is over 5 MB.', type: 'Unsupported file format (PDF, Word or PowerPoint).', many: 'Two files maximum.', net: 'The result could not be confirmed. Keep this page and check your e-mail, or write to info@cashpay-all.com before submitting again.', email: 'Invalid e-mail address.' },
        fr: { required: 'Veuillez remplir tous les champs obligatoires.', desc: 'Décrivez votre projet (au moins 50 caractères).', consent: 'Veuillez cocher la case de consentement.', size: 'Un fichier dépasse 5 Mo.', type: 'Format non accepté (PDF, Word ou PowerPoint).', many: 'Deux fichiers au maximum.', net: 'Le résultat n’a pas pu être confirmé. Gardez cette page, vérifiez vos e-mails ou écrivez à info@cashpay-all.com avant de soumettre à nouveau.', email: 'Adresse e-mail invalide.' } };
    var msg = function (k) { return errs[I18N.lang === 'en' ? 'en' : 'fr'][k]; };
    function showErr(t) { var e = $('p-error'); e.textContent = t; e.hidden = false; e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    function countries(d) {
        var sel = $('p-country'); if (!sel) return;
        var name = function (c) { try { if (I18N.lang === 'en') return new Intl.DisplayNames(['en'], { type: 'region' }).of(c.code) || c.name; } catch (e) {} return c.name; };
        var fill = function () { var v = sel.value; sel.innerHTML = d.countries.map(function (c) { return '<option value="' + c.code + '">' + name(c) + '</option>'; }).join(''); sel.value = v || 'CD'; };
        fill(); document.addEventListener('langchange', fill);
    }
    fetch('js/jobs-data.json').then(function (r) { return r.json(); }).then(countries).catch(function () {});
    var q = (location.search.match(/[?&]type=(\w+)/) || [])[1]; if (q && $('p-kind')) $('p-kind').value = q;
    var form = $('proj-form'); if (!form) return;
    form.addEventListener('submit', function (ev) {
        ev.preventDefault(); if (busy) return; $('p-error').hidden = true;
        var fd = new FormData(form), req = ['projectName', 'sector', 'country', 'firstName', 'lastName', 'phone', 'email'];
        for (var i = 0; i < req.length; i++) if (!String(fd.get(req[i]) || '').trim()) return showErr(msg('required'));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fd.get('email')).trim())) return showErr(msg('email'));
        if (String(fd.get('description')).trim().length < 50) return showErr(msg('desc'));
        var files = Array.prototype.slice.call($('p-docs').files);
        if (files.length > 2) return showErr(msg('many'));
        for (var j = 0; j < files.length; j++) { if (files[j].size > 5 * 1024 * 1024) return showErr(msg('size')); if (!/\.(pdf|docx?|pptx)$/i.test(files[j].name)) return showErr(msg('type')); }
        if (!$('p-consent').checked) return showErr(msg('consent'));
        fd.delete('docs'); files.forEach(function (f) { fd.append('docs', f); });
        fd.set('lang', I18N.lang); fd.set('t', String(started));
        var btn = $('p-submit'), old = btn.innerHTML; busy = true; btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' + (I18N.lang === 'en' ? 'Sending…' : 'Envoi en cours…');
        fetch(API, { method: 'POST', body: fd, credentials: 'omit' }).then(function (r) { return r.json().catch(function () { return {}; }); }).then(function (j) {
            if (j.ok && j.delivery && j.delivery.internal === 'accepted' && typeof j.ref === 'string') {
                form.hidden = true; $('p-ref').textContent = j.ref; var d = $('p-done'); d.hidden = false; d.scrollIntoView({ block: 'center', behavior: 'smooth' }); d.focus();
            } else showErr(j.message || msg('net'));
        }).catch(function () { showErr(msg('net')); }).then(function () { busy = false; btn.disabled = false; btn.innerHTML = old; });
    });
})();
