const Stripe = require("stripe");
const sdk = require("node-appwrite");

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
  return req.query || {};
}

async function handleListProducts(req, res, log, error) {
  const STRIPE_SECRET_KEY = req.variables?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.json({ success: false, message: "Stripe configuration missing", plans: [] }, 500);
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const payload = parsePayload(req);
  const activeOnly = payload.active_only !== "false" && payload.active_only !== false;
  const includePrices = payload.include_prices !== "false" && payload.include_prices !== false;

  const productsParams = { limit: 100, expand: ["data.default_price"] };
  if (activeOnly) productsParams.active = true;

  const products = await stripe.products.list(productsParams);
  let allPrices = [];
  if (includePrices) {
    const pricesResponse = await stripe.prices.list({ limit: 100, active: activeOnly });
    allPrices = pricesResponse.data;
  }

  const plans = await Promise.all(
    products.data.map(async (product) => {
      const productPrices = allPrices.filter((price) => price.product === product.id);
      const monthlyPrice = productPrices.find((p) => p.recurring?.interval === "month");
      const yearlyPrice = productPrices.find((p) => p.recurring?.interval === "year");
      const metadata = Object.entries(product.metadata || {}).map(([key, value]) => ({ key, value }));

      return {
        id: product.id,
        name: product.name,
        description: product.description || "",
        status: product.active ? "active" : "inactive",
        monthlyPrice: monthlyPrice ? monthlyPrice.unit_amount / 100 : 0,
        yearlyPrice: yearlyPrice ? yearlyPrice.unit_amount / 100 : 0,
        monthlyPriceId: monthlyPrice?.id || null,
        yearlyPriceId: yearlyPrice?.id || null,
        currency: monthlyPrice?.currency || yearlyPrice?.currency || "usd",
        metadata,
        images: product.images || [],
        created: product.created,
        updated: product.updated,
        stripeLink: `https://dashboard.stripe.com/products/${product.id}`,
        allPrices: productPrices.map((price) => ({
          id: price.id,
          amount: price.unit_amount / 100,
          currency: price.currency,
          interval: price.recurring?.interval || "one_time",
          interval_count: price.recurring?.interval_count || 1,
        })),
      };
    })
  );

  return res.json({ success: true, plans, total: plans.length });
}

async function handleMigrateLocalPlan(req, res, log, error) {
  const APPWRITE_ENDPOINT = req.variables?.APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const APPWRITE_PROJECT_ID = req.variables?.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const APPWRITE_API_KEY = req.variables?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !STRIPE_SECRET_KEY) {
    return res.json({ success: false, message: "Appwrite configuration missing" }, 500);
  }

  const payload = parsePayload(req);
  const { localPlanId, prices } = payload;

  if (!localPlanId) {
    return res.json({ success: false, message: "localPlanId is required" }, 400);
  }

  const client = new sdk.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  const databases = new sdk.Databases(client);
  const StripeLib = require("stripe");
  const stripe = StripeLib(STRIPE_SECRET_KEY);

  const localPlan = await databases.getDocument("platform_db", "local_plans", localPlanId);
  const usersOnPlan = await databases.listDocuments("platform_db", "subscriptions", [
    sdk.Query.equal("plan_label", localPlan.label),
    sdk.Query.limit(100),
  ]);

  const product = await stripe.products.create({
    name: localPlan.name,
    description: localPlan.description || "",
    metadata: {
      label: localPlan.label,
      sites_limit: localPlan.sites_limit || "unlimited",
      library_limit: localPlan.library_limit || "unlimited",
      storage_limit: localPlan.storage_limit || "unlimited",
    },
  });

  const stripePrices = [];
  const validPeriods = { weekly: "week", monthly: "month", yearly: "year" };

  if (prices && Array.isArray(prices) && prices.length > 0) {
    for (const price of prices) {
      if (!price.price || !price.billing_period) continue;
      const period = validPeriods[price.billing_period] || "month";
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price.price * 100),
        currency: "usd",
        recurring: { interval: period, interval_count: 1 },
        metadata: { label: localPlan.label, billing_period: price.billing_period },
      });
      stripePrices.push({ price: price.price, stripe_price_id: stripePrice.id, billing_period: price.billing_period });
    }
  }

  await databases.updateDocument("platform_db", "local_plans", localPlanId, {
    stripe_product_id: product.id,
    prices: stripePrices.length > 0 ? stripePrices : prices || [],
  });

  return res.json({
    success: true,
    stripeProductId: product.id,
    stripePrices,
    usersOnPlanCount: usersOnPlan.total,
    usersOnPlan: usersOnPlan.documents.map((doc) => ({
      userId: doc.user_id,
      userName: doc.user_name,
      userEmail: doc.user_email,
    })),
  });
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = parsePayload(req);
    const actionRaw = (req.query?.action || payload.action || "list").toString().toLowerCase();
    const actionMap = {
      list: "list",
      "list-products": "list",
      migrate: "migrate",
      "migrate-local-plan": "migrate",
    };
    const action = actionMap[actionRaw] || actionRaw;

    if (action === "list") {
      return await handleListProducts(req, res, log, error);
    }
    if (action === "migrate") {
      return await handleMigrateLocalPlan(req, res, log, error);
    }

    return res.json({ success: false, message: 'Invalid action. Use "list" or "migrate".' }, 400);
  } catch (err) {
    error("stripe-products failed: " + err.message);
    return res.json({ success: false, message: err.message, plans: [] }, 500);
  }
};
