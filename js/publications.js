/* Published content is read from the CashPay Web API. Static service guides stay separate. */
(function () {
    'use strict';
    const API = (window.CASHPAY && window.CASHPAY.MAIN_API) || 'https://app.cashpay-all.com/api/main';
    const TYPES = ['article', 'communique', 'advertisement'];
    const words = {
        fr: {
            eyebrow: 'LE JOURNAL CASHPAY ALL', catalogPageTitle: 'Articles et actualités — CashPay All', catalogTitle: 'Articles et actualités',
            catalogDescription: 'Retrouvez les nouveautés, les communiqués et les publications de CashPay All.',
            latestTitle: 'À la une chez CashPay All', latestDescription: 'La publication la plus récente de notre écosystème.',
            viewAll: 'Voir tous les articles', filterLabel: 'Type de publication', allKinds: 'Tous les types',
            article: 'Articles', communique: 'Communiqués', advertisement: 'Publicités',
            'badge.article': 'Article', 'badge.communique': 'Communiqué', 'badge.advertisement': 'Publicité',
            searchLabel: 'Rechercher', search: 'Rechercher', previous: 'Précédent', next: 'Suivant', loading: 'Chargement…',
            empty: 'Aucune publication pour le moment. Découvrez nos guides ci-dessous.',
            noResults: 'Aucune publication ne correspond à votre recherche.', latestEmpty: 'Nos prochaines publications seront à retrouver ici.',
            error: 'Les publications ne sont pas disponibles pour le moment. Réessayez dans un instant.', retry: 'Réessayer',
            latestError: 'La dernière publication est momentanément indisponible. Retrouvez nos articles sur leur page dédiée.',
            read: 'Lire la suite', guideRead: 'Consulter le guide', guide: 'Guide de service',
            guideEyebrow: 'DÉCOUVRIR NOS SERVICES', guideTitle: 'Guides du financement et du commerce',
            guideDescription: 'Des repères sur nos solutions pour les entreprises, à consulter à tout moment.',
            'guide.pme.title': 'Financement des PME', 'guide.pme.excerpt': 'Découvrez notre accompagnement des petites et moyennes entreprises et le remboursement automatisé.',
            'guide.delivery.title': 'Livraisons et paiements en ligne', 'guide.delivery.excerpt': 'Paiements, commandes et livraison : découvrez les solutions de notre réseau de commerce.',
            'guide.startup.title': 'Financement des startups', 'guide.startup.excerpt': 'Découvrez le financement des jeunes entreprises et comment présenter votre projet.',
            home: 'Accueil', backToCatalog: 'Tous les articles', subscribe: 'S’inscrire à la newsletter',
            notFound: 'Cette publication n’est pas disponible.', detailError: 'La publication n’a pas pu être chargée. Réessayez dans un instant.',
            page: 'Page', of: 'sur', results: 'publication(s)'
        },
        en: {
            eyebrow: 'THE CASHPAY ALL JOURNAL', catalogPageTitle: 'Articles & news — CashPay All', catalogTitle: 'Articles & news',
            catalogDescription: 'Explore the latest news, announcements and publications from CashPay All.',
            latestTitle: 'The latest from CashPay All', latestDescription: 'The most recent publication from our ecosystem.',
            viewAll: 'View all articles', filterLabel: 'Publication type', allKinds: 'All types',
            article: 'Articles', communique: 'Announcements', advertisement: 'Advertisements',
            'badge.article': 'Article', 'badge.communique': 'Announcement', 'badge.advertisement': 'Advertisement',
            searchLabel: 'Search', search: 'Search', previous: 'Previous', next: 'Next', loading: 'Loading…',
            empty: 'There are no publications yet. Explore our guides below.', noResults: 'No publications match your search.',
            latestEmpty: 'Our next publications will appear here.', error: 'Publications are currently unavailable. Please try again shortly.', retry: 'Try again',
            latestError: 'The latest publication is currently unavailable. Visit the articles page to explore our publications.',
            read: 'Read more', guideRead: 'Read the guide', guide: 'Service guide',
            guideEyebrow: 'EXPLORE OUR SERVICES', guideTitle: 'Financing & business guides',
            guideDescription: 'Learn about our solutions for businesses, available to read at any time.',
            'guide.pme.title': 'SME financing', 'guide.pme.excerpt': 'Explore our support for small and medium businesses and automated repayments.',
            'guide.delivery.title': 'Online deliveries & payments', 'guide.delivery.excerpt': 'Payments, orders and delivery: discover the solutions in our business network.',
            'guide.startup.title': 'Startup financing', 'guide.startup.excerpt': 'Discover financing for young businesses and how to submit your project.',
            home: 'Home', backToCatalog: 'All articles', subscribe: 'Subscribe to the newsletter',
            notFound: 'This publication is not available.', detailError: 'We couldn’t load this publication. Please try again shortly.',
            page: 'Page', of: 'of', results: 'publication(s)'
        }
    };
    const lang = () => document.documentElement.lang === 'en' ? 'en' : 'fr';
    const t = key => words[lang()][key] || key;
    const element = (tag, className, content) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined) node.textContent = String(content);
        return node;
    };
    function translated(tag, key, className) {
        const node = element(tag, className, t(key)); node.dataset.pub = key; return node;
    }
    function translate() {
        document.querySelectorAll('[data-pub]').forEach(node => { node.textContent = t(node.dataset.pub); });
        document.querySelectorAll('time[data-date]').forEach(node => { node.textContent = dateText(node.dataset.date); });
    }
    function dateText(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat(lang() === 'en' ? 'en-GB' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    }
    function safeURL(value, allowMail) {
        if (typeof value !== 'string' || !value.trim()) return '';
        try {
            const parsed = new URL(value, window.location.href);
            if (parsed.username || parsed.password) return '';
            if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.origin === window.location.origin) || (allowMail && ['mailto:', 'tel:'].includes(parsed.protocol))) return parsed.href;
        } catch (_) {}
        return '';
    }
    function sanitizedHTML(html) {
        const source = document.createElement('template'); source.innerHTML = String(html || '');
        const result = document.createDocumentFragment();
        const allowed = new Set(['P','BR','H1','H2','H3','H4','H5','H6','STRONG','B','EM','I','U','S','UL','OL','LI','BLOCKQUOTE','PRE','CODE','A','IMG','FIGURE','FIGCAPTION','HR','DIV','SPAN','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD','VIDEO','SOURCE','IFRAME']);
        const discard = new Set(['SCRIPT','STYLE','SVG','MATH','OBJECT','EMBED','FORM','INPUT','BUTTON','TEXTAREA','SELECT','LINK','META','BASE','TEMPLATE']);
        function copyChildren(from, to) {
            from.childNodes.forEach(child => {
                if (child.nodeType === 3) { to.appendChild(document.createTextNode(child.textContent)); return; }
                if (child.nodeType !== 1 || discard.has(child.tagName)) return;
                if (!allowed.has(child.tagName)) { copyChildren(child, to); return; }
                const tag = child.tagName;
                const node = document.createElement(tag.toLowerCase());
                // Preserve only the editor's text formatting; never copy arbitrary CSS.
                const styles = [];
                String(child.getAttribute('style') || '').split(';').forEach(declaration => {
                    const colon = declaration.indexOf(':'); if (colon < 0) return;
                    const key = declaration.slice(0,colon).trim().toLowerCase(), value = declaration.slice(colon + 1).trim().toLowerCase();
                    if ((key === 'text-align' && /^(left|center|right|justify)$/.test(value)) || (key === 'font-weight' && /^(normal|bold|[1-9]00)$/.test(value)) || (key === 'font-style' && /^(normal|italic)$/.test(value)) || (key === 'text-decoration' && /^(underline|line-through|none)$/.test(value)) || (key === 'font-size' && /^(1[0-9]|[2-6][0-9]|7[0-2])px$/.test(value)) || (['color','background-color'].includes(key) && /^(#[\da-f]{3}|#[\da-f]{6}|black|white|red|green|blue|gray|orange|purple)$/.test(value))) styles.push(key + ':' + value);
                });
                if (styles.length) node.setAttribute('style', styles.join(';'));

                if (tag === 'A') {
                    const url = safeURL(child.getAttribute('href'), true);
                    if (url) node.href = url;
                    if (url && new URL(url, window.location.href).origin !== window.location.origin) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
                }
                if (['IMG','VIDEO','SOURCE','IFRAME'].includes(tag)) {
                    const src = safeURL(child.getAttribute('src'));
                    if (tag === 'IFRAME') {
                        if (!src) return;
                        const parsed = new URL(src);
                        const isYoutube = ['www.youtube.com','www.youtube-nocookie.com','youtube.com','youtube-nocookie.com'].includes(parsed.hostname) && /^\/embed\/[a-zA-Z0-9_-]+$/.test(parsed.pathname);
                        let isFacebook = false;
                        if (parsed.hostname === 'www.facebook.com' && parsed.pathname === '/plugins/video.php') {
                            try { const video = new URL(parsed.searchParams.get('href')); isFacebook = video.protocol === 'https:' && ['facebook.com','www.facebook.com'].includes(video.hostname) && !video.username && !video.password; } catch (_) {}
                        }
                        if (!isYoutube && !isFacebook) return;
                        node.setAttribute('title', child.getAttribute('title') || 'Vidéo / Video');
                        node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
                        node.setAttribute('allow', 'fullscreen; picture-in-picture'); node.setAttribute('allowfullscreen', ''); node.loading = 'lazy';
                        node.referrerPolicy = 'strict-origin-when-cross-origin';
                    }
                    if (tag === 'IMG') {
                        if (!src) return;
                        node.alt = child.getAttribute('alt') || ''; node.loading = 'lazy'; node.decoding = 'async';
                    }
                    if (src) node.src = src;
                    if (tag === 'VIDEO') {
                        node.controls = true; node.preload = 'metadata';
                        const poster = safeURL(child.getAttribute('poster')); if (poster) node.poster = poster;
                    }
                    if (tag === 'SOURCE') {
                        if (!src || !['video/mp4','video/webm','video/ogg'].includes(child.getAttribute('type'))) return;
                        node.type = child.getAttribute('type');
                    }
                }
                if (['TD','TH'].includes(tag)) ['colspan','rowspan'].forEach(attr => {
                    const value = Number(child.getAttribute(attr)); if (Number.isInteger(value) && value > 0 && value <= 20) node.setAttribute(attr, String(value));
                });
                if (tag !== 'IFRAME') copyChildren(child, node);
                to.appendChild(node);
            });
        }
        copyChildren(source.content, result);
        return result;
    }
    function metadata(article) {
        const meta = element('div', 'publication-meta');
        const kind = TYPES.includes(article.kind) ? article.kind : 'article';
        meta.appendChild(translated('span', 'badge.' + kind, 'publication-badge publication-badge-' + kind));
        if (article.publishedAt && dateText(article.publishedAt)) {
            const time = element('time', '', dateText(article.publishedAt));
            time.dateTime = article.publishedAt; time.dataset.date = article.publishedAt; meta.appendChild(time);
        }
        return meta;
    }
    function card(article, guide) {
        const anchor = element('a', 'publication-card' + (guide ? ' publication-guide-card' : ''));
        anchor.href = guide ? article.href : 'article.html?slug=' + encodeURIComponent(article.slug || article.id);
        const url = safeURL(article.coverUrl);
        if (url) {
            const image = element('img', 'publication-card-image'); image.src = url; image.alt = article.coverAlt || ''; image.width = 1200; image.height = 800; image.loading = 'lazy'; image.decoding = 'async';
            image.addEventListener('error', () => image.remove(), { once: true }); anchor.appendChild(image);
        }
        const content = element('div', 'publication-card-content');
        content.appendChild(guide ? translated('span', 'guide', 'publication-badge') : metadata(article));
        content.appendChild(guide ? translated('h3', article.titleKey) : element('h3', '', article.title || 'CashPay All'));
        if (article.excerpt || guide) content.appendChild(guide ? translated('p', article.excerptKey) : element('p', '', article.excerpt));
        content.appendChild(translated('span', guide ? 'guideRead' : 'read', 'publication-card-link'));
        anchor.appendChild(content); return anchor;
    }
    function feedback(node, key, retry) {
        node.replaceChildren(translated('span', key));
        if (retry) {
            const button = translated('button', 'retry', 'publication-retry'); button.type = 'button'; button.addEventListener('click', retry); node.appendChild(button);
        }
    }
    async function get(path, signal) {
        const controller = new AbortController();
        const cancel = () => controller.abort();
        if (signal) { if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true }); }
        const timer = setTimeout(cancel, 15000);
        try {
            const response = await fetch(API + path, { mode: 'cors', credentials: 'omit', signal: controller.signal });
            const data = await response.json();
            if (!response.ok || data.ok !== true) { const error = new Error('request_failed'); error.status = response.status; throw error; }
            return data;
        } finally { clearTimeout(timer); if (signal) signal.removeEventListener('abort', cancel); }
    }
    async function latest() {
        const container = document.querySelector('[data-latest-publication]'); if (!container) return;
        const message = document.querySelector('[data-latest-status]'); feedback(message, 'loading');
        try {
            const data = await get('/articles?limit=1&offset=0');
            const articles = Array.isArray(data.articles) ? data.articles : [];
            container.replaceChildren();
            if (articles[0]) { container.appendChild(card(articles[0])); message.replaceChildren(); }
            else feedback(message, 'latestEmpty');
        } catch (_) { feedback(message, 'latestError'); }
        finally { container.setAttribute('aria-busy', 'false'); }
    }
    function guides() {
        const container = document.querySelector('[data-publication-guides]'); if (!container) return;
        [
            { href: 'financement-pme.html', coverUrl: 'public/images/commerce.webp', titleKey: 'guide.pme.title', excerptKey: 'guide.pme.excerpt' },
            { href: 'livraison-paiement.html', coverUrl: 'public/images/livraison.webp', titleKey: 'guide.delivery.title', excerptKey: 'guide.delivery.excerpt' },
            { href: 'financement-startups.html', coverUrl: 'public/images/startup.webp', titleKey: 'guide.startup.title', excerptKey: 'guide.startup.excerpt' }
        ].forEach(guide => container.appendChild(card(guide, true)));
    }
    function catalog() {
        const container = document.querySelector('[data-publication-list]'); if (!container) return;
        const filters = document.querySelector('[data-publication-filters]');
        const message = document.querySelector('[data-publication-status]');
        const pagination = document.querySelector('[data-publication-pagination]');
        const previous = pagination.querySelector('[data-publication-previous]');
        const next = pagination.querySelector('[data-publication-next]');
        const page = pagination.querySelector('[data-publication-page]');
        const params = new URLSearchParams(window.location.search);
        const state = { kind: TYPES.includes(params.get('kind')) ? params.get('kind') : '', q: (params.get('q') || '').slice(0,120), offset: Math.max(0, (parseInt(params.get('page'), 10) || 1) - 1) * 9, total: 0, limit: 9 };
        filters.elements.kind.value = state.kind; filters.elements.q.value = state.q;
        let sequence = 0, controller;
        function updatePage() { page.textContent = `${t('page')} ${Math.floor(state.offset / state.limit) + 1} ${t('of')} ${Math.max(1,Math.ceil(state.total / state.limit))}`; }
        async function load() {
            const request = ++sequence;
            if (controller) controller.abort(); controller = new AbortController();
            container.setAttribute('aria-busy', 'true'); previous.disabled = true; next.disabled = true;
            feedback(message, 'loading');
            const query = new URLSearchParams({ limit: String(state.limit), offset: String(state.offset) });
            if (state.kind) query.set('kind', state.kind); if (state.q) query.set('q', state.q);
            try {
                const data = await get('/articles?' + query.toString(), controller.signal); if (request !== sequence) return;
                const articles = Array.isArray(data.articles) ? data.articles : [];
                state.total = Math.max(0, Number(data.total) || 0);
                if (!articles.length && state.offset && state.total) { state.offset = Math.floor((state.total - 1) / state.limit) * state.limit; load(); return; }
                container.replaceChildren(); articles.forEach(article => container.appendChild(card(article)));
                if (!articles.length) feedback(message, state.kind || state.q ? 'noResults' : 'empty');
                else { message.replaceChildren(); message.appendChild(element('span', '', state.total + ' ' + t('results'))); }
                pagination.hidden = state.total <= state.limit; previous.disabled = state.offset === 0; next.disabled = state.offset + state.limit >= state.total;
                updatePage();
                const url = new URL(window.location.href);
                ['kind','q','page'].forEach(key => url.searchParams.delete(key));
                if (state.kind) url.searchParams.set('kind',state.kind); if (state.q) url.searchParams.set('q',state.q); if (state.offset) url.searchParams.set('page', String(Math.floor(state.offset/state.limit)+1));
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            } catch (error) { if (request === sequence) { container.replaceChildren(); pagination.hidden = true; feedback(message, 'error', load); } }
            finally { if (request === sequence) container.setAttribute('aria-busy', 'false'); }
        }
        filters.addEventListener('submit', event => { event.preventDefault(); state.kind = filters.elements.kind.value; state.q = filters.elements.q.value.trim(); state.offset = 0; load(); });
        filters.elements.kind.addEventListener('change', () => { state.kind = filters.elements.kind.value; state.offset = 0; load(); });
        previous.addEventListener('click', () => { state.offset = Math.max(0,state.offset-state.limit); load(); });
        next.addEventListener('click', () => { state.offset += state.limit; load(); });
        document.addEventListener('langchange', updatePage);
        load();
    }
    async function detail() {
        const container = document.querySelector('[data-article-detail]'); if (!container) return;
        const title = document.querySelector('[data-article-title]');
        const message = document.querySelector('[data-article-status]');
        const params = new URLSearchParams(window.location.search); const slug = params.get('slug') || params.get('id');
        if (!slug || slug.length > 250) { title.dataset.pub = 'notFound'; title.textContent = t('notFound'); container.setAttribute('aria-busy', 'false'); return; }
        feedback(message, 'loading');
        try {
            const data = await get('/articles/' + encodeURIComponent(slug)); const article = data.article;
            if (!article || !article.title) throw new Error('invalid_article');
            delete title.dataset.pub; title.textContent = article.title; document.title = article.title + ' — CashPay All';
            document.querySelector('[data-article-excerpt]').textContent = article.excerpt || '';
            document.querySelector('[data-article-meta]').replaceChildren(metadata(article));
            const cover = document.querySelector('[data-article-cover]'); const url = safeURL(article.coverUrl);
            if (url) {
                const image = element('img'); image.src = url; image.alt = article.coverAlt || ''; image.width = 1200; image.height = 800; image.decoding = 'async';
                image.addEventListener('error', () => { cover.hidden = true; }, { once: true }); cover.replaceChildren(image); cover.hidden = false;
            }
            document.querySelector('[data-article-body]').replaceChildren(sanitizedHTML(article.bodyHtml));
            const description = document.querySelector('meta[name="description"]'); if (description) description.content = article.excerpt || article.title;
            message.replaceChildren();
        } catch (error) {
            title.dataset.pub = error.status === 404 ? 'notFound' : 'detailError'; title.textContent = t(title.dataset.pub);
            feedback(message, error.status === 404 ? 'notFound' : 'detailError', error.status === 404 ? null : detail);
        } finally { container.setAttribute('aria-busy','false'); }
    }
    function init() { translate(); guides(); latest(); catalog(); detail(); document.addEventListener('langchange', translate); }
    window.CashPayPublications = { sanitizeHTML: sanitizedHTML, safeURL };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
