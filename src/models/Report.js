import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['sales', 'inventory', 'memberships', 'users'],
      required: true
    },
    fromDate: { type: Date, default: null },
    toDate: { type: Date, default: null },
    format: { type: String, enum: ['csv', 'pdf'], default: 'csv' },
    requestedAt: { type: Date, default: Date.now },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);
