import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Query, ID, Permission, Role } from 'appwrite';
import { executeFunction } from '../../integrations/appwrite/executeFunction';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';

const PLANS_COLLECTION = COLLECTIONS.PLANS;

/** Raw user from Appwrite Users API */
export interface AppwriteUser {
  $id: string;
  name?: string;
  email?: string;
  status?: boolean;
  labels?: string[];
  prefs?: Record<string, unknown>;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: unknown;
}

/** Account document from platform_db.accounts */
export interface AccountDoc {
  $id: string;
  user_id: string;
  current_plan_id?: string | null;
  stripe_customer_id?: string | null;
  avatar?: string | null;
  [key: string]: unknown;
}

/** Local plan document */
export interface LocalPlanDoc {
  $id: string;
  label?: string;
  name?: string;
  sites_limit?: number;
  library_limit?: number;
  storage_limit?: number;
  [key: string]: unknown;
}

/** Formatted admin user for UI */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  isAdmin: boolean;
  planName: string;
  stripeId: string;
  status: 'Active' | 'Inactive';
  joined: string;
  prefs: Record<string, unknown>;
  avatar: string | null;
}

function formatUser(
  user: AppwriteUser,
  accountMap: Record<string, { currentPlanId: string | null; stripeId: string | null; avatar: string | null }>,
  planLabelMap: Record<string, string>
): AdminUser {
  const labels = Array.isArray(user.labels) ? user.labels : [];
  const isAdmin = labels.some((l) => String(l).toLowerCase() === 'admin');
  const acc = accountMap[user.$id];
  const planName = acc?.currentPlanId
    ? planLabelMap[acc.currentPlanId] ?? acc.currentPlanId
    : 'Free Tier';
  return {
    id: user.$id,
    name: user.name || user.email || `User ${(user.$id || '').substring(0, 8)}`,
    email: user.email || 'N/A',
    role: isAdmin ? 'Admin' : 'User',
    isAdmin,
    planName,
    stripeId: acc?.stripeId || 'n/a',
    status: user.status === false ? 'Inactive' : 'Active',
    joined: user.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'n/a',
    prefs: user.prefs || {},
    avatar: acc?.avatar ?? (user.prefs && (user.prefs as Record<string, unknown>).avatar as string) ?? null,
  };
}

export interface ListUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdateUserParams {
  userId: string;
  updates: {
    name?: string;
    email?: string;
    status?: 'Active' | 'Inactive';
    isAdmin?: boolean;
    planId?: string;
    stripe_customer_id?: string;
    customLimits?: Record<string, unknown>;
    localPlanId?: string | null;
    stripe_customer_id_from_account?: string;
  };
}


export function useAdminUsersList(params: ListUsersParams = {}) {
  const limit = Math.max(1, Math.min(100, params.limit ?? 50));
  const offset = params.offset ?? 0;
  const search = params.search ?? '';

  return useQuery({
    queryKey: ['admin', 'users', limit, offset, search],
    queryFn: async () => {
      const res = await executeFunction<{
        success: boolean;
        users: AppwriteUser[];
        total: number;
        limit: number;
        offset: number;
      }>('admin-manage-users', { action: 'list', limit, offset, search });

      const rawUsers = res?.users ?? [];
      const total = res?.total ?? rawUsers.length;

      const accountMap: Record<string, { currentPlanId: string | null; stripeId: string | null; avatar: string | null }> = {};

      if (rawUsers.length > 0) {
        const accountPromises = rawUsers.map((u) =>
          databases.listDocuments(DATABASE_ID, COLLECTIONS.ACCOUNTS, [
            Query.equal('user_id', u.$id),
            Query.limit(1),
          ])
        );
        const accountResults = await Promise.all(accountPromises);
        accountResults.forEach((r, i) => {
          const doc = r.documents?.[0] as unknown as AccountDoc | undefined;
          const userId = rawUsers[i].$id;
          if (doc) {
            accountMap[userId] = {
              currentPlanId: doc.current_plan_id ?? null,
              stripeId: doc.stripe_customer_id ?? null,
              avatar: doc.avatar ?? null,
            };
          } else {
            accountMap[userId] = { currentPlanId: null, stripeId: null, avatar: null };
          }
        });
      }

      let planLabelMap: Record<string, string> = {};
      try {
        const plansRes = await databases.listDocuments(DATABASE_ID, PLANS_COLLECTION, [
          Query.limit(100),
        ]);
        (plansRes.documents ?? []).forEach((p: LocalPlanDoc) => {
          const label = p.label ?? p.name ?? p.$id;
          planLabelMap[label] = label;
        });
      } catch {
        // plans collection may not exist or admin may not have read
      }

      const users = rawUsers.map((u) => formatUser(u, accountMap, planLabelMap));

      return { users, total, limit, offset };
    },
  });
}

export function useAdminUsersUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: UpdateUserParams) => {
      const userUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) userUpdates.name = updates.name;
      if (updates.email !== undefined) userUpdates.email = updates.email;
      if (updates.status !== undefined) userUpdates.status = updates.status;
      if (updates.isAdmin !== undefined) userUpdates.isAdmin = updates.isAdmin;
      if (updates.planId !== undefined) userUpdates.planId = updates.planId;
      if (updates.stripe_customer_id !== undefined)
        userUpdates.stripe_customer_id = updates.stripe_customer_id;
      if (updates.customLimits !== undefined) userUpdates.customLimits = updates.customLimits;

      await executeFunction('admin-manage-users', {
        action: 'update',
        userId,
        updates: userUpdates,
      });

      if (updates.localPlanId !== undefined) {
        const planId = updates.localPlanId;
        const accountQueries = [Query.equal('user_id', userId), Query.limit(1)];
        const accountRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ACCOUNTS,
          accountQueries
        );
        const accountDocs = accountRes.documents ?? [];
        const stripeCustomerId =
          updates.stripe_customer_id_from_account ??
          (accountDocs[0] as unknown as AccountDoc | undefined)?.stripe_customer_id ??
          null;

        if (planId) {
          const planRes = await databases.getDocument(
            DATABASE_ID,
            PLANS_COLLECTION,
            planId
          );
          const plan = planRes as LocalPlanDoc;
          const planLabel = plan?.label ?? plan?.name ?? null;
          if (planLabel) {
            const accountData = {
              current_plan_id: planLabel,
              stripe_customer_id: stripeCustomerId,
            };
            if (accountDocs.length > 0) {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ACCOUNTS,
                (accountDocs[0] as unknown as AccountDoc).$id,
                accountData
              );
            } else {
              const permissions = [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.read(Role.team('admin')),
                Permission.update(Role.team('admin')),
                Permission.delete(Role.team('admin')),
              ];
              await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.ACCOUNTS,
                ID.unique(),
                {
                  user_id: userId,
                  ...accountData,
                },
                permissions
              );
            }

            const nowIso = new Date().toISOString();
            const subPayload = {
              user_id: userId,
              plan_id: planLabel,
              plan_label: planLabel,
              plan_price_mode: null,
              plan_price: null,
              billing_start_date: null,
              billing_end_date: null,
              billing_never: true,
              stripe_subscription_id: null,
              stripe_customer_id: stripeCustomerId,
              metadata: JSON.stringify({
                sites_limit: plan.sites_limit ?? null,
                library_limit: plan.library_limit ?? null,
                storage_limit: plan.storage_limit ?? null,
                assigned_at: nowIso,
              }),
              status: 'active',
              updated_at: nowIso,
            };

            const subRes = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.SUBSCRIPTIONS,
              [Query.equal('user_id', userId), Query.limit(1)]
            );
            const subDocs = subRes.documents ?? [];
            if (subDocs.length > 0) {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.SUBSCRIPTIONS,
                (subDocs[0] as unknown as { $id: string }).$id,
                subPayload
              );
            } else {
              await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.SUBSCRIPTIONS,
                ID.unique(),
                subPayload
              );
            }
          }
        } else {
          const accountData = { current_plan_id: null, stripe_customer_id: stripeCustomerId };
            if (accountDocs.length > 0) {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ACCOUNTS,
                (accountDocs[0] as unknown as AccountDoc).$id,
                accountData
              );
            }
          const subRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SUBSCRIPTIONS,
            [Query.equal('user_id', userId), Query.limit(1)]
          );
          const subDocs = subRes.documents ?? [];
          const subPayload = {
            user_id: userId,
            plan_id: null,
            plan_label: null,
            plan_price_mode: null,
            plan_price: null,
            billing_start_date: null,
            billing_end_date: null,
            billing_never: true,
            stripe_subscription_id: null,
            stripe_customer_id: stripeCustomerId,
            metadata: JSON.stringify({}),
            status: 'active',
            updated_at: new Date().toISOString(),
          };
          if (subDocs.length > 0) {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.SUBSCRIPTIONS,
              (subDocs[0] as unknown as { $id: string }).$id,
              subPayload
            );
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminLoginAs() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await executeFunction<{ token?: string }>('admin-manage-users', {
        action: 'login-as',
        userId,
      });
      return res?.token ?? null;
    },
  });
}
