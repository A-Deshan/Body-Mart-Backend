import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'bank_transfer', 'other'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentReference: { type: String, trim: true, default: '' },
    cardLast4: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    orderNote: { type: String, trim: true, default: '' },
    orderStatus: {
      type: String,
      enum: ['processing', 'confirmed', 'cancelled', 'dispatched', 'out_for_delivery', 'delivered'],
      default: 'processing'
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
