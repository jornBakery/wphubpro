const sdk = require("node-appwrite");
const stripe = require("stripe");
const handleList = require("./handlers/list");
const handleUpdate = require("./handlers/update");
const handleLoginAs = require("./handlers/login-as");

function parsePayload(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object") return req.body;
  if (req.bodyRaw && typeof req.bodyRaw === "string") {
    try { return JSON.parse(req.bodyRaw); } catch { return {}; }
  }
  if (req.payload && typeof req.payload === "string") {
    try { return JSON.parse(req.payload); } catch { return {}; }
  }
  if (req.payload && typeof req.payload === "object") return req.payload;
  return {};
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const APPWRITE_ENDPOINT = req.variables?.APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID = req.variables?.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const APPWRITE_API_KEY = req.variables?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;

    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
      error("Appwrite configuration missing");
      return res.json({ success: false, message: "Appwrite config missing" }, 500);
    }

    const payload = parsePayload(req);
    req._parsedPayload = payload;

    const actionRaw = (req.query?.action || payload.action || "").toString().toLowerCase();
    const actionMap = {
      list: "list",
      "list-users": "list",
      update: "update",
      "update-user": "update",
      "login-as": "login-as",
      loginas: "login-as",
      impersonate: "login-as",
    };
    const action = actionMap[actionRaw] || actionRaw;

    const client = new sdk.Client();
    client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
    const databases = new sdk.Databases(client);
    const stripeInstance = process.env.STRIPE_SECRET_KEY ? stripe(process.env.STRIPE_SECRET_KEY) : null;

    const ctx = {
      client,
      databases,
      stripe: stripeInstance,
      APPWRITE_ENDPOINT,
      APPWRITE_PROJECT_ID,
      APPWRITE_API_KEY,
    };

    if (action === "list") {
      return await handleList({ req, res, log, error }, ctx);
    }
    if (action === "update") {
      return await handleUpdate({ req, res, log, error }, ctx);
    }
    if (action === "login-as") {
      return await handleLoginAs({ req, res, log, error }, ctx);
    }

    return res.json(
      { success: false, message: 'Invalid or missing action. Use action: "list", "update", or "login-as".' },
      400
    );
  } catch (err) {
    error(`admin-manage-users failed: ${err.message}`);
    return res.json({ success: false, message: err.message || "Internal error" }, 500);
  }
};
