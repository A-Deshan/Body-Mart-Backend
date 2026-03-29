import { Delivery } from '../models/Delivery.js';

function normalizePayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.orderId !== undefined) out.orderId = payload.orderId || null;
  if (!partial || payload.orderNumber !== undefined) out.orderNumber = payload.orderNumber?.trim();
  if (!partial || payload.customerName !== undefined) out.customerName = payload.customerName?.trim();
  if (!partial || payload.assignedTo !== undefined) out.assignedTo = payload.assignedTo?.trim();
  if (!partial || payload.status !== undefined) out.status = payload.status;
  if (!partial || payload.notes !== undefined) out.notes = payload.notes || '';
  return out;
}

function validatePayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.orderNumber || !payload.customerName || !payload.assignedTo)) {
    return 'orderNumber, customerName, and assignedTo are required';
  }

  if (
    payload.status !== undefined &&
    !['dispatched', 'out_for_delivery', 'delivered'].includes(payload.status)
  ) {
    return 'Invalid delivery status';
  }

  return null;
}

export async function listDeliveries(req, res) {
  const { status, assignedTo } = req.query;
  const query = {};
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = { $regex: assignedTo, $options: 'i' };

  const items = await Delivery.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function getDelivery(req, res) {
  const item = await Delivery.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Delivery not found' });
  return res.status(200).json({ item });
}

export async function createDelivery(req, res) {
  const payload = normalizePayload(req.body);
  const error = validatePayload(payload);
  if (error) return res.status(400).json({ message: error });

  const item = await Delivery.create(payload);
  return res.status(201).json({ item });
}

export async function updateDelivery(req, res) {
  const payload = normalizePayload(req.body, { partial: true });
  const error = validatePayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await Delivery.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) return res.status(404).json({ message: 'Delivery not found' });
  return res.status(200).json({ item });
}

export async function deleteDelivery(req, res) {
  const item = await Delivery.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Delivery not found' });
  return res.status(200).json({ message: 'Delivery deleted' });
}
