/* eslint-disable no-unused-vars */
const sdk = require('node-appwrite');
const fetch = require('node-fetch');
const crypto = require('crypto');

function safeCompare(a, b) {
  return String(a || '') === String(b || '');
}

/** Decrypt api_key stored in format iv:encrypted:tag (from update-site encryption) */
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
  const APPWRITE_FUNCTION_USER_ID = env.APPWRITE_FUNCTION_USER_ID || env.APPWRITE_USER_ID || null;
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
  const method = payload.method || (req && req.query && req.query.method) || 'GET';
  // Body can be: payload.body, req.query.body, or req.payload when it IS the REST body (action/plugin)
  let body = payload.body || (req && req.query && req.query.body);
  if (!body && payload && (payload.action !== undefined || payload.plugin !== undefined)) {
    body = payload;
  }

  if (!siteId || !endpoint) {
    log('[wp-proxy] MISSING siteId or endpoint');
    return res.json({ success: false, message: 'Missing siteId or endpoint.' }, 400);
  }

  log(`[wp-proxy] ACTION: siteId=${siteId} method=${method} endpoint=${endpoint} body=${typeof body === 'string' ? body : (body ? JSON.stringify(body) : '')}`);

  const callerUserId = APPWRITE_FUNCTION_USER_ID || payload.userId || (req && req.query && (req.query.userId || req.query.user_id));

  try {
    const siteDocument = await databases.getDocument('platform_db', 'sites', siteId);

    const site_url = siteDocument.site_url;
    const username = siteDocument.username;
    
    // Gebruik de API Key uit de database; decrypt als versleuteld (iv:encrypted:tag)
    let apiKey = siteDocument.api_key || siteDocument.apiKey || siteDocument.password;
    if (apiKey && apiKey.includes(':') && apiKey.split(':').length === 3 && ENCRYPTION_KEY) {
      apiKey = decryptApiKey(apiKey, ENCRYPTION_KEY);
    }

    // Authenticatiecontrole: matches de beller met de eigenaar, of wordt de juiste X-WPHub-Key meegegeven?
    const incomingKey = (req && req.headers && (req.headers['x-wphub-key'] || req.headers['X-WPHub-Key'])) || payload.api_key || payload.apiKey;

    const ownerMatch = callerUserId && siteDocument.user_id && (siteDocument.user_id === callerUserId);
    const keyMatch = incomingKey && apiKey && safeCompare(incomingKey, apiKey);

    if (!ownerMatch && !keyMatch) {
      log(`[wp-proxy] 403 Forbidden: siteId=${siteId} endpoint=${endpoint}`);
      return res.json({ success: false, message: 'Forbidden. Geen toegang tot deze site.' }, 403);
    }

    // Endpoint opschonen en URL opbouwen
    let decodedEndpoint = endpoint;
    try {
      decodedEndpoint = decodeURIComponent(String(endpoint));
    } catch (e) { /* fallback */ }

    const cleanedEndpoint = String(decodedEndpoint).replace(/^\/+/, '');
    let proxyUrl = `${site_url.replace(/\/$/, '')}/wp-json/${cleanedEndpoint}`;

    // Parse body - WordPress REST API get_param() leest uit JSON body (Content-Type: application/json)
    let bodyObj = null;
    if (body) {
      try {
        bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
      } catch (e) { bodyObj = null; }
    }

    // Headers voorbereiden voor WordPress
    const incomingHeaders = (req && req.headers) ? req.headers : {};
    const headers = {
      'Accept': incomingHeaders['accept'] || 'application/json',
      'User-Agent': incomingHeaders['user-agent'] || 'WPHub-Proxy/1.0',
      'X-WPHub-Key': apiKey, // De Bridge-plugin gebruikt deze header voor validatie
      ...(incomingHeaders['content-type'] ? { 'Content-Type': incomingHeaders['content-type'] } : {}),
      ...(incomingHeaders['x-wp-nonce'] ? { 'X-WP-Nonce': incomingHeaders['x-wp-nonce'] } : {}),
    };


    const fetchOptions = { method, headers };

    // Body afhandeling: voor POST/PUT/PATCH sturen we JSON body met Content-Type: application/json
    if (req && req.rawBody && req.rawBody.length) {
      fetchOptions.body = req.rawBody;
    } else if (bodyObj && typeof bodyObj === 'object' && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(bodyObj);
      headers['Content-Type'] = 'application/json';
    } else if (body && !bodyObj && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    log(`[wp-proxy] Proxying: ${method} ${proxyUrl} body=${fetchOptions.body ? '(present)' : '(none)'}`);
    
    const proxyResponse = await fetch(proxyUrl, fetchOptions);
    const proxyResponseText = await proxyResponse.text();
    
    let responseData;
    try {
      responseData = proxyResponseText ? JSON.parse(proxyResponseText) : null;
    } catch (e) {
      responseData = proxyResponseText;
    }

    log(`[wp-proxy] Response: ${proxyResponse.status} ${proxyUrl}`);
    if (!proxyResponse.ok) {
        const msg = (responseData && typeof responseData === 'object' && responseData.message)
          ? responseData.message
          : (proxyResponseText || `WordPress API fout: ${proxyResponse.status}`);
        error(`[wp-proxy] Error: ${msg}`);
        throw new Error(msg);
    }

    if (typeof responseData === 'string' || responseData === null) {
      return res.json({ text: responseData });
    }

    return res.json(responseData);

  } catch (e) {
    error(`[wp-proxy] 500: ${e.message}`);
    return res.json({ success: false, message: e.message }, 500);
  }
};