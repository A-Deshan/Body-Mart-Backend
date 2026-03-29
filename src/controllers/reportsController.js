import { Delivery } from '../models/Delivery.js';
import { Membership } from '../models/Membership.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';

function normalizePayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.reportType !== undefined) out.reportType = payload.reportType;
  if (!partial || payload.fromDate !== undefined) out.fromDate = payload.fromDate || null;
  if (!partial || payload.toDate !== undefined) out.toDate = payload.toDate || null;
  if (!partial || payload.format !== undefined) out.format = payload.format || 'csv';
  if (!partial || payload.requestedAt !== undefined) out.requestedAt = payload.requestedAt || new Date().toISOString();
  return out;
}

function validatePayload(payload, { partial = false } = {}) {
  if (!partial && !payload.reportType) {
    return 'reportType is required';
  }

  if (
    payload.reportType !== undefined &&
    !['sales', 'inventory', 'memberships', 'users'].includes(payload.reportType)
  ) {
    return 'Invalid reportType';
  }

  if (payload.format !== undefined && !['csv', 'pdf'].includes(payload.format)) {
    return 'Invalid format';
  }

  if (payload.fromDate && Number.isNaN(new Date(payload.fromDate).getTime())) {
    return 'fromDate must be a valid date';
  }

  if (payload.toDate && Number.isNaN(new Date(payload.toDate).getTime())) {
    return 'toDate must be a valid date';
  }

  return null;
}

function parseDateRange(query) {
  const range = {};

  if (query.fromDate) {
    const from = new Date(query.fromDate);
    if (Number.isNaN(from.getTime())) {
      throw new Error('Invalid fromDate');
    }
    range.$gte = from;
  }

  if (query.toDate) {
    const to = new Date(query.toDate);
    if (Number.isNaN(to.getTime())) {
      throw new Error('Invalid toDate');
    }
    range.$lte = to;
  }

  return Object.keys(range).length ? range : null;
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export async function listReports(req, res) {
  const { reportType, format } = req.query;
  const query = {};
  if (reportType) query.reportType = reportType;
  if (format) query.format = format;

  const items = await Report.find(query).sort({ createdAt: -1 }).limit(500);
  return res.status(200).json({ items });
}

export async function getReport(req, res) {
  const item = await Report.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Report not found' });
  return res.status(200).json({ item });
}

export async function createReport(req, res) {
  const payload = normalizePayload(req.body);
  const error = validatePayload(payload);
  if (error) return res.status(400).json({ message: error });

  const item = await Report.create({
    ...payload,
    requestedBy: req.auth?.sub || null
  });

  return res.status(201).json({ item });
}

export async function updateReport(req, res) {
  const payload = normalizePayload(req.body, { partial: true });
  const error = validatePayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const item = await Report.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) return res.status(404).json({ message: 'Report not found' });
  return res.status(200).json({ item });
}

export async function deleteReport(req, res) {
  const item = await Report.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Report not found' });
  return res.status(200).json({ message: 'Report deleted' });
}

export async function getAnalyticsSummary(req, res) {
  try {
    const createdAtRange = parseDateRange(req.query);
    const salesMatch = {
      paymentStatus: 'paid',
      orderStatus: { $ne: 'cancelled' }
    };

    if (createdAtRange) {
      salesMatch.createdAt = createdAtRange;
    }

    const now = new Date();
    const [ordersCount, paidOrders, pendingOrders, salesAgg, membershipRevenueAgg, newUsers, activeMemberships, lowStockProducts, deliveredCount] = await Promise.all([
      Order.countDocuments(createdAtRange ? { createdAt: createdAtRange } : {}),
      Order.countDocuments({ ...salesMatch }),
      Order.countDocuments({ orderStatus: { $in: ['processing', 'confirmed', 'dispatched', 'out_for_delivery'] } }),
      Order.aggregate([{ $match: salesMatch }, { $group: { _id: null, amount: { $sum: '$totalAmount' } } }]),
      Membership.aggregate([
        {
          $match: createdAtRange ? { createdAt: createdAtRange } : {}
        },
        { $group: { _id: null, amount: { $sum: '$price' } } }
      ]),
      User.countDocuments(createdAtRange ? { createdAt: createdAtRange } : {}),
      Membership.countDocuments({ status: 'active', endDate: { $gte: now } }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Delivery.countDocuments({ status: 'delivered' })
    ]);

    return res.status(200).json({
      ordersCount,
      paidOrders,
      pendingOrders,
      totalSales: salesAgg[0]?.amount || 0,
      membershipRevenue: membershipRevenueAgg[0]?.amount || 0,
      newUsers,
      activeMemberships,
      lowStockProducts,
      deliveredCount
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getRevenueTrend(req, res) {
  try {
    const { groupBy = 'day' } = req.query;
    const createdAtRange = parseDateRange(req.query);
    const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const match = {
      paymentStatus: 'paid',
      orderStatus: { $ne: 'cancelled' }
    };

    if (createdAtRange) {
      match.createdAt = createdAtRange;
    }

    const items = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      items: items.map((x) => ({
        period: x._id,
        totalRevenue: x.totalRevenue,
        orders: x.orders
      }))
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getProductPerformance(req, res) {
  try {
    const createdAtRange = parseDateRange(req.query);
    const limit = Math.min(Number(req.query.limit || 10), 50);

    const match = {
      paymentStatus: 'paid',
      orderStatus: { $ne: 'cancelled' }
    };

    if (createdAtRange) {
      match.createdAt = createdAtRange;
    }

    const items = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantitySold: { $sum: '$items.quantity' },
          revenue: {
            $sum: {
              $multiply: ['$items.quantity', '$items.unitPrice']
            }
          }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);

    return res.status(200).json({
      items: items.map((x) => ({
        productName: x._id,
        quantitySold: x.quantitySold,
        revenue: x.revenue
      }))
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getUserGrowth(req, res) {
  try {
    const { groupBy = 'month' } = req.query;
    const createdAtRange = parseDateRange(req.query);
    const format = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const match = createdAtRange ? { createdAt: createdAtRange } : {};

    const items = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      items: items.map((x) => ({ period: x._id, users: x.users }))
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function exportSalesCsv(req, res) {
  try {
    const createdAtRange = parseDateRange(req.query);
    const query = {
      paymentStatus: 'paid',
      orderStatus: { $ne: 'cancelled' }
    };

    if (createdAtRange) {
      query.createdAt = createdAtRange;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(5000);

    const rows = [
      ['Order Number', 'Total Amount', 'Payment Status', 'Order Status', 'Created At'],
      ...orders.map((x) => [x.orderNumber, x.totalAmount, x.paymentStatus, x.orderStatus, x.createdAt.toISOString()])
    ];

    const csv = buildCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function exportInventoryCsv(_req, res) {
  const products = await Product.find().sort({ name: 1 }).limit(5000);

  const rows = [
    ['Name', 'Category', 'Price', 'Stock', 'Low Stock Threshold', 'Visible'],
    ...products.map((x) => [x.name, x.category, x.price, x.stock, x.lowStockThreshold, x.isVisible])
  ];

  const csv = buildCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
  return res.status(200).send(csv);
}
