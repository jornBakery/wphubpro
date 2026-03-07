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

module.exports = async ({ req, res, log, error }) => {
  const env = getEnv(req);
  const { endpoint, projectId, apiKey, missing } = getAppwriteConfig(req);
  const ENCRYPTION_KEY = env.ENCRYPTION_KEY;

  if (missing.length > 0 || !ENCRYPTION_KEY) {
    error('Function environment is not configured');
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

  const site_url = (req.query && (req.query.site_url || req.query.siteUrl)) || (payloadObj && (payloadObj.site_url || payloadObj.siteUrl));
  const site_name = (req.query && (req.query.site_name || req.query.siteName)) || (payloadObj && (payloadObj.site_name || payloadObj.siteName));
  const user_id = (req.query && (req.query.userId || req.query.user_id)) || (payloadObj && (payloadObj.userId || payloadObj.user_id));

  if (!site_url || !site_name || !user_id) {
    return fail(res, 'Missing required fields: site_url, site_name, userId', 400);
  }

  // Twee flows:
  // 1) Platform: site aanmaken (alleen site_url/site_name) - geen api_key, die komt later via update-site vanuit Bridge
  // 2) Bridge success: site bestaat nog niet, ConnectSuccessPage roept addSite aan mét api_key - dan hier encrypten en opslaan
  let username = (payloadObj && (payloadObj.username || payloadObj.user)) || (req.query && (req.query.username || req.query.user)) || null;
  let password = (payloadObj && payloadObj.password) || (req.query && req.query.password) || null;
  let api_key = (payloadObj && (payloadObj.api_key || payloadObj.apiKey)) || (req.query && (req.query.api_key || req.query.apiKey)) || null;

  try {
    let encryptedPassword = "";
    let encryptedApiKey = "";

    // api_key (Bridge success flow, site bestaat nog niet) - versleutelen en opslaan
    if (api_key) {
      encryptedApiKey = encrypt(api_key, ENCRYPTION_KEY);
    }

    // Alleen valideren en (optioneel) versleutelen als er username+password zijn meegeleverd
    if (username && password) {
      const url = `${site_url.replace(/\/$/, '')}/wp-json/wp/v2/plugins`;
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      const resp = await fetch(url, { method: 'GET', headers: { 'Authorization': `Basic ${auth}` }, timeout: 10000 });
      
      if (!resp.ok) {
        return fail(res, 'WP validation failed', resp.status);
      }
      encryptedPassword = encrypt(password, ENCRYPTION_KEY);
    }

    const meta_data = (payloadObj && (payloadObj.meta_data || payloadObj.metaData)) || null;
    const document = {
      user_id: user_id,
      site_url: site_url,
      site_name: site_name,
      username: username || "",
      password: encryptedPassword,
      ...(encryptedApiKey ? { api_key: encryptedApiKey } : {}),
      ...(meta_data != null ? { meta_data } : {})
    };

    const created = await databases.createDocument('platform_db', 'sites', sdk.ID.unique(), document);
    return ok(res, { success: true, document: created });
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
};