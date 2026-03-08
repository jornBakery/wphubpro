import { Client, Account, Databases, Functions, Storage, Teams, Avatars, ID } from 'appwrite';

/**
 * Appwrite Productie Configuratie
 * Waarden uit Vite env (VITE_*) of fallback. Zorg dat .env in project root staat.
 */
export const APPWRITE_ENDPOINT =
  (import.meta as any).env?.APPWRITE_ENDPOINT || 'https://appwrite.code045.nl/v1';
export const APPWRITE_PROJECT_ID =
  (import.meta as any).env?.APPWRITE_PROJECT_ID || '698a55ce00010497b136';

if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.trim() === '') {
  throw new Error(
    'Appwrite project ID ontbreekt. Zet VITE_APPWRITE_PROJECT_ID in .env en herstart de dev server.'
  );
}

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Initialiseer de services voor gebruik in de rest van de applicatie
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);
export const teams = new Teams(client);
export const avatars = new Avatars(client);

export { client, ID };

/**
 * Voorbeeld van het gebruik van een database ID (zoals gedefinieerd in je setup script)
 * Zie: wearecode045/wphubpro.v2/.../appwrite-setup/setup.js
 */
export const DATABASE_ID = 'platform_db';

/**
 * Collectie IDs conform je database schema
 *
 */
export const COLLECTIONS = {
    SITES: 'sites',
    LIBRARY: 'library',
    SETTINGS: 'platform_settings',
    PLANS: 'plans',
    SUBSCRIPTIONS: 'subscriptions',
    ACCOUNTS: 'accounts'
};
