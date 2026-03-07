import { Client, Databases } from 'node-appwrite';
import jwt from 'jsonwebtoken';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID) // Controleer of je PROJECT_ID of FUNCTION_PROJECT_ID gebruikt
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // 1. Parse de inkomende data van de frontend
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.json({ success: false, message: 'Ongeldige JSON in request body' }, 400);
  }

  const { siteId, action, plugin_slug } = body;

  try {
    log(`Start herstelactie voor siteId: ${siteId}`);

    // 2. Haal de site doc op uit de collectie
    const site = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SITES_COLLECTION_ID,
      siteId
    );

    // Bepaal de URL van de site (controleer of je veld 'siteUrl' of 'url' heet in je DB)
    const targetUrl = site.siteUrl || site.site_url;
    const siteApiKey = site.api_key;

    if (!targetUrl) throw new Error('Site URL niet gevonden in database.');
    if (!siteApiKey) throw new Error('Geen API key gevonden voor deze site.');

    // 3. Genereer de JWT
    const token = jwt.sign(
      {
        action,
        plugin_slug: plugin_slug || null,
        exp: Math.floor(Date.now() / 1000) + 60 // 1 minuut geldig
      },
      siteApiKey
    );

    log(`Request versturen naar: ${targetUrl} met actie: ${action}`);

    // 4. Communiceer met de WordPress site
    // Let op: we gebruiken targetUrl hier
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-WPHubPro-Recovery': 'true'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      error(`WP Site gaf foutmelding: ${response.status} - ${errorText}`);
      // Zelfs bij een 500 willen we soms doorgaan als de MU-plugin JSON teruggeeft
    }

    const data = await response.json();
    return res.json({ success: true, data });

  } catch (err) {
    error(`Fout in recovery function: ${err.message}`);
    return res.json({ success: false, message: err.message }, 500);
  }
};