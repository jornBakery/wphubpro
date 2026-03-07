// Compatibility shim: keep legacy imports working while domains are adopted.
export {
  useManageSubscription,
  useInvoices,
  useStripePlans,
  useCreateCheckoutSession,
  useCancelSubscription,
} from '../domains/billing/hooks';