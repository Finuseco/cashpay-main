(function () {
    'use strict';
    // Paramètres indicatifs de la simulation (à ajuster avec la politique de crédit).
    var RATE = 0.20;       // frais du crédit : 20 % du montant demandé
    var GUARANTEE = 0.30;  // garantie à constituer pour un client sans entreprise partenaire
    var STEP = 10;         // les échéances sont arrondies à la dizaine supérieure

    if (window.I18N) I18N.extend({
        't.salary': 'Salary & salary advance — CashPay All', 'sal.crumb': 'Salary',
        'sal.title': 'Your salary and <span class="highlight">advances</span>, on CashPay',
        'sal.lead': 'Through a partnership between CashPay and your company, school or administration, you receive your salary in your account and can request a salary advance, credited instantly.',
        'sal.why.t': 'A partnership that <span class="highlight">changes everything</span>', 'sal.why.sub': 'Teachers, civil servants, employees: if your employer is a CashPay partner, you are entitled to credit.',
        'sal.b1t': 'Instant advance', 'sal.b1p': 'Request a salary advance and receive it immediately, with no travel or paperwork.',
        'sal.b2t': 'Credit card', 'sal.b2p': 'Your credit can be used with your CashPay card, online and in stores.',
        'sal.b3t': 'Automatic granting', 'sal.b3p': 'The request goes to your company, then approval and granting are automatic through CashPay.',
        'sal.b4t': 'Automated repayment', 'sal.b4p': 'On each due date, the amount is debited from your CashPay account. No delays, no penalties.',
        'sal.b5t': 'No personal guarantee', 'sal.b5p': 'For an employee of a partner company, the company acts as guarantor. You provide no collateral.',
        'sal.b6t': 'Financing management', 'sal.b6p': 'Track your credits, due dates and balance from the app.',
        'sal.how.t': 'How to get <span class="highlight">an advance</span>?', 'sal.how.sub': 'You are an employee: here are the steps, from request to repayment.',
        'sal.w1t': 'Ask your company', 'sal.w1p': 'Start by asking the company (school, administration, business) where you work. It must be a CashPay partner.',
        'sal.w2t': 'Approval is automatic', 'sal.w2p': 'The request is submitted and processed automatically through CashPay, based on the partnership with your employer.',
        'sal.w3t': 'You are credited instantly', 'sal.w3p': 'The amount arrives in your CashPay account and you can use it right away.',
        'sal.w4t': 'You repay on the due date', 'sal.w4p': 'Deposit money into your account before each due date: repayment is debited automatically, avoiding penalties and delays.',
        'sal.sim.t': 'Simulate your <span class="highlight">repayment</span>', 'sal.sim.sub': 'Type the amount you want: instalments and guarantee are calculated instantly.',
        'sal.sim.partner': 'Partner company employee', 'sal.sim.other': 'Other customer', 'sal.sim.amount': 'Amount requested (USD)',
        'sal.sim.duration': 'Credit duration (months)', 'sal.sim.freq': 'Due date', 'sal.sim.monthly': 'Monthly', 'sal.sim.quarterly': 'Quarterly', 'sal.sim.semester': 'Every 6 months',
        'sal.sim.inst': 'Each instalment', 'sal.sim.n': 'Number of instalments', 'sal.sim.cost': 'Credit cost', 'sal.sim.total': 'Total to repay',
        'sal.sim.keep': 'Balance needed before each due date', 'sal.sim.guar': 'Guarantee to set aside',
        'sal.sim.legal': 'Indicative, non-binding simulation. Final terms are set with CashPay and, where applicable, your partner company.',
        'sal.co.t': 'Companies: <span class="highlight">become a partner</span>', 'sal.co.sub': 'Schools, administrations, businesses: offer your teams salary on CashPay and salary advances.',
        'sal.co1t': 'How it works', 'sal.co1a': 'You contact CashPay and we sign a partnership agreement.', 'sal.co1b': 'Your employees have a CashPay account and receive their salary on it.',
        'sal.co1c': 'When an employee requests an advance, you validate it, then approval and granting are automatic.', 'sal.co1d': 'Repayments are debited from the employee\'s account on each due date.',
        'sal.co2t': 'The company\'s role', 'sal.co2p': 'The partner company acts as guarantor for its employees: this is what secures repayment, and why no collateral is asked from the employee.',
        'sal.co2q': 'In return, your teams are calmer, more loyal and better protected against financial emergencies.', 'sal.co.cta': 'Become a partner company',
        'sal.tip.t': 'Our advice to <span class="highlight">avoid risks</span>', 'sal.tip.sub': 'Borrowing can help you move forward, if done well. Whether you are an employee or an entrepreneur.',
        'sal.tip1t': 'For employees', 'sal.tip1a': 'Only borrow what you can repay: keep the instalment well below your salary.', 'sal.tip1b': 'Deposit money before the due date to avoid penalties and delays.',
        'sal.tip1c': 'Keep advances for real needs: emergencies, health, school fees, projects. Not comfort spending.', 'sal.tip1d': 'Avoid holding several credits at once.', 'sal.tip1e': 'Keep a small emergency saving.',
        'sal.tip2t': 'For entrepreneurs', 'sal.tip2a': 'Keep business money and personal money separate.', 'sal.tip2b': 'Borrow to invest (stock, equipment), not to cover everyday expenses.',
        'sal.tip2c': 'Plan your cash flow: work out your income before each due date.', 'sal.tip2d': 'Start small, repay, then grow step by step.', 'sal.tip2e': 'Keep an account book and review your numbers every week.',
        'sal.cta.t': 'Ready to receive your salary on CashPay?', 'sal.cta.d': 'Talk to your employer, or write to us to become a partner company.',
        'sal.sim.note.partner': 'Your partner company acts as guarantor: no collateral required.', 'sal.sim.note.other': 'Without a partner company, a guarantee must be held in your account.',
        'sal.sim.last': 'The last instalment is adjusted so the total is exact.', 'sal.sim.months': 'months', 'sal.sim.due': 'Month'
    });

    var $ = function (id) { return document.getElementById(id); };
    var form = $('sim'); if (!form) return;
    var amount = $('sim-amount'), range = $('sim-range'), dur = $('sim-duration'), freq = $('sim-freq');
    var mode = 'partner', f = 1;
    var T = function (k, d) { return (window.I18N && I18N.t && I18N.t(k)) || d; };
    var money = function (v) { return '$' + (Math.round(v * 100) / 100).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };

    function sync() {
        var d = Number(dur.value);
        freq.querySelectorAll('button').forEach(function (b) { b.disabled = d % Number(b.dataset.f) !== 0 || Number(b.dataset.f) > d; });
        if (d % f !== 0 || f > d) { f = 1; freq.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.f === '1'); }); }
    }
    function calc() {
        sync();
        var a = Math.max(0, Number(amount.value) || 0), d = Number(dur.value), n = d / f;
        var ok = a >= 10;
        var cost = a * RATE, total = a + cost;
        var inst = Math.ceil(total / n / STEP) * STEP;
        var lastAdj = false, sched = [];
        for (var i = 1; i <= n; i++) {
            var v = i < n ? inst : Math.max(0, total - inst * (n - 1));
            if (i === n && Math.abs(v - inst) > 0.005) lastAdj = true;
            sched.push([i * f, v]);
        }
        var guar = mode === 'partner' ? 0 : Math.ceil(a * GUARANTEE / STEP) * STEP;
        var dash = '—';
        $('o-inst').textContent = ok ? money(inst) : dash;
        $('o-n').textContent = ok ? String(n) : dash;
        $('o-cost').textContent = ok ? money(cost) + ' (' + Math.round(RATE * 100) + ' %)' : dash;
        $('o-total').textContent = ok ? money(total) : dash;
        $('o-keep').textContent = ok ? money(inst) : dash;
        $('o-guar').textContent = ok ? (mode === 'partner' ? money(0) : money(guar)) : dash;
        $('o-note').textContent = !ok ? (document.documentElement.lang === 'en' ? 'Enter at least $10.' : 'Saisissez au moins 10 $.')
            : (mode === 'partner' ? T('sal.sim.note.partner', 'Votre entreprise partenaire se porte garante : aucune caution n\'est demandée.') : T('sal.sim.note.other', 'Sans entreprise partenaire, une garantie doit être disponible sur votre compte.')) +
              (lastAdj ? ' ' + T('sal.sim.last', 'La dernière échéance est ajustée pour que le total soit exact.') : '');
        $('o-sched').innerHTML = ok ? sched.map(function (s) { return '<li>' + T('sal.sim.due', 'Mois') + ' ' + s[0] + ' : <b>' + money(s[1]) + '</b></li>'; }).join('') : '';
    }
    amount.addEventListener('input', function () { range.value = Math.min(2000, Number(amount.value) || 10); calc(); });
    range.addEventListener('input', function () { amount.value = range.value; calc(); });
    dur.addEventListener('change', calc);
    freq.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; f = Number(b.dataset.f); freq.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); calc(); });
    form.querySelector('[aria-label="Profil"]').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; mode = b.dataset.mode; this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); calc(); });
    document.addEventListener('langchange', calc);
    // Les durées s'affichent en mois
    function unit() { var m = T('sal.sim.months', 'mois'); Array.prototype.forEach.call(dur.options, function (o) { o.textContent = o.value + ' ' + m; }); }
    unit(); document.addEventListener('langchange', unit);
    calc();
})();
