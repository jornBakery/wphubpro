// Stripe Core - consolidated webhook + billing portal handler
const Stripe = require("stripe");
const sdk = require("node-appwrite");

/**
 * Router: stripe-signature header → webhook, else → portal
 */
module.exports = async ({ req, res, log, error }) => {
  if (req.headers && req.headers["stripe-signature"]) {
    return handleWebhook({ req, res, log, error });
  }
  return handlePortal({ req, res, log, error });
};

async function handleWebhook({ req, res, log, error }) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
  const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    error("Stripe secret or webhook secret missing");
    return res.json({ success: false, message: "Stripe secret or webhook secret missing" }, 500);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const client = new sdk.Client();
  const users = new sdk.Users(client);
  const databases = new sdk.Databases(client);

  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

  let event;
  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(req.body || "", "utf8");
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    error("Webhook signature verification failed: " + err.message);
    return res.json({ success: false, message: "Webhook signature verification failed" }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId = session.subscription;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata?.appwrite_user_id;
            const productLabel = subscription.metadata?.product_label;

            log("Subscription metadata - userId: " + userId + ", productLabel: " + productLabel);

            if (userId && productLabel) {
              try {
                const user = await users.get(userId);
                const currentLabels = user.labels || [];
                const adminLabels = currentLabels.filter((l) => l.toLowerCase() === "admin");
                const updatedLabels = [...adminLabels, productLabel];

                await users.updateLabels(userId, updatedLabels);
                log("Set Stripe product label for user: " + userId + ", label: " + productLabel);

                try {
                  const accountDocs = await databases.listDocuments("platform_db", "accounts", [
                    sdk.Query.equal("user_id", userId),
                    sdk.Query.limit(1),
                  ]);

                  if (accountDocs.documents && accountDocs.documents.length > 0) {
                    await databases.updateDocument(
                      "platform_db",
                      "accounts",
                      accountDocs.documents[0].$id,
                      { current_plan_id: productLabel }
                    );
                    log(
                      "Updated accounts.current_plan_id to " + productLabel + " for user " + userId
                    );
                  } else {
                    log("Warning: No accounts document found for user " + userId);
                  }
                } catch (accountErr) {
                  error("Failed to update accounts.current_plan_id: " + accountErr.message);
                }

                try {
                  const priceId = subscription.items.data[0]?.price?.id;
                  const price = priceId ? await stripe.prices.retrieve(priceId) : null;
                  const product = price ? await stripe.products.retrieve(price.product) : null;

                  const subscriptionData = {
                    user_id: userId,
                    user_name: user.name || null,
                    user_email: user.email || null,
                    plan_id: product?.id || null,
                    plan_label: productLabel,
                    stripe_customer_id: subscription.customer,
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    billing_start_date: subscription.current_period_start
                      ? subscription.current_period_start.toString()
                      : null,
                    billing_end_date: subscription.current_period_end
                      ? subscription.current_period_end.toString()
                      : null,
                    billing_never: subscription.cancel_at_period_end || false,
                    updated_at: new Date().toISOString(),
                  };

                  const existingDocs = await databases.listDocuments(
                    "platform_db",
                    "subscriptions",
                    [sdk.Query.equal("user_id", userId), sdk.Query.limit(1)]
                  );

                  if (existingDocs.documents && existingDocs.documents.length > 0) {
                    await databases.updateDocument(
                      "platform_db",
                      "subscriptions",
                      existingDocs.documents[0].$id,
                      subscriptionData
                    );
                    log("Updated subscription document for user " + userId);
                  } else {
                    await databases.createDocument(
                      "platform_db",
                      "subscriptions",
                      sdk.ID.unique(),
                      subscriptionData
                    );
                    log("Created subscription document for user " + userId);
                  }
                } catch (subErr) {
                  error("Failed to sync subscription to collection: " + subErr.message);
                }
              } catch (e) {
                error("Failed to set product label for user " + userId + ": " + e.message);
              }
            } else {
              log("Warning: Missing userId or productLabel in subscription metadata");
            }
          } catch (e) {
            error("Failed to retrieve subscription: " + e.message);
          }
        }

        log("Checkout session completed:", session.id);
        break;
      }

      case "invoice.paid":
        log("Invoice paid:", event.data.object.id);
        break;

      case "customer.subscription.updated": {
        const updatedSubscription = event.data.object;
        const updatedUserId = updatedSubscription.metadata?.appwrite_user_id;
        const updatedProductLabel = updatedSubscription.metadata?.product_label;

        if (updatedUserId) {
          try {
            const priceId = updatedSubscription.items.data[0]?.price?.id;
            const price = priceId ? await stripe.prices.retrieve(priceId) : null;
            const product = price ? await stripe.products.retrieve(price.product) : null;

            const subscriptionData = {
              plan_id: product?.id || null,
              plan_label: updatedProductLabel || null,
              stripe_customer_id: updatedSubscription.customer,
              stripe_subscription_id: updatedSubscription.id,
              status: updatedSubscription.status,
              updated_at: new Date().toISOString(),
            };

            const existingDocs = await databases.listDocuments("platform_db", "subscriptions", [
              sdk.Query.equal("user_id", updatedUserId),
              sdk.Query.limit(1),
            ]);

            if (existingDocs.documents && existingDocs.documents.length > 0) {
              await databases.updateDocument(
                "platform_db",
                "subscriptions",
                existingDocs.documents[0].$id,
                subscriptionData
              );
              log(
                "Updated subscription document for user " +
                  updatedUserId +
                  " - status: " +
                  updatedSubscription.status
              );
            }
          } catch (e) {
            error("Failed to update subscription in collection: " + e.message);
          }
        }

        log("Subscription updated:", updatedSubscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const deletedUserId = subscription.metadata?.appwrite_user_id;

        if (deletedUserId) {
          try {
            const user = await users.get(deletedUserId);
            const currentLabels = user.labels || [];
            const adminLabels = currentLabels.filter((l) => l.toLowerCase() === "admin");
            await users.updateLabels(deletedUserId, adminLabels);
            log("Removed subscription labels from user: " + deletedUserId);

            try {
              const accountDocs = await databases.listDocuments("platform_db", "accounts", [
                sdk.Query.equal("user_id", deletedUserId),
                sdk.Query.limit(1),
              ]);

              if (accountDocs.documents && accountDocs.documents.length > 0) {
                await databases.updateDocument(
                  "platform_db",
                  "accounts",
                  accountDocs.documents[0].$id,
                  { current_plan_id: null }
                );
                log("Cleared accounts.current_plan_id for user " + deletedUserId);
              }
            } catch (accountErr) {
              error("Failed to clear accounts.current_plan_id: " + accountErr.message);
            }

            try {
              const existingDocs = await databases.listDocuments("platform_db", "subscriptions", [
                sdk.Query.equal("user_id", deletedUserId),
                sdk.Query.limit(1),
              ]);

              if (existingDocs.documents && existingDocs.documents.length > 0) {
                await databases.updateDocument(
                  "platform_db",
                  "subscriptions",
                  existingDocs.documents[0].$id,
                  {
                    status: "canceled",
                    updated_at: new Date().toISOString(),
                  }
                );
                log("Updated subscription status to canceled for user " + deletedUserId);
              }
            } catch (subErr) {
              error("Failed to update subscription status: " + subErr.message);
            }
          } catch (e) {
            error(
              "Failed to remove subscription labels from user " + deletedUserId + ": " + e.message
            );
          }
        }

        log("Subscription deleted:", subscription.id);
        break;
      }

      default:
        log("Unhandled event type:", event.type);
    }
    return res.json({ success: true });
  } catch (err) {
    error("Webhook handler error: " + err.message);
    return res.json({ success: false, message: "Webhook handler error" }, 500);
  }
}

async function handlePortal({ req, res, log, error }) {
  try {
    const STRIPE_SECRET_KEY = req.variables?.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    const APPWRITE_ENDPOINT =
      req.variables?.APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID =
      req.variables?.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const APPWRITE_API_KEY = req.variables?.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;

    if (!STRIPE_SECRET_KEY) {
      error("STRIPE_SECRET_KEY is not configured");
      return res.json({ success: false, message: "Stripe configuration missing" }, 500);
    }

    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
      error("Appwrite configuration missing");
      return res.json({ success: false, message: "Appwrite configuration missing" }, 500);
    }

    const userId = req.variables?.APPWRITE_FUNCTION_USER_ID || req.variables?.APPWRITE_USER_ID;

    if (!userId) {
      error("User not authenticated");
      return res.json({ success: false, message: "User not authenticated" }, 401);
    }

    let payload = {};
    try {
      if (req.payload && typeof req.payload === "string") {
        payload = JSON.parse(req.payload);
      } else if (req.payload && typeof req.payload === "object") {
        payload = req.payload;
      }
    } catch {
      payload = {};
    }

    const returnUrl = payload.returnUrl || "https://wphubpro.netlify.app/#/subscription";

    log("Creating billing portal session for user: " + userId);

    const client = new sdk.Client();
    client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);

    const subscriptions = await databases.listDocuments("platform_db", "subscriptions", [
      sdk.Query.equal("user_id", userId),
    ]);

    if (subscriptions.documents.length === 0) {
      error("No subscription found for user");
      return res.json(
        { success: false, message: "No subscription found. Please create a subscription first." },
        404
      );
    }

    const subscription = subscriptions.documents[0];
    const stripeCustomerId = subscription.stripe_customer_id;

    if (!stripeCustomerId) {
      error("No Stripe customer ID found");
      return res.json(
        { success: false, message: "No Stripe customer found. Please contact support." },
        404
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    log("Billing portal session created: " + session.id);

    return res.json({
      success: true,
      url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    error("Failed to create billing portal session: " + err.message);
    return res.json(
      {
        success: false,
        message: err.message || "Failed to create billing portal session",
      },
      500
    );
  }
}
