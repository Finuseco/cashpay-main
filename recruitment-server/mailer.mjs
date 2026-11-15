import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fault } from './config.mjs';
import { locked, readRecord, applicationDirectory, atomicJson, dossierText, applicationIds } from './storage.mjs';

export function createMailer(config, { transport } = {}) {
  let current = transport;
  return {
    async send(record) {
      if (!config.smtpConfigured) throw fault(503, 'MAIL_NOT_CONFIGURED', 'Le service d’envoi des candidatures n’est pas encore configuré.');
      if (!current) { const nodemailer = (await import('nodemailer')).default; current = nodemailer.createTransport(config.smtp); }
      const path = applicationDirectory(config, record.id);
      const attachments = [{ filename: `candidature-${record.id}.txt`, content: Buffer.from(dossierText(record), 'utf8'), contentType: 'text/plain; charset=utf-8' }];
      for (const file of record.files) {
        if (!/^(cv|document-[1-3])\.pdf$/.test(file.storedName)) throw Error('Invalid private attachment');
        attachments.push({ filename: file.originalName, content: await readFile(join(path, file.storedName)), contentType: 'application/pdf' });
      }
      const domain = config.from.split('@').at(-1);
      const delivery = await current.sendMail({ from: config.from, to: config.to, replyTo: record.applicant.email,
        subject: `[CashPay recrutement] ${record.applicant.positionTitle} — ${record.applicant.provinceName} — ${record.reference}`,
        messageId: `<recruitment.${record.id}@${domain}>`, text: dossierText(record), attachments,
        disableFileAccess: true, disableUrlAccess: true });
      const accepted = (delivery.accepted || []).map(value => typeof value === 'string' ? value.toLowerCase() : String(value.address || '').toLowerCase());
      if (!accepted.includes(config.to.toLowerCase()) || (delivery.rejected || []).length) throw Error('Recipient not accepted');
    },
    close() { current?.close?.(); },
  };
}
export async function deliverApplication(config, id, mailer, { now = Date.now(), force = false } = {}) {
  return locked(config, id, async () => {
    const record = await readRecord(config, id);
    if (!record) throw fault(404, 'APPLICATION_NOT_FOUND', 'Dossier introuvable.');
    if (record.email.status === 'sent' || record.email.needsReview || (!force && Date.parse(record.email.nextAttemptAt) > now)) return record;
    if (!config.smtpConfigured) return record;
    record.email.attempts += 1;
    const delay = Math.min(24 * 60 * 60 * 1000, 60000 * 2 ** (record.email.attempts - 1));
    record.email.nextAttemptAt = new Date(now + delay).toISOString();
    await atomicJson(join(applicationDirectory(config, id), 'record.json'), record);
    try {
      await mailer.send(record);
      record.email.status = 'sent'; record.email.sentAt = new Date().toISOString(); record.email.lastErrorCode = null; record.email.nextAttemptAt = null;
    } catch {
      record.email.lastErrorCode = 'SMTP_DELIVERY_FAILED';
      record.email.needsReview = record.email.attempts >= config.maxAttempts;
    }
    await atomicJson(join(applicationDirectory(config, id), 'record.json'), record);
    return record;
  });
}
export async function flushQueue(config, mailer, { now = Date.now(), limit = 50 } = {}) {
  if (!config.smtpConfigured) throw fault(503, 'MAIL_NOT_CONFIGURED', 'Le service d’envoi des candidatures n’est pas encore configuré.');
  let inspected = 0, sent = 0, pending = 0;
  for (const id of await applicationIds(config)) {
    const record = await readRecord(config, id);
    if (!record || record.email.status === 'sent' || record.email.needsReview || Date.parse(record.email.nextAttemptAt) > now) continue;
    if (inspected++ >= limit) break;
    try { const result = await deliverApplication(config, id, mailer, { now }); result.email.status === 'sent' ? sent++ : pending++; }
    catch (error) { if (error.code === 'APPLICATION_IN_PROGRESS') pending++; else throw error; }
  }
  return { inspected: Math.min(inspected, limit), sent, pending };
}
