/* Lecture d'un fichier .env avec les MÊMES règles que Next.js (dotenv + dotenv-expand) :
   guillemets simples = valeur littérale ; guillemets doubles / sans guillemets = « \$ » devient « $ », « $NOM » est remplacé,
   « # commentaire » ignoré hors guillemets. Ainsi un mot de passe qui marche dans CashPay Web marche ici. */
'use strict';
function expand(v, lookup) {
    return v.replace(/(.?)\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (m, pre, name) => (pre === '\\' ? m.slice(1) : pre + (lookup(name) || '')));
}
function parse(text, baseEnv) {
    const out = {}, lookup = n => (n in out ? out[n] : (baseEnv || process.env)[n]);
    String(text).split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m || /^\s*#/.test(line)) return;
        let v = m[2].trim(), q = v[0];
        if ((q === "'" || q === '"' || q === '`') && v.lastIndexOf(q) > 0) {
            v = v.slice(1, v.lastIndexOf(q));
            if (q === '"') v = expand(v.replace(/\\n/g, '\n').replace(/\\r/g, '\r'), lookup);
        } else {
            v = expand(v.replace(/\s+#.*$/, '').trim(), lookup);
        }
        out[m[1]] = v;
    });
    return out;
}
/** Écrit une valeur de façon sûre pour parse() : guillemets simples (littéral). */
function quote(v) { if (v.indexOf("'") !== -1) throw new Error("valeur avec une apostrophe : à saisir à la main"); return "'" + v + "'"; }
module.exports = { parse, quote };
