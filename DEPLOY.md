Here’s a complete `DEPLOY.md` for your ServiHub Chat project. It outlines clear, production-ready deployment instructions tailored to Render, including PostgreSQL, Redis, environment variables, and build steps.

---

````md
# 🚀 DEPLOY.md – Deployment Instructions for ServiHub Chat

This document outlines the steps to deploy the ServiHub Chat system, a production-ready, real-time messaging service for customer-business interactions.

---

## 🧾 Project Structure

- **Backend**: Fastify server (REST + WebSocket), Prisma ORM, Redis Pub/Sub
- **Frontend**: React widget (Vite), bundled under `/client`
- **Database**: PostgreSQL
- **Cache/PubSub**: Redis
- **CI**: GitHub Actions

---

## 🔧 Deployment Platform

We use [**Render.com**](https://render.com) to host the services.

- **Backend API**: `https://servihub-chat.onrender.com`
- **Frontend Widget**: Served statically by the backend
- **PostgreSQL**: Managed Render PostgreSQL add-on
- **Redis**: Managed Render Redis add-on

---

## 📦 1. Prerequisites

- A [Render](https://render.com) account
- A GitHub repository connected to Render
- Docker is **not required**, but supported if needed

---

## 🛠️ 2. Environment Variables

Create these in your Render backend service **Environment tab**:

| Key              | Description                         |
|------------------|-------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string        |
| `REDIS_URL`      | Redis connection string             |
| `JWT_SECRET`     | Secret key for Fastify JWT plugin   |
| `CORS_ORIGIN`    | Allowed frontend origins (comma-separated, e.g. `https://servihub.app`) |
| `PORT`           | Use `10000` or leave blank (Render auto-assigns) |

---

## 🏗️ 3. Build & Start Commands

**Build Command**  
```bash
cd client && pnpm install && pnpm run build && cd .. && pnpm install && pnpm prisma generate && tsc
````

**Start Command**

```bash
pnpm start
```

---

## 🗃️ 4. Database Setup

In your `Render Dashboard`:

1. Add a PostgreSQL instance.
2. Copy the `DATABASE_URL` and paste into the backend environment settings.
3. Run migrations and seed data:

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

---

## 🚦 5. Redis Setup

1. Add a Redis instance on Render.
2. Copy the `REDIS_URL` into the environment variables.
3. The app will automatically connect and use Redis for:

   * Typing indicators
   * Presence status
   * Multi-node WebSocket sync

---

## 🧪 6. Health Check

Ensure your server returns `200 OK` at:

```
GET https://servihub-chat.onrender.com/health
```

---

## 📦 7. Static Assets

The frontend (React widget) is built into `client/dist` and served by Fastify static plugin.

No separate deployment is needed for the frontend widget.

---

## 🧪 8. Tests (Optional)

To run backend tests locally:

```bash
pnpm install
pnpm test
```

---

## ✅ Final Checklist

* [x] PostgreSQL connected and seeded
* [x] Redis connected
* [x] JWT secret configured
* [x] WebSocket endpoint functional: `wss://servihub-chat.onrender.com/ws?...`
* [x] `/health` returns OK
* [x] Frontend widget loads correctly

---

## 🌐 Demo URLs

* **Backend**: [https://servihub-chat.onrender.com](https://servihub-chat.onrender.com)
* **Frontend widget**: Served via same domain

---


