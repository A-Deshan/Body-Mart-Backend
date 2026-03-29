import { Membership } from '../models/Membership.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import {
  calculateMembershipEndDate,
  findMembershipPlan,
  listMembershipPlans as getMembershipPlans
} from '../utils/membershipPlans.js';

function generateOrderNumber() {
  return `BM-WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function generateMembershipPaymentReference() {
  return `BM-MEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizeCardDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export async function listStoreProducts(req, res) {
  const { category, q, limit = 8 } = req.query;
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 8, 40));

  const query = { isVisible: true };
  if (category) query.category = category;
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  const items = await Product.find(query).sort({ createdAt: -1 }).limit(parsedLimit);
  return res.status(200).json({ items });
}

export async function getStoreHighlights(_req, res) {
  const trending = await Order.aggregate([
    { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.name' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
      }
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 6 }
  ]);

  return res.status(200).json({ items: trending });
}

export async function listStoreMembershipPlans(_req, res) {
  const items = await getMembershipPlans({ activeOnly: true });
  return res.status(200).json({ items });
}

export async function purchaseMembership(req, res) {
  const { planKey, billingPhone, cardholderName, cardNumber, expiryMonth, expiryYear, cvv } = req.body;

  if (!planKey || !billingPhone || !cardholderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
    return res.status(400).json({
      message: 'planKey, billingPhone, cardholderName, cardNumber, expiryMonth, expiryYear, and cvv are required'
    });
  }

  const plan = await findMembershipPlan(planKey, { activeOnly: true });
  if (!plan) {
    return res.status(400).json({ message: 'Selected membership plan is invalid' });
  }

  const normalizedCardNumber = normalizeCardDigits(cardNumber);
  const normalizedCvv = String(cvv || '').trim();
  const normalizedExpiryMonth = Number(expiryMonth);
  const normalizedExpiryYear = Number(expiryYear);

  if (normalizedCardNumber.length < 12 || normalizedCardNumber.length > 19) {
    return res.status(400).json({ message: 'Card number must contain 12 to 19 digits' });
  }

  if (normalizedCvv.length < 3 || normalizedCvv.length > 4) {
    return res.status(400).json({ message: 'CVV must contain 3 or 4 digits' });
  }

  if (!Number.isInteger(normalizedExpiryMonth) || normalizedExpiryMonth < 1 || normalizedExpiryMonth > 12) {
    return res.status(400).json({ message: 'Expiry month must be between 1 and 12' });
  }

  if (!Number.isInteger(normalizedExpiryYear) || normalizedExpiryYear < new Date().getFullYear()) {
    return res.status(400).json({ message: 'Expiry year must be valid' });
  }

  const user = await User.findById(req.auth.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid or inactive user account' });
  }

  const paidAt = new Date();
  const endDate = calculateMembershipEndDate(paidAt, plan.durationMonths);

  const item = await Membership.create({
    userId: user._id,
    memberName: user.name,
    memberEmail: user.email,
    membershipCategory: plan.category,
    planName: plan.name,
    price: plan.price,
    status: 'active',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    paymentReference: generateMembershipPaymentReference(),
    billingPhone: billingPhone.trim(),
    cardLast4: normalizedCardNumber.slice(-4),
    paidAt,
    startDate: paidAt,
    endDate,
    renewalStatus: 'on_time'
  });

  return res.status(201).json({ item });
}

export async function createMembershipRequest(req, res) {
  const { memberName, memberEmail, planName } = req.body;

  if (!memberName || !memberEmail || !planName) {
    return res.status(400).json({ message: 'memberName, memberEmail, and planName are required' });
  }

  const plan = await findMembershipPlan(planName, { activeOnly: true });
  if (!plan) {
    return res.status(400).json({ message: 'Selected membership plan is invalid' });
  }

  const startDate = new Date();
  const endDate = calculateMembershipEndDate(startDate, plan.durationMonths);

  const item = await Membership.create({
    memberName: memberName.trim(),
    memberEmail: memberEmail.trim().toLowerCase(),
    membershipCategory: plan.category,
    planName: plan.name,
    price: plan.price,
    status: 'pending',
    paymentMethod: 'card',
    paymentStatus: 'pending',
    startDate,
    endDate,
    renewalStatus: 'not_renewed'
  });

  return res.status(201).json({ item });
}

export async function createStoreOrder(req, res) {
  const {
    items,
    paymentMethod = 'card',
    paymentReference = '',
    contactPhone = '',
    orderNote = '',
    cardholderName = '',
    cardNumber = '',
    expiryMonth = '',
    expiryYear = '',
    cvv = ''
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items are required' });
  }

  if (items.some((item) => !item?.name || Number(item?.quantity) <= 0 || Number(item?.unitPrice) < 0)) {
    return res.status(400).json({ message: 'Each item must include name, quantity > 0, and unitPrice >= 0' });
  }

  const normalizedItems = items.map((item) => ({
    productId: item.productId || null,
    name: item.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice)
  }));

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const deliveryFee = subtotal >= 100 ? 0 : 5.99;
  const totalAmount = subtotal + deliveryFee;
  const normalizedPaymentMethod = String(paymentMethod || '').trim();
  const normalizedContactPhone = String(contactPhone || '').trim();
  const normalizedPaymentReference = String(paymentReference || '').trim();
  const normalizedOrderNote = String(orderNote || '').trim();
  let normalizedCardLast4 = '';
  let paymentStatus = 'pending';

  if (!['card', 'cash', 'bank_transfer'].includes(normalizedPaymentMethod)) {
    return res.status(400).json({ message: 'Select a valid payment method' });
  }

  if (!normalizedContactPhone) {
    return res.status(400).json({ message: 'Contact phone is required' });
  }

  if (normalizedPaymentMethod === 'card') {
    if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({
        message: 'cardholderName, cardNumber, expiryMonth, expiryYear, and cvv are required for card payments'
      });
    }

    const normalizedCardNumber = normalizeCardDigits(cardNumber);
    const normalizedCvv = String(cvv || '').trim();
    const normalizedExpiryMonth = Number(expiryMonth);
    const normalizedExpiryYear = Number(expiryYear);

    if (normalizedCardNumber.length < 12 || normalizedCardNumber.length > 19) {
      return res.status(400).json({ message: 'Card number must contain 12 to 19 digits' });
    }

    if (normalizedCvv.length < 3 || normalizedCvv.length > 4) {
      return res.status(400).json({ message: 'CVV must contain 3 or 4 digits' });
    }

    if (!Number.isInteger(normalizedExpiryMonth) || normalizedExpiryMonth < 1 || normalizedExpiryMonth > 12) {
      return res.status(400).json({ message: 'Expiry month must be between 1 and 12' });
    }

    if (!Number.isInteger(normalizedExpiryYear) || normalizedExpiryYear < new Date().getFullYear()) {
      return res.status(400).json({ message: 'Expiry year must be valid' });
    }

    normalizedCardLast4 = normalizedCardNumber.slice(-4);
    paymentStatus = 'paid';
  }

  if (normalizedPaymentMethod === 'bank_transfer' && !normalizedPaymentReference) {
    return res.status(400).json({ message: 'Transfer reference is required for bank transactions' });
  }

  const user = await User.findById(req.auth.sub);

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid or inactive user account' });
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId: user._id,
    items: normalizedItems,
    subtotal,
    deliveryFee,
    totalAmount,
    paymentMethod: normalizedPaymentMethod,
    paymentStatus,
    paymentReference: normalizedPaymentReference,
    cardLast4: normalizedCardLast4,
    contactPhone: normalizedContactPhone,
    orderNote: normalizedOrderNote,
    orderStatus: 'processing'
  });

  return res.status(201).json({ item: order });
}
