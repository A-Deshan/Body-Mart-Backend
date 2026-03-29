import { Product } from '../models/Product.js';

const MAX_IMAGE_DATA_LENGTH = 5_000_000;

function normalizeProductPayload(payload, { partial = false } = {}) {
  const out = {};

  if (!partial || payload.name !== undefined) out.name = payload.name?.trim();
  if (!partial || payload.category !== undefined) out.category = payload.category?.trim();
  if (!partial || payload.description !== undefined) out.description = payload.description || '';
  if (!partial || payload.imageUrl !== undefined) out.imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl : '';
  if (!partial || payload.price !== undefined) out.price = Number(payload.price);
  if (!partial || payload.stock !== undefined) out.stock = Number(payload.stock);
  if (!partial || payload.lowStockThreshold !== undefined) {
    out.lowStockThreshold = Number(payload.lowStockThreshold);
  }
  if (!partial || payload.isVisible !== undefined) out.isVisible = Boolean(payload.isVisible);

  return out;
}

function validateProductPayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.name || !payload.category)) {
    return 'Name and category are required';
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price <= 0)) {
    return 'Price must be a positive number';
  }

  if (payload.stock !== undefined && (!Number.isFinite(payload.stock) || payload.stock < 0)) {
    return 'Stock must not be negative';
  }

  if (
    payload.lowStockThreshold !== undefined &&
    (!Number.isFinite(payload.lowStockThreshold) || payload.lowStockThreshold < 0)
  ) {
    return 'Low stock threshold must not be negative';
  }

  if (payload.imageUrl !== undefined && payload.imageUrl.length > MAX_IMAGE_DATA_LENGTH) {
    return 'Image is too large to save. Please upload a smaller image.';
  }

  return null;
}

export async function listProducts(req, res) {
  const { q, category, isVisible } = req.query;
  const query = {};

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (isVisible !== undefined) query.isVisible = isVisible === 'true';

  const items = await Product.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function getProduct(req, res) {
  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.status(200).json({ item });
}

export async function createProduct(req, res) {
  const payload = normalizeProductPayload(req.body);
  const error = validateProductPayload(payload);
  if (error) return res.status(400).json({ message: error });

  const item = await Product.create(payload);
  return res.status(201).json({ item });
}

export async function updateProduct(req, res) {
  const payload = normalizeProductPayload(req.body, { partial: true });
  const error = validateProductPayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.status(200).json({ item });
}

export async function deleteProduct(req, res) {
  const item = await Product.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.status(200).json({ message: 'Product deleted' });
}
