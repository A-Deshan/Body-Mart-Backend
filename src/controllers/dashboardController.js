import { Membership } from '../models/Membership.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export async function getOverview(_req, res) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const salesMatch = {
    paymentStatus: 'paid',
    orderStatus: { $ne: 'cancelled' }
  };

  const [totalUsers, totalProducts, lowStockProducts, activeMemberships, pendingOrders, totalSalesAgg, dailyAgg, monthlyAgg] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Membership.countDocuments({
      status: 'active',
      endDate: { $gte: now }
    }),
    Order.countDocuments({
      orderStatus: { $in: ['processing', 'confirmed', 'dispatched', 'out_for_delivery'] }
    }),
    Order.aggregate([{ $match: salesMatch }, { $group: { _id: null, amount: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      { $match: { ...salesMatch, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, amount: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { ...salesMatch, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, amount: { $sum: '$totalAmount' } } }
    ])
  ]);

  return res.status(200).json({
    totalSales: totalSalesAgg[0]?.amount || 0,
    totalUsers,
    totalProducts,
    lowStockProducts,
    activeMemberships,
    pendingOrders,
    revenueSummary: {
      daily: dailyAgg[0]?.amount || 0,
      monthly: monthlyAgg[0]?.amount || 0
    }
  });
}
