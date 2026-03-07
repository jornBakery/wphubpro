import { Client, Databases } from 'node-appwrite';
import jwt from 'jsonwebtoken';

/**
 * WPHubPro Recovery Manager
 * Deze functie faciliteert noodherstel acties via een beveiligde JWT verbinding.
 * Werkt met Nginx door het token zowel in de header als in de URL mee te sturen.
 */
export default async ({ req, res, log, error }) => {
  // Initialiseer Appwrite Client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // 1. Parse de inkomende request body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.json({ success: false, message: 'Ongeldige JSON in request body' }, 400);
  }

  const { siteId, action, plugin_slug } = body;

  if (!siteId || !action) {
    return res.json({ success: false, message: 'siteId en action zijn verplicht' }, 400);
  }

  try {
    log(`Start herstelactie [${action}] voor siteId: ${siteId}`);

    // 2. Haal site gegevens op uit de database
    const site = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SITES_COLLECTION_ID,
      siteId
    );

    // Bepaal de URL en de geheime sleutel (Shared Secret)
    const targetUrl = site.siteUrl || site.url;
    const siteApiKey = site.wphubpro_api_key;

    if (!targetUrl) throw new Error('Site URL niet gevonden in database.');
    if (!siteApiKey) throw new Error('Geen WPHubPro API key gevonden voor deze site.');

    // 3. Genereer de JWT
    const token = jwt.sign(
      {
        action,
        plugin_slug: plugin_slug || null,
        exp: Math.floor(Date.now() / 1000) + 60 // 60 seconden geldig
      },
      siteApiKey
    );

    // 4. Bereid de URL voor met token parameter (Fallback voor Nginx/Hostings die headers strippen)
    const urlWithToken = new URL(targetUrl);
    urlWithToken.searchParams.append('wphub_token', token);

    log(`Verbinding maken met: ${urlWithToken.origin} (via URL parameter fallback)`);

    // 5. Voer het request uit naar de WordPress site
    const response = await fetch(urlWithToken.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Altijd meesturen voor servers die het wel ondersteunen
        'X-WPHubPro-Recovery': 'true',
        'Accept': 'application/json'
      }
    });