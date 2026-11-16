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
        'jb.err.size': 'A file is larger than 5 MB.', 'jb.err.total_too_big': 'The files exceed 15 MB in total. Please reduce their size.', 'jb.err.type': 'A file has an unsupported format.', 'jb.err.docs': 'You can attach 3 other documents at most.',
        'jb.err.net': 'We could not send your application. Check your connection or write to info@cashpay-all.com.',
        'jb.err.cv_missing': 'The CV is required.', 'jb.err.cv_bad_type': 'CV refused: use a PDF, DOC or DOCX file of 5 MB maximum.', 'jb.err.cv_too_big': 'The CV is larger than 5 MB.',
        'jb.photo': 'Profile photo *', 'jb.photo.btn': 'Choose a photo', 'jb.photo.hint': 'A clear photo of your face, JPG, PNG or WEBP, 3 MB maximum.',
        'jb.gender': 'Gender', 'jb.male': 'Male', 'jb.female': 'Female', 'jb.job': 'Current profession', 'jb.job.ph': 'E.g. accountant, teacher, sales…',
        'jb.cv.btn': 'Choose my CV', 'jb.docs.btn': 'Add documents', 'jb.nofile': 'No file chosen', 'jb.files': ' files selected',
        'jb.levelhint': 'Write your level of education and diplomas directly in your CV.',
        'jb.err.gender': 'Please select your gender.', 'jb.err.profession': 'Please enter your profession.', 'jb.err.photo': 'Please add a profile photo (JPG, PNG or WEBP, 3 MB maximum).',
        'jb.err.photo_missing': 'The profile photo is required.', 'jb.err.photo_bad_type': 'Photo refused: use a JPG, PNG or WEBP image of 3 MB maximum.', 'jb.err.photo_too_big': 'The photo is larger than 3 MB.',
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
            '<article class="job-role"><div class="job-role-ico"><i class="fa-solid fa-briefcase" aria-hidden="true"></i></div><h3>' + posLabel(p) + '</h3><p>' + posDesc(p) + '</p><a href="#postuler" class="job-role-cta" data-pos="' + p.key + '">' + L('jb.role.cta', 'Postuler') + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></article>').join('');
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
        const lock = (i, v) => { steps[i].classList.toggle('locked', v); if (v) steps[i].setAttribute('inert', ''); else steps[i].removeAttribute('inert'); };
        lock(1, !d[0]); lock(2, !(d[0] && d[1])); lock(3, !(d[0] && d[1] && d[2])); lock(4, !(d[0] && d[1] && d[2]));
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
        const ph = $('f-photo').files[0];
        if (!ph) return showError(L('jb.err.photo', 'Ajoutez une photo de profil (JPG, PNG ou WEBP, 3 Mo maximum).'));
        if (!okExt(ph, ['jpg', 'jpeg', 'png', 'webp']) || ph.size > 3 * 1024 * 1024) return showError(L('jb.err.photo_bad_type', 'Photo refusée : image JPG, PNG ou WEBP de 3 Mo maximum.'));
        if (!form.querySelector('[name=gender]:checked')) return showError(L('jb.err.gender', 'Veuillez indiquer votre sexe.'));
        const req = ['lastName', 'firstName', 'age', 'profession', 'phone', 'email'];
        for (const n of req) { const el = form.elements[n]; if (!el.value.trim() || !el.checkValidity()) { el.focus(); return showError(L('jb.err.fields', 'Veuillez remplir correctement tous les champs obligatoires.')); } }
        const cv = $('f-cv').files[0];
        if (!cv) return showError(L('jb.err.cv', 'Joignez votre CV (PDF, DOC ou DOCX).'));
        const docs = Array.from($('f-docs').files);
        if (docs.length > 3) return showError(L('jb.err.docs', 'Vous pouvez joindre 3 autres documents au maximum.'));
        if (!okExt(cv, ['pdf', 'doc', 'docx']) || docs.some(f => !okExt(f, ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']))) return showError(L('jb.err.type', 'Un fichier a un format non accepté.'));
        if (cv.size > MAX || docs.some(f => f.size > MAX)) return showError(L('jb.err.size', 'Un fichier dépasse 5 Mo.'));
        if (ph.size + cv.size + docs.reduce((n, f) => n + f.size, 0) > 15 * 1024 * 1024) return showError(L('jb.err.total_too_big', 'Les fichiers dépassent 15 Mo au total. Réduisez leur taille.'));
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

    // ---- Photo et noms de fichiers ----------------------------------------------
    let photoUrl = null;
    function fileNames() {
        const set = (id, files) => { const el = $(id); if (!files.length) { el.className = 'fname'; el.textContent = L('jb.nofile', 'Aucun fichier choisi'); } else { el.className = 'fname ok'; el.textContent = files.length === 1 ? files[0].name : files.length + L('jb.files', ' fichiers sélectionnés'); } };
        set('cv-name', Array.from($('f-cv').files)); set('docs-name', Array.from($('f-docs').files));
    }
    $('f-cv').addEventListener('change', fileNames); $('f-docs').addEventListener('change', fileNames);
    $('f-photo').addEventListener('change', () => {
        const f = $('f-photo').files[0], c = $('photo-circle');
        if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
        if (f && /^image\//.test(f.type)) { photoUrl = URL.createObjectURL(f); c.style.backgroundImage = 'url(' + photoUrl + ')'; c.classList.add('has'); }
        else { c.style.backgroundImage = ''; c.classList.remove('has'); }
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

    document.addEventListener('langchange', () => { if (!DATA) return; renderRoles(); renderCountries(); renderProvince(); renderPositions(); fileNames(); });
    if (window.I18N) I18N.extend({ 'jb.role.cta': 'Apply' });
})();
