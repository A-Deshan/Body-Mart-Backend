import { InventoryHistory } from '../models/InventoryHistory.js';
import { Product } from '../models/Product.js';

function calculateStock(previousStock, quantity, operation) {
  if (operation === 'increase') return previousStock + quantity;
  if (operation === 'decrease') return previousStock - quantity;
  return quantity;
}

export async function listInventory(req, res) {
  const { lowStockOnly } = req.query;
  const items = await Product.find().sort({ updatedAt: -1 });

  const mapped = items.map((item) => ({
    productId: item._id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    lowStockThreshold: item.lowStockThreshold,
    lowStock: item.stock <= item.lowStockThreshold
  }));

  const filtered = lowStockOnly === 'true' ? mapped.filter((x) => x.lowStock) : mapped;

  return res.status(200).json({ items: filtered });
}

export async function updateStock(req, res) {
  const { productId } = req.params;
  const { quantity, operation = 'set', reason = 'manual_update' } = req.body;
  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number' });
  }

  if (!['set', 'increase', 'decrease'].includes(operation)) {
    return res.status(400).json({ message: 'Operation must be set, increase, or decrease' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const previousStock = product.stock;
  const newStock = calculateStock(previousStock, parsedQuantity, operation);

  if (newStock < 0) {
    return res.status(400).json({ message: 'Stock must not be negative' });
  }

  product.stock = newStock;
  await product.save();

  await InventoryHistory.create({
    productId: product._id,
    previousStock,
    newStock,
    operation,
    reason,
    changedBy: req.auth.sub
  });

  return res.status(200).json({
    item: {
      productId: product._id,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      lowStock: product.stock <= product.lowStockThreshold
    }
  });
}

export async function getStockHistory(req, res) {
  const { productId } = req.query;
  const query = productId ? { productId } : {};

  const items = await InventoryHistory.find(query)
    .populate('productId', 'name category')
    .sort({ createdAt: -1 })
    .limit(200);

  return res.status(200).json({ items });
}
