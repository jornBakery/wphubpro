/* eslint-disable no-unused-vars */
const sdk = require("node-appwrite");
const { getEnv, getAppwriteConfig } = require("../_shared/env");
const { parsePayload } = require("../_shared/request");
const { createClient } = require("../_shared/appwrite");
const { fail, ok } = require("../_shared/response");

module.exports = async ({ req, res, log, error }) => {
  const env = getEnv(req);
  const { endpoint, projectId, apiKey, missing } = getAppwriteConfig(req);

  if (missing.length > 0) {
    error("Function environment variables are not configured correctly.");
    const available = Object.keys(env || {});
    return fail(res, "Function environment is not configured.", 500, { availableEnvKeys: available });
  }

  const client = createClient(sdk, { endpoint, projectId, apiKey });
  const databases = new sdk.Databases(client);
  const users = new sdk.Users(client);
  const teams = new sdk.Teams(client);

  // Parse payload from request body
  let payload = {};

  try {
    payload = parsePayload(req);
  } catch (e) {
    error("Failed to parse request body: " + e.message);
    return fail(res, "Invalid request body", 400);
  }

  const { category, settings, userId } = payload;

  if (!category || !settings || !userId) {
    error(
      `Missing parameters. Received: category=${category}, userId=${userId}, settings=${JSON.stringify(
        settings
      )}`
    );
    return fail(res, "Missing category, settings, or userId in request body", 400);
  }

  log("Updating settings for category: " + category);
  log("User ID: " + userId);

  try {
    // Check if user is member of admin team
    let isAdmin = false;
    try {
      const adminTeamId = "admin";
      const memberships = await teams.listMemberships(adminTeamId);
      isAdmin = memberships.memberships.some((m) => m.userId === userId);
      log(
        "User admin check - Team memberships found: " + memberships.total + ", isAdmin: " + isAdmin
      );
    } catch (teamErr) {
      log("Could not check team membership: " + teamErr.message);
      // Fallback to label check for backwards compatibility
      const user = await users.get(userId);
      isAdmin = user.labels?.some(
        (l) => l.toLowerCase() === "admin" || l.toLowerCase() === "administrator"
      );
      log(
        "User admin check (fallback) - Labels: " +
          JSON.stringify(user.labels) +
          ", isAdmin: " +
          isAdmin
      );
    }

    if (!isAdmin) {
      log("User " + userId + " is not an admin");
      return fail(res, "Forbidden: Admin access required", 403);
    }

    log("User is admin, proceeding with settings update");

    const DATABASE_ID = "platform_db";
    const COLLECTION_ID = "platform_settings";
    const valueStr = JSON.stringify(settings);

    log("Querying for existing settings with key: " + category);

    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      sdk.Query.equal("key", category),
    ]);

    log("Found " + existing.total + " existing documents");

    if (existing.total > 0) {
      log("Updating existing document: " + existing.documents[0].$id);
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.documents[0].$id, {
        value: valueStr,
      });
      log("Settings updated successfully for category: " + category);
      return ok(res, { success: true, message: "Settings updated" });
    } else {
      log("Creating new document for category: " + category);
      const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, sdk.ID.unique(), {
        key: category,
        value: valueStr,
      });
      log("Settings created successfully with ID: " + newDoc.$id);
      return ok(res, { success: true, message: "Settings created" });
    }
  } catch (e) {
    error(e.message);
    return fail(res, e.message, 500);
  }
};
