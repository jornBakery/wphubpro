const sdk = require("node-appwrite");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);

  const env = req?.variables || process.env;
  const APPWRITE_ENDPOINT = env.APPWRITE_ENDPOINT;
  const APPWRITE_PROJECT_ID = env.APPWRITE_PROJECT_ID;
  const APPWRITE_API_KEY = env.APPWRITE_API_KEY;
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  const DATABASE_ID = env.APPWRITE_DATABASE_ID || env.DATABASE_ID || "platform_db";
  const ACCOUNTS_COLLECTION_ID = env.ACCOUNTS_COLLECTION_ID || "accounts";

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !STRIPE_SECRET_KEY || !DATABASE_ID || !ACCOUNTS_COLLECTION_ID) {
    error("Missing environment variables. Please check your function settings.");
    return res.json({ error: "Internal Server Error: Missing configuration." }, 500);
  }

  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

  try {
    let user;
    if (req.env && req.env["APPWRITE_FUNCTION_EVENT_DATA"]) {
      user = JSON.parse(req.env["APPWRITE_FUNCTION_EVENT_DATA"]);
    } else {
      let payload = {};
      try {
        if (req.payload && typeof req.payload === "string") payload = JSON.parse(req.payload);
        else if (req.payload && typeof req.payload === "object") payload = req.payload;
      } catch (e) {
        payload = {};
      }
      if (payload.action === "create" && payload.user) {
        user = payload.user;
      } else {
        return res.json({ error: "Expected users.create event or action: create with user" }, 400);
      }
    }

    if (!user.email) {
      log(`User ${user.$id} has no email, skipping Stripe customer creation.`);
      return res.json({ success: false, message: "User has no email." });
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { appwrite_user_id: user.$id },
    });

    const accountData = { user_id: user.$id, stripe_customer_id: customer.id };
    const permissions = [
      sdk.Permission.read(sdk.Role.user(user.$id)),
      sdk.Permission.update(sdk.Role.user(user.$id)),
      sdk.Permission.read(sdk.Role.team("admin")),
      sdk.Permission.update(sdk.Role.team("admin")),
      sdk.Permission.delete(sdk.Role.team("admin")),
    ];

    await databases.createDocument(DATABASE_ID, ACCOUNTS_COLLECTION_ID, sdk.ID.unique(), accountData, permissions);

    return res.json({
      success: true,
      message: `Stripe customer created for user ${user.$id}.`,
      stripeCustomerId: customer.id,
    });
  } catch (err) {
    error("Failed to create stripe customer:", err);
    return res.json({ error: err.message }, 500);
  }
};
