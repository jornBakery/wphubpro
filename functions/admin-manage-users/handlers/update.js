const fetch = require("node-fetch");
const sdk = require("node-appwrite");

module.exports = async function handleUpdate({ req, res, log, error }, { client, databases, stripe, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY }) {
  const payload = req._parsedPayload || {};
  const updates = payload.updates || {};
  const userId =
    payload.userId ||
    updates.userId ||
    req.variables?.APPWRITE_FUNCTION_USER_ID ||
    req.variables?.APPWRITE_USER_ID ||
    req.headers?.["x-appwrite-user-id"];

  if (!userId) {
    return res.json({ success: false, message: "userId is required" }, 400);
  }

  const users = new sdk.Users(client);
  const currentUser = await users.get(userId);

  try {
    if (updates.name && updates.name !== currentUser.name) {
      await users.updateName(userId, updates.name);
    }
    if (updates.email && updates.email !== currentUser.email) {
      await users.updateEmail(userId, updates.email);
    }

    const stripeCustomerId = updates.stripe_customer_id || currentUser.prefs?.stripe_customer_id;
    if (stripe && stripeCustomerId && (updates.name || updates.email)) {
      try {
        const stripeUpdate = {};
        if (updates.name) stripeUpdate.name = updates.name;
        if (updates.email) stripeUpdate.email = updates.email;
        await stripe.customers.update(stripeCustomerId, stripeUpdate);
        log(`Updated Stripe customer ${stripeCustomerId} with new details`);
      } catch (stripeErr) {
        log(`Warning: Failed to update Stripe customer: ${stripeErr.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "status")) {
      const newStatus = updates.status === "Active";
      if (newStatus !== currentUser.status) {
        await users.updateStatus(userId, newStatus);
      }
    }

    const prefs = {};
    if (updates.planId) prefs.plan_id = updates.planId;
    if (updates.stripe_customer_id) prefs.stripe_customer_id = updates.stripe_customer_id;
    if (Object.keys(updates.customLimits || {}).length > 0) prefs.limits = updates.customLimits;
    if (Object.keys(prefs).length > 0) {
      await users.updatePrefs(userId, { ...currentUser.prefs, ...prefs });
    }
  } catch (err) {
    error(`Appwrite update failed: ${err.message}`);
    return res.json({ success: false, message: err.message || "Failed to update user" }, 500);
  }

  let json = await users.get(userId);

  if (
    Object.prototype.hasOwnProperty.call(updates, "isAdmin") &&
    typeof updates.isAdmin === "boolean"
  ) {
    try {
      const adminExec = await fetch(`${APPWRITE_ENDPOINT}/functions/set-admin/executions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT_ID,
          "X-Appwrite-Key": APPWRITE_API_KEY,
        },
        body: JSON.stringify({ userId, isAdmin: updates.isAdmin }),
      });
      if (!adminExec.ok) {
        const adminJson = await adminExec.json();
        log(`Warning: Failed to update admin status: ${JSON.stringify(adminJson)}`);
      } else {
        log(`Updated admin status for user ${userId}: ${updates.isAdmin}`);
      }
    } catch (err) {
      log(`Warning: Could not update admin status: ${err.message}`);
    }
  }

  const upsertAccountCurrentPlan = async (currentPlanId) => {
    const accountDocs = await databases.listDocuments("platform_db", "accounts", [
      sdk.Query.equal("user_id", userId),
      sdk.Query.limit(1),
    ]);
    const updateData = { current_plan_id: currentPlanId };
    if (Object.prototype.hasOwnProperty.call(updates, "stripe_customer_id")) {
      updateData.stripe_customer_id = updates.stripe_customer_id || null;
    }
    if (accountDocs.documents && accountDocs.documents.length > 0) {
      await databases.updateDocument(
        "platform_db",
        "accounts",
        accountDocs.documents[0].$id,
        updateData
      );
      return;
    }
    const accountData = {
      user_id: userId,
      stripe_customer_id: updates.stripe_customer_id || null,
      current_plan_id: currentPlanId,
    };
    const permissions = [
      sdk.Permission.read(sdk.Role.user(userId)),
      sdk.Permission.update(sdk.Role.user(userId)),
      sdk.Permission.read(sdk.Role.team("admin")),
      sdk.Permission.update(sdk.Role.team("admin")),
      sdk.Permission.delete(sdk.Role.team("admin")),
    ];
    await databases.createDocument("platform_db", "accounts", sdk.ID.unique(), accountData, permissions);
  };

  const upsertSubscriptionDoc = async (subscriptionPayload) => {
    const list = await databases.listDocuments("platform_db", "subscriptions", [
      sdk.Query.equal("user_id", userId),
      sdk.Query.limit(1),
    ]);
    if (list?.documents?.length > 0) {
      await databases.updateDocument("platform_db", "subscriptions", list.documents[0].$id, subscriptionPayload);
    } else {
      await databases.createDocument("platform_db", "subscriptions", sdk.ID.unique(), subscriptionPayload);
    }
  };

  if (Object.prototype.hasOwnProperty.call(updates, "localPlanId")) {
    try {
      if (updates.localPlanId) {
        const plan = await databases.getDocument("platform_db", "local_plans", updates.localPlanId);
        if (plan?.label) {
          await upsertAccountCurrentPlan(plan.label);
          const assignedByUserId = req.headers?.["x-appwrite-user-id"] || req.variables?.APPWRITE_USER_ID || req.variables?.APPWRITE_FUNCTION_USER_ID || null;
          let assignedByUserName = null;
          if (assignedByUserId) {
            try {
              const adminUser = await users.get(assignedByUserId);
              assignedByUserName = adminUser?.name || null;
            } catch (adminErr) {
              log(`Warning: Could not resolve admin user ${assignedByUserId}: ${adminErr.message}`);
            }
          }
          const nowIso = new Date().toISOString();
          const metadata = {
            sites_limit: plan.sites_limit ?? plan.sitesLimit ?? null,
            library_limit: plan.library_limit ?? plan.libraryLimit ?? null,
            storage_limit: plan.storage_limit ?? plan.storageLimit ?? null,
            assigned_by_user_id: assignedByUserId,
            assigned_by_user_name: assignedByUserName,
            assigned_at: nowIso,
          };
          await upsertSubscriptionDoc({
            user_id: userId,
            user_name: updates.name || json.name || null,
            user_email: updates.email || json.email || null,
            plan_id: plan.label || plan.name || null,
            plan_label: plan.label || null,
            plan_price_mode: null,
            plan_price: null,
            billing_start_date: null,
            billing_end_date: null,
            billing_never: true,
            stripe_subscription_id: null,
            stripe_customer_id: updates.stripe_customer_id || currentUser.prefs?.stripe_customer_id || null,
            metadata: JSON.stringify(metadata),
            status: "active",
            updated_at: nowIso,
          });
          log(`Applied local plan "${plan.label}" to user ${userId}`);
        } else {
          error(`Plan ${updates.localPlanId} does not have a label attribute`);
        }
      } else {
        let stripePlanLabel = null;
        let stripeProductId = null;
        let stripeSubscriptionId = null;
        if (stripe) {
        try {
          const accountDocs = await databases.listDocuments("platform_db", "accounts", [
            sdk.Query.equal("user_id", userId),
            sdk.Query.limit(1),
          ]);
          if (accountDocs.documents?.length > 0 && accountDocs.documents[0].stripe_customer_id) {
            const customerId = accountDocs.documents[0].stripe_customer_id;
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
            if (subscriptions.data?.length > 0) {
              const subscription = subscriptions.data[0];
              stripeSubscriptionId = subscription.id;
              if (subscription.status !== "canceled" && subscription.items?.data?.length > 0) {
                const priceId = subscription.items.data[0].price.id;
                const price = await stripe.prices.retrieve(priceId);
                const product = await stripe.products.retrieve(price.product);
                stripePlanLabel = product.metadata?.label || null;
                stripeProductId = product.id;
              }
            }
          }
        } catch (err) {
          log(`Note: Could not fetch Stripe subscription for user ${userId}: ${err.message}`);
        }
        }
        await upsertAccountCurrentPlan(stripePlanLabel || null);
        const removalMetadata = stripePlanLabel ? { product_label: stripePlanLabel } : {};
        await upsertSubscriptionDoc({
          user_id: userId,
          user_name: updates.name || json.name || null,
          user_email: updates.email || json.email || null,
          plan_id: stripeProductId || null,
          plan_label: stripePlanLabel || null,
          plan_price_mode: null,
          plan_price: null,
          billing_start_date: null,
          billing_end_date: null,
          billing_never: true,
          stripe_subscription_id: stripeSubscriptionId || null,
          stripe_customer_id: updates.stripe_customer_id || currentUser.prefs?.stripe_customer_id || null,
          metadata: JSON.stringify(removalMetadata),
          status: "active",
          updated_at: new Date().toISOString(),
        });
        log(stripePlanLabel ? `Removed local plan and restored Stripe plan "${stripePlanLabel}" for user ${userId}` : `Removed local plan from user ${userId}`);
      }
    } catch (err) {
      error(`Failed to apply/remove local plan: ${err.message}`);
    }
  }

  if (updates.planId || updates.customPrice || updates.billingStart || updates.customLimits) {
    const subscriptionPayload = {
      user_id: userId,
      user_name: updates.name || json.name || null,
      user_email: updates.email || json.email || null,
      plan_id: updates.planId || null,
      plan_price_mode: updates.priceMode || (updates.customPrice ? "custom" : "plan"),
      plan_price: updates.customPrice ? JSON.stringify({
        amount: updates.customPrice.amount || 0,
        currency: updates.customPrice.currency || "usd",
        interval: updates.customPrice.interval || "month",
      }) : null,
      billing_start_date: updates.billingStart === "never" ? null : updates.billingStart || null,
      billing_never: updates.billingStart === "never" ? true : false,
      metadata: JSON.stringify(updates.customLimits || {}),
      status: updates.status ? (updates.status === "Active" ? "active" : "inactive") : "active",
      updated_at: new Date().toISOString(),
    };
    await upsertSubscriptionDoc(subscriptionPayload);
  }

  json = await users.get(userId);
  log(`Updated user ${userId}`);
  return res.json({ success: true, user: json });
};
