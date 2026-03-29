import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    operation: { type: String, enum: ['set', 'increase', 'decrease'], required: true },
    reason: { type: String, default: 'manual_update' },
    changedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
