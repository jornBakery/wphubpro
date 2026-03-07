import { Client, Databases } from 'node-appwrite';
import jwt from 'jsonwebtoken';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Payload van de frontend (React)
  const { siteId, action, plugin_slug } = JSON.parse(req.body);

  try {
    // Voeg dit toe bovenaan je try-block in de Appwrite Function index.js
log(`Start herstelactie voor site: ${siteId}`);
log(`Actie: ${action}`);

// Vlak voor de fetch:
log(`Request versturen naar: ${siteUrl}`);

    // 1. Haal de site doc op uit de collectie (bevat de API key)
    const site = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_SITES_COLLECTION_ID,
      siteId
    );

    if (!site.wphubpro_api_key) {
      throw new Error('Geen API key gevonden voor deze site.');
    }

    // 2. Genereer een JWT die 1 minuut geldig is
    const token = jwt.sign(
      {
        action,
        plugin_slug: plugin_slug || null,
        exp: Math.floor(Date.now() / 1000) + 60
      },
      site.wphubpro_api_key // Jouw shared secret uit de options table
    );

    // 3. Schiet het verzoek naar de WordPress site
    // We gebruiken een GET request met Authorization Bearer header
    const response = await fetch(site.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-WPHubPro-Recovery': 'true' // Extra header voor herkenning
      }
    });

    const data = await response.json();
    return res.json({ success: true, data });

  } catch (err) {
    error(err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};