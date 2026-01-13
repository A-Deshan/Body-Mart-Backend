# Body Mart Backend

Production-ready Node.js + Express + MongoDB backend with layered architecture.

## Tech Stack

- Node.js (LTS)
- Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt
- Swagger (OpenAPI)

## Folder Structure

```
src/
├── Client/
├── config/
├── daos/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
└── index.js
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` in the project root:
   ```
   NODE_ENV=development
   PORT=4000
   MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/dbname
   JWT_SECRET=change-this-secret
   JWT_EXPIRES_IN=1h
   ```

3. Start server:
   ```
   npm start
   ```

## Endpoints

- Health: `GET /health`
- Swagger: `GET /api/docs`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Users: `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id`
- Products: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PATCH /api/products/:id`, `DELETE /api/products/:id`
- Orders: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`
- Memberships: `POST /api/memberships`, `GET /api/memberships`, `GET /api/memberships/:id`, `PATCH /api/memberships/:id`

## Notes

- Use `Authorization: Bearer <token>` for protected routes.
- Admin-only endpoints enforce role-based access.
