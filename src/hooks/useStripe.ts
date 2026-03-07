import { useMutation, useQuery } from '@tanstack/react-query';
import { redirectToBillingPortal } from '../services/stripe';
import { useToast } from '../contexts/ToastContext';
import { StripeInvoice, StripePlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { executeFunction } from '../integrations/appwrite/executeFunction';

const STRIPE_LIST_PRODUCTS_FUNCTION_ID = 'stripe-list-products';
const STRIPE_CREATE_CHECKOUT_SESSION_FUNCTION_ID = 'stripe-create-checkout-session';
const STRIPE_CANCEL_SUBSCRIPTION_FUNCTION_ID = 'stripe-cancel-subscription';

const LIST_INVOICES_FUNCTION_ID = 'stripe-list-invoices';

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
        }
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
      return response.plans || []; // Extract the 'plans' array and fallback to an empty array
    },
    enabled: !!user, // Only fetch if the user is logged in
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useCreateCheckoutSession = () => {
    const { toast } = useToast();
    return useMutation<{ sessionId: string, url: string }, Error, { priceId: string }>({
        mutationFn: async ({ priceId }) => {
            // Get current origin for dynamic redirect URLs
            const returnUrl = window.location.origin;

            const response = await executeFunction<{ sessionId: string; url: string }>(
                STRIPE_CREATE_CHECKOUT_SESSION_FUNCTION_ID,
                { priceId, returnUrl }
            );
            return response;
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Could not initiate subscription: ${error.message}`,
                variant: "destructive",
            });
        },
    });
};

export const useCancelSubscription = () => {
    const { toast } = useToast();
    return useMutation<{ success: boolean }, Error, void>({
        mutationFn: async () => {
            const response = await executeFunction<{ success: boolean }>(
                STRIPE_CANCEL_SUBSCRIPTION_FUNCTION_ID,
                undefined
            );
            return response;
        },
        onSuccess: () => {
            toast({
                title: "Subscription Cancelled",
                description: "Your subscription will be cancelled at the end of the billing period.",
                variant: "default",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Could not cancel subscription: ${error.message}`,
                variant: "destructive",
            });
        },
    });
};