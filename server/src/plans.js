export const PLANS = {
  free: {
    label: 'Free',
    maxForms: 3,
    maxResponsesPerForm: 100,
  },
  pro: {
    label: 'Pro',
    maxForms: Infinity,
    maxResponsesPerForm: Infinity,
  },
};

export function limitsFor(plan) {
  return PLANS[plan] ?? PLANS.free;
}
