/* Page Emplois : pays → province → poste → informations → documents, puis envoi à /api/careers. */
(function () {
    const API = '/api/careers';
    const L = (k, fr) => (window.I18N ? I18N.t(k, fr) : fr);
    const lang = () => (window.I18N ? I18N.lang : 'fr');

    if (window.I18N) I18N.extend({
        'jb.crumb': 'Jobs', 'jb.title': 'Join <span class="highlight">CashPay All</span>',
        'jb.lead': 'We are hiring in every province of the Democratic Republic of the Congo. Choose your country, your province and the position that suits you, then send your application in a few minutes.',
        'jb.roles.t': 'The profiles we are <span class="highlight">looking for</span>', 'jb.roles.sub': 'These positions are open in each of our provinces.',
        'jb.apply.t': 'Apply <span class="highlight">online</span>', 'jb.apply.sub': 'Five simple steps. Your file goes straight to our team.',
        'jb.s1': 'Your country', 'jb.country': 'In which country would you like to work?',
        'jb.s2': 'Your province', 'jb.province': 'Province or region', 'jb.s3': 'The position', 'jb.s4': 'Your details', 'jb.s5': 'Documents and message',
        'jb.last': 'Last name', 'jb.first': 'First name', 'jb.age': 'Age', 'jb.phone': 'Phone (with country code)', 'jb.email': 'E-mail address', 'jb.city': 'City or town (optional)',
        'jb.cv': 'Your CV (PDF, DOC or DOCX, 5 MB maximum) *', 'jb.docs': 'Other documents: cover letter, diplomas… (optional, 3 files maximum)',
        'jb.msg': 'Message or description of your profile (optional)', 'jb.msg.ph': 'Tell us about your experience, your skills, your availability…',
        'jb.consent': 'I agree that my data and documents are sent to FINUSECO SARL to process my application.',
        'jb.send': 'Send my application', 'jb.sending': 'Sending…',
        'jb.done.t': 'Application sent', 'jb.done.d': 'Thank you! Your file has been sent to our team. We will contact you if your profile matches our needs.',
        'jb.done.ref': 'Your reference:', 'jb.done.home': 'Back to home',
        'jb.help.t': 'A question about a position?', 'jb.help.d': 'Write to us, our team will answer.',
        'jb.choose': '— Choose —', 'jb.chooseCountry': '— Choose your country —', 'jb.chooseProvince': '— Choose your province —', 'jb.region.ph': 'Your province or region',
        'jb.pick': 'Select a position', 'jb.otherCountry': 'Applications outside the DR Congo are welcome: tell us your region.',
        'jb.err.country': 'Please choose a country.', 'jb.err.province': 'Please choose or enter a province.', 'jb.err.position': 'Please choose a position.',
        'jb.err.fields': 'Please fill in all the required fields correctly.', 'jb.err.cv': 'Please attach your CV (PDF, DOC or DOCX).', 'jb.err.consent': 'Please accept the consent box.',
        'jb.err.size': 'A file is larger than 5 MB.', 'jb.err.type': 'A file has an unsupported format.', 'jb.err.docs': 'You can attach 3 other documents at most.',
        'jb.err.net': 'We could not send your application. Check your connection or write to info@cashpay-all.com.',
        'jb.err.cv_missing': 'The CV is required.', 'jb.err.cv_bad_type': 'CV refused: use a PDF, DOC or DOCX file of 5 MB maximum.', 'jb.err.cv_too_big': 'The CV is larger than 5 MB.',
        'jb.err.rate_limit': 'Too many applications from this connection. Please try again later.', 'jb.err.too_fast': 'Please wait a few seconds and try again.'
    });

    let DATA = null;
    const $ = id => document.getElementById(id);
    const form = $('job-form');
    if (!form) return;
    const posLabel = p => (lang() === 'en' ? p.en : p.fr);
    const posDesc = p => (lang() === 'en' ? p.enDesc : p.frDesc);
    function countryName(c) {
        try { if (lang() === 'en') return new Intl.DisplayNames(['en'], { type: 'region' }).of(c.code) || c.name; } catch (e) {}
        return c.name;
    }

    // ---- Rendu -------------------------------------------------------------
    function renderRoles() {
        $('job-roles').innerHTML = DATA.positions.filter(p => p.key !== 'open').map(p =>
            '<article class="job-role" data-reveal><div class="job-role-ico"><i class="fa-solid fa-briefcase" aria-hidden="true"></i></div><h3>' + posLabel(p) + '</h3><p>' + posDesc(p) + '</p><a href="#postuler" class="job-role-cta" data-pos="' + p.key + '">' + L('jb.role.cta', 'Postuler') + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>').join('');
    }
    function renderCountries() {
        const sel = $('f-country'), cur = sel.value;
        sel.innerHTML = '<option value="">' + L('jb.chooseCountry', '— Choisissez votre pays —') + '</option>' +
            DATA.countries.map(c => '<option value="' + c.code + '">' + countryName(c) + '</option>').join('');
        sel.value = cur;
    }
    function renderProvince() {
        const box = $('province-box'), c = DATA.countries.find(x => x.code === $('f-country').value);
        const cur = (box.querySelector('[name=province]') || {}).value || '';
        if (!c) { box.innerHTML = ''; return; }
        if (c.provinces) {
            box.innerHTML = '<select id="f-province" name="province" required><option value="">' + L('jb.chooseProvince', '— Choisissez votre province —') + '</option>' +
                c.provinces.map(p => '<option>' + p + '</option>').join('') + '</select>';
        } else {
            box.innerHTML = '<input id="f-province" name="province" type="text" maxlength="80" required placeholder="' + L('jb.region.ph', 'Votre province ou région') + '"><p class="job-hint">' + L('jb.otherCountry', 'Les candidatures hors RDC sont les bienvenues : indiquez votre région.') + '</p>';
        }
        const el = $('f-province'); if (cur) el.value = cur;
        el.addEventListener('change', refresh); el.addEventListener('input', refresh);
    }
    function renderPositions() {
        const cur = (form.querySelector('[name=position]:checked') || {}).value;
        $('job-pos').innerHTML = DATA.positions.map(p =>
            '<label class="job-pos-item"><input type="radio" name="position" value="' + p.key + '"' + (cur === p.key ? ' checked' : '') + '><span><b>' + posLabel(p) + '</b></span></label>').join('');
        showDesc();
    }
    function showDesc() {
        const v = (form.querySelector('[name=position]:checked') || {}).value, p = DATA.positions.find(x => x.key === v);
        $('pos-desc').textContent = p ? posDesc(p) : L('jb.pick', 'Sélectionnez un poste');
    }

    // ---- Étapes (déverrouillage progressif) ------------------------------------
    function stepDone() {
        const prov = form.querySelector('[name=province]');
        return [!!$('f-country').value, !!(prov && prov.value.trim()), !!form.querySelector('[name=position]:checked')];
    }
    function refresh() {
        const d = stepDone(), steps = form.querySelectorAll('.job-step');
        steps[1].classList.toggle('locked', !d[0]);
        steps[2].classList.toggle('locked', !(d[0] && d[1]));
        steps[3].classList.toggle('locked', !(d[0] && d[1] && d[2]));
        steps[4].classList.toggle('locked', !(d[0] && d[1] && d[2]));
        const n = 1 + (d[0] ? 1 : 0) + (d[0] && d[1] ? 1 : 0) + (d[0] && d[1] && d[2] ? 2 : 0);
        $('job-progress').querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i < n));
    }

    // ---- Envoi -------------------------------------------------------------
    function showError(msg) { const e = $('job-error'); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    const MAX = 5 * 1024 * 1024;
    const okExt = (f, list) => list.indexOf((f.name.split('.').pop() || '').toLowerCase()) !== -1;

    form.addEventListener('submit', async e => {
        e.preventDefault(); showError('');
        const prov = form.querySelector('[name=province]');
        if (!$('f-country').value) return showError(L('jb.err.country', 'Choisissez un pays.'));
        if (!prov || !prov.value.trim()) return showError(L('jb.err.province', 'Choisissez ou saisissez une province.'));
        if (!form.querySelector('[name=position]:checked')) return showError(L('jb.err.position', 'Choisissez un poste.'));
        const req = ['lastName', 'firstName', 'age', 'phone', 'email'];
        for (const n of req) { const el = form.elements[n]; if (!el.value.trim() || !el.checkValidity()) { el.focus(); return showError(L('jb.err.fields', 'Veuillez remplir correctement tous les champs obligatoires.')); } }
        const cv = $('f-cv').files[0];
        if (!cv) return showError(L('jb.err.cv', 'Joignez votre CV (PDF, DOC ou DOCX).'));
        const docs = Array.from($('f-docs').files);
        if (docs.length > 3) return showError(L('jb.err.docs', 'Vous pouvez joindre 3 autres documents au maximum.'));
        if (!okExt(cv, ['pdf', 'doc', 'docx']) || docs.some(f => !okExt(f, ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']))) return showError(L('jb.err.type', 'Un fichier a un format non accepté.'));
        if (cv.size > MAX || docs.some(f => f.size > MAX)) return showError(L('jb.err.size', 'Un fichier dépasse 5 Mo.'));
        if (!$('f-consent').checked) return showError(L('jb.err.consent', 'Veuillez cocher la case de consentement.'));

        const fd = new FormData(form);
        fd.set('lang', lang()); fd.set('t', String(startedAt));
        const btn = $('job-submit'); btn.disabled = true; const old = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' + L('jb.sending', 'Envoi en cours…');
        try {
            const r = await fetch(API, { method: 'POST', body: fd });
            let j = {}; try { j = await r.json(); } catch (x) {}
            if (r.ok && j.ok) {
                $('job-ref').textContent = j.ref || ''; form.hidden = true; $('job-done').hidden = false;
                $('job-done').scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else {
                showError(L('jb.err.' + j.error, j.message || L('jb.err.net', "L'envoi a échoué. Écrivez-nous à info@cashpay-all.com.")));
            }
        } catch (x) { showError(L('jb.err.net', "L'envoi a échoué. Vérifiez votre connexion ou écrivez-nous à info@cashpay-all.com.")); }
        btn.disabled = false; btn.innerHTML = old;
    });

    let startedAt = Date.now();
    fetch('js/jobs-data.json', { cache: 'no-cache' }).then(r => r.json()).then(d => {
        DATA = d; renderRoles(); renderCountries(); renderPositions(); refresh();
        // un clic sur « Postuler » d'une carte présélectionne le poste
        $('job-roles').addEventListener('click', ev => {
            const a = ev.target.closest('[data-pos]'); if (!a) return;
            const r = form.querySelector('[name=position][value="' + a.getAttribute('data-pos') + '"]'); if (r) { r.checked = true; showDesc(); refresh(); }
        });
        $('f-country').addEventListener('change', () => { renderProvince(); refresh(); });
        $('job-pos').addEventListener('change', () => { showDesc(); refresh(); });
        const cc = $('f-country'); if (!cc.value) { cc.value = 'CD'; renderProvince(); refresh(); } // RDC proposée par défaut
        startedAt = Date.now();
    }).catch(() => showError(L('jb.err.net', 'Impossible de charger la page. Réessayez.')));

    document.addEventListener('langchange', () => { if (!DATA) return; renderRoles(); renderCountries(); renderProvince(); renderPositions(); });
    if (window.I18N) I18N.extend({ 'jb.role.cta': 'Apply' });
})();
