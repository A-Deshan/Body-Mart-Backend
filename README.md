# BodyMart Admin Backend

Express and MongoDB backend for the BodyMart admin dashboard and public store flows. It provides authentication, role-based admin APIs, reporting endpoints, inventory and order management, and a small public-facing store API.

## Features

- JWT-based authentication
- Role-based access control for admins, stock managers, and delivery personnel
- CRUD APIs for products, users, memberships, orders, deliveries, and reports
- Dashboard and analytics endpoints
- Public store endpoints for browsing products and placing orders
- MongoDB persistence with Mongoose models

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- bcrypt

## Project Structure

```text
src/
  config/        Environment and database setup
  controllers/   Request handlers
  middleware/    Auth and role guards
  models/        Mongoose models
  routes/        API route definitions
  scripts/       Utility scripts such as admin seeding
  services/      Auth business logic
```

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/bodymart_admin
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Start MongoDB and make sure `MONGO_URI` points to your database.

4. Optional: seed the default admin user:

```bash
npm run seed:admin
```

Default seeded credentials:

- Email: `admin@bodymart.com`
- Password: `Admin@12345`

5. Start the development server:

```bash
npm run dev
```

The server starts on `http://localhost:4000` by default.

## Available Scripts

- `npm run dev` starts the server with file watching
- `npm start` starts the server normally
- `npm run seed:admin` creates the default admin account if it does not already exist

## API Base URL

All routes are served under:

```text
/api
```

Health check:

```http
GET /api/health
```

## Authentication

Protected routes expect a bearer token:

```http
Authorization: Bearer <jwt-token>
```

Available roles:

- `admin`
- `stock_manager`
- `delivery_personnel`

## Route Overview

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard/overview`

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Access: `admin`, `stock_manager`

### Inventory

- `GET /api/inventory`
- `GET /api/inventory/history`
- `PATCH /api/inventory/:productId`

Access: `admin`, `stock_manager`

### Users

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/reset-password`
- `DELETE /api/users/:id`

Access: `admin`

### Memberships

- `GET /api/memberships`
- `GET /api/memberships/:id`
- `POST /api/memberships`
- `PUT /api/memberships/:id`
- `DELETE /api/memberships/:id`

Access: `admin`

### Orders

- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`

Access: `admin`, `stock_manager`

### Deliveries

- `GET /api/deliveries`
- `GET /api/deliveries/:id`
- `POST /api/deliveries`
- `PUT /api/deliveries/:id`
- `DELETE /api/deliveries/:id`

Access: `admin`, `delivery_personnel`

### Reports

- `GET /api/reports/analytics/summary`
- `GET /api/reports/analytics/revenue-trend`
- `GET /api/reports/analytics/product-performance`
- `GET /api/reports/analytics/user-growth`
- `GET /api/reports/export/sales.csv`
- `GET /api/reports/export/inventory.csv`
- `GET /api/reports`
- `GET /api/reports/:id`
- `POST /api/reports`
- `PUT /api/reports/:id`
- `DELETE /api/reports/:id`

Access: `admin`

### Public Store

- `GET /api/store/products`
- `GET /api/store/highlights`
- `POST /api/store/memberships`
- `POST /api/store/orders`

These routes are intended for public storefront use and do not require authentication.

## Notes

- CORS is restricted to the comma-separated origins in `CORS_ORIGIN`
- Passwords are hashed before being stored
- If MongoDB connection fails, the server exits immediately
- There is currently no automated test script defined in `package.json`
