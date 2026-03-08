const sdk = require("node-appwrite");

/**
 * Admin Get User Function
 * Fetches a single Appwrite user by id and augments with account/plan info.
 *
 * Environment Variables Required:
 * - APPWRITE_ENDPOINT
 * - APPWRITE_PROJECT_ID
 * - APPWRITE_API_KEY (users.read)
 * - DATABASE_ID (optional)
 * - ACCOUNTS_COLLECTION_ID (optional)
 *
 * Request Payload:
 * - userId: string (required)
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    const APPWRITE_ENDPOINT = req.variables?.APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID =
      req.variables?.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const APPWRITE_API_KEY = req.variables?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;

    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
      error("Appwrite configuration missing");
      return res.json({ success: false, message: "Appwrite config missing" }, 500);
    }

    let payload = {};
    try {
      // Accept several forms Appwrite may pass the execution body in:
      // - req.payload (string or object)
      // - req.body (string or object)
      // - req.payload.body or req.body.body (stringified json)
      const raw =
        typeof req.payload !== "undefined"
          ? req.payload
          : typeof req.body !== "undefined"
          ? req.body
          : undefined;

      if (typeof raw === "string") {
        try {
          payload = JSON.parse(raw);
        } catch (e) {
          // sometimes the raw is a JSON string wrapped; try to strip
          const stripped = raw.replace(/^"|"$/g, "");
          try {
            payload = JSON.parse(stripped);
          } catch (e2) {
            payload = {};
          }
        }
      } else if (raw && typeof raw === "object") {
        // If Appwrite wrapped the body under a 'body' key
        if (raw.body && typeof raw.body === "string") {
          try {
            payload = JSON.parse(raw.body);
          } catch (e) {
            payload = raw.body;
          }
        } else if (raw.payload && typeof raw.payload === "string") {
          try {
            payload = JSON.parse(raw.payload);
          } catch (e) {
            payload = raw.payload;
          }
        } else {
          payload = raw;
        }
      }
    } catch (e) {
      payload = {};
    }

    const userId = payload.userId || payload.id || (payload.body && payload.body.userId) || (payload.payload && payload.payload.userId);
    if (!userId) return res.json({ success: false, message: "Missing userId" }, 400);

    const client = new sdk.Client();
    client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

    const users = new sdk.Users(client);
    const databases = new sdk.Databases(client);

    log(`Fetching user ${userId}`);
    const user = await users.get(userId);

    // Try to fetch account/plan info from the accounts collection
    const APPWRITE_DATABASE_ID =
      req.variables?.APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || "platform_db";
    const ACCOUNTS_COLLECTION_ID =
      req.variables?.ACCOUNTS_COLLECTION_ID || process.env.ACCOUNTS_COLLECTION_ID || "accounts";

    let accountInfo = null;
    try {
      const accountsResp = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        ACCOUNTS_COLLECTION_ID,
        [sdk.Query.equal("user_id", userId), sdk.Query.limit(1)]
      );
      accountInfo = accountsResp.documents && accountsResp.documents[0];
    } catch (e) {
      log("Could not fetch account info: " + (e.message || e));
      accountInfo = null;
    }

    // Ensure avatar exists in account document; if missing, generate a DiceBear URL and persist it
    try {
      const avatarField = accountInfo?.avatar || (user.prefs && user.prefs.avatar) || null;
      if (!avatarField) {
        const avatarUrl = `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
          userId
        )}&size=128`;

        if (accountInfo && accountInfo.$id) {
          try {
            await databases.updateDocument(
              APPWRITE_DATABASE_ID,
              ACCOUNTS_COLLECTION_ID,
              accountInfo.$id,
              { ...accountInfo, avatar: avatarUrl }
            );
            accountInfo.avatar = avatarUrl;
          } catch (e) {
            log("Failed to update account avatar: " + (e.message || e));
          }
        } else {
          try {
            const newDoc = await databases.createDocument(
              APPWRITE_DATABASE_ID,
              ACCOUNTS_COLLECTION_ID,
              sdk.ID.unique(),
              { user_id: userId, avatar: avatarUrl }
            );
            accountInfo = newDoc;
          } catch (e) {
            log("Failed to create account doc with avatar: " + (e.message || e));
          }
        }
      }
    } catch (e) {
      log("Avatar ensure step failed: " + (e.message || e));
    }

    const labels = Array.isArray(user.labels) ? user.labels : [];
    const isAdmin = labels.some((l) => String(l).toLowerCase() === "admin");

    const formatted = {
      id: user.$id || user.id,
      name: user.name || user.email || `User ${(user.$id || user.id || "").substring(0, 8)}`,
      email: user.email || "N/A",
      role: isAdmin ? "Admin" : "User",
      isAdmin,
      planName: accountInfo?.current_plan_id || "Free Tier",
      stripeId: accountInfo?.stripe_customer_id || null,
      status: user.status === false ? "Inactive" : "Active",
      joined: user.$createdAt ? new Date(user.$createdAt).toISOString() : null,
      prefs: user.prefs || {},
      avatar: accountInfo?.avatar || user.prefs?.avatar || null,
    };

    return res.json({ success: true, user: formatted });
  } catch (err) {
    error(`Failed to get user: ${err.message}`);
    return res.json({ success: false, message: err.message || "Failed to get user" }, 500);
  }
};
