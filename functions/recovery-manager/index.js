import { Client, Databases } from 'node-appwrite';
import jwt from 'jsonwebtoken';

/**
 * WPHubPro Recovery Manager
 * Deze functie faciliteert noodherstel acties (logs ophalen/plugins deactiveren)
 * via een beveiligde JWT verbinding met de WordPress MU-plugin.
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

    // Bepaal de URL en de geheime sleutel
    const targetUrl = site.site_url;
    const siteApiKey = site.api_key;

    if (!targetUrl) throw new Error('Site URL niet gevonden in database.');
    if (!siteApiKey) throw new Error('Geen WPHubPro API key gevonden voor deze site.');

    // 3. Genereer de JWT (Shared Secret Authentication)
    // We sturen de actie en eventueel de plugin_slug mee in de payload
    const token = jwt.sign(
      {
        action,
        plugin_slug: plugin_slug || null,
        exp: Math.floor(Date.now() / 1000) + 60 // 60 seconden geldig
      },
      siteApiKey
    );

    log(`Verbinding maken met: ${targetUrl}`);

    // 4. Voer het request uit naar de WordPress site
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-WPHubPro-Recovery': 'true',
        'Accept': 'application/json'
      }
    });

    // Haal de rauwe tekst op om HTML-vervuiling te kunnen debuggen
    const responseText = await response.text();
    
    try {
      // Probeer de response te parsen als JSON
      const data = JSON.parse(responseText);
      
      log(`Succesvolle communicatie met WordPress agent.`);
      return res.json({ 
        success: true, 
        data: data 
      });

    } catch (parseError) {
      // Als parsen mislukt, is er waarschijnlijk HTML (error output) teruggestuurd
      error(`JSON Parse fout. Ontvangen data: ${responseText.substring(0, 500)}`);
      
      return res.json({ 
        success: false, 
        message: 'De WordPress site stuurde HTML terug in plaats van JSON. Dit gebeurt vaak bij Fatal Errors die de output vervuilen.',
        rawResponse: responseText.substring(0, 200)
      }, 500);
    }

  } catch (err) {
    error(`Recovery Manager Fout: ${err.message}`);
    return res.json({ 
      success: false, 
      message: err.message 
    }, 500);
  }
};