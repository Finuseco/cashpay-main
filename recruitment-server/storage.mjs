import { mkdir, readFile, writeFile, rename, rm, readdir, stat, chmod, realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve, join, sep } from 'node:path';
import { PROJECT_ROOT, fault } from './config.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function prepareStorage(config) {
  await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
  const actual = await realpath(config.dataDir), publicRoot = await realpath(PROJECT_ROOT);
  if (actual === publicRoot || actual.startsWith(publicRoot + sep)) throw fault(503, 'PRIVATE_STORAGE_REQUIRED', 'Le stockage privé du recrutement doit être corrigé.');
  await chmod(actual, 0o700);
  for (const name of ['applications', 'locks']) { const path = join(actual, name); await mkdir(path, { recursive: true, mode: 0o700 }); await chmod(path, 0o700); }
  return actual;
}
export async function atomicJson(path, data) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' }); await rename(temporary, path); }
  finally { await rm(temporary, { force: true }).catch(() => {}); }
}
export async function locked(config, id, operation, { waitMs = 2500 } = {}) {
  if (!UUID.test(id)) throw fault(400, 'INVALID_REFERENCE', 'Identifiant invalide.');
  const directory = await prepareStorage(config), path = join(directory, 'locks', id);
  const deadline = Date.now() + waitMs;
  for (;;) {
    try { await mkdir(path, { mode: 0o700 }); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const info = await stat(path).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 15 * 60 * 1000) { await rm(path, { recursive: true, force: true }); continue; }
      if (Date.now() >= deadline) throw fault(409, 'APPLICATION_IN_PROGRESS', 'Cette candidature est en cours de traitement. Réessayez dans un instant.');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  try { return await operation(directory); } finally { await rm(path, { recursive: true, force: true }); }
}
export function applicationDirectory(config, id) { if (!UUID.test(id)) throw fault(400, 'INVALID_REFERENCE', 'Identifiant invalide.'); return join(config.dataDir, 'applications', id); }
export async function readRecord(config, id) {
  try { return JSON.parse(await readFile(join(applicationDirectory(config, id), 'record.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function dossierText(record) {
  const a = record.applicant;
  return [
    'CASHPAY ALL — DOSSIER DE CANDIDATURE', `Référence : ${record.reference}`, `Réception : ${record.receivedAt}`,
    '', `Pays : ${a.countryName} (${a.countryCode})`, `Province : ${a.provinceName}`, `Poste : ${a.positionTitle}`,
    '', `Nom : ${a.lastName}`, `Post-nom : ${a.postName || 'Non renseigné'}`, `Prénom : ${a.firstName}`,
    `E-mail : ${a.email}`, `Téléphone : ${a.phone}`, `Âge : ${a.age ?? 'Non renseigné'}`,
    '', 'MESSAGE DU CANDIDAT', a.message, '', 'DOCUMENTS',
    ...record.files.map(file => `${file.kind === 'cv' ? 'CV' : 'Document'} : ${file.originalName} (${file.size} octets)`),
    '', 'Le candidat a accepté la transmission et le traitement de ce dossier à des fins de recrutement.',
  ].join('\n') + '\n';
}
export async function createApplication(config, validated) {
  return locked(config, validated.idempotencyKey, async () => {
    const existing = await readRecord(config, validated.idempotencyKey);
    if (existing) {
      if (existing.requestDigest !== validated.digest) throw fault(409, 'IDEMPOTENCY_CONFLICT', 'Cet identifiant correspond à une autre candidature. Rechargez le formulaire avant un nouvel envoi.');
      return { record: existing, created: false };
    }
    const id = validated.idempotencyKey, path = applicationDirectory(config, id);
    // A crashed request can leave an incomplete directory, but no complete
    // record. The per-application lock prevents another writer using it.
    await rm(path, { force: true, recursive: true });
    await mkdir(path, { mode: 0o700 });
    const record = { schemaVersion: 1, id, reference: `CP-${id.toUpperCase()}`, receivedAt: new Date().toISOString(), requestDigest: validated.digest,
      applicant: validated.fields, files: validated.files.map(({buffer,...file}) => file),
      email: { status: 'pending', attempts: 0, nextAttemptAt: new Date().toISOString(), needsReview: false, lastErrorCode: null } };
    for (const file of validated.files) await writeFile(join(path, file.storedName), file.buffer, { mode: 0o600, flag: 'wx' });
    await writeFile(join(path, 'candidature.txt'), dossierText(record), { mode: 0o600, flag: 'wx' });
    await atomicJson(join(path, 'record.json'), record);
    return { record, created: true };
  });
}
export async function applicationIds(config) { await prepareStorage(config); return (await readdir(join(config.dataDir, 'applications'))).filter(id => UUID.test(id)); }
export async function cleanOldApplications(config, { now = Date.now() } = {}) {
  let removed = 0;
  const cutoff = now - config.retentionDays * 86400000;
  for (const id of await applicationIds(config)) await locked(config, id, async () => {
    const record = await readRecord(config, id);
    if (record && Number.isFinite(Date.parse(record.receivedAt)) && Date.parse(record.receivedAt) < cutoff) { await rm(applicationDirectory(config, id), { recursive: true, force: true }); removed++; }
  });
  return { removed };
}
