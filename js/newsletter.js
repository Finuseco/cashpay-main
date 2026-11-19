/* Public newsletter forms. Delivery, consent records and tokens belong to the Web API. */
(function () {
    'use strict';
    if (window.CashPayNewsletter) return;
    const API = (window.CASHPAY && window.CASHPAY.MAIN_API) || 'https://app.cashpay-all.com/api/main';
    const CLOSED_KEY = 'cashpay-newsletter-closed';
    const SUBSCRIBED_KEY = 'cashpay-newsletter-subscribed';
    const WEEK = 7 * 86400000;
    const words = {
        fr: {
            title: 'Un temps d’avance avec CashPay', description: 'Recevez nos actualités, nos conseils et les nouveautés de notre écosystème.',
            email: 'Votre adresse e-mail', placeholder: 'vous@exemple.com', consent: 'J’accepte de recevoir la newsletter CashPay All par e-mail.',
            privacy: 'Votre adresse sert uniquement à notre newsletter. Confirmez votre inscription par e-mail. Vous pourrez vous désinscrire à tout moment depuis chaque message.',
            subscribe: 'M’inscrire', later: 'Plus tard', close: 'Fermer la newsletter', sending: 'Envoi en cours…',
            pending: 'Consultez votre boîte mail pour confirmer votre inscription. Pensez aussi aux courriers indésirables.',
            error: 'L’inscription n’a pas pu aboutir. Réessayez dans un instant.', limited: 'Trop de demandes. Patientez quelques minutes avant de réessayer.',
            invalid: 'Renseignez une adresse e-mail valide et acceptez de recevoir la newsletter.',
            confirmTitle: 'Confirmez votre inscription', confirmDescription: 'Un dernier clic pour recevoir les nouvelles de CashPay All.', confirm: 'Confirmer mon inscription',
            confirmed: 'Votre inscription est confirmée. Bienvenue dans la newsletter CashPay All !',
            unsubscribeTitle: 'Gérer votre abonnement', unsubscribeDescription: 'Vous pouvez arrêter de recevoir la newsletter CashPay All avec le bouton ci-dessous.', unsubscribe: 'Me désinscrire',
            unsubscribed: 'Votre désinscription est confirmée. Vous ne recevrez plus notre newsletter.',
            tokenError: 'Ce lien est invalide ou a expiré. Vous pouvez demander une nouvelle inscription ci-dessous.',
            actionError: 'Cette action n’a pas pu aboutir. Réessayez ou contactez-nous.',
            pageTitle: 'La newsletter CashPay All', pageDescription: 'Les nouveautés de nos services, nos guides et les actualités de CashPay All, dans votre boîte mail.',
            newSubscription: 'S’inscrire à la newsletter', help: 'Une question ? Contactez-nous.'
        },
        en: {
            title: 'Stay one step ahead with CashPay', description: 'Receive our news, practical tips and the latest from our ecosystem.',
            email: 'Your email address', placeholder: 'you@example.com', consent: 'I agree to receive the CashPay All newsletter by email.',
            privacy: 'We use your address only for our newsletter. Confirm your subscription by email. You can unsubscribe at any time from any message.',
            subscribe: 'Subscribe', later: 'Maybe later', close: 'Close newsletter', sending: 'Sending…',
            pending: 'Check your inbox to confirm your subscription. Please check your spam folder too.',
            error: 'We couldn’t complete your subscription. Please try again shortly.', limited: 'Too many requests. Please wait a few minutes before trying again.',
            invalid: 'Enter a valid email address and agree to receive the newsletter.',
            confirmTitle: 'Confirm your subscription', confirmDescription: 'One final click to receive news from CashPay All.', confirm: 'Confirm my subscription',
            confirmed: 'Your subscription is confirmed. Welcome to the CashPay All newsletter!',
            unsubscribeTitle: 'Manage your subscription', unsubscribeDescription: 'Use the button below to stop receiving the CashPay All newsletter.', unsubscribe: 'Unsubscribe',
            unsubscribed: 'You have unsubscribed. You will no longer receive our newsletter.',
            tokenError: 'This link is invalid or has expired. You can request a new subscription below.',
            actionError: 'We couldn’t complete this action. Please try again or contact us.',
            pageTitle: 'The CashPay All newsletter', pageDescription: 'New services, practical guides and CashPay All news, delivered to your inbox.',
            newSubscription: 'Subscribe to the newsletter', help: 'Need help? Contact us.'
        }
    };
    const language = () => document.documentElement.lang === 'en' ? 'en' : 'fr';
    const t = key => words[language()][key] || key;
    let modal, previousFocus, savedOverflow = '', automaticTimer;
    const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
    const remove = key => { try { localStorage.removeItem(key); } catch (_) {} };

    function translate(root) {
        (root || document).querySelectorAll('[data-nl]').forEach(el => { el.textContent = t(el.dataset.nl); });
        (root || document).querySelectorAll('[data-nl-placeholder]').forEach(el => { el.placeholder = t(el.dataset.nlPlaceholder); });
        (root || document).querySelectorAll('[data-nl-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.nlLabel)); });
    }
    function formHTML(prefix) {
        return `<form class="newsletter-form" data-newsletter-form novalidate>
            <label for="${prefix}-email" data-nl="email"></label>
            <input type="email" id="${prefix}-email" name="email" autocomplete="email" inputmode="email" maxlength="254" data-nl-placeholder="placeholder" required>
            <div class="newsletter-honeypot" aria-hidden="true"><label for="${prefix}-website">Website</label><input type="text" id="${prefix}-website" name="website" tabindex="-1" autocomplete="off"></div>
            <label class="newsletter-consent" for="${prefix}-consent"><input type="checkbox" id="${prefix}-consent" name="consent" required><span data-nl="consent"></span></label>
            <button type="submit" class="btn btn-primary" data-nl="subscribe"></button>
            <p class="newsletter-status" data-newsletter-status role="status" aria-live="polite" aria-atomic="true" hidden></p>
            <p class="newsletter-privacy" data-nl="privacy"></p>
        </form>`;
    }
    function status(node, key, error) {
        node.dataset.nl = key;
        node.textContent = t(key);
        node.hidden = false;
        node.classList.toggle('is-error', !!error);
    }
    async function post(path, body) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(API + path, {
                method: 'POST', mode: 'cors', credentials: 'omit',
                headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.ok !== true) {
                const failure = new Error('request_failed');
                failure.status = response.status;
                throw failure;
            }
            return data;
        } finally { clearTimeout(timer); }
    }
    function bindForm(form) {
        const startedAt = Date.now();
        const button = form.querySelector('button[type="submit"]');
        const message = form.querySelector('[data-newsletter-status]');
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (button.disabled) return;
            const email = form.elements.email;
            email.value = email.value.trim();
            if (!email.checkValidity() || !form.elements.consent.checked) {
                status(message, 'invalid', true);
                (!email.checkValidity() ? email : form.elements.consent).focus();
                return;
            }
            button.disabled = true; button.dataset.nl = 'sending'; button.textContent = t('sending');
            message.hidden = true;
            try {
                await post('/newsletter/subscribe', { email: email.value, language: language(), consent: true, website: form.elements.website.value, startedAt });
                status(message, 'pending', false);
                form.reset();
                write(CLOSED_KEY, String(Date.now()));
            } catch (error) {
                status(message, error.status === 429 ? 'limited' : 'error', true);
            } finally {
                button.disabled = false; button.dataset.nl = 'subscribe'; button.textContent = t('subscribe');
            }
        });
    }
    function open(trigger) {
        if (!modal || !modal.hidden) return;
        clearTimeout(automaticTimer);
        previousFocus = trigger && trigger.focus ? trigger : document.activeElement;
        savedOverflow = document.body.style.overflow;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        translate(modal);
        modal.querySelector('input[type="email"]').focus();
    }
    function close() {
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        document.body.style.overflow = savedOverflow;
        write(CLOSED_KEY, String(Date.now()));
        if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus();
    }
    function createModal() {
        const holder = document.createElement('div');
        holder.innerHTML = `<div class="newsletter-modal" id="newsletter-modal" role="dialog" aria-modal="true" aria-labelledby="newsletter-modal-title" aria-describedby="newsletter-modal-description" hidden>
            <div class="newsletter-card"><button type="button" class="newsletter-close" data-newsletter-close data-nl-label="close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            <span class="newsletter-symbol" aria-hidden="true"><i class="fa-regular fa-envelope"></i></span><span class="newsletter-eyebrow">CASHPAY ALL · NEWSLETTER</span>
            <h2 id="newsletter-modal-title" data-nl="title"></h2><p id="newsletter-modal-description" data-nl="description"></p>
            ${formHTML('newsletter-popup')}<button type="button" class="newsletter-later" data-newsletter-close data-nl="later"></button></div></div>`;
        modal = holder.firstElementChild;
        document.body.appendChild(modal);
        bindForm(modal.querySelector('form'));
        modal.addEventListener('click', event => {
            if (event.target === modal || event.target.closest('[data-newsletter-close]')) close();
        });
        document.addEventListener('keydown', event => {
            if (modal.hidden) return;
            if (event.key === 'Escape') { event.preventDefault(); close(); return; }
            if (event.key !== 'Tab') return;
            const items = [...modal.querySelectorAll('button:not([disabled]), input:not([tabindex="-1"]):not([disabled]), a[href]')].filter(el => !el.hidden);
            const first = items[0], last = items[items.length - 1];
            if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
        document.addEventListener('focusin', event => {
            if (!modal.hidden && !modal.contains(event.target)) modal.querySelector('input[type="email"]').focus();
        });
    }
    function renderPage() {
        const root = document.querySelector('[data-newsletter-page]');
        if (!root) return;
        root.innerHTML = `<div class="newsletter-page-card"><span class="newsletter-symbol" aria-hidden="true"><i class="fa-regular fa-envelope"></i></span><div data-newsletter-action hidden><h2 data-newsletter-action-title></h2><p data-newsletter-action-description></p><button type="button" class="btn btn-primary" data-newsletter-action-button></button><p class="newsletter-status" data-newsletter-action-status role="status" aria-live="polite" aria-atomic="true" hidden></p><hr></div><h2 data-nl="newSubscription"></h2>${formHTML('newsletter-page')}<a href="contact.html" class="newsletter-help" data-nl="help"></a></div>`;
        bindForm(root.querySelector('form'));
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action !== 'confirm' && action !== 'unsubscribe') return;
        let fragmentToken = '';
        try { fragmentToken = decodeURIComponent(window.location.hash.slice(1)); } catch (_) {}
        const token = fragmentToken || params.get('token') || '';
        // Keep bearer tokens out of the visible URL once the page has read them.
        const privateURL = new URL(window.location.href); privateURL.searchParams.delete('token'); privateURL.hash = '';
        window.history.replaceState(null, '', privateURL.pathname + privateURL.search);
        const block = root.querySelector('[data-newsletter-action]');
        const button = block.querySelector('button');
        const message = block.querySelector('[data-newsletter-action-status]');
        block.hidden = false;
        block.querySelector('[data-newsletter-action-title]').dataset.nl = action + 'Title';
        block.querySelector('[data-newsletter-action-description]').dataset.nl = action + 'Description';
        button.dataset.nl = action;
        if (token.length < 20 || token.length > 2048 || /\s/.test(token)) { button.hidden = true; status(message, 'tokenError', true); return; }
        button.addEventListener('click', async () => {
            if (button.disabled) return;
            button.disabled = true;
            button.dataset.nl = 'sending'; button.textContent = t('sending');
            try {
                await post('/newsletter/' + action, { token });
                status(message, action === 'confirm' ? 'confirmed' : 'unsubscribed', false);
                if (action === 'confirm') write(SUBSCRIBED_KEY, '1'); else remove(SUBSCRIBED_KEY);
                write(CLOSED_KEY, String(Date.now()));
                button.hidden = true;
                const clean = new URL(window.location.href); clean.searchParams.delete('token'); clean.searchParams.delete('action');
                window.history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
            } catch (error) {
                status(message, [400, 404, 410].includes(error.status) ? 'tokenError' : 'actionError', true);
                button.disabled = false; button.dataset.nl = action; button.textContent = t(action);
            }
        });
    }
    function init() {
        createModal(); renderPage(); translate();
        document.addEventListener('click', event => {
            const trigger = event.target.closest('[data-newsletter-open]');
            if (trigger) { event.preventDefault(); open(trigger); }
        });
        document.addEventListener('langchange', () => translate());
        const recentlyClosed = Date.now() - Number(read(CLOSED_KEY) || 0) < WEEK;
        if (!read(SUBSCRIBED_KEY) && !recentlyClosed && !document.querySelector('[data-newsletter-page]')) {
            automaticTimer = setTimeout(() => {
                if (!document.hidden && !document.querySelector('[aria-modal="true"]:not([hidden])')) open();
            }, 6000);
        }
    }
    window.CashPayNewsletter = { open, close };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
