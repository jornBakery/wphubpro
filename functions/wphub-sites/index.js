/* eslint-disable no-unused-vars */
const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const crypto = require('crypto');
const { getEnv, getAppwriteConfig } = require('../_shared/env');
const { parsePayload } = require('../_shared/request');
const { createClient } = require('../_shared/appwrite');
const { fail, ok } = require('../_shared/response');

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const derivedKey = crypto.createHash('sha256').update(String(key), 'utf8').digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

async function handleCreate(req, res, log, error, { env, endpoint, projectId, apiKey, databases }) {
  const ENCRYPTION_KEY = env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
    return fail(res, 'Function environment is not configured.', 500);
  }

  const payloadObj = req._parsedPayload || {};
  const site_url = (req.query?.site_url || req.query?.siteUrl) || (payloadObj.site_url || payloadObj.siteUrl);
  const site_name = (req.query?.site_name || req.query?.siteName) || (payloadObj.site_name || payloadObj.siteName);
  const user_id = (req.query?.userId || req.query?.user_id) || (payloadObj.userId || payloadObj.user_id);

  if (!site_url || !site_name || !user_id) {
    return fail(res, 'Missing required fields: site_url, site_name, userId', 400);
  }

  let username = (payloadObj.username || payloadObj.user) || (req.query?.username || req.query?.user) || null;
  let password = payloadObj.password ?? req.query?.password ?? null;
  let api_key = (payloadObj.api_key || payloadObj.apiKey) || (req.query?.api_key || req.query?.apiKey) || null;

  try {
    let encryptedPassword = '';
    let encryptedApiKey = '';

    if (api_key) {
      encryptedApiKey = encrypt(api_key, ENCRYPTION_KEY);
    }

    if (username && password) {
      const url = `${site_url.replace(/\/$/, '')}/wp-json/wp/v2/plugins`;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      const resp = await fetch(url, { method: 'GET', headers: { 'Authorization': `Basic ${auth}` }, timeout: 10000 });
      if (!resp.ok) {
        return fail(res, 'WP validation failed', resp.status);
      }
      encryptedPassword = encrypt(password, ENCRYPTION_KEY);
    }

    const meta_data = (payloadObj.meta_data || payloadObj.metaData) ?? null;
    const document = {
      user_id,
      site_url,
      site_name,
      username: username || '',
      password: encryptedPassword,
      ...(encryptedApiKey ? { api_key: encryptedApiKey } : {}),
      ...(meta_data != null ? { meta_data } : {}),
    };

    const created = await databases.createDocument('platform_db', 'sites', sdk.ID.unique(), document);
    return ok(res, { success: true, document: created });
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
}

async function handleUpdate(req, res, log, error, { env, endpoint, projectId, apiKey, databases }) {
  const ENCRYPTION_KEY = env.ENCRYPTION_KEY;
  const payloadObj = req._parsedPayload || {};

  log('wphub-sites update payload: ' + JSON.stringify(payloadObj));

  const siteIdFromQuery = req.query?.siteId || req.query?.site_id;
  const siteIdFromPayload = payloadObj.siteId || payloadObj.site_id;
  const updates = req.query?.updates || payloadObj.updates || payloadObj;

  if (!updates) {
    return fail(res, 'Missing updates payload', 400);
  }

  let siteId = siteIdFromQuery || siteIdFromPayload;
  const siteUrlRaw = updates.site_url || updates.siteUrl || updates.siteUrlRaw;
  const finalUpdates = {};
  const hasProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

  let usernameRaw = null;
  if (hasProp(updates, 'username')) usernameRaw = updates.username;
  else if (hasProp(updates, 'user_login')) usernameRaw = updates.user_login;
  else if (hasProp(updates, 'userLogin')) usernameRaw = updates.userLogin;

  let siteNameRaw = null;
  if (hasProp(updates, 'siteName')) siteNameRaw = updates.siteName;
  else if (hasProp(updates, 'site_name')) siteNameRaw = updates.site_name;

  let siteUrlCandidate = siteUrlRaw;
  if (!siteUrlCandidate) {
    if (hasProp(updates, 'siteUrl')) siteUrlCandidate = updates.siteUrl;
    else if (hasProp(updates, 'site_url')) siteUrlCandidate = updates.site_url;
  }

  if (hasProp(updates, 'password')) {
    const rawPass = updates.password;
    if (rawPass === '' || rawPass === null) {
      finalUpdates.password = '';
    } else {
      if (!ENCRYPTION_KEY) return fail(res, 'ENCRYPTION_KEY not configured', 500);
      finalUpdates.password = encrypt(rawPass, ENCRYPTION_KEY);
    }
  }

  if (hasProp(updates, 'api_key') || hasProp(updates, 'apiKey')) {
    const rawKey = hasProp(updates, 'api_key') ? updates.api_key : updates.apiKey;
    if (rawKey === '' || rawKey === null) {
      finalUpdates.api_key = '';
    } else {
      if (!ENCRYPTION_KEY) return fail(res, 'ENCRYPTION_KEY not configured', 500);
      finalUpdates.api_key = encrypt(rawKey, ENCRYPTION_KEY);
    }
  }

  if (usernameRaw !== null) finalUpdates.username = usernameRaw;
  if (siteNameRaw !== null) finalUpdates.site_name = siteNameRaw;
  if (siteUrlCandidate !== null) finalUpdates.site_url = siteUrlCandidate;
  if (hasProp(updates, 'meta_data')) finalUpdates.meta_data = updates.meta_data;

  try {
    if (!siteId && siteUrlCandidate) {
      const decodedUrl = typeof siteUrlCandidate === 'string' ? decodeURIComponent(siteUrlCandidate) : siteUrlCandidate;
      log('Searching for site by URL: ' + decodedUrl);
      const userId = payloadObj.userId || payloadObj.user_id || updates?.userId || updates?.user_id;
      let list;
      try {
        if (userId) {
          list = await databases.listDocuments('platform_db', 'sites', [sdk.Query.equal('user_id', userId)]);
        } else {
          list = await databases.listDocuments('platform_db', 'sites', []);
        }
      } catch (e) {
        log('Error listing documents: ' + e.message);
        list = { total: 0, documents: [] };
      }

      const normalize = (u) => {
        try { return String(u).replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase(); } catch { return String(u); }
      };

      const target = normalize(decodedUrl);
      const found = (list?.documents || []).find(d => normalize((d.site_url || d.siteUrl || '')) === target);
      if (found) {
        siteId = found.$id;
        log('Found existing site id by normalized URL: ' + siteId);
      } else {
        const createData = Object.assign({}, finalUpdates);
        if (!createData.site_url) createData.site_url = decodedUrl;
        const created = await databases.createDocument('platform_db', 'sites', sdk.ID.unique(), createData);
        log('Created new site: ' + JSON.stringify(created));
        return ok(res, { success: true, document: created });
      }
    }
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }

  log('Updating site id: ' + siteId + ' with: ' + JSON.stringify(finalUpdates));

  try {
    if (!siteId) return fail(res, 'Missing siteId to update', 400);
    if (!finalUpdates || Object.keys(finalUpdates).length === 0) {
      log('No updates provided for siteId: ' + siteId);
      return fail(res, 'No update fields provided', 400);
    }

    const updated = await databases.updateDocument('platform_db', 'sites', siteId, finalUpdates);
    return ok(res, { success: true, document: updated });
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
}

module.exports = async ({ req, res, log, error }) => {
  const env = getEnv(req);
  const { endpoint, projectId, apiKey, missing } = getAppwriteConfig(req);

  if (missing.length > 0) {
    return fail(res, 'Function environment is not configured.', 500);
  }

  const client = createClient(sdk, { endpoint, projectId, apiKey });
  const databases = new sdk.Databases(client);

  let payloadObj = {};
  try {
    payloadObj = parsePayload(req);
  } catch (parseErr) {
    return fail(res, 'Invalid request body. JSON expected.', 400);
  }
  req._parsedPayload = payloadObj;

  const action = (req.query?.action || payloadObj.action || '').toLowerCase();

  if (action === 'create') {
    return handleCreate(req, res, log, error, { env, endpoint, projectId, apiKey, databases });
  }
  if (action === 'update') {
    return handleUpdate(req, res, log, error, { env, endpoint, projectId, apiKey, databases });
  }

  return fail(res, 'Invalid or missing action. Use action: "create" or "update".', 400);
};
