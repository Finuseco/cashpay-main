/* Recruitment uses its own API. Existing site/contact interactions are untouched. */
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('application-form');
    if (!form) return;
    const fieldIds = {
        countryCode: 'job-country', provinceId: 'job-province', positionId: 'job-position',
        lastName: 'app-last-name', postName: 'app-post-name', firstName: 'app-first-name',
        email: 'app-email', phone: 'app-phone', age: 'app-age', message: 'app-message',
        cv: 'app-cv', documents: 'app-documents', consent: 'app-consent'
    };
    const errorIds = { countryCode: 'country-error', provinceId: 'province-error', positionId: 'position-error' };
    const get = id => document.getElementById(id);
    const t = (key, fallback) => window.I18N ? I18N.t(key, fallback) : fallback;
    const english = () => window.I18N && I18N.lang === 'en';
    const localized = (item, key) => english() && item[key + 'En'] ? item[key + 'En'] : item[key];
    const controls = name => get(fieldIds[name]);
    const selected = () => {
        const country = catalog && catalog.countries.find(item => item.code === controls('countryCode').value);
        const province = country && country.provinces.find(item => item.id === controls('provinceId').value);
        const position = catalog && catalog.positions.find(item => item.id === controls('positionId').value);
        return { country, province, position };
    };
    let catalog = null;
    let busy = false;
    let attempted = false;
    let idempotencyKey = '';
    let lastResult = null;

    function newKey() {
        if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        if (!window.crypto || typeof crypto.getRandomValues !== 'function') return '';
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
        const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }
    idempotencyKey = newKey();

    function option(value, label) {
        const element = document.createElement('option');
        element.value = value; element.textContent = label; return element;
    }
    function setOptions(select, items, value, label, placeholder) {
        const chosen = select.value;
        const fragment = document.createDocumentFragment();
        fragment.append(option('', placeholder));
        for (const item of items) fragment.append(option(value(item), label(item)));
        select.replaceChildren(fragment);
        if (items.some(item => value(item) === chosen)) select.value = chosen;
    }
    function countryLabel(country) {
        return localized(country, 'name') + (country.available ? '' : ' — ' + t('jobs.country.coming', 'Ouverture à venir'));
    }
    function renderSelections() {
        if (!catalog) return;
        const countrySelect = controls('countryCode');
        setOptions(countrySelect, catalog.countries, item => item.code, countryLabel, t('jobs.country.placeholder', 'Sélectionnez un pays'));
        countrySelect.disabled = busy;
        const country = selected().country;
        const available = country && country.available === true;
        setOptions(controls('provinceId'), available ? country.provinces : [], item => item.id, item => localized(item, 'name'), available ? t('jobs.province.choose', 'Sélectionnez une province') : t('jobs.province.placeholder', 'Sélectionnez d’abord le pays'));
        controls('provinceId').disabled = busy || !available;
        const province = selected().province;
        setOptions(controls('positionId'), available && province ? catalog.positions : [], item => item.id, item => localized(item, 'title'), province ? t('jobs.position.choose', 'Sélectionnez un poste') : t('jobs.position.placeholder', 'Sélectionnez d’abord la province'));
        controls('positionId').disabled = busy || !available || !province;
        renderSelectionStatus();
        renderPosition();
        updateSubmit();
    }
    function renderSelectionStatus() {
        const { country, province, position } = selected();
        const active = !country || !country.available ? 0 : !province ? 1 : 2;
        ['step-country', 'step-province', 'step-position'].forEach((id, index) => {
            const item = get(id);
            if (index === active) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
            item.classList.toggle('is-complete', index < active || (index === 2 && Boolean(position)));
        });
        const status = get('location-status');
        status.classList.toggle('is-unavailable', Boolean(country && !country.available));
        status.textContent = !country ? '' : !country.available
            ? t('jobs.country.unavailable', 'Le recrutement n’est pas encore ouvert dans ce pays. Les candidatures sont actuellement acceptées en RDC.')
            : !province ? t('jobs.location.choose', 'Choisissez votre province pour découvrir les postes proposés.')
            : !position ? t('jobs.location.positions', 'Sélectionnez un poste pour consulter ses missions.') : '';
    }
    function renderPosition() {
        const { country, province, position } = selected();
        const missions = get('position-missions');
        missions.replaceChildren();
        get('position-department').textContent = position ? localized(position, 'department') : t('jobs.profile.tag', 'LE PROFIL RECHERCHÉ');
        get('position-card-title').textContent = position ? localized(position, 'title') : t('jobs.profile.empty.title', 'À vous de choisir.');
        get('position-description').textContent = position ? localized(position, 'description') : t('jobs.profile.empty.text', 'Sélectionnez un pays, une province et un poste pour découvrir les missions correspondantes.');
        if (position) {
            const lines = english() && Array.isArray(position.missionsEn) ? position.missionsEn : position.missions;
            for (const line of Array.isArray(lines) ? lines : []) {
                const item = document.createElement('li'); item.textContent = line; missions.append(item);
            }
        }
        missions.hidden = !position || !missions.childElementCount;
        get('position-location').hidden = !(country && province && position);
        get('position-location').querySelector('span').textContent = country && province ? localized(province, 'name') + ' · ' + localized(country, 'name') : '';
    }
    function updateSubmit() {
        const { country, province, position } = selected();
        const button = get('application-submit');
        button.disabled = busy || !country || !country.available || !province || !position;
        button.querySelector('span').textContent = busy ? t('jobs.submitting', 'Envoi de votre candidature…') : t('jobs.submit', 'Envoyer ma candidature');
        button.querySelector('i').className = busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right';
    }
    function errorElement(name) { return get(errorIds[name] || name + '-error'); }
    function clearError(name) {
        const field = controls(name), error = errorElement(name);
        if (field) field.removeAttribute('aria-invalid');
        if (error) { error.hidden = true; error.textContent = ''; }
    }
    function clearErrors() {
        Object.keys(fieldIds).forEach(clearError);
        get('form-error-summary').hidden = true;
        get('form-errors').replaceChildren();
        get('form-error-message').textContent = '';
    }
    function labelFor(name) {
        const field = controls(name);
        const label = field && form.querySelector('label[for="' + field.id + '"]');
        return label ? label.textContent.replace('*', '').trim() : name;
    }
    function showErrors(errors, message) {
        get('form-error-message').textContent = message || t('jobs.error.fix', 'Merci de vérifier les champs indiqués avant l’envoi.');
        const list = get('form-errors'); list.replaceChildren();
        for (const [name, detail] of Object.entries(errors)) {
            const field = controls(name), error = errorElement(name);
            if (!field || !error) continue;
            field.setAttribute('aria-invalid', 'true'); error.textContent = detail; error.hidden = false;
            const item = document.createElement('li'), link = document.createElement('a');
            link.href = '#' + field.id; link.textContent = labelFor(name) + ' : ' + detail;
            link.addEventListener('click', event => { event.preventDefault(); field.focus(); field.scrollIntoView({ block: 'center', behavior: 'auto' }); });
            item.append(link); list.append(item);
        }
        get('form-error-summary').hidden = false;
        get('form-error-summary').focus();
    }
    function fileSelection() {
        const cv = controls('cv').files[0];
        get('cv-selection').textContent = cv ? cv.name + ' · ' + (cv.size / 1048576).toFixed(2) + ' Mio' : '';
        const docs = Array.from(controls('documents').files);
        get('documents-selection').textContent = docs.length ? docs.length + ' ' + t('jobs.files.count', 'document(s) sélectionné(s)') + ' : ' + docs.map(file => file.name).join(', ') : '';
    }
    async function validate() {
        const errors = {};
        const required = t('jobs.error.required', 'Merci de renseigner ce champ.');
        const { country, province, position } = selected();
        if (!country || !country.available) errors.countryCode = t('jobs.error.selection', 'Choisissez un pays, une province et un poste disponibles.');
        if (!province) errors.provinceId = required;
        if (!position) errors.positionId = required;
        for (const name of ['lastName', 'firstName', 'email', 'phone']) if (!controls(name).value.trim()) errors[name] = required;
        const email = controls('email').value.trim();
        if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = t('jobs.error.email', 'Indiquez une adresse e-mail valide.');
        if (controls('phone').value.trim() && !/^\+?[\d\s().-]{6,40}$/.test(controls('phone').value.trim())) errors.phone = t('jobs.error.phone', 'Indiquez un numéro de téléphone avec son indicatif.');
        const age = controls('age').value;
        if (age && (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 120)) errors.age = t('jobs.error.age', 'Indiquez un nombre entier entre 1 et 120, ou laissez ce champ vide.');
        const message = controls('message').value.trim();
        if (message.length < 10 || message.length > 5000) errors.message = t('jobs.error.message', 'Votre message doit contenir de 10 à 5 000 caractères.');
        if (!controls('consent').checked) errors.consent = t('jobs.error.consent', 'Votre accord est nécessaire pour utiliser ces informations dans le cadre du recrutement.');
        const cv = Array.from(controls('cv').files), documents = Array.from(controls('documents').files);
        if (!cv.length) errors.cv = t('jobs.error.cv', 'Ajoutez votre CV au format PDF.');
        if (documents.length > 3) errors.documents = t('jobs.error.fileCount', 'Vous pouvez ajouter au maximum 3 documents complémentaires.');
        if ([...cv, ...documents].reduce((total, file) => total + file.size, 0) > 15 * 1048576) errors.documents = t('jobs.error.totalSize', 'L’ensemble du dossier ne doit pas dépasser 15 Mio.');
        for (const [name, files] of [['cv', cv], ['documents', documents]]) {
            for (const file of files) {
                if (file.size > 5 * 1048576) { errors[name] = t('jobs.error.fileSize', 'Chaque fichier doit faire 5 Mio ou moins.'); break; }
                if (!/\.pdf$/i.test(file.name) || file.size < 5) { errors[name] = t('jobs.error.pdf', 'Seuls les fichiers PDF sont acceptés.'); break; }
                try { if (await file.slice(0, 5).text() !== '%PDF-') { errors[name] = t('jobs.error.pdf', 'Seuls les fichiers PDF sont acceptés.'); break; } }
                catch (_) { errors[name] = t('jobs.error.pdf', 'Seuls les fichiers PDF sont acceptés.'); break; }
            }
        }
        return errors;
    }
    function setBusy(value) {
        busy = value; form.setAttribute('aria-busy', String(value));
        form.querySelectorAll('input,select,textarea').forEach(field => {
            if (value && !field.disabled) { field.dataset.requestDisabled = 'true'; field.disabled = true; }
            else if (!value && field.dataset.requestDisabled) { delete field.dataset.requestDisabled; field.disabled = false; }
        });
        get('submission-status').textContent = value ? t('jobs.submitting', 'Envoi de votre candidature…') : '';
        updateSubmit();
    }
    function serverMessage(error) {
        if (error.status === 503) return t('jobs.error.unavailable', 'Le service de candidature n’est pas encore disponible. Votre formulaire est conservé sur cette page ; réessayez plus tard.');
        if (error.status === 429) return t('jobs.error.limit', 'Trop de tentatives ont été effectuées. Merci de patienter avant de réessayer.');
        return error.message || t('jobs.error.generic', 'La candidature n’a pas pu être envoyée. Vérifiez vos informations puis réessayez.');
    }
    function serverFields(value) {
        if (!value || typeof value !== 'object') return {};
        const errors = {};
        for (const [name, detail] of Object.entries(value)) if (fieldIds[name]) errors[name] = typeof detail === 'string' ? detail : detail && typeof detail.message === 'string' ? detail.message : t('jobs.error.required', 'Merci de vérifier ce champ.');
        return errors;
    }
    function renderResult() {
        if (!lastResult) return;
        get('result-reference').textContent = lastResult.reference;
        get('result-message').textContent = lastResult.emailStatus === 'sent'
            ? t('jobs.result.sent', 'Votre candidature a été enregistrée et l’e-mail de recrutement a été envoyé à notre équipe.')
            : t('jobs.result.pending', 'Votre candidature a été enregistrée. La notification par e-mail à notre équipe est en attente ; vos documents ont bien été reçus.');
    }
    function updateAria() {
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            if (!element.dataset.frAria) element.dataset.frAria = element.getAttribute('aria-label') || '';
            element.setAttribute('aria-label', t(element.dataset.i18nAria, element.dataset.frAria));
        });
    }
    async function loadCatalog() {
        get('catalog-error').hidden = true; get('catalog-status').hidden = false;
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await fetch('recruitment/catalog.json', { headers: { Accept: 'application/json' }, cache: 'no-cache', signal: controller.signal });
            if (!response.ok) throw new Error('catalog');
            const data = await response.json();
            const value = data.data || data;
            if (!Array.isArray(value.countries) || !Array.isArray(value.positions) || !value.countries.some(item => item.code === 'CD' && item.available && Array.isArray(item.provinces))) throw new Error('catalog');
            catalog = value; renderSelections();
        } catch (_) {
            get('catalog-error-text').textContent = t('jobs.error.catalog', 'Impossible de charger les postes. Vérifiez votre connexion puis réessayez.');
            get('catalog-error').hidden = false;
        } finally { clearTimeout(timeout); get('catalog-status').hidden = true; }
    }

    controls('countryCode').addEventListener('change', function () { controls('provinceId').value = ''; controls('positionId').value = ''; clearError('countryCode'); clearError('provinceId'); clearError('positionId'); renderSelections(); });
    controls('provinceId').addEventListener('change', function () { controls('positionId').value = ''; clearError('provinceId'); clearError('positionId'); renderSelections(); });
    controls('positionId').addEventListener('change', function () { clearError('positionId'); renderSelectionStatus(); renderPosition(); updateSubmit(); });
    for (const name of ['cv', 'documents']) controls(name).addEventListener('change', fileSelection);
    form.addEventListener('input', function (event) {
        if (busy) return;
        const name = event.target.name;
        if (fieldIds[name]) clearError(name);
        if (attempted) { idempotencyKey = newKey(); attempted = false; }
    });
    form.addEventListener('change', function () { if (!busy && attempted) { idempotencyKey = newKey(); attempted = false; } });
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); if (busy) return;
        clearErrors();
        const payload = new FormData(form);
        setBusy(true);
        const errors = await validate();
        if (Object.keys(errors).length) { setBusy(false); showErrors(errors); return; }
        if (!idempotencyKey) { setBusy(false); showErrors({}, t('jobs.error.key', 'Votre navigateur ne peut pas préparer une candidature sécurisée. Utilisez un navigateur récent.')); return; }
        payload.set('idempotencyKey', idempotencyKey);
        payload.set('consent', 'true');
        // Browsers can include an empty File for an unselected optional input.
        payload.delete('documents');
        for (const file of controls('documents').files) payload.append('documents', file, file.name);
        attempted = true;
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 45000);
        try {
            const response = await fetch('/api/recruitment/applications', { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin', body: payload, signal: controller.signal });
            let result;
            try { result = await response.json(); } catch (_) { throw new Error(t('jobs.error.response', 'La réception de votre dossier n’a pas pu être confirmée. Conservez cette page et réessayez.')); }
            if (!response.ok) throw Object.assign(new Error(result.error && result.error.message || ''), { status: response.status, fields: result.error && result.error.fields });
            if (![200, 201, 202].includes(response.status) || !result.data || typeof result.data.reference !== 'string' || !['sent', 'pending'].includes(result.data.emailStatus)) throw new Error(t('jobs.error.response', 'La réception de votre dossier n’a pas pu être confirmée. Conservez cette page et réessayez.'));
            lastResult = result.data; renderResult(); form.hidden = true; get('application-result').hidden = false; get('application-result').focus();
        } catch (error) {
            const description = error.name === 'AbortError' || error instanceof TypeError ? t('jobs.error.network', 'Le service est injoignable. Votre formulaire est conservé sur cette page. Vérifiez votre connexion puis réessayez.') : serverMessage(error);
            setBusy(false); showErrors(serverFields(error.fields), description);
        } finally { clearTimeout(timeout); setBusy(false); }
    });
    get('new-application').addEventListener('click', function () {
        form.reset(); lastResult = null; attempted = false; idempotencyKey = newKey();
        get('application-result').hidden = true; form.hidden = false; clearErrors(); fileSelection(); renderSelections(); controls('countryCode').focus();
    });
    get('catalog-retry').addEventListener('click', loadCatalog);
    document.addEventListener('langchange', function () {
        updateAria(); renderSelections(); fileSelection(); renderResult();
        if (!get('catalog-error').hidden) get('catalog-error-text').textContent = t('jobs.error.catalog', 'Impossible de charger les postes. Vérifiez votre connexion puis réessayez.');
    });
    updateAria(); loadCatalog();
});
