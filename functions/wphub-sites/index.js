/* eslint-disable no-unused-vars */
const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const crypto = require('crypto');

function parsePayload(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object") return req.body;
  if (req.payload && typeof req.payload === "object") return req.payload;
  const raw = req.payload || req.bodyRaw || req.body;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed);
  }
  return {};
}

function createClient(sdkLib, { endpoint, projectId, apiKey }) {
  const client = new sdkLib.Client().setEndpoint(endpoint).setProject(projectId);
  if (apiKey) client.setKey(apiKey);
  return client;
}

function ok(res, payload = {}, statusCode = 200) {
  return res.json(payload, statusCode);
}

function fail(res, message, statusCode = 500, extra = {}) {
  return res.json({ success: false, message, ...extra }, statusCode);
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const derivedKey = crypto.createHash('sha256').update(String(key), 'utf8').digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

function getAuthenticatedUserId(req) {
  const headers = req?.headers || {};
  return (
    process.env.APPWRITE_FUNCTION_USER_ID ||
    process.env.APPWRITE_USER_ID ||
    headers['x-appwrite-user-id'] ||
    headers['x-appwrite-function-user-id'] ||
    null
  );
}

function getDataStoreConfig() {
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.DATABASE_ID;
  const sitesCollectionId = process.env.SITES_COLLECTION_ID || 'sites';
  return { databaseId, sitesCollectionId };
}

async function handleCreate(req, res, error, { databases }) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
    return fail(res, 'Function environment is not configured.', 500);
  }

  const payloadObj = req._parsedPayload || {};
  const authUserId = req._authUserId;
  const requestedUserId = (req.query?.userId || req.query?.user_id) || (payloadObj.userId || payloadObj.user_id);
  const site_url = (req.query?.site_url || req.query?.siteUrl) || (payloadObj.site_url || payloadObj.siteUrl);
  const site_name = (req.query?.site_name || req.query?.siteName) || (payloadObj.site_name || payloadObj.siteName);
  const { databaseId, sitesCollectionId } = getDataStoreConfig();

  if (!databaseId) return fail(res, 'APPWRITE_DATABASE_ID missing in function environment.', 500);
  if (!authUserId) return fail(res, 'Authentication required.', 401);
  if (requestedUserId && requestedUserId !== authUserId) {
    return fail(res, 'Forbidden: user_id does not match authenticated user.', 403);
  }
  if (!site_url || !site_name) {
    return fail(res, 'Missing required fields: site_url, site_name', 400);
  }

  const username = (payloadObj.username || payloadObj.user) || (req.query?.username || req.query?.user) || null;
  const password = payloadObj.password ?? req.query?.password ?? null;
  const api_key = (payloadObj.api_key || payloadObj.apiKey) || (req.query?.api_key || req.query?.apiKey) || null;

  try {
    let encryptedPassword = '';
    let encryptedApiKey = '';

    if (api_key) {
      encryptedApiKey = encrypt(api_key, ENCRYPTION_KEY);
    }

    if (username && password) {
      const url = `${site_url.replace(/\/$/, '')}/wp-json/wp/v2/plugins`;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Basic ${auth}` }, timeout: 10000 });
      if (!resp.ok) return fail(res, 'WP validation failed', resp.status);
      encryptedPassword = encrypt(password, ENCRYPTION_KEY);
    }

    const meta_data = (payloadObj.meta_data || payloadObj.metaData) ?? null;
    const document = {
      user_id: authUserId,
      site_url,
      site_name,
      username: username || '',
      password: encryptedPassword,
      ...(encryptedApiKey ? { api_key: encryptedApiKey } : {}),
      ...(meta_data != null ? { meta_data } : {}),
    };

    const created = await databases.createDocument(databaseId, sitesCollectionId, sdk.ID.unique(), document);
    return ok(res, { success: true, document: created });
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
}

async function handleUpdate(req, res, error, { databases }) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  const payloadObj = req._parsedPayload || {};
  const authUserId = req._authUserId;
  const siteId = (req.query?.siteId || req.query?.site_id) || (payloadObj.siteId || payloadObj.site_id);
  const updates = req.query?.updates || payloadObj.updates || payloadObj;
  const requestedUserId = (req.query?.userId || req.query?.user_id) || payloadObj.userId || payloadObj.user_id || updates?.userId || updates?.user_id;
  const { databaseId, sitesCollectionId } = getDataStoreConfig();

  if (!databaseId) return fail(res, 'APPWRITE_DATABASE_ID missing in function environment.', 500);
  if (!authUserId) return fail(res, 'Authentication required.', 401);
  if (requestedUserId && requestedUserId !== authUserId) {
    return fail(res, 'Forbidden: user_id does not match authenticated user.', 403);
  }
  if (!siteId) return fail(res, 'Missing siteId to update', 400);
  if (!updates) return fail(res, 'Missing updates payload', 400);

  const hasProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
  const finalUpdates = {};

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

  if (hasProp(updates, 'username')) finalUpdates.username = updates.username;
  else if (hasProp(updates, 'user_login')) finalUpdates.username = updates.user_login;
  else if (hasProp(updates, 'userLogin')) finalUpdates.username = updates.userLogin;

  if (hasProp(updates, 'siteName')) finalUpdates.site_name = updates.siteName;
  else if (hasProp(updates, 'site_name')) finalUpdates.site_name = updates.site_name;

  if (hasProp(updates, 'siteUrl')) finalUpdates.site_url = updates.siteUrl;
  else if (hasProp(updates, 'site_url')) finalUpdates.site_url = updates.site_url;

  if (hasProp(updates, 'meta_data')) finalUpdates.meta_data = updates.meta_data;

  if (!finalUpdates || Object.keys(finalUpdates).length === 0) {
    return fail(res, 'No update fields provided', 400);
  }

  try {
    const existing = await databases.getDocument(databaseId, sitesCollectionId, siteId);
    if (existing?.user_id !== authUserId) {
      return fail(res, 'Forbidden: cannot update a site owned by another user.', 403);
    }
    const updated = await databases.updateDocument(databaseId, sitesCollectionId, siteId, finalUpdates);
    return ok(res, { success: true, document: updated });
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
}

module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_KEY;

  if (!endpoint || !projectId || !apiKey) return fail(res, 'Function environment is not configured.', 500);

  const client = createClient(sdk, { endpoint, projectId, apiKey });
  const databases = new sdk.Databases(client);

  let payloadObj = {};
  try {
    payloadObj = parsePayload(req);
  } catch (_parseErr) {
    return fail(res, 'Invalid request body. JSON expected.', 400);
  }

  req._parsedPayload = payloadObj;
  req._authUserId = getAuthenticatedUserId(req);
  const action = (req.query?.action || payloadObj.action || '').toLowerCase();

  if (action === 'create') return handleCreate(req, res, error, { databases });
  if (action === 'update') return handleUpdate(req, res, error, { databases });
  return fail(res, 'Invalid or missing action. Use action: "create" or "update".', 400);
};
