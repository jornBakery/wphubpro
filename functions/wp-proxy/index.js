/* eslint-disable no-unused-vars */
const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const crypto = require('crypto');

function safeCompare(a, b) {
  return String(a || '') === String(b || '');
}

/** Decrypt api_key stored in format iv:encrypted:tag */
function decryptApiKey(encrypted, key) {
  if (!encrypted || typeof encrypted !== 'string' || !key) return encrypted;
  const parts = encrypted.split(':');
  if (parts.length !== 3 || !/^[a-f0-9]+$/i.test(parts[0]) || !/^[a-f0-9]+$/i.test(parts[2])) {
    return encrypted;
  }
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

  if (!APPWRITE_FUNCTION_ENDPOINT || !APPWRITE_FUNCTION_PROJECT_ID || !APPWRITE_FUNCTION_API_KEY) {
    error("Environment variables are not set.");
    return res.json({ success: false, message: 'Function environment is not configured.' }, 500);
  }

  client
    .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
    .setProject(APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(APPWRITE_FUNCTION_API_KEY);

  let payload = {};
  try {
    if (req && typeof req.payload === 'string' && req.payload.length) {
      payload = JSON.parse(req.payload);
    } else if (req && typeof req.payload === 'object' && req.payload) {
      payload = req.payload;
    }
  } catch (e) {
    error('Failed to parse payload.');
    return res.json({ success: false, message: 'Invalid request body.' }, 400);
  }

  const siteId = payload.siteId || (req && req.query && (req.query.siteId || req.query.site_id));
  const endpoint = payload.endpoint || (req && req.query && req.query.endpoint);
  const method = (payload.method || (req && req.query && req.query.method) || 'GET').toUpperCase();
  const callerUserId = payload.userId || (req && req.query && (req.query.userId || req.query.user_id));

  if (!siteId || !endpoint) {
    return res.json({ success: false, message: 'Missing siteId or endpoint.' }, 400);
  }

  // --- LOGICA VOOR LOSSE DATA ---
  // We kijken of er een 'body' object is. Zo ja, dan gebruiken we die direct als de nieuwe body.
  // Dit zorgt ervoor dat {"body": {"action": "deactivate"}} plat naar WP gaat als {"action": "deactivate"}.
  let finalBody = null;
  if (payload.body) {
    finalBody = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
  } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
    // Indien er geen 'body' key is, filteren we de bekende stuur-parameters eruit
    const { siteId: _s, endpoint: _e, method: _m, userId: _u, api_key: _a, apiKey: _ak, useApiKey: _ua, ...rest } = payload;
    finalBody = rest;
  }

  try {
    const siteDocument = await databases.getDocument('platform_db', 'sites', siteId);
    const site_url = siteDocument.site_url;
    
    let apiKey = siteDocument.api_key || siteDocument.apiKey || siteDocument.password;
    if (apiKey && apiKey.includes(':') && apiKey.split(':').length === 3 && ENCRYPTION_KEY) {
      apiKey = decryptApiKey(apiKey, ENCRYPTION_KEY);
    }

    const incomingKey = (req && req.headers && (req.headers['x-wphub-key'] || req.headers['X-WPHub-Key'])) || payload.api_key || payload.apiKey;
    const ownerMatch = callerUserId && siteDocument.user_id && (siteDocument.user_id === callerUserId);
    const keyMatch = incomingKey && apiKey && safeCompare(incomingKey, apiKey);

    if (!ownerMatch && !keyMatch) {
      return res.json({ success: false, message: 'Forbidden.' }, 403);
    }

    const cleanedEndpoint = String(decodeURIComponent(endpoint)).replace(/^\/+/, '');
    const proxyUrl = `${site_url.replace(/\/$/, '')}/wp-json/${cleanedEndpoint}`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-WPHub-Key': apiKey,
      'User-Agent': 'WPHub-Proxy/1.0'
    };

    const fetchOptions = { method, headers };

    if (finalBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(finalBody);
    }

    log(`[wp-proxy] Sending to WP: ${proxyUrl} Body: ${fetchOptions.body || 'none'}`);

    const proxyResponse = await fetch(proxyUrl, fetchOptions);
    const proxyResponseText = await proxyResponse.text();
    
    let responseData;
    try {
      responseData = JSON.parse(proxyResponseText);
    } catch (e) {
      responseData = proxyResponseText;
    }

    if (!proxyResponse.ok) {
        return res.json({ 
            success: false, 
            message: responseData.message || `WordPress API fout: ${proxyResponse.status}`,
            details: responseData 
        }, proxyResponse.status);
    }

    return res.json(responseData);

  } catch (e) {
    error(`[wp-proxy] 500: ${e.message}`);
    return res.json({ success: false, message: e.message }, 500);
  }
};