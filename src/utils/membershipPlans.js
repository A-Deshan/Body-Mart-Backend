import { MembershipPlan } from '../models/MembershipPlan.js';

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    key: 'monthly',
    category: 'Monthly',
    name: 'Monthly Membership',
    durationMonths: 1,
    price: 49,
    description: 'Flexible month-to-month gym access with full facility access.',
    aliases: ['monthly pro', 'month-to-month', 'month to month']
  },
  {
    key: 'three-month',
    category: 'Three-Month',
    name: 'Three-Month Membership',
    durationMonths: 3,
    price: 129,
    description: 'A stronger quarterly commitment with a better overall rate.',
    aliases: ['quarterly elite', 'three month', 'quarterly']
  },
  {
    key: 'annual',
    category: 'Annual',
    name: 'Annual Membership',
    durationMonths: 12,
    price: 399,
    description: 'Best-value yearly access for long-term training consistency.',
    aliases: ['annual champion', 'yearly', 'year']
  }
];

let defaultsEnsured = false;

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAliases(value) {
  if (!value) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(rawValues.map(normalizeText).filter(Boolean))];
}

function sanitizePlan(plan) {
  return {
    _id: plan._id,
    key: plan.key,
    category: plan.category,
    name: plan.name,
    description: plan.description || '',
    durationMonths: Number(plan.durationMonths || 0),
    price: Number(plan.price || 0),
    aliases: Array.isArray(plan.aliases) ? plan.aliases : [],
    isSystem: Boolean(plan.isSystem),
    isActive: plan.isActive !== false
  };
}

export function createMembershipPlanKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function ensureDefaultMembershipPlans() {
  if (defaultsEnsured) {
    return;
  }

  await Promise.all(
    DEFAULT_MEMBERSHIP_PLANS.map((plan) =>
      MembershipPlan.updateOne(
        { key: plan.key },
        {
          $setOnInsert: {
            ...plan,
            aliases: normalizeAliases(plan.aliases),
            isSystem: true,
            isActive: true
          }
        },
        { upsert: true }
      )
    )
  );

  defaultsEnsured = true;
}

export async function listMembershipPlans({ activeOnly = false } = {}) {
  await ensureDefaultMembershipPlans();

  const query = activeOnly ? { isActive: true } : {};
  const items = await MembershipPlan.find(query).sort({ durationMonths: 1, price: 1, createdAt: 1 }).lean();
  return items.map(sanitizePlan);
}

export async function findMembershipPlan(value, { activeOnly = false } = {}) {
  const target = normalizeText(value);
  if (!target) {
    return null;
  }

  const plans = await listMembershipPlans({ activeOnly });
  return (
    plans.find((plan) =>
      [plan.key, plan.category, plan.name, ...(plan.aliases || [])].map(normalizeText).includes(target)
    ) || null
  );
}

export function calculateMembershipEndDate(startDate, durationMonths) {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(durationMonths || 0));
  return endDate;
}

export function normalizePlanAliases(value) {
  return normalizeAliases(value);
}
