/* eslint-disable no-unused-vars */
const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const crypto = require('crypto');

/** Decrypt api_key stored in format iv:encrypted:tag */
function decryptApiKey(encrypted, key) {
  if (!encrypted || typeof encrypted !== 'string' || !key) return encrypted;
  const parts = encrypted.split(':');
  if (parts.length !== 3) return encrypted;
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedBuf = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const derivedKey = crypto.createHash('sha256').update(String(key), 'utf8').digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encryptedBuf), decipher.final()]).toString('utf8');
  } catch (e) {
    return encrypted;
  }
}

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);

  const env = (req && req.variables && Object.keys(req.variables).length) ? req.variables : process.env;

  const APPWRITE_FUNCTION_ENDPOINT = env.APPWRITE_FUNCTION_ENDPOINT || env.APPWRITE_ENDPOINT;
  const APPWRITE_FUNCTION_PROJECT_ID = env.APPWRITE_FUNCTION_PROJECT_ID || env.APPWRITE_PROJECT_ID;
  const APPWRITE_FUNCTION_API_KEY = env.APPWRITE_FUNCTION_API_KEY || env.APPWRITE_API_KEY || env.APPWRITE_KEY;
  const ENCRYPTION_KEY = env.ENCRYPTION_KEY;

  client
    .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
    .setProject(APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(APPWRITE_FUNCTION_API_KEY);

  let payload = {};
  try {
    const rawData = req.payload || req.body || {};
    payload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  } catch (e) {
    return res.json({ success: false, message: 'Invalid JSON payload.' }, 400);
  }

  const siteId = payload.siteId || (req.query && req.query.siteId);

  if (!siteId) {
    return res.json({ success: false, message: 'Missing siteId.' }, 400);
  }

  try {
    const siteDocument = await databases.getDocument('platform_db', 'sites', siteId);
    const site_url = siteDocument.site_url;

    let apiKey = siteDocument.api_key || siteDocument.apiKey || siteDocument.password;
    if (apiKey && apiKey.includes(':') && apiKey.split(':').length === 3 && ENCRYPTION_KEY) {
      apiKey = decryptApiKey(apiKey, ENCRYPTION_KEY);
    }

    if (!apiKey) {
      return res.json({ success: false, message: 'Site has no API key configured.' }, 400);
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-WPHub-Key': apiKey,
      'User-Agent': 'WPHub-Proxy/1.0',
    };

    const detailsUrl = `${site_url.replace(/\/$/, '')}/wp-json/wphubpro/v1/details`;

    log(`[get-site-details] Calling: ${detailsUrl}`);

    const proxyResponse = await fetch(detailsUrl, { method: 'GET', headers });
    const responseText = await proxyResponse.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    if (!proxyResponse.ok) {
      return res.json({
        success: false,
        message: (responseData && responseData.message) ? responseData.message : `Bridge API Error: ${proxyResponse.status}`,
        details: responseData,
      }, proxyResponse.status);
    }

    return res.json(responseData);
  } catch (e) {
    error(`[get-site-details] Error: ${e.message}`);
    return res.json({ success: false, message: e.message }, 500);
  }
};
