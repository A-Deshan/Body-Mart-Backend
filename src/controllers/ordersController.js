import { Order } from '../models/Order.js';

function generateOrderNumber() {
  return `BM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizePayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.orderNumber !== undefined) out.orderNumber = payload.orderNumber?.trim();
  if (!partial || payload.userId !== undefined) out.userId = payload.userId || null;
  if (!partial || payload.items !== undefined) out.items = Array.isArray(payload.items) ? payload.items : [];
  if (!partial || payload.subtotal !== undefined) out.subtotal = Number(payload.subtotal);
  if (!partial || payload.deliveryFee !== undefined) out.deliveryFee = Number(payload.deliveryFee || 0);
  if (!partial || payload.totalAmount !== undefined) out.totalAmount = Number(payload.totalAmount);
  if (!partial || payload.paymentMethod !== undefined) out.paymentMethod = payload.paymentMethod;
  if (!partial || payload.paymentStatus !== undefined) out.paymentStatus = payload.paymentStatus;
  if (!partial || payload.orderStatus !== undefined) out.orderStatus = payload.orderStatus;
  return out;
}

function validatePayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.totalAmount || payload.totalAmount < 0)) {
    return 'totalAmount is required and must be non-negative';
  }

  if (payload.subtotal !== undefined && (!Number.isFinite(payload.subtotal) || payload.subtotal < 0)) {
    return 'subtotal must be non-negative';
  }

  if (payload.totalAmount !== undefined && (!Number.isFinite(payload.totalAmount) || payload.totalAmount < 0)) {
    return 'totalAmount must be non-negative';
  }

  if (payload.deliveryFee !== undefined && (!Number.isFinite(payload.deliveryFee) || payload.deliveryFee < 0)) {
    return 'deliveryFee must be non-negative';
  }

  if (payload.items && payload.items.some((item) => !item.name || Number(item.quantity) <= 0)) {
    return 'Each item must include name and quantity > 0';
  }

  return null;
}

export async function listOrders(req, res) {
  const { orderStatus, paymentMethod, paymentStatus, fromDate, toDate } = req.query;
  const query = {};

  if (orderStatus) query.orderStatus = orderStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const items = await Order.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function getOrder(req, res) {
  const item = await Order.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ item });
}

export async function createOrder(req, res) {
  const payload = normalizePayload(req.body);
  payload.orderNumber = payload.orderNumber || generateOrderNumber();

  const error = validatePayload(payload);
  if (error) return res.status(400).json({ message: error });

  const duplicate = await Order.findOne({ orderNumber: payload.orderNumber });
  if (duplicate) return res.status(409).json({ message: 'Duplicate orderNumber' });

  const item = await Order.create(payload);
  return res.status(201).json({ item });
}

export async function updateOrder(req, res) {
  const payload = normalizePayload(req.body, { partial: true });
  const error = validatePayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await Order.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ item });
}

export async function updateOrderStatus(req, res) {
  const { orderStatus } = req.body;
  const item = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true, runValidators: true }
  );

  if (!item) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ item });
}

export async function deleteOrder(req, res) {
  const item = await Order.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Order not found' });
  return res.status(200).json({ message: 'Order deleted' });
}
