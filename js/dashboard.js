(function (global) {
  'use strict';
  const API_BASE = 'https://app.cashpay-all.com/api/main';
  const ARTICLE_KINDS = ['article', 'communique', 'advertisement'];
  const ARTICLE_STATUSES = ['draft', 'scheduled', 'published'];
  const CONTACT_STATUSES = ['received', 'reviewing', 'shortlisted', 'accepted', 'rejected'];

  function allowedAdmin(user) { return !!user && String(user.role).toLowerCase() === 'admin'; }
  function safeUrl(value, options = {}) {
    if (!value || typeof value !== 'string') return '';
    try {
      const url = new URL(value.trim());
      const protocols = options.image ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:'];
      return protocols.includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function futureDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Choisissez une date future. / Choose a future date.');
    return date.toISOString();
  }
  function slugify(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180); }
  function articlePayload(values, bodyHtml) {
    const title = String(values.title || '').trim();
    const excerpt = String(values.excerpt || '').trim();
    const body = String(bodyHtml || '').trim();
    if (!title || title.length > 200) throw new Error('Le titre est requis (200 caractères maximum). / A title is required (200 characters maximum).');
    if (excerpt.length > 500) throw new Error('Le résumé ne peut pas dépasser 500 caractères. / The excerpt cannot exceed 500 characters.');
    if (!body || !body.replace(/<[^>]*>/g, '').trim() && !/<(?:img|iframe)\b/i.test(body)) throw new Error('Ajoutez le contenu de la publication. / Add publication content.');
    if (new TextEncoder().encode(body).length > 100 * 1024) throw new Error('Le contenu HTML dépasse 100 Ko. / HTML content exceeds 100 KB.');
    const kind = values.kind || 'article', status = values.status || 'draft';
    if (!ARTICLE_KINDS.includes(kind) || !ARTICLE_STATUSES.includes(status)) throw new Error('Format ou statut invalide. / Invalid format or status.');
    const slug = String(values.slug || slugify(title)).trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) throw new Error('Le slug doit contenir des lettres minuscules, chiffres et tirets. / Use lowercase letters, numbers and hyphens in the slug.');
    const coverUrl = String(values.coverUrl || '').trim();
    if (coverUrl && (!safeUrl(coverUrl, {image:true}) || new URL(coverUrl).protocol !== 'https:')) throw new Error('Utilisez une URL HTTPS pour l’image de couverture. / Use an HTTPS cover image URL.');
    return {title, slug, excerpt, kind, bodyHtml:body, coverUrl, coverAlt:String(values.coverAlt || '').trim().slice(0,250), status, publishAt:status === 'scheduled' ? futureDate(values.publishAt) || (() => { throw new Error('Choisissez la date de publication. / Choose a publication date.'); })() : null, notifySubscribers:values.notifySubscribers === true || values.notifySubscribers === 'on'};
  }
  async function apiRequest(path, options = {}, fetchImpl = global.fetch) {
    if (!/^\/(?:auth|admin)\//.test(path) || path.includes('..') || path.startsWith('//')) throw new Error('Invalid API path');
    const headers = {'Accept':'application/json', ...options.headers};
    const init = {...options, headers, credentials:'include', cache:'no-store'};
    if (options.body !== undefined && typeof options.body !== 'string') { init.body = JSON.stringify(options.body); headers['Content-Type'] = 'application/json'; }
    let response;
    try { response = await fetchImpl(API_BASE + path, init); }
    catch (_) { throw new Error('Connexion au service impossible. Réessayez. / Unable to reach the service. Please retry.'); }
    let data;
    try { data = await response.json(); } catch (_) { data = {}; }
    if (!response.ok || data.ok === false || data.success === false) {
      const error = new Error(typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : `Le service a refusé la demande (${response.status}). / Request failed (${response.status}).`);
      error.status = response.status; error.code = data.code; throw error;
    }
    return data;
  }
  function youtubeEmbed(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return '';
      let id = '';
      if (['www.youtube.com','youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(url.hostname)) id = url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : url.searchParams.get('v');
      else if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
      return /^[\w-]{11}$/.test(id || '') ? 'https://www.youtube-nocookie.com/embed/' + id : '';
    } catch (_) { return ''; }
  }
  function sanitizeHtml(raw, documentRef = global.document) {
    const template = documentRef.createElement('template');
    template.innerHTML = String(raw || '');
    const allowed = new Set('P BR H2 H3 H4 H5 H6 STRONG B EM I U S STRIKE UL OL LI BLOCKQUOTE PRE CODE A IMG FIGURE FIGCAPTION SECTION DIV SPAN HR TABLE THEAD TBODY TFOOT TR TH TD IFRAME'.split(' '));
    const drop = new Set('SCRIPT STYLE LINK META BASE FORM INPUT BUTTON TEXTAREA SELECT OPTION OBJECT EMBED SVG MATH TEMPLATE NOSCRIPT'.split(' '));
    function clean(parent) {
      for (const node of Array.from(parent.childNodes)) {
        if (node.nodeType === 8) { node.remove(); continue; }
        if (node.nodeType !== 1) continue;
        if (drop.has(node.tagName)) { node.remove(); continue; }
        if (!allowed.has(node.tagName)) { clean(node); node.replaceWith(...node.childNodes); continue; }
        const attrs = {};
        if (node.tagName === 'A') {
          const href = safeUrl(node.getAttribute('href'));
          if (href) attrs.href = href;
          attrs.rel = 'noopener noreferrer';
          if (node.getAttribute('target') === '_blank') attrs.target = '_blank';
        }
        if (node.tagName === 'IMG') {
          const src = safeUrl(node.getAttribute('src'), {image:true});
          if (!src) { node.remove(); continue; }
          attrs.src = src; attrs.alt = node.getAttribute('alt') || ''; attrs.loading = 'lazy';
        }
        if (node.tagName === 'IFRAME') {
          const src = youtubeEmbed(node.getAttribute('src'));
          if (!src) { node.remove(); continue; }
          attrs.src = src; attrs.title = node.getAttribute('title') || 'YouTube video'; attrs.loading = 'lazy'; attrs.referrerpolicy = 'strict-origin-when-cross-origin'; attrs.allowfullscreen = ''; attrs.sandbox = 'allow-scripts allow-same-origin allow-presentation';
        }
        if (['TD','TH'].includes(node.tagName)) for (const key of ['colspan','rowspan']) { const value = node.getAttribute(key); if (/^[1-9][0-9]?$/.test(value || '')) attrs[key] = value; }
        const classes = (node.getAttribute('class') || '').split(/\s+/).filter(c => ['content-columns','content-cta'].includes(c));
        if (classes.length) attrs.class = classes.join(' ');
        for (const attribute of Array.from(node.attributes)) node.removeAttribute(attribute.name);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        clean(node);
      }
    }
    clean(template.content);
    return template.innerHTML;
  }
  const helpers = {API_BASE, apiRequest, allowedAdmin, articlePayload, safeUrl, sanitizeHtml, futureDate, escapeHtml, youtubeEmbed};
  if (typeof module !== 'undefined' && module.exports) module.exports = helpers;
  global.CashPayDashboard = helpers;
  if (!global.document || !global.document.getElementById('auth-view')) return;

  const doc = global.document, $ = id => doc.getElementById(id);
  const translations = {
    en: {skip:'Skip to content',adminSpace:'Administration',viewSite:'View website ↗',logout:'Sign out',workspaceTitle:'One voice.<br>New perspectives.',workspaceText:'Publications, campaigns and conversations: your CashPay All editorial workspace.',authAccess:'For CashPay administrators only.',secureAccess:'SECURE ACCESS',signIn:'Sign in to Main',authDescription:'Use your CashPay Wallet ID. Your administrator role will be verified.',checkingSession:'Checking your session…',receiveCode:'Receive the code by',receiveOtp:'Send verification code →',verificationCode:'Verification code',verifyCode:'Verify code →',startAgain:'Start again',walletPin:'Your wallet PIN',openDashboard:'Open dashboard →',authFootnote:'Wallet ID → OTP code → PIN. Your credentials are not stored in this browser.',editorialWorkspace:'Editorial workspace',manage:'MANAGE',publications:'Publications',campaigns:'Newsletters',contacts:'Contacts',outbox:'Scheduled replies',makeConnections:'Share. Connect.',sidebarNote:'Good stories start new conversations.',administrator:'Administrator',editorial:'EDITORIAL',yourPublications:'Your publications',articlesIntro:'From ideas to announcements: bring CashPay news to life.',newArticle:'＋ New publication',all:'All',published:'Published',scheduled:'Scheduled',drafts:'Drafts',refresh:'↻ Refresh',backArticles:'← All publications',newPublication:'New publication',editPublication:'Edit publication',preview:'Preview',save:'Save publication',title:'Title',titlePlaceholder:'A story worth sharing…',excerpt:'Summary',excerptPlaceholder:'A few words to inspire your readers.',paragraph:'Paragraph',quote:'Quote',htmlSource:'</> HTML',shortcuts:'Ctrl/⌘ B: bold · K: link · S: save',publishing:'Publishing',format:'Format',article:'Article',pressRelease:'Press release',advertisement:'Advertisement',status:'Status',draft:'Draft',schedule:'Schedule',publishNow:'Publish now',publishDate:'Publication date and time',localTime:'Browser local time; sent as UTC.',notifySubscribers:'Notify subscribers by newsletter',notifyHelp:'The newsletter service sends the email when the article is published.',cover:'Cover image',imageUrl:'Image URL',imageDescription:'Image description',insertSection:'Insert a block',textSection:'Text section',twoColumns:'Two columns',callToAction:'Call to action',table:'Table',divider:'Divider',videoEmbed:'YouTube video',campaignsIntro:'Bring your publications to your community’s inbox.',planCampaign:'Schedule a newsletter',campaignHelp:'In a publication, select “Notify subscribers by newsletter”, then publish or choose a publication date. One campaign is created automatically.',publication:'Publication',choosePublication:'Choose a publication',subject:'Email subject',sendDate:'Send date (optional)',createCampaign:'Create campaign',campaignHistory:'Campaign history',relationships:'RELATIONSHIPS',contactsIntro:'Applications and projects: every request deserves a response.',candidates:'Applications',projects:'Projects & contacts',searchContacts:'Search contacts',searchPlaceholder:'Name, email, reference…',conversations:'CONVERSATIONS',repliesIntro:'Track sent replies and upcoming emails.',editHtml:'Edit HTML',htmlHelp:'Structure your article in HTML. Active content and unsafe attributes are removed.',cancel:'Cancel',applyHtml:'Apply HTML',labelOrDescription:'Text / description',insert:'Insert',directReply:'DIRECT REPLY',replyContact:'Reply to contact',message:'Message',replyTextHelp:'Your text will be sent as an email. Application files remain in your email inboxes.',emptyImmediate:'Leave empty to send now.',sendReply:'Send / schedule',loading:'Loading…',loadError:'Unable to load this content.',retry:'Try again',noArticles:'Your next story starts here',noArticlesHelp:'Create an article, press release or advertisement. Saved publications appear here.',noFiltered:'No publications with this status.',noCampaigns:'No campaigns yet',noCampaignsHelp:'Create a campaign from a publication to reach your subscribers.',noContacts:'No contacts found',noContactsHelp:'New applications and project requests will appear here.',noReplies:'No replies yet',noRepliesHelp:'Reply to a contact to start a conversation or schedule a message.',edit:'Edit',reply:'Reply',reference:'Reference',contact:'Contact',kind:'Type',date:'Date',actions:'Actions',recipients:'Recipients',delivered:'Delivered',opened:'Opened',clicked:'Clicked',sent:'Sent',queued:'Queued',sending:'Sending',failed:'Failed',cancelled:'Cancelled',received:'Received',reviewing:'Reviewing',shortlisted:'Shortlisted',accepted:'Accepted',rejected:'Rejected',saved:'Publication saved.',campaignCreated:'Campaign created.',replyCreated:'Reply saved for delivery.',statusUpdated:'Contact status updated.',replyCancelled:'Scheduled reply cancelled.',adminOnly:'This area requires a CashPay administrator account.',sessionExpired:'Your session has expired. Please sign in again.',checking:'Checking…',words:'words',metricCampaigns:'Campaigns',metricRecipients:'Recipients',metricDelivered:'Sent',metricOpens:'Failed',metricHelp:'Reported by the delivery service',noStats:'Not yet reported',insertLink:'Insert a link',insertImage:'Insert an image',insertVideo:'Insert a YouTube video',invalidUrl:'Enter a valid, safe URL.',videoHelp:'Use an HTTPS YouTube video URL.',noMatching:'No contacts match this search.',scheduleCancel:'Cancel scheduled email',sendingSaved:'Saving…',destination:'A verification code was sent to',campaignTitle:'Campaign',responseTitle:'Reply',notAvailable:'—',textSectionHeading:'Section heading',textSectionBody:'Write your text here.',columnHeading:'Column heading',ctaLabel:'Discover more',untitled:'Untitled',subscribers:'Subscribers',metricsUnavailable:'Statistics will appear when the service reports them.'},
    fr: {loading:'Chargement…',loadError:'Impossible de charger ce contenu.',retry:'Réessayer',noArticles:'Votre prochaine histoire commence ici',noArticlesHelp:'Créez un article, un communiqué ou une publicité. Vos publications enregistrées apparaîtront ici.',noFiltered:'Aucune publication avec ce statut.',noCampaigns:'Aucune campagne pour le moment',noCampaignsHelp:'Créez une campagne à partir d’une publication pour joindre vos abonnés.',noContacts:'Aucun contact trouvé',noContactsHelp:'Les nouvelles candidatures et demandes de projet apparaîtront ici.',noReplies:'Aucune réponse pour le moment',noRepliesHelp:'Répondez à un contact pour démarrer une conversation ou programmer un message.',edit:'Modifier',reply:'Répondre',reference:'Référence',contact:'Contact',kind:'Type',date:'Date',actions:'Actions',recipients:'Destinataires',delivered:'Délivrés',opened:'Ouvertures',clicked:'Clics',sent:'Envoyée',queued:'En attente',sending:'En cours',failed:'Échec',cancelled:'Annulée',received:'Reçue',reviewing:'À l’étude',shortlisted:'Présélectionnée',accepted:'Retenue',rejected:'Non retenue',saved:'Publication enregistrée.',campaignCreated:'Campagne créée.',replyCreated:'Réponse enregistrée pour envoi.',statusUpdated:'Statut du contact mis à jour.',replyCancelled:'Envoi programmé annulé.',adminOnly:'Cet espace nécessite un compte administrateur CashPay.',sessionExpired:'Votre session a expiré. Veuillez vous reconnecter.',checking:'Vérification…',words:'mots',metricCampaigns:'Campagnes',metricRecipients:'Destinataires',metricDelivered:'Emails envoyés',metricOpens:'Échecs',metricHelp:'Rapporté par le service d’envoi',noStats:'Pas encore rapporté',insertLink:'Insérer un lien',insertImage:'Insérer une image',insertVideo:'Insérer une vidéo YouTube',invalidUrl:'Indiquez une URL valide et sûre.',videoHelp:'Utilisez une URL vidéo YouTube en HTTPS.',noMatching:'Aucun contact ne correspond à cette recherche.',scheduleCancel:'Annuler l’envoi programmé',sendingSaved:'Enregistrement…',destination:'Un code de vérification a été envoyé à',campaignTitle:'Campagne',responseTitle:'Réponse',notAvailable:'—',textSectionHeading:'Titre de section',textSectionBody:'Rédigez votre texte ici.',columnHeading:'Titre de colonne',ctaLabel:'En savoir plus',untitled:'Sans titre',subscribers:'Abonnés',metricsUnavailable:'Les statistiques apparaîtront lorsque le service les transmettra.',editPublication:'Modifier la publication'}
  };
  doc.querySelectorAll('[data-t]').forEach(el => { const key = el.dataset.t; if (!translations.fr[key]) translations.fr[key] = el.innerHTML; });
  doc.querySelectorAll('[data-t-placeholder]').forEach(el => { translations.fr[el.dataset.tPlaceholder] = el.placeholder; });
  let language = 'fr';
  const state = {user:null, view:'articles', articles:[], campaigns:[], contacts:[], replies:[], articleFilter:'all', contactKind:'careers', editId:null, replyId:null, selection:null, insertType:null, loaded:new Set(), dirty:false, busy:false, generation:0, totals:{}, requests:{}};
  const t = key => translations[language][key] || translations.fr[key] || key;
  const idOf = item => String(item.id ?? item._id ?? '');
  function notice(message, error = false) { $('global-message').textContent = message; $('global-message').classList.toggle('error', error); $('global-message').hidden = false; global.clearTimeout(notice.timer); notice.timer = global.setTimeout(() => { $('global-message').hidden = true; }, 6500); }
  function showError(id, error) { $(id).textContent = error.message || String(error); $(id).hidden = false; }
  function clearError(id) { $(id).hidden = true; $(id).textContent = ''; }
  async function busyForm(form, callback) {
    if (form.dataset.busy) return;
    form.dataset.busy = 'true';
    const buttons = [...form.querySelectorAll('button[type=submit]'), ...doc.querySelectorAll(`[form="${form.id}"][type=submit]`)];
    buttons.forEach(button => { button.disabled = true; });
    try { await callback(); } finally { delete form.dataset.busy; buttons.forEach(button => { button.disabled = false; }); }
  }
  function setAuthStep(step) {
    $('auth-loading').hidden = true;
    ['wallet','otp','pin'].forEach(name => { $(name + '-form').hidden = name !== step; doc.querySelector(`[data-auth-step="${name}"]`).classList.toggle('current', name === step); });
    const input = $(step === 'wallet' ? 'wallet-id' : step); if (input) input.focus();
  }
  function clearPrivateContent() {
    state.generation++;
    state.user = null; state.articles = []; state.campaigns = []; state.contacts = []; state.replies = []; state.loaded.clear(); state.editId = null; state.replyId = null; state.selection = null; state.dirty = false;
    for (const name of ['articles','campaigns','contacts','replies']) $(name + '-list').replaceChildren();
    $('campaign-metrics').replaceChildren(); $('article-form').reset(); $('article-body').replaceChildren(); $('reply-form').reset(); $('html-source').value = ''; $('article-preview').replaceChildren(); $('user-name').textContent = '';
    doc.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    $('admin-view').hidden = true; $('logout').hidden = true; $('auth-view').hidden = false;
  }
  function handleAuthError(error) {
    if ([401,403].includes(error.status)) { clearPrivateContent(); setAuthStep('wallet'); showError('auth-error', new Error(error.status === 403 ? t('adminOnly') : t('sessionExpired'))); return true; }
    return false;
  }
  async function acceptSession(data) {
    if (!allowedAdmin(data.user)) { await apiRequest('/auth/logout',{method:'POST',body:{}}).catch(() => {}); throw new Error(t('adminOnly')); }
    state.user = data.user; clearError('auth-error'); $('auth-view').hidden = true; $('admin-view').hidden = false; $('logout').hidden = false;
    $('user-name').textContent = state.user.fullName || state.user.name || state.user.walletId;
    $('user-avatar').textContent = (state.user.fullName || state.user.name || 'A').split(/\s+/).slice(0,2).map(s => s[0]).join('').toUpperCase();
    $('pin').value = ''; $('otp').value = '';
    await switchView('articles');
  }
  $('wallet-form').addEventListener('submit', event => { event.preventDefault(); busyForm(event.currentTarget, async () => {
    clearError('auth-error');
    try { const data = await apiRequest('/auth/start',{method:'POST',body:{walletId:$('wallet-id').value.trim(),channel:$('otp-channel').value}}); $('otp-destination').textContent = data.maskedDestination ? `${t('destination')} ${data.maskedDestination}` : ''; $('otp').value = ''; setAuthStep('otp'); }
    catch (error) { showError('auth-error',error); }
  }); });
  $('otp-form').addEventListener('submit', event => { event.preventDefault(); busyForm(event.currentTarget, async () => { clearError('auth-error'); try { await apiRequest('/auth/otp',{method:'POST',body:{otp:$('otp').value.trim()}}); $('otp').value = ''; setAuthStep('pin'); } catch (error) { showError('auth-error',error); } }); });
  $('pin-form').addEventListener('submit', event => { event.preventDefault(); busyForm(event.currentTarget, async () => { clearError('auth-error'); const pin = $('pin').value; $('pin').value = ''; try { await acceptSession(await apiRequest('/auth/pin',{method:'POST',body:{pin}})); } catch (error) { showError('auth-error',error); } }); });
  $('auth-restart').addEventListener('click', () => { $('otp').value = ''; $('pin').value = ''; clearError('auth-error'); setAuthStep('wallet'); });
  $('logout').addEventListener('click', async () => { $('logout').disabled = true; try { await apiRequest('/auth/logout',{method:'POST',body:{}}); clearPrivateContent(); $('wallet-id').value = ''; setAuthStep('wallet'); } catch (error) { if (!handleAuthError(error)) notice(error.message,true); } finally { $('logout').disabled = false; } });
  function listItems(data, name) { if (!Array.isArray(data[name])) throw new Error(t('loadError')); return data[name]; }
  function loading(name) { $(name + '-list').innerHTML = `<div class="loading-state" role="status">${escapeHtml(t('loading'))}</div>`; }
  function empty(title, text, button = '') { return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">${button ? '▤' : '✦'}</span><h2>${escapeHtml(t(title))}</h2><p>${escapeHtml(t(text))}</p>${button}</div>`; }
  function failed(name, error) { $(name + '-list').innerHTML = `<div class="empty-state"><h2>${escapeHtml(t('loadError'))}</h2><p>${escapeHtml(error.message)}</p><button type="button" class="button secondary" data-refresh="${name}">${escapeHtml(t('retry'))}</button></div>`; }
  function dateLabel(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(date); }
  function localDate(value) { if (!value) return ''; const date = new Date(value); if (!Number.isFinite(date.getTime())) return ''; return new Date(date.getTime() - date.getTimezoneOffset()*60000).toISOString().slice(0,16); }
  function badge(status) { const safe = /^[a-z]+$/.test(status || '') ? status : ''; return `<span class="badge ${safe}">${escapeHtml(t(status || 'draft'))}</span>`; }
  function table(headers, rows) { return `<div class="table-scroll"><table class="data-table"><thead><tr>${headers.map(key => `<th scope="col">${escapeHtml(t(key))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`; }
  async function load(name, force = false) {
    if (!state.user || state.loaded.has(name) && !force) return;
    const generation = state.generation;
    const requestId = state.requests[name] = (state.requests[name] || 0) + 1;
    loading(name);
    try {
      let path = '/admin/' + name + '?limit=100&offset=0';
      if (name === 'contacts') path += '&kind=' + state.contactKind;
      const data = await apiRequest(path);
      if (generation !== state.generation || requestId !== state.requests[name] || !state.user) return;
      state[name] = listItems(data,name); state.totals[name] = Number(data.total) || state[name].length; state.loaded.add(name);
      if (name === 'campaigns') state.campaignStats = data.stats || data.statistics || null;
      render(name);
    } catch (error) { if (generation === state.generation && requestId === state.requests[name] && !handleAuthError(error)) failed(name,error); }
  }
  async function switchView(view) {
    if (!state.user) return;
    state.view = view;
    doc.querySelectorAll('.view').forEach(el => { el.hidden = el.id !== 'view-' + view; });
    doc.querySelectorAll('[data-view]').forEach(el => { if (el.dataset.view === (view === 'editor' ? 'articles' : view)) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
    if (view !== 'editor') await load(view);
    
  }
  function render(name) {
    ({articles:renderArticles,campaigns:renderCampaigns,contacts:renderContacts,replies:renderReplies}[name])();
    if (state.totals[name] > state[name].length) {
      const footer = doc.createElement('div'); footer.className = 'collection-footer';
      const button = doc.createElement('button'); button.type = 'button'; button.className = 'button secondary'; button.dataset.loadMore = name;
      button.textContent = (language === 'fr' ? 'Charger la suite' : 'Load more') + ` (${state[name].length}/${state.totals[name]})`;
      footer.append(button); $(name + '-list').append(footer);
    }
  }
  async function loadMore(name, button) {
    const generation = state.generation, requestId = state.requests[name]; button.disabled = true;
    try {
      const path = '/admin/' + name + '?limit=100&offset=' + state[name].length + (name === 'contacts' ? '&kind=' + state.contactKind : '');
      const data = await apiRequest(path);
      if (generation !== state.generation || requestId !== state.requests[name] || !state.user) return;
      const page = listItems(data,name); const known = new Set(state[name].map(idOf));
      state[name].push(...page.filter(item => !known.has(idOf(item))));
      state.totals[name] = page.length ? Number(data.total) || state[name].length : state[name].length;
      render(name);
    } catch (error) { if (!handleAuthError(error)) notice(error.message,true); }
    finally { button.disabled = false; }
  }
  function renderArticles() {
    const articles = state.articles.filter(item => state.articleFilter === 'all' || item.status === state.articleFilter);
    if (!articles.length) { $('articles-list').innerHTML = empty('noArticles',state.articles.length ? 'noFiltered' : 'noArticlesHelp',`<button type="button" class="button primary" data-action="new">${escapeHtml(t('newArticle'))}</button>`); return; }
    $('articles-list').innerHTML = table(['publication','kind','status','date','actions'],articles.map(article => `<tr><td class="table-title"><strong>${escapeHtml(article.title)}</strong><small>/${escapeHtml(article.slug)}</small></td><td>${escapeHtml(t(article.kind === 'communique' ? 'pressRelease' : article.kind === 'advertisement' ? 'advertisement' : 'article'))}</td><td>${badge(article.status)}</td><td>${escapeHtml(dateLabel(article.publishAt || article.publishedAt || article.updatedAt || article.createdAt))}</td><td><button type="button" class="button secondary" data-edit="${escapeHtml(idOf(article))}">${escapeHtml(t('edit'))}</button></td></tr>`).join(''));
  }
  function numeric(value) { return Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : null; }
  function campaignCount(campaign, keys) { for (const key of keys) { const value = numeric(campaign.stats?.[key] ?? campaign[key]); if (value !== null) return value; } return null; }
  function renderCampaigns() {
    const sum = keys => { const counts = state.campaigns.map(c => campaignCount(c,keys)).filter(n => n !== null); return counts.length ? counts.reduce((a,b) => a+b,0) : null; };
    const values = [state.campaigns.length, sum(['total','recipientCount','recipients','totalRecipients']),sum(['sent','sentCount']),sum(['failed','failedCount'])];
    $('campaign-metrics').innerHTML = ['metricCampaigns','metricRecipients','metricDelivered','metricOpens'].map((key,i) => `<div class="metric"><span>${escapeHtml(t(key))}</span><strong>${values[i] === null ? '—' : new Intl.NumberFormat(language).format(values[i])}</strong><small>${escapeHtml(t(i === 0 ? 'campaignHistory' : values[i] === null ? 'noStats' : 'metricHelp'))}</small></div>`).join('');
    if (!state.campaigns.length) { $('campaigns-list').innerHTML = empty('noCampaigns','noCampaignsHelp'); return; }
    $('campaigns-list').innerHTML = table(['campaignTitle','status','recipients','sent','failed','date'],state.campaigns.map(campaign => `<tr><td class="table-title"><strong>${escapeHtml(campaign.subject || campaign.articleTitle || t('campaignTitle'))}</strong><small>${escapeHtml(campaign.articleTitle || '')}</small></td><td>${badge(campaign.status)}</td>${[['total','recipientCount','recipients','totalRecipients'],['sent','sentCount'],['failed','failedCount']].map(keys => `<td>${escapeHtml(campaignCount(campaign,keys) ?? '—')}</td>`).join('')}<td>${escapeHtml(dateLabel(campaign.dueAt || campaign.sendAt || campaign.scheduledAt || campaign.createdAt))}</td></tr>`).join(''));
  }
  function renderContacts() {
    const query = $('contact-search').value.toLowerCase().trim();
    const contacts = state.contacts.filter(contact => [contact.name,contact.fullName,contact.email,contact.ref,contact.reference].join(' ').toLowerCase().includes(query));
    if (!contacts.length) { $('contacts-list').innerHTML = empty('noContacts',query ? 'noMatching' : 'noContactsHelp'); return; }
    $('contacts-list').innerHTML = table(['contact','reference','kind','status','actions'],contacts.map(contact => `<tr><td class="table-title"><strong>${escapeHtml(contact.name || contact.fullName || contact.email)}</strong><small>${escapeHtml(contact.email)}</small></td><td>${escapeHtml(contact.ref || contact.reference || '—')}</td><td>${escapeHtml(t(contact.kind === 'careers' ? 'candidates' : 'projects'))}</td><td><select class="contact-status" data-contact-status="${escapeHtml(idOf(contact))}" aria-label="${escapeHtml(t('status'))}: ${escapeHtml(contact.email)}">${CONTACT_STATUSES.map(status => `<option value="${status}"${status === contact.status ? ' selected' : ''}>${escapeHtml(t(status))}</option>`).join('')}</select></td><td><button type="button" class="button secondary" data-reply="${escapeHtml(idOf(contact))}">${escapeHtml(t('reply'))}</button></td></tr>`).join(''));
  }
  function renderReplies() {
    if (!state.replies.length) { $('replies-list').innerHTML = empty('noReplies','noRepliesHelp'); return; }
    $('replies-list').innerHTML = table(['responseTitle','contact','status','date','actions'],state.replies.map(reply => `<tr><td class="table-title"><strong>${escapeHtml(reply.subject)}</strong><small>${escapeHtml(reply.ref || '')}</small></td><td>${escapeHtml(reply.email || reply.recipientEmail || reply.contactEmail || reply.contactId)}</td><td>${badge(reply.status)}</td><td>${escapeHtml(dateLabel(reply.sendAt || reply.sentAt || reply.createdAt))}</td><td>${reply.status === 'queued' || reply.status === 'failed' ? `<button type="button" class="button secondary" data-cancel-reply="${escapeHtml(idOf(reply))}">${escapeHtml(t('cancel'))}</button>` : '—'}</td></tr>`).join(''));
  }
  function updateWords() { const text = $('article-body').textContent.trim(); $('word-count').textContent = (text ? text.split(/\s+/).length : 0) + ' ' + t('words'); }
  function editArticle(article = null) {
    state.editId = article ? idOf(article) : null; state.dirty = false; $('article-form').reset(); clearError('article-error');
    const values = article || {};
    for (const [key,id] of Object.entries({title:'article-title',excerpt:'article-excerpt',kind:'article-kind',status:'article-status',slug:'article-slug',coverUrl:'article-cover',coverAlt:'article-cover-alt'})) $(id).value = values[key] ?? (key === 'status' ? 'draft' : key === 'kind' ? 'article' : '');
    $('article-notify').checked = values.notifySubscribers !== false; $('article-publish-at').value = localDate(values.publishAt); $('publish-at-field').hidden = $('article-status').value !== 'scheduled'; $('article-publish-at').required = $('article-status').value === 'scheduled'; $('article-body').innerHTML = sanitizeHtml(values.bodyHtml || '');
    $('editor-title').textContent = t(article ? 'editPublication' : 'newPublication'); updateWords(); switchView('editor'); $('article-title').focus();
  }
  $('article-form').addEventListener('input', () => { state.dirty = true; });
  $('article-body').addEventListener('input', () => { state.dirty = true; updateWords(); });
  $('article-status').addEventListener('change', () => { const scheduled = $('article-status').value === 'scheduled'; $('publish-at-field').hidden = !scheduled; $('article-publish-at').required = scheduled; });
  $('article-title').addEventListener('blur', () => { if (!$('article-slug').value) $('article-slug').value = slugify($('article-title').value); });
  $('article-form').addEventListener('submit', event => { event.preventDefault(); busyForm(event.currentTarget, async () => {
    clearError('article-error');
    try {
      const values = Object.fromEntries(new FormData($('article-form'))); values.notifySubscribers = $('article-notify').checked;
      const payload = articlePayload(values,sanitizeHtml($('article-body').innerHTML));
      const data = await apiRequest('/admin/articles' + (state.editId ? '/' + encodeURIComponent(state.editId) : ''),{method:state.editId ? 'PATCH' : 'POST',body:payload});
      if (!data.article) throw new Error(t('loadError'));
      state.editId = idOf(data.article); state.dirty = false; notice(t('saved')); state.loaded.delete('articles'); state.loaded.delete('campaigns'); await switchView('articles');
    } catch (error) { if (!handleAuthError(error)) showError('article-error',error); }
  }); });
  function keepSelection() { const selection = global.getSelection(); if (selection.rangeCount && $('article-body').contains(selection.anchorNode)) state.selection = selection.getRangeAt(0).cloneRange(); }
  function restoreSelection() { const selection = global.getSelection(); $('article-body').focus(); if (state.selection && $('article-body').contains(state.selection.commonAncestorContainer)) { selection.removeAllRanges(); selection.addRange(state.selection); } }
  doc.addEventListener('selectionchange',keepSelection);
  function insertHtml(html) {
    restoreSelection();
    const selection = global.getSelection();
    let range = selection.rangeCount && $('article-body').contains(selection.anchorNode) ? selection.getRangeAt(0) : null;
    if (!range) { range = doc.createRange(); range.selectNodeContents($('article-body')); range.collapse(false); }
    range.deleteContents(); const fragment = range.createContextualFragment(sanitizeHtml(html)); const last = fragment.lastChild; range.insertNode(fragment);
    if (last) { range.setStartAfter(last); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); }
    state.dirty = true; keepSelection(); updateWords();
  }
  doc.querySelectorAll('[data-command]').forEach(button => { button.addEventListener('mousedown', event => event.preventDefault()); button.addEventListener('click', () => { restoreSelection(); if (typeof doc.execCommand === 'function') doc.execCommand(button.dataset.command,false,null); state.dirty = true; updateWords(); }); });
  $('block-format').addEventListener('change', event => { restoreSelection(); if (typeof doc.execCommand === 'function') doc.execCommand('formatBlock',false,event.target.value); state.dirty = true; });
  function openInsert(type) {
    keepSelection(); state.insertType = type; $('insert-title').textContent = t(type === 'image' ? 'insertImage' : type === 'video' ? 'insertVideo' : 'insertLink'); $('insert-url').value = ''; $('insert-label').value = type === 'link' ? global.getSelection().toString() : ''; $('insert-label-field').hidden = type === 'video'; clearError('insert-error'); $('insert-dialog').showModal(); $('insert-url').focus();
  }
  $('insert-link').addEventListener('click', () => openInsert('link')); $('insert-image').addEventListener('click', () => openInsert('image')); $('insert-embed').addEventListener('click', () => openInsert('video'));
  $('insert-form').addEventListener('submit', event => { event.preventDefault(); const value = $('insert-url').value, label = $('insert-label').value; const url = state.insertType === 'video' ? youtubeEmbed(value) : safeUrl(value,{image:state.insertType === 'image'}); if (!url) { showError('insert-error',new Error(t(state.insertType === 'video' ? 'videoHelp' : 'invalidUrl'))); return; } const html = state.insertType === 'image' ? `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure><p><br></p>` : state.insertType === 'video' ? `<iframe src="${escapeHtml(url)}" title="YouTube video"></iframe><p><br></p>` : `<a${state.insertType === 'cta' ? ' class="content-cta"' : ''} href="${escapeHtml(url)}">${escapeHtml(label || url)}</a>`; $('insert-dialog').close(); insertHtml(html); });
  doc.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => {
    const kind = button.dataset.insert;
    if (kind === 'cta') { openInsert('link'); $('insert-label').value = t('ctaLabel'); state.insertType = 'cta'; return; }
    const section = `<section><h2>${escapeHtml(t('textSectionHeading'))}</h2><p>${escapeHtml(t('textSectionBody'))}</p></section><p><br></p>`;
    const column = `<div><h3>${escapeHtml(t('columnHeading'))}</h3><p>${escapeHtml(t('textSectionBody'))}</p></div>`;
    const html = kind === 'section' ? section : kind === 'columns' ? `<div class="content-columns">${column}${column}</div><p><br></p>` : kind === 'table' ? '<table><thead><tr><th>…</th><th>…</th></tr></thead><tbody><tr><td>…</td><td>…</td></tr><tr><td>…</td><td>…</td></tr></tbody></table><p><br></p>' : '<hr><p><br></p>';
    insertHtml(html);
  }));
  $('open-source').addEventListener('click', () => { $('html-source').value = sanitizeHtml($('article-body').innerHTML); $('source-dialog').showModal(); });
  $('apply-source').addEventListener('click', () => { $('article-body').innerHTML = sanitizeHtml($('html-source').value); state.selection = null; state.dirty = true; updateWords(); $('source-dialog').close(); });
  $('article-body').addEventListener('paste', event => { event.preventDefault(); const clipboard = event.clipboardData; const html = clipboard.getData('text/html'); insertHtml(html || clipboard.getData('text/plain').split(/\n/).map(line => `<p>${escapeHtml(line) || '<br>'}</p>`).join('')); });
  $('article-body').addEventListener('drop', event => { event.preventDefault(); });
  $('preview-article').addEventListener('click', () => { const cover = safeUrl($('article-cover').value,{image:true}); $('article-preview').innerHTML = `<span class="eyebrow">CASHPAY ALL</span><h1>${escapeHtml($('article-title').value || t('untitled'))}</h1><p class="excerpt">${escapeHtml($('article-excerpt').value)}</p>${cover ? `<img class="cover-image" src="${escapeHtml(cover)}" alt="${escapeHtml($('article-cover-alt').value)}">` : ''}${sanitizeHtml($('article-body').innerHTML)}`; $('preview-dialog').showModal(); });
  doc.addEventListener('keydown', event => { if (!state.user || state.view !== 'editor' || !(event.ctrlKey || event.metaKey)) return; if (event.key.toLowerCase() === 's') { event.preventDefault(); $('article-form').requestSubmit(); } if (event.key.toLowerCase() === 'k' && $('article-body').contains(doc.activeElement)) { event.preventDefault(); openInsert('link'); } });
  global.addEventListener('beforeunload', event => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } });
  $('contact-search').addEventListener('input',renderContacts);
  function openReply(contact) { state.replyId = idOf(contact); $('reply-form').reset(); clearError('reply-error'); $('reply-recipient').textContent = `${contact.name || contact.fullName || ''} <${contact.email}>${contact.ref ? ' · ' + contact.ref : ''}`; $('reply-subject').value = contact.kind === 'careers' ? (language === 'fr' ? 'Votre candidature CashPay All' : 'Your CashPay All application') : (language === 'fr' ? 'Votre projet avec CashPay All' : 'Your project with CashPay All'); $('reply-dialog').showModal(); }
  $('reply-form').addEventListener('submit', event => { event.preventDefault(); busyForm(event.currentTarget, async () => { clearError('reply-error'); try { const sendAt = futureDate($('reply-send-at').value); const bodyHtml = $('reply-body').value.trim().split(/\n\s*\n/).map(paragraph => '<p>' + escapeHtml(paragraph).replace(/\n/g,'<br>') + '</p>').join(''); await apiRequest('/admin/replies',{method:'POST',body:{contactId:state.replyId,subject:$('reply-subject').value.trim(),bodyHtml,sendAt}}); $('reply-dialog').close(); $('reply-form').reset(); state.loaded.delete('replies'); notice(t('replyCreated')); } catch (error) { if (!handleAuthError(error)) showError('reply-error',error); } }); });
  doc.addEventListener('change', async event => {
    const select = event.target.closest('[data-contact-status]'); if (!select) return; select.disabled = true; const contact = state.contacts.find(item => idOf(item) === select.dataset.contactStatus); const oldStatus = contact?.status;
    try { await apiRequest('/admin/contacts/' + encodeURIComponent(select.dataset.contactStatus),{method:'PATCH',body:{status:select.value}}); if (contact) contact.status = select.value; notice(t('statusUpdated')); }
    catch (error) { select.value = oldStatus || 'received'; if (!handleAuthError(error)) notice(error.message,true); }
    finally { select.disabled = false; }
  });
  doc.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.view) { switchView(button.dataset.view); return; }
    if (button.dataset.refresh) { load(button.dataset.refresh,true); return; }
    if (button.dataset.loadMore) { loadMore(button.dataset.loadMore,button); return; }
    if (button.dataset.close) { $(button.dataset.close).close(); return; }
    if (button.dataset.action === 'new' || button.id === 'new-article') { editArticle(); return; }
    if (button.id === 'back-articles') { switchView('articles'); return; }
    if (button.hasAttribute('data-article-filter')) { state.articleFilter = button.dataset.articleFilter; doc.querySelectorAll('[data-article-filter]').forEach(el => el.setAttribute('aria-pressed',String(el === button))); render('articles'); return; }
    if (button.dataset.contactKind) { state.contactKind = button.dataset.contactKind; doc.querySelectorAll('[data-contact-kind]').forEach(el => el.setAttribute('aria-pressed',String(el === button))); state.loaded.delete('contacts'); await load('contacts'); return; }
    if (button.dataset.edit) { const article = state.articles.find(item => idOf(item) === button.dataset.edit); if (article) editArticle(article); return; }
    if (button.dataset.reply) { const contact = state.contacts.find(item => idOf(item) === button.dataset.reply); if (contact) openReply(contact); return; }
    if (button.dataset.cancelReply) { button.disabled = true; try { await apiRequest('/admin/replies/' + encodeURIComponent(button.dataset.cancelReply),{method:'PATCH',body:{status:'cancelled'}}); notice(t('replyCancelled')); await load('replies',true); } catch (error) { if (!handleAuthError(error)) notice(error.message,true); } finally { button.disabled = false; } }
    if (button.dataset.language) {
      language = button.dataset.language; doc.documentElement.lang = language;
      doc.querySelectorAll('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t); }); doc.querySelectorAll('[data-t-placeholder]').forEach(el => { el.placeholder = t(el.dataset.tPlaceholder); }); doc.querySelectorAll('[data-language]').forEach(el => el.setAttribute('aria-pressed',String(el === button)));
      $('article-body').dataset.placeholder = language === 'fr' ? 'Racontez votre histoire…' : 'Tell your story…';
      for (const name of state.loaded) render(name); updateWords(); if (state.view === 'editor') $('editor-title').textContent = t(state.editId ? 'editPublication' : 'newPublication');
    }
  });
  (async () => { try { await acceptSession(await apiRequest('/auth/session')); } catch (error) { clearPrivateContent(); setAuthStep('wallet'); if (error.status !== 401) showError('auth-error',error); } })();
})(typeof window !== 'undefined' ? window : globalThis);
