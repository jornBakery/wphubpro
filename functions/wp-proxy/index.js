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
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_KEY;
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return fail(res, 'Function environment is not configured.', 500);
  }

  const client = createClient(sdk, { endpoint, projectId, apiKey });
  const databases = new sdk.Databases(client);

  let payload = {};
  try {
    payload = parsePayload(req);
  } catch (e) {
    return fail(res, 'Invalid JSON payload.', 400);
  }

  let query = req.query ? { ...req.query } : {};
  const pathStr = req.path || req.url || '';
  if (pathStr.includes('?')) {
    const idx = pathStr.indexOf('?');
    const qs = pathStr.slice(idx + 1);
    try {
      const params = new URLSearchParams(qs);
      params.forEach((v, k) => { if (!query[k]) query[k] = v; });
    } catch (_) {}
  }
  const siteId = payload.siteId || query.siteId;
  const wpPath = payload.endpoint || query.endpoint;
  const method = (payload.method || query.method || 'GET').toUpperCase();

  if (!siteId || !wpPath) {
    return fail(res, 'Missing siteId or endpoint.', 400);
  }

  // --- CRUCIALE FIX: Zoek action/plugin op meerdere niveaus ---
  const wpAction = payload.action || (payload.body && payload.body.action);
  const wpPlugin = payload.plugin || (payload.body && payload.body.plugin);

  try {
    const siteDocument = await databases.getDocument('platform_db', 'sites', siteId);
    const site_url = siteDocument.site_url;

    let wpApiKey = siteDocument.api_key ?? siteDocument.apiKey ?? siteDocument.password;
    if (siteDocument.data && typeof siteDocument.data === 'object') {
      wpApiKey = wpApiKey ?? siteDocument.data.api_key ?? siteDocument.data.apiKey;
    }
    const docKeys = Object.keys(siteDocument).filter((k) => !k.startsWith('$'));
    log(`[wp-proxy] site doc keys: ${docKeys.join(', ')}`);

    const looksEncrypted = wpApiKey && typeof wpApiKey === 'string' && wpApiKey.includes(':') && wpApiKey.split(':').length === 3;
    const hasEncKey = !!ENCRYPTION_KEY;
    if (wpApiKey && looksEncrypted && hasEncKey) {
      const before = wpApiKey;
      wpApiKey = decryptApiKey(wpApiKey, ENCRYPTION_KEY);
      const decryptionOk = wpApiKey !== before && /^[a-zA-Z0-9]+$/.test(wpApiKey || '');
      log(`[wp-proxy] api_key: present, encrypted=${looksEncrypted}, decrypted=${decryptionOk}, len=${(wpApiKey || '').length}`);
      if (!decryptionOk) {
        error('[wp-proxy] api_key decryption may have failed - key format unexpected. Check ENCRYPTION_KEY matches create-site/update-site.');
      }
    } else {
      log(`[wp-proxy] api_key: present=${!!wpApiKey}, encrypted=${looksEncrypted}, hasEncKey=${hasEncKey}`);
    }

    if (!wpApiKey || typeof wpApiKey !== 'string' || !wpApiKey.trim()) {
      error('[wp-proxy] No api_key found for site. Connect the site via WPHubPro Bridge (Nu Koppelen) and ensure the platform saves the key.');
      return fail(res, 'Site has no API key. Connect via WPHubPro Bridge first.', 400);
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-WPHub-Key': wpApiKey,
      'X-WPHub-Action': wpAction || '',
      'X-WPHub-Plugin': wpPlugin || '',
      'User-Agent': 'WPHub-Proxy/1.0'
    };

    const cleanedEndpoint = String(decodeURIComponent(wpPath)).replace(/^\/+/, '');
    const proxyUrl = `${site_url.replace(/\/$/, '')}/wp-json/${cleanedEndpoint}`;

    const fetchOptions = { method, headers };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        // Stuur alleen de relevante body door naar WP (zonder proxy metadata)
        let bodyData = payload.body || payload;
        if ((!bodyData || Object.keys(bodyData).length === 0) && query.body) {
          bodyData = typeof query.body === 'string' ? JSON.parse(query.body) : query.body;
        }
        const { siteId: _s, endpoint: _e, method: _m, userId: _u, ...restBody } = (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData);
        fetchOptions.body = JSON.stringify(restBody);
    }

    log(`[wp-proxy] Calling WP: ${method} ${proxyUrl}`);
    log(`[wp-proxy] Action Header: ${wpAction}`);

    const proxyResponse = await fetch(proxyUrl, fetchOptions);
    const responseText = await proxyResponse.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    if (!proxyResponse.ok) {
        return fail(res, (responseData && responseData.message) ? responseData.message : `WP API Error: ${proxyResponse.status}`, proxyResponse.status, {
            success: false, 
            details: responseData 
        });
    }

    return ok(res, responseData);

  } catch (e) {
    error(`[wp-proxy] Error: ${e.message}`);
    return fail(res, e.message, 500);
  }
};