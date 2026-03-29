import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    assignedTo: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['dispatched', 'out_for_delivery', 'delivered'],
      default: 'dispatched'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Delivery = mongoose.model('Delivery', deliverySchema);
