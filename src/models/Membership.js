import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    memberName: { type: String, required: true, trim: true },
    memberEmail: { type: String, required: true, trim: true, lowercase: true },
    membershipCategory: { type: String, required: true, trim: true },
    planName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active'
    },
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
    billingPhone: { type: String, trim: true, default: '' },
    cardLast4: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    renewalStatus: {
      type: String,
      enum: ['on_time', 'late', 'not_renewed'],
      default: 'on_time'
    }
  },
  { timestamps: true }
);

export const Membership = mongoose.model('Membership', membershipSchema);
