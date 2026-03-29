import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import deliveriesRoutes from './routes/deliveriesRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import membershipsRoutes from './routes/membershipsRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import workoutPlansRoutes from './routes/workoutPlansRoutes.js';

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const jsonBodyLimit = process.env.JSON_BODY_LIMIT;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  })
);
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/workout-plans', workoutPlansRoutes);
app.use('/api/store', storeRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: `Request payload is too large. Keep uploaded product images under ${jsonBodyLimit}.`
    });
  }

  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

export default app;
