import { createHash } from 'node:crypto';
import { emailAddress, fault } from './config.mjs';

export const MAX_FILE = 5 * 1024 * 1024;
export const MAX_FILES_TOTAL = 15 * 1024 * 1024;
export const MAX_REQUEST = 20 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEXT_FIELDS = ['countryCode','provinceId','positionId','lastName','postName','firstName','email','phone','age','message','consent','idempotencyKey','website'];
const issue = (field, message) => { throw fault(400, 'INVALID_APPLICATION', message, { [field]: message }); };
function value(form, key, max, required = false) {
  const all = form.getAll(key);
  if (all.length > 1 || (all.length && typeof all[0] !== 'string')) issue(key, 'Champ de candidature invalide.');
  const result = (all[0] || '').normalize('NFC').trim();
  if (result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result) || (required && !result)) issue(key, 'Veuillez renseigner ce champ correctement.');
  return result;
}
function originalName(name) { return String(name || 'document.pdf').normalize('NFC').replace(/[\r\n\u0000-\u001f\u007f/\\]/g, '_').slice(0, 160); }
async function pdf(file, kind, index) {
  if (!file || typeof file === 'string' || !Number.isFinite(file.size) || !file.size) issue(kind, 'Ajoutez un document PDF.');
  if (file.size > MAX_FILE) throw fault(413, 'FILE_TOO_LARGE', 'Chaque document doit faire au maximum 5 Mio.', { [kind]: 'Document trop volumineux.' });
  if (!/\.pdf$/i.test(file.name || '') || !['', 'application/pdf', 'application/octet-stream'].includes(file.type || '')) issue(kind, 'Le format PDF est requis.');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.toString('ascii', 0, 5) !== '%PDF-') issue(kind, 'Le fichier ne semble pas être un document PDF.');
  const storedName = kind === 'cv' ? 'cv.pdf' : `document-${index}.pdf`;
  return { kind, storedName, originalName: originalName(file.name), size: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'), buffer };
}
export async function validateApplication(form, catalog) {
  for (const [key] of form) if (![...TEXT_FIELDS, 'cv', 'documents'].includes(key)) issue('form', 'Champ inattendu dans la candidature.');
  const countryCode = value(form, 'countryCode', 2, true);
  const provinceId = value(form, 'provinceId', 80, true);
  const positionId = value(form, 'positionId', 80, true);
  const country = catalog.countries.find(item => item.code === countryCode && item.available === true);
  if (!country) issue('countryCode', 'Les candidatures sont actuellement ouvertes en République démocratique du Congo.');
  const province = country.provinces.find(item => item.id === provinceId);
  if (!province) issue('provinceId', 'Sélectionnez une province proposée pour ce pays.');
  const position = catalog.positions.find(item => item.id === positionId);
  if (!position) issue('positionId', 'Sélectionnez un poste proposé.');
  const lastName = value(form, 'lastName', 100, true), postName = value(form, 'postName', 100), firstName = value(form, 'firstName', 100, true);
  const email = value(form, 'email', 254, true);
  if (!emailAddress(email)) issue('email', 'Renseignez une adresse e-mail valide.');
  const phone = value(form, 'phone', 40, true);
  if (!/^[+\d][\d\s().-]{5,38}\d$/.test(phone)) issue('phone', 'Renseignez un numéro de téléphone valide.');
  const rawAge = value(form, 'age', 3);
  if (rawAge && (!/^\d{1,3}$/.test(rawAge) || Number(rawAge) < 1 || Number(rawAge) > 120)) issue('age', 'Renseignez un âge valide.');
  const age = rawAge ? Number(rawAge) : null;
  const message = value(form, 'message', 5000, true);
  if (message.length < 10) issue('message', 'Votre message doit contenir au moins 10 caractères.');
  if (value(form, 'consent', 5, true) !== 'true') issue('consent', 'Votre accord est nécessaire pour transmettre votre dossier de candidature.');
  if (value(form, 'website', 200)) issue('website', 'La candidature ne peut pas être traitée.');
  const idempotencyKey = value(form, 'idempotencyKey', 36, true).toLowerCase();
  if (!UUID.test(idempotencyKey)) issue('idempotencyKey', 'Identifiant de soumission invalide. Rechargez la page et réessayez.');
  if (form.getAll('cv').length !== 1) issue('cv', 'Joignez un seul CV au format PDF.');
  const extra = form.getAll('documents').filter(file => typeof file !== 'string' && file.size > 0);
  if (extra.length > 3 || form.getAll('documents').some(file => typeof file === 'string')) issue('documents', 'Joignez au maximum trois documents PDF complémentaires.');
  const incoming = [form.get('cv'), ...extra];
  if (incoming.reduce((sum, file) => sum + (file?.size || 0), 0) > MAX_FILES_TOTAL) throw fault(413, 'FILES_TOO_LARGE', 'Le total des documents ne doit pas dépasser 15 Mio.');
  const files = [await pdf(incoming[0], 'cv', 0)];
  for (let index = 0; index < extra.length; index++) files.push(await pdf(extra[index], 'documents', index + 1));
  const fields = { countryCode, countryName: country.name, provinceId, provinceName: province.name, positionId, positionTitle: position.title, lastName, postName, firstName, email, phone, age, message, consent: true };
  const digest = createHash('sha256').update(JSON.stringify({ fields, files: files.map(({buffer,...file}) => file) })).digest('hex');
  return { idempotencyKey, fields, files, digest };
}
