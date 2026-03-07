import { useMutation, useQuery } from '@tanstack/react-query';
import { Query } from 'appwrite';
import { redirectToBillingPortal } from '../../services/stripe';
import { useToast } from '../../contexts/ToastContext';
import { StripeInvoice, StripePlan, Subscription, UsageMetrics } from '../../types';
import { useAuth } from '../auth';
import { executeFunction } from '../../integrations/appwrite/executeFunction';
import { databases, DATABASE_ID, COLLECTIONS } from '../../services/appwrite';
import { useLibraryItems } from '../../hooks/useLibrary';
import { useSites } from '../sites/hooks';

const STRIPE_LIST_PRODUCTS_FUNCTION_ID = 'stripe-products';
const STRIPE_CREATE_CHECKOUT_SESSION_FUNCTION_ID = 'stripe-order-payments';
const STRIPE_CANCEL_SUBSCRIPTION_FUNCTION_ID = 'stripe-subscriptions';
const LIST_INVOICES_FUNCTION_ID = 'stripe-invoices';
const GET_SUBSCRIPTION_FUNCTION_ID = 'stripe-subscriptions';

export const useManageSubscription = () => {
  const { toast } = useToast();

  return useMutation<void, Error>({
    mutationFn: redirectToBillingPortal,
    onError: (error) => {
      toast({
        title: 'Redirection Failed',
        description: error.message || 'Could not redirect to the billing portal.',
        variant: 'destructive',
      });
    },
  });
};

export const useInvoices = () => {
  const { user } = useAuth();
  return useQuery<StripeInvoice[], Error>({
    queryKey: ['invoices', user?.$id],
    queryFn: async () => {
      if (!user) return [];
      const result = await executeFunction<{ invoices: StripeInvoice[] }>(LIST_INVOICES_FUNCTION_ID);
      return result?.invoices ?? [];
    },
    enabled: !!user,
  });
};

export const useStripePlans = () => {
  const { user } = useAuth();
  return useQuery<StripePlan[], Error>({
    queryKey: ['stripePlans'],
    queryFn: async () => {
      const response = await executeFunction<{ plans: StripePlan[] }>(STRIPE_LIST_PRODUCTS_FUNCTION_ID);
      return response.plans || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCreateCheckoutSession = () => {
  const { toast } = useToast();
  return useMutation<{ sessionId: string; url: string }, Error, { priceId: string }>({
    mutationFn: async ({ priceId }) => {
      const returnUrl = window.location.origin;
      return await executeFunction<{ sessionId: string; url: string }>(
        STRIPE_CREATE_CHECKOUT_SESSION_FUNCTION_ID,
        { priceId, returnUrl }
      );
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Could not initiate subscription: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useCancelSubscription = () => {
  const { toast } = useToast();
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      return await executeFunction<{ success: boolean }>(
        STRIPE_CANCEL_SUBSCRIPTION_FUNCTION_ID,
        { action: 'cancel' }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the billing period.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Could not cancel subscription: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useSubscription = () => {
  const { user } = useAuth();
  return useQuery<Subscription | null, Error>({
    queryKey: ['subscription', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return null;

      const fetchStripeSubscription = async (errorLogPrefix: string): Promise<Subscription | null> => {
        try {
          const responseBody = await executeFunction<any>(GET_SUBSCRIPTION_FUNCTION_ID, {
            action: 'get',
          });
          if (responseBody && responseBody.status !== 'canceled') {
            return {
              ...responseBody,
              source: 'stripe',
            } as Subscription;
          }
          return null;
        } catch (e) {
          console.error(errorLogPrefix, e);
          return null;
        }
      };

      let currentPlanId: string | null = null;
      let stripeCustomerId: string | null = null;

      try {
        const accountDocs = await databases.listDocuments(
          DATABASE_ID,
          'accounts',
          [Query.equal('user_id', user.$id), Query.limit(1)]
        );

        if (accountDocs.documents.length > 0) {
          currentPlanId = accountDocs.documents[0].current_plan_id || null;
          stripeCustomerId = accountDocs.documents[0].stripe_customer_id || null;
        }
      } catch (e) {
        console.error('Failed to fetch accounts data:', e);
      }

      if (currentPlanId) {
        try {
          const customPlanDocs = await databases.listDocuments(
            DATABASE_ID,
            'plans',
            [Query.equal('label', currentPlanId)]
          );

          if (customPlanDocs.documents.length > 0) {
            const plan = customPlanDocs.documents[0];
            return {
              userId: user.$id,
              planId: plan.name || 'CUSTOM',
              status: 'active',
              sitesLimit: plan.sites_limit || 1,
              libraryLimit: plan.library_limit || 5,
              storageLimit: plan.storage_limit || 10,
              source: 'local',
            } as Subscription;
          }
        } catch (e) {
          console.error('Failed to search for custom plan:', e);
        }

        if (stripeCustomerId) {
          const stripeSubscription = await fetchStripeSubscription('Failed to fetch Stripe subscription:');
          if (stripeSubscription) return stripeSubscription;
        }
      }

      const subscriptionLabel = Array.isArray(user.labels)
        ? user.labels.find((l) => l.toLowerCase() !== 'admin')
        : undefined;

      if (subscriptionLabel) {
        try {
          const customPlanDocs = await databases.listDocuments(
            DATABASE_ID,
            'plans',
            [Query.equal('label', subscriptionLabel)]
          );

          if (customPlanDocs.documents.length > 0) {
            const plan = customPlanDocs.documents[0];
            return {
              userId: user.$id,
              planId: plan.name || 'CUSTOM',
              status: 'active',
              sitesLimit: plan.sites_limit || 1,
              libraryLimit: plan.library_limit || 5,
              storageLimit: plan.storage_limit || 10,
              source: 'local',
            } as Subscription;
          }
        } catch (e) {
          console.error('Failed to search for custom plan by label:', e);
        }

        if (stripeCustomerId) {
          const stripeSubscription = await fetchStripeSubscription('Failed to fetch Stripe subscription from label:');
          if (stripeSubscription) return stripeSubscription;
        }
      }

      try {
        const settingsDocs = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SETTINGS,
          [Query.equal('key', 'freePlanLimits')]
        );

        if (settingsDocs.documents.length > 0) {
          const settings = JSON.parse(settingsDocs.documents[0].value as string);
          return {
            userId: user.$id,
            planId: 'FREE',
            status: 'active',
            sitesLimit: parseInt(settings.sitesLimit || '1', 10),
            libraryLimit: parseInt(settings.libraryLimit || '5', 10),
            storageLimit: parseInt(settings.storageLimit || '10', 10),
            source: 'free-tier',
          } as Subscription;
        }
      } catch (e) {
        console.error('Failed to fetch free plan limits:', e);
      }

      return {
        userId: user.$id,
        planId: 'FREE',
        status: 'active',
        sitesLimit: 1,
        libraryLimit: 5,
        storageLimit: 10,
        source: 'free-tier',
      } as Subscription;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUsage = () => {
  const { user } = useAuth();
  const { data: libraryItems } = useLibraryItems();
  const { data: sites } = useSites();

  return useQuery<UsageMetrics, Error>({
    queryKey: ['usage', user?.$id, libraryItems, sites],
    queryFn: async () => {
      const localUploads = libraryItems?.filter((item) => item.source === 'local') || [];

      return {
        sitesUsed: sites?.length || 0,
        libraryUsed: libraryItems?.length || 0,
        storageUsed: localUploads.length,
      };
    },
    enabled: !!user && libraryItems !== undefined && sites !== undefined,
  });
};
