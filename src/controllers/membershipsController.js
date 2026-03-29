import { Membership } from '../models/Membership.js';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { createMembershipPlanKey, ensureDefaultMembershipPlans, normalizePlanAliases } from '../utils/membershipPlans.js';

function resolveMembershipCategory(payload) {
  return payload.membershipCategory?.trim();
}

function normalizePayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.userId !== undefined) out.userId = payload.userId || null;
  if (!partial || payload.memberName !== undefined) out.memberName = payload.memberName?.trim();
  if (!partial || payload.memberEmail !== undefined) out.memberEmail = payload.memberEmail?.trim().toLowerCase();
  if (!partial || payload.membershipCategory !== undefined || payload.planName !== undefined) {
    out.membershipCategory = resolveMembershipCategory(payload);
  }
  if (!partial || payload.planName !== undefined) out.planName = payload.planName?.trim();
  if (!partial || payload.price !== undefined) out.price = Number(payload.price);
  if (!partial || payload.status !== undefined) out.status = payload.status;
  if (!partial || payload.paymentMethod !== undefined) out.paymentMethod = payload.paymentMethod;
  if (!partial || payload.paymentStatus !== undefined) out.paymentStatus = payload.paymentStatus;
  if (!partial || payload.paymentReference !== undefined) out.paymentReference = payload.paymentReference?.trim();
  if (!partial || payload.billingPhone !== undefined) out.billingPhone = payload.billingPhone?.trim();
  if (!partial || payload.cardLast4 !== undefined) out.cardLast4 = payload.cardLast4?.trim();
  if (!partial || payload.paidAt !== undefined) out.paidAt = payload.paidAt || null;
  if (!partial || payload.startDate !== undefined) out.startDate = payload.startDate;
  if (!partial || payload.endDate !== undefined) out.endDate = payload.endDate;
  if (!partial || payload.renewalStatus !== undefined) out.renewalStatus = payload.renewalStatus;
  return out;
}

function validatePayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.memberName || !payload.memberEmail || !payload.membershipCategory || !payload.planName || !payload.endDate)) {
    return 'memberName, memberEmail, membershipCategory, planName, and endDate are required';
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    return 'Price must be a non-negative number';
  }

  if (payload.endDate !== undefined && Number.isNaN(new Date(payload.endDate).getTime())) {
    return 'endDate must be a valid date';
  }

  if (payload.paidAt !== undefined && payload.paidAt !== null && Number.isNaN(new Date(payload.paidAt).getTime())) {
    return 'paidAt must be a valid date';
  }

  return null;
}

function normalizeMembershipPlanPayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.category !== undefined) out.category = payload.category?.trim();
  if (!partial || payload.name !== undefined) out.name = payload.name?.trim();
  if (!partial || payload.description !== undefined) out.description = payload.description?.trim();
  if (!partial || payload.durationMonths !== undefined) out.durationMonths = Number(payload.durationMonths);
  if (!partial || payload.price !== undefined) out.price = Number(payload.price);
  if (!partial || payload.aliases !== undefined) out.aliases = normalizePlanAliases(payload.aliases);
  if (!partial || payload.isActive !== undefined) out.isActive = Boolean(payload.isActive);
  return out;
}

function validateMembershipPlanPayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.category || !payload.name)) {
    return 'category and name are required';
  }

  if (payload.durationMonths !== undefined && (!Number.isFinite(payload.durationMonths) || payload.durationMonths < 1)) {
    return 'durationMonths must be at least 1';
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    return 'price must be a non-negative number';
  }

  return null;
}

export async function listMembershipPlans(req, res) {
  await ensureDefaultMembershipPlans();

  const { isActive } = req.query;
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const items = await MembershipPlan.find(query).sort({ durationMonths: 1, price: 1, createdAt: 1 });
  return res.status(200).json({ items });
}

export async function createMembershipPlan(req, res) {
  await ensureDefaultMembershipPlans();

  const payload = normalizeMembershipPlanPayload(req.body);
  const error = validateMembershipPlanPayload(payload);
  if (error) return res.status(400).json({ message: error });

  const key = createMembershipPlanKey(req.body.key || payload.name || payload.category);
  if (!key) {
    return res.status(400).json({ message: 'A valid membership key could not be created' });
  }

  const duplicate = await MembershipPlan.findOne({ key });
  if (duplicate) {
    return res.status(409).json({ message: 'A membership option with a similar key already exists' });
  }

  const item = await MembershipPlan.create({
    ...payload,
    key,
    isSystem: false
  });

  return res.status(201).json({ item });
}

export async function updateMembershipPlan(req, res) {
  await ensureDefaultMembershipPlans();

  const payload = normalizeMembershipPlanPayload(req.body, { partial: true });
  const error = validateMembershipPlanPayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await MembershipPlan.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Membership option not found' });

  if (payload.category !== undefined) item.category = payload.category;
  if (payload.name !== undefined) item.name = payload.name;
  if (payload.description !== undefined) item.description = payload.description;
  if (payload.durationMonths !== undefined) item.durationMonths = payload.durationMonths;
  if (payload.price !== undefined) item.price = payload.price;
  if (payload.aliases !== undefined) item.aliases = payload.aliases;
  if (payload.isActive !== undefined) item.isActive = payload.isActive;

  await item.save();
  return res.status(200).json({ item });
}

export async function deleteMembershipPlan(req, res) {
  await ensureDefaultMembershipPlans();

  const item = await MembershipPlan.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Membership option not found' });
  if (item.isSystem) {
    return res.status(400).json({ message: 'Default membership options cannot be deleted' });
  }

  await item.deleteOne();
  return res.status(200).json({ message: 'Membership option deleted' });
}

export async function listMemberships(req, res) {
  const { status, memberEmail, paymentStatus } = req.query;
  const query = {};
  if (status) query.status = status;
  if (memberEmail) query.memberEmail = memberEmail.toLowerCase();
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const items = await Membership.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function getMembership(req, res) {
  const item = await Membership.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Membership not found' });
  return res.status(200).json({ item });
}

export async function createMembership(req, res) {
  const payload = normalizePayload(req.body);
  const error = validatePayload(payload);
  if (error) return res.status(400).json({ message: error });

  const item = await Membership.create(payload);
  return res.status(201).json({ item });
}

export async function updateMembership(req, res) {
  const payload = normalizePayload(req.body, { partial: true });
  const error = validatePayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await Membership.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });
  if (!item) return res.status(404).json({ message: 'Membership not found' });
  return res.status(200).json({ item });
}

export async function deleteMembership(req, res) {
  const item = await Membership.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Membership not found' });
  return res.status(200).json({ message: 'Membership deleted' });
}
