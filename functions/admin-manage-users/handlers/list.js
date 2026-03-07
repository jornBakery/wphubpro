const sdk = require("node-appwrite");

module.exports = async function handleList({ req, res, log, error }, { client, databases }) {
  const payload = req._parsedPayload || {};
  const limit = Number.isFinite(Number(payload.limit))
    ? Math.max(1, Math.min(100, Number(payload.limit)))
    : 100;
  const offset = Number.isFinite(Number(payload.offset))
    ? Math.max(0, Number(payload.offset))
    : 0;
  const search = typeof payload.search === "string" ? payload.search.trim() : "";

  const users = new sdk.Users(client);
  const queries = [sdk.Query.limit(limit), sdk.Query.offset(offset)];

  log(`Listing users: limit=${limit}, offset=${offset}, search=${search || "none"}`);

  const response = search ? await users.list(queries, search) : await users.list(queries);
  const rawUsers = response.users || response.documents || [];

  const DATABASE_ID = req.variables?.APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || "platform_db";
  const ACCOUNTS_COLLECTION_ID = req.variables?.ACCOUNTS_COLLECTION_ID || process.env.ACCOUNTS_COLLECTION_ID || "accounts";

  let userAccounts = {};
  try {
    const userIds = rawUsers.map((u) => u.$id || u.id).filter((id) => id);
    if (userIds.length > 0) {
      const accountsResponse = await databases.listDocuments(
        DATABASE_ID,
        ACCOUNTS_COLLECTION_ID,
        [sdk.Query.equal("user_id", userIds), sdk.Query.limit(Math.min(100, userIds.length))]
      );
      accountsResponse.documents.forEach((doc) => {
        userAccounts[doc.user_id] = {
          currentPlanId: doc.current_plan_id || null,
          stripeCustomerId: doc.stripe_customer_id || null,
          avatar: doc.avatar || null,
        };
      });
    }
  } catch (e) {
    log("Could not fetch accounts for mapping: " + e.message);
  }

  const formatted = rawUsers.map((user) => {
    const labels = Array.isArray(user.labels) ? user.labels : [];
    const isAdmin = labels.some((label) => String(label).toLowerCase() === "admin");
    const accountInfo = userAccounts[user.$id || user.id];
    return {
      id: user.$id || user.id,
      name: user.name || user.email || `User ${(user.$id || user.id || "").substring(0, 8)}`,
      email: user.email || "N/A",
      role: isAdmin ? "Admin" : "User",
      isAdmin,
      planName: accountInfo?.currentPlanId || "Free Tier",
      stripeId: accountInfo?.stripeCustomerId || "n/a",
      status: user.status === false ? "Inactive" : "Active",
      joined: user.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "n/a",
      prefs: user.prefs || {},
      avatar: accountInfo?.avatar || (user.prefs && user.prefs.avatar) || null,
    };
  });

  return res.json({
    success: true,
    users: formatted,
    total: response.total || formatted.length,
    limit,
    offset,
  });
};
